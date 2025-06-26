import { useState, useEffect, useRef, useCallback } from "react";
import {
  BREATHING_PATTERNS,
  BreathingPattern,
  BreathingPhaseName,
} from "@/lib/breathingPatterns";
import { useVoiceGuidance } from "./useVoiceGuidance";

type SessionPhase =
  | BreathingPhaseName
  | "breath-hold"
  | "finished"
  | "idle"
  | "camera-setup"
  | "ready";

export const useBreathingSession = (initialPattern?: BreathingPattern) => {
  const [pattern, setPattern] = useState<BreathingPattern>(
    initialPattern || BREATHING_PATTERNS.box,
  );
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("idle");
  const [phaseText, setPhaseText] = useState("Begin your session when ready.");
  const [isRunning, setIsRunning] = useState(false);

  const [cycleCount, setCycleCount] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(0);
  const [breathHoldTime, setBreathHoldTime] = useState(0);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const { speak } = useVoiceGuidance(audioEnabled);

  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathHoldIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPhaseIndexRef = useRef(0);

  // The old `speak` function is now replaced by the `useVoiceGuidance` hook.

  const cleanupTimers = () => {
    if (phaseIntervalRef.current) clearTimeout(phaseIntervalRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    if (breathHoldIntervalRef.current)
      clearInterval(breathHoldIntervalRef.current);
    phaseIntervalRef.current = null;
    countdownIntervalRef.current = null;
    breathHoldIntervalRef.current = null;
  };

  const startBreathHold = useCallback(() => {
    cleanupTimers();
    setSessionPhase("breath-hold");
    setPhaseText("Hold your breath");
    speak("Hold your breath. Relax.");
    setBreathHoldTime(0);
    breathHoldIntervalRef.current = setInterval(() => {
      setBreathHoldTime((prev) => prev + 1);
    }, 1000);
  }, [speak]);

  const advancePhase = useCallback(() => {
    const cycles = pattern.cycles ?? Infinity;
    if (cycleCount >= cycles) {
      if (pattern.hasBreathHold) {
        startBreathHold();
      } else {
        setSessionPhase("finished");
        setPhaseText("Session Complete");
        setIsRunning(false);
        cleanupTimers();
      }
      return;
    }

    const currentPhase = pattern.phases[currentPhaseIndexRef.current];
    setSessionPhase(currentPhase.name as BreathingPhaseName);
    setPhaseText(currentPhase.text);
    speak(currentPhase.text);
    setPhaseCountdown(currentPhase.duration / 1000);

    // Countdown timer for the phase
    let remaining = currentPhase.duration;
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1000;
      setPhaseCountdown(remaining / 1000);
      if (remaining <= 0) {
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current);
      }
    }, 1000);

    if (phaseIntervalRef.current) clearTimeout(phaseIntervalRef.current);
    phaseIntervalRef.current = setTimeout(() => {
      currentPhaseIndexRef.current =
        (currentPhaseIndexRef.current + 1) % pattern.phases.length;
      if (currentPhaseIndexRef.current === 0) {
        setCycleCount((prev) => prev + 1);
      }
      advancePhase();
    }, currentPhase.duration);
  }, [cycleCount, pattern, speak, startBreathHold]);

  useEffect(() => {
    if (
      isRunning &&
      sessionPhase !== "breath-hold" &&
      sessionPhase !== "idle" &&
      sessionPhase !== "finished"
    ) {
      advancePhase();
    } else {
      cleanupTimers();
      if (sessionPhase === "breath-hold") {
        startBreathHold();
      }
    }
    return cleanupTimers;
  }, [isRunning, sessionPhase, advancePhase, startBreathHold]);

  const startSession = () => {
    cleanupTimers();
    currentPhaseIndexRef.current = 0;
    setCycleCount(0);
    setBreathHoldTime(0);
    const firstPhase = pattern.phases[0];
    setSessionPhase(firstPhase.name as BreathingPhaseName);
    setIsRunning(true);
  };

  const setReady = () => {
    setSessionPhase("ready");
    setPhaseText("Ready to begin breathing session");
    speak("Camera is ready. You can start when ready.");
  };

  const prepareSession = () => {
    setSessionPhase("camera-setup");
    setPhaseText("Ready to begin when you are.");
    speak("Ready to begin your breathing session.");
  };

  const togglePause = () => {
    if (sessionPhase === "breath-hold") {
      endSession();
      return;
    }
    if (isRunning) {
      window.speechSynthesis.cancel();
    }
    setIsRunning(!isRunning);
  };

  const endSession = () => {
    setIsRunning(false);
    setSessionPhase("finished");
    setPhaseText("Session Complete");
    cleanupTimers();
    window.speechSynthesis.cancel();
  };

  const selectPattern = (newPattern: BreathingPattern) => {
    setPattern(newPattern);
    setSessionPhase("idle");
    setPhaseText("Begin your session when ready.");
    window.speechSynthesis.cancel();
  };

  const toggleAudio = () => setAudioEnabled((prev) => !prev);

  return {
    state: {
      pattern,
      sessionPhase,
      phaseText,
      isRunning,
      cycleCount,
      phaseCountdown,
      breathHoldTime,
      audioEnabled,
      isFinished: sessionPhase === "finished",
    },
    controls: {
      prepareSession,
      startSession,
      setReady,
      togglePause,
      endSession,
      selectPattern,
      toggleAudio,
      speak,
    },
  };
};
