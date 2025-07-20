import type { VisionTier, VisionMetrics, PerformanceMode, PerformanceMetrics } from './types';

/**
 * Main Vision Manager singleton class
 */
export class VisionManager {
  private static instance: VisionManager | null = null;
  private tier: VisionTier = 'basic';
  private isRunning: boolean = false;
  private mode: PerformanceMode = 'auto';
  private metrics: VisionMetrics | null = null;
  private performanceMetrics: PerformanceMetrics | null = null;
  private listeners: {
    tier: ((tier: VisionTier) => void)[];
    metrics: ((metrics: VisionMetrics) => void)[];
    error: ((error: Error) => void)[];
  } = {
    tier: [],
    metrics: [],
    error: []
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): VisionManager {
    if (!VisionManager.instance) {
      VisionManager.instance = new VisionManager();
    }
    return VisionManager.instance;
  }

  /**
   * Initialize the vision system
   */
  public async initialize(mode: PerformanceMode = 'auto'): Promise<VisionTier> {
    this.mode = mode;
    
    // Simulate detection of available hardware capabilities
    // In a real implementation, this would detect GPU, CPU, and memory capabilities
    
    // Default to basic tier, but could be upgraded based on hardware
    this.tier = 'basic';
    
    // Simulate a 50% chance of a better tier
    if (Math.random() > 0.5) {
      this.tier = 'standard';
    }
    
    // 20% chance of premium tier
    if (Math.random() > 0.8) {
      this.tier = 'premium';
    }
    
    // Notify listeners
    this.notifyTierChange();
    
    return this.tier;
  }

  /**
   * Start vision processing
   */
  public async startVision(stream: MediaStream): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Set up simulated metrics updates
    this.simulateMetrics();
  }

  /**
   * Stop vision processing
   */
  public async stopVision(): Promise<void> {
    this.isRunning = false;
    this.metrics = null;
  }

  /**
   * Get current metrics
   */
  public async getMetrics(): Promise<VisionMetrics | null> {
    return this.metrics;
  }

  /**
   * Change performance mode
   */
  public async switchMode(mode: PerformanceMode): Promise<VisionTier> {
    this.mode = mode;
    
    // Adjust tier based on mode
    if (mode === 'performance') {
      // In performance mode, cap tier at standard
      this.tier = this.tier === 'premium' ? 'standard' : this.tier;
    } else if (mode === 'quality') {
      // In quality mode, try to upgrade tier
      if (Math.random() > 0.7) {
        this.tier = 'premium';
      }
    }
    
    this.notifyTierChange();
    return this.tier;
  }

  /**
   * Register tier change listener
   */
  public onTierChange(callback: (tier: VisionTier) => void): void {
    this.listeners.tier.push(callback);
  }

  /**
   * Register metrics listener
   */
  public onMetrics(callback: (metrics: VisionMetrics) => void): void {
    this.listeners.metrics.push(callback);
  }

  /**
   * Register error listener
   */
  public onError(callback: (error: Error) => void): void {
    this.listeners.error.push(callback);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.isRunning = false;
    this.listeners = {
      tier: [],
      metrics: [],
      error: []
    };
    VisionManager.instance = null;
  }

  /**
   * Notify tier change
   */
  private notifyTierChange(): void {
    this.listeners.tier.forEach(callback => {
      try {
        callback(this.tier);
      } catch (error) {
        console.error('Error in tier change listener:', error);
      }
    });
  }

  /**
   * Simulate metrics updates
   */
  private simulateMetrics(): void {
    if (!this.isRunning) return;
    
    const updateMetrics = () => {
      if (!this.isRunning) return;
      
      // Create basic metrics available in all tiers
      const baseMetrics: VisionMetrics = {
        confidence: 0.7 + Math.random() * 0.3,
        movementLevel: Math.random() * 0.5, // Lower is better
        lastUpdateTime: Date.now()
      };
      
      // Add advanced metrics based on tier
      if (this.tier === 'standard' || this.tier === 'premium') {
        (baseMetrics as any).estimatedBreathingRate = 8 + Math.random() * 8;
        (baseMetrics as any).postureQuality = 0.6 + Math.random() * 0.4;
      }
      
      // Add premium metrics
      if (this.tier === 'premium') {
        (baseMetrics as any).restlessnessScore = Math.random() * 0.4;
        (baseMetrics as any).focusLevel = 0.7 + Math.random() * 0.3;
      }
      
      this.metrics = baseMetrics;
      
      // Update performance metrics
      this.performanceMetrics = {
        frameRate: 15 + Math.random() * 15,
        cpuUsage: 20 + Math.random() * 40,
        memoryUsage: 150 + Math.random() * 100,
        batteryImpact: 10 + Math.random() * 30,
        frameDrops: Math.floor(Math.random() * 5),
        thermalState: Math.random() > 0.9 ? 'elevated' : 'normal'
      };
      
      // Notify listeners
      this.listeners.metrics.forEach(callback => {
        try {
          callback(this.metrics!);
        } catch (error) {
          console.error('Error in metrics listener:', error);
        }
      });
      
      // Schedule next update
      setTimeout(updateMetrics, 1000);
    };
    
    // Start metrics simulation
    updateMetrics();
  }
}

// Export main vision engine and camera manager
export { default as VisionEngine } from './core/vision-engine';
export { default as CameraManager } from './camera/camera-manager';

// Export enhanced components
export { EnhancedRestlessnessAnalyzer } from './enhanced-restlessness-analyzer';

// Export types
export type { 
  VisionTier, 
  VisionMetrics, 
  PerformanceMode, 
  PerformanceMetrics,
  BasicMetrics,
  StandardMetrics,
  PremiumMetrics
} from './types';
