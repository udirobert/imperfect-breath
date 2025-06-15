
import { useCallback } from 'react';

export type SpeakOptions = {
  pitch?: number;
  rate?: number;
  volume?: number;
};

export const useVoiceGuidance = (audioEnabled: boolean) => {
  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const getVoicesAndSpeak = () => {
      // Cancel any ongoing speech to prioritize the new message
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Default soothing voice settings
      utterance.pitch = options.pitch ?? 1.0;
      utterance.rate = options.rate ?? 0.9; // A bit slower for a calming effect
      utterance.volume = options.volume ?? 1.0;

      const voices = window.speechSynthesis.getVoices();
      // A simple preference for a standard, often calming voice. This can be refined.
      const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Daniel')) || voices.find(v => v.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    };
    
    // Ensure voices are loaded before speaking, which can be an issue on some browsers.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = getVoicesAndSpeak;
    } else {
      getVoicesAndSpeak();
    }

  }, [audioEnabled]);

  return { speak };
};
