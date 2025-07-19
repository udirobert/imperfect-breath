/**
 * Mobile-Optimized Camera Management System
 * 
 * Handles camera initialization, optimization, and performance management
 * specifically designed for mobile devices with battery and performance awareness.
 */

import { useIsMobile } from "@/hooks/use-mobile";

export interface MobileCameraConfig {
  // Video constraints optimized for mobile
  video: {
    width: { ideal: number; max: number };
    height: { ideal: number; max: number };
    frameRate: { ideal: number; max: number };
    facingMode: 'user' | 'environment';
  };
  
  // Performance settings
  performance: {
    processingInterval: number; // ms between frame processing
    maxProcessingTime: number; // max time per frame processing
    batteryOptimized: boolean;
    adaptiveQuality: boolean;
  };
  
  // Mobile-specific features
  mobile: {
    autoRotation: boolean;
    touchToFocus: boolean;
    pinchToZoom: boolean;
    orientationLock: boolean;
  };
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  supportsConstraints: boolean;
  maxResolution: { width: number; height: number };
  supportedFrameRates: number[];
  batteryLevel?: number;
  isLowPowerMode?: boolean;
}

export interface CameraMetrics {
  fps: number;
  processingTime: number;
  droppedFrames: number;
  batteryImpact: 'low' | 'medium' | 'high';
  thermalState: 'normal' | 'fair' | 'serious' | 'critical';
}

