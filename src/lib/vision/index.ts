// Core vision system exports
export { VisionManager } from './vision-manager';
export { DeviceCapabilityDetector } from './device-detector';
export { VisionConfigManager } from './config-manager';
export { PerformanceMonitor } from './performance-monitor';
export { ModelLoader } from './model-loader';

// Vision system implementations
export { BasicVisionSystem } from './systems/basic-vision';

// AI integration
export { ZenVisionCoach } from './zen-vision-integration';

// Types
export type {
  VisionTier,
  VisionConfig,
  VisionMetrics,
  BasicMetrics,
  StandardMetrics,
  PremiumMetrics,
  PerformanceMode,
  DeviceCapabilities,
  PerformanceMetrics,
  IVisionSystem,
  IModelLoader,
  IPerformanceMonitor
} from './types';

// React integration
// Deprecated hook removed - use useVision instead
export { VisionEnhancedBreathingSession } from '../../components/vision/VisionEnhancedBreathingSession';

// Utility functions
export const createVisionManager = () => VisionManager.getInstance();
export const createZenCoach = () => ZenVisionCoach.getInstance();

// Constants
export const VISION_TIERS = ['basic', 'standard', 'premium', 'none'] as const;
export const PERFORMANCE_MODES = ['performance', 'auto', 'quality'] as const;

// Default configurations
export const DEFAULT_VISION_CONFIG = {
  tier: 'basic' as VisionTier,
  processingInterval: 200,
  frameSkipRatio: 5,
  maxConcurrentProcessing: 1,
  batteryOptimization: true,
  modelVariant: 'mobile' as const,
  cameraConstraints: {
    video: {
      width: 640,
      height: 480,
      frameRate: 15,
      facingMode: 'user'
    }
  }
};

// Helper functions
export const isVisionSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    typeof WebAssembly === 'object'
  );
};

export const getOptimalTierForDevice = async (): Promise<VisionTier> => {
  const detector = DeviceCapabilityDetector.getInstance();
  const capabilities = await detector.detectCapabilities();
  return detector.determineOptimalTier(capabilities);
};

export const formatMetricsForDisplay = (metrics: VisionMetrics | null) => {
  if (!metrics) return null;
  
  return {
    confidence: Math.round(metrics.confidence * 100),
    timestamp: new Date(metrics.timestamp).toLocaleTimeString(),
    
    // Basic metrics
    ...(('movementLevel' in metrics) && {
      stillness: Math.round((1 - metrics.movementLevel) * 100),
      faceDetected: metrics.facePresent,
      breathingRate: Math.round(metrics.estimatedBreathingRate),
      headAlignment: Math.round(metrics.headAlignment * 100)
    }),
    
    // Standard metrics
    ...(('postureQuality' in metrics) && {
      posture: Math.round(metrics.postureQuality * 100),
      facialTension: Math.round(metrics.facialTension * 100),
      rhythmConsistency: Math.round(metrics.breathingRhythm.consistency * 100),
      calmness: Math.round((1 - metrics.restlessnessScore) * 100)
    }),
    
    // Premium metrics
    ...(('detailedFacialAnalysis' in metrics) && {
      breathingAccuracy: Math.round(metrics.preciseBreathingMetrics.rhythmAccuracy * 100),
      spinalAlignment: Math.round(metrics.fullBodyPosture.spinalAlignment * 100),
      overallRestlessness: Math.round((1 - metrics.advancedRestlessnessScore.overall) * 100)
    })
  };
};

// Error handling utilities
export class VisionError extends Error {
  constructor(
    message: string,
    public code: string,
    public tier?: VisionTier,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'VisionError';
  }
}

export const handleVisionError = (error: unknown): VisionError => {
  if (error instanceof VisionError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Map common errors to VisionError
    if (error.name === 'NotAllowedError') {
      return new VisionError(
        'Camera access denied. Please allow camera permissions to use vision features.',
        'CAMERA_DENIED',
        undefined,
        false
      );
    }
    
    if (error.name === 'NotFoundError') {
      return new VisionError(
        'No camera found. Vision features require a camera.',
        'CAMERA_NOT_FOUND',
        undefined,
        false
      );
    }
    
    if (error.message.includes('model')) {
      return new VisionError(
        'Failed to load vision models. Falling back to basic features.',
        'MODEL_LOAD_FAILED',
        'basic',
        true
      );
    }
    
    return new VisionError(
      error.message,
      'UNKNOWN_ERROR',
      undefined,
      true
    );
  }
  
  return new VisionError(
    'An unknown error occurred in the vision system',
    'UNKNOWN_ERROR',
    undefined,
    true
  );
};

// Performance optimization utilities
export const optimizeForMobile = (config: Partial<VisionConfig>): Partial<VisionConfig> => {
  return {
    ...config,
    processingInterval: Math.max(config.processingInterval || 200, 200),
    frameSkipRatio: Math.max(config.frameSkipRatio || 5, 5),
    maxConcurrentProcessing: 1,
    batteryOptimization: true,
    cameraConstraints: {
      video: {
        width: 640,
        height: 480,
        frameRate: 15,
        facingMode: 'user'
      }
    }
  };
};

export const optimizeForPerformance = (config: Partial<VisionConfig>): Partial<VisionConfig> => {
  return {
    ...config,
    processingInterval: 300, // 3.3 FPS
    frameSkipRatio: 10,
    maxConcurrentProcessing: 1,
    cameraConstraints: {
      video: {
        width: 320,
        height: 240,
        frameRate: 10
      }
    }
  };
};

export const optimizeForQuality = (config: Partial<VisionConfig>): Partial<VisionConfig> => {
  return {
    ...config,
    processingInterval: 50, // 20 FPS
    frameSkipRatio: 1,
    maxConcurrentProcessing: 4,
    cameraConstraints: {
      video: {
        width: 1920,
        height: 1080,
        frameRate: 30
      }
    }
  };
};
