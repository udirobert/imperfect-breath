/**
 * Session Controls Bar Component
 *
 * Focused component for session control buttons (play/pause, stop, audio toggle)
 * Extracted from SessionInProgress for better organization and reusability.
 */

import React from "react";
import { Button } from "../ui/button";
import { Volume2, VolumeX, Pause, Play, StopCircle } from "lucide-react";

interface SessionControlsBarProps {
  isActive: boolean;
  isPaused: boolean;
  isAudioEnabled: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onToggleAudio: () => void;
  disabled?: boolean;
}

export const SessionControlsBar: React.FC<SessionControlsBarProps> = React.memo(
  ({
    isActive,
    isPaused,
    isAudioEnabled,
    onPlayPause,
    onStop,
    onToggleAudio,
    disabled = false,
  }) => {
    return (
      <div className="flex items-center justify-center space-x-6">
        {/* Audio Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAudio}
          className="rounded-full w-12 h-12"
          disabled={disabled}
        >
          {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </Button>

        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayPause}
          className="rounded-full w-14 h-14"
          disabled={disabled || (!isActive && !isPaused)}
        >
          {isActive ? <Pause size={28} /> : <Play size={28} />}
        </Button>

        {/* Stop Button */}
        <Button
          variant="destructive"
          size="icon"
          onClick={onStop}
          className="rounded-full w-12 h-12 bg-red-400 hover:bg-red-500"
          disabled={disabled}
        >
          <StopCircle size={24} />
        </Button>
      </div>
    );
  }
);

SessionControlsBar.displayName = "SessionControlsBar";
