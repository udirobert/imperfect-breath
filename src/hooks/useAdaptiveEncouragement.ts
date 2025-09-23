/**
 * Adaptive Encouragement Hook
 *
 * Provides contextual, adaptive encouragement based on user performance
 * Extracted from MeditationSession for better organization and reusability
 */

import { useState, useCallback, useEffect } from "react";
import { SessionMetrics } from "../types/session";

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
    } | null;
    visionMetrics?: VisionMetrics | null;
    currentPhase: string;
    isSessionActive: boolean;
}

export const useAdaptiveEncouragement = ({
    enabled = true,
    sessionMetrics,
    visionMetrics,
    currentPhase,
    isSessionActive,
}: UseAdaptiveEncouragementOptions) => {
    const [lastEncouragementTime, setLastEncouragementTime] = useState(0);
    const [encouragementStreak, setEncouragementStreak] = useState(0);

    const getAdaptiveEncouragement = useCallback(() => {
        if (!enabled) return null;

        const now = Date.now();
        const timeSinceLastEncouragement = now - lastEncouragementTime;
        const sessionProgress = sessionMetrics?.cycleCount
            ? (sessionMetrics.cycleCount / 10) * 100
            : 0; // Assume 10 cycles target
        const stillnessScore = visionMetrics?.stillness || 0;

        // Adaptive timing based on performance
        let encouragementInterval = 30000; // 30 seconds default

        if (stillnessScore > 80) {
            encouragementInterval = 45000; // Less frequent for high performers
        } else if (stillnessScore < 50) {
            encouragementInterval = 20000; // More frequent for struggling users
        }

        // Early session encouragement
        if (sessionProgress < 25) {
            encouragementInterval = Math.min(encouragementInterval, 25000);
        }

        if (timeSinceLastEncouragement < encouragementInterval) {
            return null;
        }

        // Generate contextual encouragement
        const encouragements = {
            highPerformer: [
                "Beautiful focus! You're mastering this pattern.",
                "Excellent stillness. Your practice is deepening.",
                "Outstanding! You're in complete control.",
            ],
            steady: [
                "Great work! Keep that steady rhythm.",
                "Well done! You're building excellent habits.",
                "Nice consistency! You're doing wonderfully.",
            ],
            needsSupport: [
                "You're doing great! Take it one breath at a time.",
                "Every breath counts. You're making progress!",
                "Stay with it! You're stronger than you think.",
            ],
        };

        let messageSet = encouragements.steady;
        if (stillnessScore > 75) {
            messageSet = encouragements.highPerformer;
        } else if (stillnessScore < 60) {
            messageSet = encouragements.needsSupport;
        }

        const message = messageSet[Math.floor(Math.random() * messageSet.length)];

        setLastEncouragementTime(now);
        setEncouragementStreak((prev) => prev + 1);

        return {
            message,
            type: stillnessScore > 75 ? "celebration" : "encouragement",
            haptic: stillnessScore > 75,
        };
    }, [enabled, lastEncouragementTime, sessionMetrics, visionMetrics]);

    // Apply encouragement during active session
    useEffect(() => {
        if (currentPhase === "active" && isSessionActive) {
            const encouragement = getAdaptiveEncouragement();
            if (encouragement) {
                // Trigger haptic feedback for celebrations
                if (encouragement.haptic && "vibrate" in navigator) {
                    navigator.vibrate([100, 50, 100]);
                }

                // Here you would integrate with your notification/toast system
                console.log("🌟 Adaptive encouragement:", encouragement);
            }
        }
    }, [
        currentPhase,
        isSessionActive,
        sessionMetrics,
        visionMetrics,
        getAdaptiveEncouragement,
    ]);

    return {
        encouragementStreak,
        getAdaptiveEncouragement,
    };
};