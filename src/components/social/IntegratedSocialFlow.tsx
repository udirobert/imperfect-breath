/**
 * Integrated Social Flow Component
 * Seamlessly integrates Lens Protocol social features throughout the user journey
 *
 * UPDATED FOR LENS v3:
 * - Lens Protocol is now on Lens chain (no longer on Polygon)
 * - SDK structure has changed: timeline is now an array of posts, not an object with items property
 * - Property names have changed: avatar->picture, createdAt->timestamp, stats->engagement, etc.
 * - Auth flow has been simplified
 */

import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import {
  Heart,
  Share2,
  MessageCircle,
  Users,
  TrendingUp,
  Eye,
  Zap,
  Crown,
  Clock,
  Target,
  Loader2,
  CheckCircle,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { useLens } from "../../hooks/useLens";

interface SocialContextProps {
  phase: "discovery" | "session" | "completion" | "community";
  sessionData?: {
    patternName: string;
    duration: number;
    score: number;
    insights?: string[];
  };
  onSocialAction?: (action: string, data: any) => void;
}

interface CommunityPost {
  id: string;
  author: {
    address: string;
    username?: string;
    name?: string;
    avatar?: string;
  };
  content: string;
  patternName: string;
  duration: number;
  score: number;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
}

interface TrendingPattern {
  name: string;
  usageCount: number;
  avgScore: number;
  trend: "up" | "down" | "stable";
}

export const IntegratedSocialFlow: React.FC<SocialContextProps> = ({
  phase,
  sessionData,
  onSocialAction,
}) => {
  const {
    isAuthenticated,
    currentAccount,
    authenticate,
    shareBreathingSession,
    shareBreathingPattern,
    followAccount,
    unfollowAccount,
    getTimeline,
    isLoading,
  } = useLens();

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [trendingPatterns, setTrendingPatterns] = useState<TrendingPattern[]>(
    []
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareText, setShareText] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Load community data when component mounts or phase changes
  useEffect(() => {
    if (phase === "community" || phase === "discovery") {
      loadCommunityData();
    }
  }, [phase, isAuthenticated]);

  const loadCommunityData = async () => {
    setLoadingPosts(true);
    try {
      // Not authenticated - can't load community data
      if (!isAuthenticated || !currentAccount) {
        setCommunityPosts([]);
        setTrendingPatterns([]);
        toast.error("Please connect to Lens Protocol to see community content");
        return;
      }

      // Get trending patterns from the blockchain with authentication
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // Add auth token if available
        if (localStorage.getItem("lens_auth_token")) {
          headers["Authorization"] = `Bearer ${localStorage.getItem(
            "lens_auth_token"
          )}`;
        }

        const response = await fetch("/api/patterns/trending", {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Error ${response.status}: Failed to fetch trending patterns`
          );
        }

        const data = await response.json();

        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error("Invalid trending patterns data format");
        }

        setTrendingPatterns(data);
      } catch (error) {
        console.error("Failed to load trending patterns:", error);
        setTrendingPatterns([]);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load trending patterns"
        );
      }

      // Load community posts from Lens Protocol
      try {
        // Updated for Lens SDK v3: timeline is now returned as an array directly
        const timeline = await getTimeline(currentAccount.address);

        if (!timeline || !Array.isArray(timeline)) {
          throw new Error("Invalid timeline data");
        }

        // Convert timeline to community posts format with proper metadata handling
        const posts: CommunityPost[] = timeline.map((item) => {
          // Properly extract metadata with type checking
          const metadata = item.metadata || {};

          return {
            id: item.id,
            author: {
              address: item.author.address,
              username: item.author.username || "",
              name: item.author.name || "",
              avatar:
                item.author.picture ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author.address}`,
            },
            content: item.content || "",
            patternName: extractPatternName(item.content || "", metadata),
            duration: extractDuration(item.content || "", metadata),
            score: extractScore(item.content || "", metadata),
            likes: item.engagement?.likes || 0,
            comments: item.engagement?.comments || 0,
            timestamp: item.timestamp || new Date().toISOString(),
            isLiked: item.engagement?.isLiked || false,
          };
        });

        setCommunityPosts(posts);
      } catch (error) {
        console.error("Failed to load timeline:", error);
        setCommunityPosts([]);
        toast.error("Failed to load community posts");
      }
    } catch (error) {
      console.error("Failed to load community data:", error);
      setCommunityPosts([]);
      setTrendingPatterns([]);
      toast.error("Failed to load community data");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      await authenticate();
      toast.success("Connected to Lens Protocol!");
      loadCommunityData();
    } catch (error) {
      toast.error("Failed to connect to Lens Protocol");
    }
  };

  const handleShare = async () => {
    if (!sessionData) {
      toast.error("No session data available to share");
      return;
    }

    if (!isAuthenticated || !currentAccount) {
      toast.error("Please connect to Lens Protocol first");
      return;
    }

    try {
      setShowShareDialog(true);

      // Format session data with text content
      const sessionContent =
        shareText ||
        `I just completed a ${
          sessionData.patternName
        } breathing session for ${formatDuration(
          sessionData.duration
        )} with a score of ${sessionData.score}%${
          sessionData.insights && sessionData.insights.length > 0
            ? `. Insights: ${sessionData.insights.join(", ")}`
            : ""
        }`;

      // Call the Lens Protocol API to share
      const postHash = await shareBreathingSession({
        patternName: sessionData.patternName,
        duration: sessionData.duration,
        score: sessionData.score,
        insights: sessionData.insights || [],
        content: sessionContent,
      });

      if (!postHash) {
        throw new Error("Failed to get transaction hash");
      }

      toast.success("Session shared to Lens Protocol!");
      setShowShareDialog(false);
      setShareText(""); // Clear the text for next time
      onSocialAction?.("shared", { postHash, sessionData });

      // Refresh community data to show the new post
      setTimeout(() => loadCommunityData(), 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to share session:", error);
      toast.error(`Failed to share session: ${errorMessage}`);
    }
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated || !currentAccount) {
      toast.error("Please connect to Lens Protocol first");
      return;
    }

    try {
      // Find the post to get current status
      const post = communityPosts.find((p) => p.id === postId);
      if (!post) {
        throw new Error("Post not found");
      }

      // Optimistically update UI
      setCommunityPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
            : post
        )
      );

      // Call the Lens Protocol API through our backend
      // This ensures proper authentication and error handling
      const result = await fetch(`/api/social/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("lens_auth_token")}`,
        },
        body: JSON.stringify({
          publicationId: postId,
          reaction: "UPVOTE",
          remove: post.isLiked,
        }),
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.message || "Failed to react to post");
      }

      toast.success(post.isLiked ? "Removed like" : "Added like");
    } catch (error) {
      console.error("Failed to like post:", error);

      // Revert optimistic update on failure
      setCommunityPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes + 1 : post.likes - 1,
              }
            : post
        )
      );

      toast.error("Failed to like post");
    }
  };

  const handleFollow = async (address: string) => {
    if (!isAuthenticated || !currentAccount) {
      toast.error("Please connect to Lens Protocol first");
      return;
    }

    try {
      // Call the Lens Protocol follow function
      const result = await followAccount(address);

      if (!result.success) {
        throw new Error(result.error || "Failed to follow user");
      }

      toast.success("Following user!");
      // Refresh community data to show updated follow status
      loadCommunityData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to follow user:", error);
      toast.error(`Failed to follow user: ${errorMessage}`);
    }
  };

  // Helper functions to safely extract pattern metadata
  const extractPatternName = (content: string, metadata: any): string => {
    // Try to get from proper metadata first
    if (metadata?.breathingPattern?.name) {
      return metadata.breathingPattern.name;
    }

    // Fallback to content parsing if necessary
    const patternRegex =
      /(4-7-8|Box Breathing|Wim Hof|Coherent Breathing|Alternate Nostril|Diaphragmatic|Progressive Relaxation)/i;
    const match = content.match(patternRegex);
    return match ? match[1] : "Custom Pattern";
  };

  const extractDuration = (content: string, metadata: any): number => {
    // Try to get from proper metadata first
    if (
      metadata?.breathingPattern?.duration &&
      typeof metadata.breathingPattern.duration === "number"
    ) {
      return metadata.breathingPattern.duration;
    }

    // Fallback to content parsing if necessary
    const match = content.match(/(\d+)[\s-]?minutes?/i);
    return match ? parseInt(match[1]) * 60 : 300;
  };

  const extractScore = (content: string, metadata: any): number => {
    // Try to get from proper metadata first
    if (
      metadata?.breathingPattern?.score &&
      typeof metadata.breathingPattern.score === "number"
    ) {
      return metadata.breathingPattern.score;
    }

    // Fallback to content parsing if necessary
    const match = content.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 75; // Default reasonable score instead of random
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Render different content based on phase
  switch (phase) {
    case "discovery":
      return (
        <div className="space-y-6">
          {/* Social Authentication */}
          {!isAuthenticated && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Join the Community
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Connect with Lens Protocol to share sessions and discover
                      patterns
                    </p>
                  </div>
                  <Button onClick={handleAuthenticate} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {trendingPatterns.map((pattern, index) => (
                  <div
                    key={pattern.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{pattern.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pattern.usageCount} sessions • {pattern.avgScore}%
                          avg score
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pattern.trend === "up" && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                      {pattern.trend === "down" && (
                        <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                      )}
                      {pattern.trend === "stable" && (
                        <div className="w-4 h-4 rounded-full bg-gray-400" />
                      )}
                      <Button size="sm" variant="outline">
                        Try It
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case "session":
      return (
        <div className="space-y-4">
          {/* Live Community Motivation */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    47 people are breathing with you right now
                  </p>
                  <p className="text-xs text-green-700">
                    Join the global mindfulness moment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Social Context */}
          {isAuthenticated && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={currentAccount?.picture} />
                      <AvatarFallback>
                        {currentAccount?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      Share this session when complete?
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Auto-share enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );

    case "completion":
      return (
        <div className="space-y-6">
          {/* Immediate Share Options */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Your Achievement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">
                    Connect to Lens Protocol to share your session with the
                    community
                  </p>
                  <Button onClick={handleAuthenticate} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    Connect & Share
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">
                      Connected as{" "}
                      {currentAccount?.username || currentAccount?.name}
                    </span>
                  </div>

                  <Dialog
                    open={showShareDialog}
                    onOpenChange={setShowShareDialog}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share to Lens Protocol
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Your Breathing Session</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span>Pattern: {sessionData?.patternName}</span>
                            <span>
                              Duration:{" "}
                              {formatDuration(sessionData?.duration || 0)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm">
                              Score: {sessionData?.score}/100
                            </span>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Add your thoughts about this session..."
                          value={shareText}
                          onChange={(e) => setShareText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleShare}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Share
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowShareDialog(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community Reactions Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Community Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loadingPosts ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading pattern statistics...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Recent sessions with {sessionData?.patternName}
                      </span>
                      <Badge variant="outline">
                        {trendingPatterns.find(
                          (p) => p.name === sessionData?.patternName
                        )?.usageCount || 0}{" "}
                        recent
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">
                          {trendingPatterns.find(
                            (p) => p.name === sessionData?.patternName
                          )?.avgScore || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Avg Score
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          {formatDuration(sessionData?.duration || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your Duration
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">
                          {communityPosts.filter(
                            (p) => p.patternName === sessionData?.patternName
                          ).length || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Community Posts
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case "community":
      return (
        <div className="space-y-6">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feed">Community Feed</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              {loadingPosts ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">
                    Loading community posts...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback>
                              {post.author.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {post.author.name || post.author.username}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {post.patternName}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(post.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">{post.content}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(post.duration)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {post.score}%
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(post.id)}
                                className={post.isLiked ? "text-red-500" : ""}
                              >
                                <Heart
                                  className={`w-4 h-4 mr-1 ${
                                    post.isLiked ? "fill-current" : ""
                                  }`}
                                />
                                {post.likes}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {post.comments}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="w-4 h-4 mr-1" />
                                Share
                              </Button>
                              {isAuthenticated && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleFollow(post.author.address)
                                  }
                                >
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Follow
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              <div className="grid gap-4">
                {trendingPatterns.map((pattern, index) => (
                  <Card key={pattern.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{pattern.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {pattern.usageCount} sessions this week
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {pattern.avgScore}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            avg score
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );

    default:
      return null;
  }
};

export default IntegratedSocialFlow;
