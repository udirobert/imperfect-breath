import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  licenseManager,
  formatLicensePrice,
} from "@/lib/licensing/licenseManager";
import type { CustomPattern } from "@/lib/ai/providers";
import type { LicenseTerms, LicenseAgreement } from "@/types/blockchain";

interface MarketplacePattern extends CustomPattern {
  rating: number;
  reviews: number;
  downloads: number;
  featured: boolean;
  price: number;
  currency: string;
  creatorName: string;
  creatorAvatar?: string;
  previewUrl?: string;
  tags: string[];
}

interface MarketplaceFilters {
  category?: string;
  difficulty?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  duration?: string;
  sortBy?: "popularity" | "price" | "rating" | "newest";
}

// Mock data - replace with actual API calls
const mockPatterns: MarketplacePattern[] = [
  {
    id: "pattern_1",
    name: "Ocean Waves Breathing",
    description:
      "A calming breathing pattern inspired by the rhythm of ocean waves. Perfect for stress relief and relaxation.",
    phases: [
      { name: "inhale", duration: 4000, text: "Breathe in like a wave rising" },
      { name: "hold", duration: 2000, text: "Hold at the peak" },
      { name: "exhale", duration: 6000, text: "Release like a wave receding" },
    ],
    category: "stress",
    difficulty: "beginner",
    duration: 12,
    creator: "oceanBreather123",
    creatorName: "Marina Waves",
    rating: 4.8,
    reviews: 1247,
    downloads: 5690,
    featured: true,
    price: 0.05,
    currency: "ETH",
    tags: ["relaxation", "stress-relief", "beginner-friendly"],
  },
  {
    id: "pattern_2",
    name: "Power Focus 4-7-8",
    description:
      "Advanced breathing technique for intense focus and mental clarity. Used by professionals worldwide.",
    phases: [
      { name: "inhale", duration: 4000, text: "Inhale through nose" },
      { name: "hold", duration: 7000, text: "Hold with intention" },
      { name: "exhale", duration: 8000, text: "Exhale completely" },
    ],
    category: "focus",
    difficulty: "advanced",
    duration: 19,
    creator: "focusMaster",
    creatorName: "Dr. Focus",
    rating: 4.9,
    reviews: 892,
    downloads: 3240,
    featured: false,
    price: 0.15,
    currency: "ETH",
    tags: ["focus", "productivity", "advanced"],
  },
  {
    id: "pattern_3",
    name: "Sleep Journey",
    description:
      "Gentle breathing pattern designed to guide you into peaceful sleep. Perfect for bedtime routine.",
    phases: [
      { name: "inhale", duration: 3000, text: "Breathe in peace" },
      { name: "hold", duration: 1000, text: "Let go of the day" },
      { name: "exhale", duration: 5000, text: "Release into rest" },
    ],
    category: "sleep",
    difficulty: "beginner",
    duration: 9,
    creator: "sleepGuide",
    creatorName: "Luna Dreams",
    rating: 4.7,
    reviews: 2156,
    downloads: 8930,
    featured: true,
    price: 0.03,
    currency: "ETH",
    tags: ["sleep", "relaxation", "bedtime"],
  },
];

