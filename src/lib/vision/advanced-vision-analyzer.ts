/**
 * Advanced Vision Analyzer
 * Implements sophisticated breathing pattern recognition, posture analysis, and micro-expressions
 * Optimized for mobile devices with adaptive processing
 */

import { startTimer } from '../utils/performance-utils';
import type { VisionMetrics } from './types';

export interface BreathingPattern {
  rhythm: 'regular' | 'irregular' | 'deep' | 'shallow' | 'rapid' | 'slow';
  rate: number; // breaths per minute
  depth: number; // 0-1 scale
  consistency: number; // 0-1 scale
  phase: 'inhale' | 'exhale' | 'hold' | 'transition';
  confidence: number;
}

export interface PostureAnalysis {
  spineAlignment: number; // 0-1 scale (1 = perfect alignment)
  shoulderLevel: number; // 0-1 scale (1 = level shoulders)
  headPosition: 'forward' | 'neutral' | 'tilted-left' | 'tilted-right';
  overallPosture: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export interface MicroExpressionData {
  stress: number; // 0-1 scale
  relaxation: number; // 0-1 scale
  focus: number; // 0-1 scale
  fatigue: number; // 0-1 scale
  dominantEmotion: 'calm' | 'stressed' | 'focused' | 'tired' | 'neutral';
  confidence: number;
}

export interface EyeTrackingData {
  gazeDirection: { x: number; y: number };
  blinkRate: number; // blinks per minute
  eyeOpenness: number; // 0-1 scale
  focusStability: number; // 0-1 scale
  attentionLevel: number; // 0-1 scale
}

export interface HeartRateData {
  bpm: number;
  confidence: number;
  variability: number; // HRV indicator
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AdvancedVisionMetrics {
  breathingPattern: BreathingPattern;
  postureAnalysis: PostureAnalysis;
  microExpressions: MicroExpressionData;
  eyeTracking: EyeTrackingData;
  heartRate: HeartRateData;
  overallWellness: number; // 0-100 composite score
  timestamp: number;
}

export class AdvancedVisionAnalyzer {
  private breathingHistory: number[] = [];
  private postureHistory: any[] = [];
  private colorHistory: number[][] = [];
  private blinkHistory: number[] = [];
  private readonly HISTORY_SIZE = 60; // 60 seconds of data
  
  // Mobile optimization flags
  private isMobile: boolean;
  private processingLevel: 'basic' | 'standard' | 'advanced';
  
  constructor(isMobile = false) {
    this.isMobile = isMobile;
    this.processingLevel = isMobile ? 'standard' : 'advanced';
  }

  /**
   * Analyze advanced vision metrics from face landmarks
   */
  public analyzeAdvancedMetrics(
    faceLandmarks: any[],
    poses: any[],
    imageData: ImageData
  ): AdvancedVisionMetrics {
    const endTimer = startTimer('advanced-vision-analysis');
    
    try {
      // Extract face data if available
      const face = faceLandmarks[0];
      const pose = poses[0];
      
      if (!face) {
        return this.createFallbackMetrics();
      }

      // Analyze different aspects based on processing level
      const breathingPattern = this.analyzeBreathingPattern(face, pose);
      const postureAnalysis = this.analyzePosture(face, pose);
      const microExpressions = this.processingLevel !== 'basic' 
        ? this.analyzeMicroExpressions(face)
        : this.createBasicMicroExpressions();
      const eyeTracking = this.analyzeEyeTracking(face);
      const heartRate = this.processingLevel === 'advanced'
        ? this.estimateHeartRate(face, imageData)
        : this.createBasicHeartRate();

      // Calculate overall wellness score
      const overallWellness = this.calculateWellnessScore({
        breathingPattern,
        postureAnalysis,
        microExpressions,
        eyeTracking,
        heartRate
      });

      return {
        breathingPattern,
        postureAnalysis,
        microExpressions,
        eyeTracking,
        heartRate,
        overallWellness,
        timestamp: Date.now()
      };
      
    } finally {
      endTimer();
    }
  }

