/**
 * Breath Pattern Detector
 * Real-time breathing rhythm detection using facial landmarks and chest movement
 * Optimized for mobile performance
 */

import { startTimer } from '../utils/performance-utils';

interface BreathingPhase {
  phase: 'inhale' | 'exhale' | 'hold' | 'transition';
  confidence: number;
  duration: number;
  timestamp: number;
}

interface BreathPattern {
  rate: number; // breaths per minute
  rhythm: 'regular' | 'irregular' | 'deep' | 'shallow';
  phases: BreathingPhase[];
  quality: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export class BreathPatternDetector {
  private breathingHistory: number[] = [];
  private phaseHistory: BreathingPhase[] = [];
  private lastPhaseChange = 0;
  private currentPhase: 'inhale' | 'exhale' | 'hold' | 'transition' = 'inhale';
  
  // Mobile optimization: smaller history sizes
  private readonly MAX_HISTORY = 30; // 30 seconds at 1Hz
  private currentFPS = 1; // Track actual FPS for dynamic history sizing
  private readonly PHASE_HISTORY_SIZE = 20;
  
  // Breathing detection parameters
  private readonly NOSE_TIP_INDEX = 1;
  private readonly CHIN_INDEX = 175;
  private readonly FOREHEAD_INDEX = 10;
  
  // Smoothing and filtering
  private movingAverage: number[] = [];
  private readonly SMOOTHING_WINDOW = 5;
  
  /**
   * Detect breathing pattern from facial landmarks
   */
  public detectBreathingPattern(
    faceLandmarks: LandmarkPoint[],
    timestamp: number = Date.now(),
    actualFPS?: number // Allow dynamic FPS adjustment
  ): BreathPattern | null {
    const endTimer = startTimer('breath-pattern-detection');
    
    try {
      // Update FPS tracking for dynamic history sizing
      if (actualFPS && actualFPS > 0) {
        this.currentFPS = actualFPS;
      }
      
      if (!faceLandmarks || faceLandmarks.length < 200) {
        return null;
      }
      
      // Extract breathing signal from facial landmarks
      const breathingSignal = this.extractBreathingSignal(faceLandmarks);
      if (breathingSignal === null) return null;
      
      // Dynamic history size based on actual FPS (maintain ~30 seconds of data)
      const dynamicHistorySize = Math.max(10, Math.min(this.MAX_HISTORY, Math.round(30 * this.currentFPS)));
      
      // Add to history with dynamic size limits
      this.breathingHistory.push(breathingSignal);
      if (this.breathingHistory.length > dynamicHistorySize) {
        this.breathingHistory.shift();
      }
      
      // Detect current breathing phase
      const currentPhase = this.detectCurrentPhase(breathingSignal, timestamp);
      
      // Calculate breathing rate (mobile-optimized)
      const breathingRate = this.calculateBreathingRate();
      
      // Analyze rhythm quality
      const rhythm = this.analyzeRhythm();
      const quality = this.calculateQuality();
      const trend = this.analyzeTrend();
      
      return {
        rate: breathingRate,
        rhythm,
        phases: this.phaseHistory.slice(-5), // Last 5 phases for mobile
        quality,
        trend
      };
      
    } catch (error) {
      console.error('Breath pattern detection error:', error);
      return null;
    } finally {
      endTimer();
    }
  }
  
  /**
   * Extract breathing signal from facial landmarks
   * Uses nose-to-chin distance and subtle head movements
   */
  private extractBreathingSignal(landmarks: LandmarkPoint[]): number | null {
    try {
      const noseTip = landmarks[this.NOSE_TIP_INDEX];
      const chin = landmarks[this.CHIN_INDEX];
      const forehead = landmarks[this.FOREHEAD_INDEX];
      
      // Robust validation of landmark data
      if (!noseTip || !noseTip.x || !noseTip.y || 
          !chin || !chin.x || !chin.y || 
          !forehead || !forehead.x || !forehead.y) {
        return null;
      }
      
      // Calculate face height (nose to chin distance)
      const faceHeight = Math.sqrt(
        Math.pow(noseTip.x - chin.x, 2) + 
        Math.pow(noseTip.y - chin.y, 2)
      );
      
      // Calculate head tilt (subtle breathing-related movement)
      const headTilt = Math.atan2(
        forehead.y - chin.y,
        forehead.x - chin.x
      );
      
      // Combine signals with weights optimized for mobile processing
      const signal = faceHeight * 0.7 + Math.abs(headTilt) * 0.3;
      
      // Apply smoothing for mobile stability
      this.movingAverage.push(signal);
      if (this.movingAverage.length > this.SMOOTHING_WINDOW) {
        this.movingAverage.shift();
      }
      
      // Ensure we don't return NaN
      const smoothedSignal = this.movingAverage.reduce((sum, val) => sum + val, 0) / this.movingAverage.length;
      return isNaN(smoothedSignal) ? null : smoothedSignal;
      
    } catch (error) {
      console.error('Signal extraction error:', error);
      return null;
    }
  }
  
  /**
   * Detect current breathing phase using signal analysis
   */
  private detectCurrentPhase(signal: number, timestamp: number): BreathingPhase {
    if (this.breathingHistory.length < 3) {
      return {
        phase: 'transition',
        confidence: 0.5,
        duration: 0,
        timestamp
      };
    }
    
    const recent = this.breathingHistory.slice(-3);
    const trend = recent[2] - recent[0];
    const stability = Math.abs(recent[2] - recent[1]);
    
    let phase: 'inhale' | 'exhale' | 'hold' | 'transition';
    let confidence: number;
    
    // Mobile-optimized thresholds
    const TREND_THRESHOLD = 0.002;
    const STABILITY_THRESHOLD = 0.001;
    
    if (stability < STABILITY_THRESHOLD) {
      phase = 'hold';
      confidence = 0.8;
    } else if (trend > TREND_THRESHOLD) {
      phase = 'inhale';
      confidence = Math.min(0.9, Math.abs(trend) * 100);
    } else if (trend < -TREND_THRESHOLD) {
      phase = 'exhale';
      confidence = Math.min(0.9, Math.abs(trend) * 100);
    } else {
      phase = 'transition';
      confidence = 0.6;
    }
    
    // Check for phase change
    const duration = timestamp - this.lastPhaseChange;
    if (phase !== this.currentPhase && duration > 500) { // Min 500ms phase
      this.currentPhase = phase;
      this.lastPhaseChange = timestamp;
      
      const breathingPhase: BreathingPhase = {
        phase,
        confidence,
        duration: 0,
        timestamp
      };
      
      this.phaseHistory.push(breathingPhase);
      if (this.phaseHistory.length > this.PHASE_HISTORY_SIZE) {
        this.phaseHistory.shift();
      }
    }
    
    return {
      phase: this.currentPhase,
      confidence,
      duration,
      timestamp
    };
  }
  
  /**
   * Calculate breathing rate in breaths per minute
   */
  private calculateBreathingRate(): number {
    if (this.phaseHistory.length < 4) return 15; // Default rate
    
    // Count complete breath cycles (inhale + exhale pairs)
    const recentPhases = this.phaseHistory.slice(-10);
    let cycles = 0;
    let lastInhale = -1;
    
    for (let i = 0; i < recentPhases.length; i++) {
      if (recentPhases[i].phase === 'inhale') {
        lastInhale = i;
      } else if (recentPhases[i].phase === 'exhale' && lastInhale >= 0) {
        cycles++;
        lastInhale = -1;
      }
    }
    
    if (cycles === 0) return 15;
    
    // Calculate time span
    const timeSpan = (Date.now() - recentPhases[0].timestamp) / 1000 / 60; // minutes
    const rate = cycles / Math.max(timeSpan, 0.1);
    
    // Clamp to reasonable range
    return Math.max(5, Math.min(30, rate));
  }
  
  /**
   * Analyze breathing rhythm quality
   */
  private analyzeRhythm(): 'regular' | 'irregular' | 'deep' | 'shallow' {
    if (this.phaseHistory.length < 6) return 'regular';
    
    const recentPhases = this.phaseHistory.slice(-6);
    const durations = recentPhases.map(p => p.duration);
    
    // Calculate coefficient of variation
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
    const cv = Math.sqrt(variance) / mean;
    
    // Analyze signal amplitude from breathing history
    if (this.breathingHistory.length < 10) return 'regular';
    
    const recent = this.breathingHistory.slice(-10);
    const amplitude = Math.max(...recent) - Math.min(...recent);
    
    // Mobile-optimized thresholds
    if (cv > 0.3) return 'irregular';
    if (amplitude > 0.01) return 'deep';
    if (amplitude < 0.005) return 'shallow';
    return 'regular';
  }
  
  /**
   * Calculate overall breathing quality score
   */
  private calculateQuality(): number {
    if (this.breathingHistory.length < 5) return 50;
    
    let score = 100;
    
    // Penalize irregular rhythm
    const rhythm = this.analyzeRhythm();
    if (rhythm === 'irregular') score -= 20;
    if (rhythm === 'shallow') score -= 10;
    
    // Reward consistent rate
    const rate = this.calculateBreathingRate();
    if (rate < 8 || rate > 20) score -= 15;
    
    // Check phase confidence
    const recentPhases = this.phaseHistory.slice(-5);
    const avgConfidence = recentPhases.reduce((sum, p) => sum + p.confidence, 0) / recentPhases.length;
    score *= avgConfidence;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Analyze breathing trend over time
   */
  private analyzeTrend(): 'improving' | 'stable' | 'declining' {
    if (this.breathingHistory.length < 15) return 'stable';
    
    const recent = this.breathingHistory.slice(-5);
    const older = this.breathingHistory.slice(-15, -10);
    
    const recentVariability = this.calculateVariability(recent);
    const olderVariability = this.calculateVariability(older);
    
    const improvement = olderVariability - recentVariability;
    
    if (improvement > 0.002) return 'improving';
    if (improvement < -0.002) return 'declining';
    return 'stable';
  }
  
  /**
   * Calculate signal variability
   */
  private calculateVariability(signals: number[]): number {
    if (signals.length < 2) return 0;
    
    const mean = signals.reduce((sum, s) => sum + s, 0) / signals.length;
    const variance = signals.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / signals.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Get breathing guidance based on current pattern
   */
  public getBreathingGuidance(pattern: BreathPattern, historicalData?: { 
    averageRate?: number; 
    typicalRhythm?: 'regular' | 'irregular' | 'deep' | 'shallow';
    sessionCount?: number;
  }): string[] {
    const guidance: string[] = [];
    
    // Compare with historical data if available
    if (historicalData?.averageRate) {
      const rateDiff = pattern.rate - historicalData.averageRate;
      if (Math.abs(rateDiff) > 3) {
        if (rateDiff > 0) {
          guidance.push(`Your breathing is faster than your typical pace (${historicalData.averageRate} BPM). Try to slow down.`);
        } else {
          guidance.push(`Your breathing is slower than your typical pace (${historicalData.averageRate} BPM). Find a comfortable rhythm.`);
        }
      }
    } else {
      // Generic rate guidance
      if (pattern.rate > 20) {
        guidance.push("Your breathing is quite fast. Try to slow down and breathe more deeply.");
      } else if (pattern.rate < 8) {
        guidance.push("Your breathing is very slow. Ensure you're getting enough oxygen.");
      }
    }
    
    // Rhythm guidance
    if (pattern.rhythm === 'irregular') {
      guidance.push("Focus on creating a steady, consistent breathing rhythm.");
    } else if (pattern.rhythm === 'shallow') {
      guidance.push("Try to breathe more deeply, expanding your diaphragm.");
    }
    
    // Quality guidance
    if (pattern.quality < 60) {
      guidance.push("Relax your face and jaw muscles for better breathing detection.");
    }
    
    // Trend guidance with session context
    if (pattern.trend === 'declining') {
      if (historicalData?.sessionCount && historicalData.sessionCount > 5) {
        guidance.push("Your breathing pattern has become less consistent recently. This is normal - take a moment to reset.");
      } else {
        guidance.push("Take a moment to reset and refocus on your breathing technique.");
      }
    } else if (pattern.trend === 'improving') {
      if (historicalData?.sessionCount && historicalData.sessionCount > 3) {
        guidance.push("Great progress! Your breathing pattern is becoming more stable with practice.");
      } else {
        guidance.push("Excellent! Your breathing pattern is becoming more stable.");
      }
    }
    
    // Encouragement based on session count
    if (historicalData?.sessionCount && historicalData.sessionCount > 10) {
      guidance.push(`You've completed ${historicalData.sessionCount} sessions - your dedication is paying off!`);
    }
    
    return guidance.length > 0 ? guidance : ["Your breathing pattern looks good. Keep it up!"];
  }
  
  /**
   * Reset detector state
   */
  public reset(): void {
    this.breathingHistory = [];
    this.phaseHistory = [];
    this.movingAverage = [];
    this.lastPhaseChange = 0;
    this.currentPhase = 'inhale';
  }
}