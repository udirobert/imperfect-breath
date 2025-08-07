/**
 * Unified Vision Engine
 * Centralized TensorFlow.js management and detection logic
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-landmarks-detection';

// Dynamic pose detection import to handle MediaPipe loading issues
let poseDetection: any = null;

/**
 * Safely load pose detection module
 */
async function loadPoseDetection() {
  if (poseDetection) return poseDetection;
  
  try {
    poseDetection = await import('@tensorflow-models/pose-detection');
    return poseDetection;
  } catch (error) {
    console.warn('Pose detection not available, continuing without pose features:', error);
    return null;
  }
}

import type {
  VisionTier,
  VisionMetrics,
  PerformanceMetrics
} from '../types';
import { EnhancedRestlessnessAnalyzer } from '../enhanced-restlessness-analyzer';

export interface VisionEngineConfig {
  tier: VisionTier;
  modelVariant: 'mobile' | 'desktop';
  enableGPU: boolean;
  maxConcurrentProcessing: number;
  frameSkipRatio: number;
}

export class VisionEngine {
  private static instance: VisionEngine | null = null;
  private isInitialized = false;
  private currentTier: VisionTier = 'loading';
  
  // Model instances
  private faceDetector: faceDetection.FaceLandmarksDetector | null = null;
  private poseDetector: any | null = null;
  
