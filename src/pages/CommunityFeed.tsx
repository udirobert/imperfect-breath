import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useLens } from "@/hooks/useLens";
import { useLensFeed } from "@/hooks/useLensFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Heart,
  MessageCircle,
  Share,
  Clock,
  Activity,
  Users,
  TrendingUp,
  Search,
  Filter,
  Loader2,
  Wind,
  Star,
  Calendar,
  User,
  Award,
} from "lucide-react";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { BreathingSessionPost } from "@/components/social/BreathingSessionPost";
import { SocialActions } from "@/components/social/SocialActions";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils/formatters";

interface CommunityStats {
  totalSessions: number;
  activeUsers: number;
  totalMinutes: number;
  topPattern: string;
}

interface BreathingChallenge {
  id: string;
  name: string;
  description: string;
  hashtag: string;
  duration: string;
  participants: number;
  reward: string;
  isActive: boolean;
  endsAt: string;
}

const CommunityFeed: React.FC = () => {
  const { isConnected } = useAccount();
  const {
    isAuthenticated,
    currentAccount,
    authenticate,
    timeline,
    isLoadingTimeline,
    timelineError,
    loadTimeline,
  } = useLens();
  const posts = timeline;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalSessions: 1247,
    activeUsers: 89,
    totalMinutes: 15680,
    topPattern: "4-7-8 Breathing",
  });
  const [activeChallenge, setActiveChallenge] = useState<BreathingChallenge>({
    id: "challenge-1",
    name: "30-Day Breathing Reset",
    description: "Complete 30 days of mindful breathing practice",
    hashtag: "#30DayBreathingReset",
    duration: "30 days",
    participants: 127,
    reward: "Exclusive NFT Pattern",
    isActive: true,
    endsAt: "2024-12-31",
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadTimeline();
    }
  }, [isAuthenticated, loadTimeline]);

  const handleConnect = async () => {
    try {
      const result = await authenticate("");
      if (result.success) {
        toast.success("Connected to Lens Protocol!");
      } else {
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error) {
      toast.error("Failed to connect to Lens Protocol");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.author.metadata?.name || post.author.username?.localName || post.author.username?.fullHandle || 'Unknown')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "trending" && (post.stats?.reactions || 0) > 10) ||
      (selectedFilter === "challenges" && post.content.includes("#"));

    return matchesSearch && matchesFilter;
  });

  // Using consolidated formatters from utils

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <Wind className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Community Feed</h1>
            <p className="text-muted-foreground">
              Connect your wallet to join the breathing community and share your
              mindfulness journey.
            </p>
          </div>
          <WalletConnection />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <Users className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Join the Community</h1>
            <p className="text-muted-foreground">
              Authenticate with Lens Protocol to share your breathing sessions
              and connect with other practitioners.
            </p>
          </div>
          <Button onClick={handleConnect} size="lg">
            Connect to Lens Protocol
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Community Feed</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Share your mindfulness journey and discover breathing sessions from
          practitioners around the world.
        </p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {communityStats.totalSessions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {communityStats.activeUsers}
            </div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {(communityStats.totalMinutes / 60).toFixed(0)}h
            </div>
            <div className="text-sm text-muted-foreground">Mindful Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary truncate">
              {communityStats.topPattern}
            </div>
            <div className="text-sm text-muted-foreground">Top Pattern</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search sessions, users, or patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Feed Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {isLoadingTimeline ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading community feed...</p>
            </div>
          ) : timelineError ? (
            <Alert>
              <AlertDescription>{timelineError}</AlertDescription>
            </Alert>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Wind className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No sessions found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Be the first to share a breathing session!"}
                </p>
              </div>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {post.author.metadata?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {post.author.metadata?.name || "Anonymous"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          @{post.author.username?.localName || "unknown"}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.timestamp))} ago
                        </span>
                      </div>
                      <p className="text-sm mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Heart className="w-4 h-4 mr-1" />
                          {post.stats?.reactions || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.stats?.comments || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Share className="w-4 h-4 mr-1" />
                          {post.stats?.reposts || 0}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Profile Card */}
          {currentAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {currentAccount.metadata?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {currentAccount.metadata?.name || "Anonymous"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{currentAccount.username?.fullHandle || "user.lens"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">12</div>
                    <div className="text-xs text-muted-foreground">
                      Sessions
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">45</div>
                    <div className="text-xs text-muted-foreground">
                      Followers
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Challenge */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Active Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {activeChallenge.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeChallenge.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Participants</span>
                <Badge variant="secondary">
                  {activeChallenge.participants}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reward</span>
                <span className="font-medium">{activeChallenge.reward}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time left</span>
                  <span className="font-medium">12 days</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: "60%" }}
                  ></div>
                </div>
              </div>

              <Button className="w-full" size="sm">
                Join Challenge
              </Button>

              <div className="text-xs text-center text-muted-foreground">
                Use {activeChallenge.hashtag} in your posts
              </div>
            </CardContent>
          </Card>

          {/* Trending Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "4-7-8 Breathing", sessions: 234, trend: "+12%" },
                { name: "Box Breathing", sessions: 189, trend: "+8%" },
                { name: "Wim Hof Method", sessions: 156, trend: "+15%" },
                { name: "Coherent Breathing", sessions: 98, trend: "+5%" },
              ].map((pattern, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{pattern.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {pattern.sessions} sessions
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {pattern.trend}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Challenge Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Challenge Leaders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  user: "Sarah M.",
                  sessions: 28,
                  streak: "28 days",
                  position: 1,
                },
                {
                  user: "Alex K.",
                  sessions: 25,
                  streak: "25 days",
                  position: 2,
                },
                {
                  user: "Maya P.",
                  sessions: 23,
                  streak: "20 days",
                  position: 3,
                },
                {
                  user: "David L.",
                  sessions: 21,
                  streak: "18 days",
                  position: 4,
                },
              ].map((leader, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold">
                      {leader.position}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{leader.user}</div>
                      <div className="text-xs text-muted-foreground">
                        {leader.streak} streak
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {leader.sessions}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  user: "Sarah M.",
                  action: "completed day 28 of #30DayBreathingReset",
                  time: "2 hours ago",
                  isChallenge: true,
                },
                {
                  user: "Alex K.",
                  action: "shared their breathing journey",
                  time: "4 hours ago",
                  isChallenge: false,
                },
                {
                  user: "Maya P.",
                  action: "joined #30DayBreathingReset challenge",
                  time: "6 hours ago",
                  isChallenge: true,
                },
                {
                  user: "David L.",
                  action: "created a custom pattern",
                  time: "8 hours ago",
                  isChallenge: false,
                },
              ].map((activity, index) => (
                <div key={index} className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{activity.user}</span>
                    <span>{activity.action}</span>
                    {activity.isChallenge && (
                      <Badge variant="secondary" className="text-xs">
                        Challenge
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityFeed;
