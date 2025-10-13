/**
 * CONSOLIDATED: Enhanced existing Badge component for recommendations
 * ENHANCEMENT FIRST: Builds on existing UI patterns
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Star,
  Zap,
  Heart,
  Moon,
  Focus,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecommendationCardProps {
  patternId: string;
  pattern: {
    name: string;
    description?: string;
    benefits?: string[];
  };
  confidence: number;
  reason: string;
  timeToEffect: string;
  badge: string;
  explanation?: string;
  trend?: 'rising' | 'stable' | 'declining';
  bestFor?: string[];
  priority?: 'high' | 'medium' | 'low';
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showConfidenceIndicator?: boolean;
  className?: string;
}

// CLEAN: Visual confidence indicators instead of confusing percentages
const getConfidenceIndicator = (confidence: number, priority?: string) => {
  if (confidence >= 0.9 || priority === 'high') {
    return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' };
  }
  if (confidence >= 0.8) {
    return { icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' };
  }
  if (confidence >= 0.7) {
    return { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50' };
  }
  return { icon: Heart, color: 'text-gray-500', bg: 'bg-gray-50' };
};

// ORGANIZED: Pattern type icons
const getPatternIcon = (patternId: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    box: Focus,
    relaxation: Heart,
    energy: Zap,
    sleep: Moon,
    mindfulness: Sparkles,
    wim_hof: TrendingUp,
  };
  return iconMap[patternId] || Focus;
};

// PREMIUM: Badge variant based on priority and confidence using premium system
const getPremiumBadgeVariant = (confidence: number, priority?: string, index?: number): "perfect" | "excellent" | "great" | "good" | "recommended" => {
  if (index === 0 || priority === 'high' || confidence >= 0.9) {
    return 'perfect';
  }
  if (confidence >= 0.85) {
    return 'excellent';
  }
  if (confidence >= 0.75) {
    return 'great';
  }
  if (confidence >= 0.65) {
    return 'good';
  }
  return 'recommended';
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  patternId,
  pattern,
  confidence,
  reason,
  timeToEffect,
  badge,
  explanation,
  trend,
  bestFor,
  priority,
  onClick,
  variant = 'default',
  showConfidenceIndicator = true,
  className,
}) => {
  const PatternIcon = getPatternIcon(patternId);
  const confidenceIndicator = getConfidenceIndicator(confidence, priority);
  const ConfidenceIcon = confidenceIndicator.icon;

  if (variant === 'compact') {
    return (
      <Button
        variant="outline"
        onClick={onClick}
        className={cn(
          "h-auto p-3 flex items-center gap-3 hover:bg-muted/50 justify-start w-full",
          className
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          confidenceIndicator.bg
        )}>
          <PatternIcon className={cn("h-4 w-4", confidenceIndicator.color)} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{pattern.name}</span>
            <PremiumBadge 
              variant={getPremiumBadgeVariant(confidence, priority, 0)}
              size="sm"
            >
              {badge}
            </PremiumBadge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {reason}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn("w-full hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  confidenceIndicator.bg
                )}>
                  <PatternIcon className={cn("h-5 w-5", confidenceIndicator.color)} />
                </div>
                <div>
                  <h3 className="font-semibold">{pattern.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pattern.description}
                  </p>
                </div>
              </div>
              {showConfidenceIndicator && (
                <div className="flex items-center gap-1">
                  <ConfidenceIcon className={cn("h-4 w-4", confidenceIndicator.color)} />
                  <PremiumBadge 
                    variant={getPremiumBadgeVariant(confidence, priority, 0)}
                    size="sm"
                  >
                    {badge}
                  </PremiumBadge>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{timeToEffect} to effect</span>
                {trend === 'rising' && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending up
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{reason}</p>
              {explanation && (
                <p className="text-xs text-muted-foreground">{explanation}</p>
              )}
            </div>

            {/* Best for tags */}
            {bestFor && bestFor.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {bestFor.slice(0, 3).map((benefit) => (
                  <Badge key={benefit} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action */}
            {onClick && (
              <Button onClick={onClick} className="w-full">
                Start {pattern.name}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          confidenceIndicator.bg
        )}>
          <PatternIcon className={cn("h-4 w-4", confidenceIndicator.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{pattern.name}</span>
            <PremiumBadge 
              variant={getPremiumBadgeVariant(confidence, priority, 0)}
              size="sm"
            >
              {badge}
            </PremiumBadge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{reason}</span>
            <span>•</span>
            <Clock className="h-3 w-3" />
            <span>{timeToEffect}</span>
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};

export default RecommendationCard;