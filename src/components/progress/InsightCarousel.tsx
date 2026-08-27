/**
 * InsightCarousel — "Insights N ‹ ›" pattern from the agentic InsightCards
 * primitive, rebuilt dependency-free on the Sparkline primitive.
 *
 * Brume use: the Progress page stops being a stats wall and starts *saying*
 * something — each card is one honest observation computed from real session
 * history, with a trend line and a follow-up action. No data, no card:
 * insights are earned, never padded.
 */
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { parseISO, differenceInCalendarDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/primitives/Sparkline";

interface SessionLike {
  created_at: string;
  session_duration: number | null;
  restlessness_score: number | null;
  pattern_name: string | null;
}

interface Insight {
  key: string;
  prose: string;
  points: number[];
  valueLabel: string;
  pill: string;
  pillTo: string;
}

function dailySeries(history: SessionLike[], days: number, pick: (s: SessionLike) => number): number[] {
  const today = new Date();
  const buckets = new Array(days).fill(0);
  for (const s of history) {
    const d = differenceInCalendarDays(today, parseISO(s.created_at));
    if (d >= 0 && d < days) buckets[days - 1 - d] += pick(s);
  }
  return buckets;
}

function buildInsights(history: SessionLike[], streak: number, preferredPattern: string): Insight[] {
  const out: Insight[] = [];

  // 1 — Weekly practice momentum
  const minutes = dailySeries(history, 14, (s) => (s.session_duration ?? 0) / 60);
  const thisWeek = minutes.slice(7).reduce((a, b) => a + b, 0);
  const lastWeek = minutes.slice(0, 7).reduce((a, b) => a + b, 0);
  if (thisWeek > 0) {
    const delta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
    out.push({
      key: "momentum",
      prose:
        delta !== null
          ? `You practiced ${Math.round(thisWeek)} minutes this week — ${delta >= 0 ? "up" : "down"} ${Math.abs(delta)}% on last week.`
          : `You practiced ${Math.round(thisWeek)} minutes this week. Your baseline starts now.`,
      points: minutes,
      valueLabel: `${Math.round(thisWeek)} min this week`,
      pill: "Practice today",
      pillTo: "/session",
    });
  }

  // 2 — Calm trend (restlessness: lower is better)
  const calmRaw = history.filter((s) => typeof s.restlessness_score === "number");
  if (calmRaw.length >= 4) {
    const calm = dailySeries(calmRaw, 14, (s) => s.restlessness_score ?? 0);
    const recent = calm.slice(7).filter((v) => v > 0);
    const prior = calm.slice(0, 7).filter((v) => v > 0);
    if (recent.length && prior.length) {
      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      const down = avg(recent) < avg(prior);
      out.push({
        key: "calm",
        prose: down
          ? "Your restlessness is trending down — sessions are settling you faster than last week."
          : "Restlessness is running higher lately. Shorter, more frequent sessions usually beat heroic ones.",
        points: calm,
        valueLabel: down ? "Calmer lately" : "More restless lately",
        pill: down ? "Keep the rhythm" : "Try a 3-minute reset",
        pillTo: "/session",
      });
    }
  }

  // 3 — Streak / rhythm
  if (streak >= 2) {
    out.push({
      key: "streak",
      prose: `${streak} days in a row${preferredPattern && preferredPattern !== "None" ? `, mostly with ${preferredPattern}` : ""}. The streak is the credential — protect it.`,
      points: dailySeries(history, 14, () => 1),
      valueLabel: `${streak}-day streak`,
      pill: "Protect the streak",
      pillTo: "/session",
    });
  }

  return out;
}

export function InsightCarousel({
  history,
  streak,
  preferredPattern,
}: {
  history: SessionLike[];
  streak: number;
  preferredPattern: string;
}) {
  const insights = useMemo(
    () => buildInsights(history, streak, preferredPattern),
    [history, streak, preferredPattern],
  );
  const [page, setPage] = useState(0);

  if (insights.length === 0) return null;
  const insight = insights[page % insights.length];
  const move = (dir: -1 | 1) => setPage((c) => (c + dir + insights.length) % insights.length);

  return (
    <Card className="w-full max-w-5xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold">Insights</span>
            <span className="text-sm text-muted-foreground tabular-nums">{insights.length}</span>
          </span>
          {insights.length > 1 && (
            <span className="flex items-center gap-0.5">
              {(["M15 18l-6-6 6-6", "M9 6l6 6-6 6"] as const).map((d, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={i === 0 ? "Previous insight" : "Next insight"}
                  onClick={() => move(i === 0 ? -1 : 1)}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={d} />
                  </svg>
                </button>
              ))}
            </span>
          )}
        </div>

        <p className="text-[13px] leading-relaxed text-muted-foreground">{insight.prose}</p>

        <div className="mt-3 rounded-lg bg-muted/50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Last 14 days</span>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10.5px] font-medium text-foreground shadow-sm">
              {insight.valueLabel}
            </span>
          </div>
          <Sparkline points={insight.points} />
        </div>

        <Link
          to={insight.pillTo}
          className="mt-3 inline-block rounded-full bg-card px-3 py-1.5 text-[12px] text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          {insight.pill} →
        </Link>
      </CardContent>
    </Card>
  );
}

export default InsightCarousel;
