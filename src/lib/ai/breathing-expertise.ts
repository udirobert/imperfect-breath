/**
 * Breathing Pattern Expertise Database
 * 
 * Comprehensive knowledge base for AI coaching with scientific backing,
 * pattern-specific guidance, and progressive skill development.
 */

export interface BreathingPatternExpertise {
  id: string;
  name: string;
  scientificBasis: string;
  physiologicalEffects: string[];
  optimalUseCase: string;
  commonMistakes: string[];
  progressionTips: string[];
  targetMetrics: {
    minDuration: number; // seconds
    optimalCycles: number;
    stillnessThreshold: number; // percentage
    consistencyTarget: number; // percentage
  };
  adaptations: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  contraindications?: string[];
}

export const BREATHING_EXPERTISE: Record<string, BreathingPatternExpertise> = {
  'Box Breathing': {
    id: 'box',
    name: 'Box Breathing',
    scientificBasis: 'Equal-ratio breathing activates the parasympathetic nervous system through vagal stimulation, promoting coherent heart rate variability and balanced autonomic function.',
    physiologicalEffects: [
      'Activates parasympathetic nervous system',
      'Increases heart rate variability (HRV)',
      'Reduces cortisol levels',
      'Improves prefrontal cortex function',
      'Balances oxygen/CO2 levels'
    ],
    optimalUseCase: 'Stress management, focus enhancement, pre-performance preparation, and general nervous system regulation.',
    commonMistakes: [
      'Forcing the breath instead of allowing natural rhythm',
      'Holding breath too tightly (should be gentle retention)',
      'Starting with counts too long for current capacity',
      'Breathing too high in the chest instead of diaphragmatically'
    ],
    progressionTips: [
      'Start with 3-3-3-3 if 4-4-4-4 feels strained',
      'Focus on smooth transitions between phases',
      'Gradually increase count only when current rhythm feels effortless',
      'Practice diaphragmatic breathing before adding counts'
    ],
    targetMetrics: {
      minDuration: 300, // 5 minutes
      optimalCycles: 10,
      stillnessThreshold: 70,
      consistencyTarget: 80
    },
    adaptations: {
      beginner: 'Start with 3-3-3-3 count, focus on smooth rhythm over perfect timing',
      intermediate: 'Standard 4-4-4-4, work on maintaining stillness throughout',
      advanced: 'Extend to 5-5-5-5 or 6-6-6-6, integrate with meditation practices'
    }
  },

  'Relaxation Breath': {
    id: 'relaxation',
    name: 'Relaxation Breath',
    scientificBasis: 'Extended exhale (4-7-8 pattern) stimulates the vagus nerve and activates the parasympathetic response, triggering the relaxation response and reducing sympathetic nervous system activity.',
    physiologicalEffects: [
      'Rapid parasympathetic activation',
      'Decreased heart rate and blood pressure',
      'Reduced anxiety and stress hormones',
      'Improved sleep quality',
      'Enhanced GABA production'
    ],
    optimalUseCase: 'Anxiety relief, sleep preparation, stress recovery, and transitioning from high-stress situations.',
    commonMistakes: [
      'Rushing the exhale instead of making it slow and controlled',
      'Not fully emptying lungs during exhale phase',
      'Holding breath too forcefully during retention',
      'Practicing when overly stimulated (start with gentler patterns first)'
    ],
    progressionTips: [
      'Begin with 4-4-6 if full 4-7-8 feels too intense',
      'Focus on making exhale twice as long as inhale',
      'Practice the "sigh of relief" quality in the exhale',
      'Use this pattern in the evening for best results'
    ],
    targetMetrics: {
      minDuration: 240, // 4 minutes
      optimalCycles: 8,
      stillnessThreshold: 75,
      consistencyTarget: 75
    },
    adaptations: {
      beginner: 'Start with 4-4-6, focus on gentle, complete exhale',
      intermediate: 'Standard 4-7-8, practice before sleep',
      advanced: 'Extend to 6-10-12, combine with progressive muscle relaxation'
    }
  },

  'Wim Hof Method': {
    id: 'wim_hof',
    name: 'Wim Hof Method',
    scientificBasis: 'Controlled hyperventilation followed by breath retention increases oxygen saturation, activates the sympathetic nervous system, and may influence immune response through adrenaline release.',
    physiologicalEffects: [
      'Increased oxygen saturation',
      'Adrenaline and noradrenaline release',
      'Enhanced immune system response',
      'Improved stress resilience',
      'Increased energy and alertness'
    ],
    optimalUseCase: 'Energy enhancement, immune system strengthening, cold exposure preparation, and building stress resilience.',
    commonMistakes: [
      'Forcing the breath too aggressively',
      'Not allowing natural pause between breaths',
      'Practicing too close to bedtime (can be stimulating)',
      'Ignoring body signals during retention phase'
    ],
    progressionTips: [
      'Start with 20-30 breaths before attempting retention',
      'Focus on full, deep breaths without strain',
      'Only hold breath as long as comfortable',
      'Practice in a safe environment (never in water)'
    ],
    targetMetrics: {
      minDuration: 600, // 10 minutes
      optimalCycles: 3,
      stillnessThreshold: 60,
      consistencyTarget: 70
    },
    adaptations: {
      beginner: 'Start with 20 breaths, short retention (30-60 seconds)',
      intermediate: 'Standard 30 breaths, 1-2 minute retention',
      advanced: 'Extended rounds with longer retentions, combine with cold exposure'
    },
    contraindications: [
      'Pregnancy',
      'Epilepsy or seizure disorders',
      'Severe cardiovascular conditions',
      'Recent surgery'
    ]
  },

  'Energy Breath': {
    id: 'energy',
    name: 'Energy Breath',
    scientificBasis: 'Quick, rhythmic breathing with slight emphasis on inhale activates the sympathetic nervous system, increasing alertness and energy through enhanced oxygen delivery and mild stimulation.',
    physiologicalEffects: [
      'Increased alertness and focus',
      'Enhanced oxygen delivery',
      'Mild sympathetic activation',
      'Improved mental clarity',
      'Energized feeling'
    ],
    optimalUseCase: 'Morning activation, pre-workout preparation, combating afternoon fatigue, and mental clarity enhancement.',
    commonMistakes: [
      'Breathing too rapidly (causing dizziness)',
      'Using only chest breathing instead of full diaphragmatic breaths',
      'Practicing when already overstimulated',
      'Not maintaining steady rhythm'
    ],
    progressionTips: [
      'Start slowly and gradually increase pace',
      'Maintain diaphragmatic breathing throughout',
      'Stop if feeling dizzy or lightheaded',
      'Best practiced in morning or early afternoon'
    ],
    targetMetrics: {
      minDuration: 180, // 3 minutes
      optimalCycles: 15,
      stillnessThreshold: 65,
      consistencyTarget: 85
    },
    adaptations: {
      beginner: 'Slower pace (3-2-4-1), focus on rhythm over speed',
      intermediate: 'Standard pace, maintain for full duration',
      advanced: 'Faster pace with longer sessions, combine with movement'
    }
  },

  'Sleep Breath': {
    id: 'sleep',
    name: 'Sleep Breath',
    scientificBasis: 'Extended exhale with gentle retention promotes deep parasympathetic activation, reduces cortisol, and triggers the body\'s natural sleep preparation mechanisms.',
    physiologicalEffects: [
      'Deep parasympathetic activation',
      'Reduced cortisol and stress hormones',
      'Increased melatonin production',
      'Lowered heart rate and blood pressure',
      'Enhanced sleep quality'
    ],
    optimalUseCase: 'Sleep preparation, insomnia relief, evening wind-down, and transitioning from day to night.',
    commonMistakes: [
      'Practicing too early in the evening',
      'Forcing the breath retention',
      'Not creating proper sleep environment',
      'Rushing through the pattern'
    ],
    progressionTips: [
      'Practice 30-60 minutes before intended sleep time',
      'Combine with progressive muscle relaxation',
      'Dim lights and minimize stimulation',
      'Focus on releasing tension with each exhale'
    ],
    targetMetrics: {
      minDuration: 360, // 6 minutes
      optimalCycles: 12,
      stillnessThreshold: 80,
      consistencyTarget: 70
    },
    adaptations: {
      beginner: 'Start with 4-4-6-2, focus on relaxation over perfect timing',
      intermediate: 'Standard 4-6-8-3, practice consistently before bed',
      advanced: 'Extend counts, combine with body scan meditation'
    }
  },

  'Mindfulness Breath': {
    id: 'mindfulness',
    name: 'Mindfulness Breath',
    scientificBasis: 'Simple, natural breathing rhythm supports present-moment awareness and activates the default mode network, promoting mindfulness and reducing mind-wandering.',
    physiologicalEffects: [
      'Enhanced present-moment awareness',
      'Reduced default mode network activity',
      'Improved emotional regulation',
      'Decreased anxiety and rumination',
      'Strengthened attention and focus'
    ],
    optimalUseCase: 'Meditation practice, anxiety management, mindfulness training, and developing present-moment awareness.',
    commonMistakes: [
      'Trying to control the breath too much',
      'Getting frustrated with mind wandering',
      'Focusing on technique over awareness',
      'Expecting immediate results'
    ],
    progressionTips: [
      'Allow breath to be natural and unforced',
      'Gently return attention when mind wanders',
      'Focus on the sensation of breathing',
      'Practice regularly for cumulative benefits'
    ],
    targetMetrics: {
      minDuration: 600, // 10 minutes
      optimalCycles: 20,
      stillnessThreshold: 75,
      consistencyTarget: 60
    },
    adaptations: {
      beginner: 'Start with 5 minutes, focus on noticing the breath',
      intermediate: 'Standard 10-15 minutes, develop sustained attention',
      advanced: 'Extended sessions, integrate with insight meditation'
    }
  }
};

