/**
 * PixelLoader — pixel-grid loader for long-running work.
 * Adapted from the agentic LoadingState primitive to Brume's token system.
 *
 * Variants:
 *   drive — square cells, chevron wavefront; 650ms cycle < sweep, so two
 *           fronts are always in flight
 *   dots  — same wavefront, circular cells
 *   orbit — a comet lapping the grid perimeter
 *
 * Reduced motion freezes the grid to its dim state; the timer still ticks
 * (it's information, not decoration). Animations live in index.css.
 */
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3), c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

const PATTERNS = {
  drive: { delays: chevron, dur: 650, round: false },
  dots: { delays: chevron, dur: 650, round: true },
  orbit: { delays: orbit, dur: 950, round: false },
} as const;

export type PixelLoaderVariant = keyof typeof PATTERNS;

function LoaderGrid({ delays, dur, round }: { delays: (number | null)[]; dur: number; round: boolean }) {
  return (
    <span aria-hidden className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((delay, index) => (
        <span
          key={index}
          className={cn("pixel-cell size-[4px] bg-foreground", round ? "rounded-full" : "rounded-[1px]")}
          style={{
            opacity: delay === null ? 0.07 : 0.15,
            animation: delay === null ? "none" : `pixel-on ${dur}ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

function useElapsed() {
  const [ds, setDs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, []);
  const total = ds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

export function PixelLoader({
  label,
  variant = "drive",
  showElapsed = true,
  className,
}: {
  label?: string;
  variant?: PixelLoaderVariant;
  showElapsed?: boolean;
  className?: string;
}) {
  const elapsed = useElapsed();
  const { delays, dur, round } = PATTERNS[variant] ?? PATTERNS.drive;

  return (
    <div role="status" className={cn("flex w-fit items-center gap-2.5", className)}>
      <LoaderGrid delays={delays} dur={dur} round={round} />
      {label && (
        <span
          className="shimmer-label bg-clip-text text-[13px] font-medium text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, hsl(var(--muted-foreground)) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 65%)",
            backgroundSize: "200% 100%",
          }}
        >
          {label}
        </span>
      )}
      {showElapsed && (
        <span className="font-mono text-[12px] text-muted-foreground tabular-nums">{elapsed}</span>
      )}
    </div>
  );
}

export default PixelLoader;
