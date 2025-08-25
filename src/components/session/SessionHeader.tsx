import React from "react";
import { useSession } from "@/hooks/useSession";

type SessionHeaderProps = {
  patternName?: string;
  maxCycles?: number;
};

export const SessionHeader = ({
  patternName = "Breathing Session",
  maxCycles,
}: SessionHeaderProps) => {
  const { phase, metrics, getSessionDuration } = useSession();

  return (
    <div className="absolute top-8 text-center z-20">
      <p className="text-lg text-muted-foreground">{patternName}</p>
      {maxCycles && maxCycles !== Infinity && (
        <p className="text-2xl font-bold text-primary">
          Cycle: {(metrics?.cycleCount || 0) + 1} / {maxCycles}
        </p>
      )}
      <p className="text-4xl font-mono font-bold text-primary">
        {getSessionDuration()}
      </p>
      <p className="text-lg text-muted-foreground capitalize">
        {phase || 'Ready'}
      </p>
    </div>
  );
};