export class MobileCameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private config: MobileCameraConfig;
  private capabilities: CameraCapabilities | null = null;
  private metrics: CameraMetrics;
  private isInitialized = false;
  private processingInterval: number | null = null;
  private performanceMonitor: PerformanceMonitor;

  constructor(config?: Partial<MobileCameraConfig>) {
    this.config = this.getOptimalConfig(config);
    this.metrics = {
      fps: 0,
      processingTime: 0,
      droppedFrames: 0,
      batteryImpact: 'low',
      thermalState: 'normal',
    };
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Initialize camera with mobile-optimized settings
   */
  async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      this.videoElement = videoElement;
      
      // Check capabilities first
      this.capabilities = await this.detectCapabilities();
      if (!this.capabilities.hasCamera) {
        throw new Error('No camera available');
      }

      // Request camera with optimized constraints
      const constraints = this.buildConstraints();
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Configure video element
      this.setupVideoElement();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      return true;
      
    } catch (error) {
      console.error('Camera initialization failed:', error);
      return false;
    }
  }

  /**
   * Detect device camera capabilities
   */
  private async detectCapabilities(): Promise<CameraCapabilities> {
    const capabilities: CameraCapabilities = {
      hasCamera: false,
      hasFrontCamera: false,
      hasBackCamera: false,
      supportsConstraints: false,
      maxResolution: { width: 640, height: 480 },
      supportedFrameRates: [15, 30],
    };

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        return capabilities;
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      capabilities.hasCamera = videoDevices.length > 0;
      capabilities.hasFrontCamera = videoDevices.some(device => 
        device.label.toLowerCase().includes('front') || 
        device.label.toLowerCase().includes('user')
      );
      capabilities.hasBackCamera = videoDevices.some(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment')
      );

      // Test constraints support
      if (capabilities.hasCamera) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 30 }
          });
          
          const track = testStream.getVideoTracks()[0];
          const settings = track.getSettings();
          
          capabilities.maxResolution = {
            width: settings.width || 640,
            height: settings.height || 480,
          };
          
          capabilities.supportsConstraints = true;
          testStream.getTracks().forEach(track => track.stop());
          
        } catch {
          // Fallback to basic constraints
          capabilities.supportsConstraints = false;
        }
      }

      // Get battery info if available
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        capabilities.batteryLevel = battery.level;
        capabilities.isLowPowerMode = battery.level < 0.2;
      }

    } catch (error) {
      console.warn('Capability detection failed:', error);
    }

    return capabilities;
  }

  /**
   * Build optimal camera constraints for mobile
   */
  private buildConstraints(): MediaStreamConstraints {
    if (!this.capabilities) {
      throw new Error('Capabilities not detected');
    }

    const isMobile = this.detectMobileDevice();
    const isLowPower = this.capabilities.isLowPowerMode || this.capabilities.batteryLevel < 0.3;

    // Adaptive resolution based on device capabilities and power state
    let targetWidth = 640;
    let targetHeight = 480;
    let targetFrameRate = 15;

    if (!isLowPower && this.capabilities.supportsConstraints) {
      if (this.capabilities.maxResolution.width >= 1280) {
        targetWidth = isMobile ? 720 : 1280;
        targetHeight = isMobile ? 480 : 720;
        targetFrameRate = isMobile ? 20 : 30;
      } else if (this.capabilities.maxResolution.width >= 720) {
        targetWidth = 720;
        targetHeight = 480;
        targetFrameRate = 20;
      }
    }

    return {
      video: {
        width: { ideal: targetWidth, max: this.capabilities.maxResolution.width },
        height: { ideal: targetHeight, max: this.capabilities.maxResolution.height },
        frameRate: { ideal: targetFrameRate, max: 30 },
        facingMode: this.config.video.facingMode,
        // Mobile-specific optimizations
        ...(isMobile && {
          aspectRatio: 4/3, // Better for mobile screens
          resizeMode: 'crop-and-scale',
        }),
      },
      audio: false, // Disable audio for better performance
    };
  }

  /**
   * Setup video element with mobile optimizations
   */
  private setupVideoElement(): void {
    if (!this.videoElement || !this.stream) return;

    this.videoElement.srcObject = this.stream;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true; // Prevent fullscreen on iOS
    this.videoElement.muted = true;
    
    // Mobile-specific attributes
    this.videoElement.setAttribute('webkit-playsinline', 'true');
    this.videoElement.setAttribute('playsinline', 'true');
    
    // Optimize for performance
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.style.transform = 'scaleX(-1)'; // Mirror for front camera
    
    // Handle orientation changes
    if (this.config.mobile.autoRotation) {
      this.setupOrientationHandling();
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceMonitor.start();
    
    // Monitor every 5 seconds
    setInterval(() => {
      this.updateMetrics();
      this.adaptPerformance();
    }, 5000);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const stats = this.performanceMonitor.getStats();
    
    this.metrics = {
      fps: stats.fps,
      processingTime: stats.averageProcessingTime,
      droppedFrames: stats.droppedFrames,
      batteryImpact: this.calculateBatteryImpact(stats),
      thermalState: this.detectThermalState(),
    };
  }

  /**
   * Adapt performance based on current metrics
   */
  private adaptPerformance(): void {
    if (!this.config.performance.adaptiveQuality) return;

    const { fps, processingTime, thermalState } = this.metrics;
    
    // Reduce quality if performance is poor
    if (fps < 10 || processingTime > 100 || thermalState === 'serious') {
      this.reduceQuality();
    }
    
    // Increase quality if performance is good
    else if (fps > 25 && processingTime < 50 && thermalState === 'normal') {
      this.increaseQuality();
    }
  }

  /**
   * Reduce camera quality for better performance
   */
  private reduceQuality(): void {
    if (!this.stream) return;

    const track = this.stream.getVideoTracks()[0];
    if (!track) return;

    const currentSettings = track.getSettings();
    const newWidth = Math.max(320, (currentSettings.width || 640) * 0.8);
    const newHeight = Math.max(240, (currentSettings.height || 480) * 0.8);
    const newFrameRate = Math.max(10, (currentSettings.frameRate || 15) * 0.8);

    track.applyConstraints({
      width: newWidth,
      height: newHeight,
      frameRate: newFrameRate,
    }).catch(console.warn);

    // Increase processing interval
    this.config.performance.processingInterval = Math.min(500, 
      this.config.performance.processingInterval * 1.2
    );
  }

  /**
   * Increase camera quality when performance allows
   */
  private increaseQuality(): void {
    if (!this.stream || !this.capabilities) return;

    const track = this.stream.getVideoTracks()[0];
    if (!track) return;

    const currentSettings = track.getSettings();
    const maxWidth = this.capabilities.maxResolution.width;
    const maxHeight = this.capabilities.maxResolution.height;
    
    const newWidth = Math.min(maxWidth, (currentSettings.width || 640) * 1.1);
    const newHeight = Math.min(maxHeight, (currentSettings.height || 480) * 1.1);
    const newFrameRate = Math.min(30, (currentSettings.frameRate || 15) * 1.1);

    track.applyConstraints({
      width: newWidth,
      height: newHeight,
      frameRate: newFrameRate,
    }).catch(console.warn);

    // Decrease processing interval
    this.config.performance.processingInterval = Math.max(50, 
      this.config.performance.processingInterval * 0.9
    );
  }

  /**
   * Handle device orientation changes
   */
  private setupOrientationHandling(): void {
    if (!this.videoElement) return;

    const handleOrientationChange = () => {
      // Adjust video element based on orientation
      const orientation = screen.orientation?.angle || 0;
      
      if (this.videoElement) {
        this.videoElement.style.transform = `scaleX(-1) rotate(${orientation}deg)`;
      }
    };

    screen.orientation?.addEventListener('change', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
  }

  /**
   * Get current camera frame for processing
   */
  getFrame(): ImageData | null {
    if (!this.videoElement || !this.isInitialized) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    ctx.drawImage(this.videoElement, 0, 0);
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(): Promise<boolean> {
    if (!this.capabilities?.hasFrontCamera || !this.capabilities?.hasBackCamera) {
      return false;
    }

    const newFacingMode = this.config.video.facingMode === 'user' ? 'environment' : 'user';
    this.config.video.facingMode = newFacingMode;

    // Restart with new facing mode
    await this.stop();
    return await this.initialize(this.videoElement!);
  }

  /**
   * Stop camera and cleanup
   */
  async stop(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.performanceMonitor.stop();
    this.isInitialized = false;
  }

  /**
   * Get current metrics
   */
  getMetrics(): CameraMetrics {
    return { ...this.metrics };
  }

  /**
   * Get camera capabilities
   */
  getCapabilities(): CameraCapabilities | null {
    return this.capabilities;
  }

  // Utility methods
  private detectMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private calculateBatteryImpact(stats: any): 'low' | 'medium' | 'high' {
    const { fps, averageProcessingTime } = stats;
    
    if (fps > 25 && averageProcessingTime > 50) return 'high';
    if (fps > 15 && averageProcessingTime > 30) return 'medium';
    return 'low';
  }

  private detectThermalState(): 'normal' | 'fair' | 'serious' | 'critical' {
    // Estimate thermal state based on performance degradation
    const { fps, processingTime } = this.metrics;
    
    if (fps < 5 || processingTime > 200) return 'critical';
    if (fps < 10 || processingTime > 100) return 'serious';
    if (fps < 15 || processingTime > 50) return 'fair';
    return 'normal';
  }

  private getOptimalConfig(userConfig?: Partial<MobileCameraConfig>): MobileCameraConfig {
    const isMobile = this.detectMobileDevice();
    
    const defaultConfig: MobileCameraConfig = {
      video: {
        width: { ideal: isMobile ? 640 : 1280, max: 1920 },
        height: { ideal: isMobile ? 480 : 720, max: 1080 },
        frameRate: { ideal: isMobile ? 15 : 30, max: 30 },
        facingMode: 'user',
      },
      performance: {
        processingInterval: isMobile ? 200 : 100,
        maxProcessingTime: isMobile ? 50 : 100,
        batteryOptimized: isMobile,
        adaptiveQuality: true,
      },
      mobile: {
        autoRotation: isMobile,
        touchToFocus: isMobile,
        pinchToZoom: false, // Disabled for breathing sessions
        orientationLock: false,
      },
    };

    return { ...defaultConfig, ...userConfig };
  }
}

/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
  private startTime = 0;
  private frameCount = 0;
  private processingTimes: number[] = [];
  private droppedFrames = 0;
  private isRunning = false;

  start(): void {
    this.startTime = performance.now();
    this.frameCount = 0;
    this.processingTimes = [];
    this.droppedFrames = 0;
    this.isRunning = true;
  }

  recordFrame(processingTime: number): void {
    if (!this.isRunning) return;

    this.frameCount++;
    this.processingTimes.push(processingTime);
    
    // Keep only last 100 measurements
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    // Detect dropped frames (processing time > 33ms for 30fps)
    if (processingTime > 33) {
      this.droppedFrames++;
    }
  }

  getStats() {
    const elapsed = performance.now() - this.startTime;
    const fps = this.frameCount / (elapsed / 1000);
    const averageProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    return {
      fps,
      averageProcessingTime,
      droppedFrames: this.droppedFrames,
      totalFrames: this.frameCount,
    };
  }

  stop(): void {
    this.isRunning = false;
  }
}

/**
 * React hook for mobile camera management
 */
export const useMobileCameraManager = (config?: Partial<MobileCameraConfig>) => {
  const isMobile = useIsMobile();
  const [manager] = React.useState(() => new MobileCameraManager(config));
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [metrics, setMetrics] = React.useState<CameraMetrics | null>(null);
  const [capabilities, setCapabilities] = React.useState<CameraCapabilities | null>(null);

  React.useEffect(() => {
    return () => {
      manager.stop();
    };
  }, [manager]);

  const initialize = React.useCallback(async (videoElement: HTMLVideoElement) => {
    const success = await manager.initialize(videoElement);
    setIsInitialized(success);
    
    if (success) {
      setCapabilities(manager.getCapabilities());
      
      // Update metrics periodically
      const interval = setInterval(() => {
        setMetrics(manager.getMetrics());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [manager]);

  const stop = React.useCallback(async () => {
    await manager.stop();
    setIsInitialized(false);
    setMetrics(null);
  }, [manager]);

  return {
    manager,
    isInitialized,
    metrics,
    capabilities,
    initialize,
    stop,
    switchCamera: manager.switchCamera.bind(manager),
    getFrame: manager.getFrame.bind(manager),
    isMobileOptimized: isMobile,
  };
};