/**
 * Breathing Session Post Component
 * Updated for Lens SDK v3 with enhanced desktop sharing
 */

import React, { useState } from "react";
import { useLens } from "../../hooks/useLens";
import type { BreathingSession } from "../../lib/lens";
import type { SessionData, ShareableSessionData } from "../../lib/sharing";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Share2,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import { useShareSession } from "../../lib/sharing";
interface BreathingSessionPostProps {
  sessionData: BreathingSession;
  onPublished?: (txHash: string) => void;
  participatingChallenges?: string[];
}

export const BreathingSessionPost: React.FC<BreathingSessionPostProps> = ({
  sessionData,
  onPublished,
  participatingChallenges = [],
}) => {
  const { shareBreathingSession, isPosting, isAuthenticated, actionError } =
    useLens();
  const { shareOnTwitter, shareNative, copyToClipboard, hasNativeShare } = useShareSession();
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("lens");

  // Available challenges
  const availableChallenges = [
    {
      id: "30day",
      name: "30-Day Breathing Reset",
      hashtag: "#30DayBreathingReset",
    },
    { id: "mindful", name: "Mindful Mornings", hashtag: "#MindfulMornings" },
    { id: "evening", name: "Evening Calm", hashtag: "#EveningCalm" },
  ];

  const handlePublish = async () => {
    if (!isAuthenticated) {
      toast.error("Please connect to Lens Protocol first", {
        description: "You need to authenticate with Lens to share your session",
      });
      return;
    }

    // Validate session data
    if (!sessionData.patternName || !sessionData.duration) {
      toast.error("Invalid session data", {
        description: "Session data is incomplete and cannot be shared",
      });
      return;
    }

    try {
      setIsPublishing(true);

      // Ensure session data is properly formatted
      const formattedSessionData = {
        ...sessionData,
        // Add challenge hashtags to the session
        challenges: selectedChallenges
          .map((id) => availableChallenges.find((c) => c.id === id)?.hashtag)
          .filter(Boolean),
      };

      const result = await shareBreathingSession(formattedSessionData);

      if (!result.success) {
        throw new Error(result.error || "Failed to share session");
      }

      const txHash = result.hash || result.id || "";
      toast.success("Session shared to Lens!", {
        description: txHash
          ? `Transaction: ${txHash.slice(0, 10)}...`
          : "Your session has been posted successfully",
      });

      onPublished?.(txHash);
    } catch (error) {
      console.error("Share session error:", error);
      toast.error("Failed to share session", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const duration = Math.round(sessionData.duration / 60);
  const durationText = duration === 1 ? "1 minute" : `${duration} minutes`;

  // Get selected challenge hashtags (DRY helper)
  const getSelectedChallengeHashtags = () => {
    return selectedChallenges
      .map((id) => availableChallenges.find((c) => c.id === id)?.hashtag)
      .filter(Boolean);
  };

  // Handle Twitter/X sharing with challenge support
  const handleTwitterShare = () => {
    const challengeHashtags = getSelectedChallengeHashtags();
      
    // Convert BreathingSession to SessionData
    const sessionDataForSharing: SessionData = {
      patternName: sessionData.patternName,
      sessionDuration: sessionData.duration,
      breathHoldTime: sessionData.breathHoldTime || 0,
      restlessnessScore: sessionData.restlessnessScore || 0,
      timestamp: sessionData.timestamp,
    };

    shareOnTwitter(sessionDataForSharing, { 
      tone: 'mindful',
      customHashtags: challengeHashtags.length > 0 ? 
        ["#Mindfulness", "#Wellness", "#BreathingPractice", "#InnerPeace", ...challengeHashtags.filter((tag): tag is string => tag !== undefined)] : 
        undefined
    });
    onPublished?.("twitter-share");
  };

  // Handle native sharing
  const handleNativeShare = async () => {
    // Convert BreathingSession to ShareableSessionData
    const shareableSessionData: ShareableSessionData = {
      patternName: sessionData.patternName,
      sessionDuration: sessionData.duration,
      breathHoldTime: sessionData.breathHoldTime || 0,
      restlessnessScore: sessionData.restlessnessScore || 0,
      timestamp: sessionData.timestamp,
      score: sessionData.score,
      cycles: sessionData.cycles,
      insights: sessionData.insights,
      flowNFTId: sessionData.nftId,
    };

    const success = await shareNative(shareableSessionData, { tone: 'mindful' });
    if (success) {
      onPublished?.("native-share");
    } else {
      // Fallback to clipboard
      await handleCopyToClipboard();
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      // Convert BreathingSession to ShareableSessionData
      const shareableSessionData: ShareableSessionData = {
        patternName: sessionData.patternName,
        sessionDuration: sessionData.duration,
        breathHoldTime: sessionData.breathHoldTime || 0,
        restlessnessScore: sessionData.restlessnessScore || 0,
        timestamp: sessionData.timestamp,
        score: sessionData.score,
        cycles: sessionData.cycles,
        insights: sessionData.insights,
        flowNFTId: sessionData.nftId,
      };

      await copyToClipboard(shareableSessionData, { tone: 'mindful' });
      onPublished?.("clipboard-copy");
    } catch (error) {
      // Error already handled in utility
    }
  };

  // Generate calm, mindful preview
  const generateMindfulPreview = () => {
    const score = sessionData.score || 0;

    return (
      <div className="bg-gradient-to-b from-slate-50 to-white p-8 rounded-2xl border border-slate-200/50 shadow-sm">
        <div className="text-center space-y-6">
          {/* Gentle completion message */}
          <div className="space-y-2">
            <div className="text-4xl">🌸</div>
            <h3 className="text-lg font-medium text-slate-700">
              Practice Complete
            </h3>
            <p className="text-sm text-slate-500">
              Take a moment to notice how you feel
            </p>
          </div>

          {/* Simple metrics */}
          <div className="flex justify-center items-center gap-8 text-sm text-slate-600">
            <div className="text-center">
              <div className="font-medium">{durationText}</div>
              <div className="text-xs text-slate-400">duration</div>
            </div>

            <div className="w-px h-8 bg-slate-200"></div>

            <div className="text-center">
              <div className="font-medium">{sessionData.patternName}</div>
              <div className="text-xs text-slate-400">pattern</div>
            </div>

            {sessionData.cycles && (
              <>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center">
                  <div className="font-medium">{sessionData.cycles}</div>
                  <div className="text-xs text-slate-400">cycles</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mindful Preview */}
      {generateMindfulPreview()}

      {/* Simple Sharing Options */}
      <Card className="border-slate-200/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-slate-700 font-medium">
            Share Your Practice
          </CardTitle>
          <p className="text-center text-sm text-slate-500">
            Inspire others on their wellness journey
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simple sharing buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleTwitterShare}
              variant="outline"
              className="w-full justify-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Twitter className="h-4 w-4" />
              Share on Twitter
            </Button>

            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="w-full justify-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Share2 className="h-4 w-4" />
              {hasNativeShare ? "Share" : "Copy to Share"}
            </Button>

            {isAuthenticated && (
              <Button
                onClick={handlePublish}
                disabled={isPosting || isPublishing}
                variant="outline"
                className="w-full justify-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {isPublishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mr-2" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share on Lens
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Optional challenges - simplified */}
          {availableChallenges.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600 mb-3 text-center">
                Join a wellness challenge
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableChallenges.map((challenge) => (
                  <button
                    key={challenge.id}
                    onClick={() => {
                      if (selectedChallenges.includes(challenge.id)) {
                        setSelectedChallenges(
                          selectedChallenges.filter((id) => id !== challenge.id)
                        );
                      } else {
                        setSelectedChallenges([
                          ...selectedChallenges,
                          challenge.id,
                        ]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      selectedChallenges.includes(challenge.id)
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {challenge.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error display - subtle */}
          {actionError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
              {actionError}
            </div>
          )}

          {/* Connection prompt - gentle */}
          {!isAuthenticated && (
            <p className="text-xs text-slate-400 text-center pt-2">
              Connect to Lens Protocol for decentralized sharing
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
