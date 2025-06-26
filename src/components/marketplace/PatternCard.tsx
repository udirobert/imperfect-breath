/**
 * Pattern Card Component
 * Displays individual pattern information in marketplace
 */

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import type { EnhancedCustomPattern } from "@/types/patterns";

interface PatternCardProps {
  pattern: EnhancedCustomPattern;
  onPlay: (pattern: EnhancedCustomPattern) => void;
  onLike?: (patternId: string) => void;
  isLiked?: boolean;
  showPrice?: boolean;
}

const categoryIcons = {
  stress: Heart,
  sleep: Moon,
  energy: Zap,
  focus: Target,
  performance: Award,
};

const difficultyColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  onPlay,
  onLike,
  isLiked = false,
  showPrice = true,
}) => {
  const CategoryIcon =
    categoryIcons[pattern.category as keyof typeof categoryIcons] || Heart;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const getInstructorInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Mock rating and stats - in real app, these would come from the pattern data
  const rating = 4.5;
  const reviewCount = 128;
  const sessionCount = 1240;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pattern.instructorAvatar} />
              <AvatarFallback>
                {getInstructorInitials(
                  pattern.instructorName || pattern.creator
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {pattern.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {pattern.instructorName || pattern.creator}
              </p>
            </div>
          </div>

          {/* Price/Premium Badge */}
          {showPrice && pattern.licenseSettings?.isCommercial && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <DollarSign className="h-4 w-4" />
              {pattern.licenseSettings.price} {pattern.licenseSettings.currency}
            </div>
          )}

          {!pattern.licenseSettings?.isCommercial && (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p
          className="text-sm text-muted-foreground overflow-hidden text-ellipsis"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {pattern.description}
        </p>

        {/* Tags */}
        {pattern.tags && pattern.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pattern.tags.slice(0, 3).map((tag, index) => (
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

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CategoryIcon className="h-4 w-4" />
              <span className="capitalize">{pattern.category}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(pattern.duration)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
              <span>({reviewCount})</span>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`${
              difficultyColors[
                pattern.difficulty as keyof typeof difficultyColors
              ]
            }`}
          >
            {pattern.difficulty}
          </Badge>
        </div>

        {/* Features */}
        <div className="flex items-center gap-2">
          {pattern.instructionalVideo && (
            <Badge
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              <Video className="h-3 w-3" />
              Video
            </Badge>
          )}
          {pattern.guidedAudio && (
            <Badge
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              <Volume2 className="h-3 w-3" />
              Audio
            </Badge>
          )}
          {pattern.hasProgressTracking && (
            <Badge variant="outline" className="text-xs">
              Progress Tracking
            </Badge>
          )}
          {pattern.hasAIFeedback && (
            <Badge
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              <Brain className="h-3 w-3" />
              AI Feedback
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => onPlay(pattern)}
            className="flex-1 flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Try Pattern
          </Button>

          {onLike && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLike(pattern.id)}
              className={`${isLiked ? "text-red-500 border-red-500" : ""}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{sessionCount.toLocaleString()} sessions</span>
          </div>
          {pattern.licenseSettings?.isCommercial && (
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              <span>Premium</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