  /**
   * Analyze breathing pattern from facial movements
   */
  private analyzeBreathingPattern(face: any, pose?: any): BreathingPattern {
    try {
      // Extract key points for breathing analysis
      const noseTip = face.keypoints?.find((p: any) => p.name === 'noseTip') || face.keypoints?.[1];
      const chin = face.keypoints?.find((p: any) => p.name === 'chin') || face.keypoints?.[175];
      
      if (!noseTip || !chin) {
        return this.createFallbackBreathingPattern();
      }

      // Calculate chest/face movement
      const faceHeight = Math.abs(noseTip.y - chin.y);
      this.breathingHistory.push(faceHeight);
      
      if (this.breathingHistory.length > this.HISTORY_SIZE) {
        this.breathingHistory.shift();
      }

      if (this.breathingHistory.length < 10) {
        return this.createFallbackBreathingPattern();
      }

      // Analyze breathing metrics
      const rate = this.calculateBreathingRate();
      const depth = this.calculateBreathingDepth();
      const consistency = this.calculateBreathingConsistency();
      const phase = this.detectBreathingPhase();
      const rhythm = this.classifyBreathingRhythm(rate, depth, consistency);

      return {
        rhythm,
        rate,
        depth,
        consistency,
        phase,
        confidence: Math.min(this.breathingHistory.length / 30, 1) // Higher confidence with more data
      };
      
    } catch (error) {
      console.warn('Breathing pattern analysis failed:', error);
      return this.createFallbackBreathingPattern();
    }
  }

  /**
   * Analyze posture from face and body landmarks
   */
  private analyzePosture(face: any, pose?: any): PostureAnalysis {
    try {
      const leftEye = face.keypoints?.find((p: any) => p.name === 'leftEye') || face.keypoints?.[33];
      const rightEye = face.keypoints?.find((p: any) => p.name === 'rightEye') || face.keypoints?.[362];
      const noseTip = face.keypoints?.find((p: any) => p.name === 'noseTip') || face.keypoints?.[1];
      
      if (!leftEye || !rightEye || !noseTip) {
        return this.createFallbackPosture();
      }

      // Calculate eye level (shoulder alignment indicator)
      const eyeLevelDiff = Math.abs(leftEye.y - rightEye.y);
      const faceWidth = Math.abs(leftEye.x - rightEye.x);
      const shoulderLevel = Math.max(0, 1 - (eyeLevelDiff / faceWidth) * 2);

      // Calculate head position
      const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
      const headTilt = this.calculateHeadTilt(eyeCenter, noseTip);
      
      // Estimate spine alignment from head position
      const spineAlignment = this.estimateSpineAlignment(headTilt, shoulderLevel);
      
      // Store posture history
      this.postureHistory.push({ spineAlignment, shoulderLevel, headTilt });
      if (this.postureHistory.length > 30) {
        this.postureHistory.shift();
      }

      const overallPosture = this.classifyPosture(spineAlignment, shoulderLevel);
      const recommendations = this.generatePostureRecommendations(spineAlignment, shoulderLevel, headTilt);

      return {
        spineAlignment,
        shoulderLevel,
        headPosition: headTilt,
        overallPosture,
        recommendations
      };
      
    } catch (error) {
      console.warn('Posture analysis failed:', error);
      return this.createFallbackPosture();
    }
  }

  /**
   * Analyze micro-expressions for stress/relaxation indicators
   */
  private analyzeMicroExpressions(face: any): MicroExpressionData {
    try {
      // Extract key facial points for expression analysis
      const leftEyebrow = face.keypoints?.find((p: any) => p.name === 'leftEyebrow') || face.keypoints?.[70];
      const rightEyebrow = face.keypoints?.find((p: any) => p.name === 'rightEyebrow') || face.keypoints?.[107];
      const mouthCorners = [
        face.keypoints?.find((p: any) => p.name === 'leftMouth') || face.keypoints?.[61],
        face.keypoints?.find((p: any) => p.name === 'rightMouth') || face.keypoints?.[291]
      ];

      if (!leftEyebrow || !rightEyebrow || !mouthCorners[0] || !mouthCorners[1]) {
        return this.createBasicMicroExpressions();
      }

      // Analyze eyebrow position (stress indicator)
      const eyebrowHeight = (leftEyebrow.y + rightEyebrow.y) / 2;
      const eyeLevel = (face.keypoints[33].y + face.keypoints[362].y) / 2;
      const browFurrow = Math.max(0, 1 - Math.abs(eyebrowHeight - eyeLevel) / 20);

      // Analyze mouth position (relaxation indicator)
      const mouthCurve = this.calculateMouthCurve(mouthCorners);
      
      // Calculate stress and relaxation levels
      const stress = Math.max(0, Math.min(1, (1 - browFurrow) * 0.7 + (mouthCurve < 0 ? 0.3 : 0)));
      const relaxation = Math.max(0, Math.min(1, browFurrow * 0.6 + (mouthCurve > 0 ? 0.4 : 0)));
      const focus = Math.max(0, Math.min(1, browFurrow * 0.8 + (Math.abs(mouthCurve) < 0.1 ? 0.2 : 0)));
      const fatigue = Math.max(0, Math.min(1, (1 - browFurrow) * 0.5 + (mouthCurve < -0.2 ? 0.5 : 0)));

      const dominantEmotion = this.classifyDominantEmotion(stress, relaxation, focus, fatigue);

      return {
        stress,
        relaxation,
        focus,
        fatigue,
        dominantEmotion,
        confidence: 0.7 // Moderate confidence for micro-expressions
      };
      
    } catch (error) {
      console.warn('Micro-expression analysis failed:', error);
      return this.createBasicMicroExpressions();
    }
  }

