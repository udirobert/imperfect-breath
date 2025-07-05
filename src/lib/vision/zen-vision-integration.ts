import type { VisionMetrics, BasicMetrics, StandardMetrics, PremiumMetrics } from './types';

interface BreathingPattern {
  name: string;
  phases: {
    inhale: number;
    hold?: number;
    exhale: number;
    pause?: number;
  };
  targetRate: number; // breaths per minute
}

interface ZenCoachingResponse {
  message: string;
  urgency: 'low' | 'medium' | 'high';
  suggestions: string[];
  encouragement?: string;
  shouldAdjustPattern?: boolean;
  patternAdjustment?: Partial<BreathingPattern>;
}

export class ZenVisionCoach {
  private static instance: ZenVisionCoach;
  private lastMetrics: VisionMetrics | null = null;
  private sessionStartTime: number = 0;
  private coachingHistory: Array<{ timestamp: number; message: string }> = [];

  static getInstance(): ZenVisionCoach {
    if (!ZenVisionCoach.instance) {
      ZenVisionCoach.instance = new ZenVisionCoach();
    }
    return ZenVisionCoach.instance;
  }

  startSession(): void {
    this.sessionStartTime = Date.now();
    this.coachingHistory = [];
    this.lastMetrics = null;
  }

  async analyzeAndCoach(
    metrics: VisionMetrics, 
    currentPattern: BreathingPattern,
    sessionDuration: number // in seconds
  ): Promise<ZenCoachingResponse> {
    this.lastMetrics = metrics;
    
    // Analyze metrics based on tier
    const analysis = this.analyzeMetrics(metrics, currentPattern);
    
    // Generate coaching response
    const coaching = this.generateCoaching(analysis, sessionDuration, currentPattern);
    
    // Store in history
    this.coachingHistory.push({
      timestamp: Date.now(),
      message: coaching.message
    });
    
    return coaching;
  }

  private analyzeMetrics(metrics: VisionMetrics, pattern: BreathingPattern) {
    const analysis = {
      confidence: metrics.confidence,
      issues: [] as string[],
      strengths: [] as string[],
      severity: 'low' as 'low' | 'medium' | 'high'
    };

    // Basic tier analysis
    if ('movementLevel' in metrics) {
      const basicMetrics = metrics as BasicMetrics;
      
      // Movement analysis
      if (basicMetrics.movementLevel > 0.7) {
        analysis.issues.push('excessive_movement');
        analysis.severity = 'high';
      } else if (basicMetrics.movementLevel > 0.4) {
        analysis.issues.push('moderate_restlessness');
        analysis.severity = 'medium';
      } else if (basicMetrics.movementLevel < 0.1) {
        analysis.strengths.push('excellent_stillness');
      }

      // Face presence
      if (!basicMetrics.facePresent) {
        analysis.issues.push('face_not_detected');
        analysis.severity = 'medium';
      }

      // Breathing rate analysis
      const targetRate = pattern.targetRate || this.calculateTargetRate(pattern);
      const rateDifference = Math.abs(basicMetrics.estimatedBreathingRate - targetRate);
      
      if (rateDifference > 5) {
        analysis.issues.push('breathing_rate_off');
        analysis.severity = Math.max(analysis.severity === 'high' ? 2 : analysis.severity === 'medium' ? 1 : 0, 1) === 2 ? 'high' : 'medium';
      } else if (rateDifference < 2) {
        analysis.strengths.push('perfect_breathing_rate');
      }

      // Head alignment
      if (basicMetrics.headAlignment < 0.3) {
        analysis.issues.push('poor_head_alignment');
        analysis.severity = 'medium';
      } else if (basicMetrics.headAlignment > 0.8) {
        analysis.strengths.push('excellent_posture');
      }
    }

    // Standard tier analysis
    if ('postureQuality' in metrics) {
      const standardMetrics = metrics as StandardMetrics;
      
      // Posture analysis
      if (standardMetrics.postureQuality < 0.4) {
        analysis.issues.push('poor_posture');
        analysis.severity = 'high';
      } else if (standardMetrics.postureQuality > 0.8) {
        analysis.strengths.push('excellent_posture');
      }

      // Facial tension
      if (standardMetrics.facialTension > 0.7) {
        analysis.issues.push('facial_tension');
        analysis.severity = 'medium';
      }

      // Breathing rhythm consistency
      if (standardMetrics.breathingRhythm.consistency < 0.6) {
        analysis.issues.push('inconsistent_rhythm');
        analysis.severity = 'medium';
      } else if (standardMetrics.breathingRhythm.consistency > 0.9) {
        analysis.strengths.push('perfect_rhythm');
      }

      // Restlessness
      if (standardMetrics.restlessnessScore > 0.6) {
        analysis.issues.push('high_restlessness');
        analysis.severity = 'high';
      } else if (standardMetrics.restlessnessScore < 0.2) {
        analysis.strengths.push('deep_calm');
      }
    }

    // Premium tier analysis
    if ('detailedFacialAnalysis' in metrics) {
      const premiumMetrics = metrics as PremiumMetrics;
      
      // Detailed facial analysis
      if (premiumMetrics.detailedFacialAnalysis.jawTension > 0.7) {
        analysis.issues.push('jaw_tension');
      }
      
      if (premiumMetrics.detailedFacialAnalysis.eyeMovement > 0.6) {
        analysis.issues.push('eye_distraction');
      }

      // Precise breathing accuracy
      if (premiumMetrics.preciseBreathingMetrics.rhythmAccuracy > 0.95) {
        analysis.strengths.push('master_level_breathing');
      } else if (premiumMetrics.preciseBreathingMetrics.rhythmAccuracy < 0.7) {
        analysis.issues.push('breathing_accuracy_low');
        analysis.severity = 'medium';
      }

      // Full body posture
      if (premiumMetrics.fullBodyPosture.spinalAlignment < 0.5) {
        analysis.issues.push('spinal_misalignment');
        analysis.severity = 'high';
      }
    }

    return analysis;
  }

