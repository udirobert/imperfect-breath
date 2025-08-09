/**
 * Unified Vision System
 * Single source of truth for all vision functionality
 * Follows DRY, CLEAN, ORGANISED, MODULAR, PERFORMANT principles
 */

import { VisionEngine } from './core/vision-engine';
import { PerformanceOptimizer } from './performance-optimizer';
import { BreathPatternDetector } from './breath-pattern-detector';
import { PostureAnalyzer } from './posture-analyzer';
import { visionWorkerManager } from './web-worker-manager';
import { testWebWorkerSupport } from './web-worker-test';
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
    useWebWorkers: boolean; // Enable web workers for intensive calculations
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
    processingTime?: number;
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
        useWebWorkers: true, // Enable by default for better performance
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
        processingTime: 0,
      },
    };

    this.initializeBuiltInPlugins();
    this.testWebWorkerSupport();
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
   * Test web worker support and adjust configuration accordingly
   */
  private async testWebWorkerSupport(): Promise<void> {
    try {
      const webWorkerSupported = await testWebWorkerSupport();
      
      if (!webWorkerSupported) {
        console.warn('Web workers not supported, disabling web worker processing');
        this.config.performance.useWebWorkers = false;
      } else {
        console.log('Web workers supported and enabled');
      }
    } catch (error) {
      console.warn('Web worker test failed, disabling web worker processing:', error);
      this.config.performance.useWebWorkers = false;
    }
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

    // Apply mobile optimizations (but preserve tier if explicitly set)
    if (this.config.mobile.optimizeForMobile) {
      this.config.performance.targetFPS = Math.min(this.config.performance.targetFPS, 10);
      // Only downgrade tier if it wasn't explicitly set to premium
      // This allows enhanced/advanced modes to force premium tier
    }
    
    // On mobile devices, disable web workers by default to conserve battery
    if (this.config.mobile.optimizeForMobile) {
      this.config.performance.useWebWorkers = false;
    }
  }

  /**
   * Start vision processing
   */
  public async start(videoElement: HTMLVideoElement): Promise<void> {
    try {
      // Validate video element
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        throw new Error('Video element has no dimensions - camera may not be ready');
      }

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
        // Always enable GPU for better performance, even on mobile
        enableGPU: true,
        maxConcurrentProcessing: 1,
        frameSkipRatio: this.config.mobile.optimizeForMobile ? 2 : 1,
      });

      // Start processing with metrics callback
      await this.engine.startProcessing(videoElement, async (metrics) => {
        if (!this.state.isActive) return;
        
        this.state.metrics = metrics;
        
        // Process through enabled plugins
        if (this.config.performance.useWebWorkers) {
          // Use web workers for intensive calculations
          await this.processWithWebWorkers(metrics);
        } else {
          // Process directly in main thread
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
        }
        
        // Update performance metrics
        const perfMetrics = this.engine.getPerformanceMetrics();
        this.state.performance = {
          fps: perfMetrics.frameRate,
          cpuUsage: perfMetrics.cpuUsage,
          memoryUsage: perfMetrics.memoryUsage,
          processingTime: perfMetrics.processingTime,
        };
        
        this.notifyStateChange();
      });

      this.state.isActive = true;
      this.state.currentTier = this.config.tier;
      
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to start unified vision system:', error);
      // Try to start with fallback configuration
      try {
        // Try with basic tier as fallback
        await this.engine.initialize({
          tier: 'basic',
          modelVariant: 'mobile',
          enableGPU: false, // Disable GPU for fallback
          maxConcurrentProcessing: 1,
          frameSkipRatio: 3,
        });
        
        await this.engine.startProcessing(videoElement, async (metrics) => {
          if (!this.state.isActive) return;
          
          this.state.metrics = metrics;
          this.state.isActive = true;
          this.state.currentTier = 'basic';
          
          this.notifyStateChange();
        });
      } catch (fallbackError) {
        console.error('Failed to start vision system with fallback configuration:', fallbackError);
        throw error; // Re-throw the original error
      }
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
      if (this.config.performance.useWebWorkers) {
        // Use web workers for intensive calculations
        await this.processWithWebWorkers(metrics);
      } else {
        // Process directly in main thread
        for (const featureName of this.config.enabledFeatures) {
          const plugin = this.plugins.get(featureName);
          if (plugin) {
            const featureResult = plugin.process(metrics);
            if (featureResult) {
              this.state.features[featureName] = featureResult;
            }
          }
        }
      }

      // Update performance metrics from engine
      const perfMetrics = this.engine.getPerformanceMetrics();
      this.state.performance = {
        fps: perfMetrics.frameRate,
        cpuUsage: perfMetrics.cpuUsage,
        memoryUsage: perfMetrics.memoryUsage,
        processingTime: perfMetrics.processingTime,
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
   * Process features using web workers
   */
  private async processWithWebWorkers(metrics: VisionMetrics): Promise<void> {
    try {
      // Process enabled features in parallel using web workers
      const promises: Promise<void>[] = [];
      
      if (this.config.enabledFeatures.includes('breathPattern') && metrics.faceLandmarks) {
        const promise = visionWorkerManager.analyzeBreathPattern(
          metrics.faceLandmarks,
          Date.now(),
          this.state.performance.fps
        ).then(result => {
          this.state.features.breathPattern = result;
        }).catch(error => {
          console.warn('Breath pattern analysis failed in worker, falling back to main thread:', error);
          // Fallback to main thread processing
          const plugin = this.plugins.get('breathPattern');
          if (plugin) {
            try {
              const featureResult = plugin.process(metrics);
              if (featureResult) {
                this.state.features.breathPattern = featureResult;
              }
            } catch (pluginError) {
              console.error('Breath pattern plugin processing error:', pluginError);
            }
          }
        });
        promises.push(promise);
      }
      
      if (this.config.enabledFeatures.includes('postureAnalysis')) {
        const promise = visionWorkerManager.analyzePosture(
          metrics.faceLandmarks || [],
          metrics.poseLandmarks
        ).then(result => {
          this.state.features.postureAnalysis = result;
        }).catch(error => {
          console.warn('Posture analysis failed in worker, falling back to main thread:', error);
          // Fallback to main thread processing
          const plugin = this.plugins.get('postureAnalysis');
          if (plugin) {
            try {
              const featureResult = plugin.process(metrics);
              if (featureResult) {
                this.state.features.postureAnalysis = featureResult;
              }
            } catch (pluginError) {
              console.error('Posture analysis plugin processing error:', pluginError);
            }
          }
        });
        promises.push(promise);
      }
      
      // Wait for all analyses to complete
      await Promise.all(promises);
    } catch (error) {
      console.error('Web worker processing error, falling back to main thread:', error);
      // Fallback to main thread processing
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