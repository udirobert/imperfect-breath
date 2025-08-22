/**
 * Enhanced AI Analysis System
 * 
 * Integrates vision metrics with AI analysis for comprehensive session feedback.
 * CLEAN, DRY, MODULAR approach to AI-powered session insights.
 */

import { VisionMetrics } from '../../hooks/useVisionClient';
import { AIConfigManager, AIAnalysisRequest, AIAnalysisResponse, SessionData } from './config';
import { apiClient } from '../api/unified-client';

// ============================================================================
// ENHANCED SESSION DATA - Includes vision metrics
// ============================================================================

export interface EnhancedSessionData extends SessionData {
  // Vision metrics integration
  avgConfidence?: number;
  avgPostureScore?: number;
  avgMovementLevel?: number;
  visionDataPoints?: number;
  
  // Enhanced breathing analysis
  breathingConsistency?: number;
  phaseAccuracy?: number;
  
  // Session quality metrics
  overallQuality?: number;
  focusScore?: number;
  progressFromBaseline?: number;
}

export interface VisionSessionSummary {
  totalFrames: number;
  avgConfidence: number;
  avgPostureScore: number;
  avgMovementLevel: number;
  peakMovement: number;
  stillnessPercentage: number;
  postureConsistency: number;
}

// ============================================================================
// VISION METRICS PROCESSOR - Aggregates real-time vision data
// ============================================================================

export class VisionMetricsProcessor {
  private metrics: VisionMetrics[] = [];
  private readonly maxSamples = 300; // 5 minutes at 1 FPS

  /**
   * Add vision metric sample
   */
  addSample(metric: VisionMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent samples
    if (this.metrics.length > this.maxSamples) {
      this.metrics.shift();
    }
  }

  /**
   * Get summary of vision session
   */
  getSummary(): VisionSessionSummary {
    if (this.metrics.length === 0) {
      return {
        totalFrames: 0,
        avgConfidence: 0,
        avgPostureScore: 0,
        avgMovementLevel: 0,
        peakMovement: 0,
        stillnessPercentage: 0,
        postureConsistency: 0,
      };
    }

    const validMetrics = this.metrics.filter(m => m.faceDetected && m.confidence > 0);
    
    if (validMetrics.length === 0) {
      return {
        totalFrames: this.metrics.length,
        avgConfidence: 0,
        avgPostureScore: 0,
        avgMovementLevel: 0,
        peakMovement: 0,
        stillnessPercentage: 0,
        postureConsistency: 0,
      };
    }

    const avgConfidence = validMetrics.reduce((sum, m) => sum + m.confidence, 0) / validMetrics.length;
    const avgPostureScore = validMetrics.reduce((sum, m) => sum + m.postureScore, 0) / validMetrics.length;
    const avgMovementLevel = validMetrics.reduce((sum, m) => sum + m.movementLevel, 0) / validMetrics.length;
    
    const movementLevels = validMetrics.map(m => m.movementLevel);
    const peakMovement = Math.max(...movementLevels);
    
    // Calculate stillness percentage (movement < 0.2 threshold)
    const stillFrames = validMetrics.filter(m => m.movementLevel < 0.2).length;
    const stillnessPercentage = (stillFrames / validMetrics.length) * 100;
    
    // Calculate posture consistency (how consistent posture scores are)
    const postureScores = validMetrics.map(m => m.postureScore);
    const postureVariance = this.calculateVariance(postureScores);
    const postureConsistency = Math.max(0, (1 - postureVariance) * 100);

    return {
      totalFrames: this.metrics.length,
      avgConfidence,
      avgPostureScore,
      avgMovementLevel,
      peakMovement,
      stillnessPercentage,
      postureConsistency,
    };
  }

  /**
   * Calculate variance for consistency metrics
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = [];
  }

  /**
   * Get current metrics count
   */
  getSampleCount(): number {
    return this.metrics.length;
  }
}

// ============================================================================
// ENHANCED AI ANALYSIS - Integrates vision and session data
// ============================================================================