  private generateCoaching(
    analysis: any, 
    sessionDuration: number, 
    pattern: BreathingPattern
  ): ZenCoachingResponse {
    const { issues, strengths, severity } = analysis;
    
    // Handle critical issues first
    if (issues.includes('excessive_movement')) {
      return {
        message: "I notice you're moving quite a bit. Let's pause and find your center. Take a moment to settle into a comfortable position and focus on becoming still like a mountain. 🏔️",
        urgency: 'high',
        suggestions: [
          "Find a comfortable seated position",
          "Place your hands gently on your knees",
          "Imagine roots growing from your sitting bones into the earth",
          "Focus on one point in front of you"
        ],
        shouldAdjustPattern: true,
        patternAdjustment: {
          phases: {
            inhale: Math.max(pattern.phases.inhale - 1, 3),
            hold: pattern.phases.hold ? Math.max(pattern.phases.hold - 1, 2) : undefined,
            exhale: Math.max(pattern.phases.exhale - 1, 4)
          }
        }
      };
    }

    if (issues.includes('poor_posture') || issues.includes('spinal_misalignment')) {
      return {
        message: "Your posture needs some attention. Good breathing starts with good alignment. Let's adjust your position to unlock your full breathing potential. 🧘‍♀️",
        urgency: 'high',
        suggestions: [
          "Sit tall with your spine naturally curved",
          "Roll your shoulders back and down",
          "Lengthen the back of your neck",
          "Imagine a string pulling you up from the crown of your head"
        ]
      };
    }

    if (issues.includes('breathing_rate_off')) {
      const currentRate = this.lastMetrics && 'estimatedBreathingRate' in this.lastMetrics 
        ? (this.lastMetrics as BasicMetrics).estimatedBreathingRate 
        : 15;
      const targetRate = pattern.targetRate || this.calculateTargetRate(pattern);
      
      if (currentRate > targetRate + 3) {
        return {
          message: `I can see you're breathing a bit fast at ${Math.round(currentRate)} breaths per minute. Our target is around ${targetRate}. Let's slow down together and find that peaceful rhythm. 🌬️`,
          urgency: 'medium',
          suggestions: [
            "Focus on extending your exhale",
            "Count slowly and deliberately",
            "Don't force it - let it flow naturally",
            "Think 'slow and steady' rather than 'deep and hard'"
          ]
        };
      } else {
        return {
          message: `Your breathing is a bit slow at ${Math.round(currentRate)} breaths per minute. Let's gently increase the pace to match our ${targetRate} bpm target. Remember, we want natural, not forced. 💨`,
          urgency: 'medium',
          suggestions: [
            "Slightly shorten your holds",
            "Keep the rhythm flowing",
            "Don't hold your breath too long",
            "Find a comfortable, sustainable pace"
          ]
        };
      }
    }

    if (issues.includes('facial_tension') || issues.includes('jaw_tension')) {
      return {
        message: "I can see some tension in your face. Let's release that tightness and allow your breathing to flow more freely. Your face should be as relaxed as a sleeping child's. 😌",
        urgency: 'medium',
        suggestions: [
          "Gently part your lips",
          "Relax your jaw and let it drop slightly",
          "Soften the muscles around your eyes",
          "Release any furrow in your brow"
        ]
      };
    }

    if (issues.includes('inconsistent_rhythm')) {
      return {
        message: "Your breathing rhythm is a bit uneven. That's completely normal when learning! Let's focus on creating a steady, wave-like pattern. Think of ocean waves - consistent and flowing. 🌊",
        urgency: 'medium',
        suggestions: [
          "Count at the same pace each time",
          "Use the visual guide to help maintain rhythm",
          "Don't worry about perfection, focus on consistency",
          "If you lose the rhythm, gently return to the pattern"
        ]
      };
    }

    // Handle positive feedback and encouragement
    if (strengths.length > 0) {
      if (strengths.includes('master_level_breathing')) {
        return {
          message: "Incredible! Your breathing accuracy is at 95%+ - that's master level! You've found the zone where breath becomes meditation. This is exactly the kind of session worth minting as an NFT! 🌟",
          urgency: 'low',
          suggestions: [
            "Maintain this beautiful rhythm",
            "Notice how calm and centered you feel",
            "This is your optimal breathing state"
          ],
          encouragement: "You've achieved something truly special. Your practice is inspiring!"
        };
      }

      if (strengths.includes('perfect_breathing_rate') && strengths.includes('excellent_stillness')) {
        return {
          message: "Beautiful work! Your breathing rate is perfectly on target and you're wonderfully still. You've found that sweet spot where effort becomes effortless. 🧘‍♀️✨",
          urgency: 'low',
          suggestions: [
            "Continue with this excellent rhythm",
            "Notice the sense of calm spreading through your body",
            "You're in the flow state - just be with it"
          ],
          encouragement: "This is what mastery looks like. You should be proud of this practice!"
        };
      }

      if (strengths.includes('deep_calm')) {
        return {
          message: "You've achieved a state of deep calm - your restlessness score is beautifully low. This is the kind of inner peace that ancient practitioners spent years cultivating. 🕯️",
          urgency: 'low',
          suggestions: [
            "Rest in this peaceful state",
            "Let this calmness permeate every cell",
            "Remember this feeling for when you need it most"
          ],
          encouragement: "You've touched something profound. This is true meditation."
        };
      }
    }

    // Session duration-based coaching
    if (sessionDuration < 60) {
      return {
        message: "You're just getting started! The first minute is about settling in and finding your rhythm. Don't worry about perfection - just focus on being present with your breath. 🌱",
        urgency: 'low',
        suggestions: [
          "Allow yourself to settle into the practice",
          "It's normal for the mind to be active at first",
          "Focus on the sensation of breathing",
          "Let each breath be a fresh start"
        ]
      };
    } else if (sessionDuration > 300) { // 5 minutes
      return {
        message: "Wonderful dedication! You've been practicing for over 5 minutes. This is where the real benefits begin to unfold. Your nervous system is shifting into a state of deep rest and repair. 🌸",
        urgency: 'low',
        suggestions: [
          "Notice how different you feel from when you started",
          "Your body is now in full relaxation mode",
          "This extended practice is building real resilience"
        ],
        encouragement: "This level of commitment to your wellbeing is truly admirable!"
      };
    }

    // Default encouraging message
    return {
      message: "You're doing great! Your breathing practice is unfolding beautifully. Each breath is an opportunity to deepen your connection with yourself. Stay present and keep flowing. 🌬️💙",
      urgency: 'low',
      suggestions: [
        "Trust the process",
        "Stay connected to your breath",
        "Notice the subtle changes in your body",
        "You're exactly where you need to be"
      ],
      encouragement: "Every moment of practice is a gift to yourself."
    };
  }

