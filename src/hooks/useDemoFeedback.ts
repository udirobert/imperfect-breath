
import { useEffect } from 'react';
import { toast } from 'sonner';
import { SpeakOptions } from './useVoiceGuidance';

type UseDemoFeedbackProps = {
  isDemoMode: boolean;
  isRunning: boolean;
  isFinished: boolean;
  speak: (text: string, options?: SpeakOptions) => void;
};

export const useDemoFeedback = ({ isDemoMode, isRunning, isFinished, speak }: UseDemoFeedbackProps) => {
  useEffect(() => {
    if (!isDemoMode || !isRunning || isFinished) {
      return;
    }

    const feedbackMessages = [
      "Your posture is very stable. Excellent focus.",
      "Slight movement detected. Try to find complete stillness.",
      "Breathing rhythm looks exceptionally steady.",
      "A minor adjustment in posture was noted. Resettling.",
      "The stillness in your upper body is indicative of a calm state.",
      "Your breath appears deep and regular.",
      "Micro-movements have decreased, showing deeper relaxation.",
    ];

    let timeoutId: NodeJS.Timeout;

    const showRandomFeedback = () => {
      if (!isRunning || isFinished) {
         clearTimeout(timeoutId);
         return;
      }
      
      if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
        timeoutId = setTimeout(showRandomFeedback, 3000);
        return;
      }

      const message = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
      
      speak(message, { pitch: 0.8, rate: 0.85, volume: 0.8 });
      
      toast.info("Biometric Feedback (Demo)", {
        description: message,
        duration: 5000,
      });

      const nextInterval = (Math.random() * 30 + 30) * 1000;
      timeoutId = setTimeout(showRandomFeedback, nextInterval);
    };
    
    const initialDelay = (Math.random() * 15 + 15) * 1000;
    timeoutId = setTimeout(showRandomFeedback, initialDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isDemoMode, isRunning, isFinished, speak]);
};
