import React from "react";
import { cn } from "@/lib/utils";

/**
 * Short stacked-mask blur under the header — a glass lip over the mist,
 * not a white wash at the bottom of the page.
 */
export function ProgressiveBlur({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("progressive-blur-top", className)}
      aria-hidden="true"
    >
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

export default ProgressiveBlur;
