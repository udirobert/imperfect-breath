/**
 * SessionControls Composite Component
 *
 * Unified session control system that consolidates SessionControls,
 * SessionControlsBar, SessionProgressDisplay, and related components.
 *
 * FOLLOWS BLUEPRINT: Enhancement-first methodology - replaces multiple
 * session control components with a single, variant-based solution.
 */

import React, { useMemo } from "react";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import { Slider } from "../../ui/slider";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Gauge,
  Timer,
  Activity,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";

import type { SessionControlsProps } from "./types";
import {
  SESSION_CONTROL_CONFIGS,
  VARIANT_STYLES,
  FLOATING_POSITIONS,
  STATE_COLORS,
  PHASE_COLORS,
} from "./variants";

export const SessionControls: React.FC<SessionControlsProps> = ({
  variant = "full",
  customConfig,
  className = "",
  sessionState,
  sessionMode = "basic",
  pattern,
  metrics,
  isLoading = false,
  onPlay,
  onPause,
  onStop,
  onReset,
  onNext,
  onPrevious,
  onVolumeChange,
  onSpeedChange,
  volume = 80,
  speed = 1,
  enableAudio = true,
  enableVibration = false,
  showAdvancedControls = false,
  disabled = false,
}) => {
  // Merge configuration
  const config = useMemo(
    () => ({
      ...SESSION_CONTROL_CONFIGS[variant],
      ...customConfig,
    }),
    [variant, customConfig]
  );

  // Determine primary action based on state
  const primaryAction = useMemo(() => {
    switch (sessionState) {
      case "idle":
      case "preparing":
        return { icon: Play, label: "Start", action: onPlay };
      case "active":
        return { icon: Pause, label: "Pause", action: onPause };
      case "paused":
        return { icon: Play, label: "Resume", action: onPlay };
      case "complete":
        return { icon: RotateCcw, label: "Restart", action: onReset };
      default:
        return { icon: Play, label: "Start", action: onPlay };
    }
  }, [sessionState, onPlay, onPause, onReset]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render primary controls
  const renderPrimaryControls = () => {
    const PrimaryIcon = primaryAction.icon;

    return (
      <div className="flex items-center gap-2">
        {/* Previous/Skip Back */}
        {config.allowAdjustments && onPrevious && (
          <Button
            variant="outline"
            size={config.compactMode ? "sm" : "default"}
            onClick={onPrevious}
            disabled={disabled || sessionState === "idle"}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
        )}

        {/* Primary Action */}
        <Button
          variant="default"
          size={config.compactMode ? "sm" : "lg"}
          onClick={primaryAction.action}
          disabled={disabled || isLoading}
          className={config.compactMode ? "px-4" : "px-8"}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <PrimaryIcon className="w-4 h-4 mr-2" />
          )}
          {!config.compactMode && primaryAction.label}
        </Button>

        {/* Stop */}
        {config.allowStop && onStop && (
          <Button
            variant="outline"
            size={config.compactMode ? "sm" : "default"}
            onClick={onStop}
            disabled={disabled || sessionState === "idle"}
          >
            <Square className="w-4 h-4" />
            {!config.compactMode && "Stop"}
          </Button>
        )}

        {/* Next/Skip Forward */}
        {config.allowAdjustments && onNext && (
          <Button
            variant="outline"
            size={config.compactMode ? "sm" : "default"}
            onClick={onNext}
            disabled={disabled || sessionState === "idle"}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  // Render progress display
  const renderProgress = () => {
    if (!config.showProgress || !metrics) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(metrics.progress)}%</span>
        </div>
        <Progress value={metrics.progress} className="w-full" />
      </div>
    );
  };

  // Render timer
  const renderTimer = () => {
    if (!config.showTimer || !metrics) return null;

    return (
      <div className="flex items-center gap-2 text-sm">
        <Timer className="w-4 h-4 text-gray-500" />
        <span className="font-mono">{formatTime(metrics.duration)}</span>
      </div>
    );
  };

  // Render phase indicator
  const renderPhaseIndicator = () => {
    if (!config.showPhaseIndicator || !metrics) return null;

    return (
      <div className="flex items-center gap-2">
        <Activity
          className={`w-4 h-4 ${
            PHASE_COLORS[metrics.currentPhase] || "text-gray-500"
          }`}
        />
        <Badge variant="outline" className="capitalize">
          {metrics.currentPhase}
        </Badge>
      </div>
    );
  };

  // Render pattern info
  const renderPattern = () => {
    if (!config.showPattern || !pattern) return null;

    return (
      <div className="flex items-center gap-2 text-sm">
        <Target className="w-4 h-4 text-gray-500" />
        <span className="font-medium">{pattern.name}</span>
        <Badge variant="secondary" className="text-xs">
          {pattern.difficulty}
        </Badge>
      </div>
    );
  };

  // Render metrics
  const renderMetrics = () => {
    if (!config.showMetrics || !metrics) return null;

    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-500" />
          <span>Cycles: {metrics.cycleCount}</span>
        </div>
        {metrics.breathingRate && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>Rate: {metrics.breathingRate}/min</span>
          </div>
        )}
        {metrics.stillnessScore && (
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <span>Stillness: {metrics.stillnessScore}%</span>
          </div>
        )}
      </div>
    );
  };

  // Render volume control
  const renderVolumeControl = () => {
    if (!config.allowAdjustments || !onVolumeChange) return null;

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVolumeChange(volume > 0 ? 0 : 80)}
        >
          {volume > 0 ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>
        {showAdvancedControls && (
          <Slider
            value={[volume]}
            onValueChange={(values) => onVolumeChange(values[0])}
            max={100}
            step={5}
            className="w-24"
          />
        )}
      </div>
    );
  };

  // Build container classes
  const containerClasses = useMemo(() => {
    let classes = VARIANT_STYLES[variant];

    if (variant === "floating" && config.floatingPosition) {
      classes += ` ${FLOATING_POSITIONS[config.floatingPosition]}`;
    }

    return `${classes} ${className}`;
  }, [variant, config.floatingPosition, className]);

  // Minimal/Floating variant - just primary controls
  if (config.compactMode && (variant === "minimal" || variant === "floating")) {
    return <div className={containerClasses}>{renderPrimaryControls()}</div>;
  }

  // Mobile variant - simplified layout
  if (variant === "mobile") {
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-4">
          {/* Header with pattern and timer */}
          <div className="flex items-center justify-between">
            {renderPattern()}
            {renderTimer()}
          </div>

          {/* Phase and progress */}
          <div className="space-y-2">
            {renderPhaseIndicator()}
            {renderProgress()}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center">
            {renderPrimaryControls()}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant - complete layout
  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {renderPattern()}
            <div className="flex items-center gap-4">
              {renderPhaseIndicator()}
              {renderTimer()}
            </div>
          </div>
          <Badge
            variant="outline"
            className={`capitalize ${STATE_COLORS[sessionState]}`}
          >
            {sessionState}
          </Badge>
        </div>

        {/* Progress */}
        {renderProgress()}

        {/* Metrics */}
        {renderMetrics()}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {renderPrimaryControls()}
          </div>

          {/* Audio controls */}
          <div className="flex items-center gap-2">{renderVolumeControl()}</div>
        </div>

        {/* Advanced controls */}
        {showAdvancedControls && config.allowAdjustments && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Speed</span>
              <span>{speed}x</span>
            </div>
            {onSpeedChange && (
              <Slider
                value={[speed]}
                onValueChange={(values) => onSpeedChange(values[0])}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
