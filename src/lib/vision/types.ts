// Core types for the vision system
export type VisionTier = 'basic' | 'standard' | 'premium' | 'none' | 'loading';

export type PerformanceMode = 'auto' | 'performance' | 'quality';

export interface DeviceCapabilities {
  cpuCores: number;
  gpuSupport: boolean;
  wasmSupport: boolean;
  cameraResolution: string;
  batteryLevel?: number;
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
  isMobile: boolean;
  isLowPowerMode: boolean;
}

export interface VisionConfig {
  tier: VisionTier;
  cameraConstraints: MediaStreamConstraints;
  modelVariant: 'mobile' | 'desktop';
  processingInterval: number;
  frameSkipRatio: number;
  batteryOptimization: boolean;
  maxConcurrentProcessing: number;
}

// Metrics interfaces for different tiers
export interface BaseMetrics {
  timestamp: number;
  confidence: number;
}

export interface BasicMetrics extends BaseMetrics {
  movementLevel: number;
  facePresent: boolean;
  estimatedBreathingRate: number;
  headAlignment: number;
}

export interface StandardMetrics extends BasicMetrics {
  facialTension: number;
  postureQuality: number;
  breathingRhythm: {
    rate: number;
    consistency: number;
  };
  restlessnessScore: number;
}

export interface PremiumMetrics extends StandardMetrics {
  detailedFacialAnalysis: {
    nostrilMovement: number;
    jawTension: number;
    eyeMovement: number;
    microExpressions: number;
  };
  fullBodyPosture: {
    spinalAlignment: number;
    shoulderTension: number;
    chestExpansion: number;
    overallPosture: number;
  };
  preciseBreathingMetrics: {
    actualRate: number;
    targetRate: number;
    rhythmAccuracy: number;
    depthConsistency: number;
  };
  advancedRestlessnessScore: {
    overall: number;
    components: {
      faceMovement: number;
      eyeMovement: number;
      postureShifts: number;
      breathingIrregularity: number;
    };
  };
}

export type VisionMetrics = BasicMetrics | StandardMetrics | PremiumMetrics;

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  frameRate: number;
  frameDrops: number;
  batteryImpact: number;
  thermalState: string;
}

// Vision system interface
export interface IVisionSystem {
  initialize(): Promise<void>;
  getMetrics(): Promise<VisionMetrics>;
  updateConfig(config: Partial<VisionConfig>): Promise<void>;
  dispose(): Promise<void>;
}

// Model loading interface
export interface IModelLoader {
  loadModel(modelName: string, priority: 'high' | 'medium' | 'low'): Promise<any>;
  isModelLoaded(modelName: string): boolean;
  unloadModel(modelName: string): Promise<void>;
}

// Performance monitoring interface
export interface IPerformanceMonitor {
  startMonitoring(): void;
  stopMonitoring(): void;
  getCurrentMetrics(): Promise<PerformanceMetrics>;
  onPerformanceChange(callback: (metrics: PerformanceMetrics) => void): void;
}
