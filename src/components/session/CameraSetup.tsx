import React, { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useMeditationVision } from "@/hooks/useMeditationVision";
import { TrackingStatus, Keypoint } from "@/hooks/visionTypes";
import { Loader2, Camera, AlertCircle } from "lucide-react";

const VideoFeed = lazy(() => import("@/components/VideoFeed"));

type CameraSetupProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: Keypoint[];
  trackingStatus: TrackingStatus;
};

export const CameraSetup = ({
  videoRef,
  landmarks,
  trackingStatus,
}: CameraSetupProps) => {
  // CLEAN: Single source of truth - all camera state from useSession hook
  const { start, cameraStream, cameraPermissionGranted, requestCamera, visionActive } =
    useSession({ videoElement: videoRef });

  // Initialize vision system for camera tracking
  const vision = useMeditationVision(
    visionActive ? {
      sessionId: `session_${Date.now()}`,
      targetFPS: 2,
      silentMode: true,
      gracefulDegradation: true,
    } : undefined
  );

  // DRY: Use session hook's camera state directly
  const isCameraReady = !!cameraStream && cameraPermissionGranted;
  const isInitializing = !cameraStream && !cameraPermissionGranted;
  const needsCameraSetup = !cameraStream;

  // Local state for UI feedback (not duplicating session state)
  const [cameraError, setCameraErrorState] = React.useState<string | null>(
    null
  );
  const [isInitializingUI, setIsInitializingUI] = React.useState(false);

  // Update local error state when session has errors
  React.useEffect(() => {
    // This would need to be passed from session or handled differently
    // For now, we'll manage local error state
  }, []);

  // Cleanup vision system on unmount
  React.useEffect(() => {
    return () => {
      if (vision) {
        vision.stop();
      }
    };
  }, [vision]);

  const handleRequestCamera = async () => {
    try {
      console.log("📹 CameraSetup: Requesting camera access...");

      // Get camera stream from session hook
      const stream = await requestCamera();

      // CRITICAL: Attach stream to video element immediately
      if (stream && videoRef.current) {
        console.log("📹 CameraSetup: Attaching stream to video element...");
        const video = videoRef.current;

        // Set stream and video properties
        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;

        console.log("✅ CameraSetup: Stream attached to video element, readyState:", video.readyState);

        // Wait for video to be ready with a shorter timeout
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 3000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            console.log("✅ CameraSetup: Video metadata loaded, dimensions:", video.videoWidth, "x", video.videoHeight);
            resolve();
          };

          const onError = (event: Event) => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            console.error("❌ CameraSetup: Video load error:", event);
            reject(new Error("Video load error"));
          };

          // Check if already loaded
          if (video.readyState >= 2) {
            clearTimeout(timeout);
            console.log("✅ CameraSetup: Video already ready");
            resolve();
            return;
          }

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);
        });

        // Ensure video is playing with retry mechanism
        const playVideo = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            try {
              await video.play();
              console.log(
                "✅ CameraSetup: Video is playing, readyState:",
                video.readyState
              );
              return;
            } catch (playError) {
              console.warn(`⚠️ CameraSetup: Video play attempt ${i + 1} failed:`, playError);
              if (i < retries - 1) {
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
          console.warn("⚠️ CameraSetup: All video play attempts failed");
        };

        await playVideo();

        // Additional check to ensure video is visible and properly sized
        video.style.display = 'block';
        video.style.visibility = 'visible';
        video.style.opacity = '1';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '1';
        console.log("✅ CameraSetup: Video element visibility and sizing set");

        console.log("✅ CameraSetup: Camera fully initialized and streaming");

        // Start vision processing if vision is active
        if (visionActive && vision && videoRef.current) {
          console.log("🔍 CameraSetup: Starting vision processing with video element");

          // Ensure video is ready before starting vision
          const video = videoRef.current;
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
            try {
              await vision.start(video);
              console.log("✅ CameraSetup: Vision processing started successfully");
            } catch (visionError) {
              console.warn("⚠️ CameraSetup: Vision start failed:", visionError);
              // Don't fail the entire setup if vision fails
            }
          } else {
            console.log("⚠️ CameraSetup: Video not ready yet, vision will start when video loads");
            // Add event listener for when video becomes ready
            const handleVideoReady = async () => {
              if (video.readyState >= 2) {
                video.removeEventListener('loadeddata', handleVideoReady);
                try {
                  await vision.start(video);
                  console.log("✅ CameraSetup: Vision processing started after video loaded");
                } catch (visionError) {
                  console.warn("⚠️ CameraSetup: Vision start failed after video load:", visionError);
                }
              }
            };
            video.addEventListener('loadeddata', handleVideoReady);
          }
        }
      } else {
        throw new Error("Camera stream or video element unavailable");
      }
    } catch (error) {
      console.error("❌ CameraSetup: Camera initialization failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize camera. Please check permissions and try again.";
      setCameraErrorState(errorMessage);
    }
  };

  const handleStartSession = async () => {
    try {
      console.log("🎯 CameraSetup: Starting breathing session...");
      await start();
      console.log("✅ CameraSetup: Session started successfully");
    } catch (error) {
      console.error("❌ CameraSetup: Failed to start session:", error);
      setCameraErrorState("Failed to start session");
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in p-4 text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Camera Setup</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Position your face in the center of the video feed. This allows us to
          measure your stillness and focus during the session.
        </p>
      </div>

      <div className="w-64 h-48 md:w-96 md:h-72 relative rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: '#000' }}>
        <Suspense
          fallback={
            <div className="w-full h-full rounded-lg bg-secondary animate-pulse" />
          }
        >
          <VideoFeed
            videoRef={videoRef}
            isActive={true}
            landmarks={landmarks}
            trackingStatus={trackingStatus}
            className="!relative !inset-0 !w-full !h-full"
          />
        </Suspense>
      </div>

      {cameraError && (
        <div className="mt-4 p-3 bg-destructive/20 text-destructive rounded-md max-w-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="mt-8 text-center">
        {needsCameraSetup ? (
          <Button
            onClick={handleRequestCamera}
            size="lg"
            className="w-48"
            disabled={isInitializingUI}
          >
            {isInitializingUI && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Camera className="mr-2 h-4 w-4" />
            {isInitializingUI ? "Initializing..." : "Enable Camera"}
          </Button>
        ) : (
          <Button
            onClick={handleStartSession}
            size="lg"
            disabled={!isCameraReady}
            className="w-48"
          >
            {isCameraReady ? "Start Session" : "Waiting for Camera..."}
          </Button>
        )}
      </div>
    </div>
  );
};