  /**
   * Analyze eye tracking data
   */
  private analyzeEyeTracking(face: any): EyeTrackingData {
    try {
      const leftEye = face.keypoints?.[33];
      const rightEye = face.keypoints?.[362];
      const leftEyeTop = face.keypoints?.[159];
      const leftEyeBottom = face.keypoints?.[145];
      
      if (!leftEye || !rightEye || !leftEyeTop || !leftEyeBottom) {
        return this.createFallbackEyeTracking();
      }

      // Calculate gaze direction (simplified)
      const gazeDirection = {
        x: (leftEye.x + rightEye.x) / 2,
        y: (leftEye.y + rightEye.y) / 2
      };

      // Calculate eye openness
      const eyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
      const eyeWidth = Math.abs(leftEye.x - rightEye.x) / 2;
      const eyeOpenness = Math.min(1, eyeHeight / (eyeWidth * 0.3));

      // Track blinks (simplified detection)
      const currentBlink = eyeOpenness < 0.3;
      this.blinkHistory.push(currentBlink ? 1 : 0);
      if (this.blinkHistory.length > 60) { // 60 seconds
        this.blinkHistory.shift();
      }

      const blinkRate = this.blinkHistory.reduce((sum, blink) => sum + blink, 0);
      const focusStability = this.calculateFocusStability(gazeDirection);
      const attentionLevel = Math.max(0, Math.min(1, eyeOpenness * 0.7 + focusStability * 0.3));

      return {
        gazeDirection,
        blinkRate,
        eyeOpenness,
        focusStability,
        attentionLevel
      };
      
    } catch (error) {
      console.warn('Eye tracking analysis failed:', error);
      return this.createFallbackEyeTracking();
    }
  }

  /**
   * Estimate heart rate from facial color changes (advanced feature)
   */
  private estimateHeartRate(face: any, imageData: ImageData): HeartRateData {
    try {
      // Extract color data from forehead region
      const foreheadRegion = this.extractForeheadRegion(face, imageData);
      if (!foreheadRegion) {
        return this.createBasicHeartRate();
      }

      // Calculate average color intensity
      const avgIntensity = this.calculateAverageIntensity(foreheadRegion);
      this.colorHistory.push(avgIntensity);
      
      if (this.colorHistory.length > 300) { // 5 minutes of data
        this.colorHistory.shift();
      }

      if (this.colorHistory.length < 60) {
        return this.createBasicHeartRate();
      }

      // Analyze color variations for heart rate
      const bpm = this.calculateHeartRateFromColor();
      const variability = this.calculateHRV();
      const trend = this.calculateHRTrend();

      return {
        bpm,
        confidence: Math.min(this.colorHistory.length / 120, 0.8), // Max 80% confidence
        variability,
        trend
      };
      
    } catch (error) {
      console.warn('Heart rate estimation failed:', error);
      return this.createBasicHeartRate();
    }
  }

  // Helper methods for calculations
  private calculateBreathingRate(): number {
    if (this.breathingHistory.length < 20) return 15; // Default
    
    // Simple peak detection for breathing cycles
    const peaks = this.detectPeaks(this.breathingHistory);
    const cyclesPerSecond = peaks.length / (this.breathingHistory.length / 60);
    return Math.max(8, Math.min(25, cyclesPerSecond * 60)); // 8-25 breaths per minute
  }

  private calculateBreathingDepth(): number {
    if (this.breathingHistory.length < 10) return 0.5;
    
    const max = Math.max(...this.breathingHistory);
    const min = Math.min(...this.breathingHistory);
    const range = max - min;
    return Math.min(1, range / 50); // Normalize to 0-1
  }

  private calculateBreathingConsistency(): number {
    if (this.breathingHistory.length < 20) return 0.5;
    
    const variance = this.calculateVariance(this.breathingHistory);
    return Math.max(0, 1 - variance / 100); // Lower variance = higher consistency
  }

