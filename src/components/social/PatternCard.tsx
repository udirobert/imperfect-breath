/**
 * Social Pattern Card Component
 *
 * MIGRATED: Now uses unified PatternCard component with social variant
 * This maintains backward compatibility while using the consolidated component
 */

import React from "react";
import { PatternCard as UnifiedPatternCard } from "../composite/PatternCard";
import type { CustomPattern } from "@/lib/ai/providers";

interface PatternCardProps {
  pattern: CustomPattern & {
    rating?: number;
    reviews?: number;
    downloads?: number;
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    bookmarks?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    featured?: boolean;
    creatorName?: string;
    creatorAvatar?: string;
    lastUpdated?: string;
    tags?: string[];
    price?: number;
    currency?: string;
    licensed?: boolean;
  };
  onPreview?: (pattern: CustomPattern) => void;
  onLicense?: (pattern: CustomPattern) => void;
  onLike?: (patternId: string) => Promise<void>;
  onShare?: (pattern: CustomPattern) => Promise<void>;
  onComment?: (patternId: string, comment: string) => Promise<void>;
  onBookmark?: (patternId: string) => Promise<void>;
  onReport?: (patternId: string, reason: string) => Promise<void>;
  showSocialActions?: boolean;
  showPricing?: boolean;
  compact?: boolean;
  className?: string;
}

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  onPreview,
  onLicense,
  onLike,
  onShare,
  onComment,
  onBookmark,
  onReport,
  showSocialActions = true,
  showPricing = false,
  compact = false,
  className = "",
}) => {
  return (
    <UnifiedPatternCard
      pattern={pattern}
      variant="social"
      size={compact ? "compact" : "standard"}
      className={className}
      onPreview={onPreview}
      onLicense={onLicense}
      onLike={onLike}
      onShare={onShare}
      onComment={onComment}
      onBookmark={onBookmark}
      onReport={onReport}
      customConfig={{
        showSocialActions,
        showPricing,
      }}
    />
  );
};
