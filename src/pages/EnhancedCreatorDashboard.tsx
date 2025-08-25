import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  Users,
  Settings,
  Edit,
  Trash2,
  Share2,
  Crown,
  Star,
  Calendar,
  Clock,
  Video,
  Volume2,
  Sparkles,
  Award,
  Heart,
  Play,
  BarChart3,
  Target,
  Zap,
  Moon,
  Brain,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { PatternStorageService } from "../lib/patternStorage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { useFullAuth } from "@/auth";
import { usePatternCreation } from "../hooks/usePatternCreation";
import {
  BlockchainSelector,
  type BlockchainType,
} from "../components/blockchain/BlockchainSelector";

const patternStorageService = new PatternStorageService();

interface CreatorStats {
  totalPatterns: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalStudents: number;
  avgRating: number;
  totalSessions: number;
  conversionRate: number;
  topCategory: string;
}

interface PatternStats {
  id: string;
  name: string;
  description: string;
  category: "stress" | "sleep" | "focus" | "energy" | "performance";
  difficulty: "beginner" | "intermediate" | "advanced";

  // Creation info
  createdAt: string;
  lastUpdated: string;
  status: "draft" | "published" | "paused";

  // Content
  hasVideo: boolean;
  hasAudio: boolean;
  hasGuided: boolean;
  duration: number; // seconds
  expectedSessionDuration: number; // minutes

  // Performance
  totalSessions: number;
  uniqueUsers: number;
  rating: number;
  reviews: number;
  favorites: number;

  // Monetization
  price: number;
  currency: "ETH" | "USDC";
  isFree: boolean;
  totalEarnings: number;
  monthlyEarnings: number;
  licenseSales: number;

  // IP & Blockchain
  // Success metrics
  completionRate: number;
  retentionRate: number;
  userSatisfaction: number;
}

// Import APIs for real data
import { getCreatorPatterns, getCreatorStats } from "../lib/api/creatorService";
import { handleError } from "../lib/errors/error-types";

const categoryIcons = {
  stress: Heart,
  sleep: Moon,
  focus: Target,
  energy: Zap,
  performance: Award,
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
};

