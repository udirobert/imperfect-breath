/**
 * Posture Analyzer
 * Advanced posture detection and analysis for breathing sessions
 * Detects spine alignment, head position, and sitting posture
 */

import { startTimer } from '../utils/performance-utils';

interface PosturePoint {
  x: number;
  y: number;
  z?: number;
  confidence?: number;
}

interface PostureMetrics {
  spineAlignment: number; // 0-100, higher is better
  headPosition: {
    tilt: number; // degrees, positive = forward tilt
    rotation: number; // degrees, positive = right rotation
    elevation: number; // relative to shoulders
  };
  shoulderLevel: number; // 0-100, 100 = perfectly level
  overallPosture: number; // 0-100 composite score
  recommendations: string[];
  classification: 'excellent' | 'good' | 'fair' | 'poor';
}

interface PostureLandmarks {
  nose: PosturePoint;
  leftEye: PosturePoint;
  rightEye: PosturePoint;
  leftEar: PosturePoint;
  rightEar: PosturePoint;
  leftShoulder: PosturePoint;
  rightShoulder: PosturePoint;
  neckBase: PosturePoint;
}

export class PostureAnalyzer {
  private postureHistory: PostureMetrics[] = [];
  private readonly HISTORY_SIZE = 20; // Keep 20 seconds of history
  
  // Posture analysis thresholds (mobile-optimized)
  private readonly THRESHOLDS = {
    excellentPosture: 85,
    goodPosture: 70,
    fairPosture: 50,
    maxHeadTilt: 15, // degrees
    maxHeadRotation: 10, // degrees
    maxShoulderImbalance: 5, // degrees
  };

  /**
   * Analyze posture from pose landmarks
   */
  public analyzePosture(
    faceLandmarks: PosturePoint[],
    poseLandmarks?: PosturePoint[]
  ): PostureMetrics | null {
    const endTimer = startTimer('posture-analysis');
    
    try {
      // Extract key posture landmarks
      const landmarks = this.extractPostureLandmarks(faceLandmarks, poseLandmarks);
      if (!landmarks) return null;
      
      // Analyze different aspects of posture
      const spineAlignment = this.analyzeSpineAlignment(landmarks);
      const headPosition = this.analyzeHeadPosition(landmarks);
      const shoulderLevel = this.analyzeShoulderLevel(landmarks);
      
      // Calculate overall posture score
      const overallPosture = this.calculateOverallScore(
        spineAlignment,
        headPosition,
        shoulderLevel
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        spineAlignment,
        headPosition,
        shoulderLevel
      );
      
      // Classify posture quality
      const classification = this.classifyPosture(overallPosture);
      
      const metrics: PostureMetrics = {
        spineAlignment,
        headPosition,
        shoulderLevel,
        overallPosture,
        recommendations,
        classification,
      };
      
      // Add to history for trend analysis
      this.addToHistory(metrics);
      
      return metrics;
      
    } catch (error) {
      console.error('Posture analysis error:', error);
      return null;
    } finally {
      endTimer();
    }
  }

  /**
   * Extract key posture landmarks from face and pose data
   */
  private extractPostureLandmarks(
    faceLandmarks: PosturePoint[],
    poseLandmarks?: PosturePoint[]
  ): PostureLandmarks | null {
    try {
      // Face landmark indices (MediaPipe Face Mesh)
      const NOSE_TIP = 1;
      const LEFT_EYE = 33;
      const RIGHT_EYE = 362;
      const LEFT_EAR = 234; // Approximate ear position
      const RIGHT_EAR = 454; // Approximate ear position
      
      if (!faceLandmarks || faceLandmarks.length < 468) {
        return null;
      }
      
      const landmarks: PostureLandmarks = {
        nose: faceLandmarks[NOSE_TIP],
        leftEye: faceLandmarks[LEFT_EYE],
        rightEye: faceLandmarks[RIGHT_EYE],
        leftEar: faceLandmarks[LEFT_EAR],
        rightEar: faceLandmarks[RIGHT_EAR],
        // Estimate shoulder positions from face landmarks if pose data unavailable
        leftShoulder: this.estimateShoulderPosition(faceLandmarks, 'left'),
        rightShoulder: this.estimateShoulderPosition(faceLandmarks, 'right'),
        neckBase: this.estimateNeckBase(faceLandmarks),
      };
      
      // Use pose landmarks if available for better accuracy
      if (poseLandmarks && poseLandmarks.length > 11) {
        landmarks.leftShoulder = poseLandmarks[11]; // Left shoulder
        landmarks.rightShoulder = poseLandmarks[12]; // Right shoulder
      }
      
      return landmarks;
      
    } catch (error) {
      console.error('Landmark extraction error:', error);
      return null;
    }
  }

