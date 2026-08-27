/**
 * Sparkline — dependency-free inline SVG trend line.
 * The lightweight answer to InsightCards' liveline dependency:
 * same glanceable trend, zero bundle cost.
 */
import React, { useId } from "react";
import { cn } from "@/lib/utils";

export function Sparkline({
  points,
  width = 260,
  height = 56,
  className,
}: {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const gradientId = useId();
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((v, i) => [
    i * stepX,
    height - 4 - ((v - min) / range) * (height - 8),
  ] as const);

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full", className)}
      role="img"
      aria-label={`Trend from ${points[0]} to ${points[points.length - 1]}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill="hsl(var(--primary))" />
    </svg>
  );
}

export default Sparkline;
