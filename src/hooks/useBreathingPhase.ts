/**
 * useBreathingPhase Hook
 * 
 * React hook for consuming the unified breathing phase manager.
 * Provides reactive state updates and phase management controls.
 */

import { useEffect, useState, useCallback } from 'react';
import { Subscription } from 'rxjs';
import { 
  breathingPhaseManager, 
  PhaseState, 
  BreathingPattern,
  PhaseTransition 
} from '../lib/breathing/unified-phase-manager';

export interface UseBreathingPhaseReturn {
  // State
  phaseState: PhaseState;
  rhythmConsistency: number;
  
  // Controls
  startCycle: (pattern: BreathingPattern) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  
  // Phase info helpers
  getPhaseInstruction: () => string;
  getPhaseColor: () => string;
  getCircleSize: () => string;
}

const PHASE_INSTRUCTIONS: Record<string, string> = {
  prepare: 'Get Ready',
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  pause: 'Rest',
  complete: 'Complete',
};

const PHASE_COLORS: Record<string, string> = {
  prepare: 'text-gray-500 border-gray-400',
  inhale: 'text-blue-500 border-blue-400',
  hold: 'text-purple-500 border-purple-400',
  exhale: 'text-teal-500 border-teal-400',
  pause: 'text-gray-500 border-gray-400',
  complete: 'text-green-500 border-green-400',
};

export const useBreathingPhase = (): UseBreathingPhaseReturn => {
  const [phaseState, setPhaseState] = useState<PhaseState>(
    breathingPhaseManager.getCurrentState()
  );
  const [rhythmConsistency, setRhythmConsistency] = useState(100);
  
  // Subscribe to phase state changes
  useEffect(() => {
    const subscription: Subscription = breathingPhaseManager
      .getPhaseState$()
      .subscribe((state) => {
        setPhaseState(state);
        setRhythmConsistency(breathingPhaseManager.getRhythmConsistency());
      });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Control methods
  const startCycle = useCallback((pattern: BreathingPattern) => {
    breathingPhaseManager.startCycle(pattern);
  }, []);
  
  const pause = useCallback(() => {
    breathingPhaseManager.pause();
  }, []);
  
  const resume = useCallback(() => {
    breathingPhaseManager.resume();
  }, []);
  
  const stop = useCallback(() => {
    breathingPhaseManager.stop();
  }, []);
  
  const reset = useCallback(() => {
    breathingPhaseManager.reset();
  }, []);
  
  // Helper methods
  const getPhaseInstruction = useCallback((): string => {
    return PHASE_INSTRUCTIONS[phaseState.currentPhase] || 'Breathe';
  }, [phaseState.currentPhase]);
  
  const getPhaseColor = useCallback((): string => {
    return PHASE_COLORS[phaseState.currentPhase] || PHASE_COLORS.prepare;
  }, [phaseState.currentPhase]);
  
  const getCircleSize = useCallback((): string => {
    const { currentPhase, phaseProgress } = phaseState;
    
    switch (currentPhase) {
      case 'inhale':
        return `${60 + phaseProgress * 0.4}%`;
      case 'hold':
        return '100%';
      case 'exhale':
        return `${100 - phaseProgress * 0.4}%`;
      case 'pause':
        return '60%';
      default:
        return '80%';
    }
  }, [phaseState]);
  
  return {
    phaseState,
    rhythmConsistency,
    startCycle,
    pause,
    resume,
    stop,
    reset,
    getPhaseInstruction,
    getPhaseColor,
    getCircleSize,
  };
};

/**
 * Hook for phase transition events
 */
export const usePhaseTransitions = (
  onTransition: (transition: PhaseTransition) => void
): void => {
  useEffect(() => {
    const unsubscribe = breathingPhaseManager.onPhaseTransition(onTransition);
    return unsubscribe;
  }, [onTransition]);
};