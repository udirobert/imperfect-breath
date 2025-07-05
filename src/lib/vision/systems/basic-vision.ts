import type { IVisionSystem, BasicMetrics, VisionConfig } from '../types';
import { ModelLoader } from '../model-loader';
import { PerformanceMonitor } from '../performance-monitor';

export class BasicVisionSystem implements IVisionSystem {
  private config: VisionConfig | null = null;
  private modelLoader: ModelLoader;
  private performanceMonitor: PerformanceMonitor;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private processingInterval: NodeJS.Timeout | null = null;
  private lastFrameData: ImageData | null = null;

  constructor() {
    this.modelLoader = ModelLoader.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  async initialize(): Promise<void> {
    if (!this.config) {
      throw new Error('Config must be set before initialization');
    }

    // Load basic models
    await this.loadRequiredModels();

    // Set up canvas for frame processing
    this.setupCanvas();

    console.log('Basic vision system initialized');
  }

  async updateConfig(config: Partial<VisionConfig>): Promise<void> {
    this.config = { ...this.config, ...config } as VisionConfig;
    
    // Restart processing with new config if already running
    if (this.processingInterval) {
      await this.stopProcessing();
      await this.startProcessing();
    }
  }

  async getMetrics(): Promise<BasicMetrics> {
    if (!this.videoElement || !this.canvas || !this.context) {
      return this.getDefaultMetrics();
    }

    try {
      // Capture current frame
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const currentFrameData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

      // Calculate metrics
      const movementLevel = this.calculateMovementLevel(currentFrameData);
      const facePresent = await this.detectFacePresence(currentFrameData);
      const estimatedBreathingRate = this.estimateBreathingRate(movementLevel);
      const headAlignment = this.calculateHeadAlignment(currentFrameData);

      // Store frame for next comparison
      this.lastFrameData = currentFrameData;

      // Record frame for performance monitoring
      this.performanceMonitor.recordFrame();

      return {
        timestamp: Date.now(),
        confidence: this.calculateConfidence(facePresent, movementLevel),
        movementLevel,
        facePresent,
        estimatedBreathingRate,
        headAlignment
      };
    } catch (error) {
      console.error('Error getting basic metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  async dispose(): Promise<void> {
    await this.stopProcessing();
    
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    this.videoElement = null;
    this.canvas = null;
    this.context = null;
    this.lastFrameData = null;

    console.log('Basic vision system disposed');
  }

  // Public method to start processing with video stream
  async startProcessing(videoStream?: MediaStream): Promise<void> {
    if (!videoStream && !this.videoElement?.srcObject) {
      throw new Error('Video stream required for processing');
    }

    if (videoStream) {
      await this.setupVideoElement(videoStream);
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Start processing at configured interval
    this.processingInterval = setInterval(async () => {
      try {
        await this.getMetrics();
      } catch (error) {
        console.error('Error in processing interval:', error);
        this.performanceMonitor.recordDroppedFrame();
      }
    }, this.config?.processingInterval || 200);
  }

  async stopProcessing(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async loadRequiredModels(): Promise<void> {
    try {
      // Load only the most basic models for this tier
      await this.modelLoader.loadModel('motion-detection', 'high');
      await this.modelLoader.loadModel('face-detection-lite', 'high');
    } catch (error) {
      console.warn('Some models failed to load, using fallback methods:', error);
    }
  }

  private setupCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320; // Small size for basic processing
    this.canvas.height = 240;
    this.context = this.canvas.getContext('2d');
  }

  private async setupVideoElement(stream: MediaStream): Promise<void> {
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = stream;
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;

    return new Promise((resolve, reject) => {
      this.videoElement!.onloadedmetadata = () => resolve();
      this.videoElement!.onerror = reject;
    });
  }

  private calculateMovementLevel(currentFrame: ImageData): number {
    if (!this.lastFrameData) {
      return 0;
    }

    const current = currentFrame.data;
    const previous = this.lastFrameData.data;
    let totalDiff = 0;
    let pixelCount = 0;

    // Sample every 4th pixel for performance
    for (let i = 0; i < current.length; i += 16) {
      const rDiff = Math.abs(current[i] - previous[i]);
      const gDiff = Math.abs(current[i + 1] - previous[i + 1]);
      const bDiff = Math.abs(current[i + 2] - previous[i + 2]);
      
      totalDiff += (rDiff + gDiff + bDiff) / 3;
      pixelCount++;
    }

    const averageDiff = totalDiff / pixelCount;
    return Math.min(averageDiff / 255, 1); // Normalize to 0-1
  }

  private async detectFacePresence(frameData: ImageData): Promise<boolean> {
    try {
      // Use loaded face detection model if available
      const faceModel = this.modelLoader.isModelLoaded('face-detection-lite');
      
      if (faceModel) {
        // In a real implementation, this would use the actual model
        // For now, we'll use a simple heuristic
        return this.simpleFaceDetectionHeuristic(frameData);
      }
      
      return this.simpleFaceDetectionHeuristic(frameData);
    } catch (error) {
      console.error('Face detection error:', error);
      return false;
    }
  }

  private simpleFaceDetectionHeuristic(frameData: ImageData): boolean {
    // Simple heuristic: look for skin-tone colored regions in the upper portion
    const data = frameData.data;
    const width = frameData.width;
    const height = frameData.height;
    
    let skinPixels = 0;
    let totalPixels = 0;

    // Check upper 60% of frame
    const maxY = Math.floor(height * 0.6);
    
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < width; x += 4) { // Sample every 4th pixel
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Simple skin tone detection
        if (this.isSkinTone(r, g, b)) {
          skinPixels++;
        }
        totalPixels++;
      }
    }

    const skinRatio = skinPixels / totalPixels;
    return skinRatio > 0.1; // If more than 10% skin-tone pixels, assume face present
  }

  private isSkinTone(r: number, g: number, b: number): boolean {
    // Simple skin tone detection (very basic)
    return r > 95 && g > 40 && b > 20 &&
           r > g && r > b &&
           Math.abs(r - g) > 15;
  }

  private estimateBreathingRate(movementLevel: number): number {
    // Very basic breathing rate estimation based on movement patterns
    // In a real implementation, this would analyze movement over time
    
    // Assume normal breathing rate and adjust based on movement
    const baseRate = 15; // breaths per minute
    const movementFactor = movementLevel * 10; // Scale movement to breathing variation
    
    return Math.max(8, Math.min(25, baseRate + movementFactor));
  }

  private calculateHeadAlignment(frameData: ImageData): number {
    // Simple head alignment check based on brightness distribution
    const data = frameData.data;
    const width = frameData.width;
    const height = frameData.height;
    
    let leftBrightness = 0;
    let rightBrightness = 0;
    let centerBrightness = 0;
    
    const centerX = width / 2;
    const leftBound = centerX * 0.3;
    const rightBound = centerX * 1.7;
    
    for (let y = 0; y < height * 0.6; y++) { // Upper 60% of frame
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        if (x < leftBound) {
          leftBrightness += brightness;
        } else if (x > rightBound) {
          rightBrightness += brightness;
        } else {
          centerBrightness += brightness;
        }
      }
    }
    
    // Good alignment should have balanced left/right brightness
    const balance = 1 - Math.abs(leftBrightness - rightBrightness) / Math.max(leftBrightness, rightBrightness);
    return Math.max(0, Math.min(1, balance));
  }

  private calculateConfidence(facePresent: boolean, movementLevel: number): number {
    let confidence = 0.5; // Base confidence
    
    if (facePresent) confidence += 0.3;
    if (movementLevel > 0.1 && movementLevel < 0.8) confidence += 0.2; // Good movement range
    
    return Math.max(0, Math.min(1, confidence));
  }

  private getDefaultMetrics(): BasicMetrics {
    return {
      timestamp: Date.now(),
      confidence: 0,
      movementLevel: 0,
      facePresent: false,
      estimatedBreathingRate: 15, // Default breathing rate
      headAlignment: 0.5 // Neutral alignment
    };
  }
}
