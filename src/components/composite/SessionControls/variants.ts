/**
 * SessionControls Variant Configurations
 * Predefined configurations for different session control contexts
 */

import type { SessionControlsConfig } from "./types";

export const SESSION_CONTROL_CONFIGS: Record<string, SessionControlsConfig> = {
  full: {
    variant: "full",
    showProgress: true,
    showMetrics: true,
    showPattern: true,
    showTimer: true,
    showPhaseIndicator: true,
    allowPause: true,
    allowStop: true,
    allowAdjustments: true,
    compactMode: false,
  },
  
  minimal: {
    variant: "minimal",
    showProgress: false,
    showMetrics: false,
    showPattern: false,
    showTimer: false,
    showPhaseIndicator: false,
    allowPause: true,
    allowStop: true,
    allowAdjustments: false,
    compactMode: true,
  },
  
  mobile: {
    variant: "mobile",
    showProgress: true,
    showMetrics: false,
    showPattern: true,
    showTimer: true,
    showPhaseIndicator: true,
    allowPause: true,
    allowStop: true,
    allowAdjustments: false,
    compactMode: true,
  },
  
  floating: {
    variant: "floating",
    showProgress: false,
    showMetrics: false,
    showPattern: false,
    showTimer: false,
    showPhaseIndicator: false,
    allowPause: true,
    allowStop: false,
    allowAdjustments: false,
    compactMode: true,
    floatingPosition: "bottom-right",
  },
};

export const VARIANT_STYLES = {
  full: "bg-white border rounded-lg p-6 shadow-lg",
  minimal: "bg-transparent p-2",
  mobile: "bg-white/90 backdrop-blur border rounded-lg p-4 shadow-sm",
  floating: "fixed z-50 bg-white/95 backdrop-blur border rounded-full p-3 shadow-xl",
};

export const FLOATING_POSITIONS = {
  "top-right": "top-4 right-4",
  "bottom-right": "bottom-4 right-4", 
  "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
};

export const STATE_COLORS = {
  idle: "text-gray-500",
  preparing: "text-yellow-500",
  active: "text-green-500",
  paused: "text-orange-500",
  complete: "text-blue-500",
};

export const PHASE_COLORS = {
  inhale: "text-blue-500",
  hold: "text-purple-500",
  exhale: "text-green-500",
  pause: "text-gray-500",
};