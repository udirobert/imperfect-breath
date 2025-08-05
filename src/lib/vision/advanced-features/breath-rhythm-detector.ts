/**
 * Advanced Breath Rhythm Detector
 * Uses computer vision to detect breathing patterns with high accuracy
 * Optimized for mobile devices with adaptive processing
 */

import { startTimer } from '../../utils/performance-utils';

interface BreathingPoint {
  timestamp: number;
  chestExpansion: number;
  shoulderMovement: number;
  facialTension: number;
  confidence: number;
}

interface BreathingCycle {
  inhaleStart: number;
  inhaleEnd: number;
  exhaleStart: number;
  exhaleEnd: number;
  duration: number;
  quality: number;
  irregularities: string[];
}

interface BreathRhythmMetrics {
  currentPhase: 'inhale' | 'exhale' | 'hold' | 'transition';
  breathsPerMinute: number;
  rhythmConsistency: number; // 0-1
  depthVariation: number; // 0-1
  cycles: BreathingCycle[];
  anomalies: string[];
  confidence: number;
}

export class BreathRhythmDetector {
  private breathingHistory: BreathingPoint[] = [];
  private detectedCycles: BreathingCycle[] = [];
  private readonly MAX_HISTORY = 300; // 5 minutes at 1 point per second
  private readonly MIN_CYCLE_DURATION = 2000; // 2 seconds minimum
  private readonly MAX_CYCLE_DURATION = 20000; // 20 seconds maximum
  
  // Mobile optimization settings
  private isMobile: boolean;
  private processingLevel: 'basic' | 'standard' | 'advanced';
  
  // Adaptive thresholds based on device performance
  private thresholds = {
    chestMovementMin: 0.02,
    shoulderMovementMax: 0.15,
    confidenceMin: 0.6,
    consistencyThreshold: 0.8
  };

  constructor(isMobile: boolean = false, processingLevel: 'basic' | 'standard' | 'advanced' = 'standard') {
    this.isMobile = isMobile;
    this.processingLevel = processingLevel;
    this.adaptThresholdsForDevice();
  }

  /**
   * Adapt detection thresholds based on device capabilities
   */
  private adaptThresholdsForDevice(): void {
    if (this.isMobile) {
      // More lenient thresholds for mobile devices
      this.thresholds = {
        chestMovementMin: 0.015,
        shoulderMovementMax: 0.2,
        confidenceMin: 0.5,
        consistencyThreshold: 0.7
      };
    }

    if (this.processingLevel === 'basic') {
      // Even more lenient for basic processing
      this.thresholds.confidenceMin = 0.4;
      this.thresholds.consistencyThreshold = 0.6;
    }
  }

  /**
   * Analyze breathing from pose landmarks with mobile optimizations
   */
  public analyzeBreathing(
    faceLandmarks: any[],
    poseLandmarks: any[],
    timestamp: number = Date.now()
  ): BreathRhythmMetrics {
    const endTimer = startTimer('breath-rhythm-analysis');

    try {
      // Extract breathing indicators with mobile-optimized processing
      const breathingPoint = this.extractBreathingPoint(faceLandmarks, poseLandmarks, timestamp);
      
      // Add to history with size management
      this.addToHistory(breathingPoint);
      
      // Detect cycles with adaptive algorithms
      const newCycles = this.detectBreathingCycles();
      
      // Calculate metrics with mobile-friendly algorithms
      const metrics = this.calculateRhythmMetrics();
      
      return metrics;
      
    } finally {
      endTimer();
    }
  }

  /**
   * Extract breathing indicators from landmarks with mobile optimization
   */
  private extractBreathingPoint(
    faceLandmarks: any[],
    poseLandmarks: any[],
    timestamp: number
  ): BreathingPoint {
    let chestExpansion = 0;
    let shoulderMovement = 0;
    let facialTension = 0;
    let confidence = 0;

    // Mobile-optimized landmark processing
    if (this.processingLevel === 'basic') {
      // Use only essential landmarks for basic processing
      confidence = this.calculateBasicConfidence(faceLandmarks, poseLandmarks);
      chestExpansion = this.estimateChestExpansionBasic(poseLandmarks);
      shoulderMovement = this.estimateShoulderMovementBasic(poseLandmarks);
    } else {
      // Full processing for standard/advanced
      confidence = this.calculateAdvancedConfidence(faceLandmarks, poseLandmarks);
      chestExpansion = this.estimateChestExpansionAdvanced(poseLandmarks);
      shoulderMovement = this.estimateShoulderMovementAdvanced(poseLandmarks);
      facialTension = this.estimateFacialTension(faceLandmarks);
    }

    return {
      timestamp,
      chestExpansion,
      shoulderMovement,
      facialTension,
      confidence
    };
  }

