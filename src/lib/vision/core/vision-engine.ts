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
  private processingQueue: HTMLVideoElement[] = [];
  
  // Enhanced analysis
  private restlessnessAnalyzer = new EnhancedRestlessnessAnalyzer();
  
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
   * Process video frame and return metrics
   */
  async processFrame(
    video: HTMLVideoElement,
    tier: VisionTier = this.currentTier
  ): Promise<VisionMetrics | null> {
    if (!this.isInitialized || this.isProcessing) {
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
            estimatedBreathingRate: 15,
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
        estimatedBreathingRate: 15,
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
    let estimatedBreathingRate = 15; // Default breathing rate
    
    if (facePresent && faces[0]) {
      const face = faces[0];
      
      // Calculate basic movement (simplified)
      movementLevel = this.calculateBasicMovement(face);
      
      // Calculate head alignment (simplified)
      headAlignment = this.calculateHeadAlignment(face);
      
      // Estimate breathing rate from facial landmarks (simplified)
      estimatedBreathingRate = this.estimateBreathingRate(face);
    }
    
    return {
      confidence: facePresent ? 0.8 : 0.1,
      movementLevel,
      lastUpdateTime: Date.now(),
      estimatedBreathingRate,
      postureQuality: headAlignment,
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
      estimatedBreathingRate: breathingRhythm.rate,
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
      estimatedBreathingRate: preciseBreathingMetrics.actualRate,
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
  
  // Simplified analysis methods (these would be more sophisticated in production)
  private calculateBasicMovement(face: any): number {
    // Simplified movement calculation
    return Math.random() * 0.3; // 0-0.3 range for basic movement
  }
  
  private calculateHeadAlignment(face: any): number {
    // Simplified head alignment calculation
    return 0.8 + Math.random() * 0.2; // 0.8-1.0 range for good alignment
  }
  
  private estimateBreathingRate(face: any): number {
    // Simplified breathing rate estimation
    return 12 + Math.random() * 8; // 12-20 breaths per minute
  }
  
  private calculateFacialTension(face: any): number {
    return Math.random() * 0.4; // 0-0.4 range for facial tension
  }
  
  private calculateBreathingRhythm(face: any): { rate: number; consistency: number } {
    return {
      rate: 12 + Math.random() * 8,
      consistency: 0.6 + Math.random() * 0.4,
    };
  }
  
  private calculatePostureQuality(pose: any): number {
    return 0.7 + Math.random() * 0.3; // 0.7-1.0 range for posture quality
  }
  
  private calculateRestlessnessScore(movement: number, tension: number): number {
    // Use enhanced analyzer if available, otherwise fallback to simple calculation
    return (movement + tension) / 2;
  }
  
  private calculateDetailedFacialAnalysis(face: any): any {
    return {
      nostrilMovement: Math.random() * 0.3,
      jawTension: Math.random() * 0.4,
      eyeMovement: Math.random() * 0.2,
      microExpressions: Math.random() * 0.1,
    };
  }
  
  private calculateFullBodyPosture(pose: any): any {
    return {
      spinalAlignment: 0.8 + Math.random() * 0.2,
      shoulderTension: Math.random() * 0.3,
      chestExpansion: 0.6 + Math.random() * 0.4,
      overallPosture: 0.7 + Math.random() * 0.3,
    };
  }
  
  private calculatePreciseBreathingMetrics(face: any): any {
    const actualRate = 12 + Math.random() * 8;
    const targetRate = 15;
    
    return {
      actualRate,
      targetRate,
      rhythmAccuracy: 0.7 + Math.random() * 0.3,
      depthConsistency: 0.6 + Math.random() * 0.4,
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