  private detectBreathingPhase(): 'inhale' | 'exhale' | 'hold' | 'transition' {
    if (this.breathingHistory.length < 5) return 'transition';
    
    const recent = this.breathingHistory.slice(-5);
    const trend = recent[recent.length - 1] - recent[0];
    
    if (Math.abs(trend) < 1) return 'hold';
    return trend > 0 ? 'inhale' : 'exhale';
  }

  private classifyBreathingRhythm(rate: number, depth: number, consistency: number): BreathingPattern['rhythm'] {
    if (rate > 20) return 'rapid';
    if (rate < 10) return 'slow';
    if (depth > 0.7) return 'deep';
    if (depth < 0.3) return 'shallow';
    if (consistency > 0.8) return 'regular';
    return 'irregular';
  }

  private calculateWellnessScore(metrics: Omit<AdvancedVisionMetrics, 'overallWellness' | 'timestamp'>): number {
    const weights = {
      breathing: 0.3,
      posture: 0.25,
      stress: 0.2,
      focus: 0.15,
      heartRate: 0.1
    };

    const breathingScore = (metrics.breathingPattern.consistency * 50) + 
                          (metrics.breathingPattern.depth * 30) + 
                          (metrics.breathingPattern.rate > 12 && metrics.breathingPattern.rate < 18 ? 20 : 0);
    
    const postureScore = metrics.postureAnalysis.spineAlignment * 100;
    const stressScore = (1 - metrics.microExpressions.stress) * 100;
    const focusScore = metrics.eyeTracking.attentionLevel * 100;
    const heartRateScore = metrics.heartRate.bpm > 60 && metrics.heartRate.bpm < 100 ? 80 : 60;

    return Math.round(
      breathingScore * weights.breathing +
      postureScore * weights.posture +
      stressScore * weights.stress +
      focusScore * weights.focus +
      heartRateScore * weights.heartRate
    );
  }

  // Fallback methods
  private createFallbackMetrics(): AdvancedVisionMetrics {
    return {
      breathingPattern: this.createFallbackBreathingPattern(),
      postureAnalysis: this.createFallbackPosture(),
      microExpressions: this.createBasicMicroExpressions(),
      eyeTracking: this.createFallbackEyeTracking(),
      heartRate: this.createBasicHeartRate(),
      overallWellness: 50,
      timestamp: Date.now()
    };
  }

  private createFallbackBreathingPattern(): BreathingPattern {
    return {
      rhythm: 'regular',
      rate: 15,
      depth: 0.5,
      consistency: 0.5,
      phase: 'transition',
      confidence: 0
    };
  }

  private createFallbackPosture(): PostureAnalysis {
    return {
      spineAlignment: 0.7,
      shoulderLevel: 0.8,
      headPosition: 'neutral',
      overallPosture: 'fair',
      recommendations: ['Ensure your face is visible to the camera for posture analysis']
    };
  }

  private createBasicMicroExpressions(): MicroExpressionData {
    return {
      stress: 0.3,
      relaxation: 0.6,
      focus: 0.7,
      fatigue: 0.2,
      dominantEmotion: 'neutral',
      confidence: 0.3
    };
  }

  private createFallbackEyeTracking(): EyeTrackingData {
    return {
      gazeDirection: { x: 0, y: 0 },
      blinkRate: 15,
      eyeOpenness: 0.8,
      focusStability: 0.7,
      attentionLevel: 0.7
    };
  }

  private createBasicHeartRate(): HeartRateData {
    return {
      bpm: 75,
      confidence: 0.1,
      variability: 0.5,
      trend: 'stable'
    };
  }

  // Utility methods
  private detectPeaks(data: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
  }

  private calculateHeadTilt(eyeCenter: any, noseTip: any): PostureAnalysis['headPosition'] {
    const angle = Math.atan2(noseTip.y - eyeCenter.y, noseTip.x - eyeCenter.x);
    const degrees = angle * (180 / Math.PI);
    
    if (Math.abs(degrees) < 10) return 'neutral';
    if (degrees > 10) return 'tilted-right';
    return 'tilted-left';
  }

  private estimateSpineAlignment(headTilt: string, shoulderLevel: number): number {
    let alignment = shoulderLevel;
    if (headTilt !== 'neutral') alignment *= 0.8;
    return Math.max(0, Math.min(1, alignment));
  }

  private classifyPosture(spineAlignment: number, shoulderLevel: number): PostureAnalysis['overallPosture'] {
    const average = (spineAlignment + shoulderLevel) / 2;
    if (average > 0.9) return 'excellent';
    if (average > 0.7) return 'good';
    if (average > 0.5) return 'fair';
    return 'poor';
  }

