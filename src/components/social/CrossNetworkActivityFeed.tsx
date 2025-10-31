/**
 * Cross-Network Activity Feed
 * 
 * Displays a unified feed of activities from both Flow Forte and Lens Protocol
 * ENHANCEMENT: Provides a cohesive view of cross-network activities
 * CLEAN: Reuses existing UI components and patterns
 * MODULAR: Composable activity cards for different network events
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  TrendingUp,
  Users,
  Loader2,
  RefreshCw,
  ExternalLink,
  Nfc,
  Globe,
  Zap,
  Award,
  Calendar,
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  User,
  Wallet,
  Wind,
} from "lucide-react";
import { useFlow } from "../../hooks/useFlow";
import { useLens } from "../../hooks/useLens";
import { useCrossNetwork } from "../../hooks/useCrossNetwork";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Types for cross-network activities
interface CrossNetworkActivity {
  id: string;
  type: "nft_mint" | "nft_purchase" | "nft_sale" | "lens_post" | "lens_like" | "lens_comment" | "lens_follow" | "breathing_session" | "challenge_created" | "challenge_joined";
  network: "flow" | "lens";
  title: string;
  description: string;
  timestamp: string;
  user: {
    address: string;
    handle?: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
  stats?: {
    likes?: number;
    comments?: number;
    shares?: number;
    participants?: number;
  };
}

interface ActivityFeedState {
  activities: CrossNetworkActivity[];
  isLoading: boolean;
  error: string | null;
  activeTab: "all" | "flow" | "lens";
}

export function CrossNetworkActivityFeed() {
  const [state, setState] = useState<ActivityFeedState>({
    activities: [],
    isLoading: false,
    error: null,
    activeTab: "all",
  });

  const flow = useFlow();
  const lens = useLens();
  const crossNetwork = useCrossNetwork();

  // Load initial activities
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real implementation, this would fetch activities from both networks
      // For now, we'll create mock activities to demonstrate the concept
      const mockActivities: CrossNetworkActivity[] = [
        {
          id: "flow-mint-1",
          type: "nft_mint",
          network: "flow",
          title: "New Breathing Pattern Minted",
          description: "User minted a new '4-7-8 Relaxation' breathing pattern NFT",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          user: {
            address: "0x1234...5678",
            handle: "breathing_master",
          },
          metadata: {
            patternName: "4-7-8 Relaxation",
            difficulty: "intermediate",
            category: "relaxation",
          },
          stats: {
            likes: 12,
            comments: 3,
          },
        },
        {
          id: "lens-post-1",
          type: "lens_post",
          network: "lens",
          title: "Completed Mindful Breathing Session",
          description: "User completed a 15-minute mindful breathing session",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          user: {
            address: "0x8765...4321",
            handle: "mindful_breather",
          },
          metadata: {
            sessionDuration: 900,
            pattern: "Box Breathing",
            score: 85,
          },
          stats: {
            likes: 24,
            comments: 7,
            shares: 2,
          },
        },
        {
          id: "flow-purchase-1",
          type: "nft_purchase",
          network: "flow",
          title: "Rare Breathing Pattern Purchased",
          description: "User purchased 'Wim Hof Method' breathing pattern NFT",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: {
            address: "0xabcd...ef01",
            handle: "advanced_practitioner",
          },
          metadata: {
            patternName: "Wim Hof Method",
            price: 25.5,
            currency: "FLOW",
          },
          stats: {
            likes: 42,
            comments: 11,
          },
        },
        {
          id: "lens-follow-1",
          type: "lens_follow",
          network: "lens",
          title: "New Follower",
          description: "User followed 'breathing_expert'",
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          user: {
            address: "0x2468...1357",
            handle: "new_follower",
          },
          metadata: {
            followedUser: "breathing_expert",
          },
        },
        {
          id: "challenge-created-1",
          type: "challenge_created",
          network: "flow",
          title: "Community Challenge Created",
          description: "User created '7-Day Mindfulness Challenge'",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          user: {
            address: "0x1357...2468",
            handle: "community_leader",
          },
          metadata: {
            challengeName: "7-Day Mindfulness Challenge",
            duration: 7,
            participants: 28,
          },
          stats: {
            participants: 28,
          },
        },
      ];

      setState(prev => ({
        ...prev,
        activities: mockActivities,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to load activities:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load activities",
      }));
    }
  };

  const filteredActivities = state.activities.filter(activity => {
    if (state.activeTab === "all") return true;
    return activity.network === state.activeTab;
  });

  const renderActivityIcon = (type: CrossNetworkActivity["type"]) => {
    switch (type) {
      case "nft_mint":
        return <Nfc className="h-4 w-4" />;
      case "nft_purchase":
      case "nft_sale":
        return <Wallet className="h-4 w-4" />;
      case "lens_post":
        return <Globe className="h-4 w-4" />;
      case "lens_like":
        return <Heart className="h-4 w-4" />;
      case "lens_comment":
        return <MessageCircle className="h-4 w-4" />;
      case "lens_follow":
        return <User className="h-4 w-4" />;
      case "breathing_session":
        return <Wind className="h-4 w-4" />;
      case "challenge_created":
      case "challenge_joined":
        return <Award className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const renderActivityBadge = (network: "flow" | "lens") => {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs",
          network === "flow" ? "border-blue-500 text-blue-500" : "border-purple-500 text-purple-500"
        )}
      >
        {network === "flow" ? "Flow" : "Lens"}
      </Badge>
    );
  };

  const renderActivityCard = (activity: CrossNetworkActivity) => (
    <Card key={activity.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {renderActivityIcon(activity.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="font-medium text-sm">{activity.title}</h3>
              {renderActivityBadge(activity.network)}
            </div>
            <p className="text-muted-foreground text-sm mt-1">{activity.description}</p>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(activity.timestamp))} ago</span>
                {activity.stats?.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {activity.stats.likes}
                  </span>
                )}
                {activity.stats?.comments !== undefined && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {activity.stats.comments}
                  </span>
                )}
                {activity.stats?.shares !== undefined && (
                  <span className="flex items-center gap-1">
                    <Share className="h-3 w-3" />
                    {activity.stats.shares}
                  </span>
                )}
                {activity.stats?.participants !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {activity.stats.participants}
                  </span>
                )}
              </div>
              
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cross-Network Activity
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadActivities}
            disabled={state.isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4", state.isLoading ? "animate-spin" : "")}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value as "all" | "flow" | "lens" }))}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Networks</TabsTrigger>
            <TabsTrigger value="flow">Flow Forte</TabsTrigger>
            <TabsTrigger value="lens">Lens Protocol</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : state.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading activities...</span>
              </div>
            ) : (
              <ScrollArea className="h-96">
                {filteredActivities.map(renderActivityCard)}
              </ScrollArea>
            )}
          </TabsContent>
          <TabsContent value="flow" className="mt-4">
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : state.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading Flow activities...</span>
              </div>
            ) : (
              <ScrollArea className="h-96">
                {filteredActivities.map(renderActivityCard)}
              </ScrollArea>
            )}
          </TabsContent>
          <TabsContent value="lens" className="mt-4">
            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : state.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading Lens activities...</span>
              </div>
            ) : (
              <ScrollArea className="h-96">
                {filteredActivities.map(renderActivityCard)}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}