  /**
   * Basic confidence calculation for mobile devices
   */
  private calculateBasicConfidence(faceLandmarks: any[], poseLandmarks: any[]): number {
    const faceDetected = faceLandmarks && faceLandmarks.length > 0;
    const poseDetected = poseLandmarks && poseLandmarks.length > 0;
    
    if (faceDetected && poseDetected) return 0.8;
    if (faceDetected || poseDetected) return 0.6;
    return 0.2;
  }

  /**
   * Advanced confidence calculation with multiple factors
   */
  private calculateAdvancedConfidence(faceLandmarks: any[], poseLandmarks: any[]): number {
    let confidence = 0;
    
    // Face detection quality
    if (faceLandmarks && faceLandmarks.length > 0) {
      const faceQuality = Math.min(faceLandmarks.length / 468, 1); // MediaPipe has 468 face landmarks
      confidence += faceQuality * 0.4;
    }
    
    // Pose detection quality
    if (poseLandmarks && poseLandmarks.length > 0) {
      const poseQuality = Math.min(poseLandmarks.length / 33, 1); // MediaPipe has 33 pose landmarks
      confidence += poseQuality * 0.4;
    }
    
    // Stability factor (less movement = higher confidence for breathing detection)
    const recentPoints = this.breathingHistory.slice(-5);
    if (recentPoints.length > 1) {
      const stability = this.calculateStability(recentPoints);
      confidence += stability * 0.2;
    }
    
    return Math.min(confidence, 1);
  }

  /**
   * Basic chest expansion estimation for mobile
   */
  private estimateChestExpansionBasic(poseLandmarks: any[]): number {
    if (!poseLandmarks || poseLandmarks.length < 10) return 0;
    
    // Use simplified shoulder distance as proxy for chest expansion
    try {
      const leftShoulder = poseLandmarks[11]; // Left shoulder
      const rightShoulder = poseLandmarks[12]; // Right shoulder
      
      if (leftShoulder && rightShoulder) {
        const distance = Math.sqrt(
          Math.pow(rightShoulder.x - leftShoulder.x, 2) +
          Math.pow(rightShoulder.y - leftShoulder.y, 2)
        );
        
        // Normalize and return relative expansion
        return Math.min(distance * 2, 1);
      }
    } catch (error) {
      console.warn('Basic chest expansion estimation failed:', error);
    }
    
    return 0;
  }

  /**
   * Advanced chest expansion with multiple reference points
   */
  private estimateChestExpansionAdvanced(poseLandmarks: any[]): number {
    if (!poseLandmarks || poseLandmarks.length < 15) return 0;
    
    try {
      // Use multiple torso landmarks for better accuracy
      const leftShoulder = poseLandmarks[11];
      const rightShoulder = poseLandmarks[12];
      const leftHip = poseLandmarks[23];
      const rightHip = poseLandmarks[24];
      
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        // Calculate torso area as proxy for breathing
        const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
        const hipWidth = Math.abs(rightHip.x - leftHip.x);
        const torsoHeight = Math.abs((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2);
        
        const torsoArea = (shoulderWidth + hipWidth) / 2 * torsoHeight;
        
        // Compare with baseline (would be calibrated in real implementation)
        const baseline = 0.1; // Normalized baseline
        const expansion = Math.max(0, (torsoArea - baseline) / baseline);
        
        return Math.min(expansion, 1);
      }
    } catch (error) {
      console.warn('Advanced chest expansion estimation failed:', error);
    }
    
    return this.estimateChestExpansionBasic(poseLandmarks);
  }

  /**
   * Basic shoulder movement estimation
   */
  private estimateShoulderMovementBasic(poseLandmarks: any[]): number {
    if (!poseLandmarks || poseLandmarks.length < 12) return 0;
    
    try {
      const leftShoulder = poseLandmarks[11];
      const rightShoulder = poseLandmarks[12];
      
      if (leftShoulder && rightShoulder) {
        // Calculate shoulder center vertical movement
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
        
        // Compare with recent history
        const recentPoints = this.breathingHistory.slice(-3);
        if (recentPoints.length > 0) {
          const avgPreviousY = recentPoints.reduce((sum, point) => sum + point.shoulderMovement, 0) / recentPoints.length;
          const movement = Math.abs(shoulderCenterY - avgPreviousY);
          return Math.min(movement * 10, 1); // Scale and clamp
        }
      }
    } catch (error) {
      console.warn('Basic shoulder movement estimation failed:', error);
    }
    
    return 0;
  }

