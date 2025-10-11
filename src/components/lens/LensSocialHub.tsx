/**
 * Lens Social Hub - V3 Only Implementation
 *
 * Clean, modern component for Lens V3 social features.
 * Replaces the complex abstraction layer with direct V3 integration.
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  User,
  Users,
  Plus,
  Loader2,
  ExternalLink,
  Wallet,
  LogOut,
  RefreshCw,
  Send,
  Hash,
} from "lucide-react";
import { useLens } from "@/hooks/useLens";
import type { Post } from "@/lib/lens";

export function LensSocialHub() {
  const {
    isAuthenticated,
    currentAccount,
    isAuthenticating,
    authError,
    timeline,
    isLoadingTimeline,
    timelineError,
    hasMorePosts,
    highlights,
    trendingPatterns,
    authenticate,
    logout,
    loadTimeline,
    loadMorePosts,
    followUser,
    unfollowUser,
    isFollowing,
    shareBreathingSession,
    createPost,
    isPosting,
    actionError,
  } = useLens();

  // Local state
  const [walletAddress, setWalletAddress] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Handle authentication
  const handleAuthenticate = async () => {
    if (!walletAddress.trim()) return;
    await authenticate(walletAddress.trim());
  };

  // Handle quick breathing session share
  const handleQuickShare = async () => {
    await shareBreathingSession({
      patternName: "Box Breathing",
      duration: 300, // 5 minutes in seconds
      score: 85,
      breathHoldTime: 4,
      restlessnessScore: 15,
      cycles: 10,
      completedAt: new Date().toISOString(),
    });
  };

  // Handle post creation
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    await createPost(newPostContent, selectedTags);
    setNewPostContent("");
    setSelectedTags([]);
  };

  // Handle load more posts
  const handleLoadMore = async () => {
    if (hasMorePosts && !isLoadingTimeline) {
      await loadMorePosts();
    }
  };

  // Handle refresh timeline
  const handleRefreshTimeline = async () => {
    await loadTimeline(true);
  };

  // Render authentication section
  const renderAuthSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect to Lens V3
        </CardTitle>
        <CardDescription>
          Connect your wallet to access Lens Protocol v3
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter wallet address (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            disabled={isAuthenticating}
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

        {authError && (
          <Alert variant="destructive">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Connects to Lens Protocol V3</p>
          <p>• Gasless transactions supported</p>
          <p>• Decentralized social content</p>
        </div>
      </CardContent>
    </Card>
  );

  // Render account info
  const renderAccountInfo = () => {
    if (!currentAccount) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={currentAccount.metadata?.picture} />
                <AvatarFallback>
                  {(
                    currentAccount.metadata?.name ||
                    currentAccount.username?.localName ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  @
                  {currentAccount.username?.fullHandle ||
                    currentAccount.address}
                </CardTitle>
                <CardDescription>
                  {currentAccount.metadata?.name || "Lens User"}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {currentAccount.stats?.followers || 0} followers
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {currentAccount.stats?.following || 0} following
            </span>
          </div>
          {currentAccount.metadata?.bio && (
            <p className="mt-2 text-sm">{currentAccount.metadata?.bio}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render quick actions
  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Share</CardTitle>
        <CardDescription>
          Share your breathing journey with the Lens community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleQuickShare}
          disabled={isPosting}
          className="w-full"
        >
          {isPosting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Send className="h-4 w-4 mr-2" />
          Share Latest Session
        </Button>

        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Uses gasless transactions for seamless sharing
        </p>
      </CardContent>
    </Card>
  );

  // Render post item
  const renderPost = (post: Post) => (
    <Card key={post.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.metadata?.picture} />
            <AvatarFallback>
              {(post.author.username?.localName || post.author.id)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                @{post.author.username?.fullHandle || post.author.id}
              </span>
              {post.author.metadata?.name && (
                <span className="text-xs text-muted-foreground">
                  {post.author.metadata?.name}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(post.timestamp).toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => followUser(post.author.id)}
            disabled={isFollowing}
          >
            {isFollowing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>

          {(post.metadata?.tags || post.content.match(/#\w+/g)) && (
            <div className="flex flex-wrap gap-1">
              {(
                post.metadata?.tags ||
                post.content.match(/#\w+/g)?.map((tag) => tag.slice(1)) ||
                []
              ).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  {typeof tag === "string" ? tag.replace("#", "") : tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.stats?.reactions || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.stats?.comments || 0}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="h-4 w-4" />
                {post.stats?.reposts || 0}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              Breathing Session
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render feed section
  const renderFeed = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Your Feed</CardTitle>
            <CardDescription>
              Latest posts from your Lens network
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshTimeline}
            disabled={isLoadingTimeline}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingTimeline ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {timelineError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{timelineError}</AlertDescription>
          </Alert>
        )}

        {actionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {isLoadingTimeline ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading feed...</span>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No posts in your feed yet</p>
            <p className="text-sm">
              Follow some accounts to see their posts here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-96">{timeline.map(renderPost)}</ScrollArea>
            {hasMorePosts && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingTimeline}
                >
                  {isLoadingTimeline ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Load More Posts
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Main render
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Lens V3 Social Hub</h2>
          <p className="text-muted-foreground">
            Connect with the decentralized social community on Lens Chain
          </p>
        </div>
        {renderAuthSection()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Lens V3 Social Hub</h2>
        <p className="text-muted-foreground">
          Share your breathing journey and connect with the wellness community
        </p>
      </div>

      {renderAccountInfo()}

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {renderFeed()}
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          {renderQuickActions()}

          {/* New Post Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Post</CardTitle>
              <CardDescription>
                Share your thoughts with the Lens community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind about breathing and wellness?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px]"
              />

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedTags.includes("breathing") ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes("breathing")
                        ? prev.filter((tag) => tag !== "breathing")
                        : [...prev, "breathing"],
                    );
                  }}
                >
                  #breathing
                </Badge>
                <Badge
                  variant={
                    selectedTags.includes("wellness") ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes("wellness")
                        ? prev.filter((tag) => tag !== "wellness")
                        : [...prev, "wellness"],
                    );
                  }}
                >
                  #wellness
                </Badge>
                <Badge
                  variant={
                    selectedTags.includes("mindfulness") ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes("mindfulness")
                        ? prev.filter((tag) => tag !== "mindfulness")
                        : [...prev, "mindfulness"],
                    );
                  }}
                >
                  #mindfulness
                </Badge>
              </div>

              <Button
                onClick={handleCreatePost}
                disabled={isPosting || !newPostContent.trim()}
                className="w-full"
              >
                {isPosting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Post to Lens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Network info footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              Connected to Lens Protocol
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://explorer.lens.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LensSocialHub;
