/**
 * Vision Manager Component
 *
 * Consolidates all vision-related logic from MeditationSession.
 * Handles vision setup, startup, processing, and cleanup.
 *
 * Design Principles:
 * - CLEAN: Single responsibility for vision management
 * - MODULAR: Reusable vision component
 * - PERFORMANT: Optimized vision processing
 * - ROBUST: Comprehensive error handling
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { useVisionStore, visionSelectors } from '../../stores/visionStore';
import { FaceMeshOverlay } from '../vision/FaceMeshOverlay';

export interface VisionManagerProps {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraStream: MediaStream | null;
  sessionId: string;
  onVisionReady?: () => void;
  onVisionError?: (error: string) => void;
}

export const VisionManager: React.FC<VisionManagerProps> = ({
  enabled,
  videoRef,
  cameraStream,
  sessionId,
  onVisionReady,
  onVisionError,
}) => {
  // Memoize vision config to prevent recreation
  const visionConfig = useMemo(
    () => ({
      sessionId,
      targetFPS: 2,
      silentMode: false,
      gracefulDegradation: true,
    }),
    [sessionId]
  );

  // Use vision store for state management
  const visionStore = useVisionStore();
  const isVisionActive = visionSelectors.isActive();
  const visionMetrics = visionSelectors.hasMetrics() ? visionStore.metrics : null;

  // Memoize landmarks to prevent infinite re-renders
  const landmarks = useMemo(
    () => visionMetrics?.faceLandmarks || [],
    [visionMetrics?.faceLandmarks]
  );

  // Initialize vision when enabled
  useEffect(() => {
    if (enabled && !visionStore.config) {
      visionStore.initialize(visionConfig);
    }
  }, [enabled, visionStore, visionConfig]);

  // Start vision processing when we have the essentials
  useEffect(() => {
    const startVisionProcessing = async () => {
      const shouldStartVision =
        enabled &&
        visionStore.isReady &&
        !visionStore.isActive &&
        !!videoRef.current &&
        !!cameraStream;

      if (shouldStartVision) {
        try {
          console.log("🔍 Starting vision processing (simplified conditions)");
          await visionStore.start(videoRef.current!);
          console.log("✅ Vision processing started - FaceMesh should now be active");
          onVisionReady?.();
        } catch (err) {
          console.warn("⚠️ Vision start failed, but continuing with fallback:", err);
          onVisionError?.("Vision startup failed, using fallback mode");
          // Vision store has built-in graceful degradation
        }
      }
    };

    if (enabled && visionStore.isReady && videoRef.current && cameraStream) {
      startVisionProcessing();
    }
  }, [enabled, visionStore, cameraStream, videoRef, onVisionReady, onVisionError]);

  // Cleanup vision processing when component unmounts or disabled
  useEffect(() => {
    return () => {
      if (visionStore.isActive) {
        visionStore.stop();
      }
    };
  }, [visionStore]);

  // Don't render anything if vision is not enabled or not ready
  if (!enabled || !visionStore.isReady) {
    return null;
  }

  return (
    <FaceMeshOverlay
      videoElement={videoRef.current}
      landmarks={landmarks}
      isActive={visionStore.isActive}
      confidence={visionMetrics?.confidence || 0}
      postureScore={visionMetrics?.posture || 0}
      movementLevel={
        visionMetrics?.restlessnessScore
          ? visionMetrics.restlessnessScore / 100
          : 0
      }
    />
  );
};