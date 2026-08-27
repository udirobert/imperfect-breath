/**
 * TodayCard — "What do you need today?" on the Home surface.
 *
 * The self-report variant of evidence-cited coaching: tap a state, get the
 * engine's real recommendation (SmartPatternRecommendations — same engine the
 * session flow uses), and see WHY via ContextCards before starting.
 * Camera-detected state stays in-session; Home asks once, cheaply.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ContextCards } from "@/components/primitives/ContextCard";
import { SmartPatternRecommendations } from "@/lib/recommendations/SmartPatternRecommendations";
import { cn } from "@/lib/utils";

const STATE_CHIPS = [
  { id: "stressed", label: "Stressed", mood: "stressed" },
  { id: "anxious", label: "Anxious", mood: "anxious" },
  { id: "tired", label: "Tired", mood: "tired" },
  { id: "restless", label: "Restless", mood: "anxious" },
  { id: "good", label: "Good", mood: "calm" },
] as const;

export function TodayCard({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const chip = STATE_CHIPS.find((c) => c.id === selected);
  const top = chip
    ? SmartPatternRecommendations.getRecommendations({
        currentMood: chip.mood,
        timeOfDay: new Date().getHours(),
        userLevel: "beginner",
        sessionType: "classic",
      })[0]
    : null;

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      <p className="text-sm font-medium text-muted-foreground mb-3">What do you need today?</p>
      <div className="flex flex-wrap justify-center gap-2">
        {STATE_CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c.id === selected ? null : c.id)}
            aria-pressed={selected === c.id}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
              selected === c.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-foreground border border-border hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {top && (
        <div className="fade-up mt-5 text-left">
          <ContextCards
            chunks={[
              {
                title: `${top.pattern.name} · works in ${top.timeToEffect}`,
                body: top.reason,
                source: "Your check-in · breath science",
              },
            ]}
          />
          <div className="mt-4 text-center">
            <Button
              size="lg"
              className="btn-premium rounded-full px-8"
              onClick={() => navigate("/patterns")}
            >
              Start {top.pattern.name}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodayCard;
