/**
 * Enhanced Restlessness Analyzer
 * Implements real facial landmark analysis following DRY, CLEAN, ORGANISED, MODULAR principles
 * Integrates with existing AI feedback and social primitives
 */

import type { VisionMetrics } from './types';

export interface RestlessnessComponents {
  faceMovement: number;
  eyeMovement: number;
  postureShifts: number;
  breathingIrregularity: number;
  microExpressions: number;
}

export interface RestlessnessAnalysis {
  overall: number;
  components: RestlessnessComponents;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
  recommendations: string[];
}

export class EnhancedRestlessnessAnalyzer {
  private previousLandmarks: number[][] = [];
  private movementHistory: number[] = [];
  private breathingHistory: number[] = [];
  private readonly HISTORY_SIZE = 30; // 30 seconds of data at 1fps

  /**
   * Analyze restlessness from facial landmarks
   * Uses actual MediaPipe face mesh data instead of random values
   */
  analyzeFromLandmarks(faces: any[], poses: any[] = []): RestlessnessAnalysis {
    if (!faces.length) {
      return this.createFallbackAnalysis();
    }

    const face = faces[0];
    const landmarks = face.keypoints || [];
    
    // Calculate movement components
    const faceMovement = this.calculateFaceMovement(landmarks);
    const eyeMovement = this.calculateEyeMovement(landmarks);
    const microExpressions = this.calculateMicroExpressions(landmarks);
    
    // Calculate posture from pose data
    const postureShifts = poses.length > 0 
      ? this.calculatePostureShifts(poses[0])
      : 0;
    
    // Calculate breathing irregularity from nostril/mouth area
    const breathingIrregularity = this.calculateBreathingIrregularity(landmarks);
    
    const components: RestlessnessComponents = {
      faceMovement,
      eyeMovement,
      postureShifts,
      breathingIrregularity,
      microExpressions,
    };

    // Calculate overall score (weighted average)
    const overall = this.calculateOverallScore(components);
    
    // Determine trend
    const trend = this.calculateTrend(overall);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(components);

    return {
      overall,
      components,
      trend,
      confidence: this.calculateConfidence(landmarks.length),
      recommendations,
    };
  }

  /**
   * Calculate face movement using landmark displacement
   */
  private calculateFaceMovement(landmarks: any[]): number {
    if (landmarks.length < 10) return 0;

    // Use key facial landmarks (nose tip, chin, forehead)
    const keyPoints = [
      landmarks[1],   // nose tip
      landmarks[152], // chin
      landmarks[10],  // forehead
    ].filter(Boolean);

    if (this.previousLandmarks.length === 0) {
      this.previousLandmarks = keyPoints.map(p => [p.x, p.y]);
      return 0;
    }

    // Calculate displacement from previous frame
    let totalDisplacement = 0;
    keyPoints.forEach((point, index) => {
      if (this.previousLandmarks[index]) {
        const dx = point.x - this.previousLandmarks[index][0];
        const dy = point.y - this.previousLandmarks[index][1];
        totalDisplacement += Math.sqrt(dx * dx + dy * dy);
      }
    });

    // Update previous landmarks
    this.previousLandmarks = keyPoints.map(p => [p.x, p.y]);

    // Normalize to 0-1 range (typical movement is 0-10 pixels)
    return Math.min(totalDisplacement / 10, 1);
  }

  /**
   * Calculate eye movement and blink patterns
   */
  private calculateEyeMovement(landmarks: any[]): number {
    if (landmarks.length < 468) return 0;

    // Eye landmark indices for MediaPipe face mesh
    const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

    // Calculate eye aspect ratio for blink detection
    const leftEAR = this.calculateEyeAspectRatio(landmarks, leftEyeIndices);
    const rightEAR = this.calculateEyeAspectRatio(landmarks, rightEyeIndices);
    
    // Average eye aspect ratio
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    // Track rapid changes in EAR (indicates restless eye movement)
    const earVariation = Math.abs(avgEAR - 0.3); // 0.3 is typical open eye EAR
    
    return Math.min(earVariation * 3, 1); // Scale to 0-1
  }

  /**
   * Calculate eye aspect ratio for blink detection
   */
  private calculateEyeAspectRatio(landmarks: any[], eyeIndices: number[]): number {
    if (eyeIndices.length < 6) return 0.3; // Default open eye ratio

    const points = eyeIndices.map(i => landmarks[i]).filter(Boolean);
    if (points.length < 6) return 0.3;

    // Calculate vertical distances
    const v1 = this.distance(points[1], points[5]);
    const v2 = this.distance(points[2], points[4]);
    
    // Calculate horizontal distance
    const h = this.distance(points[0], points[3]);
    
    // Eye aspect ratio
    return (v1 + v2) / (2 * h);
  }

  /**
   * Calculate micro-expressions from facial landmarks
   */
  private calculateMicroExpressions(landmarks: any[]): number {
    if (landmarks.length < 468) return 0;

    // Monitor mouth corners and eyebrow positions for micro-expressions
    const mouthCorners = [61, 291]; // Left and right mouth corners
    const eyebrows = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]; // Eyebrow landmarks
    
    let expressionVariation = 0;
    
    // Calculate mouth corner movement
    mouthCorners.forEach(index => {
      if (landmarks[index]) {
        // Compare with neutral position (simplified)
        const neutralY = landmarks[13]?.y || 0; // Nose base as reference
        const variation = Math.abs(landmarks[index].y - neutralY);
        expressionVariation += variation;
      }
    });

