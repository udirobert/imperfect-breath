import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Trophy, ArrowRight, Sparkles } from "lucide-react";

interface PostSessionCelebrationProps {
  metrics: {
    patternName: string;
    duration: number;
    score: number;
    cycles?: number;
    sessionType?: string;
    isFirstSession?: boolean;
  };
  onContinue?: () => void;
  onExplorePatterns?: () => void;
  onClose?: () => void;
}

export const PostSessionCelebration: React.FC<PostSessionCelebrationProps> = ({
  metrics,
  onContinue,
  onExplorePatterns,
  onClose,
}) => {
  const durationMinutes = Math.round(metrics.duration / 60);

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <Trophy className="h-12 w-12 text-yellow-500" />
        <h2 className="text-2xl font-bold">
          {metrics.isFirstSession ? "First Session Complete!" : "Great Work!"}
        </h2>
        <p className="text-muted-foreground">
          You completed {durationMinutes} minutes of {metrics.patternName}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{metrics.score}</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{durationMinutes}m</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{metrics.cycles || "—"}</div>
            <div className="text-xs text-muted-foreground">Cycles</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {onContinue && (
          <Button onClick={onContinue} className="flex-1">
            <Sparkles className="h-4 w-4 mr-2" />
            Continue
          </Button>
        )}
        {onExplorePatterns && (
          <Button onClick={onExplorePatterns} variant="outline" className="flex-1">
            <ArrowRight className="h-4 w-4 mr-2" />
            Explore Patterns
          </Button>
        )}
        {onClose && (
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
