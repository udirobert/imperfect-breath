import type { 
  IVisionSystem, 
  VisionTier, 
  VisionConfig, 
  VisionMetrics, 
  PerformanceMode,
  DeviceCapabilities,
  PerformanceMetrics
} from './types';

import { DeviceCapabilityDetector } from './device-detector';
import { VisionConfigManager } from './config-manager';
import { PerformanceMonitor } from './performance-monitor';
import { EnhancedModelLoader } from './enhanced-model-loader';
import { BasicVisionSystem } from './systems/basic-vision';
import { startTimer } from '../utils/performance-utils';
import { handleError, createError } from '../utils/error-utils';
import { getCache } from '../utils/cache-utils';

export class EnhancedVisionManager {
  private static instance: EnhancedVisionManager;
  
  // Core components
  private deviceDetector: DeviceCapabilityDetector;
  private configManager: VisionConfigManager;
  private performanceMonitor: PerformanceMonitor;
  private modelLoader: EnhancedModelLoader;
  
  // Current state
  private currentSystem: IVisionSystem | null = null;
  private currentTier: VisionTier = 'loading';
  private currentMode: PerformanceMode = 'auto';
  private isInitialized = false;
  private videoStream: MediaStream | null = null;
  
  // Performance tracking
  private lastOperationMetrics: Record<string, number> = {};

  // Event callbacks
  private onTierChangeCallbacks: Array<(tier: VisionTier) => void> = [];
  private onMetricsCallbacks: Array<(metrics: VisionMetrics) => void> = [];
  private onErrorCallbacks: Array<(error: Error) => void> = [];

  static getInstance(): EnhancedVisionManager {
    if (!EnhancedVisionManager.instance) {
      EnhancedVisionManager.instance = new EnhancedVisionManager();
    }
    return EnhancedVisionManager.instance;
  }

  constructor() {
    this.deviceDetector = DeviceCapabilityDetector.getInstance();
    this.configManager = VisionConfigManager.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.modelLoader = EnhancedModelLoader.getInstance();
  }

