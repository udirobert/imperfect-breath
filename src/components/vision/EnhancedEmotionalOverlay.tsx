/**
 * Enhanced Emotional Overlay Component
 * 
 * Extends existing FaceMeshOverlay with client-side FACS emotional analysis
 * - Reduces server dependency for real-time feedback
 * - Provides immediate emotional state awareness
 * - Maintains minimal aesthetic by default with optional detailed view
 * 
 * Core Principles:
 * - ENHANCEMENT FIRST: Builds on existing FaceMeshOverlay
 * - PERFORMANT: Client-side processing, no server calls needed
 * - MODULAR: Composable emotional analysis that can be toggled
 * - CLEAN: Clear separation between face tracking and emotional analysis
 */

import React, { useMemo, useCallback, useState } from 'react';
import { FaceMeshOverlay } from './FaceMeshOverlay';

// FACS-based emotional analysis (client-side only)
interface EmotionalMetrics {
  smileVector: number;
  eyeOpenness: number;
  browTension: number;
  asymmetry: number;
  isDuchenneActive: boolean;
  dominantEmotion: 'joy' | 'calm' | 'tension' | 'neutral';
  confidence: number;
  relaxationScore: number; // 0-100, higher = more relaxed
}

interface EmotionalState {
  current: EmotionalMetrics;
  trend: 'improving' | 'stable' | 'declining';
  sessionProgress: number; // 0-100
}

export interface EnhancedEmotionalOverlayProps {
  videoElement: HTMLVideoElement | null;
  landmarks: any[];
  isActive: boolean;
  confidence: number;
  postureScore: number;
  movementLevel: number;
  
  // New emotional analysis props
  emotionalAnalysisEnabled?: boolean;
  showDetailedMetrics?: boolean;
  onEmotionalStateChange?: (state: EmotionalState) => void;
  onPatternRecommendation?: (recommendedPattern: string, reason: string) => void;
}

// Client-side FACS engine (no server dependency)
class ClientSideFACSEngine {
  private static instance: ClientSideFACSEngine;
  
  static getInstance(): ClientSideFACSEngine {
    if (!ClientSideFACSEngine.instance) {
      ClientSideFACSEngine.instance = new ClientSideFACSEngine();
    }
    return ClientSideFACSEngine.instance;
  }

  analyzeEmotionalState(landmarks: any[]): EmotionalMetrics | null {
    if (!landmarks || landmarks.length === 0) return null;

    try {
      // Normalize based on face scale
      const faceHeight = this.getDistance(landmarks[10], landmarks[152]); // Forehead to chin
      const getDist = (i1: number, i2: number) => 
        this.getDistance(landmarks[i1], landmarks[i2]) / faceHeight;

      // Core FACS metrics
      const mouthCenterY = (landmarks[13]?.y + landmarks[14]?.y) / 2;
      const cornersY = (landmarks[61]?.y + landmarks[291]?.y) / 2;
      const smileVector = (mouthCenterY - cornersY) / faceHeight;

      const eyeOpenness = (getDist(159, 145) + getDist(386, 374)) / 2;
      const browTension = getDist(70, 63); // Brow compression
      const asymmetry = Math.abs(landmarks[61]?.y - landmarks[291]?.y) / faceHeight;

      // Duchenne detection (genuine smile + eye squint)
      const isDuchenneActive = smileVector > 0.02 && eyeOpenness < 0.055;

      // Calculate relaxation score
      let relaxationScore = 50; // baseline
      
      if (smileVector > 0) relaxationScore += smileVector * 800;
      if (isDuchenneActive) relaxationScore += 25;
      if (browTension > 0.08) relaxationScore -= (browTension - 0.08) * 300;
      if (eyeOpenness > 0.06 && eyeOpenness < 0.08) relaxationScore += 15; // optimal eye state
      
      relaxationScore = Math.max(0, Math.min(100, relaxationScore));

      // Determine dominant emotion
      let dominantEmotion: 'joy' | 'calm' | 'tension' | 'neutral' = 'neutral';
      if (isDuchenneActive) dominantEmotion = 'joy';
      else if (relaxationScore > 70) dominantEmotion = 'calm';
      else if (browTension > 0.1 || asymmetry > 0.03) dominantEmotion = 'tension';

      return {
        smileVector,
        eyeOpenness,
        browTension,
        asymmetry,
        isDuchenneActive,
        dominantEmotion,
        confidence: Math.min(95, relaxationScore + 20), // Confidence in measurement
        relaxationScore
      };
    } catch (error) {
      console.warn('FACS analysis failed:', error);
      return null;
    }
  }

  private getDistance(p1: any, p2: any): number {
    if (!p1 || !p2) return 0;
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }
}

