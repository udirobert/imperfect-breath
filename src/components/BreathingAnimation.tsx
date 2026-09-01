import React, { useMemo } from "react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import {
  getPhaseConfig,
  isExpandedPhase,
  shouldShowRhythmIndicator,
} from "../lib/breathing-phase-config";
import { getQualityColor } from "../utils/quality";

/**
 * Breath signal from the vision pipeline — drives the orb's *quality*
 * (glow, stability, color) while the timer drives its *rhythm* (scale).
 *
 * When hasValidData is false or faceDetected is false, the orb falls back
 * to a mechanical timer-only mode — visually dimmer, no verification ring.
 * This is the honest "unverified" state.
 */
export interface BreathSignal {
  stillness: number;      // 0-100 (100 = perfectly still)
  confidence: number;     // 0-100 (face detection confidence)
  faceDetected: boolean;
  hasValidData: boolean;
}

interface BreathingAnimationProps {
  phase:
    | "inhale"
    | "hold"
    | "exhale"
    | "hold_after_exhale"
    | "prepare"
    | "countdown";
  text?: string;
  pattern?: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      hold_after_exhale?: number;
    };
  };
  isActive?: boolean;
  countdownValue?: number;
  phaseProgress?: number;
  showTimer?: boolean;
  compactMode?: boolean;
  overlayMetrics?: {
    stillness?: number;
    confidence?: number;
  };
  /** Live breath signal from the vision pipeline — makes the orb reactive */
  breathSignal?: BreathSignal;
  cycleCount?: number;
  emotionalState?: "calm" | "focused" | "energized" | "peaceful";
  sessionQuality?: number;
  
  // ENHANCEMENT FIRST: Session progress information (cleaned up - no duplicate metrics)
  sessionInfo?: {
    duration?: string;
    progressPercentage?: number;
  };
}

// ============================================================================
// MIST ORB — the breath-reactive visual core
// ============================================================================
//
// Three layered radial-gradient divs with progressive blur create a
// volumetric mist cloud. The timer drives the scale (inhale grows, exhale
// shrinks). The breath signal drives:
//   - glow intensity (face detection confidence)
//   - opacity (verified = vivid, unverified = dim)
//   - shiver (restlessness during hold phases)
//   - color (blue when calm, amber when restless during hold)
//   - verification ring (pulses when face detected, absent when not)
//
// When no breath signal is available (no camera / classic mode), the orb
// runs in "mechanical" mode — timer-driven only, dimmer, no ring. This is
// the visual distinction between verified and unverified practice.

interface MistOrbProps {
  phase: BreathingAnimationProps["phase"];
  phaseProgress: number;
  isActive: boolean;
  compactMode: boolean;
  breathSignal?: BreathSignal;
}

