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

interface SessionData {
  patternName?: string;
  duration?: number;
  score?: number;
  breathHoldTime?: number;
  restlessnessScore?: number;
  bpm?: number;
  consistencyScore?: number;
  cycles?: number;
  insights?: string[];
  flowNFTId?: string;
}

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
    refreshTimeline,
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
        id: `session-${Date.now()}`,
        patternName: sessionData.patternName || "Breathing Session",
        duration: sessionData.duration || 0,
        score: sessionData.score || 0,
        timestamp: new Date().toISOString(),
        breathHoldTime: sessionData.breathHoldTime || 0,
        insights: sessionData.insights || [],
        flowNFTId: sessionData.flowNFTId,
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

  // Convert restlessness score to percentage
  const getQualityScore = () => {
    if (sessionData.restlessnessScore !== undefined) {
      return Math.max(0, 100 - sessionData.restlessnessScore);
    }
    return sessionData.score || 75;
  };

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
    const duration = Math.round((sessionData.duration || 0) / 60);
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
              <div className="text-center">
                <Badge variant="secondary" className="text-xs">
                  Flow NFT: {sessionData.flowNFTId}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render quick actions
  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-
