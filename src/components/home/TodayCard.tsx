/**
 * TodayCard — "What do you need today?" on the Home surface.
 *
 * One-tap entry: tap a state → session starts immediately. The reason
 * ("Box Breathing · works in ~2 min · calms the vagus nerve") is passed
 * as location state to the session preview, where it shows as a brief
 * caption before the session begins. No intermediate card, no second
 * button — the state check-in IS the first step of the session.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
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

  const handleStateSelect = (mood: "stressed" | "anxious" | "tired" | "calm") => {
    const top = SmartPatternRecommendations.getRecommendations({
      currentMood: mood,
      timeOfDay: new Date().getHours(),
      userLevel: "beginner",
      sessionType: "classic",
    })[0];

    if (top) {
      // Navigate immediately — the reason shows on the session preview
      navigate(`/session?pattern=${top.pattern.id}`, {
        state: {
          reason: `${top.pattern.name} · works in ${top.timeToEffect}`,
          reasonDetail: top.reason,
        },
      });
    } else {
      // Fallback: box breathing
      navigate("/session?pattern=box");
    }
  };

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
        What do you need today?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {STATE_CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleStateSelect(c.mood)}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95",
              "bg-card text-foreground border border-border",
              "hover:border-primary/40 hover:bg-primary/5 hover:scale-105",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TodayCard;
