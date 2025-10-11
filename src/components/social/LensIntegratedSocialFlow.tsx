/**
 * Lens Integrated Social Flow Component
 * Leverages existing Lens V3 implementation for social features
 * Replaces placeholder components with actual working Lens integration
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Share2,
  Heart,
  MessageCircle,
  Users,
  Trophy,
  Clock,
  Target,
  Repeat,
  Wind,
  Hash,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useLens } from "../../hooks/useLens";
import { BreathingSessionPost } from "./BreathingSessionPost";
import { toast } from "sonner";
import { useShareSession, type SessionData, type ShareableSessionData } from "../../lib/sharing";

interface LensIntegratedSocialFlowProps {
  phase: "completion" | "sharing" | "celebration" | "active";
  sessionData: SessionData;
  onSocialAction: (action: string, data: any) => void;
}

export const LensIntegratedSocialFlow: React.FC<LensIntegratedSocialFlowProps> = ({
  phase,
  sessionData,
  onSocialAction,
}) => {
  const {
    isAuthenticated,
    currentAccount,
    isAuthenticating,
    authenticate,
    shareBreathingSession,
    isPosting,
    actionError,
    timeline,
    isLoadingTimeline,
    loadTimeline,
  } = useLens();

  const [walletAddress, setWalletAddress] = useState("");
  const [activeTab, setActiveTab] = useState("share");

  // Handle Lens authentication
  const handleAuthenticate = async () => {
    if (!walletAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    try {
      await authenticate(walletAddress.trim());
      onSocialAction("lens_connected", { address: walletAddress });
      toast.success("Connected to Lens Protocol!");
    } catch (error) {
      toast.error("Failed to connect to Lens");
      onSocialAction("lens_error", { error });
    }
  };

  // Handle session sharing
  const handleShareSession = async () => {
    if (!isAuthenticated) {
      toast.error("Please connect to Lens first");
      return;
    }

    try {
      const sessionForSharing = {
        patternName: sessionData.patternName || "Breathing Session",
        duration: (sessionData as ShareableSessionData).sessionDuration || 0,
        score: (sessionData as ShareableSessionData).score || 0,
        completedAt: new Date().toISOString(),
        breathHoldTime: (sessionData as ShareableSessionData).breathHoldTime || 0,
        cycles: (sessionData as ShareableSessionData).cycles,
        restlessnessScore: (sessionData as ShareableSessionData).restlessnessScore,
      };

      const result = await shareBreathingSession(sessionForSharing);

      if (result.success) {
        onSocialAction("session_shared", {
          txHash: result.hash,
          sessionData: sessionForSharing
        });
        toast.success("Session shared to Lens!");
      } else {
        throw new Error(result.error || "Failed to share");
      }
    } catch (error) {
      toast.error("Failed to share session");
      onSocialAction("share_error", { error });
    }
  };

  // Use shared utilities for consistent score calculation
  const getQualityScore = () => calculateScore(sessionData);

  // Render authentication section
  const renderAuthSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Connect to Lens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect to Lens Protocol to share your breathing achievements with the decentralized social community.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter wallet address (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            disabled={isAuthenticating}
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <Button
            onClick={handleAuthenticate}
            disabled={isAuthenticating || !walletAddress.trim()}
          >
            {isAuthenticating && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Connect
          </Button>
        </div>

        {actionError && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {actionError}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Decentralized social protocol</p>
          <p>• Own your content and data</p>
          <p>• Gasless transactions supported</p>
        </div>
      </CardContent>
    </Card>
  );

  // Render session summary
  const renderSessionSummary = () => {
    const duration = Math.round((sessionData.sessionDuration || 0) / 60);
    const qualityScore = getQualityScore();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Session Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{qualityScore}/100</div>
            <p className="text-sm text-muted-foreground">Quality Score</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{duration === 1 ? "1 minute" : `${duration} minutes`}</span>
            </div>

            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{sessionData.patternName || "Custom Pattern"}</span>
            </div>

            {(sessionData as ShareableSessionData).cycles && (
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span>{(sessionData as ShareableSessionData).cycles} cycles</span>
              </div>
            )}

            {sessionData.breathHoldTime && (
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span>{sessionData.breathHoldTime}s hold</span>
              </div>
            )}
          </div>

          {(sessionData as ShareableSessionData).flowNFTId && (
            <>
              <Separator />
              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  Flow NFT: {(sessionData as ShareableSessionData).flowNFTId}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Import shared utilities
  const { shareOnTwitter, calculateScore } = useShareSession();

  // Render quick actions
  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <Button
            onClick={() => setActiveTab("auth")}
            className="w-full"
            variant="default"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Connect to Lens Protocol
          </Button>
        ) : (
          <Button
            onClick={handleShareSession}
            disabled={isPosting}
            className="w-full"
            variant="default"
          >
            {isPosting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Share to Lens
          </Button>
        )}

        <Button
          onClick={() => {
            shareOnTwitter(sessionData);
            onSocialAction("twitter_shared", { sessionData });
          }}
          className="w-full"
          variant="outline"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Share on Twitter/X
        </Button>
      </CardContent>
    </Card>
  );

  // Main render logic
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="share">Share</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="auth">Connect</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-4">
          {renderQuickActions()}
          
          {isAuthenticated && currentAccount && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Connected to Lens</p>
                    <p className="text-xs text-muted-foreground">
                      {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          {renderSessionSummary()}
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          {renderAuthSection()}
        </TabsContent>
      </Tabs>

      {actionError && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <strong>Error:</strong> {actionError}
        </div>
      )}
    </div>
  );
};
