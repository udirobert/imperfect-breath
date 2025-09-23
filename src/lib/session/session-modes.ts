/**
 * Session Mode Configurations
 *
 * Centralized configuration for all session modes
 * Extracted from MeditationSession for better organization
 */

import { SessionMode, SessionModeConfig } from "../../types/session";

export const SESSION_MODE_CONFIGS: Record<SessionMode, SessionModeConfig> = {
    classic: {
        enableCamera: false,
        enableVision: false,
        enableAudio: true,
        enableAdvancedFeatures: false,
        enableMobileOptimizations: false,
        showPerformanceMonitor: false,
        layout: "single",
        description: "Pure breathing practice with no distractions",
    },
    enhanced: {
        enableCamera: true,
        enableVision: true,
        enableAudio: true,
        enableAdvancedFeatures: true,
        enableMobileOptimizations: true,
        showPerformanceMonitor: false,
        layout: "dual",
        description: "AI-powered breathing with real-time feedback",
    },
    advanced: {
        enableCamera: true,
        enableVision: true,
        enableAudio: true,
        enableAdvancedFeatures: true,
        enableMobileOptimizations: true,
        showPerformanceMonitor: true,
        layout: "dual",
        description: "Full featured session with performance monitoring",
    },
    mobile: {
        enableCamera: true,
        enableVision: true,
        enableAudio: true,
        enableAdvancedFeatures: true,
        enableMobileOptimizations: true,
        showPerformanceMonitor: false,
        layout: "mobile",
        description: "Mobile-optimized session with haptic feedback",
    },
};

export const getModeConfig = (
    mode: SessionMode,
    customSettings?: Partial<SessionModeConfig>
): SessionModeConfig => ({
    ...SESSION_MODE_CONFIGS[mode],
    ...customSettings,
});