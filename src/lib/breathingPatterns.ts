
export type BreathingPhaseName = 'inhale' | 'hold' | 'exhale';

export type BreathingPhase = {
  name: BreathingPhaseName;
  duration: number;
  text: string;
};

export type BreathingPattern = {
  key: 'box' | 'resonant' | 'wimHof';
  name: string;
  cycles: number; // Use Infinity for continuous patterns
  phases: BreathingPhase[];
  hasBreathHold: boolean;
};

export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  box: {
    key: 'box',
    name: 'Box Breathing',
    cycles: Infinity,
    hasBreathHold: false,
    phases: [
      { name: 'inhale', duration: 4000, text: 'Breathe In...' },
      { name: 'hold', duration: 4000, text: 'Hold' },
      { name: 'exhale', duration: 4000, text: 'Breathe Out...' },
      { name: 'hold', duration: 4000, text: 'Hold' },
    ],
  },
  resonant: {
    key: 'resonant',
    name: 'Resonant Breathing',
    cycles: Infinity,
    hasBreathHold: false,
    phases: [
      { name: 'inhale', duration: 5500, text: 'Breathe In...' },
      { name: 'exhale', duration: 5500, text: 'Breathe Out...' },
    ],
  },
  wimHof: {
    key: 'wimHof',
    name: 'Wim Hof',
    cycles: 30,
    hasBreathHold: true,
    phases: [
      // Wim Hof is more about rhythm than strict timing, this is an approximation
      { name: 'inhale', duration: 1500, text: 'Breathe In Deeply' },
      { name: 'exhale', duration: 1500, text: 'Let Go' },
    ],
  },
};
