/**
 * Unified Vision Hook
 * Single hook for all vision functionality - DRY, CLEAN, MODULAR
 * Replaces: useVision, useOptimizedVision, useIntegratedVisionFeedback, 
 *           useBreathPatternDetection, usePostureAnalysis
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedVisionSystem } from '../lib/vision/unified-vision-system';
import type { VisionTier } from '../lib/vision/types';

interface VisionFeatureConfig {
  breathPattern?: {
    enabled: boolean;
    detectionInterval?: number;
    enableGuidance?: boolean;
    historicalData?: {
      averageRate?: number;
      typicalRhythm?: 'regular' | 'irregular' | 'deep' | 'shallow';
      sessionCount?: number;
    };
  };
  postureAnalysis?: {
    enabled: boolean;
    analysisInterval?: number;
    alertThreshold?: number;
    sessionContext?: {
      sessionCount?: number;
      duration?: number;
      previousScore?: number;
    };
  };
  performance?: {
    enabled: boolean;
    showMonitor?: boolean;
  };
}

interface VisionConfig {
  tier?: VisionTier;
  targetFPS?: number;
  adaptiveQuality?: boolean;
  mobileOptimized?: boolean;
  features?: VisionFeatureConfig;
}

interface VisionState {
  isActive: boolean;
  currentTier: VisionTier;
  metrics: any;
  features: {
    breathPattern?: any;
    postureAnalysis?: any;
    performance?: any;
  };
  performance: {
    fps: number;
    cpuUsage: number;
    memoryUsage: number;
    processingTime?: number;
  };
}

interface UseUnifiedVisionReturn {
  // State
  state: VisionState;
  isLoading: boolean;
  error: string | null;
  
  // Core actions
  start: (videoElement: HTMLVideoElement) => Promise<void>;
  stop: () => void;
  
  // Feature management
  enableFeature: (feature: string) => void;
  disableFeature: (feature: string) => void;
  updateConfig: (config: Partial<VisionConfig>) => void;
  updateFeatureConfig: (feature: string, config: any) => void;
  
  // Utilities
  getAvailableFeatures: () => string[];
  reset: () => void;
}

const DEFAULT_CONFIG: VisionConfig = {
  tier: 'standard',
  targetFPS: 15,
  adaptiveQuality: true,
  mobileOptimized: false,
  features: {
    breathPattern: {
      enabled: false,
      detectionInterval: 1000,
      enableGuidance: true,
    },
    postureAnalysis: {
      enabled: false,
      analysisInterval: 2000,
      alertThreshold: 60,
    },
    performance: {
      enabled: false,
      showMonitor: false,
    },
  },
};

export const useUnifiedVision = (
  initialConfig: Partial<VisionConfig> = {}
): UseUnifiedVisionReturn => {
  // Merge config
  const config = useRef<VisionConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
    features: {
      ...DEFAULT_CONFIG.features,
      ...initialConfig.features,
    },
  });

  // State
  const [state, setState] = useState<VisionState>({
    isActive: false,
    currentTier: config.current.tier || 'standard',
    metrics: null,
    features: {},
    performance: {
      fps: 0,
      cpuUsage: 0,
      memoryUsage: 0,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const visionSystem = useRef<UnifiedVisionSystem | null>(null);
  const unsubscribe = useRef<(() => void) | null>(null);

  // Initialize vision system
  useEffect(() => {
    visionSystem.current = UnifiedVisionSystem.getInstance();
    
    // Configure system
    visionSystem.current.configure({
      tier: config.current.tier,
      enabledFeatures: getEnabledFeatures(),
      performance: {
        targetFPS: config.current.targetFPS || 15,
        adaptiveQuality: config.current.adaptiveQuality !== false,
        backgroundProcessing: true,
      },
      mobile: {
        optimizeForMobile: config.current.mobileOptimized || false,
        reducedProcessing: config.current.mobileOptimized || false,
      },
    });

    // Subscribe to state changes
    unsubscribe.current = visionSystem.current.subscribe((visionState) => {
      setState({
        isActive: visionState.isActive,
        currentTier: visionState.currentTier,
        metrics: visionState.metrics,
        features: visionState.features,
        performance: visionState.performance,
      });
    });

    return () => {
      unsubscribe.current?.();
      visionSystem.current?.dispose();
    };
  }, []);

  /**
   * Get enabled features from config
   */
  const getEnabledFeatures = useCallback((): string[] => {
    const enabled: string[] = [];
    const features = config.current.features || {};

    if (features.breathPattern?.enabled) enabled.push('breathPattern');
    if (features.postureAnalysis?.enabled) enabled.push('postureAnalysis');
    if (features.performance?.enabled) enabled.push('performance');

    return enabled;
  }, []);

  /**
   * Start vision processing
   */
  const start = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!visionSystem.current || state.isActive) return;

    setIsLoading(true);
    setError(null);

    try {
      await visionSystem.current.start(videoElement);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start vision system';
      setError(errorMessage);
      console.error('Vision start error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [state.isActive]);

  /**
   * Stop vision processing
   */
  const stop = useCallback(() => {
    if (!visionSystem.current || !state.isActive) return;

    visionSystem.current.stop();
    setError(null);
  }, [state.isActive]);

  /**
   * Enable a feature
   */
  const enableFeature = useCallback((feature: string) => {
    if (!visionSystem.current) return;

    // Update config
    if (config.current.features) {
      (config.current.features as any)[feature] = {
        ...(config.current.features as any)[feature],
        enabled: true,
      };
    }

    visionSystem.current.enableFeature(feature);
  }, []);

  /**
   * Disable a feature
   */
  const disableFeature = useCallback((feature: string) => {
    if (!visionSystem.current) return;

    // Update config
    if (config.current.features) {
      (config.current.features as any)[feature] = {
        ...(config.current.features as any)[feature],
        enabled: false,
      };
    }

    visionSystem.current.disableFeature(feature);
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<VisionConfig>) => {
    config.current = {
      ...config.current,
      ...newConfig,
      features: {
        ...config.current.features,
        ...newConfig.features,
      },
    };

    if (visionSystem.current) {
      visionSystem.current.configure({
        tier: config.current.tier,
        enabledFeatures: getEnabledFeatures(),
        performance: {
          targetFPS: config.current.targetFPS || 15,
          adaptiveQuality: config.current.adaptiveQuality !== false,
          backgroundProcessing: true,
          useWebWorkers: config.current.features?.performance?.enabled !== false,
        },
        mobile: {
          optimizeForMobile: config.current.mobileOptimized || false,
          reducedProcessing: config.current.mobileOptimized || false,
        },
      });
    }
  }, [getEnabledFeatures]);

  /**
   * Update feature-specific configuration
   */
  const updateFeatureConfig = useCallback((feature: string, featureConfig: any) => {
    if (config.current.features) {
      (config.current.features as any)[feature] = {
        ...(config.current.features as any)[feature],
        ...featureConfig,
      };
    }
  }, []);

  /**
   * Get available features
   */
  const getAvailableFeatures = useCallback((): string[] => {
    return visionSystem.current?.getAvailableFeatures() || [];
  }, []);

  /**
   * Reset system
   */
  const reset = useCallback(() => {
    stop();
    setError(null);
    setState({
      isActive: false,
      currentTier: config.current.tier || 'standard',
      metrics: null,
      features: {},
      performance: {
        fps: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      },
    });
  }, [stop]);

  return {
    // State
    state,
    isLoading,
    error,
    
    // Core actions
    start,
    stop,
    
    // Feature management
    enableFeature,
    disableFeature,
    updateConfig,
    updateFeatureConfig,
    
    // Utilities
    getAvailableFeatures,
    reset,
  };
};