const Marketplace = () => {
  const [patterns, setPatterns] = useState<MarketplacePattern[]>(mockPatterns);
  const [filteredPatterns, setFilteredPatterns] =
    useState<MarketplacePattern[]>(mockPatterns);
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPattern, setSelectedPattern] =
    useState<MarketplacePattern | null>(null);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [availableLicenses, setAvailableLicenses] = useState<LicenseTerms[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const { user, wallet, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const applyFilters = useCallback(() => {
    let filtered = [...patterns];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pattern.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          pattern.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        (pattern) => pattern.category === filters.category,
      );
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(
        (pattern) => pattern.difficulty === filters.difficulty,
      );
    }

    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(
        (pattern) =>
          pattern.price >= filters.priceRange!.min &&
          pattern.price <= filters.priceRange!.max,
      );
    }

    // Rating filter
    if (filters.rating) {
      filtered = filtered.filter(
        (pattern) => pattern.rating >= filters.rating!,
      );
    }

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case "popularity":
            return b.downloads - a.downloads;
          case "price":
            return a.price - b.price;
          case "rating":
            return b.rating - a.rating;
          case "newest":
            return new Date(b.id).getTime() - new Date(a.id).getTime();
          default:
            return 0;
        }
      });
    }

    setFilteredPatterns(filtered);
  }, [patterns, filters, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handlePatternSelect = async (pattern: MarketplacePattern) => {
    setSelectedPattern(pattern);
    setLoading(true);

    try {
      const licenses = await licenseManager.getAvailableLicenseTerms(
        pattern.id,
      );
      setAvailableLicenses(licenses);
    } catch (error) {
      console.error("Failed to load license terms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLicensePurchase = async (terms: LicenseTerms) => {
    if (!user || !wallet || !selectedPattern) {
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const license = await licenseManager.purchaseLicense(
        selectedPattern.id,
        terms,
        wallet,
      );

      console.log("License purchased successfully:", license);
      setShowLicenseDialog(false);

      // Navigate to user's library or show success message
      navigate("/progress"); // Assuming this shows user's patterns
    } catch (error) {
      console.error("License purchase failed:", error);
      // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (pattern: MarketplacePattern) => {
    // Navigate to a preview version of the breathing session
    navigate("/session", { state: { previewPattern: pattern } });
  };

  const PatternCard = ({ pattern }: { pattern: MarketplacePattern }) => (
    <Card
      className={`h-full transition-all hover:shadow-lg ${pattern.featured ? "ring-2 ring-blue-500" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg line-clamp-1">
              {pattern.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              by {pattern.creatorName}
            </p>
          </div>
          {pattern.featured && (
            <Badge variant="secondary" className="text-xs">
              Featured
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{pattern.rating}</span>
          </div>
          <span className="text-muted-foreground">({pattern.reviews})</span>
          <div className="flex items-center gap-1 ml-auto">
            <Users className="h-4 w-4" />
            <span>{pattern.downloads}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {pattern.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {pattern.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pattern.category}</Badge>
            <Badge variant="outline">{pattern.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{pattern.duration}s</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {formatLicensePrice(pattern.price, pattern.currency)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreview(pattern)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={() => {
                handlePatternSelect(pattern);
                setShowLicenseDialog(true);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              License
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Breathing Pattern Marketplace
        </h1>
        <p className="text-muted-foreground">
          Discover and license unique breathing patterns created by our
          community
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patterns, creators, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Select
            value={filters.category || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, category: value || undefined }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="stress">Stress Relief</SelectItem>
              <SelectItem value="sleep">Sleep</SelectItem>
              <SelectItem value="focus">Focus</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.difficulty || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                difficulty: value || undefined,
              }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy || ""}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                sortBy:
                  (value as "popularity" | "price" | "rating" | "newest") ||
                  undefined,
              }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured Patterns */}
      {filteredPatterns.some((p) => p.featured) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured Patterns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatterns
              .filter((p) => p.featured)
              .map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
          </div>
        </div>
      )}

      {/* All Patterns */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All Patterns ({filteredPatterns.length})
          </TabsTrigger>
          <TabsTrigger value="stress">Stress Relief</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="focus">Focus</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPatterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </TabsContent>

        {["stress", "sleep", "focus"].map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPatterns
                .filter((p) => p.category === category)
                .map((pattern) => (
                  <PatternCard key={pattern.id} pattern={pattern} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* License Purchase Dialog */}
      <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose License Type</DialogTitle>
          </DialogHeader>

          {selectedPattern && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="font-semibold">{selectedPattern.name}</h3>
                <p className="text-sm text-muted-foreground">
                  by {selectedPattern.creatorName}
                </p>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading license options...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableLicenses.map((license) => (
                    <Card key={license.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold capitalize">
                            {license.type}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {license.type === "personal" &&
                              "For personal use only"}
                            {license.type === "commercial" &&
                              "For commercial use"}
                            {license.type === "exclusive" && "Exclusive rights"}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {license.duration
                              ? `${license.duration} days`
                              : "Lifetime"}
                            {license.maxUsers &&
                              ` • Max ${license.maxUsers} users`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {formatLicensePrice(
                              license.price,
                              license.currency,
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleLicensePurchase(license)}
                            disabled={loading || !isAuthenticated}
                          >
                            {!isAuthenticated ? "Login Required" : "Purchase"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!isAuthenticated && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <Button variant="link" onClick={() => navigate("/auth")}>
                      Sign in
                    </Button>{" "}
                    to purchase licenses
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredPatterns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No patterns found matching your criteria.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setFilters({});
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
