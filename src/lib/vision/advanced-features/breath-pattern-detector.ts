/**
 * Advanced Breath Pattern Detector
 * Real-time breathing rhythm detection using facial landmarks and chest movement
 * Optimized for mobile performance
 */

import { startTimer } from '../../utils/performance-utils';

export interface BreathingPattern {
  phase: 'inhale' | 'exhale' | 'hold' | 'transition';
  intensity: number; // 0-1
  rhythm: number; // breaths per minute
  regularity: number; // 0-1, how consistent the pattern is
  confidence: number; // 0-1, detection confidence
  timestamp: number;
}

export interface BreathingAnalysis {
  currentPattern: BreathingPattern;
  averageRhythm: number;
  rhythmVariability: number;
  patternQuality: number; // 0-100
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

export class BreathPatternDetector {
  private breathingHistory: BreathingPattern[] = [];
  private landmarkHistory: number[][] = [];
  private readonly MAX_HISTORY = 60; // 60 seconds of data
  private readonly MOBILE_OPTIMIZATION = true;
  
  // Mobile-optimized detection parameters
  private readonly DETECTION_SENSITIVITY = 0.3; // Reduced for mobile stability
  private readonly SMOOTHING_FACTOR = 0.7; // Higher smoothing for mobile
  private readonly MIN_BREATH_DURATION = 2000; // 2 seconds minimum
  private readonly MAX_BREATH_DURATION = 15000; // 15 seconds maximum

  // Breathing detection state
  private lastBreathPhase: 'inhale' | 'exhale' | 'hold' | 'transition' = 'transition';
  private phaseStartTime = 0;
  private breathingBaseline = 0;
  private isCalibrated = false;

  /**
   * Detect breathing pattern from facial landmarks
   * Optimized for mobile performance with reduced computational complexity
   */
  public detectBreathingPattern(
    faceLandmarks: any[],
    timestamp: number = Date.now()
  ): BreathingPattern | null {
    const endTimer = startTimer('breath-pattern-detection');
    
    try {
      if (!faceLandmarks || faceLandmarks.length === 0) {
        return this.createFallbackPattern(timestamp);
      }

      // Extract breathing-related landmarks (mobile-optimized subset)
      const breathingSignal = this.extractBreathingSignal(faceLandmarks);
      if (breathingSignal === null) {
        return this.createFallbackPattern(timestamp);
      }

      // Calibrate baseline if needed
      if (!this.isCalibrated) {
        this.calibrateBaseline(breathingSignal);
        return this.createFallbackPattern(timestamp);
      }

      // Detect current breathing phase
      const phase = this.detectBreathingPhase(breathingSignal, timestamp);
      const intensity = this.calculateBreathingIntensity(breathingSignal);
      const rhythm = this.calculateBreathingRhythm();
      const regularity = this.calculateBreathingRegularity();
      const confidence = this.calculateDetectionConfidence(faceLandmarks);

      const pattern: BreathingPattern = {
        phase,
        intensity,
        rhythm,
        regularity,
        confidence,
        timestamp
      };

      // Add to history with mobile-optimized size management
      this.addToHistory(pattern);
      
      return pattern;
      
    } finally {
      endTimer();
    }
  }

  /**
   * Extract breathing signal from facial landmarks
   * Uses mobile-optimized landmark subset for better performance
   */
  private extractBreathingSignal(landmarks: any[]): number | null {
    try {
      // Mobile-optimized: Use fewer landmarks for better performance
      // Focus on nose tip and mouth area for breathing detection
      const noseTip = landmarks[1]; // Nose tip
      const mouthTop = landmarks[13]; // Upper lip
      const mouthBottom = landmarks[14]; // Lower lip
      
      if (!noseTip || !mouthTop || !mouthBottom) {
        return null;
      }

      // Calculate breathing signal based on mouth opening and nose movement
      const mouthOpening = Math.abs(mouthTop.y - mouthBottom.y);
      const noseMovement = noseTip.y;
      
      // Combine signals with mobile-optimized weighting
      const breathingSignal = (mouthOpening * 0.7) + (noseMovement * 0.3);
      
      // Apply mobile-optimized smoothing
      if (this.landmarkHistory.length > 0) {
        const lastSignal = this.landmarkHistory[this.landmarkHistory.length - 1][0];
        return (breathingSignal * (1 - this.SMOOTHING_FACTOR)) + (lastSignal * this.SMOOTHING_FACTOR);
      }
      
      return breathingSignal;
      
    } catch (error) {
      console.warn('Breathing signal extraction failed:', error);
      return null;
    }
  }