export const EnhancedEmotionalOverlay: React.FC<EnhancedEmotionalOverlayProps> = ({
  videoElement,
  landmarks,
  isActive,
  confidence,
  postureScore,
  movementLevel,
  emotionalAnalysisEnabled = true,
  showDetailedMetrics = false,
  onEmotionalStateChange,
  onPatternRecommendation,
}) => {
  const [emotionalHistory, setEmotionalHistory] = useState<EmotionalMetrics[]>([]);
  const facsEngine = ClientSideFACSEngine.getInstance();

  // Analyze emotional state from landmarks
  const currentEmotionalState = useMemo(() => {
    if (!emotionalAnalysisEnabled || !landmarks.length) return null;
    
    return facsEngine.analyzeEmotionalState(landmarks);
  }, [landmarks, emotionalAnalysisEnabled, facsEngine]);

  // Update emotional history and trigger callbacks
  React.useEffect(() => {
    if (currentEmotionalState) {
      setEmotionalHistory(prev => {
        const newHistory = [...prev, currentEmotionalState].slice(-30); // Keep last 30 readings
        
        // Calculate trend
        const recent = newHistory.slice(-5);
        const avgRecent = recent.reduce((acc, curr) => acc + curr.relaxationScore, 0) / recent.length;
        const earlier = newHistory.slice(-10, -5);
        const avgEarlier = earlier.length > 0 
          ? earlier.reduce((acc, curr) => acc + curr.relaxationScore, 0) / earlier.length 
          : avgRecent;
        
        const trend = avgRecent > avgEarlier + 5 ? 'improving' 
          : avgRecent < avgEarlier - 5 ? 'declining' 
          : 'stable';

        const emotionalState: EmotionalState = {
          current: currentEmotionalState,
          trend,
          sessionProgress: newHistory.length > 0 
            ? Math.min(100, (newHistory.length / 30) * 100)
            : 0
        };

        onEmotionalStateChange?.(emotionalState);

        // Pattern recommendations based on emotional state
        if (currentEmotionalState.dominantEmotion === 'tension' && currentEmotionalState.confidence > 70) {
          onPatternRecommendation?.('4-7-8 Calming', 'Detected facial tension - this pattern helps release stress');
        } else if (currentEmotionalState.relaxationScore > 80 && currentEmotionalState.isDuchenneActive) {
          onPatternRecommendation?.('Box Breathing', 'Great relaxation detected - maintain with steady rhythm');
        }

        return newHistory;
      });
    }
  }, [currentEmotionalState, onEmotionalStateChange, onPatternRecommendation]);

  // Render enhanced overlay with emotional feedback
  const renderEmotionalFeedback = () => {
    if (!emotionalAnalysisEnabled || !currentEmotionalState) return null;

    const { dominantEmotion, relaxationScore, isDuchenneActive } = currentEmotionalState;

    return (
      <div className="absolute top-4 right-4 z-10">
        {/* Minimal mode - just a subtle indicator */}
        {!showDetailedMetrics && (
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  dominantEmotion === 'joy' ? 'bg-green-400' 
                  : dominantEmotion === 'calm' ? 'bg-blue-400'
                  : dominantEmotion === 'tension' ? 'bg-orange-400'
                  : 'bg-gray-400'
                }`}
              />
              <span className="opacity-75">
                {relaxationScore > 70 ? 'Relaxed' : relaxationScore > 40 ? 'Settling' : 'Tense'}
              </span>
              {isDuchenneActive && <span className="text-green-300">😊</span>}
            </div>
          </div>
        )}

        {/* Detailed metrics mode */}
        {showDetailedMetrics && (
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-2 max-w-48">
            <div className="font-semibold">Emotional State</div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Relaxation:</span>
                <span className="font-mono">{relaxationScore.toFixed(0)}%</span>
              </div>
              
              <div className="flex justify-between">
                <span>State:</span>
                <span className={`font-semibold ${
                  dominantEmotion === 'joy' ? 'text-green-300' 
                  : dominantEmotion === 'calm' ? 'text-blue-300'
                  : dominantEmotion === 'tension' ? 'text-orange-300'
                  : 'text-gray-300'
                }`}>
                  {dominantEmotion}
                </span>
              </div>

              {isDuchenneActive && (
                <div className="text-green-300 text-center">Genuine smile detected!</div>
              )}
            </div>

            <div className="w-full bg-gray-600 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-orange-400 to-green-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${relaxationScore}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Original face mesh overlay */}
      <FaceMeshOverlay
        videoElement={videoElement}
        landmarks={landmarks}
        isActive={isActive}
        confidence={confidence}
        postureScore={postureScore}
        movementLevel={movementLevel}
      />
      
      {/* Enhanced emotional feedback */}
      {renderEmotionalFeedback()}
    </div>
  );
};