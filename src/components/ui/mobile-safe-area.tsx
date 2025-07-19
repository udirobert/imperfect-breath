import React from "react";
import { cn } from "@/lib/utils";

interface MobileSafeAreaProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * Component that handles mobile safe areas (notches, home indicators, etc.)
 */
export const MobileSafeArea: React.FC<MobileSafeAreaProps> = ({
  children,
  className,
  top = false,
  bottom = false,
  left = false,
  right = false,
}) => {
  return (
    <div
      className={cn(
        className,
        top && "safe-area-pt",
        bottom && "safe-area-pb",
        left && "pl-[env(safe-area-inset-left)]",
        right && "pr-[env(safe-area-inset-right)]"
      )}
    >
      {children}
    </div>
  );
};

export default MobileSafeArea;