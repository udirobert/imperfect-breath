/**
 * useAdaptiveEncouragement — contextual, performance-adaptive in-session coaching.
 *
 * Reintegrated post-consolidation: the session had zero in-session coaching
 * interactivity. This hook adjusts encouragement *timing* by stillness (45s for
 * high performers, 20s for struggling users, 25s floor in early session) and
 * *tone* (celebration / steady / needs-support), with haptic feedback on
 * celebrations. Reads from sessionStore metrics + vision metrics which survive.
 *
 * The caller receives `encouragement` and renders it as a single subtle text fade
 * on the orb overlay — not toasts (those were correctly killed). Haptics fire
 * only on celebration (stillness > 75).
 *
 * Performance: ~130 lines, no deps, reads existing store state.
 */
import { useState, useCallback, useEffect, useRef } from "react";

interface VisionMetrics {
  stillness?: number;
  presence?: number;
  posture?: number;
}

interface UseAdaptiveEncouragementOptions {
  enabled?: boolean;
  sessionMetrics?: {
    cycleCount?: number;
    currentPhase?: string;
    duration?: number;
  maxCycles?: number;
  phaseProgress?: number;
  currentPhaseName?: string;
  startTime?: Date;
    cameraUsed?: boolean;
    sessionType?: string;
    patternId?: string;
    completionRate?: number;
    userEngagement?: number;
    effectivenessScore?: number;
  } | null;
  visionMetrics?: VisionMetrics | null;
  currentPhase: string;
  isSessionActive: boolean;
}

export interface EncouragementResult {
  message: string;
  type: "celebration" | "encouragement";
  haptic: boolean;
}

const ENCOURAGEMENTS = {
  highPerformer: [
    "Beautiful focus. You're mastering this.",
    "Excellent stillness. Your practice is deepening.",
    "Outstanding. You're in complete control.",
  ],
  steady: [
    "Great work. Keep that steady rhythm.",
    "Well done. You're building a real habit.",
    "Nice consistency. Keep going.",
  ],
  needsSupport: [
    "You're doing great. One breath at a time.",
    "Every breath counts. You're making progress.",
    "Stay with it. You're stronger than you think.",
  ],
};

export const useAdaptiveEncouragement = ({
  enabled = true,
  sessionMetrics,
  visionMetrics,
  currentPhase,
  isSessionActive,
}: UseAdaptiveEncouragementOptions) => {
  const [lastEncouragementTime, setLastEncouragementTime] = useState(0);
  const [encouragementStreak, setEncouragementStreak] = useState(0);
  const [currentEncouragement, setCurrentEncouragement] =
    useState<EncouragementResult | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const getAdaptiveEncouragement = useCallback((): EncouragementResult | null => {
    if (!enabled) return null;

    const now = Date.now();
    const timeSinceLast = now - lastEncouragementTime;
    const maxCycles = sessionMetrics?.maxCycles || 10;
    const sessionProgress = sessionMetrics?.cycleCount
      ? (sessionMetrics.cycleCount / maxCycles) * 100
      : 0;
    const stillnessScore = visionMetrics?.stillness || 0;

    // Adaptive timing based on performance
    let interval = 30000; // 30s default
    if (stillnessScore > 80) interval = 45000; // less frequent for high performers
    else if (stillnessScore < 50) interval = 20000; // more frequent for struggling
    if (sessionProgress < 25) interval = Math.min(interval, 25000); // early-session floor

    if (timeSinceLast < interval) return null;

    let messageSet = ENCOURAGEMENTS.steady;
    if (stillnessScore > 75) messageSet = ENCOURAGEMENTS.highPerformer;
    else if (stillnessScore < 60) messageSet = ENCOURAGEMENTS.needsSupport;

    const message = messageSet[Math.floor(Math.random() * messageSet.length)];
    setLastEncouragementTime(now);
    setEncouragementStreak((prev) => prev + 1);

    return {
      message,
      type: stillnessScore > 75 ? "celebration" : "encouragement",
      haptic: stillnessScore > 75,
    };
  }, [enabled, lastEncouragementTime, sessionMetrics, visionMetrics]);

  useEffect(() => {
    if (currentPhase === "active" && isSessionActive) {
      const enc = getAdaptiveEncouragement();
      if (enc) {
        if (enc.haptic && "vibrate" in navigator) navigator.vibrate([100, 50, 100]);
        setCurrentEncouragement(enc);
        // Auto-clear after 4s — the message fades, the session continues.
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = setTimeout(() => setCurrentEncouragement(null), 4000);
      }
    }
  }, [currentPhase, isSessionActive, sessionMetrics, visionMetrics, getAdaptiveEncouragement]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  return {
    encouragementStreak,
    getAdaptiveEncouragement,
    currentEncouragement,
  };
};