  /**
   * Calibrate breathing baseline for personalized detection
   */
  private calibrateBaseline(signal: number): void {
    this.landmarkHistory.push([signal]);
    
    // Calibrate after collecting enough samples (mobile-optimized: 10 samples)
    if (this.landmarkHistory.length >= 10) {
      const signals = this.landmarkHistory.map(h => h[0]);
      this.breathingBaseline = signals.reduce((sum, s) => sum + s, 0) / signals.length;
      this.isCalibrated = true;
      console.log('Breathing baseline calibrated:', this.breathingBaseline);
    }
  }

  /**
   * Detect current breathing phase with mobile-optimized logic
   */
  private detectBreathingPhase(
    signal: number, 
    timestamp: number
  ): 'inhale' | 'exhale' | 'hold' | 'transition' {
    const deviation = signal - this.breathingBaseline;
    const normalizedDeviation = Math.abs(deviation) / this.breathingBaseline;
    
    // Mobile-optimized phase detection with hysteresis
    let newPhase: 'inhale' | 'exhale' | 'hold' | 'transition';
    
    if (normalizedDeviation < this.DETECTION_SENSITIVITY * 0.5) {
      newPhase = 'hold';
    } else if (deviation > this.DETECTION_SENSITIVITY) {
      newPhase = 'inhale';
    } else if (deviation < -this.DETECTION_SENSITIVITY) {
      newPhase = 'exhale';
    } else {
      newPhase = 'transition';
    }
    
    // Prevent rapid phase changes (mobile stability)
    const timeSincePhaseChange = timestamp - this.phaseStartTime;
    if (newPhase !== this.lastBreathPhase && timeSincePhaseChange > 500) {
      this.lastBreathPhase = newPhase;
      this.phaseStartTime = timestamp;
    }
    
    return this.lastBreathPhase;
  }

  /**
   * Calculate breathing intensity (mobile-optimized)
   */
  private calculateBreathingIntensity(signal: number): number {
    if (!this.isCalibrated) return 0.5;
    
    const deviation = Math.abs(signal - this.breathingBaseline);
    const normalizedIntensity = Math.min(deviation / (this.breathingBaseline * 0.5), 1);
    
    return normalizedIntensity;
  }

  /**
   * Calculate breathing rhythm (breaths per minute)
   */
  private calculateBreathingRhythm(): number {
    if (this.breathingHistory.length < 4) return 15; // Default rhythm
    
    // Count complete breath cycles in the last 30 seconds
    const thirtySecondsAgo = Date.now() - 30000;
    const recentBreaths = this.breathingHistory.filter(b => b.timestamp > thirtySecondsAgo);
    
    // Count phase transitions as breath indicators
    let breathCount = 0;
    let lastPhase = '';
    
    for (const breath of recentBreaths) {
      if (breath.phase === 'inhale' && lastPhase === 'exhale') {
        breathCount++;
      }
      lastPhase = breath.phase;
    }
    
    // Convert to breaths per minute
    const timeSpanMinutes = Math.max((Date.now() - recentBreaths[0]?.timestamp || 0) / 60000, 0.5);
    return Math.round((breathCount / timeSpanMinutes) || 15);
  }

  /**
   * Calculate breathing regularity (consistency)
   */
  private calculateBreathingRegularity(): number {
    if (this.breathingHistory.length < 10) return 0.5;
    
    const recent = this.breathingHistory.slice(-20); // Last 20 samples
    const rhythms = recent.map(b => b.rhythm).filter(r => r > 0);
    
    if (rhythms.length < 5) return 0.5;
    
    const average = rhythms.reduce((sum, r) => sum + r, 0) / rhythms.length;
    const variance = rhythms.reduce((sum, r) => sum + Math.pow(r - average, 2), 0) / rhythms.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher regularity
    const regularity = Math.max(0, 1 - (standardDeviation / average));
    return Math.min(regularity, 1);
  }

  /**
   * Calculate detection confidence based on landmark quality
   */
  private calculateDetectionConfidence(landmarks: any[]): number {
    if (!landmarks || landmarks.length === 0) return 0;
    
    // Mobile-optimized confidence calculation
    const expectedLandmarks = 468; // MediaPipe face mesh
    const detectedLandmarks = landmarks.length;
    const landmarkConfidence = Math.min(detectedLandmarks / expectedLandmarks, 1);
    
    // Factor in calibration status
    const calibrationConfidence = this.isCalibrated ? 1 : 0.3;
    
    // Factor in history length
    const historyConfidence = Math.min(this.breathingHistory.length / 10, 1);
    
    return (landmarkConfidence * 0.5) + (calibrationConfidence * 0.3) + (historyConfidence * 0.2);
  }

  /**
   * Add pattern to history with mobile-optimized memory management
   */
  private addToHistory(pattern: BreathingPattern): void {
    this.breathingHistory.push(pattern);
    
    // Mobile-optimized: Keep smaller history for memory efficiency
    if (this.breathingHistory.length > this.MAX_HISTORY) {
      this.breathingHistory.shift();
    }
    
    // Also manage landmark history
    if (this.landmarkHistory.length > 30) { // Reduced from 60 for mobile
      this.landmarkHistory.shift();
    }
  }

