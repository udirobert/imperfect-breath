/**
 * SHARED SESSION TYPES
 * Consolidated from multiple components to eliminate duplication
 */

export interface SessionMetrics {
    duration: number;
    cycleCount: number;
    breathHoldTime?: number;
    stillnessScore?: number;
    cameraUsed: boolean;
    sessionType: string;
    // UNIFIED: Vision session ID for AI integration (DRY principle)
    visionSessionId?: string;
    visionMetrics?: {
        averageStillness: number;
        faceDetectionRate: number;
        postureScore: number;
    };
}

export interface SessionModeConfig {
    enableCamera: boolean;
    enableVision: boolean;
    enableAudio: boolean;
    enableAdvancedFeatures: boolean;
    enableMobileOptimizations: boolean;
    showPerformanceMonitor: boolean;
    layout: "single" | "dual" | "mobile";
    description: string;
}

export type SessionPhase = "setup" | "preparation" | "camera_setup" | "ready" | "active" | "paused" | "complete";
export type SessionMode = "classic" | "enhanced" | "advanced" | "mobile";