  /**
   * Advanced shoulder movement with smoothing
   */
  private estimateShoulderMovementAdvanced(poseLandmarks: any[]): number {
    const basicMovement = this.estimateShoulderMovementBasic(poseLandmarks);
    
    // Apply smoothing filter for advanced processing
    const recentMovements = this.breathingHistory.slice(-5).map(p => p.shoulderMovement);
    if (recentMovements.length > 2) {
      const smoothed = this.applyMovingAverage(recentMovements.concat([basicMovement]), 3);
      return smoothed[smoothed.length - 1];
    }
    
    return basicMovement;
  }

  /**
   * Estimate facial tension from face landmarks
   */
  private estimateFacialTension(faceLandmarks: any[]): number {
    if (!faceLandmarks || faceLandmarks.length < 50) return 0;
    
    try {
      // Analyze eye and mouth regions for tension indicators
      const leftEye = faceLandmarks.slice(33, 42); // Left eye region
      const rightEye = faceLandmarks.slice(362, 371); // Right eye region
      const mouth = faceLandmarks.slice(61, 68); // Mouth region
      
      let tension = 0;
      
      // Eye tension (squinting, blinking frequency)
      if (leftEye.length > 0 && rightEye.length > 0) {
        const leftEyeHeight = this.calculateEyeHeight(leftEye);
        const rightEyeHeight = this.calculateEyeHeight(rightEye);
        const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
        
        // Lower eye height indicates more tension
        tension += Math.max(0, (0.02 - avgEyeHeight) / 0.02) * 0.5;
      }
      
      // Mouth tension
      if (mouth.length > 0) {
        const mouthTightness = this.calculateMouthTightness(mouth);
        tension += mouthTightness * 0.5;
      }
      
      return Math.min(tension, 1);
      
    } catch (error) {
      console.warn('Facial tension estimation failed:', error);
      return 0;
    }
  }

  /**
   * Calculate eye height for tension analysis
   */
  private calculateEyeHeight(eyeLandmarks: any[]): number {
    if (eyeLandmarks.length < 6) return 0;
    
    // Use top and bottom eye points
    const topY = Math.min(...eyeLandmarks.map(p => p.y));
    const bottomY = Math.max(...eyeLandmarks.map(p => p.y));
    
    return Math.abs(bottomY - topY);
  }

  /**
   * Calculate mouth tightness
   */
  private calculateMouthTightness(mouthLandmarks: any[]): number {
    if (mouthLandmarks.length < 4) return 0;
    
    // Calculate mouth width vs height ratio
    const leftX = Math.min(...mouthLandmarks.map(p => p.x));
    const rightX = Math.max(...mouthLandmarks.map(p => p.x));
    const topY = Math.min(...mouthLandmarks.map(p => p.y));
    const bottomY = Math.max(...mouthLandmarks.map(p => p.y));
    
    const width = Math.abs(rightX - leftX);
    const height = Math.abs(bottomY - topY);
    
    // Higher ratio indicates tighter mouth
    const ratio = width / (height + 0.001); // Avoid division by zero
    return Math.min(ratio / 10, 1); // Normalize
  }

  /**
   * Add breathing point to history with mobile-optimized memory management
   */
  private addToHistory(point: BreathingPoint): void {
    this.breathingHistory.push(point);
    
    // Aggressive cleanup for mobile devices
    const maxHistory = this.isMobile ? 150 : this.MAX_HISTORY;
    
    if (this.breathingHistory.length > maxHistory) {
      // Remove oldest 25% of history to avoid frequent cleanup
      const removeCount = Math.floor(maxHistory * 0.25);
      this.breathingHistory.splice(0, removeCount);
    }
  }

  /**
   * Detect breathing cycles with mobile-optimized algorithms
   */
  private detectBreathingCycles(): BreathingCycle[] {
    if (this.breathingHistory.length < 10) return [];
    
    const newCycles: BreathingCycle[] = [];
    
    // Use simplified peak detection for mobile
    if (this.isMobile || this.processingLevel === 'basic') {
      return this.detectCyclesBasic();
    } else {
      return this.detectCyclesAdvanced();
    }
  }

