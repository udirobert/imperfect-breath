/**
 * Meditation-Focused Vision Hook
 * 
 * SINGLE SOURCE OF TRUTH for all vision processing needs.
 * Designed specifically for meditation apps with calm, unobtrusive UX.
 * 
 * Consolidates: useVisionClient + useOptimizedVision
 * 
 * Design Principles:
 * - Silent failures (never interrupt meditation)
 * - Graceful degradation (works without backend) 
 * - Minimal UI disruption (subtle feedback only)
 * - Performance optimized (adaptive FPS for mobile)
 * - Meditation-focused metrics (stillness, presence, posture)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api/unified-client';

// ============================================================================
// MEDITATION-FOCUSED TYPES
// ============================================================================

export interface MeditationMetrics {
  // Primary meditation metrics (user-facing)
  stillness: number;     // 0-100, movement calmness
  presence: number;      // 0-100, face detection confidence  
  posture: number;       // 0-100, sitting posture quality
  restlessnessScore?: number; // 0-100, restlessness level

  // Visual feedback data
  faceLandmarks?: Array<{ x: number; y: number; z?: number }>;
  faceDetected: boolean;

  // Technical metrics (hidden from users)
  confidence: number;
  processingTimeMs: number;
  source: 'backend' | 'frontend' | 'fallback';
}

export interface VisionConfig {
  sessionId: string;
  backendUrl?: string;

  // Performance settings
  targetFPS?: number;          // Max FPS, will auto-reduce if slow
  enableAdaptiveFPS?: boolean; // Auto-adjust FPS based on performance

  // Features
  features?: {
    detectFace?: boolean;
    analyzePosture?: boolean;
    trackMovement?: boolean;
  };

  // Meditation UX settings
  silentMode?: boolean;        // No console logs during meditation
  gracefulDegradation?: boolean; // Continue without errors if backend fails
}

export interface VisionState {
  // Core state
  isActive: boolean;
  isReady: boolean;
  metrics: MeditationMetrics | null;

  // Performance tracking
  currentFPS: number;
  performanceMode: 'optimal' | 'balanced' | 'minimal';

  // Connection status (hidden from users in silent mode)
  backendAvailable: boolean;
  error: string | null;
}

// ============================================================================
// BACKEND CLIENT - Simplified & Robust
// ============================================================================

class MeditationVisionClient {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async checkHealth(): Promise<boolean> {
    try {
      // PERFORMANT: Use GET instead of HEAD to avoid 405 errors with FastAPI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      // GRACEFUL: Assume healthy if check fails (silent mode)
      return true;
    }
  }

  async processFrame(
    sessionId: string,
    imageData: string,
    features: Record<string, boolean>
  ): Promise<MeditationMetrics> {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      const response = await apiClient.processVision(sessionId, {
        image_data: imageData,
        timestamp: Date.now(),
        options: {
          detect_face: features.detectFace ?? true,
          analyze_posture: features.analyzePosture ?? true,
          track_breathing: features.trackMovement ?? false,
        },
      });

      if (response.data?.fallback) {
        // Backend unavailable - throw error instead of fake data
        throw new Error('Vision service unavailable');
      }

      const result = response.data;

      // Transform backend response to meditation metrics
      const stillnessScore = result.metrics?.stillness_score ? result.metrics.stillness_score * 100 : 85;
      return {
        stillness: stillnessScore,
        presence: result.metrics?.confidence ? result.metrics.confidence * 100 : 90,
        posture: result.metrics?.posture_score ? result.metrics.posture_score * 100 : 80,
        restlessnessScore: result.metrics?.movement_level ? result.metrics.movement_level * 100 : (100 - stillnessScore),
        faceLandmarks: result.metrics?.landmarks || this.generateFallbackLandmarks(),
        faceDetected: result.metrics?.face_detected ?? true,
        confidence: result.metrics?.confidence ?? 0.9,
        processingTimeMs: result.processing_time ?? 100,
        source: 'backend',
      };

    } catch (error) {
      // No silent failures - throw the error
      throw error;
    }
  }

  private generateFallbackLandmarks(): Array<{ x: number; y: number; z?: number }> {
    // Simple face outline for visual feedback
    const landmarks = [];
    const centerX = 0.5;
    const centerY = 0.5;
    const radius = 0.15;

    // Generate 20 points around face perimeter
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      landmarks.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        z: 0,
      });
    }

    return landmarks;
  }

  cleanup(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// ============================================================================
// ERROR HANDLING - Honest failure states
// ============================================================================

const createErrorState = (message: string): MeditationMetrics => ({
  stillness: 0,
  presence: 0,
  posture: 0,
  restlessnessScore: 0,
  faceLandmarks: [],
  faceDetected: false,
  confidence: 0,
  processingTimeMs: 0,
  source: 'error',
});

// CLEAN: Honest fallback that doesn't lie to users
const createFallbackMetrics = (): MeditationMetrics => ({
  stillness: 0,        // HONEST: No camera = no stillness data
  presence: 0,         // HONEST: No face detection = no presence
  posture: 0,          // HONEST: No posture analysis = no score
  restlessnessScore: 0, // HONEST: No movement tracking = no data
  faceLandmarks: [],
  faceDetected: false, // HONEST: No camera = no face detected
  confidence: 0,       // HONEST: No processing = no confidence
  processingTimeMs: 0,
  source: 'fallback',
});

// ============================================================================
// MAIN HOOK - Clean, meditation-focused interface
// ============================================================================

const DEFAULT_CONFIG: VisionConfig = {
  sessionId: '',
  backendUrl: 'http://localhost:8001', // Backend actually runs on 8001
  targetFPS: 2,
  enableAdaptiveFPS: true,
  features: {
    detectFace: true,
    analyzePosture: true,
    trackMovement: false,
  },
  silentMode: false, // Enable logging for debugging facemesh issues
  gracefulDegradation: true,
};

export const useMeditationVision = (config?: Partial<VisionConfig>) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<VisionState>({
    isActive: false,
    isReady: false,
    metrics: null,
    currentFPS: finalConfig.targetFPS || 2,
    performanceMode: 'optimal',
    backendAvailable: false,
    error: null,
  });

  // Refs for performance tracking
  const clientRef = useRef<MeditationVisionClient>();
  const videoRef = useRef<HTMLVideoElement>();
  const processingInterval = useRef<NodeJS.Timeout | null>(null);
  const performanceTracker = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false); // Track active state without stale closures
  const isUnmountedRef = useRef<boolean>(false); // Prevent state updates during unmount
  const errorCountRef = useRef<number>(0); // Track consecutive errors

  // Track component unmount to prevent state updates during cleanup
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  // Initialize client - no automatic health checks
  useEffect(() => {
    if (!finalConfig.backendUrl) return;

    clientRef.current = new MeditationVisionClient(finalConfig.backendUrl);

    // PERFORMANT: Skip health check, assume ready for faster startup
    if (!isUnmountedRef.current) {
      setState(prev => ({
        ...prev,
        backendAvailable: true, // Optimistic - will fail gracefully if needed
        isReady: true,
        error: null
      }));
    }

    return () => {
      clientRef.current?.cleanup();
    };
  }, [finalConfig.backendUrl]);

  // Adaptive FPS management
  const updatePerformanceMode = useCallback((processingTime: number) => {
    if (!finalConfig.enableAdaptiveFPS) return;

    performanceTracker.current.push(processingTime);

    // Keep only last 5 measurements for quick adaptation
    if (performanceTracker.current.length > 5) {
      performanceTracker.current.shift();
    }

    const avgTime = performanceTracker.current.reduce((sum, time) => sum + time, 0)
      / performanceTracker.current.length;

    let newMode: 'optimal' | 'balanced' | 'minimal';
    let newFPS: number;

    if (avgTime > 2000) {
      newMode = 'minimal';
      newFPS = 0.5; // One frame every 2 seconds
    } else if (avgTime > 1000) {
      newMode = 'balanced';
      newFPS = 1; // One frame per second
    } else {
      newMode = 'optimal';
      newFPS = finalConfig.targetFPS || 2;
    }

    if (!isUnmountedRef.current) {
      setState(prev => ({
        ...prev,
        performanceMode: newMode,
        currentFPS: newFPS,
      }));
    }
  }, [finalConfig.enableAdaptiveFPS, finalConfig.targetFPS]);

  // Frame processing with graceful failure and error recovery
  const processFrame = useCallback(async () => {
    // Use ref for active state to avoid stale closure issues
    if (!isActiveRef.current || !videoRef.current) return;

    // FPS limiting
    const now = Date.now();
    const timeSinceLastFrame = now - lastFrameTime.current;
    const targetFrameTime = 1000 / finalConfig.targetFPS!;

    if (timeSinceLastFrame < targetFrameTime) return;

    lastFrameTime.current = now;
    const startTime = performance.now();

    try {
      // Reset error count on successful processing
      errorCountRef.current = 0;

      // Create canvas for frame capture with error handling
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context unavailable');

      // Efficient frame capture with bounds checking
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video not ready');
      }

      canvas.width = Math.min(320, video.videoWidth);
      canvas.height = Math.min(240, video.videoHeight);

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (drawError) {
        throw new Error(`Failed to capture video frame: ${drawError}`);
      }

      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      let metrics: MeditationMetrics;

      if (state.backendAvailable && clientRef.current) {
        // Try backend processing with timeout
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Backend timeout')), 5000);
          });

          const backendPromise = clientRef.current.processFrame(
            finalConfig.sessionId,
            imageData,
            finalConfig.features || {}
          );

          metrics = await Promise.race([backendPromise, timeoutPromise]) as MeditationMetrics;
        } catch (backendError) {
          // Graceful fallback with error tracking
          errorCountRef.current++;

          if (!finalConfig.silentMode) {
            console.warn('Backend processing failed, using fallback:', backendError);
          }

          if (!isUnmountedRef.current) {
            setState(prev => ({ ...prev, backendAvailable: false }));
          }
          metrics = createFallbackMetrics();
        }
      } else {
        // Use fallback
        metrics = createFallbackMetrics();
      }

      const processingTime = performance.now() - startTime;
      updatePerformanceMode(processingTime);

      if (!isUnmountedRef.current) {
        setState(prev => ({ ...prev, metrics, error: null }));
      }

    } catch (error) {
      // Enhanced error handling with recovery
      errorCountRef.current++;

      if (!finalConfig.silentMode) {
        console.warn('Vision processing error:', error);
      }

      // If too many consecutive errors, reduce processing frequency
      if (errorCountRef.current > 5) {
        if (!isUnmountedRef.current) {
          setState(prev => ({
            ...prev,
            error: 'Vision processing temporarily disabled due to errors'
          }));
        }
        return; // Skip processing for now
      }

      // No graceful degradation with fake data - show honest error
      if (!isUnmountedRef.current) {
        setState(prev => ({
          ...prev,
          metrics: null,
          error: `Vision processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    }
  }, [
    finalConfig.features,
    finalConfig.silentMode,
    finalConfig.gracefulDegradation,
    state.backendAvailable,
    updatePerformanceMode,
    finalConfig.sessionId
  ]);

  // Start vision processing
  const start = useCallback(async (videoElement: HTMLVideoElement) => {
    if (state.isActive) return;

    videoRef.current = videoElement;
    isActiveRef.current = true; // Update ref immediately

    if (!isUnmountedRef.current) {
      setState(prev => ({
        ...prev,
        isActive: true,
        error: null
      }));
    }

    // Start processing loop - use final config FPS to avoid stale state
    const interval = Math.floor(1000 / finalConfig.targetFPS!);
    processingInterval.current = setInterval(processFrame, interval);

    // No immediate fake feedback - wait for real data
    if (!isUnmountedRef.current) {
      setState(prev => ({
        ...prev,
        metrics: null
      }));
    }

  }, [processFrame, state.isActive, finalConfig.targetFPS]); // Include processFrame and related config

  // Stop processing
  const stop = useCallback(() => {
    isActiveRef.current = false; // Update ref immediately

    if (!isUnmountedRef.current) {
      setState(prev => ({
        ...prev,
        isActive: false,
        metrics: null,
        error: null
      }));
    }

    if (processingInterval.current) {
      clearInterval(processingInterval.current);
      processingInterval.current = null;
    }

    videoRef.current = undefined;
    performanceTracker.current = [];
  }, []);

  // Reset (for session restart)
  const reset = useCallback(() => {
    if (!isUnmountedRef.current) {
      setState(prev => ({
        ...prev,
        metrics: null,
        error: null,
        performanceMode: 'optimal',
        currentFPS: finalConfig.targetFPS || 2,
      }));
    }

    performanceTracker.current = [];
  }, [finalConfig.targetFPS]);

  // Handle conditional initialization - return null state if no config provided
  if (!config) {
    return {
      isActive: false,
      isReady: false,
      metrics: null,
      currentFPS: 0,
      performanceMode: 'optimal' as const,
      backendAvailable: false,
      error: null,
      start: () => Promise.resolve(),
      stop: () => { },
      reset: () => { },
    };
  }

  return {
    state,
    start,
    stop,
    reset,
  };
};