const MistOrb: React.FC<MistOrbProps> = React.memo(({
  phase,
  phaseProgress,
  isActive,
  compactMode,
  breathSignal,
}) => {
  // --- Breath signal interpretation ---
  const hasData = breathSignal?.hasValidData && breathSignal?.faceDetected;
  const stillness = hasData ? breathSignal!.stillness : 50;
  const confidence = hasData ? breathSignal!.confidence : 0;
  const restlessness = 100 - stillness;

  const isHoldPhase = phase === "hold" || phase === "hold_after_exhale";
  // Shiver only during hold when restless — movement is expected during inhale/exhale
  const shiverPx = hasData && isHoldPhase && isActive
    ? Math.min(restlessness / 100, 1) * 3.5
    : 0;

  // Glow: confidence drives how vivid the orb is
  const glowFactor = hasData ? Math.min(confidence / 100, 1) : 0;
  // Opacity: verified = 0.7-1.0, unverified = 0.35 (visually distinct)
  const orbOpacity = hasData ? 0.65 + glowFactor * 0.35 : 0.35;

  // --- Continuous scale from phase + progress ---
  // Smooth grow/shrink that tracks the timer precisely, not hardcoded jumps
  const scale = useMemo(() => {
    if (!isActive) return 0.88;
    const p = Math.min(phaseProgress / 100, 1);
    switch (phase) {
      case "inhale":              return 0.82 + p * 0.42;   // 0.82 → 1.24
      case "hold":                return 1.24;
      case "exhale":              return 1.24 - p * 0.42;   // 1.24 → 0.82
      case "hold_after_exhale":   return 0.82;
      case "prepare":
      case "countdown":           return 1.0;
      default:                    return 1.0;
    }
  }, [phase, phaseProgress, isActive]);

  // --- Color: interpolate blue → amber based on restlessness during hold ---
  const orbColor = useMemo(() => {
    if (!hasData) return { r: 147, g: 197, b: 253 }; // blue-300, dim
    if (isHoldPhase && restlessness > 20) {
      const t = Math.min((restlessness - 20) / 60, 1); // ramp from 20-80
      // blue-300 (147,197,253) → amber-400 (251,191,36)
      return {
        r: Math.round(147 + t * (251 - 147)),
        g: Math.round(197 + t * (191 - 197)),
        b: Math.round(253 + t * (36 - 253)),
      };
    }
    return { r: 147, g: 197, b: 253 }; // blue-300
  }, [hasData, isHoldPhase, restlessness]);

  const rgba = (a: number) => `rgba(${orbColor.r}, ${orbColor.g}, ${orbColor.b}, ${a})`;

  // Sizes — smaller on mobile for performance
  const haloSize = compactMode ? 170 : 230;
  const cloudSize = compactMode ? 130 : 175;
  const coreSize  = compactMode ? 75  : 100;

  // Box shadow glow — scales with confidence
  const coreGlow = hasData
    ? `0 0 ${15 + glowFactor * 45}px ${rgba(0.25 + glowFactor * 0.15)}`
    : `0 0 8px ${rgba(0.08)}`;

  const showVerificationRing = hasData && isActive;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Shiver wrapper — translates the whole orb by small random offsets.
          Only animates when restlessness during hold exceeds threshold. */}
      <motion.div
        animate={
          shiverPx > 0.5
            ? {
                x: [0, shiverPx, -shiverPx, shiverPx * 0.5, 0],
                y: [0, -shiverPx, shiverPx * 0.7, -shiverPx * 0.3, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={{
          duration: 0.12,
          repeat: Infinity,
          ease: "linear",
        }}
        className="relative flex items-center justify-center"
      >
        {/* Verification ring — subtle pulsing border when face is detected.
            Absent in unverified mode — this is the "camera is watching" signal. */}
        {showVerificationRing && (
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: compactMode ? 150 : 200,
              height: compactMode ? 150 : 200,
              borderColor: rgba(0.25),
            }}
            animate={{
              scale: [1, 1.06, 1],
              opacity: [0.3, 0.55, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Scale wrapper — all mist layers scale together */}
        <motion.div
          animate={{ scale }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          className="relative flex items-center justify-center"
        >
          {/* Outer halo — large, very blurred, low opacity */}
          <div
            className="absolute rounded-full"
            style={{
              width: haloSize,
              height: haloSize,
              background: `radial-gradient(circle, ${rgba(0.12 * orbOpacity)} 0%, transparent 70%)`,
              filter: `blur(${compactMode ? 22 : 30}px)`,
            }}
          />

          {/* Mid cloud — medium blur, the main body */}
          <div
            className="absolute rounded-full"
            style={{
              width: cloudSize,
              height: cloudSize,
              background: `radial-gradient(circle, ${rgba(0.28 * orbOpacity)} 0%, ${rgba(0.08 * orbOpacity)} 55%, transparent 82%)`,
              filter: `blur(${compactMode ? 12 : 16}px)`,
            }}
          />

          {/* Inner core — sharpest, brightest, carries the glow */}
          <div
            className="absolute rounded-full"
            style={{
              width: coreSize,
              height: coreSize,
              background: `radial-gradient(circle, ${rgba(0.45 * orbOpacity)} 0%, ${rgba(0.18 * orbOpacity)} 60%, transparent 92%)`,
              filter: `blur(${compactMode ? 6 : 8}px)`,
              boxShadow: coreGlow,
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
});
MistOrb.displayName = "MistOrb";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BreathingAnimation = React.memo<BreathingAnimationProps>(
  ({
    phase,
    text,
    pattern,
    isActive = false,
    countdownValue,
    phaseProgress = 0,
    showTimer = false,
    compactMode = false,
    overlayMetrics,
    breathSignal,
    cycleCount = 0,
    emotionalState = "calm",
    sessionQuality = 75,
    sessionInfo,
  }) => {
    const phaseConfig = useMemo(() => getPhaseConfig(phase), [phase]);
    
    // ENHANCEMENT: Emotional color adaptation (DRY principle)
    const emotionalColors = useMemo(() => ({
      calm: { primary: "from-blue-400 to-blue-600", shadow: "shadow-blue-200/50" },
      focused: { primary: "from-purple-400 to-purple-600", shadow: "shadow-purple-200/50" },
      energized: { primary: "from-orange-400 to-red-500", shadow: "shadow-orange-200/50" },
      peaceful: { primary: "from-green-400 to-emerald-500", shadow: "shadow-green-200/50" }
    }), []);
    
    const currentColors = emotionalColors[emotionalState];

    const instruction = useMemo(() => {
      if (phase === "countdown" && countdownValue !== undefined) {
        return countdownValue > 0 ? countdownValue.toString() : "Begin";
      }
      if (text && text !== "prepare" && text !== phase) {
        return text;
      }

      // Add variety to instructions based on progress
      const variations: Record<string, string[]> = {
        inhale: ["Breathe In", "Inhale Deeply", "Fill Your Lungs"],
        exhale: ["Breathe Out", "Exhale Slowly", "Release"],
        hold: ["Hold", "Be Still", "Pause"],
        hold_after_exhale: ["Rest", "Relax", "Be Present"],
      };

      if (isActive && phase in variations && phaseProgress !== undefined) {
        const options = variations[phase];
        // Cycle through variations based on phase progress
        const index =
          Math.floor(phaseProgress / (100 / options.length)) % options.length;
        return options[index];
      }

      return phaseConfig.instruction;
    }, [
      phase,
      text,
      countdownValue,
      phaseConfig.instruction,
      isActive,
      phaseProgress,
    ]);

    // Calculate remaining time for timer display
    const remainingTime = useMemo(() => {
      if (
        !showTimer ||
        !pattern ||
        phase === "countdown" ||
        phase === "prepare"
      ) {
        return null;
      }
      const phaseDuration =
        pattern.phases[phase as keyof typeof pattern.phases] || 0;
      const remaining = Math.ceil(phaseDuration * (1 - phaseProgress / 100));
      return remaining > 0 ? remaining : 0;
    }, [showTimer, pattern, phase, phaseProgress]);

    const RhythmIndicator = () => (
      <div className="w-40 h-2 bg-blue-100/40 rounded-full mx-auto">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-100 ease-linear bg-gradient-to-r",
            phaseConfig.rhythmGradient
          )}
          style={{
            width: `${Math.max(5, phaseProgress)}%`,
          }}
        />
      </div>
    );

    // MINIMAL OVERLAY: Duration + cycle in a corner — no floating bars.
    // The orb owns the screen. Affirmations show transiently at phase
    // transitions, not as a permanent footer.
    const SessionOverlay = () => {
      if (!sessionInfo || !isActive) return null;

      return (
        <div className="absolute -top-2 -right-2 flex flex-col items-end gap-0.5 text-[10px] font-mono text-slate-400/70 dark:text-slate-500/70 pointer-events-none select-none">
          <span>{sessionInfo.duration || "00:00"}</span>
          {cycleCount > 0 && <span>cycle {cycleCount}</span>}
        </div>
      );
    };

    const CenterContent = () => (
      <div className="z-10 text-center space-y-3">
        <p
          className={cn(
            compactMode ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl",
            "font-light transition-all duration-500",
            phaseConfig.color
          )}
        >
          {instruction}
        </p>

        {/* Timer display for enhanced mode */}
        {showTimer && remainingTime !== null && (
          <p className="text-2xl md:text-3xl font-mono text-slate-500">
            {remainingTime}
          </p>
        )}

        {shouldShowRhythmIndicator(isActive, pattern, phase) && !showTimer && (
          <RhythmIndicator />
        )}

        {/* Only show pattern name when not active and no session info */}
        {!isActive && pattern && phase !== "countdown" && !sessionInfo && (
          <p className="text-sm text-muted-foreground opacity-80 font-medium">
            {pattern.name}
          </p>
        )}
      </div>
    );

    return (
      <div
        className={cn(
          "relative flex items-center justify-center",
          compactMode
            ? "w-48 h-48 md:w-56 md:h-56"
            : "w-64 h-64 md:w-80 md:h-80",
        )}
      >
        {/* MINIMAL OVERLAY: duration + cycle, top-right corner */}
        <SessionOverlay />

        {/* MIST ORB — breath-reactive visual core */}
        <MistOrb
          phase={phase}
          phaseProgress={phaseProgress}
          isActive={isActive}
          compactMode={compactMode}
          breathSignal={breathSignal}
        />

        <CenterContent />

        {/* ENHANCED: Micro-celebration with haptic feedback */}
        {isActive &&
          cycleCount > 0 &&
          cycleCount % 5 === 0 &&
          phase === "inhale" &&
          phaseProgress < 10 && (
            <Badge
              className={cn(
                "absolute -top-12 left-1/2 -translate-x-1/2",
                "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200",
                "animate-bounce shadow-lg cursor-pointer",
                "transition-all duration-1000 hover:scale-105"
              )}
              variant="secondary"
              onClick={() => {
                // PERFORMANT: Haptic feedback for mobile
                if ('vibrate' in navigator) {
                  navigator.vibrate([50, 100, 50]);
                }
              }}
            >
              {cycleCount} breaths! *
            </Badge>
          )}
        
        {/* ENHANCEMENT: Quality-based particles (MODULAR) */}
        {isActive && sessionQuality > 80 && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: Math.floor(sessionQuality / 20) }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-60"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 200}ms`,
                  animationDuration: "2s"
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

BreathingAnimation.displayName = "BreathingAnimation";

export default BreathingAnimation;