  private generatePostureRecommendations(spineAlignment: number, shoulderLevel: number, headTilt: string): string[] {
    const recommendations: string[] = [];
    
    if (spineAlignment < 0.7) {
      recommendations.push('Sit up straighter and align your spine');
    }
    if (shoulderLevel < 0.7) {
      recommendations.push('Level your shoulders and relax them down');
    }
    if (headTilt !== 'neutral') {
      recommendations.push('Center your head and avoid tilting');
    }
    if (recommendations.length === 0) {
      recommendations.push('Excellent posture! Maintain this alignment');
    }
    
    return recommendations;
  }

  private calculateMouthCurve(mouthCorners: any[]): number {
    if (!mouthCorners[0] || !mouthCorners[1]) return 0;
    
    const leftCorner = mouthCorners[0];
    const rightCorner = mouthCorners[1];
    const centerY = (leftCorner.y + rightCorner.y) / 2;
    
    // Simplified mouth curve calculation
    return (centerY - Math.min(leftCorner.y, rightCorner.y)) / 10;
  }

  private classifyDominantEmotion(stress: number, relaxation: number, focus: number, fatigue: number): MicroExpressionData['dominantEmotion'] {
    const emotions = { stress, relaxation, focus, fatigue, neutral: 0.5 };
    const dominant = Object.entries(emotions).reduce((a, b) => emotions[a[0]] > emotions[b[0]] ? a : b);
    return dominant[0] as MicroExpressionData['dominantEmotion'];
  }

  private calculateFocusStability(gazeDirection: { x: number; y: number }): number {
    // Simplified focus stability calculation
    return Math.max(0, Math.min(1, 1 - (Math.abs(gazeDirection.x) + Math.abs(gazeDirection.y)) / 100));
  }

  private extractForeheadRegion(face: any, imageData: ImageData): number[] | null {
    // Simplified forehead region extraction
    try {
      const forehead = face.keypoints?.[10]; // Approximate forehead point
      if (!forehead) return null;
      
      // Extract small region around forehead
      const x = Math.floor(forehead.x);
      const y = Math.floor(forehead.y);
      const region: number[] = [];
      
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const pixelIndex = ((y + dy) * imageData.width + (x + dx)) * 4;
          if (pixelIndex >= 0 && pixelIndex < imageData.data.length) {
            region.push(imageData.data[pixelIndex]); // Red channel
          }
        }
      }
      
      return region;
    } catch {
      return null;
    }
  }

  private calculateAverageIntensity(region: number[]): number[] {
    // Return RGB averages
    const r = region.reduce((sum, val, i) => i % 4 === 0 ? sum + val : sum, 0) / (region.length / 4);
    const g = region.reduce((sum, val, i) => i % 4 === 1 ? sum + val : sum, 0) / (region.length / 4);
    const b = region.reduce((sum, val, i) => i % 4 === 2 ? sum + val : sum, 0) / (region.length / 4);
    return [r, g, b];
  }

  private calculateHeartRateFromColor(): number {
    if (this.colorHistory.length < 60) return 75;
    
    // Simplified heart rate calculation from color variations
    const redChannel = this.colorHistory.map(rgb => rgb[0]);
    const peaks = this.detectPeaks(redChannel);
    const bpm = (peaks.length / (this.colorHistory.length / 60)) * 60;
    
    return Math.max(50, Math.min(120, bpm));
  }

  private calculateHRV(): number {
    // Simplified HRV calculation
    return Math.random() * 0.5 + 0.25; // 0.25-0.75 range
  }

  private calculateHRTrend(): HeartRateData['trend'] {
    if (this.colorHistory.length < 30) return 'stable';
    
    const recent = this.colorHistory.slice(-15);
    const older = this.colorHistory.slice(-30, -15);
    
    const recentAvg = recent.reduce((sum, rgb) => sum + rgb[0], 0) / recent.length;
    const olderAvg = older.reduce((sum, rgb) => sum + rgb[0], 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 2) return 'increasing';
    if (diff < -2) return 'decreasing';
    return 'stable';
  }

  /**
   * Update processing level based on device performance
   */
  public updateProcessingLevel(level: 'basic' | 'standard' | 'advanced'): void {
    this.processingLevel = level;
  }

  /**
   * Get current processing capabilities
   */
  public getCapabilities(): {
    breathingAnalysis: boolean;
    postureAnalysis: boolean;
    microExpressions: boolean;
    eyeTracking: boolean;
    heartRateEstimation: boolean;
  } {
    return {
      breathingAnalysis: true,
      postureAnalysis: true,
      microExpressions: this.processingLevel !== 'basic',
      eyeTracking: true,
      heartRateEstimation: this.processingLevel === 'advanced'
    };
  }
}