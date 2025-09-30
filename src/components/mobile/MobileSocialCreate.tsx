/**
 * Premium Lens-Focused Mobile Sharing - Mindful Social Creation
 *
 * ENHANCEMENT FIRST: Lens-first premium sharing experience for wellness content
 * CLEAN: Focused solely on Lens Protocol for authentic community building
 * MODULAR: Reuses PersonalizedTemplates with breathing-specific content
 * PREMIUM: Sophisticated UI that aligns with luxury wellness aesthetic
 */

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Copy,
  X,
  Send,
  Wind,
  Clock,
  Target,
  Share2,
  Trophy,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { useLens } from "../../hooks/useLens";
import { PersonalizedTemplates } from "../../lib/social/PersonalizedTemplates";
import {
  triggerPremiumHaptic,
  showPremiumFeedback,
} from "../ui/premium-interactions";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

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
  prefilledStats,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history } = useSessionHistory();
  const [postText, setPostText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "lens",
  ]);

  // Calculate user stats
  const stats: SessionStats = useMemo(
    () => ({
      totalSessions: history.length,
      totalMinutes: history.reduce(
        (acc, h) => acc + (h.session_duration || 5),
        0,
      ),
      currentStreak: Math.min(history.length, 7), // Simplified streak calculation
      favoritePattern:
        history.length > 0 ? history[0].pattern_name : "Box Breathing",
      lastSessionScore: 85,
      weeklyGoalProgress: Math.min((history.length / 7) * 100, 100),
      ...prefilledStats,
    }),
    [history, prefilledStats],
  );

  // MODULAR: Reuse PersonalizedTemplates service
  const personalizedTemplates = PersonalizedTemplates.generateTemplates(stats);
  const { postSession, isPosting } = useLens();

  const platformOptions = [
    {
      id: "lens",
      name: "Lens Protocol",
      icon: Users,
      color: "bg-slate-800 text-white border-slate-800",
      description: "Web3 community • Own your data",
      recommended: true,
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: Share2,
      color: "bg-blue-50 border-blue-200",
      description: "Broader reach • Traditional social",
      recommended: false,
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = personalizedTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPostText(template.template);
    }
  };

  const handleShare = useCallback(async () => {
    if (!user) {
      triggerPremiumHaptic("gentle");
      showPremiumFeedback("Sign in to share with the community");
      navigate("/auth?context=social-share&source=mobile-share");
      return;
    }

    if (!postText.trim()) {
      triggerPremiumHaptic("gentle");
      showPremiumFeedback("Add a message to share your progress");
      return;
    }

    setIsSharing(true);
    triggerPremiumHaptic("gentle");

    try {
      const result = await postSession(
        postText.trim(),
        stats.lastSessionScore || 85,
        stats.favoritePattern || "Box Breathing",
      );

      if (result.success) {
        triggerPremiumHaptic("gentle");
        toast.success("Shared to Lens community", {
          duration: 3000,
          style: {
            background: "rgba(248, 250, 252, 0.95)",
            color: "#1e293b",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            backdropFilter: "blur(12px)",
          },
        });

        if (onClose) {
          onClose();
        } else {
          navigate("/community");
        }
      } else {
        throw new Error(result.error || "Failed to share");
      }
    } catch (error) {
      triggerPremiumHaptic("gentle");
      console.error("Lens sharing failed:", error);
      showPremiumFeedback("Unable to share right now. Please try again.");
    } finally {
      setIsSharing(false);
    }
  }, [user, postText, stats, postSession, onClose, navigate]);

  const handleCopyText = useCallback(() => {
    triggerPremiumHaptic("subtle");
    navigator.clipboard.writeText(postText);
    showPremiumFeedback("Text copied to clipboard");
  }, [postText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-slate-600 rounded-full" />
            <h1 className="text-xl font-medium text-slate-800">
              Share Progress
            </h1>
          </div>
          <p className="text-sm text-slate-600">
            Connect with fellow practitioners
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              triggerPremiumHaptic("subtle");
              onClose();
            }}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Lens Community Context */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Lens Community</h3>
                <p className="text-sm text-slate-600">
                  Share with 1,200+ practitioners
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-medium text-slate-800">
                  {stats.totalSessions}
                </p>
                <p className="text-xs text-slate-600">Sessions</p>
              </div>
              <div>
                <p className="text-lg font-medium text-slate-800">
                  {stats.currentStreak}
                </p>
                <p className="text-xs text-slate-600">Day Streak</p>
              </div>
              <div>
                <p className="text-lg font-medium text-slate-800">
                  {Math.round(stats.totalMinutes / 60)}h
                </p>
                <p className="text-xs text-slate-600">Mindful Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mindful Templates */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-lg text-slate-800">
                Breathing Insights
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalizedTemplates.slice(0, 3).map((template) => (
              <Button
                key={template.id}
                variant={
                  selectedTemplate === template.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleTemplateSelect(template.id)}
                className={cn(
                  "h-auto p-3 text-left justify-start",
                  selectedTemplate === template.id
                    ? "bg-slate-800 text-white"
                    : "border-slate-200 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-shrink-0">
                    {template.icon === "Trophy" && (
                      <Trophy className="h-4 w-4" />
                    )}
                    {template.icon === "Sparkles" && (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {template.icon === "Heart" && <Heart className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {template.title}
                    </p>
                    <p className="text-xs opacity-75 truncate">
                      {template.template.substring(0, 50)}...
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Post Editor */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-lg text-slate-800">
                Your Message
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share your mindful breathing experience..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={4}
              className="resize-none text-base border-slate-200 focus:border-slate-400"
            />

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{postText.length}/280</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="border-slate-200 text-slate-600"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Selection - Lens Priority */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-lg text-slate-800">Share To</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {platformOptions.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);

              return (
                <div
                  key={platform.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all duration-300 cursor-pointer",
                    isSelected
                      ? platform.id === "lens"
                        ? "bg-slate-800 border-slate-800 text-white"
                        : "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-200 hover:border-slate-300",
                  )}
                  onClick={() => {
                    triggerPremiumHaptic("subtle");
                    setSelectedPlatforms((prev) =>
                      isSelected
                        ? prev.filter((p) => p !== platform.id)
                        : [...prev, platform.id],
                    );
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isSelected
                          ? platform.id === "lens"
                            ? "bg-white/20"
                            : "bg-blue-100"
                          : "bg-slate-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isSelected
                            ? platform.id === "lens"
                              ? "text-white"
                              : "text-blue-600"
                            : "text-slate-600",
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{platform.name}</h4>
                        {platform.recommended && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700"
                          >
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm",
                          isSelected
                            ? platform.id === "lens"
                              ? "text-white/80"
                              : "text-blue-700"
                            : "text-slate-600",
                        )}
                      >
                        {platform.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle
                        className={cn(
                          "h-5 w-5",
                          platform.id === "lens"
                            ? "text-white"
                            : "text-blue-600",
                        )}
                      />
                    )}
                  </div>
                </div>
              );
            })}
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
                      setSelectedPlatforms((prev) =>
                        isSelected
                          ? prev.filter((p) => p !== platform.id)
                          : [...prev, platform.id],
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
          disabled={
            isSharing || !postText.trim() || selectedPlatforms.length === 0
          }
          className="w-full bg-slate-800 hover:bg-slate-900 text-white transition-all duration-300"
          size="lg"
        >
          {isSharing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Sharing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Share to{" "}
              {selectedPlatforms.includes("lens")
                ? "Lens Community"
                : "Selected Platforms"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        {/* Auth Prompt */}
        {!user && (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-slate-800 mb-2">
                Join the Community
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Sign in to share your progress with fellow practitioners on Lens
              </p>
              <Button
                onClick={() =>
                  navigate("/auth?context=social-share&source=mobile-share")
                }
                className="bg-slate-800 hover:bg-slate-900 text-white"
              >
                Connect & Share
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MobileSocialCreate;
