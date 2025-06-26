import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  Download,
  Settings,
  Edit,
  Trash2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoStoryIntegration } from "@/lib/story/storyClient";
import { PatternStorageService, CustomPattern } from "@/lib/patternStorage";
import { useAuth } from "@/hooks/useAuth";
import { enhancePattern, EnhancedCustomPattern } from "@/types/patterns";
import { useToast } from "@/hooks/use-toast";

const patternStorageService = new PatternStorageService();

interface CreatorStats {
  totalPatterns: number;
  totalEarnings: number;
  totalDownloads: number;
  monthlyEarnings: number;
  activePatterns: number;
}

interface PatternWithStats extends CustomPattern {
  ipRegistered: boolean;
  ipHash?: string;
  earnings: number;
  downloads: number;
  rating: number;
  reviews: number;
  status: "draft" | "published" | "suspended";
  lastUpdated: string;
}

const CreatorDashboard = () => {
  const [patterns, setPatterns] = useState<PatternWithStats[]>([]);
  const [stats, setStats] = useState<CreatorStats>({
    totalPatterns: 0,
    totalEarnings: 0,
    totalDownloads: 0,
    monthlyEarnings: 0,
    activePatterns: 0,
  });
  const [selectedPattern, setSelectedPattern] =
    useState<PatternWithStats | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const loadCreatorData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userPatterns = await patternStorageService.getUserPatterns(user.id);
      const patternsWithStats: PatternWithStats[] = userPatterns.map(
        (p: CustomPattern) => ({
          ...p,
          // Mocking stats for now as per integration plan
          ipRegistered: !!p.ipAssetId,
          ipHash: p.ipAssetId,
          earnings: 0,
          downloads: 0,
          rating: 0,
          reviews: 0,
          status: "published", // Default status
          lastUpdated: new Date().toISOString(), // Placeholder
        })
      );
      setPatterns(patternsWithStats);
      setStats((prev) => ({
        ...prev,
        totalPatterns: userPatterns.length,
        activePatterns: userPatterns.length,
      }));
    } catch (error) {
      console.error("Failed to load creator data:", error);
      toast({
        title: "Error",
        description: "Could not load your patterns. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadCreatorData();
    } else {
      // Handle case where user is not logged in
      setLoading(false);
      // Optionally, redirect to login or show a message
    }
  }, [user, loadCreatorData]);

  const handleRegisterIP = async (pattern: PatternWithStats) => {
    setLoading(true);
    try {
      // Demo mode - use Story Protocol demo integration
      const ipAssetId = await demoStoryIntegration.registerPatternDemo(pattern);

      // Update pattern with IP registration info
      setPatterns((prev) =>
        prev.map((p) =>
          p.id === pattern.id
            ? { ...p, ipRegistered: true, ipHash: ipAssetId }
            : p
        )
      );

      console.log("✅ Demo IP registered successfully:", ipAssetId);
    } catch (error) {
      console.error("IP registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePattern = async (patternId: string) => {
    setLoading(true);
    try {
      await patternStorageService.deletePattern(patternId);
      toast({
        title: "Success",
        description: "Pattern deleted successfully.",
      });
      setShowDeleteDialog(false);
      setSelectedPattern(null);
      await loadCreatorData(); // Refresh data
    } catch (error) {
      console.error("Failed to delete pattern:", error);
      toast({
        title: "Error",
        description: "Failed to delete the pattern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPattern = (pattern: PatternWithStats) => {
    const enhanced = enhancePattern(pattern);
    navigate("/create-pattern", { state: { editPattern: enhanced } });
  };

  const handleSharePattern = async (pattern: PatternWithStats) => {
    const shareUrl = `${window.location.origin}/marketplace/${pattern.id}`;
    try {
      await navigator.share({
        title: pattern.name,
        text: pattern.description,
        url: shareUrl,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl);
      console.log("Pattern URL copied to clipboard");
    }
  };

  const formatCurrency = (amount: number, currency: string = "ETH") => {
    return `${amount.toFixed(4)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const PatternCard = ({ pattern }: { pattern: PatternWithStats }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">
              {pattern.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {pattern.description}
            </p>
          </div>
          <Badge className={getStatusColor(pattern.status)}>
            {pattern.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(pattern.earnings)}
            </div>
            <div className="text-xs text-muted-foreground">Earnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{pattern.downloads}</div>
            <div className="text-xs text-muted-foreground">Downloads</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pattern.category}</Badge>
            <Badge variant="outline">{pattern.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span>{pattern.rating}</span>
            <span className="text-muted-foreground">({pattern.reviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-muted-foreground">
            Updated: {formatDate(pattern.lastUpdated)}
          </div>
          {pattern.ipRegistered ? (
            <Badge variant="secondary" className="text-xs">
              IP Registered
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegisterIP(pattern)}
              disabled={loading}
            >
              Register IP
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleEditPattern(pattern)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSharePattern(pattern)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPattern(pattern);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Demo mode - no auth required

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your breathing patterns and track your earnings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => navigate("/create-pattern")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Pattern
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Patterns
                </p>
                <p className="text-2xl font-bold">{stats.totalPatterns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Downloads
                </p>
                <p className="text-2xl font-bold">
                  {stats.totalDownloads.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Earnings
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.monthlyEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Patterns
                </p>
                <p className="text-2xl font-bold">{stats.activePatterns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">My Patterns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patterns.slice(0, 5).map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">
                          {pattern.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pattern.downloads} downloads • {pattern.rating}★
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(pattern.earnings)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["stress", "focus", "sleep", "energy"].map((category) => {
                    const categoryPatterns = patterns.filter(
                      (p) => p.category === category
                    );
                    const percentage =
                      (categoryPatterns.length / patterns.length) * 100;
                    return (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize">{category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {categoryPatterns.length}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patterns.slice(0, 8).map((pattern, index) => (
                    <div
                      key={pattern.id}
                      className="flex items-center justify-between py-2 border-b"
                    >
                      <div>
                        <p className="font-medium">{pattern.name}</p>
                        <p className="text-sm text-muted-foreground">
                          License purchase
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +{formatCurrency(0.05)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(Math.random() * 30)} days ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Earnings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Available Balance
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalEarnings)}
                    </p>
                    <Button className="mt-2 w-full" size="sm">
                      Withdraw
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">This Month</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(stats.monthlyEarnings)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Month</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(0.65)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(0.12)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Pattern Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pattern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm">
                Are you sure you want to delete "{selectedPattern?.name}"? This
                action cannot be undone.
              </p>
              {selectedPattern?.ipRegistered && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ This pattern is IP registered. Deleting it may affect
                  existing licenses.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedPattern && handleDeletePattern(selectedPattern.id)
                }
                disabled={loading}
              >
                Delete Pattern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default CreatorDashboard;
