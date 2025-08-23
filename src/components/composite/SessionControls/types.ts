/**
 * SessionControls Types
 * Unified types for all session control variants
 */

export type SessionControlVariant = "full" | "minimal" | "mobile" | "floating";
export type SessionState = "idle" | "preparing" | "active" | "paused" | "complete";
export type SessionMode = "basic" | "enhanced" | "guided";

export interface SessionMetrics {
  currentPhase: string;
  cycleCount: number;
  duration: number;
  progress: number; // 0-100
  breathingRate?: number;
  stillnessScore?: number;
}

export interface SessionPattern {
  name: string;
  phases: {
    inhale: number;
    hold: number;
    exhale: number;
    pause: number;
  };
  difficulty: string;
  totalCycles?: number;
}

export interface SessionControlsConfig {
  variant: SessionControlVariant;
  showProgress: boolean;
  showMetrics: boolean;
  showPattern: boolean;
  showTimer: boolean;
  showPhaseIndicator: boolean;
  allowPause: boolean;
  allowStop: boolean;
  allowAdjustments: boolean;
  compactMode: boolean;
  floatingPosition?: "top-right" | "bottom-right" | "bottom-center";
}

export interface SessionControlsProps {
  variant?: SessionControlVariant;
  customConfig?: Partial<SessionControlsConfig>;
  className?: string;
  
  // Session state
  sessionState: SessionState;
  sessionMode?: SessionMode;
  pattern?: SessionPattern;
  metrics?: SessionMetrics;
  isLoading?: boolean;
  
  // Control handlers
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSpeedChange?: (speed: number) => void;
  
  // Settings
  volume?: number;
  speed?: number;
  enableAudio?: boolean;
  enableVibration?: boolean;
  
  // Display options
  showAdvancedControls?: boolean;
  disabled?: boolean;
}