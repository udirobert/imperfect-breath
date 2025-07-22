import React from "react";
import { useEnhancedSession } from "@/hooks/useEnhancedSession";

type SessionHeaderProps = {
  patternName?: string;
  maxCycles?: number;
};

export const SessionHeader = ({
  patternName = "Breathing Session",
  maxCycles,
}: SessionHeaderProps) => {
  const { state, getSessionDuration } = useEnhancedSession();

  return (
    <div className="absolute top-8 text-center z-20">
      <p className="text-lg text-muted-foreground">{patternName}</p>
      {maxCycles && maxCycles !== Infinity && (
        <p className="text-2xl font-bold text-primary">
          Cycle: {state.sessionData.cycleCount + 1} / {maxCycles}
        </p>
      )}
      <p className="text-4xl font-mono font-bold text-primary">
        {getSessionDuration()}
      </p>
      <p className="text-lg text-muted-foreground capitalize">
        {state.sessionData.currentPhase}
      </p>
    </div>
  );
};