/**
 * Get expertise for a specific breathing pattern
 */
export function getPatternExpertise(patternName: string): BreathingPatternExpertise | null {
  return BREATHING_EXPERTISE[patternName] || null;
}

/**
 * Get all available pattern expertise
 */
export function getAllPatternExpertise(): BreathingPatternExpertise[] {
  return Object.values(BREATHING_EXPERTISE);
}

/**
 * Get patterns suitable for a specific use case
 */
export function getPatternsByUseCase(useCase: string): BreathingPatternExpertise[] {
  return Object.values(BREATHING_EXPERTISE).filter(pattern =>
    pattern.optimalUseCase.toLowerCase().includes(useCase.toLowerCase())
  );
}

/**
 * Determine user experience level based on session metrics
 */
export function assessExperienceLevel(sessionData: {
  sessionDuration: number;
  cycleCount?: number;
  stillnessScore?: number;
  consistencyScore?: number;
}): 'beginner' | 'intermediate' | 'advanced' {
  const { sessionDuration, cycleCount = 0, stillnessScore = 0, consistencyScore = 0 } = sessionData;
  
  // Advanced: Long sessions with high performance
  if (sessionDuration >= 600 && cycleCount >= 15 && stillnessScore >= 80 && consistencyScore >= 80) {
    return 'advanced';
  }
  
  // Intermediate: Moderate sessions with decent performance
  if (sessionDuration >= 300 && cycleCount >= 8 && stillnessScore >= 60 && consistencyScore >= 60) {
    return 'intermediate';
  }
  
  // Beginner: Everything else
  return 'beginner';
}