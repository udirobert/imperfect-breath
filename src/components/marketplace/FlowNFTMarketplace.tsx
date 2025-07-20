import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription } from "../ui/alert";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Share2,
  ExternalLink,
  Coins,
  Eye,
  Play,
  Zap,
  Award,
  TrendingUp,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useFlow } from "../../hooks/useFlow";
import { useLens } from "../../hooks/useLens";
import type { BreathingPatternNFT } from "../../lib/flow/types";

interface MarketplaceFilters {
  category: string;
  difficulty: string;
  priceRange: [number, number];
  aiScore: number;
  verified: boolean;
  searchTerm: string;
}

interface FlowNFTWithMetadata extends BreathingPatternNFT {
  owner: string;
  price?: number;
  isForSale: boolean;
  views: number;
  likes: number;
  effectiveness: number;
  testSessions: number;
}

export const FlowNFTMarketplace: React.FC = () => {
  const {
    state: flowState,
    user: flowUser,
    getNFTs,
    transferNFT,
    isTransacting,
    error: flowError,
    connect: connectFlow,
  } = useFlow({ network: "testnet" });

  const {
    isAuthenticated: lensAuthenticated,
    shareBreathingPattern,
    isPosting,
  } = useLens();

  // State
  const [nfts, setNfts] = useState<FlowNFTWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedNFT, setSelectedNFT] = useState<FlowNFTWithMetadata | null>(
    null,
  );
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: "all",
    difficulty: "all",
    priceRange: [0, 1000],
    aiScore: 0,
    verified: false,
    searchTerm: "",
  });

  // Load NFTs from connected wallets and public collections
  const loadMarketplaceNFTs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load user's NFTs if connected
      let allNFTs: FlowNFTWithMetadata[] = [];

      if (flowState.isConnected && flowUser?.addr) {
        const userNFTs = await getNFTs(flowUser.addr);
        allNFTs = userNFTs.map((nft) => ({
          ...nft,
          owner: flowUser.addr!,
          isForSale: false,
          views: Math.floor(Math.random() * 100) + 10,
          likes: Math.floor(Math.random() * 50) + 5,
          effectiveness: Math.floor(Math.random() * 30) + 70,
          testSessions: Math.floor(Math.random() * 10) + 1,
          image:
            nft.image || "https://via.placeholder.com/300x300?text=Pattern",
          creator: nft.creator || flowUser.addr!,
          royalties: nft.royalties || [],
        }));
      }

      // Add some mock public NFTs for demo
      const mockPublicNFTs: FlowNFTWithMetadata[] = [
        {
          id: "public-1",
          name: "4-7-8 Relaxation Master",
          description: "Perfect for evening wind-down and stress relief",
          owner: "0x1234...5678",
          image: "https://via.placeholder.com/300x300?text=4-7-8+Pattern",
          creator: "0x1234...5678",
          royalties: [],
          attributes: {
            inhale: 4,
            hold: 7,
            exhale: 8,
            rest: 0,
            difficulty: "intermediate",
            category: "stress",
            tags: ["relaxation", "sleep", "stress-relief"],
            totalCycles: 8,
            estimatedDuration: 152,
          },
          metadata: {
            name: "4-7-8 Relaxation Master",
            description: "Perfect for evening wind-down and stress relief",
            image: "https://via.placeholder.com/300x300?text=4-7-8+Pattern",
            attributes: [],
          },
          isForSale: true,
          price: 0.5,
          views: 342,
          likes: 89,
          effectiveness: 92,
          testSessions: 156,
        },
        {
          id: "public-2",
          name: "Box Breathing Focus",
          description: "Enhanced concentration and mental clarity",
          owner: "0xabcd...efgh",
          image: "https://via.placeholder.com/300x300?text=Box+Breathing",
          creator: "0xabcd...efgh",
          royalties: [],
          attributes: {
            inhale: 4,
            hold: 4,
            exhale: 4,
            rest: 4,
            difficulty: "beginner",
            category: "focus",
            tags: ["focus", "productivity", "mental-clarity"],
            totalCycles: 12,
            estimatedDuration: 192,
          },
          metadata: {
            name: "Box Breathing Focus",
            description: "Enhanced concentration and mental clarity",
            image: "https://via.placeholder.com/300x300?text=Box+Breathing",
            attributes: [],
          },
          isForSale: true,
          price: 0.3,
          views: 278,
          likes: 67,
          effectiveness: 87,
          testSessions: 203,
        },
        {
          id: "public-3",
          name: "Energy Boost 3-1-3",
          description: "Quick energy boost for morning routines",
          owner: "0x9876...4321",
          image: "https://via.placeholder.com/300x300?text=Energy+Boost",
          creator: "0x9876...4321",
          royalties: [],
          attributes: {
            inhale: 3,
            hold: 1,
            exhale: 3,
            rest: 1,
            difficulty: "beginner",
            category: "energy",
            tags: ["energy", "morning", "quick-boost"],
            totalCycles: 15,
            estimatedDuration: 120,
          },
          metadata: {
            name: "Energy Boost 3-1-3",
            description: "Quick energy boost for morning routines",
            image: "https://via.placeholder.com/300x300?text=Energy+Boost",
            attributes: [],
          },
          isForSale: true,
          price: 0.2,
          views: 156,
          likes: 34,
          effectiveness: 78,
          testSessions: 89,
        },
      ];

      allNFTs = [...allNFTs, ...mockPublicNFTs];
      setNfts(allNFTs);
    } catch (error) {
      console.error("Failed to load marketplace NFTs:", error);
      toast.error("Failed to load NFTs");
    } finally {
      setIsLoading(false);
    }
  }, [flowState.isConnected, flowUser?.addr, getNFTs]);

  // Filter NFTs based on current filters
  const filteredNFTs = nfts.filter((nft) => {
    if (
      filters.searchTerm &&
      !nft.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.category !== "all" &&
      nft.attributes.category !== filters.category
    ) {
      return false;
    }
    if (
      filters.difficulty !== "all" &&
      nft.attributes.difficulty !== filters.difficulty
    ) {
      return false;
    }
    if (nft.effectiveness < filters.aiScore) {
      return false;
    }
    if (filters.verified && !nft.testSessions) {
      return false;
    }
    return true;
  });

  // Handle NFT purchase/transfer
  const handlePurchaseNFT = useCallback(
    async (nft: FlowNFTWithMetadata) => {
      if (!flowState.isConnected) {
        await connectFlow();
        return;
      }

      try {
        // In a real implementation, this would involve marketplace contracts
        toast.info("Purchase functionality coming soon!");
      } catch (error) {
        console.error("Purchase failed:", error);
        toast.error("Purchase failed");
      }
    },
    [flowState.isConnected, connectFlow],
  );

  // Handle sharing to Lens
  const handleShareToLens = useCallback(
    async (nft: FlowNFTWithMetadata) => {
      try {
        const pattern = {
          id: nft.id,
          name: nft.name,
          description: nft.description,
          category: nft.attributes.category,
          difficulty: nft.attributes.difficulty,
          duration: nft.attributes.estimatedDuration,
          creator: nft.owner,
          phases: [],
          tags: nft.attributes.tags || [],
          targetAudience: ["general"],
        };

        await shareBreathingPattern(pattern);
        toast.success("Shared to Lens Protocol!");
      } catch (error) {
        console.error("Lens sharing failed:", error);
        toast.error("Failed to share to Lens");
      }
    },
    [shareBreathingPattern],
  );

  // Load NFTs on mount and connection changes
  useEffect(() => {
    loadMarketplaceNFTs();
  }, [loadMarketplaceNFTs]);

  const renderFilters = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patterns..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Category</label>
          <select
            className="w-full p-2 border rounded"
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            <option value="all">All Categories</option>
            <option value="stress">Stress Relief</option>
            <option value="sleep">Sleep</option>
            <option value="energy">Energy</option>
            <option value="focus">Focus</option>
            <option value="performance">Performance</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Difficulty</label>
          <select
            className="w-full p-2 border rounded"
            value={filters.difficulty}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, difficulty: e.target.value }))
            }
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">
            Min AI Score: {filters.aiScore}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.aiScore}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                aiScore: parseInt(e.target.value),
              }))
            }
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="verified"
            checked={filters.verified}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, verified: e.target.checked }))
            }
          />
          <label htmlFor="verified" className="text-sm">
            Tested patterns only
          </label>
        </div>
      </CardContent>
    </Card>
  );

  const renderNFTCard = (nft: FlowNFTWithMetadata) => (
    <Card
      key={nft.id}
      className="hover:shadow-lg transition-shadow cursor-pointer"
    >
      <CardHeader className="pb-3">
        <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {nft.attributes.inhale}-{nft.attributes.hold}-
              {nft.attributes.exhale}-{nft.attributes.rest}
            </div>
            <div className="text-sm text-muted-foreground">
              Breathing Pattern
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight">{nft.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {nft.description}
            </p>
          </div>
          <div className="flex flex-col items-end ml-2">
            <Badge variant="outline" className="text-xs mb-1">
              {nft.attributes.difficulty}
            </Badge>
            <Badge className="text-xs">{nft.attributes.category}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {nft.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {nft.likes}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{nft.effectiveness}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-3 w-3" />
            <span>{nft.testSessions} test sessions</span>
            {nft.testSessions > 100 && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {nft.isForSale && nft.price && (
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-green-600">
                    {nft.price} FLOW
                  </span>
                </div>
              )}
              {nft.owner === flowUser?.addr && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Owned
                </Badge>
              )}
            </div>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedNFT(nft)}
              >
                <Play className="h-4 w-4" />
              </Button>

              {nft.isForSale && nft.price && nft.owner !== flowUser?.addr && (
                <Button
                  size="sm"
                  onClick={() => handlePurchaseNFT(nft)}
                  disabled={isTransacting}
                >
                  {isTransacting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Coins className="h-4 w-4" />
                  )}
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShareToLens(nft)}
                disabled={isPosting}
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderNFTListItem = (nft: FlowNFTWithMetadata) => (
    <Card key={nft.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <div className="text-xs font-bold text-blue-600 text-center">
              {nft.attributes.inhale}-{nft.attributes.hold}-
              {nft.attributes.exhale}-{nft.attributes.rest}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{nft.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {nft.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {nft.attributes.difficulty}
                  </Badge>
                  <Badge className="text-xs">{nft.attributes.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {nft.effectiveness}% effective
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {nft.isForSale && nft.price && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <Coins className="h-4 w-4" />
                      <span className="font-bold">{nft.price} FLOW</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedNFT(nft)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  {nft.isForSale &&
                    nft.price &&
                    nft.owner !== flowUser?.addr && (
                      <Button
                        size="sm"
                        onClick={() => handlePurchaseNFT(nft)}
                        disabled={isTransacting}
                      >
                        Buy
                      </Button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderNFTDetail = () =>
    selectedNFT && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{selectedNFT.name}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {selectedNFT.description}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedNFT(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {selectedNFT.attributes.inhale}-{selectedNFT.attributes.hold}-
                  {selectedNFT.attributes.exhale}-{selectedNFT.attributes.rest}
                </div>
                <div className="text-lg text-muted-foreground">
                  {selectedNFT.attributes.totalCycles} cycles •{" "}
                  {Math.round(selectedNFT.attributes.estimatedDuration / 60)}{" "}
                  min
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {selectedNFT.effectiveness}%
                </div>
                <div className="text-xs text-muted-foreground">AI Score</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {selectedNFT.testSessions}
                </div>
                <div className="text-xs text-muted-foreground">
                  Test Sessions
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{selectedNFT.views}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{selectedNFT.likes}</div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Pattern Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Inhale: {selectedNFT.attributes.inhale}s</div>
                <div>Hold: {selectedNFT.attributes.hold}s</div>
                <div>Exhale: {selectedNFT.attributes.exhale}s</div>
                <div>Rest: {selectedNFT.attributes.rest}s</div>
                <div>Difficulty: {selectedNFT.attributes.difficulty}</div>
                <div>Category: {selectedNFT.attributes.category}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedNFT.attributes.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Try Pattern
              </Button>
              {selectedNFT.isForSale &&
                selectedNFT.price &&
                selectedNFT.owner !== flowUser?.addr && (
                  <Button
                    className="flex-1"
                    onClick={() => handlePurchaseNFT(selectedNFT)}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Buy for {selectedNFT.price} FLOW
                  </Button>
                )}
              <Button
                variant="outline"
                onClick={() => handleShareToLens(selectedNFT)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flow NFT Marketplace</h1>
          <p className="text-muted-foreground">
            Discover, trade, and collect breathing pattern NFTs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadMarketplaceNFTs}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!flowState.isConnected && (
        <Alert>
          <AlertDescription>
            Connect your Flow wallet to see your owned NFTs and enable
            purchasing.
            <Button onClick={connectFlow} className="ml-2" size="sm">
              Connect Wallet
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {flowError && (
        <Alert variant="destructive">
          <AlertDescription>{flowError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">{renderFilters()}</div>

        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredNFTs.length} patterns found
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Trending patterns</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading marketplace...</p>
            </div>
          ) : filteredNFTs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                No patterns found matching your criteria
              </div>
              <Button
                onClick={() =>
                  setFilters({
                    category: "all",
                    difficulty: "all",
                    priceRange: [0, 1000],
                    aiScore: 0,
                    verified: false,
                    searchTerm: "",
                  })
                }
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div
              className={`${
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }`}
            >
              {filteredNFTs.map((nft) =>
                viewMode === "grid"
                  ? renderNFTCard(nft)
                  : renderNFTListItem(nft),
              )}
            </div>
          )}
        </div>
      </div>

      {renderNFTDetail()}
    </div>
  );
};
