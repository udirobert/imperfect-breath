/**
 * Unified Camera Manager
 * Centralized camera management and stream processing
 */

export interface CameraConfig {
  preferredDeviceId?: string;
  width: number;
  height: number;
  frameRate: number;
  facingMode?: 'user' | 'environment';
  enableAudio: boolean;
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasMultipleCameras: boolean;
  supportedResolutions: Array<{ width: number; height: number }>;
  supportedFrameRates: number[];
  deviceId: string;
  label: string;
}

export interface CameraState {
  isInitialized: boolean;
  isStreaming: boolean;
  currentDevice: string | null;
  currentStream: MediaStream | null;
  error: string | null;
  capabilities: CameraCapabilities | null;
}

export class CameraManager {
  private static instance: CameraManager | null = null;
  private state: CameraState = {
    isInitialized: false,
    isStreaming: false,
    currentDevice: null,
    currentStream: null,
    error: null,
    capabilities: null,
  };
  
  private videoElement: HTMLVideoElement | null = null;
  private streamListeners: Set<(stream: MediaStream | null) => void> = new Set();
  private stateListeners: Set<(state: CameraState) => void> = new Set();
  
  private constructor() {}
  
  /**
   * Singleton instance
   */
  static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager();
    }
    return CameraManager.instance;
  }
  
  /**
   * Initialize camera system
   */
  async initialize(): Promise<void> {
    try {
      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      // Get camera capabilities
      const capabilities = await this.getCameraCapabilities();
      
      this.updateState({
        isInitialized: true,
        capabilities,
        error: null,
      });
      
      console.log('Camera manager initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera initialization failed';
      this.updateState({
        error: errorMessage,
      });
      throw error;
    }
  }
  
  /**
   * Start camera stream
   */
  async startStream(config: Partial<CameraConfig> = {}): Promise<MediaStream> {
    if (!this.state.isInitialized) {
      await this.initialize();
    }
    
    const defaultConfig: CameraConfig = {
      width: 640,
      height: 480,
      frameRate: 30,
      facingMode: 'user',
      enableAudio: false,
      ...config,
    };
    
    try {
      // Stop existing stream if any
      if (this.state.currentStream) {
        this.stopStream();
      }
      
      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: defaultConfig.width },
          height: { ideal: defaultConfig.height },
          frameRate: { ideal: defaultConfig.frameRate },
          facingMode: defaultConfig.facingMode,
          deviceId: defaultConfig.preferredDeviceId ? 
            { exact: defaultConfig.preferredDeviceId } : undefined,
        },
        audio: defaultConfig.enableAudio,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      this.updateState({
        isStreaming: true,
        currentStream: stream,
        currentDevice: this.getDeviceIdFromStream(stream),
        error: null,
      });
      
      // Notify listeners
      this.notifyStreamListeners(stream);
      
      console.log('Camera stream started');
      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start camera stream';
      this.updateState({
        error: errorMessage,
        isStreaming: false,
      });
      throw error;
    }
  }
  
  /**
   * Stop camera stream
   */
  stopStream(): void {
    if (this.state.currentStream) {
      this.state.currentStream.getTracks().forEach(track => {
        track.stop();
      });
      
      this.updateState({
        isStreaming: false,
        currentStream: null,
        currentDevice: null,
      });
      
      // Notify listeners
      this.notifyStreamListeners(null);
      
      console.log('Camera stream stopped');
    }
  }
  
  /**
   * Switch to different camera
   */
  async switchCamera(deviceId: string): Promise<MediaStream> {
    const currentConfig = this.getCurrentConfig();
    return this.startStream({
      ...currentConfig,
      preferredDeviceId: deviceId,
    });
  }
  
  /**
   * Attach stream to video element
   */
  attachToVideo(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    
    if (this.state.currentStream) {
      videoElement.srcObject = this.state.currentStream;
      videoElement.play().catch(console.error);
    }
  }
  
  /**
   * Get current camera state
   */
  getState(): CameraState {
    return { ...this.state };
  }
  
  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to enumerate cameras:', error);
      return [];
    }
  }
  
  /**
   * Subscribe to stream changes
   */
  onStreamChange(listener: (stream: MediaStream | null) => void): () => void {
    this.streamListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.streamListeners.delete(listener);
    };
  }
  
  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: CameraState) => void): () => void {
    this.stateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }
  
  /**
   * Check if camera is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  
  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // Stop the stream immediately - we just wanted to check permissions
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopStream();
    this.streamListeners.clear();
    this.stateListeners.clear();
    this.videoElement = null;
    
    this.updateState({
      isInitialized: false,
      capabilities: null,
    });
    
    console.log('Camera manager disposed');
  }
  
  /**
   * Get camera capabilities
   */
  private async getCameraCapabilities(): Promise<CameraCapabilities> {
    try {
      const devices = await this.getAvailableCameras();
      
      if (devices.length === 0) {
        throw new Error('No cameras found');
      }
      
      const primaryDevice = devices[0];
      
      // Get supported resolutions (simplified - would need more sophisticated detection)
      const supportedResolutions = [
        { width: 320, height: 240 },
        { width: 640, height: 480 },
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
      ];
      
      const supportedFrameRates = [15, 24, 30, 60];
      
      return {
        hasCamera: true,
        hasMultipleCameras: devices.length > 1,
        supportedResolutions,
        supportedFrameRates,
        deviceId: primaryDevice.deviceId,
        label: primaryDevice.label || 'Camera',
      };
    } catch (error) {
      return {
        hasCamera: false,
        hasMultipleCameras: false,
        supportedResolutions: [],
        supportedFrameRates: [],
        deviceId: '',
        label: '',
      };
    }
  }
  
  /**
   * Get device ID from stream
   */
  private getDeviceIdFromStream(stream: MediaStream): string {
    const videoTrack = stream.getVideoTracks()[0];
    return videoTrack?.getSettings().deviceId || '';
  }
  
  /**
   * Get current configuration
   */
  private getCurrentConfig(): Partial<CameraConfig> {
    if (!this.state.currentStream) {
      return {};
    }
    
    const videoTrack = this.state.currentStream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    
    return {
      width: settings?.width || 640,
      height: settings?.height || 480,
      frameRate: settings?.frameRate || 30,
      preferredDeviceId: settings?.deviceId,
    };
  }
  
  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<CameraState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateListeners();
  }
  
  /**
   * Notify stream listeners
   */
  private notifyStreamListeners(stream: MediaStream | null): void {
    this.streamListeners.forEach(listener => {
      try {
        listener(stream);
      } catch (error) {
        console.error('Stream listener error:', error);
      }
    });
  }
  
  /**
   * Notify state listeners
   */
  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }
}

export default CameraManager;