  private calculateTargetRate(pattern: BreathingPattern): number {
    // Calculate breaths per minute based on pattern timing
    const totalTime = pattern.phases.inhale + 
                     (pattern.phases.hold || 0) + 
                     pattern.phases.exhale + 
                     (pattern.phases.pause || 0);
    
    return Math.round(60 / totalTime);
  }

  // Get coaching history for session summary
  getSessionSummary(): Array<{ timestamp: number; message: string }> {
    return [...this.coachingHistory];
  }

  // Reset for new session
  reset(): void {
    this.lastMetrics = null;
    this.sessionStartTime = 0;
    this.coachingHistory = [];
  }

  // Get overall session assessment
  getSessionAssessment(finalMetrics: VisionMetrics, totalDuration: number): {
    score: number;
    highlights: string[];
    improvements: string[];
    recommendation: string;
  } {
    const analysis = this.analyzeMetrics(finalMetrics, { 
      name: 'session', 
      phases: { inhale: 4, exhale: 6 }, 
      targetRate: 10 
    });
    
    let score = 50; // Base score
    
    // Add points for strengths
    analysis.strengths.forEach(strength => {
      switch (strength) {
        case 'master_level_breathing': score += 25; break;
        case 'perfect_breathing_rate': score += 15; break;
        case 'excellent_stillness': score += 15; break;
        case 'deep_calm': score += 20; break;
        case 'excellent_posture': score += 10; break;
        case 'perfect_rhythm': score += 15; break;
        default: score += 5;
      }
    });
    
    // Subtract points for issues
    analysis.issues.forEach(issue => {
      switch (analysis.severity) {
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });
    
    // Duration bonus
    if (totalDuration > 300) score += 10; // 5+ minutes
    if (totalDuration > 600) score += 10; // 10+ minutes
    
    score = Math.max(0, Math.min(100, score));
    
    const highlights = analysis.strengths.map(strength => {
      switch (strength) {
        case 'master_level_breathing': return 'Achieved master-level breathing accuracy';
        case 'perfect_breathing_rate': return 'Maintained perfect breathing rate';
        case 'excellent_stillness': return 'Demonstrated exceptional stillness';
        case 'deep_calm': return 'Reached a state of deep calm';
        case 'excellent_posture': return 'Maintained excellent posture';
        case 'perfect_rhythm': return 'Achieved perfect breathing rhythm';
        default: return 'Showed good breathing technique';
      }
    });
    
    const improvements = analysis.issues.map(issue => {
      switch (issue) {
        case 'excessive_movement': return 'Work on maintaining stillness during practice';
        case 'poor_posture': return 'Focus on spinal alignment and posture';
        case 'breathing_rate_off': return 'Practice maintaining consistent breathing rate';
        case 'facial_tension': return 'Remember to relax facial muscles';
        case 'inconsistent_rhythm': return 'Develop more consistent breathing rhythm';
        default: return 'Continue refining your technique';
      }
    });
    
    let recommendation = '';
    if (score >= 90) {
      recommendation = 'Outstanding session! Consider minting this as an NFT and sharing your mastery with the community.';
    } else if (score >= 75) {
      recommendation = 'Excellent practice! You\'re developing real skill. Keep up this level of dedication.';
    } else if (score >= 60) {
      recommendation = 'Good session with room for growth. Focus on the improvement areas for your next practice.';
    } else {
      recommendation = 'Every practice is valuable. Be patient with yourself and keep showing up consistently.';
    }
    
    return {
      score,
      highlights,
      improvements,
      recommendation
    };
  }
}