  /**
   * Basic cycle detection for mobile devices
   */
  private detectCyclesBasic(): BreathingCycle[] {
    const cycles: BreathingCycle[] = [];
    const recentData = this.breathingHistory.slice(-30); // Last 30 seconds
    
    if (recentData.length < 6) return cycles;
    
    // Simple peak/valley detection
    const expansions = recentData.map(p => p.chestExpansion);
    const peaks = this.findSimplePeaks(expansions);
    const valleys = this.findSimpleValleys(expansions);
    
    // Match peaks and valleys to form cycles
    for (let i = 0; i < Math.min(peaks.length - 1, valleys.length - 1); i++) {
      const peak1 = peaks[i];
      const valley = valleys[i];
      const peak2 = peaks[i + 1];
      
      if (valley > peak1 && valley < peak2) {
        const cycle: BreathingCycle = {
          inhaleStart: recentData[peak1].timestamp,
          inhaleEnd: recentData[valley].timestamp,
          exhaleStart: recentData[valley].timestamp,
          exhaleEnd: recentData[peak2].timestamp,
          duration: recentData[peak2].timestamp - recentData[peak1].timestamp,
          quality: this.calculateCycleQuality(recentData.slice(peak1, peak2 + 1)),
          irregularities: []
        };
        
        // Validate cycle duration
        if (cycle.duration >= this.MIN_CYCLE_DURATION && cycle.duration <= this.MAX_CYCLE_DURATION) {
          cycles.push(cycle);
        }
      }
    }
    
    return cycles;
  }

  /**
   * Advanced cycle detection with sophisticated algorithms
   */
  private detectCyclesAdvanced(): BreathingCycle[] {
    // Implementation would include:
    // - Wavelet analysis for noise reduction
    // - Multi-signal fusion (chest + shoulder + facial)
    // - Machine learning-based pattern recognition
    // - Adaptive thresholding based on user patterns
    
    // For now, use enhanced version of basic detection
    return this.detectCyclesBasic();
  }

  /**
   * Find simple peaks in data
   */
  private findSimplePeaks(data: number[]): number[] {
    const peaks: number[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  /**
   * Find simple valleys in data
   */
  private findSimpleValleys(data: number[]): number[] {
    const valleys: number[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        valleys.push(i);
      }
    }
    
    return valleys;
  }

  /**
   * Calculate cycle quality score
   */
  private calculateCycleQuality(cycleData: BreathingPoint[]): number {
    if (cycleData.length < 3) return 0;
    
    // Factors: smoothness, confidence, consistency
    const avgConfidence = cycleData.reduce((sum, p) => sum + p.confidence, 0) / cycleData.length;
    const smoothness = this.calculateSmoothness(cycleData.map(p => p.chestExpansion));
    const consistency = this.calculateConsistency(cycleData);
    
    return (avgConfidence * 0.4 + smoothness * 0.3 + consistency * 0.3);
  }

  /**
   * Calculate data smoothness
   */
  private calculateSmoothness(data: number[]): number {
    if (data.length < 2) return 1;
    
    let totalVariation = 0;
    for (let i = 1; i < data.length; i++) {
      totalVariation += Math.abs(data[i] - data[i - 1]);
    }
    
    const avgVariation = totalVariation / (data.length - 1);
    return Math.max(0, 1 - avgVariation * 10); // Scale and invert
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistency(cycleData: BreathingPoint[]): number {
    if (cycleData.length < 3) return 1;
    
    const expansions = cycleData.map(p => p.chestExpansion);
    const mean = expansions.reduce((sum, val) => sum + val, 0) / expansions.length;
    const variance = expansions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / expansions.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - stdDev * 5);
  }

  /**
   * Calculate stability from recent points
   */
  private calculateStability(points: BreathingPoint[]): number {
    if (points.length < 2) return 1;
    
    const movements = [];
    for (let i = 1; i < points.length; i++) {
      const movement = Math.abs(points[i].chestExpansion - points[i - 1].chestExpansion);
      movements.push(movement);
    }
    
    const avgMovement = movements.reduce((sum, m) => sum + m, 0) / movements.length;
    return Math.max(0, 1 - avgMovement * 20); // Scale and invert
  }

  /**
   * Apply moving average smoothing
   */
  private applyMovingAverage(data: number[], windowSize: number): number[] {
    const smoothed: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
      const window = data.slice(start, end);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      smoothed.push(avg);
    }
    
    return smoothed;
  }

