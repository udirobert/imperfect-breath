/**
 * Session Initialization Hook
 *
 * Handles session initialization logic with proper error handling
 * Extracted from MeditationSession for better organization
 */

import { useEffect, useRef } from "react";
import { SessionConfig } from "../stores/sessionStore";
import { MeditationSessionConfig } from "../components/session/MeditationSession";

interface UseSessionInitializationOptions {
    config: MeditationSessionConfig;
    modeConfig: {
        enableCamera: boolean;
        enableVision: boolean;
        enableAudio: boolean;
    };
    session: {
        initialize: (config: SessionConfig) => Promise<void>;
    };
}

export const useSessionInitialization = ({
    config,
    modeConfig,
    session,
}: UseSessionInitializationOptions) => {
    const isInitializedRef = useRef(false);
    const configHashRef = useRef("");

    useEffect(() => {
        if (config && config.pattern) {
            // Create a hash of the config to detect actual changes
            const configHash = JSON.stringify({
                mode: config.mode,
                pattern: config.pattern,
                enableCamera: modeConfig.enableCamera,
                enableAudio: modeConfig.enableAudio,
                enableVision: modeConfig.enableVision,
            });

            // Only initialize if config actually changed
            if (configHash !== configHashRef.current || !isInitializedRef.current) {
                configHashRef.current = configHash;
                isInitializedRef.current = true;

                console.log("🧘 Initializing meditation session:", {
                    patternName: config.pattern.name,
                    phases: config.pattern.phases,
                    mode: config.mode,
                });

                // Convert MeditationSessionConfig to SessionConfig for the store
                const sessionConfig: SessionConfig = {
                    mode:
                        config.mode === "classic"
                            ? ("basic" as const)
                            : ("enhanced" as const),
                    pattern: {
                        id: config.pattern.name.toLowerCase().replace(/\s+/g, "_"),
                        name: config.pattern.name,
                        description: `${config.pattern.name} breathing pattern`,
                        inhale: config.pattern.phases.inhale,
                        hold: config.pattern.phases.hold || 0,
                        exhale: config.pattern.phases.exhale,
                        hold_after_exhale: config.pattern.phases?.pause || 0,
                        benefits: config.pattern.benefits || [
                            "Improved focus",
                            "Reduced stress",
                            "Better breathing control",
                        ],
                    },
                    enableCamera: modeConfig.enableCamera,
                    enableAudio: modeConfig.enableAudio,
                    enableAI: modeConfig.enableVision, // Map vision to AI feature
                };

                // Initialize the session store
                console.log("Session config prepared:", sessionConfig);
                session.initialize(sessionConfig)
                    .catch((error) => {
                        console.error("❌ Failed to initialize session:", error);
                        // Handle initialization error gracefully - session.initialize doesn't return a promise
                    });
            }
        }
    }, [config, modeConfig, session]);
};