  /**
   * Estimate shoulder position from face landmarks
   */
  private estimateShoulderPosition(
    faceLandmarks: PosturePoint[],
    side: 'left' | 'right'
  ): PosturePoint {
    const faceWidth = this.calculateFaceWidth(faceLandmarks);
    const faceCenter = this.calculateFaceCenter(faceLandmarks);
    
    // Estimate shoulder position based on face geometry
    const shoulderOffset = faceWidth * 1.5;
    const shoulderDrop = faceWidth * 0.8;
    
    return {
      x: faceCenter.x + (side === 'left' ? -shoulderOffset : shoulderOffset),
      y: faceCenter.y + shoulderDrop,
      confidence: 0.6, // Lower confidence for estimated positions
    };
  }

  /**
   * Estimate neck base position
   */
  private estimateNeckBase(faceLandmarks: PosturePoint[]): PosturePoint {
    const chin = faceLandmarks[175]; // Chin point
    const faceCenter = this.calculateFaceCenter(faceLandmarks);
    
    return {
      x: faceCenter.x,
      y: chin.y + (chin.y - faceCenter.y) * 0.3,
      confidence: 0.7,
    };
  }

  /**
   * Calculate face width for proportional estimates
   */
  private calculateFaceWidth(faceLandmarks: PosturePoint[]): number {
    const leftFace = faceLandmarks[234]; // Left face edge
    const rightFace = faceLandmarks[454]; // Right face edge
    
    return Math.abs(rightFace.x - leftFace.x);
  }

