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
import { ModelLoader } from './model-loader';
import { BasicVisionSystem } from './systems/basic-vision';

export class VisionManager {
  private static instance: VisionManager;
  
  // Core components
  private deviceDetector: DeviceCapabilityDetector;
  private configManager: VisionConfigManager;
  private performanceMonitor: PerformanceMonitor;
  private modelLoader: ModelLoader;
  
  // Current state
  private currentSystem: IVisionSystem | null = null;
  private currentTier: VisionTier = 'loading';
  private currentMode: PerformanceMode = 'auto';
  private isInitialized = false;
  private videoStream: MediaStream | null = null;
  
  // Event callbacks
  private onTierChangeCallbacks: Array<(tier: VisionTier) => void> = [];
  private onMetricsCallbacks: Array<(metrics: VisionMetrics) => void> = [];
  private onErrorCallbacks: Array<(error: Error) => void> = [];

  static getInstance(): VisionManager {
    if (!VisionManager.instance) {
      VisionManager.instance = new VisionManager();
    }
    return VisionManager.instance;
  }

  constructor() {
    this.deviceDetector = DeviceCapabilityDetector.getInstance();
    this.configManager = VisionConfigManager.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.modelLoader = ModelLoader.getInstance();
  }

  async initialize(mode: PerformanceMode = 'auto'): Promise<VisionTier> {
    try {
      this.currentMode = mode;
      
      // Detect device capabilities
      const capabilities = await this.deviceDetector.detectCapabilities();
      console.log('Device capabilities detected:', capabilities);
      
      // Determine optimal tier
      let optimalTier = this.deviceDetector.determineOptimalTier(capabilities);
      
      // Override tier based on mode
      if (mode === 'performance') {
        optimalTier = 'basic'; // Force basic tier for performance mode
      }
      
      // Generate configuration
      const config = this.configManager.generateConfig(capabilities, optimalTier, mode);
      
      // Initialize vision system for the determined tier
      await this.initializeVisionSystem(optimalTier, config);
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      // Preload models based on connection
      await this.modelLoader.preloadBasedOnConnection();
      
      this.currentTier = optimalTier;
      this.isInitialized = true;
      
      console.log(`Vision system initialized with tier: ${optimalTier}`);
      this.notifyTierChange(optimalTier);
      
      return optimalTier;
    } catch (error) {
      console.error('Failed to initialize vision system:', error);
      this.currentTier = 'none';
      this.notifyError(error as Error);
      return 'none';
    }
  }

  async startVision(videoStream: MediaStream): Promise<void> {
    if (!this.isInitialized || !this.currentSystem) {
      throw new Error('Vision system not initialized');
    }

    this.videoStream = videoStream;
    
    // Start the current vision system
    if (typeof (this.currentSystem as any).startProcessing === 'function') {
      await (this.currentSystem as any).startProcessing(videoStream);
    }
    
    // Start performance monitoring
    this.performanceMonitor.startMonitoring();
    
    console.log('Vision processing started');
  }

  async stopVision(): Promise<void> {
    if (this.currentSystem && typeof (this.currentSystem as any).stopProcessing === 'function') {
      await (this.currentSystem as any).stopProcessing();
    }
    
    this.performanceMonitor.stopMonitoring();
    
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    
    console.log('Vision processing stopped');
  }

  async getMetrics(): Promise<VisionMetrics | null> {
    if (!this.currentSystem) {
      return null;
    }

    try {
      const metrics = await this.currentSystem.getMetrics();
      this.notifyMetrics(metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting vision metrics:', error);
      this.notifyError(error as Error);
      return null;
    }
  }

  getCurrentTier(): VisionTier {
    return this.currentTier;
  }

  getCurrentMode(): PerformanceMode {
    return this.currentMode;
  }

  async switchMode(mode: PerformanceMode): Promise<VisionTier> {
    if (mode === this.currentMode) {
      return this.currentTier;
    }

    console.log(`Switching vision mode from ${this.currentMode} to ${mode}`);
    
    const wasRunning = this.videoStream !== null;
    const currentStream = this.videoStream;
    
    // Stop current processing
    if (wasRunning) {
      await this.stopVision();
    }
    
    // Reinitialize with new mode
    const newTier = await this.initialize(mode);
    
    // Restart if it was running
    if (wasRunning && currentStream) {
      await this.startVision(currentStream);
    }
    
    return newTier;
  }

  async switchTier(tier: VisionTier): Promise<void> {
    if (tier === this.currentTier) {
      return;
    }

    console.log(`Switching vision tier from ${this.currentTier} to ${tier}`);
    
    const wasRunning = this.videoStream !== null;
    const currentStream = this.videoStream;
    
    // Stop current processing
    if (wasRunning) {
      await this.stopVision();
    }
    
    // Dispose current system
    if (this.currentSystem) {
      await this.currentSystem.dispose();
    }
    
    // Get current capabilities and generate new config
    const capabilities = await this.deviceDetector.detectCapabilities();
    const config = this.configManager.generateConfig(capabilities, tier, this.currentMode);
    
    // Initialize new system
    await this.initializeVisionSystem(tier, config);
    
    this.currentTier = tier;
    this.notifyTierChange(tier);
    
    // Restart if it was running
    if (wasRunning && currentStream) {
      await this.startVision(currentStream);
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

  // Utility methods
  async refreshCapabilities(): Promise<void> {
    const newCapabilities = await this.deviceDetector.refreshCapabilities();
    const newOptimalTier = this.deviceDetector.determineOptimalTier(newCapabilities);
    
    if (newOptimalTier !== this.currentTier && this.currentMode === 'auto') {
      await this.switchTier(newOptimalTier);
    }
  }

  getLoadedModels(): string[] {
    return this.modelLoader.getLoadedModels();
  }

  getTotalModelCacheSize(): string {
    return this.modelLoader.getTotalCacheSize();
  }

  async clearModelCache(): Promise<void> {
    await this.modelLoader.clearCache();
  }

  async dispose(): Promise<void> {
    await this.stopVision();
    
    if (this.currentSystem) {
      await this.currentSystem.dispose();
      this.currentSystem = null;
    }
    
    await this.clearModelCache();
    
    this.isInitialized = false;
    this.currentTier = 'none';
    
    console.log('Vision manager disposed');
  }

  private async initializeVisionSystem(tier: VisionTier, config: VisionConfig): Promise<void> {
    // Dispose existing system
    if (this.currentSystem) {
      await this.currentSystem.dispose();
    }

    // Create new system based on tier
    switch (tier) {
      case 'basic':
        this.currentSystem = new BasicVisionSystem();
        break;
      case 'standard':
        // Import and create standard system
        const { StandardVisionSystem } = await import('./systems/standard-vision');
        this.currentSystem = new StandardVisionSystem();
        break;
      case 'premium':
        // Import and create premium system
        const { PremiumVisionSystem } = await import('./systems/premium-vision');
        this.currentSystem = new PremiumVisionSystem();
        break;
      case 'none':
        this.currentSystem = null;
        return;
      default:
        throw new Error(`Unsupported vision tier: ${tier}`);
    }

    // Update system config and initialize
    if (this.currentSystem) {
      await this.currentSystem.updateConfig(config);
      await this.currentSystem.initialize();
    }
  }

  private setupPerformanceMonitoring(): void {
    this.performanceMonitor.onPerformanceChange(async (metrics: PerformanceMetrics) => {
      // Auto-adapt based on performance if in auto mode
      if (this.currentMode === 'auto') {
        await this.adaptToPerformance(metrics);
      }
    });
  }

  private async adaptToPerformance(metrics: PerformanceMetrics): Promise<void> {
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
  }

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
