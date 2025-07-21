import { useState, useEffect, useRef, useCallback } from "react";
import {
  BREATHING_PATTERNS,
  BreathingPattern,
  BreathingPhaseName,
} from "../lib/breathingPatterns";
import { useVoiceGuidance } from "./useVoiceGuidance";
import { useBasicAuth, useLensAuth } from "../auth";
import { supabase } from "../integrations/supabase/client";

type SessionPhase =
  | BreathingPhaseName
  | "breath-hold"
  | "finished"
  | "idle"
  | "camera-setup"
  | "ready";

// Define the session data structure
// Aligned with the database schema
export interface BreathingSessionData {
  id?: string;
  user_id?: string;
  pattern_name: string;
  session_duration: number;
  created_at?: string;
  breath_hold_time?: number;
  restlessness_score?: number;
  // Additional metadata that doesn't match the DB schema directly
  lensId?: string | null;
  cycleCount?: number;
  visionMetrics?: Record<string, unknown>;
}

// Helper to transform BreathingPattern into an internal format with phases array
const transformPatternToPhasesFormat = (pattern: BreathingPattern) => {
  // Create a phases array from the individual properties
  const phases = [
    {
      name: "inhale" as const,
      duration: pattern.inhale * 1000, // Convert to milliseconds
      text: "Breathe in",
    },
    // Only add hold phase if > 0
    ...(pattern.hold > 0
      ? [
          {
            name: "hold" as const,
            duration: pattern.hold * 1000,
            text: "Hold",
          },
        ]
      : []),
    {
      name: "exhale" as const,
      duration: pattern.exhale * 1000,
      text: "Breathe out",
    },
    // Only add rest phase if > 0
    ...(pattern.rest > 0
      ? [
          {
            name: "rest" as const,
            duration: pattern.rest * 1000,
            text: "Rest",
          },
        ]
      : []),
  ];

  return {
    ...pattern,
    phases,
    cycles: 30, // Default to 30 cycles
    hasBreathHold: true, // Default to true
  };
};

export const useBreathingSession = (
  initialPattern?: BreathingPattern,
  includeAuth = true,
) => {
  // Auth integration - hooks must be called unconditionally
  const { user, isAuthenticated } = useBasicAuth();
  const lensAuth = useLensAuth();

  // Use the auth data conditionally instead
  const effectiveUser = includeAuth ? user : null;
  const effectiveAuth = includeAuth ? isAuthenticated : false;
  const effectiveLensContext = includeAuth
    ? { currentAccount: lensAuth.lensProfile, isAuthenticated: lensAuth.hasLensProfile }
    : { currentAccount: null, isAuthenticated: false };

  // Transform the pattern to include phases
  const [pattern, setPatternState] = useState(
    transformPatternToPhasesFormat(initialPattern || BREATHING_PATTERNS.box),
  );
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("idle");
  const [phaseText, setPhaseText] = useState("Begin your session when ready.");
  const [isRunning, setIsRunning] = useState(false);

  const [cycleCount, setCycleCount] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(0);
  const [breathHoldTime, setBreathHoldTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [savedSessions, setSavedSessions] = useState<BreathingSessionData[]>(
    [],
  );
  const [lastSessionData, setLastSessionData] =
    useState<BreathingSessionData | null>(null);

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

  // Fetch saved sessions for the authenticated user
  useEffect(() => {
    const fetchSavedSessions = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setSavedSessions(data as BreathingSessionData[]);
        }
      } catch (error) {
        console.error("Error fetching breathing sessions:", error);
      }
    };

    if (isAuthenticated) fetchSavedSessions();
  }, [isAuthenticated, user?.id]);

  const startSession = () => {
    cleanupTimers();
    currentPhaseIndexRef.current = 0;
    setCycleCount(0);
    setBreathHoldTime(0);
    // Defensive: ensure pattern and phases exist
    if (!pattern || !pattern.phases || pattern.phases.length === 0) {
      setSessionPhase("idle");
      setPhaseText("No valid pattern selected.");
      setIsRunning(false);
      return;
    }
    const firstPhase = pattern.phases[0];
    setSessionPhase(firstPhase.name as BreathingPhaseName);
    setIsRunning(true);
    setSessionStartTime(Date.now());
  };

  // Save session data to Supabase
  const saveSessionData = async (
    sessionData: Partial<BreathingSessionData>,
  ) => {
    if (!isAuthenticated || !user?.id) {
      // Store locally if not authenticated
      setLastSessionData(sessionData as BreathingSessionData);
      return null;
    }

    try {
      // Format data to match the database schema
      const sessionRecord = {
        user_id: user.id,
        pattern_name: sessionData.pattern_name || "custom",
        session_duration: sessionData.session_duration || 0,
        breath_hold_time: sessionData.breath_hold_time || 0,
        restlessness_score: sessionData.restlessness_score || 0,
      };

      const { data, error } = await supabase
        .from("sessions")
        .insert([sessionRecord])
        .select()
        .single();

      if (error) throw error;

      // Update local state with the session from the database
      setSavedSessions((prev) => [data as BreathingSessionData, ...prev]);
      setLastSessionData(data as BreathingSessionData);

      return data;
    } catch (error) {
      console.error("Error saving breathing session:", error);
      return null;
    }
  };

  // Share session to Lens Protocol
  const shareToLens = async (sessionData: Partial<BreathingSessionData>) => {
    if (!lensAuth.hasLensProfile || !lensAuth.lensProfile) {
      console.error("Cannot share: not connected to Lens");
      return null;
    }

    try {
      // First save the session if not already saved
      const savedSession = lastSessionData?.id
        ? lastSessionData
        : await saveSessionData(sessionData);

      if (!savedSession)
        throw new Error("Failed to save session before sharing");

      // Format content for sharing
      const content = `Just completed a ${pattern.name} breathing session for ${Math.floor(
        (sessionData.session_duration || 0) / 60,
      )} minutes with ${pattern.cycles} cycles.`;

      // TODO: Implement actual Lens Protocol sharing when API is ready
      alert(`Would share to Lens: ${content}`);

      // We don't have a shared field in the sessions table, so we'll just
      // track sharing status in the application state

      return true;
    } catch (error) {
      console.error("Error sharing to Lens:", error);
      return null;
    }
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

    // Calculate final session duration
    const duration = sessionStartTime
      ? Math.floor((Date.now() - sessionStartTime) / 1000)
      : 0;

    // Prepare session data to match the database schema
    const sessionData: Partial<BreathingSessionData> = {
      pattern_name: pattern.name,
      session_duration: duration,
      breath_hold_time: breathHoldTime,
      restlessness_score: 0, // Would typically come from vision metrics
      cycleCount, // Additional metadata not in DB schema
    };

    // Auto-save for authenticated users
    if (isAuthenticated && user?.id) {
      saveSessionData(sessionData);
    } else {
      setLastSessionData(sessionData as BreathingSessionData);
    }
  };

  const selectPattern = (newPattern: BreathingPattern) => {
    setPatternState(transformPatternToPhasesFormat(newPattern));
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
      savedSessions,
      lastSessionData,
      isAuthenticated,
      userId: user?.id,
      lensId: lensAuth.lensProfile?.id,
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
      saveSessionData,
      shareToLens,
    },
  };
};
