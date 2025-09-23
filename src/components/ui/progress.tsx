
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  showLabel?: boolean;
  labelPosition?: "top" | "bottom" | "inside";
  colorScheme?: "default" | "match" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({
  className,
  value,
  indicatorClassName,
  showLabel = false,
  labelPosition = "top",
  colorScheme = "default",
  size = "md",
  ...props
}, ref) => {
  // Determine color classes based on color scheme and value
  const getColorClasses = () => {
    if (colorScheme === "match" && value !== null && value !== undefined) {
      // Color-coded match visualization
      if (value >= 85) return "bg-green-500"; // High match
      if (value >= 70) return "bg-blue-500"; // Medium-high match
      if (value >= 50) return "bg-yellow-500"; // Medium match
      return "bg-gray-400"; // Low match
    }

    if (colorScheme === "success") return "bg-green-500";
    if (colorScheme === "warning") return "bg-yellow-500";
    if (colorScheme === "error") return "bg-red-500";

    return "bg-primary"; // Default
  };

  // Size variants
  const sizeClasses = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6"
  };

  const progressValue = Math.min(Math.max(value || 0, 0), 100);

  return (
    <div className="space-y-1">
      {showLabel && labelPosition === "top" && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Match</span>
          <span className="font-medium">{Math.round(progressValue)}%</span>
        </div>
      )}

      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            getColorClasses(),
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - progressValue}%)` }}
        />

        {showLabel && labelPosition === "inside" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {Math.round(progressValue)}%
          </div>
        )}
      </ProgressPrimitive.Root>

      {showLabel && labelPosition === "bottom" && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Match</span>
          <span className="font-medium">{Math.round(progressValue)}%</span>
        </div>
      )}
    </div>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
