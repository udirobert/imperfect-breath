
export type BreathingPhaseName = 'inhale' | 'hold' | 'exhale' | 'pause';

export type BreathingPhase = {
  name: BreathingPhaseName | string; // Allow both standard names and custom strings
  duration: number;
  text: string;
  instruction?: string; // Optional instruction field for enhanced patterns
};

// Extended phase type for custom patterns that allows more flexibility
export type CustomBreathingPhase = {
  name: string; // Allow any string for custom phases
  duration: number;
  text: string;
  instruction?: string;
};

export type BreathingPattern = {
  key: 'box' | 'resonant' | 'wimHof';
  name: string;
  cycles: number; // Use Infinity for continuous patterns
  phases: BreathingPhase[];
  hasBreathHold: boolean;
};

// Utility functions for phase creation
export const createBreathingPhase = (
  name: BreathingPhaseName, 
  duration: number, 
  text: string,
  instruction?: string
): BreathingPhase => ({
  name,
  duration,
  text,
  instruction
});

export const createCustomPhase = (
  name: string, 
  duration: number, 
  text: string,
  instruction?: string
): CustomBreathingPhase => ({
  name,
  duration,
  text,
  instruction
});

// Validate that a phase name is a valid BreathingPhaseName
export const isValidPhaseName = (name: string): name is BreathingPhaseName => {
  return ['inhale', 'hold', 'exhale', 'pause'].includes(name);
};

// Convert seconds to display format
export const formatPhaseDuration = (durationInSeconds: number): string => {
  if (durationInSeconds < 1000) {
    return `${durationInSeconds}ms`;
  }
  return `${(durationInSeconds / 1000).toFixed(1)}s`;
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