  /**
   * Create fallback pattern when detection fails
   */
  private createFallbackPattern(timestamp: number): BreathingPattern {
    return {
      phase: 'transition',
      intensity: 0,
      rhythm: 15, // Default breathing rate
      regularity: 0,
      confidence: 0,
      timestamp
    };
  }

  /**
   * Get comprehensive breathing analysis
   */
  public getBreathingAnalysis(): BreathingAnalysis {
    if (this.breathingHistory.length === 0) {
      return {
        currentPattern: this.createFallbackPattern(Date.now()),
        averageRhythm: 15,
        rhythmVariability: 0,
        patternQuality: 0,
        recommendations: ['Continue breathing naturally to establish baseline'],
        trend: 'stable'
      };
    }

    const current = this.breathingHistory[this.breathingHistory.length - 1];
    const recent = this.breathingHistory.slice(-20);
    
    const averageRhythm = recent.reduce((sum, b) => sum + b.rhythm, 0) / recent.length;
    const rhythmVariability = this.calculateBreathingRegularity();
    const patternQuality = this.calculatePatternQuality();
    const recommendations = this.generateRecommendations();
    const trend = this.calculateTrend();

    return {
      currentPattern: current,
      averageRhythm: Math.round(averageRhythm),
      rhythmVariability,
      patternQuality: Math.round(patternQuality * 100),
      recommendations,
      trend
    };
  }

  /**
   * Calculate overall pattern quality score
   */
  private calculatePatternQuality(): number {
    if (this.breathingHistory.length < 10) return 0;
    
    const recent = this.breathingHistory.slice(-20);
    const avgConfidence = recent.reduce((sum, b) => sum + b.confidence, 0) / recent.length;
    const avgRegularity = recent.reduce((sum, b) => sum + b.regularity, 0) / recent.length;
    const rhythmInRange = recent.filter(b => b.rhythm >= 8 && b.rhythm <= 20).length / recent.length;
    
    return (avgConfidence * 0.4) + (avgRegularity * 0.4) + (rhythmInRange * 0.2);
  }

  /**
   * Generate personalized breathing recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const analysis = this.getBasicAnalysis();
    
    if (analysis.averageRhythm > 20) {
      recommendations.push('Your breathing is quite fast. Try to slow down and breathe more deeply.');
    } else if (analysis.averageRhythm < 8) {
      recommendations.push('Your breathing is very slow. Ensure you\'re getting enough oxygen.');
    }
    
    if (analysis.rhythmVariability < 0.3) {
      recommendations.push('Try to maintain a more consistent breathing rhythm.');
    }
    
    if (analysis.patternQuality < 50) {
      recommendations.push('Focus on establishing a steady breathing pattern.');
    } else if (analysis.patternQuality > 80) {
      recommendations.push('Excellent breathing pattern! You\'re doing great.');
    }
    
    if (!this.isCalibrated) {
      recommendations.push('Keep breathing naturally while we calibrate to your pattern.');
    }
    
    return recommendations.slice(0, 2); // Limit to 2 recommendations for mobile
  }

  /**
   * Calculate breathing trend
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (this.breathingHistory.length < 20) return 'stable';
    
    const firstHalf = this.breathingHistory.slice(-20, -10);
    const secondHalf = this.breathingHistory.slice(-10);
    
    const firstQuality = firstHalf.reduce((sum, b) => sum + b.regularity, 0) / firstHalf.length;
    const secondQuality = secondHalf.reduce((sum, b) => sum + b.regularity, 0) / secondHalf.length;
    
    const improvement = secondQuality - firstQuality;
    
    if (improvement > 0.1) return 'improving';
    if (improvement < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Get basic analysis for internal use
   */
  private getBasicAnalysis() {
    const recent = this.breathingHistory.slice(-10);
    return {
      averageRhythm: recent.reduce((sum, b) => sum + b.rhythm, 0) / recent.length || 15,
      rhythmVariability: recent.reduce((sum, b) => sum + b.regularity, 0) / recent.length || 0,
      patternQuality: this.calculatePatternQuality() * 100
    };
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.breathingHistory = [];
    this.landmarkHistory = [];
    this.isCalibrated = false;
    this.breathingBaseline = 0;
    this.lastBreathPhase = 'transition';
    this.phaseStartTime = 0;
  }

  /**
   * Get detector status for debugging
   */
  public getStatus(): {
    isCalibrated: boolean;
    historyLength: number;
    baseline: number;
    currentPhase: string;
  } {
    return {
      isCalibrated: this.isCalibrated,
      historyLength: this.breathingHistory.length,
      baseline: this.breathingBaseline,
      currentPhase: this.lastBreathPhase
    };
  }
}