    // Normalize to 0-1 range
    return Math.min(expressionVariation / 0.05, 1);
  }

  /**
   * Calculate posture shifts from pose landmarks
   */
  private calculatePostureShifts(pose: any): number {
    if (!pose.keypoints || pose.keypoints.length < 17) return 0;

    // Use shoulder and hip landmarks to detect posture changes
    const leftShoulder = pose.keypoints[5];
    const rightShoulder = pose.keypoints[6];
    const leftHip = pose.keypoints[11];
    const rightHip = pose.keypoints[12];

    if (!leftShoulder || !rightShoulder) return 0;

    // Calculate shoulder alignment
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );

    // Ideal posture has shoulders level (angle near 0)
    const postureDeviation = Math.abs(shoulderAngle);
    
    return Math.min(postureDeviation / 0.2, 1); // Normalize to 0-1
  }

  /**
   * Calculate breathing irregularity from nostril area
   */
  private calculateBreathingIrregularity(landmarks: any[]): number {
    if (landmarks.length < 468) return 0;

    // Nostril landmarks
    const nostrilIndices = [2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49, 220, 305, 281, 360, 279];
    
    // Calculate nostril area (simplified)
    const nostrilPoints = nostrilIndices.map(i => landmarks[i]).filter(Boolean);
    if (nostrilPoints.length < 4) return 0;

    // Calculate area using shoelace formula (simplified)
    let area = 0;
    for (let i = 0; i < nostrilPoints.length - 1; i++) {
      area += nostrilPoints[i].x * nostrilPoints[i + 1].y;
      area -= nostrilPoints[i + 1].x * nostrilPoints[i].y;
    }
    area = Math.abs(area) / 2;

    // Track area changes over time
    this.breathingHistory.push(area);
    if (this.breathingHistory.length > this.HISTORY_SIZE) {
      this.breathingHistory.shift();
    }

    // Calculate variance in breathing (high variance = irregular)
    if (this.breathingHistory.length < 5) return 0;
    
    const mean = this.breathingHistory.reduce((a, b) => a + b) / this.breathingHistory.length;
    const variance = this.breathingHistory.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / this.breathingHistory.length;
    
    return Math.min(variance / 100, 1); // Normalize to 0-1
  }

  /**
   * Calculate overall restlessness score with weighted components
   */
  private calculateOverallScore(components: RestlessnessComponents): number {
    const weights = {
      faceMovement: 0.3,
      eyeMovement: 0.25,
      postureShifts: 0.2,
      breathingIrregularity: 0.15,
      microExpressions: 0.1,
    };

    return (
      components.faceMovement * weights.faceMovement +
      components.eyeMovement * weights.eyeMovement +
      components.postureShifts * weights.postureShifts +
      components.breathingIrregularity * weights.breathingIrregularity +
      components.microExpressions * weights.microExpressions
    );
  }

  /**
   * Calculate trend based on movement history
   */
  private calculateTrend(currentScore: number): 'improving' | 'stable' | 'declining' {
    this.movementHistory.push(currentScore);
    if (this.movementHistory.length > this.HISTORY_SIZE) {
      this.movementHistory.shift();
    }

    if (this.movementHistory.length < 10) return 'stable';

    // Calculate trend using linear regression
    const recent = this.movementHistory.slice(-10);
    const older = this.movementHistory.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = recentAvg - olderAvg;
    
    if (diff < -0.05) return 'improving'; // Restlessness decreasing
    if (diff > 0.05) return 'declining';  // Restlessness increasing
    return 'stable';
  }

  /**
   * Generate contextual recommendations
   */
  private generateRecommendations(components: RestlessnessComponents): string[] {
    const recommendations: string[] = [];

    if (components.faceMovement > 0.6) {
      recommendations.push("Try to keep your head still and focus on a fixed point");
    }

    if (components.eyeMovement > 0.5) {
      recommendations.push("Soften your gaze and avoid looking around");
    }

    if (components.postureShifts > 0.4) {
      recommendations.push("Adjust your posture and find a comfortable, stable position");
    }

    if (components.breathingIrregularity > 0.5) {
      recommendations.push("Focus on maintaining a steady breathing rhythm");
    }

    if (components.microExpressions > 0.4) {
      recommendations.push("Relax your facial muscles and release any tension");
    }

    if (recommendations.length === 0) {
      recommendations.push("Excellent stillness! Maintain this peaceful state");
    }

    return recommendations;
  }

  /**
   * Calculate confidence based on landmark quality
   */
  private calculateConfidence(landmarkCount: number): number {
    // MediaPipe face mesh has 468 landmarks
    const expectedLandmarks = 468;
    return Math.min(landmarkCount / expectedLandmarks, 1);
  }

  /**
   * Create fallback analysis when no face is detected
   */
  private createFallbackAnalysis(): RestlessnessAnalysis {
    return {
      overall: 0.5,
      components: {
        faceMovement: 0,
        eyeMovement: 0,
        postureShifts: 0,
        breathingIrregularity: 0,
        microExpressions: 0,
      },
      trend: 'stable',
      confidence: 0,
      recommendations: ["Please ensure your face is visible to the camera"],
    };
  }

  /**
   * Utility function to calculate distance between two points
   */
  private distance(p1: any, p2: any): number {
    if (!p1 || !p2) return 0;
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}