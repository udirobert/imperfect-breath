/**
 * Breathing Phase Configuration
 * 
 * Centralized configuration for breathing phase styling and behavior.
 * Maintains DRY principles by providing a single source of truth for phase properties.
 */

export interface PhaseConfig {
  instruction: string;
  color: string;
  size: string;
  gradientFrom: string;
  gradientTo: string;
  rhythmGradient: string;
  glowColor: string;
  shouldPulse: boolean;
  shouldScale: string;
  shouldAnimate: string;
}

export const BREATHING_PHASE_CONFIG: Record<string, PhaseConfig> = {
  inhale: {
    instruction: "Breathe In",
    color: "text-slate-600",
    size: "100%",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50",
    rhythmGradient: "from-blue-300 to-blue-400",
    glowColor: "#3b82f6",
    shouldPulse: false,
    shouldScale: "",
    shouldAnimate: ""
  },
  hold: {
    instruction: "Hold",
    color: "text-slate-600",
    size: "100%",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50",
    rhythmGradient: "from-blue-300 to-blue-400",
    glowColor: "#3b82f6",
    shouldPulse: false,
    shouldScale: "",
    shouldAnimate: ""
  },
  exhale: {
    instruction: "Breathe Out",
    color: "text-slate-600",
    size: "60%",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50",
    rhythmGradient: "from-blue-300 to-blue-400",
    glowColor: "#3b82f6",
    shouldPulse: false,
    shouldScale: "",
    shouldAnimate: ""
  },
  hold_after_exhale: {
    instruction: "Hold",
    color: "text-slate-600",
    size: "60%",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50",
    rhythmGradient: "from-blue-300 to-blue-400",
    glowColor: "#3b82f6",
    shouldPulse: false,
    shouldScale: "",
    shouldAnimate: ""
  },
  prepare: {
    instruction: "Get Ready",
    color: "text-blue-400",
    size: "80%",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50",
    rhythmGradient: "from-blue-300 to-blue-400",
    glowColor: "#3b82f6",
    shouldPulse: false,
    shouldScale: "",
    shouldAnimate: ""
  },
  countdown: {
    instruction: "Prepare",
    color: "text-blue-400",
    size: "80%",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50",
    rhythmGradient: "from-blue-300 to-blue-400",
    glowColor: "#3b82f6",
    shouldPulse: false,
    shouldScale: "",
    shouldAnimate: ""
  }
} as const;

/**
 * Get phase configuration by phase name
 */
export const getPhaseConfig = (phase: string): PhaseConfig => {
  return BREATHING_PHASE_CONFIG[phase] || BREATHING_PHASE_CONFIG.prepare;
};

/**
 * Check if phase should show expanded rhythm indicator
 */
export const isExpandedPhase = (phase: string): boolean => 
  phase === "inhale" || phase === "hold" || phase === "hold_after_exhale";

/**
 * Check if rhythm indicator should be shown
 */
export const shouldShowRhythmIndicator = (isActive: boolean, pattern: any, phase: string): boolean =>
  isActive && pattern && phase !== "countdown";