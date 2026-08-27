/**
 * TaskPipeline — status rows with spinner → check/fail (+ retry).
 * Adapted from the agentic TaskRows primitive.
 *
 * Brume use: the proof-of-practice pipeline made visible —
 *   Session verified ✓ → Score recorded ✓ → On-chain credential (pending/retry)
 * Honest states only: a row is 'done' when it actually happened.
 */
import React from "react";
import { cn } from "@/lib/utils";

export type TaskStatus = "pending" | "active" | "done" | "failed";

export interface PipelineRow {
  key: string;
  label: string;
  meta?: string;
  status: TaskStatus;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  if (status === "done") {
    return (
      <span className="pop-in flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="pop-in flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3.5" strokeLinecap="round" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="trace-spin flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border border-t-foreground" />
    );
  }
  return <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border" />;
}

export function TaskPipeline({
  rows,
  onRetry,
  className,
}: {
  rows: PipelineRow[];
  onRetry?: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      {rows.map((row, i) => (
        <div
          key={row.key}
          className="fade-up flex min-h-9 items-center gap-2.5 rounded-lg px-2 py-1"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <StatusBadge status={row.status} />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[12.5px]",
              row.status === "pending" ? "text-muted-foreground" : "font-medium text-foreground",
            )}
          >
            {row.label}
          </span>
          {row.meta && (
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">{row.meta}</span>
          )}
          {row.status === "failed" && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(row.key)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-500/20"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
              </svg>
              Retry
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default TaskPipeline;
