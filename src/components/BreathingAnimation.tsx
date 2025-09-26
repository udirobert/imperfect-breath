import React, { useMemo } from "react";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import {
  getPhaseConfig,
  isExpandedPhase,
  shouldShowRhythmIndicator,
} from "../lib/breathing-phase-config";

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
  cycleCount?: number;
  emotionalState?: "calm" | "focused" | "energized" | "peaceful";
  sessionQuality?: number;
  
  // INTEGRATED: Session progress information
  sessionInfo?: {
    duration?: string;
    progressPercentage?: number;
    stillnessScore?: number;
    presenceScore?: number;
    confidenceScore?: number;
    showMetrics?: boolean;
  };
}

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

    const circleSize = useMemo(() => {
      const baseSize =
        !isActive || phase === "countdown" ? "80%" : phaseConfig.size;
      // In compact mode, reduce size by 20%
      if (compactMode) {
        const sizeValue = parseInt(baseSize);
        return `${Math.round(sizeValue * 0.8)}%`;
      }
      return baseSize;
    }, [isActive, phase, phaseConfig.size, compactMode]);

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

    const BackgroundCircle = () => (
      <div
        className={cn(
          "absolute rounded-full transition-all duration-1000 ease-in-out",
          // Enhanced glow effect based on phase
          phase === "inhale"
            ? "bg-blue-100/40"
            : phase === "hold"
            ? "bg-blue-100/30"
            : phase === "exhale"
            ? "bg-blue-50/30"
            : "bg-blue-50/30",
          // Add blur for glow effect when active
          isActive && "blur-sm"
        )}
        style={{
          width: `${Math.min(120, parseInt(circleSize) + 20)}%`,
          height: `${Math.min(120, parseInt(circleSize) + 20)}%`,
        }}
      />
    );

    const MainCircle = () => (
      <div
        className={cn(
          "absolute rounded-full bg-blue-50/20 border border-blue-200/40",
          // Phase-specific transitions for more natural breathing feel
          phase === "inhale"
            ? "transition-all duration-[4000ms] ease-out"
            : phase === "exhale"
            ? "transition-all duration-[4000ms] ease-in"
            : phase === "hold" || phase === "hold_after_exhale"
            ? "transition-all duration-500 ease-in-out"
            : "transition-all duration-1000 ease-in-out",
          // ENHANCED: Emotional shadow adaptation
          isActive && `shadow-lg ${currentColors.shadow}`
        )}
        style={{
          width: circleSize,
          height: circleSize,
        }}
      />
    );

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

    // INTEGRATED: Session header component
    const SessionHeader = () => {
      if (!sessionInfo || !isActive) return null;
      
      return (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-full max-w-md">
          <div className="bg-gradient-to-r from-slate-50/90 to-slate-100/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {pattern?.name || "Breathing"}
              </span>
              <span className="font-mono font-bold text-primary">
                {sessionInfo.duration || "00:00"}
              </span>
            </div>
          </div>
        </div>
      );
    };
    
    // INTEGRATED: Session footer component
    const SessionFooter = () => {
      if (!sessionInfo || !isActive) return null;
      
      return (
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md">
          <div className="bg-gradient-to-r from-slate-50/90 to-slate-100/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="space-y-2">
              {/* Primary metrics line */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Cycle {cycleCount}
                </span>
                {sessionInfo.showMetrics && sessionInfo.stillnessScore !== undefined && (
                  <span className={cn(
                    "font-medium",
                    sessionInfo.stillnessScore >= 80 ? "text-green-600 dark:text-green-400" :
                    sessionInfo.stillnessScore >= 60 ? "text-blue-600 dark:text-blue-400" :
                    sessionInfo.stillnessScore >= 40 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-orange-600 dark:text-orange-400"
                  )}>
                    Stillness {sessionInfo.stillnessScore}%
                  </span>
                )}
                <span className="text-slate-600 dark:text-slate-400">
                  {Math.round(sessionInfo.progressPercentage || 0)}% complete
                </span>
              </div>
              
              {/* Secondary metrics line - only when stable */}
              {sessionInfo.showMetrics && sessionInfo.presenceScore !== undefined && sessionInfo.confidenceScore !== undefined && (
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>Presence {sessionInfo.presenceScore}%</span>
                  <span>•</span>
                  <span>Confidence {sessionInfo.confidenceScore}%</span>
                </div>
              )}
            </div>
          </div>
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
          // Add extra space for header/footer when session info is present
          sessionInfo && isActive && "mt-20 mb-24"
        )}
      >
        {/* INTEGRATED: Session header */}
        <SessionHeader />
        
        <BackgroundCircle />
        <MainCircle />
        <CenterContent />
        
        {/* INTEGRATED: Session footer */}
        <SessionFooter />

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
