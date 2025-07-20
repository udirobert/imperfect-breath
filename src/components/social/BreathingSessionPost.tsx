/**
 * Breathing Session Post Component
 * Updated for Lens SDK v3
 */

import React, { useState } from "react";
import { useLens } from "../../hooks/useLens";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Share2, Clock, Target, Repeat, Wind, Award, Hash } from "lucide-react";
import { toast } from "sonner";
import type { BreathingSessionData } from "../../types/lens";

interface BreathingSessionPostProps {
  sessionData: BreathingSessionData;
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

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
      toast.error("Please connect to Lens first");
      return;
    }

    try {
      setIsPublishing(true);

      // Convert sessionData to BreathingSession format
      const sessionWithRequiredFields = {
        id: `session-${Date.now()}`,
        patternName: sessionData.patternName,
        duration: sessionData.duration,
        score: sessionData.score,
        restlessnessScore: 100 - sessionData.score,
        sessionDuration: sessionData.duration,
        timestamp: new Date().toISOString(),
        breathHoldTime: sessionData.breathHoldTime || 0,
      };

      const result = await shareBreathingSession(sessionWithRequiredFields);

      if (!result.success) {
        throw new Error(result.error || "Failed to share session");
      }

      const txHash = result.transactionHash || "";
      toast.success("Session shared to Lens!", {
        description: txHash
          ? `Transaction: ${txHash.slice(0, 10)}...`
          : undefined,
      });

      onPublished?.(txHash);
    } catch (error) {
      toast.error("Failed to share session", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const duration = Math.round(sessionData.duration / 60);
  const durationText = duration === 1 ? "1 minute" : `${duration} minutes`;

  const generateChallengeContent = () => {
    const challengeHashtags = selectedChallenges
      .map((id) => availableChallenges.find((c) => c.id === id)?.hashtag)
      .filter(Boolean)
      .join(" ");

    return challengeHashtags ? ` ${challengeHashtags}` : "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Your Breathing Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg">{sessionData.patternName}</h4>
            <Badge variant="secondary" className="text-sm">
              Score: {sessionData.score}/100
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{durationText}</span>
            </div>

            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{sessionData.score}/100</span>
            </div>

            {sessionData.cycles && (
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span>{sessionData.cycles} cycles</span>
              </div>
            )}

            {sessionData.breathHoldTime && (
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span>{sessionData.breathHoldTime}s hold</span>
              </div>
            )}
          </div>

          {sessionData.flowNFTId && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Flow NFT:</span>{" "}
                {sessionData.flowNFTId}
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Challenge Selection */}
        {availableChallenges.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              Join Challenges
            </h4>
            <div className="grid gap-2">
              {availableChallenges.map((challenge) => (
                <div key={challenge.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={challenge.id}
                    checked={selectedChallenges.includes(challenge.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChallenges([
                          ...selectedChallenges,
                          challenge.id,
                        ]);
                      } else {
                        setSelectedChallenges(
                          selectedChallenges.filter(
                            (id) => id !== challenge.id,
                          ),
                        );
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={challenge.id} className="text-sm font-medium">
                    {challenge.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {challenge.hashtag}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Preview of what will be posted */}
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p className="font-medium mb-2">Preview:</p>
          <p className="text-muted-foreground whitespace-pre-line">
            {`Just completed a ${sessionData.patternName} breathing session! 🌬️

⏱️ Duration: ${durationText}
📊 Score: ${sessionData.score}/100${
              sessionData.cycles ? `\n🔄 Cycles: ${sessionData.cycles}` : ""
            }${
              sessionData.breathHoldTime
                ? `\n💨 Breath Hold: ${sessionData.breathHoldTime}s`
                : ""
            }

#BreathingPractice #Wellness #Mindfulness #ImperfectBreath${generateChallengeContent()}`}
          </p>
          {selectedChallenges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedChallenges.map((id) => {
                const challenge = availableChallenges.find((c) => c.id === id);
                return challenge ? (
                  <Badge key={id} variant="secondary" className="text-xs">
                    <Hash className="h-3 w-3 mr-1" />
                    {challenge.name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Error display */}
        {actionError && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {actionError}
          </div>
        )}

        {/* Share button */}
        <Button
          onClick={handlePublish}
          disabled={isPosting || isPublishing || !isAuthenticated}
          className="w-full"
          size="lg"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Sharing to Lens...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              Share on Lens
            </>
          )}
        </Button>

        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground text-center">
            Connect to Lens Protocol to share your breathing sessions
          </p>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-4">
          <p className="font-medium mb-1">Integration Notes:</p>
          <ul className="space-y-1">
            <li>• Using Lens Protocol TypeScript SDK v3</li>
            <li>• Connected to Lens Chain (no longer on Polygon)</li>
            <li>• Posts include custom breathing session metadata</li>
            <li>• Transactions are securely signed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
