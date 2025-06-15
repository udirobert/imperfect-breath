import React, { useState } from "react";
import { Star, Clock, Users, Eye, Download, Heart, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SocialActions } from "./SocialActions";
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
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    if (!onPreview || isLoading) return;
    setIsLoading(true);
    try {
      await onPreview(pattern);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLicense = async () => {
    if (!onLicense || isLoading) return;
    setIsLoading(true);
    try {
      await onLicense(pattern);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(4)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const cardHeight = compact ? "h-64" : "h-auto";

  return (
    <Card className={`${cardHeight} transition-all hover:shadow-lg ${pattern.featured ? 'ring-2 ring-blue-500' : ''} ${className}`}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        {/* Header with Creator Info */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1">
            {pattern.creatorAvatar && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={pattern.creatorAvatar} />
                <AvatarFallback>{pattern.creatorName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className={`${compact ? 'text-base' : 'text-lg'} line-clamp-1`}>
                {pattern.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                by {pattern.creatorName || pattern.creator}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {pattern.featured && (
              <Badge variant="secondary" className="text-xs">Featured</Badge>
            )}
            {pattern.licensed && (
              <Badge variant="outline" className="text-xs">Licensed</Badge>
            )}
          </div>
        </div>

        {/* Rating and Stats */}
        {!compact && (
          <div className="flex items-center gap-4 text-sm">
            {pattern.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{pattern.rating.toFixed(1)}</span>
                {pattern.reviews && (
                  <span className="text-muted-foreground">({pattern.reviews})</span>
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
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={compact ? "pt-0 pb-3" : "pt-0"}>
        {/* Description */}
        <p className={`text-sm text-muted-foreground mb-3 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
          {pattern.description}
        </p>

        {/* Tags */}
        {pattern.tags && pattern.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pattern.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
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
            <Badge variant="outline" className="capitalize">{pattern.category}</Badge>
            <Badge variant="outline" className="capitalize">{pattern.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(pattern.duration)}</span>
          </div>
        </div>

        {/* Phase Count and Last Updated */}
        <div className="text-xs text-muted-foreground mb-3">
          {pattern.phases.length} phases
          {pattern.lastUpdated && (
            <span> • Updated {formatDate(pattern.lastUpdated)}</span>
          )}
        </div>

        {/* Pricing */}
        {showPricing && pattern.price && (
          <div className="flex items-center justify-between mb-3 p-2 bg-muted rounded-lg">
            <span className="text-sm font-medium">License from</span>
            <span className="text-lg font-bold">
              {formatPrice(pattern.price, pattern.currency || 'ETH')}
            </span>
          </div>
        )}

        {/* Social Actions */}
        {showSocialActions && onLike && onShare && onComment && onBookmark && onReport && (
          <div className="mb-3">
            <SocialActions
              pattern={pattern}
              onLike={onLike}
              onShare={onShare}
              onComment={onComment}
              onBookmark={onBookmark}
              onReport={onReport}
              showCounts={!compact}
              compact={compact}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onPreview && (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={handlePreview}
              disabled={isLoading}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          )}

          {onLicense && showPricing && (
            <Button
              size={compact ? "sm" : "default"}
              onClick={handleLicense}
              disabled={isLoading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              License
            </Button>
          )}

          {!showPricing && onPreview && (
            <Button
              size={compact ? "sm" : "default"}
              onClick={handlePreview}
              disabled={isLoading}
              className="flex-1"
            >
              Start Session
            </Button>
          )}
        </div>

        {/* Quick Social Actions for Compact Mode */}
        {compact && showSocialActions && (
          <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t">
            <button
              onClick={() => onLike?.(pattern.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Heart className={`h-3 w-3 ${pattern.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
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
              <Bookmark className={`h-3 w-3 ${pattern.isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              Save
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
