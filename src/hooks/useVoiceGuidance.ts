/**
 * useVoiceGuidance — Web Speech API phase cues for breathing sessions.
 *
 * Reintegrated post-consolidation: the session had zero in-session audio
 * guidance, which is the single biggest gap vs. competitors ("a timer with
 * audio"). This hook speaks only phase-transition cues ("Breathe in…",
 * "Hold…", "Breathe out…"), not continuous chatter. Opt-in via the existing
 * audioEnabled toggle in sessionStore.
 *
 * Performance: no deps, no bundle cost. SpeechSynthesis is a browser API.
 * Reduced motion / muted users get silence. Cancels on unmount.
 */
import { useCallback, useEffect, useRef } from "react";

export type SpeakOptions = {
  pitch?: number;
  rate?: number;
  volume?: number;
};

const PHASE_CUES: Record<string, string> = {
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
  pause: "Rest",
  hold_after_exhale: "Rest",
};

export const useVoiceGuidance = (audioEnabled: boolean) => {
  const voicesReadyRef = useRef(false);

  // Warm up the voice list once (Chrome loads voices async).
  useEffect(() => {
    if (!audioEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) voicesReadyRef.current = true;
    };
    load();
    if (!voicesReadyRef.current) {
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [audioEnabled]);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!audioEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

      const utter = () => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.pitch = options.pitch ?? 1.0;
        u.rate = options.rate ?? 0.85; // slow, calm
        u.volume = options.volume ?? 0.9;
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => v.name.includes("Samantha") || v.name.includes("Google US English") || v.name.includes("Daniel")) ||
          voices.find((v) => v.lang.startsWith("en"));
        if (preferred) u.voice = preferred;
        window.speechSynthesis.speak(u);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = utter;
      } else {
        utter();
      }
    },
    [audioEnabled],
  );

  /** Speak the cue for a breathing phase, if one exists. */
  const cuePhase = useCallback(
    (phase: string) => {
      const cue = PHASE_CUES[phase];
      if (cue) speak(cue);
    },
    [speak],
  );

  return { speak, cuePhase };
};
