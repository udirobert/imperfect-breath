/**
 * Unified Vision System
 * Single source of truth for all vision functionality
 * Follows DRY, CLEAN, ORGANISED, MODULAR, PERFORMANT principles
 */

import { VisionEngine } from './core/vision-engine';
import { PerformanceOptimizer } from './performance-optimizer';
import { BreathPatternDetector } from './breath-pattern-detector';
import { PostureAnalyzer } from './posture-analyzer';
import type { VisionTier, VisionMetrics } from './types';

// Plugin interface for modular features
interface VisionPlugin {
  name: string;
  initialize(): Promise<void>;
  process(metrics: VisionMetrics): any;
  cleanup(): void;
}

// Unified configuration
interface VisionConfig {
  tier: VisionTier;
  enabledFeatures: string[];
  performance: {
    targetFPS: number;
    adaptiveQuality: boolean;
    backgroundProcessing: boolean;
  };
  mobile: {
    optimizeForMobile: boolean;
    reducedProcessing: boolean;
  };
}

// Unified state interface
interface VisionState {
  isActive: boolean;
  currentTier: VisionTier;
  metrics: VisionMetrics | null;
  features: Record<string, any>;
  performance: {
    fps: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

export class UnifiedVisionSystem {
  private static instance: UnifiedVisionSystem;
  private engine: VisionEngine;
  private optimizer: PerformanceOptimizer;
  private plugins: Map<string, VisionPlugin> = new Map();
  private config: VisionConfig;
  private state: VisionState;
  private callbacks: Set<(state: VisionState) => void> = new Set();

  static getInstance(): UnifiedVisionSystem {
    if (!UnifiedVisionSystem.instance) {
      UnifiedVisionSystem.instance = new UnifiedVisionSystem();
    }
    return UnifiedVisionSystem.instance;
  }

  constructor() {
    this.engine = VisionEngine.getInstance();
    this.optimizer = PerformanceOptimizer.getInstance();
    
    this.config = {
      tier: 'standard',
      enabledFeatures: [],
      performance: {
        targetFPS: 15,
        adaptiveQuality: true,
        backgroundProcessing: true,
      },
      mobile: {
        optimizeForMobile: false,
        reducedProcessing: false,
      },
    };

    this.state = {
      isActive: false,
      currentTier: 'standard',
      metrics: null,
      features: {},
      performance: {
        fps: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      },
    };

    this.initializeBuiltInPlugins();
  }

  /**
   * Initialize built-in plugins
   */
  private initializeBuiltInPlugins(): void {
    // Store detectors separately to avoid TypeScript issues
    const breathDetector = new BreathPatternDetector();
    const postureAnalyzer = new PostureAnalyzer();

    // Breath pattern detection plugin
    this.registerPlugin({
      name: 'breathPattern',
      initialize: async () => {
        // Initialization logic if needed
      },
      process: (metrics: VisionMetrics) => {
        const faceLandmarks = (metrics as any).faceLandmarks;
        return breathDetector.detectBreathingPattern(faceLandmarks);
      },
      cleanup: () => {
        breathDetector.reset();
      },
    });

    // Posture analysis plugin
    this.registerPlugin({
      name: 'postureAnalysis',
      initialize: async () => {
        // Initialization logic if needed
      },
      process: (metrics: VisionMetrics) => {
        const faceLandmarks = (metrics as any).faceLandmarks;
        const poseLandmarks = (metrics as any).poseLandmarks;
        return postureAnalyzer.analyzePosture(faceLandmarks, poseLandmarks);
      },
      cleanup: () => {
        postureAnalyzer.reset();
      },
    });
  }

  /**
   * Register a vision plugin
   */
  public registerPlugin(plugin: VisionPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Configure the vision system
   */
  public configure(config: Partial<VisionConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Apply mobile optimizations
    if (this.config.mobile.optimizeForMobile) {
      this.config.performance.targetFPS = Math.min(this.config.performance.targetFPS, 10);
      this.config.tier = this.config.tier === 'premium' ? 'standard' : this.config.tier;
    }
  }

  /**
   * Start vision processing
   */
  public async start(videoElement: HTMLVideoElement): Promise<void> {
    try {
      // Initialize enabled plugins
      for (const featureName of this.config.enabledFeatures) {
        const plugin = this.plugins.get(featureName);
        if (plugin) {
          await plugin.initialize();
        }
      }

      // Initialize and start vision engine
      await this.engine.initialize({
        tier: this.config.tier,
        modelVariant: this.config.mobile.optimizeForMobile ? 'mobile' : 'desktop',
        enableGPU: !this.config.mobile.optimizeForMobile,
        maxConcurrentProcessing: 1,
        frameSkipRatio: this.config.mobile.optimizeForMobile ? 2 : 1,
      });
      
      // Start processing with metrics callback
      await this.engine.startProcessing(videoElement, async (metrics) => {
        if (!this.state.isActive) return;
        
        this.state.metrics = metrics;
        
        // Process through enabled plugins
        for (const featureName of this.config.enabledFeatures) {
          const plugin = this.plugins.get(featureName);
          if (plugin) {
            try {
              const featureResult = plugin.process(metrics);
              if (featureResult) {
                this.state.features[featureName] = featureResult;
              }
            } catch (error) {
              console.error(`Plugin ${featureName} processing error:`, error);
            }
          }
        }
        
        // Update performance metrics
        const perfMetrics = this.engine.getPerformanceMetrics();
        this.state.performance = {
          fps: perfMetrics.frameRate,
          cpuUsage: perfMetrics.cpuUsage,
          memoryUsage: perfMetrics.memoryUsage,
        };
        
        this.notifyStateChange();
      });

      this.state.isActive = true;
      this.state.currentTier = this.config.tier;
      
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to start unified vision system:', error);
      throw error;
    }
  }

  /**
   * Stop vision processing
   */
  public stop(): void {
    // Stop engine if it exists
    if (this.engine && typeof this.engine.stopProcessing === 'function') {
      this.engine.stopProcessing();
    }

    // Cleanup plugins
    for (const plugin of this.plugins.values()) {
      plugin.cleanup();
    }

    this.state.isActive = false;
    this.state.metrics = null;
    this.state.features = {};

    this.notifyStateChange();
  }

  /**
   * Process frame and update state
   * Note: This method is now primarily used for manual frame processing.
   * The VisionEngine handles continuous processing internally.
   */
  public async processFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.state.isActive) return;

    try {
      // Get base vision metrics
      const metrics = await this.engine.processFrame(videoElement, this.config.tier);
      if (!metrics) return;

      this.state.metrics = metrics;

      // Process through enabled plugins
      for (const featureName of this.config.enabledFeatures) {
        const plugin = this.plugins.get(featureName);
        if (plugin) {
          const featureResult = plugin.process(metrics);
          if (featureResult) {
            this.state.features[featureName] = featureResult;
          }
        }
      }

      // Update performance metrics from engine
      const perfMetrics = this.engine.getPerformanceMetrics();
      this.state.performance = {
        fps: perfMetrics.frameRate,
        cpuUsage: perfMetrics.cpuUsage,
        memoryUsage: perfMetrics.memoryUsage,
      };

      this.notifyStateChange();
    } catch (error) {
      console.error('Frame processing error:', error);
    }
  }

  /**
   * Get current state
   */
  public getState(): VisionState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(callback: (state: VisionState) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify state change
   */
  private notifyStateChange(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('State change callback error:', error);
      }
    });
  }

  /**
   * Enable feature
   */
  public enableFeature(featureName: string): void {
    if (!this.config.enabledFeatures.includes(featureName)) {
      this.config.enabledFeatures.push(featureName);
    }
  }

  /**
   * Disable feature
   */
  public disableFeature(featureName: string): void {
    const index = this.config.enabledFeatures.indexOf(featureName);
    if (index > -1) {
      this.config.enabledFeatures.splice(index, 1);
      delete this.state.features[featureName];
      this.notifyStateChange();
    }
  }

  /**
   * Get available features
   */
  public getAvailableFeatures(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.stop();
    this.callbacks.clear();
    this.plugins.clear();
  }
}