const EnhancedCreatorDashboard = () => {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<PatternStats[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PatternStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedBlockchain, setSelectedBlockchain] =
    useState<BlockchainType>("lens");
  const [showBlockchainSelector, setShowBlockchainSelector] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const unifiedAuth = useFullAuth();
  const { getAvailableBlockchains, getRecommendedBlockchain } =
    usePatternCreation();

  // Fetch real creator data on component mount
  useEffect(() => {
    const fetchCreatorData = async () => {
      setLoading(true);
      try {
        // Fetch patterns and stats in parallel
        const [creatorPatterns, creatorStats] = await Promise.all([
          getCreatorPatterns(),
          getCreatorStats(),
        ]);

        setPatterns(creatorPatterns);
        setStats(creatorStats);
      } catch (error) {
        console.error("Failed to load creator data:", error);
        toast({
          title: "Failed to load data",
          description:
            "Could not load your creator data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [toast]);

  const handleCreatePattern = () => {
    // Check if multiple blockchains are available
    const availableChains = getAvailableBlockchains();

    if (availableChains.length > 1) {
      setShowBlockchainSelector(true);
    } else if (availableChains.length === 1) {
      // Auto-select the only available blockchain
      setSelectedBlockchain(availableChains[0]);
      navigate("/create-pattern", {
        state: {
          blockchain: availableChains[0],
          enableRoyalties: true,
        },
      });
    } else {
      // No blockchain connected
      toast({
        title: "Connect a Wallet",
        description: "Please connect a wallet to create patterns.",
        variant: "destructive",
      });
    }
  };

  const handleBlockchainSelected = () => {
    setShowBlockchainSelector(false);
    navigate("/create-pattern", {
      state: {
        blockchain: selectedBlockchain,
        enableRoyalties: false,
      },
    });
  };

  const handleEditPattern = (pattern: PatternStats) => {
    navigate("/create-pattern", { state: { editPattern: pattern } });
  };

  // If loading, show a loading state
  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading your creator dashboard...
          </p>
        </div>
      </div>
    );
  }

  const PatternCard = ({ pattern }: { pattern: PatternStats }) => {
    const CategoryIcon = categoryIcons[pattern.category];

    return (
      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-primary/10">
                <CategoryIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {pattern.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {pattern.description}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditPattern(pattern)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Pattern
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPattern(pattern)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge className={statusColors[pattern.status]}>
              {pattern.status}
            </Badge>
            <Badge variant="outline">{pattern.difficulty}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                <span>Students</span>
              </div>
              <div className="font-semibold">
                {pattern.uniqueUsers.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Play className="h-3 w-3" />
                <span>Sessions</span>
              </div>
              <div className="font-semibold">
                {pattern.totalSessions.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Star className="h-3 w-3" />
                <span>Rating</span>
              </div>
              <div className="font-semibold">
                {pattern.rating} ({pattern.reviews})
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                <span>Earnings</span>
              </div>
              <div className="font-semibold text-green-600">
                {pattern.isFree
                  ? "Free"
                  : `${pattern.totalEarnings.toFixed(3)} ETH`}
              </div>
            </div>
          </div>

          {/* Content Types */}
          <div className="flex items-center gap-2">
            {pattern.hasVideo && (
              <Badge variant="outline" className="text-xs">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
            {pattern.hasAudio && (
              <Badge variant="outline" className="text-xs">
                <Volume2 className="h-3 w-3 mr-1" />
                Audio
              </Badge>
            )}
            {pattern.hasGuided && (
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Guided
              </Badge>
            )}
          </div>

          {/* Success Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{pattern.completionRate}%</span>
            </div>
            <Progress value={pattern.completionRate} className="h-1" />

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">User Satisfaction</span>
              <span className="font-medium">{pattern.userSatisfaction}%</span>
            </div>
            <Progress value={pattern.userSatisfaction} className="h-1" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const StatsCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    trend,
    color = "text-primary",
  }: {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ElementType;
    trend?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
            )}
          </div>
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600 font-medium">{trend}</span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Creator Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your breathing patterns and track your impact
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={handleCreatePattern}
                className="bg-gradient-to-r from-green-600 to-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Pattern
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Earnings"
                value={`${stats.totalEarnings.toFixed(3)} ETH`}
                subValue={`${stats.monthlyEarnings.toFixed(3)} ETH this month`}
                icon={DollarSign}
                trend="+12.5%"
                color="text-green-600"
              />
              <StatsCard
                title="Total Students"
                value={stats.totalStudents.toLocaleString()}
                subValue="Active learners"
                icon={Users}
                trend="+8.3%"
              />
              <StatsCard
                title="Avg Rating"
                value={stats.avgRating.toString()}
                subValue="Across all patterns"
                icon={Star}
                trend="+0.2"
              />
              <StatsCard
                title="Total Sessions"
                value={stats.totalSessions.toLocaleString()}
                subValue="Completed by students"
                icon={Play}
                trend="+15.7%"
              />
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleCreatePattern}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Pattern
                  </Button>

                  <Button
                    onClick={() => navigate("/marketplace")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View in Marketplace
                  </Button>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-semibold text-green-600">
                      {stats.conversionRate}%
                    </span>
                  </div>
                  <Progress value={stats.conversionRate} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Top Category</span>
                    <Badge className="capitalize">{stats.topCategory}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Your stress-relief patterns are performing 23% above average
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Top Performing Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patterns
                    .filter((p) => p.status === "published")
                    .sort((a, b) => b.totalEarnings - a.totalEarnings)
                    .slice(0, 3)
                    .map((pattern, index) => (
                      <div
                        key={pattern.id}
                        className="flex items-center gap-4 p-3 rounded-lg border"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {pattern.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {pattern.uniqueUsers.toLocaleString()} students •{" "}
                            {pattern.rating} ⭐
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {pattern.totalEarnings.toFixed(3)} ETH
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pattern.licenseSales} licenses
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            {/* Patterns Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your Patterns</h2>
                <p className="text-muted-foreground">
                  {patterns.length} patterns •{" "}
                  {patterns.filter((p) => p.status === "published").length}{" "}
                  published
                </p>
              </div>
              <Button onClick={handleCreatePattern}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Pattern
              </Button>
            </div>

            {/* Patterns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patterns.map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>

            {patterns.length === 0 && (
              <div className="text-center py-12">
                <div className="p-6 rounded-full bg-muted w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Plus className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Create Your First Pattern
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start sharing your breathing expertise with the world
                </p>
                <Button onClick={handleCreatePattern}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pattern
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Detailed analytics and insights coming soon
              </p>
            </div>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Earnings Dashboard</h3>
              <p className="text-muted-foreground">
                Detailed earnings tracking coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Creator Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="royalty">Default Royalty Percentage</Label>
              <Input
                id="royalty"
                type="number"
                min="0"
                max="50"
                value={royaltyPercentage}
                onChange={(e) => setRoyaltyPercentage(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of license fees you'll receive (0-50%)
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowSettingsDialog(false)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pattern Detail Modal */}
      <Dialog
        open={!!selectedPattern}
        onOpenChange={() => setSelectedPattern(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedPattern && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPattern.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {selectedPattern.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Students:</span>
                        <span>
                          {selectedPattern.uniqueUsers.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sessions:</span>
                        <span>
                          {selectedPattern.totalSessions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span>{selectedPattern.rating} ⭐</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Earnings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {selectedPattern.totalEarnings.toFixed(3)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly:</span>
                        <span>
                          {selectedPattern.monthlyEarnings.toFixed(3)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Licenses:</span>
                        <span>{selectedPattern.licenseSales}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Blockchain Selection Dialog */}
      <Dialog
        open={showBlockchainSelector}
        onOpenChange={setShowBlockchainSelector}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Blockchain for Your Pattern</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Select the blockchain where you'd like to create your breathing
              pattern. Each blockchain offers different features and benefits.
            </div>
          </DialogHeader>

          <div className="py-4">
            <BlockchainSelector
              value={selectedBlockchain}
              onChange={setSelectedBlockchain}
              filter={(option) =>
                getAvailableBlockchains().includes(option.value)
              }
              showFeatures={true}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {unifiedAuth.hasFlowAccount &&
                selectedBlockchain === "flow" &&
                "✨ Flow is optimized for NFT creation with low fees"}
              {unifiedAuth.hasLensProfile &&
                selectedBlockchain === "lens" &&
                "🌟 Lens enables social sharing and community features"}
              {unifiedAuth.hasWallet &&
                ["ethereum", "arbitrum", "base"].includes(selectedBlockchain) &&
                "⚡ EVM chains offer broad ecosystem compatibility"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBlockchainSelector(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleBlockchainSelected}>
                Create on{" "}
                {selectedBlockchain.charAt(0).toUpperCase() +
                  selectedBlockchain.slice(1)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedCreatorDashboard;
