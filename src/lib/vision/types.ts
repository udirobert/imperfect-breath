/**
 * Available vision tiers that determine feature availability
 */
export type VisionTier = 'loading' | 'basic' | 'standard' | 'premium';

/**
 * Performance modes that balance quality vs resource usage
 */
export type PerformanceMode = 'performance' | 'auto' | 'quality';

/**
 * Core vision metrics interface - metrics available across all tiers
 */
export interface VisionMetrics {
  /**
   * Overall confidence in the vision analysis (0-1)
   */
  confidence: number;
  
  /**
   * Level of movement detected (0-1, lower is better/less movement)
   */
  movementLevel: number;
  
  /**
   * Timestamp of the last metrics update
   */
  lastUpdateTime: number;
  
  
  /**
   * Quality of user's posture (0-1, higher is better) (standard+ tiers)
   */
  postureQuality?: number;
  
  /**
   * Detected restlessness (0-1, lower is better) (premium tier)
   */
  restlessnessScore?: number;
  
  /**
   * Estimated focus level (0-1, higher is better) (premium tier)
   */
  focusLevel?: number;
  
  /**
   * Raw face detection data for enhanced analysis
   */
  faces?: any[];
  
  /**
   * Raw pose detection data for enhanced analysis
   */
  poses?: any[];
  
  /**
   * Face landmarks for mesh visualization
   */
  faceLandmarks?: any[];
  
  /**
   * Pose landmarks for skeleton visualization
   */
  poseLandmarks?: any[];
  
  /**
   * Detailed facial analysis (premium tier)
   */
  detailedFacialAnalysis?: {
    nostrilMovement: number;
    jawTension: number;
    eyeMovement: number;
    microExpressions: number;
  };
  
  /**
   * Full body posture analysis (premium tier)
   */
  fullBodyPosture?: {
    spinalAlignment: number;
    shoulderTension: number;
    chestExpansion: number;
    overallPosture: number;
  };
  
  /**
   * Precise breathing metrics (premium tier)
   */
  preciseBreathingMetrics?: {
    actualRate: number;
    targetRate: number;
    rhythmAccuracy: number;
    depthConsistency: number;
  };
}

/**
 * System performance metrics
 */
export interface PerformanceMetrics {
  /**
   * Current frame rate in frames per second
   */
  frameRate: number;
  
  /**
   * CPU usage percentage (0-100)
   */
  cpuUsage: number;
  
  /**
   * Memory usage in MB
   */
  memoryUsage: number;
  
  /**
   * Estimated battery impact (0-100, higher means more drain)
   */
  batteryImpact: number;
  
  /**
   * Number of frames dropped in the last second
   */
  frameDrops: number;
  
  /**
   * Current thermal state of the device ('normal', 'elevated', 'critical')
   */
  thermalState: 'normal' | 'elevated' | 'critical';
}