export class EnhancedAIAnalysis {
  private visionProcessor = new VisionMetricsProcessor();

  /**
   * Add vision metric to analysis
   */
  addVisionMetric(metric: VisionMetrics): void {
    this.visionProcessor.addSample(metric);
  }

  /**
   * Create enhanced session data with vision integration
   */
  createEnhancedSessionData(
    baseSessionData: SessionData,
    additionalMetrics?: {
      breathingConsistency?: number;
      phaseAccuracy?: number;
      overallQuality?: number;
      focusScore?: number;
    }
  ): EnhancedSessionData {
    const visionSummary = this.visionProcessor.getSummary();
    
    return {
      ...baseSessionData,
      
      // Vision metrics
      avgConfidence: visionSummary.avgConfidence,
      avgPostureScore: visionSummary.avgPostureScore,
      avgMovementLevel: visionSummary.avgMovementLevel,
      visionDataPoints: visionSummary.totalFrames,
      
      // Enhanced metrics
      breathingConsistency: additionalMetrics?.breathingConsistency || 85,
      phaseAccuracy: additionalMetrics?.phaseAccuracy || 90,
      overallQuality: additionalMetrics?.overallQuality || this.calculateOverallQuality(visionSummary),
      focusScore: additionalMetrics?.focusScore || Math.round(visionSummary.stillnessPercentage),
      progressFromBaseline: additionalMetrics?.focusScore || 0,
    };
  }

  /**
   * Generate AI analysis with enhanced data
   */
  async generateEnhancedAnalysis(
    baseSessionData: SessionData,
    additionalMetrics?: any
  ): Promise<AIAnalysisResponse[]> {
    const enhancedData = this.createEnhancedSessionData(baseSessionData, additionalMetrics);
    const visionSummary = this.visionProcessor.getSummary();
    
    // Get configured AI providers
    const providers = AIConfigManager.getConfiguredProviders();
    
    if (providers.length === 0) {
      // Return mock analysis if no providers configured
      return [this.createMockAnalysis(enhancedData, visionSummary)];
    }

    const analyses: AIAnalysisResponse[] = [];
    
    for (const provider of providers) {
      try {
        const apiKey = await AIConfigManager.getApiKey(provider.id);
        if (!apiKey) continue;

        const request: AIAnalysisRequest = {
          sessionData: enhancedData,
          provider: provider.id,
          apiKey,
        };

        // Enhanced prompt with vision data
        const enhancedPrompt = this.createEnhancedPrompt(enhancedData, visionSummary);
        
        // Call AI analysis API with enhanced data using unified client
        const response = await apiClient.request('ai', '/api/ai-analysis', {
          method: 'POST',
          body: JSON.stringify({
            ...request,
            enhancedPrompt,
          }),
        });

        if (response.success && response.data.success) {
          analyses.push(response.data.result);
        }
      } catch (error) {
        console.warn(`AI analysis failed for ${provider.id}:`, error);
      }
    }

    // Fallback to mock analysis if all providers fail
    if (analyses.length === 0) {
      analyses.push(this.createMockAnalysis(enhancedData, visionSummary));
    }

    return analyses;
  }

  /**
   * Create enhanced prompt with vision data
   */
  private createEnhancedPrompt(data: EnhancedSessionData, vision: VisionSessionSummary): string {
    return `
Enhanced Breathing Session Analysis:

SESSION DATA:
- Pattern: ${data.patternName}
- Duration: ${data.sessionDuration} seconds
- Breath Hold Time: ${data.breathHoldTime} seconds
- Base Restlessness Score: ${data.restlessnessScore}/100

VISION ANALYSIS (${vision.totalFrames} data points):
- Face Detection Confidence: ${(vision.avgConfidence * 100).toFixed(1)}%
- Average Posture Score: ${(vision.avgPostureScore * 100).toFixed(1)}%
- Movement Level: ${(vision.avgMovementLevel * 100).toFixed(1)}%
- Stillness Percentage: ${vision.stillnessPercentage.toFixed(1)}%
- Posture Consistency: ${vision.postureConsistency.toFixed(1)}%

ENHANCED METRICS:
- Breathing Consistency: ${data.breathingConsistency}%
- Phase Accuracy: ${data.phaseAccuracy}%
- Overall Quality Score: ${data.overallQuality}/100
- Focus Score: ${data.focusScore}/100

Please provide:
1. Detailed analysis of the session quality combining breathing and vision data
2. Specific suggestions for improving posture, movement, and breathing consistency
3. Numerical scores (0-100) for overall, focus, consistency, and progress
4. 2-3 concrete next steps focusing on the areas that need most improvement

Be encouraging but provide actionable feedback based on the comprehensive data.
`;
  }