  /**
   * Initialize the vision system with performance monitoring
   */
  async initialize(mode: PerformanceMode = 'auto'): Promise<VisionTier> {
    const endTimer = startTimer('VisionManager.initialize');
    
    try {
      this.currentMode = mode;
      
      // Cache key for storing capabilities
      const capabilitiesCacheKey = 'vision_capabilities';
      const cache = getCache();
      
      // Check cache for recent capabilities detection
      let capabilities: DeviceCapabilities;
      const cachedCapabilities = cache.get<DeviceCapabilities>(capabilitiesCacheKey);
      
      if (cachedCapabilities) {
        console.log('Using cached device capabilities');
        capabilities = cachedCapabilities;
      } else {
        // Detect device capabilities with timing
        const capTimer = startTimer('VisionManager.detectCapabilities');
        capabilities = await this.deviceDetector.detectCapabilities();
        const capTime = capTimer();
        this.lastOperationMetrics['detectCapabilities'] = capTime;
        
        console.log(`Device capabilities detected in ${capTime.toFixed(2)}ms:`, capabilities);
        
        // Cache capabilities for 5 minutes
        cache.set(capabilitiesCacheKey, capabilities, 5 * 60 * 1000);
      }
      
      // Determine optimal tier
      let optimalTier = this.deviceDetector.determineOptimalTier(capabilities);
      
      // Override tier based on mode
      if (mode === 'performance') {
        optimalTier = 'basic'; // Force basic tier for performance mode
      }
      
      // Generate configuration
      const configTimer = startTimer('VisionManager.generateConfig');
      const config = this.configManager.generateConfig(capabilities, optimalTier, mode);
      this.lastOperationMetrics['generateConfig'] = configTimer();
      
      // Initialize vision system for the determined tier
      const initTimer = startTimer('VisionManager.initializeVisionSystem');
      await this.initializeVisionSystem(optimalTier, config);
      this.lastOperationMetrics['initializeVisionSystem'] = initTimer();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      // Preload models based on connection
      const preloadTimer = startTimer('VisionManager.preloadModels');
      await this.modelLoader.preloadBasedOnConnection();
      this.lastOperationMetrics['preloadModels'] = preloadTimer();
      
      this.currentTier = optimalTier;
      this.isInitialized = true;
      
      console.log(`Vision system initialized with tier: ${optimalTier}`);
      this.notifyTierChange(optimalTier);
      
      return optimalTier;
    } catch (error) {
      console.error('Failed to initialize vision system:', error);
      this.currentTier = 'none';
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
      return 'none';
    } finally {
      const duration = endTimer();
      console.log(`Vision system initialization completed in ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Start vision processing with performance monitoring
   */
  async startVision(videoStream: MediaStream): Promise<void> {
    const endTimer = startTimer('VisionManager.startVision');
    
    try {
      if (!this.isInitialized || !this.currentSystem) {
        throw createError(
          'VISION_NOT_INITIALIZED',
          'Vision system not initialized',
          { isInitialized: this.isInitialized }
        );
      }

      this.videoStream = videoStream;
      
      // Start the current vision system
      if (typeof (this.currentSystem as any).startProcessing === 'function') {
        const startTimer = performance.now();
        await (this.currentSystem as any).startProcessing(videoStream);
        this.lastOperationMetrics['startProcessing'] = performance.now() - startTimer;
      }
      
      // Start performance monitoring
      this.performanceMonitor.startMonitoring();
      
      console.log('Vision processing started');
    } catch (error) {
      throw handleError('start vision processing', error);
    } finally {
      endTimer();
    }
  }

  /**
   * Stop vision processing with cleanup
   */
  async stopVision(): Promise<void> {
    const endTimer = startTimer('VisionManager.stopVision');
    
    try {
      if (this.currentSystem && typeof (this.currentSystem as any).stopProcessing === 'function') {
        await (this.currentSystem as any).stopProcessing();
      }
      
      this.performanceMonitor.stopMonitoring();
      
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => track.stop());
        this.videoStream = null;
      }
      
      console.log('Vision processing stopped');
    } catch (error) {
      throw handleError('stop vision processing', error);
    } finally {
      endTimer();
    }
  }

  /**
   * Get vision metrics with error handling
   */
  async getMetrics(): Promise<VisionMetrics | null> {
    const endTimer = startTimer('VisionManager.getMetrics');
    
    try {
      if (!this.currentSystem) {
        return null;
      }

      const metrics = await this.currentSystem.getMetrics();
      this.notifyMetrics(metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting vision metrics:', error);
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      endTimer();
    }
  }

  /**
   * Get current tier
   */
  getCurrentTier(): VisionTier {
    return this.currentTier;
  }

  /**
   * Get current performance mode
   */
  getCurrentMode(): PerformanceMode {
    return this.currentMode;
  }

  /**
   * Switch performance mode with monitoring
   */
  async switchMode(mode: PerformanceMode): Promise<VisionTier> {
    const endTimer = startTimer('VisionManager.switchMode');
    
    try {
      if (mode === this.currentMode) {
        return this.currentTier;
      }

      console.log(`Switching vision mode from ${this.currentMode} to ${mode}`);
      
      const wasRunning = this.videoStream !== null;
      const currentStream = this.videoStream;
      
      // Stop current processing
      if (wasRunning) {
        const stopTimer = startTimer('VisionManager.switchMode.stopVision');
        await this.stopVision();
        this.lastOperationMetrics['switchMode.stopVision'] = stopTimer();
      }
      
      // Reinitialize with new mode
      const initTimer = startTimer('VisionManager.switchMode.initialize');
      const newTier = await this.initialize(mode);
      this.lastOperationMetrics['switchMode.initialize'] = initTimer();
      
      // Restart if it was running
      if (wasRunning && currentStream) {
        const restartTimer = startTimer('VisionManager.switchMode.restart');
        await this.startVision(currentStream);
        this.lastOperationMetrics['switchMode.restart'] = restartTimer();
      }
      
      return newTier;
    } catch (error) {
      throw handleError(`switch vision mode to ${mode}`, error);
    } finally {
      endTimer();
    }
  }

  /**
   * Switch vision tier with performance monitoring
   */
  async switchTier(tier: VisionTier): Promise<void> {
    const endTimer = startTimer('VisionManager.switchTier');
    
    try {
      if (tier === this.currentTier) {
        return;
      }

      console.log(`Switching vision tier from ${this.currentTier} to ${tier}`);
      
      const wasRunning = this.videoStream !== null;
      const currentStream = this.videoStream;
      
      // Stop current processing
      if (wasRunning) {
        const stopTimer = startTimer('VisionManager.switchTier.stopVision');
        await this.stopVision();
        this.lastOperationMetrics['switchTier.stopVision'] = stopTimer();
      }
      
      // Dispose current system
      if (this.currentSystem) {
        const disposeTimer = startTimer('VisionManager.switchTier.dispose');
        await this.currentSystem.dispose();
        this.lastOperationMetrics['switchTier.dispose'] = disposeTimer();
      }
      
      // Get current capabilities and generate new config
      const capabilitiesTimer = startTimer('VisionManager.switchTier.detectCapabilities');
      const capabilities = await this.deviceDetector.detectCapabilities();
      this.lastOperationMetrics['switchTier.detectCapabilities'] = capabilitiesTimer();
      
      const configTimer = startTimer('VisionManager.switchTier.generateConfig');
      const config = this.configManager.generateConfig(capabilities, tier, this.currentMode);
      this.lastOperationMetrics['switchTier.generateConfig'] = configTimer();
      
      // Initialize new system
      const initTimer = startTimer('VisionManager.switchTier.initializeSystem');
      await this.initializeVisionSystem(tier, config);
      this.lastOperationMetrics['switchTier.initializeSystem'] = initTimer();
      
      this.currentTier = tier;
      this.notifyTierChange(tier);
      
      // Restart if it was running
      if (wasRunning && currentStream) {
        const restartTimer = startTimer('VisionManager.switchTier.restart');
        await this.startVision(currentStream);
        this.lastOperationMetrics['switchTier.restart'] = restartTimer();
      }
    } catch (error) {
      throw handleError(`switch vision tier to ${tier}`, error);
    } finally {
      endTimer();
    }
  }

  // Event subscription methods
  onTierChange(callback: (tier: VisionTier) => void): void {
    this.onTierChangeCallbacks.push(callback);
  }

  onMetrics(callback: (metrics: VisionMetrics) => void): void {
    this.onMetricsCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * Refresh device capabilities with caching
   */
  async refreshCapabilities(): Promise<void> {
    const endTimer = startTimer('VisionManager.refreshCapabilities');
    
    try {
      const capabilitiesTimer = startTimer('VisionManager.refreshCapabilities.detect');
      const newCapabilities = await this.deviceDetector.refreshCapabilities();
      this.lastOperationMetrics['refreshCapabilities.detect'] = capabilitiesTimer();
      
      const determineTimer = startTimer('VisionManager.refreshCapabilities.determineTier');
      const newOptimalTier = this.deviceDetector.determineOptimalTier(newCapabilities);
      this.lastOperationMetrics['refreshCapabilities.determineTier'] = determineTimer();
      
      // Cache new capabilities
      getCache().set('vision_capabilities', newCapabilities, 5 * 60 * 1000);
      
      if (newOptimalTier !== this.currentTier && this.currentMode === 'auto') {
        const switchTimer = startTimer('VisionManager.refreshCapabilities.switchTier');
        await this.switchTier(newOptimalTier);
        this.lastOperationMetrics['refreshCapabilities.switchTier'] = switchTimer();
      }
    } catch (error) {
      throw handleError('refresh capabilities', error);
    } finally {
      endTimer();
    }
  }

  /**
   * Get loaded models
   */
  getLoadedModels(): string[] {
    return this.modelLoader.getLoadedModels();
  }

  /**
   * Get total model cache size
   */
  getTotalModelCacheSize(): string {
    return this.modelLoader.getTotalCacheSize();
  }

  /**
   * Clear model cache with performance monitoring
   */
  async clearModelCache(): Promise<void> {
    const endTimer = startTimer('VisionManager.clearModelCache');
    
    try {
      await this.modelLoader.clearCache();
    } catch (error) {
      throw handleError('clear model cache', error);
    } finally {
      endTimer();
    }
  }

  /**
   * Dispose vision manager with cleanup
   */
  async dispose(): Promise<void> {
    const endTimer = startTimer('VisionManager.dispose');
    
    try {
      await this.stopVision();
      
      if (this.currentSystem) {
        await this.currentSystem.dispose();
        this.currentSystem = null;
      }
      
      await this.clearModelCache();
      
      this.isInitialized = false;
      this.currentTier = 'none';
      
      console.log('Vision manager disposed');
    } catch (error) {
      throw handleError('dispose vision manager', error);
    } finally {
      endTimer();
    }
  }

  /**
   * Get performance metrics for recent operations
   */
  getOperationMetrics(): Record<string, number> {
    return { ...this.lastOperationMetrics };
  }

  /**
   * Initialize vision system with performance monitoring
   */
  private async initializeVisionSystem(tier: VisionTier, config: VisionConfig): Promise<void> {
    const endTimer = startTimer('VisionManager.initializeVisionSystem');
    
    try {
      // Dispose existing system
      if (this.currentSystem) {
        const disposeTimer = startTimer('VisionManager.initializeVisionSystem.dispose');
        await this.currentSystem.dispose();
        this.lastOperationMetrics['initializeVisionSystem.dispose'] = disposeTimer();
      }

      // Create new system based on tier
      const createTimer = startTimer('VisionManager.initializeVisionSystem.createSystem');
      
      try {
        switch (tier) {
          case 'basic':
            this.currentSystem = new BasicVisionSystem();
            break;
          case 'standard':
            try {
              // Try to import standard system
              const standardModule = await import('./systems/standard-vision.js').catch(() => null);
              if (standardModule) {
                this.currentSystem = new standardModule.StandardVisionSystem();
              } else {
                // Fallback to basic if module not available
                console.warn('Standard vision system not available, falling back to basic');
                this.currentSystem = new BasicVisionSystem();
              }
            } catch (error) {
              console.warn('Error loading standard vision system, falling back to basic:', error);
              this.currentSystem = new BasicVisionSystem();
            }
            break;
          case 'premium':
            try {
              // Try to import premium system
              const premiumModule = await import('./systems/premium-vision.js').catch(() => null);
              if (premiumModule) {
                this.currentSystem = new premiumModule.PremiumVisionSystem();
              } else {
                // Fallback to standard or basic if module not available
                console.warn('Premium vision system not available, falling back to standard or basic');
                
                // Try standard as fallback
                const standardModule = await import('./systems/standard-vision.js').catch(() => null);
                if (standardModule) {
                  this.currentSystem = new standardModule.StandardVisionSystem();
                } else {
                  // Ultimate fallback to basic
                  this.currentSystem = new BasicVisionSystem();
                }
              }
            } catch (error) {
              console.warn('Error loading premium vision system, falling back to basic:', error);
              this.currentSystem = new BasicVisionSystem();
            }
            break;
          case 'none':
            this.currentSystem = null;
            return;
          default:
            throw createError(
              'UNSUPPORTED_VISION_TIER',
              `Unsupported vision tier: ${tier}`,
              { availableTiers: ['basic', 'standard', 'premium', 'none'] }
            );
        }
      } catch (error) {
        console.error('Error creating vision system, falling back to basic:', error);
        // Final fallback to basic in case of any other errors
        this.currentSystem = new BasicVisionSystem();
      }
      this.lastOperationMetrics['initializeVisionSystem.createSystem'] = createTimer();

      // Update system config and initialize
      if (this.currentSystem) {
        const configTimer = startTimer('VisionManager.initializeVisionSystem.updateConfig');
        await this.currentSystem.updateConfig(config);
        this.lastOperationMetrics['initializeVisionSystem.updateConfig'] = configTimer();
        
        const initTimer = startTimer('VisionManager.initializeVisionSystem.initialize');
        await this.currentSystem.initialize();
        this.lastOperationMetrics['initializeVisionSystem.initialize'] = initTimer();
      }
    } catch (error) {
      throw handleError(`initialize vision system for tier ${tier}`, error);
    } finally {
      endTimer();
    }
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    this.performanceMonitor.onPerformanceChange(async (metrics: PerformanceMetrics) => {
      // Auto-adapt based on performance if in auto mode
      if (this.currentMode === 'auto') {
        const adaptTimer = startTimer('VisionManager.adaptToPerformance');
        await this.adaptToPerformance(metrics);
        this.lastOperationMetrics['adaptToPerformance'] = adaptTimer();
      }
    });
  }

  /**
   * Adapt to performance metrics
   */
  private async adaptToPerformance(metrics: PerformanceMetrics): Promise<void> {
    try {
      const performanceScore = this.calculatePerformanceScore(metrics);
      
      // Severe performance issues - downgrade tier
      if (performanceScore < 30 && this.currentTier !== 'basic') {
        console.log('Poor performance detected, downgrading to basic tier');
        await this.switchTier('basic');
      }
      // Good performance and not at premium - consider upgrade
      else if (performanceScore > 80 && this.currentTier === 'basic') {
        const capabilities = await this.deviceDetector.detectCapabilities();
        const optimalTier = this.deviceDetector.determineOptimalTier(capabilities);
        
        if (optimalTier !== 'basic') {
          console.log('Good performance detected, upgrading tier');
          await this.switchTier('standard');
        }
      }
      // Adapt configuration for current performance
      else {
        this.configManager.adaptForPerformance({
          cpuUsage: metrics.cpuUsage,
          frameDrops: metrics.frameDrops
        });
      }
    } catch (error) {
      console.error('Error adapting to performance:', error);
    }
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // Calculate composite performance score (0-100, higher is better)
    const cpuScore = Math.max(0, 100 - metrics.cpuUsage);
    const memoryScore = Math.max(0, 100 - metrics.memoryUsage);
    const frameScore = Math.max(0, 100 - (metrics.frameDrops * 10));
    const batteryScore = Math.max(0, 100 - metrics.batteryImpact);
    
    return (cpuScore * 0.3 + memoryScore * 0.2 + frameScore * 0.3 + batteryScore * 0.2);
  }

  // Notification methods
  private notifyTierChange(tier: VisionTier): void {
    this.onTierChangeCallbacks.forEach(callback => {
      try {
        callback(tier);
      } catch (error) {
        console.error('Error in tier change callback:', error);
      }
    });
  }

  private notifyMetrics(metrics: VisionMetrics): void {
    this.onMetricsCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in metrics callback:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }
}