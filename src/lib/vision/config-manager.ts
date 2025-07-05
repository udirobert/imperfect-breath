import type { VisionConfig, VisionTier, DeviceCapabilities, PerformanceMode } from './types';

export class VisionConfigManager {
  private static instance: VisionConfigManager;
  private currentConfig: VisionConfig | null = null;

  static getInstance(): VisionConfigManager {
    if (!VisionConfigManager.instance) {
      VisionConfigManager.instance = new VisionConfigManager();
    }
    return VisionConfigManager.instance;
  }

  generateConfig(
    capabilities: DeviceCapabilities, 
    tier: VisionTier,
    mode: PerformanceMode = 'auto'
  ): VisionConfig {
    const baseConfig = this.getBaseConfigForTier(tier);
    const deviceOptimizations = this.getDeviceOptimizations(capabilities);
    const modeAdjustments = this.getModeAdjustments(mode, capabilities);

    const config: VisionConfig = {
      ...baseConfig,
      ...deviceOptimizations,
      ...modeAdjustments
    };

    this.currentConfig = config;
    return config;
  }

  getCurrentConfig(): VisionConfig | null {
    return this.currentConfig;
  }

  updateConfig(updates: Partial<VisionConfig>): VisionConfig {
    if (!this.currentConfig) {
      throw new Error('No current config to update. Generate config first.');
    }

    this.currentConfig = {
      ...this.currentConfig,
      ...updates
    };

    return this.currentConfig;
  }

  private getBaseConfigForTier(tier: VisionTier): Partial<VisionConfig> {
    const configs: Record<VisionTier, Partial<VisionConfig>> = {
      'basic': {
        tier: 'basic',
        processingInterval: 200, // 5 FPS
        frameSkipRatio: 6,
        maxConcurrentProcessing: 1,
        cameraConstraints: {
          video: {
            width: 640,
            height: 480,
            frameRate: 15
          }
        }
      },
      'standard': {
        tier: 'standard',
        processingInterval: 100, // 10 FPS
        frameSkipRatio: 3,
        maxConcurrentProcessing: 2,
        cameraConstraints: {
          video: {
            width: 1280,
            height: 720,
            frameRate: 24
          }
        }
      },
      'premium': {
        tier: 'premium',
        processingInterval: 66, // 15 FPS
        frameSkipRatio: 2,
        maxConcurrentProcessing: 3,
        cameraConstraints: {
          video: {
            width: 1920,
            height: 1080,
            frameRate: 30
          }
        }
      },
      'none': {
        tier: 'none',
        processingInterval: 0,
        frameSkipRatio: 0,
        maxConcurrentProcessing: 0,
        cameraConstraints: { video: false }
      },
      'loading': {
        tier: 'loading',
        processingInterval: 0,
        frameSkipRatio: 0,
        maxConcurrentProcessing: 0,
        cameraConstraints: { video: false }
      }
    };

    return configs[tier];
  }

  private getDeviceOptimizations(capabilities: DeviceCapabilities): Partial<VisionConfig> {
    const optimizations: Partial<VisionConfig> = {
      modelVariant: capabilities.isMobile ? 'mobile' : 'desktop',
      batteryOptimization: capabilities.isMobile || capabilities.isLowPowerMode
    };

    // Mobile-specific optimizations
    if (capabilities.isMobile) {
      optimizations.cameraConstraints = {
        video: {
          width: Math.min(1280, (optimizations.cameraConstraints?.video as any)?.width || 1280),
          height: Math.min(720, (optimizations.cameraConstraints?.video as any)?.height || 720),
          frameRate: Math.min(24, (optimizations.cameraConstraints?.video as any)?.frameRate || 24),
          facingMode: 'user' // Front camera for breathing exercises
        }
      };
    }

    // Low power mode optimizations
    if (capabilities.isLowPowerMode) {
      optimizations.processingInterval = Math.max(
        (optimizations.processingInterval || 100) * 2, 
        200
      );
      optimizations.frameSkipRatio = Math.max(
        (optimizations.frameSkipRatio || 3) * 2, 
        6
      );
      optimizations.maxConcurrentProcessing = 1;
    }

    // Battery level optimizations
    if (capabilities.batteryLevel !== undefined && capabilities.batteryLevel < 0.3) {
      optimizations.batteryOptimization = true;
      optimizations.processingInterval = Math.max(
        (optimizations.processingInterval || 100) * 1.5, 
        150
      );
    }

    return optimizations;
  }

  private getModeAdjustments(
    mode: PerformanceMode, 
    capabilities: DeviceCapabilities
  ): Partial<VisionConfig> {
    switch (mode) {
      case 'performance':
        return {
          processingInterval: 300, // 3.3 FPS
          frameSkipRatio: 10,
          maxConcurrentProcessing: 1,
          cameraConstraints: {
            video: {
              width: 640,
              height: 480,
              frameRate: 15
            }
          }
        };

      case 'quality':
        // Only allow quality mode on capable devices
        if (capabilities.cpuCores >= 6 && !capabilities.isLowPowerMode) {
          return {
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
        }
        // Fall back to auto mode for incapable devices
        return {};

      case 'auto':
      default:
        return {}; // Use tier-based defaults
    }
  }

  // Utility methods for dynamic config updates
  adaptForPerformance(performanceMetrics: { cpuUsage: number; frameDrops: number }): VisionConfig {
    if (!this.currentConfig) {
      throw new Error('No current config to adapt');
    }

    const updates: Partial<VisionConfig> = {};

    // High CPU usage - reduce processing
    if (performanceMetrics.cpuUsage > 80) {
      updates.processingInterval = Math.min(this.currentConfig.processingInterval * 1.5, 500);
      updates.frameSkipRatio = Math.min(this.currentConfig.frameSkipRatio * 2, 10);
    }

    // High frame drops - reduce quality
    if (performanceMetrics.frameDrops > 10) {
      const currentVideo = this.currentConfig.cameraConstraints.video as MediaTrackConstraints;
      updates.cameraConstraints = {
        video: {
          ...currentVideo,
          width: Math.max((currentVideo.width as number) * 0.8, 320),
          height: Math.max((currentVideo.height as number) * 0.8, 240),
          frameRate: Math.max((currentVideo.frameRate as number) * 0.8, 10)
        }
      };
    }

    return this.updateConfig(updates);
  }

  adaptForBattery(batteryLevel: number): VisionConfig {
    if (!this.currentConfig) {
      throw new Error('No current config to adapt');
    }

    const updates: Partial<VisionConfig> = {};

    if (batteryLevel < 0.2) {
      // Critical battery - minimal processing
      updates.processingInterval = 500; // 2 FPS
      updates.frameSkipRatio = 15;
      updates.maxConcurrentProcessing = 1;
    } else if (batteryLevel < 0.5) {
      // Low battery - reduced processing
      updates.processingInterval = Math.max(this.currentConfig.processingInterval * 1.3, 200);
      updates.frameSkipRatio = Math.min(this.currentConfig.frameSkipRatio * 1.5, 8);
    }

    return this.updateConfig(updates);
  }
}
