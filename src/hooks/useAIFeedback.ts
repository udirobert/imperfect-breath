
import { useEffect } from 'react';
import { useBreathingSession } from './useBreathingSession';

type UseAIFeedbackProps = {
  isRunning: boolean;
  isFinished: boolean;
  speak: ReturnType<typeof useBreathingSession>['controls']['speak'];
  cycleCount: number;
  sessionPhase: ReturnType<typeof useBreathingSession>['state']['sessionPhase'];
  patternKey: string;
};

// This hook provides extra flavor during the session.
export const useAIFeedback = ({
  isRunning,
  isFinished,
  speak,
  cycleCount,
  sessionPhase,
  patternKey,
}: UseAIFeedbackProps) => {
  useEffect(() => {
    if (!isRunning || isFinished) return;

    if (cycleCount === 1 && sessionPhase === 'inhale') {
      speak("Great start. Keep your focus on the breath.", { rate: 1.1, pitch: 1.1 });
    }

    if (patternKey === 'wim-hof' && cycleCount > 10 && cycleCount % 5 === 0) {
        speak("You're doing great. Deeper breaths.", { rate: 1.1, pitch: 1.1 });
    }
  }, [isRunning, isFinished, speak, cycleCount, sessionPhase, patternKey]);
};
