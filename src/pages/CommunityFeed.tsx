import React, { useState, useEffect } from "react";
import { useAuth } from "@/auth/useAuth";
import { useLens } from "@/hooks/useLens";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  CheckCircle,
  Sparkles,
  ArrowRight,
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
  // Use consolidated auth system
  const auth = useAuth({ blockchain: true, lens: true });
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showWelcome, setShowWelcome] = useState(false);
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
    if (isAuthenticated && currentAccount) {
      loadTimeline(true);
    }
  }, [isAuthenticated, currentAccount, loadTimeline]);

  // Check for welcome flow from onboarding
  useEffect(() => {
    const isWelcome = searchParams.get("welcome") === "true";
    const fromOnboarding = searchParams.get("source") === "onboarding";

    if (isWelcome && fromOnboarding) {
      setShowWelcome(true);
      // Clean up URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("welcome");
      newParams.delete("source");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleLensConnect = async () => {
    try {
      if (!auth.wallet?.address) {
        toast.error("Please connect your wallet first");
        return;
      }

      const result = await authenticate(auth.wallet.address);
      if (result.success) {
        toast.success("Connected to Lens Protocol!");
        // Load initial data
        loadTimeline(true);
      } else {
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Lens connection error:", error);
      toast.error("Failed to connect to Lens Protocol");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (
        post.author.metadata?.name ||
        post.author.username?.localName ||
        post.author.username?.fullHandle ||
        "Unknown"
      )
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "trending" && (post.stats?.reactions || 0) > 10) ||
      (selectedFilter === "challenges" && post.content.includes("#"));

    return matchesSearch && matchesFilter;
  });

  // Check if wallet is connected
  if (!auth.hasWallet) {
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

  if (!isAuthenticated && auth.hasWallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <Users className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Join the Community</h1>
            <p className="text-muted-foreground">
              Connect to Lens Protocol to share your breathing sessions and
              connect with other practitioners worldwide.
            </p>
          </div>
          <div className="space-y-4">
            <Button onClick={handleLensConnect} size="lg">
              Connect to Lens Protocol
            </Button>
            <p className="text-sm text-muted-foreground">
              Connected wallet:{" "}
              {auth.wallet?.address
                ? `${auth.wallet.address.slice(0, 6)}...${auth.wallet.address.slice(-4)}`
                : "None"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Community Welcome Dialog - Premium Design */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative">
              <Users className="h-7 w-7 text-slate-600" />
            </div>
            <DialogTitle className="text-xl font-medium text-slate-800 tracking-tight mb-2">
              Welcome to Our Community
            </DialogTitle>
            <DialogDescription className="text-center">
              <p className="text-slate-600 leading-relaxed">
                Join <span className="font-medium text-slate-800">1,200+</span>{" "}
                practitioners building lasting breathing habits together
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-slate-600 flex-shrink-0" />
                <span className="text-slate-700">
                  Daily support and encouragement
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Heart className="h-4 w-4 text-slate-600 flex-shrink-0" />
                <span className="text-slate-700">
                  3x higher consistency with peers
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Sparkles className="h-4 w-4 text-slate-600 flex-shrink-0" />
                <span className="text-slate-700">
                  Access to expert techniques
                </span>
              </div>
            </div>

            {/* Subtle Stats */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-medium text-slate-800">
                    1,247
                  </div>
                  <div className="text-xs text-slate-600">Sessions Today</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-slate-800">89</div>
                  <div className="text-xs text-slate-600">Active Now</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-slate-800">3x</div>
                  <div className="text-xs text-slate-600">Better Results</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white transition-all duration-300"
              >
                Explore Community
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Your mindful breathing journey begins here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header - Refined */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-medium text-slate-800 tracking-tight">
            Community Feed
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect with fellow practitioners and discover breathing techniques
            from our wellness community
          </p>

          {/* Subtle Activity Indicator */}
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full" />
              <span>89 active</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span>1.2k sessions today</span>
            </div>
          </div>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {communityStats.totalSessions.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
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
                <p className="text-muted-foreground">
                  Loading community feed...
                </p>
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
                          <span className="text-sm text-muted-foreground">
                            •
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(post.timestamp))} ago
                          </span>
                        </div>
                        <p className="text-sm mb-3">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            {post.stats?.reactions || 0}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.stats?.comments || 0}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
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
                    Your Lens Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {currentAccount.metadata?.name?.[0] ||
                          currentAccount.username?.localName?.[0] ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {currentAccount.metadata?.name ||
                          currentAccount.username?.localName ||
                          "Anonymous"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentAccount.username?.fullHandle ||
                          `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentAccount.metadata?.bio ||
                      "Welcome to the breathing community!"}
                  </div>

                  {/* Profile Stats */}
                  {currentAccount.stats && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="font-medium">
                          {currentAccount.stats.posts || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Posts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {currentAccount.stats.followers || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Followers
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wallet Info */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Connected: {auth.wallet?.chain || "Unknown"}</span>
                      <Badge variant="outline" className="text-xs">
                        {auth.isFullyConnected ? "Fully Connected" : "Partial"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Challenge Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Active Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-medium">{activeChallenge.name}</h3>
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
                <Button className="w-full" size="sm">
                  Join Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Trending Hashtags */}
            <Card>
              <CardHeader>
                <CardTitle>Trending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["#breathing", "#mindfulness", "#wellness", "#meditation"].map(
                  (tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{tag}</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityFeed;