  /**
   * Calculate overall quality score from vision data
   */
  private calculateOverallQuality(vision: VisionSessionSummary): number {
    if (vision.totalFrames === 0) return 75; // Default for no vision data
    
    // Weighted combination of vision metrics
    const confidenceWeight = 0.2;
    const postureWeight = 0.3;
    const stillnessWeight = 0.3;
    const consistencyWeight = 0.2;
    
    const quality = (
      (vision.avgConfidence * 100 * confidenceWeight) +
      (vision.avgPostureScore * 100 * postureWeight) +
      (vision.stillnessPercentage * stillnessWeight) +
      (vision.postureConsistency * consistencyWeight)
    );
    
    return Math.round(Math.max(0, Math.min(100, quality)));
  }

  /**
   * Create mock analysis for development/fallback
   */
  private createMockAnalysis(data: EnhancedSessionData, vision: VisionSessionSummary): AIAnalysisResponse {
    const hasVisionData = vision.totalFrames > 0;
    
    let analysis = `Great job completing your ${data.patternName} breathing session! `;
    
    if (hasVisionData) {
      analysis += `Your vision analysis shows ${vision.stillnessPercentage.toFixed(0)}% stillness with an average posture score of ${(vision.avgPostureScore * 100).toFixed(0)}%. `;
      
      if (vision.stillnessPercentage > 70) {
        analysis += "Excellent stillness and focus throughout the session. ";
      } else if (vision.stillnessPercentage > 50) {
        analysis += "Good focus with some natural movement. ";
      } else {
        analysis += "Consider focusing more on staying still during breathing phases. ";
      }
    }
    
    analysis += `Your ${data.sessionDuration}-second session demonstrates commitment to your practice. `;

    const suggestions: string[] = [];
    const nextSteps: string[] = [];

    if (hasVisionData) {
      if (vision.avgPostureScore < 0.7) {
        suggestions.push("Improve posture by sitting up straighter with shoulders relaxed");
        nextSteps.push("Practice sessions with a wall behind you for posture awareness");
      }
      
      if (vision.avgMovementLevel > 0.3) {
        suggestions.push("Focus on staying still during breathing phases");
        nextSteps.push("Try shorter sessions to build stillness endurance");
      }
      
      if (vision.postureConsistency < 70) {
        suggestions.push("Work on maintaining consistent posture throughout the session");
        nextSteps.push("Set up your practice space for optimal ergonomics");
      }
    } else {
      suggestions.push("Consider enabling camera for enhanced feedback");
      suggestions.push("Focus on maintaining steady rhythm");
      nextSteps.push("Practice in a quiet, comfortable environment");
      nextSteps.push("Try longer sessions to deepen your practice");
    }

    return {
      provider: "enhanced-mock",
      analysis,
      suggestions,
      score: {
        overall: data.overallQuality || 75,
        focus: data.focusScore || 70,
        consistency: data.breathingConsistency || 85,
        progress: 75,
      },
      nextSteps,
    };
  }

  /**
   * Reset analysis data
   */
  reset(): void {
    this.visionProcessor.reset();
  }

  /**
   * Get vision summary for debugging
   */
  getVisionSummary(): VisionSessionSummary {
    return this.visionProcessor.getSummary();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const enhancedAIAnalysis = new EnhancedAIAnalysis();
