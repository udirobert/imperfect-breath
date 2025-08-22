/**
 * Legacy Vision Client Hook - DEPRECATED
 * 
 * This hook is deprecated in favor of useMeditationVision.
 * Maintained for backward compatibility only.
 * 
 * @deprecated Use useMeditationVision instead for better performance and DRY compliance
 */

import { useCallback } from 'react';
import { useMeditationVision, MeditationMetrics } from './useMeditationVision';

// Legacy configuration interface
export interface VisionConfig {
  backendUrl?: string;
  sessionId: string;
  targetFPS?: number;
  features?: {
    detectFace?: boolean;
    analyzePosture?: boolean;
    trackBreathing?: boolean;
  };
  // Deprecated options
  enableBackend?: boolean;
  enableFrontendFallback?: boolean;
}

// Legacy interface for backward compatibility
export interface VisionMetrics {
  // Meditation metrics
  stillness?: number;
  presence?: number;
  posture?: number;
  
  // Legacy properties (mapped from meditation metrics)
  postureScore: number; // Maps to posture
  movementLevel: number; // Maps to (100 - stillness)
  confidence: number;
  faceDetected: boolean;
  processingTimeMs: number;
  source: 'backend' | 'frontend' | 'none';
  faceLandmarks?: Array<{ x: number; y: number; z?: number }>;
  
  // Optional legacy properties
  breathingRate?: number;
  restlessnessScore?: number;
}

export interface VisionState {
  isActive: boolean;
  isProcessing: boolean;
  metrics: VisionMetrics | null;
  mode: 'backend' | 'frontend' | 'disabled';
  error: string | null;
  backendHealthy: boolean;
}

export const useVisionClient = (config: Partial<VisionConfig> = {}): {
  state: VisionState;
  start: (videoElement: HTMLVideoElement) => Promise<void>;
  stop: () => void;
  reset: () => void;
  // Legacy methods for backward compatibility
  startProcessing: (videoElement: HTMLVideoElement) => Promise<void>;
  stopProcessing: () => void;
  retryConnection: () => void;
  disable: () => void;
} => {
  // Use the new consolidated meditation vision hook
  const meditationVision = useMeditationVision({
    sessionId: config.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    backendUrl: config.backendUrl,
    targetFPS: config.targetFPS || 2,
    features: config.features,
    silentMode: false, // Keep logs for backward compatibility
    gracefulDegradation: true,
  });

  // Transform meditation metrics to legacy VisionMetrics format
  const transformMetrics = useCallback((meditationMetrics: MeditationMetrics | null): VisionMetrics | null => {
    if (!meditationMetrics) return null;
    
    return {
      // Map meditation metrics to legacy format
      stillness: meditationMetrics.stillness,
      presence: meditationMetrics.presence, 
      posture: meditationMetrics.posture,
      
      // Legacy required properties
      postureScore: meditationMetrics.posture / 100,
      movementLevel: (100 - meditationMetrics.stillness) / 100,
      confidence: meditationMetrics.confidence,
      faceDetected: meditationMetrics.faceDetected,
      processingTimeMs: meditationMetrics.processingTimeMs,
      source: meditationMetrics.source as 'backend' | 'frontend' | 'none',
      faceLandmarks: meditationMetrics.faceLandmarks,
      
      // Calculate legacy metrics
      restlessnessScore: (100 - meditationMetrics.stillness) / 100,
    };
  }, []);

  // Create legacy state format
  const legacyState: VisionState = {
    isActive: meditationVision.state.isActive,
    isProcessing: meditationVision.state.isActive, // For compatibility
    metrics: transformMetrics(meditationVision.state.metrics),
    mode: meditationVision.state.backendAvailable ? 'backend' : 'frontend',
    error: meditationVision.state.error,
    backendHealthy: meditationVision.state.backendAvailable,
  };

  // Legacy method implementations
  const retryConnection = useCallback(async () => {
    // The new hook handles reconnection automatically
    console.warn('retryConnection is deprecated - the new hook handles reconnection automatically');
  }, []);

  const disable = useCallback(() => {
    meditationVision.stop();
  }, [meditationVision]);

  return {
    state: legacyState,
    // New clean methods
    start: meditationVision.start,
    stop: meditationVision.stop,
    reset: meditationVision.reset,
    // Legacy methods for backward compatibility
    startProcessing: meditationVision.start,
    stopProcessing: meditationVision.stop,
    retryConnection,
    disable,
  };
};
