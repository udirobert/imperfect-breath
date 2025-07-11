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
import { Share2, Clock, Target, Repeat, Wind } from "lucide-react";
import { toast } from "sonner";
import type { BreathingSessionData } from "../../types/lens";

interface BreathingSessionPostProps {
  sessionData: BreathingSessionData;
  onPublished?: (txHash: string) => void;
}

export const BreathingSessionPost: React.FC<BreathingSessionPostProps> = ({
  sessionData,
  onPublished,
}) => {
  const { shareBreathingSession, isLoading, isAuthenticated, error } =
    useLens();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!isAuthenticated) {
      toast.error("Please connect to Lens first");
      return;
    }

    try {
      setIsPublishing(true);

      // Ensure insights is always provided as an array (required by shareBreathingSession)
      const sessionWithRequiredFields = {
        ...sessionData,
        insights: sessionData.insights || [],
        content:
          sessionData.content ||
          `Just completed a ${sessionData.patternName} breathing session!`,
      };

      const result = await shareBreathingSession(sessionWithRequiredFields);

      if (!result.success) {
        throw new Error(result.error || "Failed to share session");
      }

      const txHash = result.hash || "";
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

#BreathingPractice #Wellness #Mindfulness #ImperfectBreath`}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {/* Share button */}
        <Button
          onClick={handlePublish}
          disabled={isLoading || isPublishing || !isAuthenticated}
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
