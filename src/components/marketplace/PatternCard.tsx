/**
 * Marketplace Pattern Card Component
 *
 * MIGRATED: Now uses unified PatternCard component with marketplace variant
 * This maintains backward compatibility while using the consolidated component
 */

import React from "react";
import { PatternCard as UnifiedPatternCard } from "../composite/PatternCard";
import type { EnhancedCustomPattern } from "../../types/patterns";

interface PatternCardProps {
  pattern: EnhancedCustomPattern & { is_demo?: boolean };
  onPlay: (pattern: EnhancedCustomPattern) => void;
  onLike?: (patternId: string) => void;
  isLiked?: boolean;
  showPrice?: boolean;
}

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  onPlay,
  onLike,
  isLiked = false,
  showPrice = true,
}) => {
  return (
    <UnifiedPatternCard
      pattern={pattern}
      variant="marketplace"
      onPlay={onPlay}
      onLike={onLike}
      isLiked={isLiked}
      customConfig={{
        showPricing: showPrice,
      }}
    />
  );
};
