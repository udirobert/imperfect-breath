/**
 * Integrated Vision Feedback Hook
 * Connects vision metrics with AI feedback and social sharing
 * Follows DRY, CLEAN, ORGANISED, MODULAR principles
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVision } from './useVision';
import { useAIFeedback } from './useAIFeedback';
import { useAIAnalysis } from './useAIAnalysis';
import { useLens } from './useLens';
import { useFlow } from './useFlow';
import { EnhancedRestlessnessAnalyzer, RestlessnessAnalysis } from '../lib/vision/enhanced-restlessness-analyzer';
import type { VisionMetrics } from '../lib/vision/types';

export interface VisionFeedbackConfig {
  enableRealTimeFeedback: boolean;
  feedbackThresholds: {
    restlessness: number;
    movement: number;
    posture: number;
  };
  feedbackInterval: number; // seconds
}

export interface IntegratedSessionMetrics {
  visionMetrics: VisionMetrics | null;
  restlessnessAnalysis: RestlessnessAnalysis | null;
  aiRecommendations: string[];
  sessionQuality: number; // 0-100
  improvementSuggestions: string[];
}

export interface VisionFeedbackReturn {
  // State
  isVisionActive: boolean;
  sessionMetrics: IntegratedSessionMetrics;
  lastFeedbackTime: number;
  
  // Actions
  startVisionFeedback: () => Promise<void>;
  stopVisionFeedback: () => void;
  shareSessionWithVision: () => Promise<void>;
  mintPatternWithVisionData: () => Promise<void>;
  
  // Configuration
  updateConfig: (config: Partial<VisionFeedbackConfig>) => void;
  
  // Real-time feedback
  provideFeedback: (message: string, type: 'guidance' | 'encouragement' | 'correction') => void;
}

const DEFAULT_CONFIG: VisionFeedbackConfig = {
  enableRealTimeFeedback: true,
  feedbackThresholds: {
    restlessness: 0.7,
    movement: 0.6,
    posture: 0.5,
  },
  feedbackInterval: 30, // 30 seconds
};

export const useIntegratedVisionFeedback = (
  initialConfig: Partial<VisionFeedbackConfig> = {}
): VisionFeedbackReturn => {
  // Combine existing hooks
  const vision = useVision({ tier: 'premium', autoStart: false });
  const { generateFeedback } = useAIFeedback({
    isRunning: vision.isProcessing,
    isFinished: false,
    speak: (text: string) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.volume = 0.7;
        speechSynthesis.speak(utterance);
      }
    },
    cycleCount: 0,
    sessionPhase: 'inhale',
    patternKey: 'default',
  });
  
  const { analyzeSession } = useAIAnalysis();
  const { shareBreathingSession } = useLens();
  const { mintBreathingPattern } = useFlow({ network: 'testnet' });

  // Local state
  const [config, setConfig] = useState<VisionFeedbackConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  
  const [sessionMetrics, setSessionMetrics] = useState<IntegratedSessionMetrics>({
    visionMetrics: null,
    restlessnessAnalysis: null,
    aiRecommendations: [],
    sessionQuality: 0,
    improvementSuggestions: [],
  });
  
  const [lastFeedbackTime, setLastFeedbackTime] = useState(0);
  
  // Refs for persistent instances
  const restlessnessAnalyzer = useRef(new EnhancedRestlessnessAnalyzer());
  const feedbackHistory = useRef<Array<{ time: number; type: string; message: string }>>([]);
  const sessionStartTime = useRef<number>(0);

  /**
   * Process vision metrics and generate integrated feedback
   */
  const processVisionMetrics = useCallback(async (visionMetrics: VisionMetrics) => {
    try {
      // Extract faces and poses from vision metrics (this would come from the actual vision engine)
      // For now, we'll simulate this data structure
      const faces = (visionMetrics as any).faces || [];
      const poses = (visionMetrics as any).poses || [];
      
      // Analyze restlessness using enhanced analyzer
      const restlessnessAnalysis = restlessnessAnalyzer.current.analyzeFromLandmarks(faces, poses);
      
      // Calculate session quality based on multiple factors
      const sessionQuality = calculateSessionQuality(visionMetrics, restlessnessAnalysis);
      
      // Generate AI recommendations based on current state
      const aiRecommendations = generateAIRecommendations(visionMetrics, restlessnessAnalysis);
      
      // Update session metrics
      const updatedMetrics: IntegratedSessionMetrics = {
        visionMetrics,
        restlessnessAnalysis,
        aiRecommendations,
        sessionQuality,
        improvementSuggestions: restlessnessAnalysis.recommendations,
      };
      
      setSessionMetrics(updatedMetrics);
      
      // Provide real-time feedback if enabled and thresholds are met
      if (config.enableRealTimeFeedback) {
        await checkAndProvideFeedback(updatedMetrics);
      }
      
    } catch (error) {
      console.error('Error processing vision metrics:', error);
    }
  }, [config.enableRealTimeFeedback]);

  /**
   * Calculate overall session quality score
   */
  const calculateSessionQuality = (
    visionMetrics: VisionMetrics,
    restlessnessAnalysis: RestlessnessAnalysis
  ): number => {
    const factors = {
      stillness: (1 - restlessnessAnalysis.overall) * 30, // 30 points for stillness
      posture: (visionMetrics.postureQuality || 0.8) * 25, // 25 points for posture
      breathing: (1 - restlessnessAnalysis.components.breathingIrregularity) * 25, // 25 points for breathing
      focus: (1 - restlessnessAnalysis.components.eyeMovement) * 20, // 20 points for focus
    };
    
    return Math.round(Object.values(factors).reduce((sum, score) => sum + score, 0));
  };

  /**
   * Generate AI recommendations based on current metrics
   */
  const generateAIRecommendations = (
    visionMetrics: VisionMetrics,
    restlessnessAnalysis: RestlessnessAnalysis
  ): string[] => {
    const recommendations: string[] = [];
    
    // Add trend-based recommendations
    if (restlessnessAnalysis.trend === 'declining') {
      recommendations.push("Your restlessness is increasing. Try to refocus on your breath.");
    } else if (restlessnessAnalysis.trend === 'improving') {
      recommendations.push("Excellent! Your stillness is improving. Keep this up.");
    }
    
    // Add component-specific recommendations
    recommendations.push(...restlessnessAnalysis.recommendations);
    
    // Add breathing-specific recommendations
    if (visionMetrics.estimatedBreathingRate) {
      const rate = visionMetrics.estimatedBreathingRate;
      if (rate > 20) {
        recommendations.push("Your breathing rate seems elevated. Try to slow down your breath.");
      } else if (rate < 8) {
        recommendations.push("Your breathing is very slow. Ensure you're getting enough oxygen.");
      }
    }
    
    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  };

  /**
   * Check thresholds and provide real-time feedback
   */
  const checkAndProvideFeedback = useCallback(async (metrics: IntegratedSessionMetrics) => {
    const now = Date.now();
    const timeSinceLastFeedback = (now - lastFeedbackTime) / 1000;
    
    if (timeSinceLastFeedback < config.feedbackInterval) {
      return; // Too soon for next feedback
    }
    
    const { restlessnessAnalysis } = metrics;
    if (!restlessnessAnalysis) return;
    
    let feedbackMessage = '';
    let feedbackType: 'guidance' | 'encouragement' | 'correction' = 'guidance';
    
    // Check restlessness threshold
    if (restlessnessAnalysis.overall > config.feedbackThresholds.restlessness) {
      feedbackMessage = "I notice some restlessness. Take a moment to settle into stillness.";
      feedbackType = 'correction';
    }
    // Check movement threshold
    else if (restlessnessAnalysis.components.faceMovement > config.feedbackThresholds.movement) {
      feedbackMessage = "Try to keep your head still and find a comfortable position.";
      feedbackType = 'guidance';
    }
    // Check posture threshold
    else if (restlessnessAnalysis.components.postureShifts > config.feedbackThresholds.posture) {
      feedbackMessage = "Adjust your posture to find better alignment.";
      feedbackType = 'guidance';
    }
    // Provide encouragement for good performance
    else if (restlessnessAnalysis.overall < 0.3 && metrics.sessionQuality > 80) {
      feedbackMessage = "Beautiful stillness! You're in a wonderful state of calm.";
      feedbackType = 'encouragement';
    }
    
    if (feedbackMessage) {
      provideFeedback(feedbackMessage, feedbackType);
      setLastFeedbackTime(now);
    }
  }, [config, lastFeedbackTime]);

  /**
   * Provide feedback with speech synthesis
   */
  const provideFeedback = useCallback((message: string, type: 'guidance' | 'encouragement' | 'correction') => {
    // Log feedback
    feedbackHistory.current.push({
      time: Date.now(),
      type,
      message,
    });
    
    // Speak the message
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      
      // Adjust voice characteristics based on feedback type
      switch (type) {
        case 'encouragement':
          utterance.pitch = 1.1;
          break;
        case 'correction':
          utterance.pitch = 0.9;
          utterance.rate = 0.7;
          break;
        default:
          utterance.pitch = 1.0;
      }
      
      speechSynthesis.speak(utterance);
    }
    
    console.log(`Vision Feedback [${type}]:`, message);
  }, []);

  /**
   * Start vision feedback system
   */
  const startVisionFeedback = useCallback(async () => {
    try {
      await vision.initialize({ tier: 'premium' });
      await vision.startCamera();
      await vision.startProcessing();
      sessionStartTime.current = Date.now();
      console.log('Vision feedback system started');
    } catch (error) {
      console.error('Failed to start vision feedback:', error);
      throw error;
    }
  }, [vision]);

  /**
   * Stop vision feedback system
   */
  const stopVisionFeedback = useCallback(() => {
    vision.stopProcessing();
    vision.stopCamera();
    console.log('Vision feedback system stopped');
  }, [vision]);

  /**
   * Share session with vision data to Lens
   */
  const shareSessionWithVision = useCallback(async () => {
    if (!sessionMetrics.visionMetrics || !sessionMetrics.restlessnessAnalysis) {
      throw new Error('No vision data available to share');
    }
    
    const sessionDuration = (Date.now() - sessionStartTime.current) / 1000;
    
    const sessionData = {
      patternName: 'Vision-Enhanced Session',
      duration: sessionDuration,
      score: sessionMetrics.sessionQuality,
      insights: [
        `Achieved ${sessionMetrics.sessionQuality}% session quality`,
        `Restlessness trend: ${sessionMetrics.restlessnessAnalysis.trend}`,
        ...sessionMetrics.aiRecommendations.slice(0, 2),
      ],
      visionMetrics: {
        restlessnessScore: sessionMetrics.restlessnessAnalysis.overall,
        postureQuality: sessionMetrics.visionMetrics.postureQuality,
        breathingRate: sessionMetrics.visionMetrics.estimatedBreathingRate,
      },
    };
    
    await shareBreathingSession(sessionData);
  }, [sessionMetrics, shareBreathingSession]);

  /**
   * Mint pattern with vision data to Flow
   */
  const mintPatternWithVisionData = useCallback(async () => {
    if (!sessionMetrics.visionMetrics || !sessionMetrics.restlessnessAnalysis) {
      throw new Error('No vision data available for minting');
    }
    
    const patternData = {
      name: 'Vision-Enhanced Breathing Pattern',
      description: `A breathing pattern enhanced with AI vision analysis. Quality score: ${sessionMetrics.sessionQuality}%`,
      attributes: {
        visionEnhanced: true,
        qualityScore: sessionMetrics.sessionQuality,
        restlessnessScore: sessionMetrics.restlessnessAnalysis.overall,
        postureQuality: sessionMetrics.visionMetrics.postureQuality || 0,
        breathingRate: sessionMetrics.visionMetrics.estimatedBreathingRate || 15,
        aiRecommendations: sessionMetrics.aiRecommendations,
      },
    };
    
    await mintBreathingPattern(patternData);
  }, [sessionMetrics, mintBreathingPattern]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<VisionFeedbackConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Set up vision metrics listener
  useEffect(() => {
    if (vision.metrics) {
      processVisionMetrics(vision.metrics);
    }
  }, [vision.metrics, processVisionMetrics]);

  return {
    // State
    isVisionActive: vision.isProcessing,
    sessionMetrics,
    lastFeedbackTime,
    
    // Actions
    startVisionFeedback,
    stopVisionFeedback,
    shareSessionWithVision,
    mintPatternWithVisionData,
    
    // Configuration
    updateConfig,
    
    // Real-time feedback
    provideFeedback,
  };
};