import type { DeviceCapabilities, VisionTier } from './types';

export class DeviceCapabilityDetector {
  private static instance: DeviceCapabilityDetector;
  private capabilities: DeviceCapabilities | null = null;

  static getInstance(): DeviceCapabilityDetector {
    if (!DeviceCapabilityDetector.instance) {
      DeviceCapabilityDetector.instance = new DeviceCapabilityDetector();
    }
    return DeviceCapabilityDetector.instance;
  }

  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const capabilities: DeviceCapabilities = {
      cpuCores: this.detectCPUCores(),
      gpuSupport: await this.detectGPUSupport(),
      wasmSupport: this.detectWASMSupport(),
      cameraResolution: await this.detectCameraCapabilities(),
      batteryLevel: await this.getBatteryLevel(),
      thermalState: await this.getThermalState(),
      isMobile: this.detectMobile(),
      isLowPowerMode: await this.detectLowPowerMode()
    };

    this.capabilities = capabilities;
    return capabilities;
  }

  determineOptimalTier(capabilities: DeviceCapabilities): VisionTier {
    const { cpuCores, gpuSupport, wasmSupport, isMobile, isLowPowerMode } = capabilities;

    // Emergency fallback for low power mode
    if (isLowPowerMode) {
      return 'basic';
    }

    // Premium tier: High-end devices
    if (cpuCores >= 8 && gpuSupport && wasmSupport && !isMobile) {
      return 'premium';
    }

    // Premium mobile: High-end phones/tablets
    if (cpuCores >= 6 && gpuSupport && wasmSupport && isMobile) {
      return 'premium';
    }

    // Standard tier: Mid-range devices
    if (cpuCores >= 4 && wasmSupport) {
      return 'standard';
    }

    // Basic tier: Older/budget devices
    return 'basic';
  }

  private detectCPUCores(): number {
    return navigator.hardwareConcurrency || 4; // Default to 4 if unknown
  }

  private async detectGPUSupport(): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) return false;

      // Check for WebGL extensions that indicate good GPU support
      const extensions = [
        'OES_texture_float',
        'OES_texture_half_float',
        'WEBGL_color_buffer_float'
      ];

      return extensions.some(ext => gl.getExtension(ext) !== null);
    } catch {
      return false;
    }
  }

  private detectWASMSupport(): boolean {
    try {
      return typeof WebAssembly === 'object' && 
             typeof WebAssembly.instantiate === 'function';
    } catch {
      return false;
    }
  }

  private async detectCameraCapabilities(): Promise<string> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) return 'none';

      // Try to get capabilities of the first camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1920, height: 1080 } 
      });
      
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      // Clean up
      track.stop();
      
      const maxWidth = capabilities.width?.max || 640;
      const maxHeight = capabilities.height?.max || 480;
      
      if (maxWidth >= 1920) return 'high';
      if (maxWidth >= 1280) return 'medium';
      return 'low';
    } catch {
      return 'none';
    }
  }

  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level;
      }
    } catch {
      // Battery API not supported
    }
    return undefined;
  }

  private async getThermalState(): Promise<DeviceCapabilities['thermalState']> {
    // This is a future API, not widely supported yet
    // For now, we'll infer from other metrics
    const batteryLevel = await this.getBatteryLevel();
    
    if (batteryLevel !== undefined && batteryLevel < 0.2) {
      return 'fair'; // Low battery might indicate thermal issues
    }
    
    return 'nominal';
  }

  private detectMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private async detectLowPowerMode(): Promise<boolean> {
    try {
      const batteryLevel = await this.getBatteryLevel();
      
      // iOS Low Power Mode detection (heuristic)
      if (batteryLevel !== undefined && batteryLevel < 0.2) {
        // Additional checks could be added here
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  // Utility method to refresh capabilities (e.g., when battery state changes)
  async refreshCapabilities(): Promise<DeviceCapabilities> {
    this.capabilities = null;
    return this.detectCapabilities();
  }
}
