
import React from 'react';
import { Pause, Play, StopCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBreathingSession } from '@/hooks/useBreathingSession';

type SessionControlsProps = {
  state: ReturnType<typeof useBreathingSession>['state'];
  controls: ReturnType<typeof useBreathingSession>['controls'];
  onEndSession: () => void;
};

export const SessionControls = ({ state, controls, onEndSession }: SessionControlsProps) => {
  return (
    <div className="z-20 mt-auto mb-8 flex items-center justify-center space-x-4">
      <Button variant="ghost" size="icon" onClick={controls.toggleAudio} className="rounded-full w-16 h-16">
        {state.audioEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
      </Button>
      <Button variant="ghost" size="icon" onClick={controls.togglePause} className="rounded-full w-16 h-16">
        {state.isRunning && state.sessionPhase !== 'breath-hold' ? <Pause size={32} /> : <Play size={32} />}
      </Button>
      <Button variant="destructive" size="icon" onClick={onEndSession} className="rounded-full w-16 h-16 bg-red-400 hover:bg-red-500">
        <StopCircle size={32} />
      </Button>
    </div>
  );
};
