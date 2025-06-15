
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SpeakOptions } from './useVoiceGuidance';

type UseDemoFeedbackProps = {
  isDemoMode: boolean;
  isRunning: boolean;
  isFinished: boolean;
  speak: (text: string, options?: SpeakOptions) => void;
  cycleCount: number;
  sessionPhase: string;
  patternKey: 'box' | 'resonant' | 'wimHof';
};

export const useDemoFeedback = ({
  isDemoMode,
  isRunning,
  isFinished,
  speak,
  cycleCount,
  sessionPhase,
  patternKey,
}: UseDemoFeedbackProps) => {
  const lastSpokenCycle = useRef(-1);
  const hasGivenHoldFeedback = useRef(false);

  useEffect(() => {
    if (isFinished) {
      lastSpokenCycle.current = -1;
      hasGivenHoldFeedback.current = false;
    }
  }, [isFinished]);

  // Feedback based on breath cycles
  useEffect(() => {
    if (!isDemoMode || !isRunning || isFinished || cycleCount === 0 || lastSpokenCycle.current === cycleCount) {
      return;
    }

    let message = '';

    if (cycleCount === 3) {
      if (patternKey === 'resonant') {
        message = "Your breath interval is stabilizing. A deeply calming rhythm is emerging.";
      } else if (patternKey === 'box') {
        message = "Your breath is becoming more regular. A sign of increased focus.";
      } else { // Wim Hof
        message = "Your breathing is becoming deep and powerful.";
      }
    } else if (cycleCount === 5) {
      message = 'Posture looks more relaxed. Your system is syncing nicely.';
    } else if (cycleCount === 10) {
      message = "Excellent focus. Your breath is exceptionally steady now.";
    } else if (cycleCount === 20 && patternKey === 'wimHof') {
      message = 'Your system appears fully oxygenated. Prepare for what comes next.';
    }

    if (message) {
      lastSpokenCycle.current = cycleCount;
      const feedbackTimeout = setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
          return; // Don't interrupt main guidance
        }
        
        speak(message, { pitch: 0.8, rate: 0.85, volume: 0.7 });
        
        toast.info("Biometric Feedback (Demo)", {
          description: message,
          duration: 5000,
        });
      }, 2500); // Delay to avoid clashing with phase instructions

      return () => clearTimeout(feedbackTimeout);
    }
  }, [isDemoMode, isRunning, isFinished, speak, cycleCount, patternKey]);

  // Feedback during breath hold
  useEffect(() => {
    if (!isDemoMode || !isRunning || isFinished || sessionPhase !== 'breath-hold' || hasGivenHoldFeedback.current) {
      return;
    }

    hasGivenHoldFeedback.current = true;

    const holdFeedbackTimeout = setTimeout(() => {
      const messages = [
        "Your body is calm and still. Excellent.",
        "A deep state of relaxation is being detected.",
        "Minimal movement. You are maintaining focus exceptionally well."
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
        return; // Don't interrupt
      }
      speak(message, { pitch: 0.8, rate: 0.8, volume: 0.7 });
      toast.info("Biometric Feedback (Demo)", {
        description: message,
        duration: 5000,
      });
    }, 8000); // Give feedback 8 seconds into the hold

    return () => clearTimeout(holdFeedbackTimeout);
  }, [isDemoMode, isRunning, isFinished, speak, sessionPhase]);
};
