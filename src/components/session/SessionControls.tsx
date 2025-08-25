import React from "react";
import { Pause, Play, StopCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

type SessionControlsProps = {
  onEndSession?: () => void;
};

export const SessionControls = ({ onEndSession }: SessionControlsProps) => {
  const {
    isActive,
    isPaused,
    audioEnabled: isAudioEnabled,
    pause,
    resume,
    complete: stop,
    toggleAudio,
  } = useSession();

  const handlePlayPause = () => {
    if (isActive) {
      pause();
    } else if (isPaused) {
      resume();
    }
  };

  const handleStop = () => {
    stop();
    onEndSession?.();
  };

  return (
    <div className="z-20 mt-auto mb-8 flex items-center justify-center space-x-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleAudio}
        className="rounded-full w-16 h-16"
      >
        {isAudioEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        className="rounded-full w-16 h-16"
        disabled={!isActive && !isPaused}
      >
        {isActive ? <Pause size={32} /> : <Play size={32} />}
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={handleStop}
        className="rounded-full w-16 h-16 bg-red-400 hover:bg-red-500"
      >
        <StopCircle size={32} />
      </Button>
    </div>
  );
};
