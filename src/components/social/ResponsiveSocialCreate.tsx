/**
 * Responsive Social Create - Adaptive Social Post Creation
 *
 * ENHANCEMENT FIRST: Builds on existing social components with responsive design
 * CLEAN: Separates mobile and desktop social creation logic
 * MODULAR: Reuses MobileSocialCreate and DesktopSocialCreate components
 * DRY: Single entry point for social creation across devices
 */

import React from "react";
import { isTouchDevice } from "../../utils/mobile-detection";
import { MobileSocialCreate } from "../mobile/MobileSocialCreate";
import { DesktopSocialCreate } from "../desktop/DesktopSocialCreate";

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  favoritePattern: string;
  lastSessionScore: number;
  weeklyGoalProgress: number;
}

interface ResponsiveSocialCreateProps {
  onClose?: () => void;
  prefilledStats?: Partial<SessionStats>;
  mode?: "modal" | "page";
}

export const ResponsiveSocialCreate: React.FC<ResponsiveSocialCreateProps> = ({
  onClose,
  prefilledStats,
  mode = "page",
}) => {
  const isMobile = isTouchDevice();

  if (isMobile) {
    return (
      <MobileSocialCreate onClose={onClose} prefilledStats={prefilledStats} />
    );
  }

  return (
    <DesktopSocialCreate
      onClose={onClose}
      prefilledStats={prefilledStats}
      mode={mode}
    />
  );
};

export default ResponsiveSocialCreate;
