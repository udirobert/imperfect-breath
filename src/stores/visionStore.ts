/**
 * Unified Vision State Store
 *
 * SINGLE SOURCE OF TRUTH for all vision processing state management.
 * Consolidates useMeditationVision functionality into Zustand for consistency.
 *
 * Features:
 * - FaceMesh landmark detection and processing
 * - Meditation-focused metrics (stillness, presence, posture)
 * - Restlessness score calculation
 * - Adaptive performance management
 * - Backend integration with graceful fallback
 * - Error handling and recovery
 * - State persistence for session continuity
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { MeditationMetrics, VisionStatus, PerformanceMode, MetricTrend } from '../types/metrics';

// ============================================================================
// VISION-SPECIFIC TYPES - Vision store specific interfaces
// ============================================================================

export interface VisionConfig {
    sessionId: string;
    backendUrl?: string;

    // Performance settings
    targetFPS?: number;
    enableAdaptiveFPS?: boolean;

    // Features
    features?: {
        detectFace?: boolean;
        analyzePosture?: boolean;
        trackMovement?: boolean;
    };

    // Meditation UX settings
    silentMode?: boolean;
    gracefulDegradation?: boolean;
}

// VisionStatus now imported from types/metrics.ts

export interface VisionState {
    // Core state
    status: VisionStatus;
    isActive: boolean;
    isReady: boolean;
    metrics: MeditationMetrics | null;

    // Configuration
    config: VisionConfig | null;

    // Performance tracking
    currentFPS: number;
    performanceMode: PerformanceMode;

    // Connection status
    backendAvailable: boolean;
    error: string | null;

    // Session continuity
    lastMetrics: MeditationMetrics | null;
    sessionStartTime: number | null;
    totalProcessingTime: number;
    frameCount: number;

    // ENHANCEMENT FIRST: Smooth UI transitions
    smoothedMetrics: MeditationMetrics | null;
    metricHistory: MeditationMetrics[];
    detectionHistory: boolean[]; // For face detection stability
    
    // LUXURY: Persistence state for stable UI display
    persistentDisplay: {
        lastValidMetrics: MeditationMetrics | null;
        displayStartTime: number | null;
        lastValidTime: number | null;
        shouldPersist: boolean;
        confidenceStreak: number; // Track consecutive confident detections
    };
}

export interface VisionActions {
    // Core lifecycle
    initialize: (config: VisionConfig) => Promise<void>;
    start: (videoElement: HTMLVideoElement) => Promise<void>;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;

    // Configuration
    updateConfig: (config: Partial<VisionConfig>) => void;
    setPerformanceMode: (mode: VisionState['performanceMode']) => void;

    // Metrics and processing
    updateMetrics: (metrics: MeditationMetrics) => void;
    clearMetrics: () => void;

    // Error handling
    setError: (error: string | null) => void;
    clearError: () => void;

    // Backend management
    checkBackendHealth: () => Promise<boolean>;
    refreshBackendStatus: () => Promise<void>;

    // Performance management
    updatePerformanceMode: (processingTime: number) => void;

    // Utilities
    getSessionDuration: () => number;
    getAverageProcessingTime: () => number;
    getRestlessnessTrend: () => MetricTrend;
    exportSessionData: () => any;
}

// ============================================================================
// CONSTANTS - Vision configuration with persistence settings
// ============================================================================

const DEFAULT_CONFIG: VisionConfig = {
    sessionId: '',
    backendUrl: 'https://api.imperfectform.fun', // ENHANCEMENT: Use production domain
    targetFPS: 1, // LUXURY: Slower processing for smoother UX
    enableAdaptiveFPS: true,
    features: {
        detectFace: true,
        analyzePosture: true,
        trackMovement: false,
    },
    silentMode: false,
    gracefulDegradation: true,
};

// ENHANCEMENT: Persistence configuration for luxury UX
const PERSISTENCE_CONFIG = {
    minDisplayTime: 2000,        // Minimum 2s display for readability
    fadeOutDelay: 1000,          // 1s delay before fade starts
    stabilityThreshold: 0.7,     // Confidence threshold for showing metrics
    confidenceHysteresis: 0.2,   // Prevent rapid on/off switching
    smoothingAlpha: 0.05,        // Ultra-smooth value transitions
    detectionStabilityFrames: 3, // Frames needed for stable detection
};

const PERFORMANCE_CONSTRAINTS = {
    optimal: { targetFPS: 2, processingTimeout: 5000 },
    balanced: { targetFPS: 1, processingTimeout: 3000 },
    minimal: { targetFPS: 0.5, processingTimeout: 2000 },
};

// ============================================================================
// UTILITY FUNCTIONS - PERFORMANT: Smooth metric transitions for delightful UX
// ============================================================================

// PERFORMANT: Advanced smoothing for luxury meditation UX
const smoothMetric = (current: number, previous: number, alpha: number = 0.15): number => {
    return previous + alpha * (current - previous);
};

// LUXURY: Enhanced persistence logic for stable UI display
const updatePersistentDisplay = (
    currentMetrics: MeditationMetrics,
    persistentState: VisionState['persistentDisplay'],
    isStable: boolean
): VisionState['persistentDisplay'] => {
    const now = Date.now();
    
    if (isStable && currentMetrics.faceDetected) {
        // ENHANCEMENT: Update persistent metrics when stable
        return {
            lastValidMetrics: currentMetrics,
            displayStartTime: persistentState.displayStartTime || now,
            lastValidTime: now,
            shouldPersist: true,
            confidenceStreak: Math.min(persistentState.confidenceStreak + 1, 10),
        };
    } else {
        // CLEAN: Maintain persistence but update timing
        return {
            ...persistentState,
            confidenceStreak: Math.max(persistentState.confidenceStreak - 1, 0),
            shouldPersist: persistentState.confidenceStreak > 2, // Hysteresis
        };
    }
};

// CLEAN: Face detection stability with hysteresis to prevent flashing
const stabilizeFaceDetection = (
    currentDetected: boolean,
    previousDetected: boolean,
    confidence: number,
    history: boolean[]
): boolean => {
    // Add current detection to history
    const newHistory = [...history.slice(-4), currentDetected]; // Keep last 5 frames
    
    // Count recent detections
    const recentDetections = newHistory.filter(Boolean).length;
    
    // Hysteresis logic: require more evidence to change state
    if (previousDetected) {
        // If previously detected, need 3+ failures to mark as not detected
        return recentDetections >= 2;
    } else {
        // If previously not detected, need 3+ successes to mark as detected
        return recentDetections >= 3;
    }
};

// DRY: Luxury smooth metrics with stability and grace
const createSmoothedMetrics = (
    newMetrics: MeditationMetrics, 
    previousSmoothed: MeditationMetrics | null,
    detectionHistory: boolean[]
): { metrics: MeditationMetrics; newHistory: boolean[] } => {
    if (!previousSmoothed) {
        return {
            metrics: newMetrics,
            newHistory: [newMetrics.faceDetected]
        };
    }

    // LUXURY: Stabilize face detection to prevent flashing
    const stableFaceDetected = stabilizeFaceDetection(
        newMetrics.faceDetected,
        previousSmoothed.faceDetected,
        newMetrics.confidence,
        detectionHistory
    );

    // PERFORMANT: Only update metrics when face is stably detected
    const shouldUpdateMetrics = stableFaceDetected && newMetrics.faceDetected;

    const smoothedMetrics: MeditationMetrics = {
        ...newMetrics,
        // CLEAN: Smooth core metrics with very gentle transitions
        stillness: shouldUpdateMetrics ? 
            smoothMetric(newMetrics.stillness, previousSmoothed.stillness, 0.1) : // Very slow for calmness
            previousSmoothed.stillness,
        presence: shouldUpdateMetrics ?
            smoothMetric(newMetrics.presence, previousSmoothed.presence, 0.15) :
            Math.max(previousSmoothed.presence * 0.95, 0), // Gentle fade when not detected
        posture: shouldUpdateMetrics ?
            smoothMetric(newMetrics.posture, previousSmoothed.posture, 0.12) :
            previousSmoothed.posture,
        restlessnessScore: shouldUpdateMetrics && newMetrics.restlessnessScore ? 
            smoothMetric(newMetrics.restlessnessScore, previousSmoothed.restlessnessScore || 0, 0.08) : // Very slow
            previousSmoothed.restlessnessScore,
        
        // MODULAR: Stable face detection and landmarks
        faceDetected: stableFaceDetected,
        faceLandmarks: stableFaceDetected ? newMetrics.faceLandmarks : previousSmoothed.faceLandmarks,
        
        // Keep technical fields accurate
        confidence: newMetrics.confidence,
        processingTimeMs: newMetrics.processingTimeMs,
        source: newMetrics.source,
    };

    return {
        metrics: smoothedMetrics,
        newHistory: [...detectionHistory.slice(-4), newMetrics.faceDetected]
    };
};

// ============================================================================
// INITIAL STATE - Clean defaults
// ============================================================================

const initialState: VisionState = {
    status: 'idle',
    isActive: false,
    isReady: false,
    metrics: null,
    config: null,
    currentFPS: DEFAULT_CONFIG.targetFPS || 2,
    performanceMode: 'optimal',
    backendAvailable: false,
    error: null,
    lastMetrics: null,
    sessionStartTime: null,
    totalProcessingTime: 0,
    frameCount: 0,
    smoothedMetrics: null,
    metricHistory: [],
    detectionHistory: [],
    // LUXURY: Initialize persistence state
    persistentDisplay: {
        lastValidMetrics: null,
        displayStartTime: null,
        lastValidTime: null,
        shouldPersist: false,
        confidenceStreak: 0,
    },
};

// ============================================================================
// STORE - Unified vision state with comprehensive actions
// ============================================================================

export const useVisionStore = create<VisionState & VisionActions>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                ...initialState,

                // Core lifecycle management
                initialize: async (config: VisionConfig) => {
                    const finalConfig = { ...DEFAULT_CONFIG, ...config };

                    set({
                        status: 'initializing',
                        config: finalConfig,
                        error: null,
                    });

                    try {
                        // Check backend availability
                        const backendAvailable = await get().checkBackendHealth();

                        set({
                            status: 'ready',
                            isReady: true,
                            backendAvailable,
                            currentFPS: finalConfig.targetFPS || 2,
                            performanceMode: 'optimal',
                        });

                        console.log('🔍 VisionStore: Initialized with config:', finalConfig);
                    } catch (error) {
                        console.error('❌ VisionStore: Initialization failed:', error);

                        set({
                            status: 'error',
                            error: error instanceof Error ? error.message : 'Initialization failed',
                        });
                    }
                },

                start: async (videoElement: HTMLVideoElement) => {
                    const state = get();

                    if (state.isActive) return;

                    const sessionStartTime = Date.now();

                    set({
                        status: 'active',
                        isActive: true,
                        sessionStartTime,
                        error: null,
                        metrics: null, // No fake data - wait for real processing
                    });

                    // Import API client dynamically to avoid circular dependencies
                    const { apiClient } = await import('../lib/api/unified-client');

                    // Start processing loop with real backend calls
                    const processFrame = async () => {
                        const visionState = get();

                        if (!visionState.isActive) return;

                        const startTime = performance.now();

                        try {
                            // Capture frame from video element
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');

                            if (!ctx || !videoElement) {
                                throw new Error('Canvas context or video element unavailable');
                            }

                            // Set canvas size (smaller for performance)
                            canvas.width = Math.min(320, videoElement.videoWidth || 320);
                            canvas.height = Math.min(240, videoElement.videoHeight || 240);

                            // Draw current video frame
                            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                            const imageData = canvas.toDataURL('image/jpeg', 0.8);

                            // Make API call to backend
                            const response = await apiClient.processVision(visionState.config?.sessionId || 'default', {
                                image_data: imageData,
                                timestamp: Date.now(),
                                options: {
                                    detect_face: visionState.config?.features?.detectFace ?? true,
                                    analyze_posture: visionState.config?.features?.analyzePosture ?? true,
                                    track_breathing: visionState.config?.features?.trackMovement ?? false,
                                },
                            });

                            const processingTime = performance.now() - startTime;

                            if (response.success && response.data && !response.data.fallback) {
                                // CLEAN: Transform backend response to meditation metrics with proper field mapping
                                const backendMetrics = response.data.metrics;
                                
                                // DRY: Single source of truth for metric calculations
                                const movementLevel = backendMetrics?.movement_level ?? 0;
                                const confidence = backendMetrics?.confidence ?? 0;
                                const postureScore = backendMetrics?.posture_score ?? 0;
                                const faceDetected = backendMetrics?.face_detected ?? false;
                                
                                const metrics: MeditationMetrics = {
                                    stillness: faceDetected ? (1 - movementLevel) * 100 : 0,
                                    presence: faceDetected ? confidence * 100 : 0,
                                    posture: faceDetected ? postureScore * 100 : 0,
                                    restlessnessScore: faceDetected ? movementLevel * 100 : 0,
                                    faceLandmarks: faceDetected ? (backendMetrics?.landmarks || []) : [],
                                    faceDetected,
                                    confidence,
                                    processingTimeMs: backendMetrics?.processing_time_ms ?? processingTime,
                                    source: 'backend',
                                };

                                // PERFORMANT: Create luxury smooth metrics with stability
                                const smoothingResult = createSmoothedMetrics(
                                    metrics, 
                                    get().smoothedMetrics,
                                    get().detectionHistory
                                );
                                
                                // LUXURY: Update persistent display state
                                const isStable = smoothingResult.metrics.confidence >= PERSISTENCE_CONFIG.stabilityThreshold &&
                                               smoothingResult.metrics.faceDetected;
                                const updatedPersistentDisplay = updatePersistentDisplay(
                                    smoothingResult.metrics,
                                    get().persistentDisplay,
                                    isStable
                                );

                                set((state) => ({
                                    metrics,
                                    smoothedMetrics: smoothingResult.metrics, // LUXURY: Stable, smooth metrics
                                    detectionHistory: smoothingResult.newHistory, // Track detection stability
                                    persistentDisplay: updatedPersistentDisplay, // ENHANCEMENT: Persistence state
                                    lastMetrics: state.metrics,
                                    metricHistory: [...state.metricHistory.slice(-9), metrics], // Keep last 10 for trends
                                    totalProcessingTime: state.totalProcessingTime + processingTime,
                                    frameCount: state.frameCount + 1,
                                    error: null,
                                    backendAvailable: true,
                                }));

                                console.log('🔍 VisionStore: Backend processing successful', {
                                    faceDetected,
                                    stillness: metrics.stillness,
                                    restlessness: metrics.restlessnessScore,
                                    landmarkCount: metrics.faceLandmarks?.length || 0
                                });
                        } else {
                            // Backend unavailable - maintain persistence but update state
                            set((state) => ({
                                metrics: null,
                                lastMetrics: state.metrics,
                                error: 'Vision service unavailable - biometric tracking disabled',
                                backendAvailable: false,
                                // LUXURY: Gradually fade persistent display when backend unavailable
                                persistentDisplay: {
                                    ...state.persistentDisplay,
                                    shouldPersist: state.persistentDisplay.confidenceStreak > 5,
                                    confidenceStreak: Math.max(state.persistentDisplay.confidenceStreak - 2, 0),
                                },
                            }));

                            console.warn('⚠️ VisionStore: Backend unavailable - no biometric data');
                        }

                            // Adaptive performance management
                            get().updatePerformanceMode(processingTime);

                        } catch (error) {
                            console.error('Vision processing error:', error);

                            // Clear error state - no fake data, but maintain some persistence
                            set((state) => ({
                                metrics: null,
                                error: `Vision processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                backendAvailable: false,
                                // CLEAN: Gradually reduce persistence on errors
                                persistentDisplay: {
                                    ...state.persistentDisplay,
                                    shouldPersist: state.persistentDisplay.confidenceStreak > 3,
                                    confidenceStreak: Math.max(state.persistentDisplay.confidenceStreak - 1, 0),
                                },
                            }));
                        }

                        // Schedule next frame
                        const nextState = get();
                        if (nextState.isActive) {
                            const interval = 1000 / nextState.currentFPS;
                            setTimeout(processFrame, interval);
                        }
                    };

                    // Start processing with a small delay to ensure video is ready
                    setTimeout(processFrame, 500);

                    console.log('🔍 VisionStore: Started real backend processing');
                },

                stop: () => {
                    set({
                        status: 'idle',
                        isActive: false,
                        metrics: null,
                        // CLEAN: Reset persistence state on stop
                        persistentDisplay: {
                            lastValidMetrics: null,
                            displayStartTime: null,
                            lastValidTime: null,
                            shouldPersist: false,
                            confidenceStreak: 0,
                        },
                    });

                    console.log('🛑 VisionStore: Stopped processing');
                },

                pause: () => {
                    set({
                        status: 'paused',
                        isActive: false,
                    });

                    console.log('⏸️ VisionStore: Paused processing');
                },

                resume: () => {
                    const state = get();

                    if (state.status === 'paused') {
                        set({
                            status: 'active',
                            isActive: true,
                        });

                        console.log('▶️ VisionStore: Resumed processing');
                    }
                },

                reset: () => {
                    const state = get();
                    set({
                        ...initialState,
                        config: state.config, // Preserve config
                    });

                    console.log('🔄 VisionStore: Reset to initial state');
                },

                // Configuration management
                updateConfig: (config: Partial<VisionConfig>) => {
                    const currentState = get();
                    const newConfig = { ...currentState.config, ...config } as VisionConfig;

                    set({
                        config: newConfig,
                        currentFPS: newConfig.targetFPS || currentState.currentFPS,
                    });

                    console.log('⚙️ VisionStore: Updated config:', newConfig);
                },

                setPerformanceMode: (mode: VisionState['performanceMode']) => {
                    const constraints = PERFORMANCE_CONSTRAINTS[mode];

                    set({
                        performanceMode: mode,
                        currentFPS: constraints.targetFPS,
                    });

                    console.log(`🚀 VisionStore: Performance mode set to ${mode}`);
                },

                // Metrics management
                updateMetrics: (metrics: MeditationMetrics) => {
                    set({
                        metrics,
                        lastMetrics: get().metrics,
                    });
                },

                clearMetrics: () => {
                    set({
                        metrics: null,
                        lastMetrics: get().metrics,
                    });
                },

                // Error handling
                setError: (error: string | null) => {
                    set({ error });
                },

                clearError: () => {
                    set({ error: null });
                },

                // Backend management
                checkBackendHealth: async (): Promise<boolean> => {
                    const state = get();
                    const config = state.config;

                    if (!config?.backendUrl) return false;

                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 2000);

                        const response = await fetch(`${config.backendUrl}/health`, {
                            method: 'GET',
                            signal: controller.signal,
                        });

                        clearTimeout(timeoutId);
                        return response.ok;
                    } catch {
                        return false;
                    }
                },

                refreshBackendStatus: async () => {
                    const backendAvailable = await get().checkBackendHealth();

                    set({ backendAvailable });

                    console.log(`🔍 VisionStore: Backend ${backendAvailable ? 'available' : 'unavailable'}`);
                },

                // Performance management
                updatePerformanceMode: (processingTime: number) => {
                    const state = get();
                    const config = state.config;

                    if (!config?.enableAdaptiveFPS) return;

                    const performanceMode = get().performanceMode;
                    const constraints = PERFORMANCE_CONSTRAINTS[performanceMode];

                    // Simple adaptive logic - could be enhanced
                    if (processingTime > constraints.processingTimeout) {
                        const newMode: VisionState['performanceMode'] =
                            performanceMode === 'optimal' ? 'balanced' : 'minimal';

                        get().setPerformanceMode(newMode);
                    }
                },

                // Utilities
                getSessionDuration: () => {
                    const state = get();
                    return state.sessionStartTime ? Date.now() - state.sessionStartTime : 0;
                },

                getAverageProcessingTime: () => {
                    const state = get();
                    return state.frameCount > 0 ? state.totalProcessingTime / state.frameCount : 0;
                },

                getRestlessnessTrend: () => {
                    const state = get();
                    const current = state.metrics?.restlessnessScore || 50;
                    const previous = state.lastMetrics?.restlessnessScore || 50;

                    if (current < previous - 5) return 'improving';
                    if (current > previous + 5) return 'worsening';
                    return 'stable';
                },

                exportSessionData: () => {
                    const state = get();

                    return {
                        sessionId: state.config?.sessionId,
                        duration: get().getSessionDuration(),
                        averageProcessingTime: get().getAverageProcessingTime(),
                        frameCount: state.frameCount,
                        performanceMode: state.performanceMode,
                        backendAvailable: state.backendAvailable,
                        restlessnessTrend: get().getRestlessnessTrend(),
                        finalMetrics: state.metrics,
                    };
                },
            }),
            {
                name: 'vision-store',
                partialize: (state) => ({
                    config: state.config,
                    lastMetrics: state.lastMetrics,
                    totalProcessingTime: state.totalProcessingTime,
                    frameCount: state.frameCount,
                }),
            }
        )
    )
);

// ============================================================================
// SELECTORS - Optimized state access
// ============================================================================

export const visionSelectors = {
    isActive: () => useVisionStore((state) => state.isActive),
    isReady: () => useVisionStore((state) => state.isReady),
    hasMetrics: () => useVisionStore((state) => !!state.smoothedMetrics), // CLEAN: Use smoothed metrics for UI
    hasError: () => useVisionStore((state) => !!state.error),
    isBackendAvailable: () => useVisionStore((state) => state.backendAvailable),
    // DRY: Single source for smooth UI metrics
    restlessnessScore: () => useVisionStore((state) => state.smoothedMetrics?.restlessnessScore || 0),
    stillnessScore: () => useVisionStore((state) => state.smoothedMetrics?.stillness || 0),
    sessionDuration: () => useVisionStore((state) => {
        return state.sessionStartTime ? Date.now() - state.sessionStartTime : 0;
    }),
};

// ============================================================================
// HOOKS - Clean, focused hooks for components
// ============================================================================

export const useVisionStatus = () => useVisionStore((state) => state.status);
export const useVisionMetrics = () => useVisionStore((state) => state.smoothedMetrics); // PERFORMANT: Use smoothed for UI
export const useVisionError = () => useVisionStore((state) => state.error);
export const useVisionConfig = () => useVisionStore((state) => state.config);
export const useRestlessnessScore = () => useVisionStore((state) => state.smoothedMetrics?.restlessnessScore || 0);

export default useVisionStore;
