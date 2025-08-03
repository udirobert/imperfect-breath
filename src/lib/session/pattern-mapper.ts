/**
 * Pattern Mapping Utilities
 * 
 * Centralized pattern transformation logic to maintain DRY principles
 * and ensure consistent pattern handling across the application.
 */

import { BreathingPattern } from '../breathingPatterns';

export interface SessionPattern {
  name: string;
  phases: {
    inhale: number;
    hold?: number;
    exhale: number;
    hold_after_exhale?: number;
  };
  difficulty: string;
  benefits: string[];
}

/**
 * Maps a BreathingPattern to SessionPattern format
 * Used by session orchestrator and components
 */
export const mapPatternForSession = (pattern: BreathingPattern): SessionPattern => ({
  name: pattern.name,
  phases: {
    inhale: pattern.inhale,
    hold: pattern.hold,
    exhale: pattern.exhale,
    hold_after_exhale: pattern.hold_after_exhale,
  },
  difficulty: "medium", // Could be derived from pattern complexity in future
  benefits: pattern.benefits,
});

/**
 * Maps a BreathingPattern to BreathingAnimation format
 * Ensures consistent pattern structure for UI components
 */
export const mapPatternForAnimation = (pattern: BreathingPattern) => ({
  name: pattern.name,
  phases: {
    inhale: pattern.inhale,
    hold: pattern.hold,
    exhale: pattern.exhale,
    hold_after_exhale: pattern.hold_after_exhale,
  },
});

/**
 * Gets breathing phase sequence for a pattern
 * Used by session orchestrator for cycle management
 */
export const getPhaseSequence = (pattern: BreathingPattern) => {
  const phases = [
    { name: 'inhale' as const, duration: pattern.inhale },
    ...(pattern.hold ? [{ name: 'hold' as const, duration: pattern.hold }] : []),
    { name: 'exhale' as const, duration: pattern.exhale },
    ...(pattern.hold_after_exhale ? [{ name: 'hold_after_exhale' as const, duration: pattern.hold_after_exhale }] : []),
  ];
  
  return phases;
};

/**
 * Calculates total cycle duration in seconds
 */
export const calculateCycleDuration = (pattern: BreathingPattern): number => {
  return pattern.inhale + (pattern.hold || 0) + pattern.exhale + (pattern.hold_after_exhale || 0);
};

/**
 * Validates pattern has required phases
 */
export const validatePattern = (pattern: BreathingPattern): boolean => {
  return !!(pattern.inhale && pattern.exhale && pattern.name);
};