  // Performance tracking
  private frameCount = 0;
  private lastFrameTime = 0;
  private performanceMetrics: PerformanceMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    frameRate: 0,
    frameDrops: 0,
    batteryImpact: 0,
    thermalState: 'normal'
  };
  
  // Processing state
  private isProcessing = false;
  private isContinuousProcessing = false;
  private processingQueue: HTMLVideoElement[] = [];
  private currentVideo: HTMLVideoElement | null = null;
  private animationFrameId: number | null = null;
  
  // Enhanced analysis
  private restlessnessAnalyzer = new EnhancedRestlessnessAnalyzer();
  
  // Metrics callback
  private metricsCallback: ((metrics: VisionMetrics) => void) | null = null;
  
  private constructor() {}
  
  /**
   * Singleton instance
   */
  static getInstance(): VisionEngine {
    if (!VisionEngine.instance) {
      VisionEngine.instance = new VisionEngine();
    }
    return VisionEngine.instance;
  }
  
  /**
   * Initialize the vision engine
   */
  async initialize(config: VisionEngineConfig): Promise<void> {
    if (this.isInitialized && this.currentTier === config.tier) {
      return;
    }
    
    try {
      // Initialize TensorFlow.js backend
      await this.initializeTensorFlow(config);
      
      // Load models based on tier
      await this.loadModelsForTier(config.tier, config.modelVariant);
      
      this.currentTier = config.tier;
      this.isInitialized = true;
      
      console.log(`Vision engine initialized for tier: ${config.tier}`);
    } catch (error) {
      console.error('Failed to initialize vision engine:', error);
      throw error;
    }
  }
  
  /**
   * Start continuous processing of video frames
   */
  async startProcessing(video: HTMLVideoElement, onMetrics?: (metrics: VisionMetrics) => void): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Vision engine not initialized');
      return;
    }
    
    if (this.isContinuousProcessing) {
      console.log('Vision engine already processing, updating video source');
      this.currentVideo = video;
      this.metricsCallback = onMetrics || null;
      return;
    }
    
    this.currentVideo = video;
    this.isContinuousProcessing = true;
    this.metricsCallback = onMetrics || null;
    
    // Start the processing loop
    const processLoop = async () => {
      if (!this.isContinuousProcessing || !this.currentVideo) {
        return;
      }
      
      try {
        const metrics = await this.processFrame(this.currentVideo, this.currentTier);
        
        // Report metrics if callback is provided
        if (metrics && this.metricsCallback) {
          this.metricsCallback(metrics);
        }
      } catch (error) {
        console.error('Error in processing loop:', error);
      }
      
      // Continue the loop
      if (this.isContinuousProcessing) {
        this.animationFrameId = requestAnimationFrame(processLoop);
      }
    };
    
    // Start the loop
    processLoop();
  }
  
  /**
   * Stop continuous processing
   */
  stopProcessing(): void {
    this.isContinuousProcessing = false;
    this.currentVideo = null;
    this.metricsCallback = null;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Process video frame and return metrics
   */
  async processFrame(
    video: HTMLVideoElement,
    tier: VisionTier = this.currentTier
  ): Promise<VisionMetrics | null> {
    if (!this.isInitialized) {
      return null;
    }
    
    // Prevent concurrent processing of individual frames
    if (this.isProcessing) {
      return null;
    }
    
    // Gracefully handle missing video element
    if (!video || video.readyState < 2) {
      return null;
    }
    
    this.isProcessing = true;
    const startTime = performance.now();
    
    try {
      let metrics: VisionMetrics | null = null;
      
      switch (tier) {
        case 'basic':
          metrics = await this.processBasicMetrics(video);
          break;
        case 'standard':
          metrics = await this.processStandardMetrics(video);
          break;
        case 'premium':
          metrics = await this.processPremiumMetrics(video);
          break;
        default:
          // Return basic fallback metrics for 'none' tier
          metrics = {
            confidence: 0.5,
            movementLevel: 0.1,
            lastUpdateTime: Date.now(),
          };
      }
      
      // Update performance metrics
      this.updatePerformanceMetrics(startTime);
      
      return metrics;
    } catch (error) {
      console.error('Frame processing failed:', error);
      // Return fallback metrics instead of null
      return {
        confidence: 0.1,
        movementLevel: 0.2,
        lastUpdateTime: Date.now(),
      };
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Update tier and reload models if necessary
   */
  async updateTier(newTier: VisionTier, modelVariant: 'mobile' | 'desktop' = 'mobile'): Promise<void> {
    if (newTier === this.currentTier) {
      return;
    }
    
    await this.loadModelsForTier(newTier, modelVariant);
    this.currentTier = newTier;
  }
  
  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    try {
      // Stop any ongoing processing
      this.stopProcessing();
      
      if (this.faceDetector) {
        this.faceDetector.dispose();
        this.faceDetector = null;
      }
      
      if (this.poseDetector) {
        this.poseDetector.dispose();
        this.poseDetector = null;
      }
      
      // Clean up TensorFlow.js memory
      tf.disposeVariables();
      
      this.isInitialized = false;
      this.currentTier = 'loading';
      
      console.log('Vision engine disposed');
    } catch (error) {
      console.error('Error disposing vision engine:', error);
    }
  }
  
  /**
   * Initialize TensorFlow.js backend
   */
  private async initializeTensorFlow(config: VisionEngineConfig): Promise<void> {
    // Set backend based on device capabilities
    if (config.enableGPU && await tf.ready()) {
      try {
        await tf.setBackend('webgl');
        console.log('Using WebGL backend for TensorFlow.js');
      } catch (error) {
        console.warn('WebGL backend failed, falling back to CPU');
        await tf.setBackend('cpu');
      }
    } else {
      await tf.setBackend('cpu');
      console.log('Using CPU backend for TensorFlow.js');
    }
    
    await tf.ready();
  }
  
  /**
   * Load models based on tier
   */
  private async loadModelsForTier(tier: VisionTier, variant: 'mobile' | 'desktop'): Promise<void> {
    // Dispose existing models
    if (this.faceDetector) {
      this.faceDetector.dispose();
      this.faceDetector = null;
    }
    if (this.poseDetector) {
      this.poseDetector.dispose();
      this.poseDetector = null;
    }
    
    switch (tier) {
      case 'basic':
        await this.loadBasicModels(variant);
        break;
      case 'standard':
        await this.loadStandardModels(variant);
        break;
      case 'premium':
        await this.loadPremiumModels(variant);
        break;
      case 'loading':
        // No models needed during loading
        break;
    }
  }
  
  /**
   * Load models for basic tier
   */
  private async loadBasicModels(variant: 'mobile' | 'desktop'): Promise<void> {
    const model = faceDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
      runtime: 'tfjs' as const,
      refineLandmarks: false,
      maxFaces: 1,
    };
    
    this.faceDetector = await faceDetection.createDetector(model, detectorConfig);
  }
  
  /**
   * Load models for standard tier
   */
  private async loadStandardModels(variant: 'mobile' | 'desktop'): Promise<void> {
    try {
      // Face detection with more features
      const faceModel = faceDetection.SupportedModels.MediaPipeFaceMesh;
      const faceConfig = {
        runtime: 'tfjs' as const,
        refineLandmarks: true,
        maxFaces: 1,
      };
      
      this.faceDetector = await faceDetection.createDetector(faceModel, faceConfig);
    } catch (error) {
      console.warn('Face detection failed to load, falling back to basic mode:', error);
      this.faceDetector = null;
    }
    
    // Try to load pose detection dynamically
    const poseDet = await loadPoseDetection();
    if (poseDet) {
      try {
        // Basic pose detection - gracefully degrade if MediaPipe not available
        const poseModel = poseDet.SupportedModels.MoveNet;
        const poseConfig = {
          modelType: variant === 'mobile' ? 
            poseDet.movenet.modelType.SINGLEPOSE_LIGHTNING :
            poseDet.movenet.modelType.SINGLEPOSE_THUNDER,
        };
        
        this.poseDetector = await poseDet.createDetector(poseModel, poseConfig);
      } catch (error) {
        console.warn('Pose detection failed to load, continuing without pose detection:', error);
        this.poseDetector = null;
      }
    } else {
      console.log('Pose detection module not available, continuing without pose features');
      this.poseDetector = null;
    }
  }
  
  /**
   * Load models for premium tier
   */
  private async loadPremiumModels(variant: 'mobile' | 'desktop'): Promise<void> {
    try {
      // High-quality face detection
      const faceModel = faceDetection.SupportedModels.MediaPipeFaceMesh;
      const faceConfig = {
        runtime: 'tfjs' as const,
        refineLandmarks: true,
        maxFaces: 1,
      };
      
      this.faceDetector = await faceDetection.createDetector(faceModel, faceConfig);
    } catch (error) {
      console.warn('Premium face detection failed to load, falling back to basic mode:', error);
      this.faceDetector = null;
    }
    
    // Try to load pose detection dynamically for premium features
    const poseDet = await loadPoseDetection();
    if (poseDet) {
      try {
        // High-quality pose detection
        const poseModel = poseDet.SupportedModels.MoveNet;
        const poseConfig = {
          modelType: poseDet.movenet.modelType.SINGLEPOSE_THUNDER,
        };
        
        this.poseDetector = await poseDet.createDetector(poseModel, poseConfig);
      } catch (error) {
        console.warn('Premium pose detection failed to load, continuing without pose detection:', error);
        this.poseDetector = null;
      }
    } else {
      console.log('Pose detection module not available for premium features');
      this.poseDetector = null;
    }
  }
  
  /**
   * Process basic tier metrics
   */
  private async processBasicMetrics(video: HTMLVideoElement): Promise<VisionMetrics> {
    const faces = this.faceDetector ? await this.faceDetector.estimateFaces(video) : [];
    
    const facePresent = faces.length > 0;
    let movementLevel = 0;
    let headAlignment = 0;
    
    if (facePresent && faces[0]) {
      const face = faces[0];
      
      // Calculate basic movement (simplified)
      movementLevel = this.calculateBasicMovement(face);
      
      // Calculate head alignment (simplified)
      headAlignment = this.calculateHeadAlignment(face);
    }
    
    return {
      confidence: facePresent ? 0.8 : 0.1,
      movementLevel,
      lastUpdateTime: Date.now(),
      postureQuality: headAlignment,
      faceLandmarks: facePresent && faces[0].keypoints ? faces[0].keypoints : undefined,
    };
  }
  
  /**
   * Process standard tier metrics
   */
  private async processStandardMetrics(video: HTMLVideoElement): Promise<VisionMetrics> {
    const basicMetrics = await this.processBasicMetrics(video);
    
    const faces = this.faceDetector ? await this.faceDetector.estimateFaces(video) : [];
    const poses = this.poseDetector ? await this.poseDetector.estimatePoses(video) : [];
    
    let facialTension = 0;
    let postureQuality = 0;
    let breathingRhythm = { rate: 15, consistency: 0.5 };
    let restlessnessScore = 0;
    
    if (faces.length > 0 && faces[0]) {
      facialTension = this.calculateFacialTension(faces[0]);
      breathingRhythm = this.calculateBreathingRhythm(faces[0]);
    }
    
    if (poses.length > 0 && poses[0]) {
      postureQuality = this.calculatePostureQuality(poses[0]);
    }
    
    // Use enhanced restlessness analysis
    const restlessnessAnalysis = this.restlessnessAnalyzer.analyzeFromLandmarks(faces, poses);
    restlessnessScore = restlessnessAnalysis.overall;
    
    return {
      ...basicMetrics,
      postureQuality,
      restlessnessScore,
      faceLandmarks: faces.length > 0 && faces[0].keypoints ? faces[0].keypoints : undefined,
      poseLandmarks: poses.length > 0 && poses[0].keypoints ? poses[0].keypoints : undefined,
    };
  }
  
  /**
   * Process premium tier metrics
   */
  private async processPremiumMetrics(video: HTMLVideoElement): Promise<VisionMetrics> {
    const standardMetrics = await this.processStandardMetrics(video);
    
    const faces = this.faceDetector ? await this.faceDetector.estimateFaces(video) : [];
    const poses = this.poseDetector ? await this.poseDetector.estimatePoses(video) : [];
    
    let detailedFacialAnalysis = {
      nostrilMovement: 0,
      jawTension: 0,
      eyeMovement: 0,
      microExpressions: 0,
    };
    
    let fullBodyPosture = {
      spinalAlignment: 0,
      shoulderTension: 0,
      chestExpansion: 0,
      overallPosture: 0,
    };
    
    let preciseBreathingMetrics = {
      actualRate: 15,
      targetRate: 15,
      rhythmAccuracy: 0.5,
      depthConsistency: 0.5,
    };
    
    let advancedRestlessnessScore = {
      overall: 0,
      components: {
        faceMovement: 0,
        eyeMovement: 0,
        postureShifts: 0,
        breathingIrregularity: 0,
      },
    };
    
    if (faces.length > 0 && faces[0]) {
      detailedFacialAnalysis = this.calculateDetailedFacialAnalysis(faces[0]);
      preciseBreathingMetrics = this.calculatePreciseBreathingMetrics(faces[0]);
    }
    
    if (poses.length > 0 && poses[0]) {
      fullBodyPosture = this.calculateFullBodyPosture(poses[0]);
    }
    
    // Use enhanced restlessness analysis for premium tier
    const restlessnessAnalysis = this.restlessnessAnalyzer.analyzeFromLandmarks(faces, poses);
    advancedRestlessnessScore = {
      overall: restlessnessAnalysis.overall,
      components: {
        faceMovement: restlessnessAnalysis.components.faceMovement,
        eyeMovement: restlessnessAnalysis.components.eyeMovement,
        postureShifts: restlessnessAnalysis.components.postureShifts,
        breathingIrregularity: restlessnessAnalysis.components.breathingIrregularity,
      },
    };
    
    return {
      ...standardMetrics,
      restlessnessScore: advancedRestlessnessScore.overall,
      focusLevel: fullBodyPosture.overallPosture,
      faceLandmarks: faces.length > 0 && faces[0].keypoints ? faces[0].keypoints : undefined,
      poseLandmarks: poses.length > 0 && poses[0].keypoints ? poses[0].keypoints : undefined,
      detailedFacialAnalysis,
      fullBodyPosture,
      preciseBreathingMetrics,
    };
  }
  
  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(startTime: number): void {
    const processingTime = performance.now() - startTime;
    this.frameCount++;
    
    // Calculate frame rate
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const deltaTime = now - this.lastFrameTime;
      this.performanceMetrics.frameRate = 1000 / deltaTime;
    }
    this.lastFrameTime = now;
    
    // Estimate CPU usage based on processing time
    this.performanceMetrics.cpuUsage = Math.min(100, (processingTime / 33.33) * 100); // 30fps = 33.33ms per frame
    
    // Estimate memory usage (with type assertion for Chrome-specific API)
    const perfMemory = (performance as any).memory;
    if (perfMemory) {
      this.performanceMetrics.memoryUsage = (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100;
    }
    
    // Battery impact estimation (simplified)
    this.performanceMetrics.batteryImpact = Math.min(100, this.performanceMetrics.cpuUsage * 0.8);
  }
  
  // Real face detection analysis methods
  private previousFaceLandmarks: any = null;
  private breathingRateHistory: number[] = [];
  private faceMovementHistory: number[] = [];
  
  private calculateBasicMovement(face: any): number {
    if (!face.keypoints || face.keypoints.length < 10) return 0.1;
    
    // Track key facial points for movement
    const keyPoints = [
      face.keypoints[1],   // nose tip
      face.keypoints[152], // chin
      face.keypoints[10],  // forehead
    ].filter(Boolean);
    
    if (!this.previousFaceLandmarks) {
      this.previousFaceLandmarks = keyPoints;
      return 0.1;
    }
    
    // Calculate actual movement
    let totalMovement = 0;
    keyPoints.forEach((point, index) => {
      if (this.previousFaceLandmarks[index]) {
        const dx = point.x - this.previousFaceLandmarks[index].x;
        const dy = point.y - this.previousFaceLandmarks[index].y;
        totalMovement += Math.sqrt(dx * dx + dy * dy);
      }
    });
    
    this.previousFaceLandmarks = keyPoints;
    
    // Normalize to 0-0.3 range
    const normalizedMovement = Math.min(totalMovement / 30, 0.3);
    this.faceMovementHistory.push(normalizedMovement);
    if (this.faceMovementHistory.length > 30) {
      this.faceMovementHistory.shift();
    }
    
    // Return smoothed value
    const avgMovement = this.faceMovementHistory.reduce((a, b) => a + b, 0) / this.faceMovementHistory.length;
    return avgMovement;
  }
  
  private calculateHeadAlignment(face: any): number {
    if (!face.keypoints || face.keypoints.length < 468) return 0.8;
    
    // Use eye and nose landmarks to determine head tilt
    const leftEye = face.keypoints[33];
    const rightEye = face.keypoints[263];
    const nose = face.keypoints[1];
    
    if (!leftEye || !rightEye || !nose) return 0.8;
    
    // Calculate eye line angle
    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    
    // Perfect alignment is 0 degrees
    const alignmentScore = 1 - Math.min(Math.abs(eyeAngle) / 0.3, 0.2);
    
    return alignmentScore; // 0.8-1.0 range
  }
  
  private estimateBreathingRate(face: any): number {
    if (!face.keypoints || face.keypoints.length < 468) return 15;
    
    // Monitor nostril and mouth area for breathing patterns
    const nostrilPoints = [
      face.keypoints[2],
      face.keypoints[5],
      face.keypoints[4],
      face.keypoints[6],
    ].filter(Boolean);
    
    if (nostrilPoints.length < 4) return 15;
    
    // Calculate nostril area (simplified)
    let area = 0;
    for (let i = 0; i < nostrilPoints.length - 1; i++) {
      area += nostrilPoints[i].x * nostrilPoints[i + 1].y;
      area -= nostrilPoints[i + 1].x * nostrilPoints[i].y;
    }
    area = Math.abs(area) / 2;
    
    // Track area changes over time
    this.breathingRateHistory.push(area);
    if (this.breathingRateHistory.length > 60) { // 60 frames history
      this.breathingRateHistory.shift();
    }
    
    if (this.breathingRateHistory.length < 30) return 15;
    
    // Detect breathing cycles from area changes
    let peaks = 0;
    for (let i = 1; i < this.breathingRateHistory.length - 1; i++) {
      if (this.breathingRateHistory[i] > this.breathingRateHistory[i - 1] &&
          this.breathingRateHistory[i] > this.breathingRateHistory[i + 1]) {
        peaks++;
      }
    }
    
    // Convert peaks to breathing rate (peaks per minute)
    const breathingRate = Math.max(12, Math.min(20, peaks * 2));
    return breathingRate;
  }
  
  private calculateFacialTension(face: any): number {
    if (!face.keypoints || face.keypoints.length < 468) return 0.2;
    
    // Monitor jaw and forehead landmarks for tension
    const jawPoints = [172, 136, 150, 149, 176, 148, 152].map(i => face.keypoints[i]).filter(Boolean);
    const foreheadPoints = [9, 10, 151, 337, 299, 333, 298, 301].map(i => face.keypoints[i]).filter(Boolean);
    
    if (jawPoints.length < 3 || foreheadPoints.length < 3) return 0.2;
    
    // Calculate variance in jaw position (higher variance = more tension)
    const jawYPositions = jawPoints.map(p => p.y);
    const jawMean = jawYPositions.reduce((a, b) => a + b) / jawYPositions.length;
    const jawVariance = jawYPositions.reduce((acc, y) => acc + Math.pow(y - jawMean, 2), 0) / jawYPositions.length;
    
    // Normalize to 0-0.4 range
    return Math.min(jawVariance / 100, 0.4);
  }
  
  private calculateBreathingRhythm(face: any): { rate: number; consistency: number } {
    const rate = this.estimateBreathingRate(face);
    
    // Calculate consistency from breathing history variance
    let consistency = 0.8;
    if (this.breathingRateHistory.length > 10) {
      const mean = this.breathingRateHistory.reduce((a, b) => a + b) / this.breathingRateHistory.length;
      const variance = this.breathingRateHistory.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / this.breathingRateHistory.length;
      consistency = Math.max(0.6, 1 - (variance / 1000));
    }
    
    return { rate, consistency };
  }
  
  private calculatePostureQuality(pose: any): number {
    if (!pose.keypoints || pose.keypoints.length < 17) return 0.7;
    
    // Use shoulder and hip alignment
    const leftShoulder = pose.keypoints[5];
    const rightShoulder = pose.keypoints[6];
    const leftHip = pose.keypoints[11];
    const rightHip = pose.keypoints[12];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0.7;
    
    // Calculate shoulder levelness
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );
    
    // Calculate hip levelness
    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    );
    
    // Good posture has level shoulders and hips (angles near 0)
    const shoulderScore = 1 - Math.min(Math.abs(shoulderAngle) / 0.2, 0.3);
    const hipScore = 1 - Math.min(Math.abs(hipAngle) / 0.2, 0.3);
    
    return (shoulderScore + hipScore) / 2; // 0.7-1.0 range
  }
  
  private calculateRestlessnessScore(movement: number, tension: number): number {
    // Use enhanced analyzer if available, otherwise fallback to simple calculation
    return (movement + tension) / 2;
  }
  
  private calculateDetailedFacialAnalysis(face: any): any {
    if (!face.keypoints || face.keypoints.length < 468) {
      return {
        nostrilMovement: 0.1,
        jawTension: 0.1,
        eyeMovement: 0.1,
        microExpressions: 0.05,
      };
    }
    
    // Calculate actual nostril movement
    const nostrilPoints = [2, 5, 4, 6].map(i => face.keypoints[i]).filter(Boolean);
    let nostrilMovement = 0.1;
    if (nostrilPoints.length >= 4 && this.previousFaceLandmarks) {
      const prevNostrils = [2, 5, 4, 6].map(i => this.previousFaceLandmarks[i]).filter(Boolean);
      if (prevNostrils.length >= 4) {
        nostrilMovement = nostrilPoints.reduce((acc, point, idx) => {
          if (prevNostrils[idx]) {
            const dist = Math.sqrt(
              Math.pow(point.x - prevNostrils[idx].x, 2) +
              Math.pow(point.y - prevNostrils[idx].y, 2)
            );
            return acc + dist;
          }
          return acc;
        }, 0) / nostrilPoints.length;
        nostrilMovement = Math.min(nostrilMovement * 100, 0.3);
      }
    }
    
    // Calculate jaw tension from jaw landmarks
    const jawTension = this.calculateFacialTension(face);
    
    // Calculate eye movement
    const eyePoints = [33, 133, 157, 158, 159, 160, 161, 246].map(i => face.keypoints[i]).filter(Boolean);
    let eyeMovement = 0.1;
    if (eyePoints.length > 4) {
      // Track blink rate and eye movement
      const leftEyeCenter = face.keypoints[159];
      const rightEyeCenter = face.keypoints[386];
      if (leftEyeCenter && rightEyeCenter && this.previousFaceLandmarks) {
        const prevLeft = this.previousFaceLandmarks[159];
        const prevRight = this.previousFaceLandmarks[386];
        if (prevLeft && prevRight) {
          const leftMove = Math.sqrt(
            Math.pow(leftEyeCenter.x - prevLeft.x, 2) +
            Math.pow(leftEyeCenter.y - prevLeft.y, 2)
          );
          const rightMove = Math.sqrt(
            Math.pow(rightEyeCenter.x - prevRight.x, 2) +
            Math.pow(rightEyeCenter.y - prevRight.y, 2)
          );
          eyeMovement = Math.min((leftMove + rightMove) * 50, 0.2);
        }
      }
    }
    
    return {
      nostrilMovement,
      jawTension,
      eyeMovement,
      microExpressions: Math.min(nostrilMovement + eyeMovement, 0.1),
    };
  }
  
  private calculateFullBodyPosture(pose: any): any {
    if (!pose.keypoints || pose.keypoints.length < 17) {
      return {
        spinalAlignment: 0.8,
        shoulderTension: 0.1,
        chestExpansion: 0.7,
        overallPosture: 0.75,
      };
    }
    
    // Calculate spinal alignment from shoulder and hip positions
    const leftShoulder = pose.keypoints[5];
    const rightShoulder = pose.keypoints[6];
    const leftHip = pose.keypoints[11];
    const rightHip = pose.keypoints[12];
    const nose = pose.keypoints[0];
    
    let spinalAlignment = 0.8;
    let shoulderTension = 0.1;
    let chestExpansion = 0.7;
    
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      // Check if shoulders are level
      const shoulderAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      );
      spinalAlignment = 1 - Math.min(Math.abs(shoulderAngle) / 0.3, 0.2);
      
      // Calculate shoulder width for tension
      const shoulderWidth = Math.sqrt(
        Math.pow(rightShoulder.x - leftShoulder.x, 2) +
        Math.pow(rightShoulder.y - leftShoulder.y, 2)
      );
      
      // Narrower shoulders indicate tension
      shoulderTension = Math.max(0, 0.3 - shoulderWidth);
      
      // Chest expansion from shoulder-hip alignment
      const torsoHeight = Math.abs(
        ((leftShoulder.y + rightShoulder.y) / 2) -
        ((leftHip.y + rightHip.y) / 2)
      );
      chestExpansion = Math.min(0.6 + torsoHeight, 1.0);
    }
    
    const overallPosture = (spinalAlignment + (1 - shoulderTension) + chestExpansion) / 3;
    
    return {
      spinalAlignment,
      shoulderTension,
      chestExpansion,
      overallPosture,
    };
  }
  
  private calculatePreciseBreathingMetrics(face: any): any {
    const actualRate = this.estimateBreathingRate(face);
    const targetRate = 15;
    
    // Calculate rhythm accuracy based on breathing rate consistency
    let rhythmAccuracy = 0.8;
    if (this.breathingRateHistory.length > 10) {
      const recentRates = this.breathingRateHistory.slice(-10);
      const avgRate = recentRates.reduce((a, b) => a + b) / recentRates.length;
      const variance = recentRates.reduce((acc, rate) =>
        acc + Math.pow(rate - avgRate, 2), 0
      ) / recentRates.length;
      rhythmAccuracy = Math.max(0.5, 1 - (variance / 100));
    }
    
    // Estimate depth consistency from nostril movement amplitude
    let depthConsistency = 0.7;
    if (face.keypoints && this.breathingRateHistory.length > 5) {
      const amplitudes = this.breathingRateHistory.slice(-5);
      const avgAmplitude = amplitudes.reduce((a, b) => a + b) / amplitudes.length;
      const ampVariance = amplitudes.reduce((acc, amp) =>
        acc + Math.pow(amp - avgAmplitude, 2), 0
      ) / amplitudes.length;
      depthConsistency = Math.max(0.5, 1 - (ampVariance / 50));
    }
    
    return {
      actualRate,
      targetRate,
      rhythmAccuracy,
      depthConsistency,
    };
  }
  
  private calculateAdvancedRestlessnessScore(facial: any, posture: any, breathing: any): any {
    const faceMovement = (facial.nostrilMovement + facial.jawTension + facial.eyeMovement) / 3;
    const eyeMovement = facial.eyeMovement;
    const postureShifts = (posture.shoulderTension + (1 - posture.spinalAlignment)) / 2;
    const breathingIrregularity = 1 - breathing.rhythmAccuracy;
    
    const overall = (faceMovement + eyeMovement + postureShifts + breathingIrregularity) / 4;
    
    return {
      overall,
      components: {
        faceMovement,
        eyeMovement,
        postureShifts,
        breathingIrregularity,
      },
    };
  }
}

export default VisionEngine;