/**
 * Unified PatternCard Component
 *
 * SINGLE SOURCE OF TRUTH for all pattern card displays.
 * Replaces: src/components/marketplace/PatternCard.tsx + src/components/social/PatternCard.tsx
 *
 * Design Principles:
 * - DRY: No duplication - one component for all contexts
 * - CLEAN: Context-aware rendering with variant props
 * - MODULAR: Composable features that can be enabled/disabled
 * - PERFORMANT: Optimized re-renders with proper memoization
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { DemoIndicator } from "../../ui/demo-badge";
import {
  Play,
  Star,
  Clock,
  Users,
  Heart,
  Brain,
  Target,
  Zap,
  Moon,
  Award,
  Video,
  Volume2,
  DollarSign,
  Crown,
  Eye,
  Download,
  Share2,
  Bookmark,
} from "lucide-react";

import { SocialActions } from "../../social/SocialActions";
import type { PatternCardProps } from "./types";
import {
  VARIANT_CONFIGS,
  SIZE_STYLES,
  CATEGORY_ICONS,
  DIFFICULTY_COLORS,
} from "./variants";

// Icon mapping for dynamic imports
const ICON_MAP = {
  Heart,
  Moon,
  Zap,
  Target,
  Award,
  Brain,
} as const;

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  variant = "marketplace",
  size,
  customConfig,
  className = "",
  onPlay,
  onPreview,
  onLicense,
  onLike,
  onShare,
  onComment,
  onBookmark,
  onReport,
  isLiked = false,
  isLoading = false,
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  // Merge variant config with custom overrides
  const config = useMemo(
    () => ({
      ...VARIANT_CONFIGS[variant],
      ...(size && { size }),
      ...customConfig,
    }),
    [variant, size, customConfig]
  );

  // Get size-specific styles
  const sizeStyles = SIZE_STYLES[config.size];

  // Get category icon
  const categoryKey = pattern.category as keyof typeof CATEGORY_ICONS;
  const iconName = CATEGORY_ICONS[categoryKey] || "Heart";
  const CategoryIcon = ICON_MAP[iconName as keyof typeof ICON_MAP] || Heart;

  // Utility functions
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(4)} ${currency}`;
  };

  const getCreatorInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Action handlers with loading state
  const handlePrimaryAction = async () => {
    if (localLoading || isLoading) return;

    setLocalLoading(true);
    try {
      if (variant === "marketplace" && onPlay) {
        await onPlay(pattern);
      } else if (variant === "social" && onPreview) {
        await onPreview(pattern);
      } else if (onPlay) {
        await onPlay(pattern);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLicense = async () => {
    if (!onLicense || localLoading) return;
    setLocalLoading(true);
    try {
      await onLicense(pattern);
    } finally {
      setLocalLoading(false);
    }
  };

  // Safe property access with fallbacks
  const creatorName =
    pattern.instructorName || pattern.creatorName || pattern.creator;
  const creatorAvatar = pattern.instructorAvatar || pattern.creatorAvatar;
  const rating = pattern.rating || 0;
  const reviewCount = pattern.reviews || 0;
  const sessionCount = pattern.sessionCount || 0;

  return (
    <Card
      className={`
      ${sizeStyles.cardHeight} 
      transition-all hover:shadow-lg 
      ${pattern.featured ? "ring-2 ring-blue-500" : ""} 
      ${className}
    `}
    >
      <CardHeader className={sizeStyles.headerPadding}>
        {/* Header with Creator Info */}
        <div className="flex items-start justify-between">
          {config.showCreator && (
            <div className="flex items-center gap-3">
              <Avatar className={sizeStyles.avatarSize}>
                <AvatarImage src={creatorAvatar} />
                <AvatarFallback>
                  {getCreatorInitials(creatorName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle
                  className={`${sizeStyles.titleSize} group-hover:text-primary transition-colors line-clamp-1`}
                >
                  {pattern.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  by {creatorName}
                </p>
              </div>
            </div>
          )}

          {!config.showCreator && (
            <div className="flex-1">
              <CardTitle className={`${sizeStyles.titleSize} line-clamp-1`}>
                {pattern.name}
              </CardTitle>
            </div>
          )}

          {/* Status badges and pricing */}
          <div className="flex items-center gap-2">
            {pattern.is_demo && <DemoIndicator isDemo={true} />}
            {pattern.featured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
            {pattern.licensed && (
              <Badge variant="outline" className="text-xs">
                Licensed
              </Badge>
            )}

            {config.showPricing && pattern.licenseSettings?.commercialUse && (
              <div className="flex items-center gap-1 text-primary font-medium">
                <DollarSign className="h-4 w-4" />
                {pattern.licenseSettings.price} USDC
              </div>
            )}

            {config.showPricing && pattern.price && (
              <span className="text-lg font-bold">
                {formatPrice(pattern.price, pattern.currency || "ETH")}
              </span>
            )}

            {config.showPricing &&
              !pattern.licenseSettings?.commercialUse &&
              !pattern.price && <Badge variant="secondary">Free</Badge>}
          </div>
        </div>

        {/* Stats Row */}
        {config.showStats && (
          <div className="flex items-center gap-4 text-sm">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
                {reviewCount > 0 && (
                  <span className="text-muted-foreground">({reviewCount})</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-muted-foreground">
              {pattern.downloads && (
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  <span>{formatCount(pattern.downloads)}</span>
                </div>
              )}
              {pattern.views && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{formatCount(pattern.views)}</span>
                </div>
              )}
              {sessionCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{formatCount(sessionCount)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={sizeStyles.contentPadding}>
        {/* Description */}
        {config.showDescription && (
          <p
            className={`text-sm text-muted-foreground mb-3 line-clamp-${config.maxDescriptionLines}`}
          >
            {pattern.description}
          </p>
        )}

        {/* Tags */}
        {config.showTags && pattern.tags && pattern.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pattern.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {pattern.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{pattern.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Pattern Details */}
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <CategoryIcon className="h-4 w-4" />
              <span className="capitalize">{pattern.category}</span>
            </div>
            <Badge
              variant="outline"
              className={`${
                DIFFICULTY_COLORS[
                  pattern.difficulty as keyof typeof DIFFICULTY_COLORS
                ]
              }`}
            >
              {pattern.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(pattern.duration)}</span>
          </div>
        </div>

        {/* Media badges */}
        {pattern.mediaContent && (
          <div className="flex items-center gap-2 mb-3">
            {pattern.mediaContent.instructionalVideo && (
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <Video className="h-3 w-3" />
                Video
              </Badge>
            )}
            {pattern.mediaContent.audio && (
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <Volume2 className="h-3 w-3" />
                Audio
              </Badge>
            )}
          </div>
        )}

        {/* Social Actions */}
        {config.showSocialActions &&
          onLike &&
          onShare &&
          onComment &&
          onBookmark &&
          onReport && (
            <div className="mb-3">
              <SocialActions
                pattern={pattern}
                onLike={async (patternId: string) => {
                  const result = onLike(patternId);
                  if (result instanceof Promise) {
                    await result;
                  }
                }}
                onShare={async (pat: any) => {
                  const result = onShare(pat);
                  if (result instanceof Promise) {
                    await result;
                  }
                }}
                onComment={async (patternId: string, comment: string) => {
                  const result = onComment(patternId, comment);
                  if (result instanceof Promise) {
                    await result;
                  }
                }}
                onBookmark={async (patternId: string) => {
                  const result = onBookmark(patternId);
                  if (result instanceof Promise) {
                    await result;
                  }
                }}
                onReport={async (patternId: string, reason: string) => {
                  const result = onReport(patternId, reason);
                  if (result instanceof Promise) {
                    await result;
                  }
                }}
                showCounts={config.size !== "compact"}
                compact={config.size === "compact"}
              />
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrimaryAction}
            disabled={localLoading || isLoading}
            className="flex-1 flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {config.actionButtonText}
          </Button>

          {/* Secondary actions */}
          {variant === "marketplace" && onLike && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLike(pattern.id as string);
              }}
              className={`${isLiked ? "text-red-500 border-red-500" : ""}`}
              disabled={!pattern.id}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>
          )}

          {variant === "social" && onLicense && pattern.price && (
            <Button
              variant="outline"
              onClick={handleLicense}
              disabled={localLoading || isLoading}
            >
              License
            </Button>
          )}
        </div>

        {/* Usage Stats Footer (marketplace specific) */}
        {variant === "marketplace" && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {typeof sessionCount === "number"
                  ? sessionCount.toLocaleString()
                  : "0"}{" "}
                sessions
              </span>
            </div>
            {pattern.licenseSettings?.commercialUse && (
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                <span>Premium</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Social Actions for Compact Mode */}
        {config.size === "compact" && config.showSocialActions && (
          <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t">
            <button
              onClick={() => onLike?.(pattern.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Heart
                className={`h-3 w-3 ${
                  pattern.isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              {pattern.likes || 0}
            </button>

            <button
              onClick={() => onShare?.(pattern)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
            >
              <Share2 className="h-3 w-3" />
              {pattern.shares || 0}
            </button>

            <button
              onClick={() => onBookmark?.(pattern.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-yellow-500 transition-colors"
            >
              <Bookmark
                className={`h-3 w-3 ${
                  pattern.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""
                }`}
              />
              Save
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatternCard;
