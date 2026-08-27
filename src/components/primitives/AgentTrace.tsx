/**
 * AgentTrace — expandable agent trace ("Thinking" primitive), data-driven.
 *
 * Brume use: Zen's insight generation becomes a visible ritual instead of
 * dead latency — "Reading your breath rate curve → Mapping the emotional
 * arc → Writing your insight". The trace runs once, settles, and remains
 * expandable (the user can re-open the reasoning — the trust layer, visible).
 *
 * Unlike the demo original, steps are REAL data passed by the caller; timing
 * is a presentation concern only. Call `onSettled` to sequence what comes next.
 */
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TraceStep {
  label: string;
  meta?: string; // right-aligned mono detail, e.g. "4.2s"
}

const STEP_MS = 900;
const SETTLE_MS = 500;

export function AgentTrace({
  steps,
  activeLabel = "Thinking",
  doneLabel = "Done",
  onSettled,
  className,
  /** When provided, the trace is driven by real pipeline progress (0..steps.length)
   *  instead of presentation timing. */
  currentStep,
}: {
  steps: TraceStep[];
  activeLabel?: string;
  doneLabel?: string;
  onSettled?: () => void;
  className?: string;
  currentStep?: number;
}) {
  const total = steps.length + 1; // all steps, then settle beat
  const [tick, setTick] = useState(0);
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const driven = currentStep !== undefined;
  const progress = driven ? Math.min(currentStep, steps.length) : tick;
  const working = progress < steps.length;
  const expanded = manualExpanded ?? working;
  const visible = Math.min(progress, steps.length);

  useEffect(() => {
    if (driven || tick >= total) return; // presentation timing only when uncontrolled
    const t = setTimeout(() => setTick((x) => x + 1), tick === steps.length ? SETTLE_MS : STEP_MS);
    return () => clearTimeout(t);
  }, [tick, total, steps.length, driven]);

  const settledRef = useRef(false);
  useEffect(() => {
    if (working || settledRef.current) return;
    settledRef.current = true;
    onSettled?.();
  }, [working, onSettled]);

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {/* header */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setManualExpanded((current) => !(current ?? working))}
        className="-mx-1.5 flex w-fit items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-100 hover:bg-muted"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden
          fill={working ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}>
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>
        <span role="status" className="contents">
          {working ? (
            <span
              className="shimmer-label whitespace-nowrap bg-clip-text text-[13px] font-medium text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, hsl(var(--muted-foreground)) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 65%)",
                backgroundSize: "200% 100%",
              }}
            >
              {activeLabel}
            </span>
          ) : (
            <span className="fade-in text-[13px] font-medium text-muted-foreground">{doneLabel}</span>
          )}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden
          stroke="hsl(var(--muted-foreground))" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          className="transition-transform duration-300"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* expandable trace */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="relative ml-[7px] mt-1 border-l border-border pl-4">
            <div className="flex flex-col gap-1 py-1">
              {steps.slice(0, visible).map((step, i) => {
                const isCurrent = i === visible - 1 && working;
                return (
                  <div
                    key={step.label}
                    className="fade-up flex min-h-7 w-full items-center gap-2 rounded-md px-1.5 py-0.5"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {isCurrent ? (
                      <span className="trace-spin size-3 shrink-0 rounded-full border-[1.5px] border-border border-t-foreground" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden
                        stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="shrink-0">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                    <span className={cn("min-w-0 truncate text-[12.5px]", isCurrent ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {step.label}
                    </span>
                    {step.meta && (
                      <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground tabular-nums">{step.meta}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentTrace;
