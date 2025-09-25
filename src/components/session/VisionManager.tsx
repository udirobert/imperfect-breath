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
      gracefulDegradation: false, // No fake data
    }),
    [sessionId]
  );

  // Debug: Log when sessionId changes
  const prevSessionIdRef = useRef<string>();
  useEffect(() => {
    if (prevSessionIdRef.current && prevSessionIdRef.current !== sessionId) {
      console.log('🔄 VisionManager: SessionId changed from', prevSessionIdRef.current, 'to', sessionId);
    }
    prevSessionIdRef.current = sessionId;
  }, [sessionId]);

  // CLEAN: Use vision store for state management with enhanced debugging
  const visionStore = useVisionStore();
  const isVisionActive = visionSelectors.isActive();
  const visionMetrics = visionSelectors.hasMetrics() ? visionStore.smoothedMetrics : null; // PERFORMANT: Use smoothed metrics
  const visionError = useVisionStore((state) => state.error);
  const backendAvailable = useVisionStore((state) => state.backendAvailable);

  // PERFORMANT: Memoize landmarks to prevent infinite re-renders
  const landmarks = useMemo(
    () => visionMetrics?.faceLandmarks || [],
    [visionMetrics?.faceLandmarks]
  );

  // DRY: Debug logging for vision state changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 VisionManager state:', {
        enabled,
        isVisionActive,
        hasMetrics: !!visionMetrics,
        landmarkCount: landmarks.length,
        backendAvailable,
        error: visionError,
        restlessness: visionMetrics?.restlessnessScore,
        stillness: visionMetrics?.stillness
      });
    }
  }, [enabled, isVisionActive, visionMetrics, landmarks.length, backendAvailable, visionError]);

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

  // Stop vision when disabled (but not on every state change)
  useEffect(() => {
    if (!enabled && visionStore.isActive) {
      console.log('🛑 VisionManager: Stopping vision processing (disabled)');
      visionStore.stop();
    }
  }, [enabled]); // Only depend on enabled state

  // Cleanup vision processing when component unmounts
  useEffect(() => {
    return () => {
      if (visionStore.isActive) {
        console.log('🧹 VisionManager: Cleaning up vision processing on unmount');
        visionStore.stop();
      }
    };
  }, []); // Empty dependency array - only run on unmount

  // Show error state if vision service is unavailable
  if (!enabled) {
    return null;
  }

  if (!visionStore.isReady) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-blue-600 font-medium mb-2">Vision Service</div>
          <div className="text-sm text-blue-700">Connecting to biometric tracking...</div>
        </div>
      </div>
    );
  }

  if (visionStore.error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center max-w-sm">
          <div className="text-red-600 font-medium mb-2">Vision Service Unavailable</div>
          <div className="text-sm text-red-700 mb-3">
            {visionStore.error}
          </div>
          <div className="text-xs text-red-600">
            Biometric tracking disabled - session will continue without movement analysis
          </div>
        </div>
      </div>
    );
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