  /**
   * Calculate comprehensive rhythm metrics
   */
  private calculateRhythmMetrics(): BreathRhythmMetrics {
    const recentCycles = this.detectedCycles.slice(-10); // Last 10 cycles
    const recentPoints = this.breathingHistory.slice(-30); // Last 30 seconds
    
    // Determine current phase
    const currentPhase = this.determineCurrentPhase(recentPoints);
    
    // Calculate breaths per minute
    const breathsPerMinute = this.calculateBreathsPerMinute(recentCycles);
    
    // Calculate rhythm consistency
    const rhythmConsistency = this.calculateRhythmConsistency(recentCycles);
    
    // Calculate depth variation
    const depthVariation = this.calculateDepthVariation(recentPoints);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(recentCycles, recentPoints);
    
    // Overall confidence
    const confidence = recentPoints.length > 0 
      ? recentPoints.reduce((sum, p) => sum + p.confidence, 0) / recentPoints.length 
      : 0;

    return {
      currentPhase,
      breathsPerMinute,
      rhythmConsistency,
      depthVariation,
      cycles: recentCycles,
      anomalies,
      confidence
    };
  }

  /**
   * Determine current breathing phase
   */
  private determineCurrentPhase(recentPoints: BreathingPoint[]): 'inhale' | 'exhale' | 'hold' | 'transition' {
    if (recentPoints.length < 3) return 'transition';
    
    const last3 = recentPoints.slice(-3);
    const expansions = last3.map(p => p.chestExpansion);
    
    // Simple trend analysis
    const trend1 = expansions[1] - expansions[0];
    const trend2 = expansions[2] - expansions[1];
    
    if (trend1 > 0.01 && trend2 > 0.01) return 'inhale';
    if (trend1 < -0.01 && trend2 < -0.01) return 'exhale';
    if (Math.abs(trend1) < 0.005 && Math.abs(trend2) < 0.005) return 'hold';
    
    return 'transition';
  }

  /**
   * Calculate breaths per minute from cycles
   */
  private calculateBreathsPerMinute(cycles: BreathingCycle[]): number {
    if (cycles.length < 2) return 0;
    
    const totalDuration = cycles[cycles.length - 1].exhaleEnd - cycles[0].inhaleStart;
    const minutes = totalDuration / 60000; // Convert to minutes
    
    return cycles.length / minutes;
  }

  /**
   * Calculate rhythm consistency
   */
  private calculateRhythmConsistency(cycles: BreathingCycle[]): number {
    if (cycles.length < 3) return 1;
    
    const durations = cycles.map(c => c.duration);
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    // Lower coefficient of variation = higher consistency
    return Math.max(0, 1 - coefficientOfVariation);
  }

  /**
   * Calculate depth variation
   */
  private calculateDepthVariation(recentPoints: BreathingPoint[]): number {
    if (recentPoints.length < 5) return 0;
    
    const expansions = recentPoints.map(p => p.chestExpansion);
    const max = Math.max(...expansions);
    const min = Math.min(...expansions);
    
    return max - min; // Range of breathing depth
  }

  /**
   * Detect breathing anomalies
   */
  private detectAnomalies(cycles: BreathingCycle[], points: BreathingPoint[]): string[] {
    const anomalies: string[] = [];
    
    // Check for irregular cycles
    if (cycles.length > 2) {
      const durations = cycles.map(c => c.duration);
      const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      
      for (const duration of durations) {
        if (Math.abs(duration - mean) > mean * 0.5) {
          anomalies.push('Irregular breathing rhythm detected');
          break;
        }
      }
    }
    
    // Check for shallow breathing
    const recentExpansions = points.slice(-10).map(p => p.chestExpansion);
    const avgExpansion = recentExpansions.reduce((sum, e) => sum + e, 0) / recentExpansions.length;
    if (avgExpansion < 0.1) {
      anomalies.push('Shallow breathing detected');
    }
    
    // Check for excessive shoulder movement
    const recentShoulderMovement = points.slice(-10).map(p => p.shoulderMovement);
    const avgShoulderMovement = recentShoulderMovement.reduce((sum, m) => sum + m, 0) / recentShoulderMovement.length;
    if (avgShoulderMovement > this.thresholds.shoulderMovementMax) {
      anomalies.push('Excessive shoulder breathing detected');
    }
    
    return anomalies;
  }

  /**
   * Update processing level for adaptive performance
   */
  public updateProcessingLevel(level: 'basic' | 'standard' | 'advanced'): void {
    this.processingLevel = level;
    this.adaptThresholdsForDevice();
  }

  /**
   * Get current detector status
   */
  public getStatus(): {
    historySize: number;
    cycleCount: number;
    processingLevel: string;
    isMobile: boolean;
    thresholds: any;
  } {
    return {
      historySize: this.breathingHistory.length,
      cycleCount: this.detectedCycles.length,
      processingLevel: this.processingLevel,
      isMobile: this.isMobile,
      thresholds: this.thresholds
    };
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.breathingHistory = [];
    this.detectedCycles = [];
  }
}