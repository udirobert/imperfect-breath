/**
 * Real-time Performance Display
 *
 * Shows users their meditation quality in real-time with clear,
 * non-distracting visual feedback during enhanced sessions.
 */

import React, { useState, useEffect } from "react";
import { VisionMetrics } from "../../hooks/useVisionClient";

interface PerformanceDisplayProps {
  visionMetrics: VisionMetrics | null;
  breathPhase?: "inhale" | "exhale" | "hold" | "pause";
  isVisible?: boolean;
  compactMode?: boolean;
}

interface PerformanceState {
  restlessness: number;
  posture: number;
  focus: number;
  trend: "improving" | "stable" | "declining";
}

export const PerformanceDisplay: React.FC<PerformanceDisplayProps> = ({
  visionMetrics,
  breathPhase,
  isVisible = true,
  compactMode = false,
}) => {
  const [performance, setPerformance] = useState<PerformanceState>({
    restlessness: 0,
    posture: 85,
    focus: 75,
    trend: "stable",
  });

  const [history, setHistory] = useState<number[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Update performance metrics from vision data
  useEffect(() => {
    if (!visionMetrics || !visionMetrics.faceDetected) return;

    const newRestlessness = Math.round((1 - visionMetrics.movementLevel) * 100);
    const newPosture = Math.round(visionMetrics.postureScore * 100);
    const newFocus =
      visionMetrics.confidence > 0
        ? Math.round(visionMetrics.confidence * 100)
        : 0;

    // Update history for trend calculation
    setHistory((prev) => {
      const updated = [...prev, newRestlessness].slice(-10); // Keep last 10 samples

      // Calculate trend with updated history
      const trend = updated.length >= 5 ? calculateTrend(updated) : "stable";

      // Update performance state
      setPerformance({
        restlessness: newRestlessness,
        posture: newPosture,
        focus: newFocus,
        trend,
      });

      return updated;
    });
  }, [visionMetrics]);

  const calculateTrend = (
    values: number[]
  ): "improving" | "stable" | "declining" => {
    if (values.length < 5) return "stable";

    const recent = values.slice(-3);
    const earlier = values.slice(-6, -3);

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg =
      earlier.reduce((sum, val) => sum + val, 0) / earlier.length;

    const diff = recentAvg - earlierAvg;

    if (diff > 5) return "improving";
    if (diff < -5) return "declining";
    return "stable";
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case "improving":
        return "📈";
      case "declining":
        return "📉";
      default:
        return "➡️";
    }
  };

  if (!isVisible) return null;

  // Compact mode for minimal distraction
  if (compactMode) {
    return (
      <div className="fixed top-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                performance.restlessness >= 80
                  ? "bg-green-400"
                  : performance.restlessness >= 60
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
            />
            <span className="text-xs">
              Stillness {performance.restlessness}%
            </span>
          </div>
          <div className="text-xs opacity-70">
            {getTrendIcon(performance.trend)}
          </div>
        </div>
      </div>
    );
  }

  // Full performance display
  return (
    <div className="fixed top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl p-4 text-white border border-white/20 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium opacity-90">Session Quality</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs opacity-60 hover:opacity-100 transition-opacity"
        >
          {showDetails ? "Less" : "More"}
        </button>
      </div>

      {/* Primary Metrics */}
      <div className="space-y-2 mb-3">
        {/* Stillness (Inverse of Restlessness) */}
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-80">Stillness</span>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded text-xs border ${getScoreBackground(
                performance.restlessness
              )}`}
            >
              {performance.restlessness}%
            </div>
            <span className="text-xs">{getTrendIcon(performance.trend)}</span>
          </div>
        </div>

        {/* Posture */}
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-80">Posture</span>
          <div
            className={`px-2 py-1 rounded text-xs border ${getScoreBackground(
              performance.posture
            )}`}
          >
            {performance.posture}%
          </div>
        </div>

        {/* Focus/Detection */}
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-80">Focus</span>
          <div
            className={`px-2 py-1 rounded text-xs border ${getScoreBackground(
              performance.focus
            )}`}
          >
            {performance.focus}%
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="space-y-2 pt-2 border-t border-white/20">
          <div className="text-xs opacity-70">
            <div className="flex justify-between mb-1">
              <span>Movement Level:</span>
              <span>
                {visionMetrics
                  ? Math.round(visionMetrics.movementLevel * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Face Confidence:</span>
              <span>
                {visionMetrics ? Math.round(visionMetrics.confidence * 100) : 0}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span>Processing:</span>
              <span>{visionMetrics?.processingTimeMs?.toFixed(0) || 0}ms</span>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="text-xs bg-white/10 rounded p-2 mt-2">
            {performance.restlessness < 60 && (
              <p>💡 Try to minimize movement during {breathPhase} phase</p>
            )}
            {performance.posture < 70 && (
              <p>💡 Sit up straight and relax your shoulders</p>
            )}
            {performance.focus < 50 && (
              <p>💡 Ensure good lighting and center yourself in frame</p>
            )}
            {performance.restlessness >= 80 && performance.posture >= 80 && (
              <p>✨ Excellent meditation posture!</p>
            )}
          </div>
        </div>
      )}

      {/* Phase Indicator */}
      <div className="text-center mt-3 pt-2 border-t border-white/20">
        <div className="text-xs opacity-60">
          Current:{" "}
          <span className="capitalize text-white">
            {breathPhase || "preparing"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDisplay;
