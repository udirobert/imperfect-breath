
import React from 'react';
import { useBreathingSession } from '@/hooks/useBreathingSession';

type SessionHeaderProps = {
  state: ReturnType<typeof useBreathingSession>['state'];
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const SessionHeader = ({ state }: SessionHeaderProps) => {
  return (
    <div className="absolute top-8 text-center z-20">
      <p className="text-lg text-muted-foreground">{state.pattern.name}</p>
      {state.sessionPhase !== 'breath-hold' && state.pattern.cycles !== Infinity &&
        <p className="text-2xl font-bold text-primary">Cycle: {state.cycleCount + 1} / {state.pattern.cycles}</p>
      }
      {state.sessionPhase === 'breath-hold' ? (
        <p className="text-4xl font-mono font-bold text-primary animate-pulse">{formatTime(state.breathHoldTime)}</p>
      ) : (
        <p className="text-4xl font-mono font-bold text-primary">{state.phaseCountdown > 0 ? state.phaseCountdown : ''}</p>
      )}
    </div>
  );
};
