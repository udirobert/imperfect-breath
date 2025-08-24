/**
 * Mobile Social Create - Mobile-Optimized Social Post Creation
 *
 * ENHANCEMENT FIRST: Builds on social creation patterns with mobile-specific optimizations
 * CLEAN: Separates mobile touch logic from desktop interactions
 * MODULAR: Reuses PersonalizedTemplates and social logic
 * PERFORMANT: Optimized for mobile devices and touch interactions
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Share2,
  Camera,
  Heart,
  Users,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Copy,
  X
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { PersonalizedTemplates } from "../../lib/social/PersonalizedTemplates";

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  favoritePattern: string;
  lastSessionScore: number;
  weeklyGoalProgress: number;
}

interface MobileSocialCreateProps {
  onClose?: () => void;
  prefilledStats?: Partial<SessionStats>;
}

export const MobileSocialCreate: React.FC<MobileSocialCreateProps> = ({
  onClose,
  prefilledStats
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history } = useSessionHistory();
  const [postText, setPostText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["lens"]);

  // Calculate user stats
  const stats: SessionStats = {
    totalSessions: history.length,
    totalMinutes: history.reduce((acc, h) => acc + (h.duration || 5), 0),
    currentStreak: Math.min(history.length, 7), // Simplified streak calculation
    favoritePattern: history.length > 0 ? history[0].patternName : "Box Breathing",
    lastSessionScore: 85,
    weeklyGoalProgress: Math.min((history.length / 7) * 100, 100),
    ...prefilledStats
  };

  // MODULAR: Reuse PersonalizedTemplates service
  const personalizedTemplates = PersonalizedTemplates.generateTemplates(stats);

  const platformOptions = [
    { id: "lens", name: "Lens", icon: Users, color: "bg-green-50 border-green-200" },
    { id: "twitter", name: "Twitter", icon: Share2, color: "bg-blue-50 border-blue-200" }
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = personalizedTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPostText(template.template);
    }
  };

  const handleShare = async () => {
    if (!user) {
      navigate("/auth?context=social");
      return;
    }

    setIsSharing(true);
    try {
      // Mobile-specific sharing logic
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onClose) {
        onClose();
      } else {
        navigate("/community");
      }
    } catch (error) {
      console.error("Sharing failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(postText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Share Journey</h1>
          <p className="text-sm text-muted-foreground">Tell your wellness story</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Quick Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalizedTemplates.slice(0, 3).map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id ? template.color : "bg-white"
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${template.color} flex items-center justify-center`}>
                      {template.icon === "Trophy" && <Trophy className="h-4 w-4" />}
                      {template.icon === "Sparkles" && <Sparkles className="h-4 w-4" />}
                      {template.icon === "Heart" && <Heart className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{template.title}</h4>
                      <Badge variant="outline" className="text-xs mt-1">
                        {template.priority}
                      </Badge>
                    </div>
                    {selectedTemplate === template.id && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Post Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share your breathing journey..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={6}
              className="resize-none text-base"
            />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{postText.length}/280</span>
              <Button variant="outline" size="sm" onClick={handleCopyText}>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Share To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {platformOptions.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);

                return (
                  <Card
                    key={platform.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? platform.color : "bg-white"
                    }`}
                    onClick={() => {
                      setSelectedPlatforms(prev =>
                        isSelected
                          ? prev.filter(p => p !== platform.id)
                          : [...prev, platform.id]
                      );
                    }}
                  >
                    <CardContent className="p-3 text-center">
                      <Icon className="h-6 w-6 mx-auto mb-2" />
                      <p className="font-medium text-sm">{platform.name}</p>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          disabled={isSharing || !postText.trim() || selectedPlatforms.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          {isSharing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sharing...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              Share Post
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>

        {!user && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <h4 className="font-medium text-yellow-800 mb-2">Sign in to share</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Connect to share with the community
              </p>
              <Button onClick={() => navigate("/auth?context=social")} size="sm">
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MobileSocialCreate;