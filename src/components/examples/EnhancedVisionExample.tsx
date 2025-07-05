import React, { useState, useEffect, useRef } from "react";
import { useEnhancedVision } from "../../hooks/useEnhancedVision";
import type { VisionTier, VisionMetrics } from "../../lib/vision/types";

/**
 * Example component demonstrating how to use the enhanced vision system
 */
const EnhancedVisionExample: React.FC = () => {
  // State
  const [showCamera, setShowCamera] = useState(false);
  const [selectedTier, setSelectedTier] = useState<VisionTier>("standard");
  const [selectedMode, setSelectedMode] = useState<
    "auto" | "performance" | "quality"
  >("auto");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use the enhanced vision hook
  const {
    isInitialized,
    isProcessing,
    currentTier,
    currentMode,
    metrics,
    error,
    operationMetrics,
    loadedModels,

    initialize,
    startVision,
    stopVision,
    switchTier,
    switchMode,
    getCameraStream,
  } = useEnhancedVision({
    autoInitialize: true,
    initialMode: "auto",
    onError: (error) => console.error("Vision system error:", error),
  });

  // Handle starting the camera
  const handleStartCamera = async () => {
    try {
      // Get camera stream
      const stream = await getCameraStream({
        video: { width: 640, height: 480 },
      });

      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start vision processing
      await startVision(stream);

      setShowCamera(true);
    } catch (error) {
      console.error("Error starting camera:", error);
    }
  };

  // Handle stopping the camera
  const handleStopCamera = async () => {
    await stopVision();

    // Clear video source
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setShowCamera(false);
  };

  // Handle tier change
  const handleTierChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newTier = event.target.value as VisionTier;
    setSelectedTier(newTier);
    await switchTier(newTier);
  };

  // Handle mode change
  const handleModeChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newMode = event.target.value as "auto" | "performance" | "quality";
    setSelectedMode(newMode);
    await switchMode(newMode);
  };

  // Format metrics for display
  const formatMetrics = (metrics: VisionMetrics | null) => {
    if (!metrics) return "No metrics available";

    return (
      <div className="metrics-container">
        <p>Confidence: {(metrics.confidence * 100).toFixed(1)}%</p>
        <p>Face Present: {metrics.facePresent ? "Yes" : "No"}</p>
        <p>
          Breathing Rate: {metrics.estimatedBreathingRate.toFixed(1)}{" "}
          breaths/min
        </p>
        <p>Head Alignment: {(metrics.headAlignment * 100).toFixed(1)}%</p>

        {/* Show StandardMetrics properties if available */}
        {"facialTension" in metrics && (
          <>
            <p>Facial Tension: {(metrics.facialTension * 100).toFixed(1)}%</p>
            <p>Posture Quality: {(metrics.postureQuality * 100).toFixed(1)}%</p>
            <p>
              Breathing Consistency:{" "}
              {(metrics.breathingRhythm.consistency * 100).toFixed(1)}%
            </p>
          </>
        )}

        {/* Show PremiumMetrics properties if available */}
        {"detailedFacialAnalysis" in metrics && (
          <>
            <p>
              Chest Expansion:{" "}
              {(metrics.fullBodyPosture.chestExpansion * 100).toFixed(1)}%
            </p>
            <p>
              Rhythm Accuracy:{" "}
              {(metrics.preciseBreathingMetrics.rhythmAccuracy * 100).toFixed(
                1
              )}
              %
            </p>
          </>
        )}
      </div>
    );
  };

  // Format performance metrics
  const formatPerformanceMetrics = () => {
    return (
      <div className="performance-metrics">
        <h4>Performance Metrics:</h4>
        <ul>
          {Object.entries(operationMetrics).map(([key, value]) => (
            <li key={key}>
              {key}: {value.toFixed(2)}ms
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Format loaded models
  const formatLoadedModels = () => {
    return (
      <div className="loaded-models">
        <h4>Loaded Models:</h4>
        <ul>
          {loadedModels.map((model) => (
            <li key={model}>{model}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="enhanced-vision-example">
      <h2>Enhanced Vision System Example</h2>

      <div className="status-section">
        <p>Status: {isInitialized ? "Initialized" : "Not Initialized"}</p>
        <p>Current Tier: {currentTier}</p>
        <p>Current Mode: {currentMode}</p>
        {error && <p className="error">Error: {error.message}</p>}
      </div>

      <div className="controls-section">
        <div className="control-row">
          <label>
            Vision Tier:
            <select
              value={selectedTier}
              onChange={handleTierChange}
              disabled={isProcessing}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </label>

          <label>
            Performance Mode:
            <select
              value={selectedMode}
              onChange={handleModeChange}
              disabled={isProcessing}
            >
              <option value="auto">Auto</option>
              <option value="performance">Performance</option>
              <option value="quality">Quality</option>
            </select>
          </label>
        </div>

        <div className="camera-controls">
          {!showCamera ? (
            <button onClick={handleStartCamera} disabled={!isInitialized}>
              Start Camera
            </button>
          ) : (
            <button onClick={handleStopCamera}>Stop Camera</button>
          )}
        </div>
      </div>

      <div className="camera-section">
        {showCamera && (
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "640px", height: "480px", background: "#000" }}
            />
          </div>
        )}
      </div>

      <div className="metrics-section">
        <h3>Vision Metrics</h3>
        {formatMetrics(metrics)}
      </div>

      <div className="debug-section">
        <h3>Debug Information</h3>
        {formatPerformanceMetrics()}
        {formatLoadedModels()}
      </div>

      {/* Using regular CSS classes instead of styled-jsx */}
    </div>
  );
};

export default EnhancedVisionExample;