  /**
   * Calculate face center point
   */
  private calculateFaceCenter(faceLandmarks: PosturePoint[]): PosturePoint {
    const nose = faceLandmarks[1];
    const leftEye = faceLandmarks[33];
    const rightEye = faceLandmarks[362];
    
    return {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y + nose.y) / 3,
    };
  }

  /**
   * Analyze spine alignment
   */
  private analyzeSpineAlignment(landmarks: PostureLandmarks): number {
    try {
      // Calculate head-neck-shoulder alignment
      const headCenter = {
        x: (landmarks.leftEye.x + landmarks.rightEye.x) / 2,
        y: (landmarks.leftEye.y + landmarks.rightEye.y) / 2,
      };
      
      const shoulderCenter = {
        x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
        y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2,
      };
      
      // Calculate vertical alignment
      const horizontalOffset = Math.abs(headCenter.x - shoulderCenter.x);
      const shoulderWidth = Math.abs(landmarks.rightShoulder.x - landmarks.leftShoulder.x);
      
      // Normalize offset relative to shoulder width
      const alignmentRatio = horizontalOffset / (shoulderWidth * 0.5);
      
      // Convert to 0-100 score (lower offset = higher score)
      const alignment = Math.max(0, 100 - (alignmentRatio * 100));
      
      return Math.round(alignment);
      
    } catch (error) {
      console.error('Spine alignment analysis error:', error);
      return 50; // Default neutral score
    }
  }

  /**
   * Analyze head position
   */
  private analyzeHeadPosition(landmarks: PostureLandmarks): {
    tilt: number;
    rotation: number;
    elevation: number;
  } {
    try {
      // Calculate head tilt (forward/backward)
      const earToNoseVector = {
        x: landmarks.nose.x - (landmarks.leftEar.x + landmarks.rightEar.x) / 2,
        y: landmarks.nose.y - (landmarks.leftEar.y + landmarks.rightEar.y) / 2,
      };
      
      const tilt = Math.atan2(earToNoseVector.y, earToNoseVector.x) * (180 / Math.PI);
      
      // Calculate head rotation (left/right)
      const eyeVector = {
        x: landmarks.rightEye.x - landmarks.leftEye.x,
        y: landmarks.rightEye.y - landmarks.leftEye.y,
      };
      
      const rotation = Math.atan2(eyeVector.y, eyeVector.x) * (180 / Math.PI);
      
      // Calculate head elevation relative to shoulders
      const headY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
      const shoulderY = (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2;
      const elevation = shoulderY - headY; // Positive = head above shoulders
      
      return {
        tilt: Math.round(tilt),
        rotation: Math.round(rotation),
        elevation: Math.round(elevation),
      };
      
    } catch (error) {
      console.error('Head position analysis error:', error);
      return { tilt: 0, rotation: 0, elevation: 0 };
    }
  }

  /**
   * Analyze shoulder level
   */
  private analyzeShoulderLevel(landmarks: PostureLandmarks): number {
    try {
      const leftShoulderY = landmarks.leftShoulder.y;
      const rightShoulderY = landmarks.rightShoulder.y;
      
      const shoulderDifference = Math.abs(leftShoulderY - rightShoulderY);
      const shoulderWidth = Math.abs(landmarks.rightShoulder.x - landmarks.leftShoulder.x);
      
      // Calculate shoulder level as percentage
      const levelRatio = shoulderDifference / (shoulderWidth * 0.1); // 10% of width as reference
      const level = Math.max(0, 100 - (levelRatio * 100));
      
      return Math.round(level);
      
    } catch (error) {
      console.error('Shoulder level analysis error:', error);
      return 50; // Default neutral score
    }
  }

  /**
   * Calculate overall posture score
   */
  private calculateOverallScore(
    spineAlignment: number,
    headPosition: { tilt: number; rotation: number; elevation: number },
    shoulderLevel: number
  ): number {
    // Weight different aspects of posture
    const weights = {
      spine: 0.4,
      head: 0.35,
      shoulders: 0.25,
    };
    
    // Calculate head position score
    const headTiltPenalty = Math.min(Math.abs(headPosition.tilt) / this.THRESHOLDS.maxHeadTilt, 1) * 30;
    const headRotationPenalty = Math.min(Math.abs(headPosition.rotation) / this.THRESHOLDS.maxHeadRotation, 1) * 20;
    const headScore = Math.max(0, 100 - headTiltPenalty - headRotationPenalty);
    
    // Calculate weighted overall score
    const overallScore = 
      spineAlignment * weights.spine +
      headScore * weights.head +
      shoulderLevel * weights.shoulders;
    
    return Math.round(overallScore);
  }

  /**
   * Generate posture recommendations
   */
  private generateRecommendations(
    spineAlignment: number,
    headPosition: { tilt: number; rotation: number; elevation: number },
    shoulderLevel: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Spine alignment recommendations
    if (spineAlignment < 70) {
      recommendations.push("Align your head directly over your shoulders");
    }
    
    // Head position recommendations
    if (Math.abs(headPosition.tilt) > this.THRESHOLDS.maxHeadTilt) {
      if (headPosition.tilt > 0) {
        recommendations.push("Lift your chin slightly and look straight ahead");
      } else {
        recommendations.push("Lower your chin and avoid looking down");
      }
    }
    
    if (Math.abs(headPosition.rotation) > this.THRESHOLDS.maxHeadRotation) {
      recommendations.push("Center your head and face the camera directly");
    }
    
    // Shoulder recommendations
    if (shoulderLevel < 80) {
      recommendations.push("Level your shoulders and relax any tension");
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push("Excellent posture! Maintain this alignment");
    } else if (recommendations.length > 2) {
      recommendations.unshift("Take a moment to reset your posture");
    }
    
    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  /**
   * Classify posture quality
   */
  private classifyPosture(overallScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (overallScore >= this.THRESHOLDS.excellentPosture) return 'excellent';
    if (overallScore >= this.THRESHOLDS.goodPosture) return 'good';
    if (overallScore >= this.THRESHOLDS.fairPosture) return 'fair';
    return 'poor';
  }

  /**
   * Add metrics to history for trend analysis
   */
  private addToHistory(metrics: PostureMetrics): void {
    this.postureHistory.push(metrics);
    
    if (this.postureHistory.length > this.HISTORY_SIZE) {
      this.postureHistory.shift();
    }
  }

  /**
   * Get posture trend analysis
   */
  public getPostureTrend(): {
    trend: 'improving' | 'stable' | 'declining';
    averageScore: number;
    consistency: number;
  } {
    if (this.postureHistory.length < 5) {
      return { trend: 'stable', averageScore: 0, consistency: 0 };
    }
    
    const scores = this.postureHistory.map(m => m.overallPosture);
    const recent = scores.slice(-5);
    const older = scores.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, score) => sum + score, 0) / older.length 
      : recentAvg;
    
    const improvement = recentAvg - olderAvg;
    
    let trend: 'improving' | 'stable' | 'declining';
    if (improvement > 5) trend = 'improving';
    else if (improvement < -5) trend = 'declining';
    else trend = 'stable';
    
    // Calculate consistency (lower variance = higher consistency)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - recentAvg, 2), 0) / scores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));
    
    return {
      trend,
      averageScore: Math.round(recentAvg),
      consistency: Math.round(consistency),
    };
  }

  /**
   * Reset analyzer state
   */
  public reset(): void {
    this.postureHistory = [];
  }

  /**
   * Get posture guidance based on current metrics
   */
  public getPostureGuidance(metrics: PostureMetrics): string[] {
    const guidance: string[] = [];
    
    switch (metrics.classification) {
      case 'excellent':
        guidance.push("Perfect posture! You're setting a great example.");
        break;
      case 'good':
        guidance.push("Good posture. Small adjustments will make it excellent.");
        break;
      case 'fair':
        guidance.push("Your posture needs attention. Focus on the recommendations.");
        break;
      case 'poor':
        guidance.push("Poor posture detected. Please adjust your position.");
        break;
    }
    
    // Add specific guidance from recommendations
    guidance.push(...metrics.recommendations.slice(0, 2));
    
    return guidance;
  }
}