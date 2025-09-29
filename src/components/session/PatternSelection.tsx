import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Star,
  Clock,
  Users,
  Plus,
  Filter,
  Heart,
  Zap,
  Moon,
  Focus,
} from "lucide-react";
import { formatDuration } from "@/lib/utils/formatters";
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
import { BREATHING_PATTERNS } from "@/lib/breathingPatterns";
import type { CustomPattern } from "@/lib/ai/providers";

// CLEAN: Import centralized recommendation logic (DRY principle)
import { RecommendationService } from "@/services/RecommendationService";
import { MoodBasedRecommendations } from "./MoodBasedRecommendations";

// Goal-based categories - ORGANIZED without duplication
const WELLNESS_CATEGORIES = {
  focus: {
    icon: Focus,
    label: "Focus & Clarity",
    patterns: ["box", "mindfulness"],
  },
  relaxation: { icon: Heart, label: "Stress Relief", patterns: ["relaxation"] },
  energy: {
    icon: Zap,
    label: "Energy & Vitality",
    patterns: ["energy", "wim_hof"],
  },
  sleep: { icon: Moon, label: "Sleep & Rest", patterns: ["sleep"] },
};

interface PatternSelectionProps {
  userLibrary: CustomPattern[];
  onPatternSelect: (pattern: CustomPattern | null) => void;
  onCreateNew: () => void;
}

interface PatternWithStats extends CustomPattern {
  rating?: number;
  usageCount?: number;
  lastUsed?: string;
  featured?: boolean;
}

// Convert built-in patterns to CustomPattern format
const getBuiltInPatterns = (): PatternWithStats[] => {
  return Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => ({
    id: key,
    name: pattern.name,
    description: pattern.description,
    phases: [
      { name: "inhale" as const, duration: pattern.inhale * 1000 },
      { name: "hold" as const, duration: pattern.hold * 1000 },
      { name: "exhale" as const, duration: pattern.exhale * 1000 },
      { name: "hold_after_exhale" as const, duration: pattern.hold_after_exhale * 1000 },
    ],
    category: "stress",
    difficulty: "beginner",
    duration: pattern.inhale + pattern.hold + pattern.exhale + pattern.hold_after_exhale,
    creator: "Built-in",
    rating: 4.5 + Math.random() * 0.5,
    usageCount: Math.floor(Math.random() * 1000),
    featured: key === "box",
    tags: [],
    targetAudience: [],
    primaryBenefits: [],
    secondaryBenefits: [],
    instructorName: "Built-in Instructor",
    instructorCredentials: ["Certified Breathing Coach"],
    access: {
      type: "free",
      currency: "ETH",
    },
  }));
};

export const PatternSelection: React.FC<PatternSelectionProps> = ({
  userLibrary,
  onPatternSelect,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [builtInPatterns] = useState<PatternWithStats[]>(getBuiltInPatterns());
  const [allPatterns, setAllPatterns] = useState<PatternWithStats[]>([]);
  const [filteredPatterns, setFilteredPatterns] = useState<PatternWithStats[]>(
    []
  );
  const navigate = useNavigate();

  // ENHANCEMENT FIRST: Smart recommendations with user input
  const [userRecommendations, setUserRecommendations] = useState<any[]>([]);
  const [showMoodSelector, setShowMoodSelector] = useState(true);
  
  // PERFORMANT: Fallback to cached time-based recommendations
  const [fallbackRecommendations, setFallbackRecommendations] = useState<any[]>([]);
  
  useEffect(() => {
    RecommendationService.getTimeBasedRecommendations("beginner")
      .then(setFallbackRecommendations)
      .catch(console.error);
  }, []);
  
  const activeRecommendations = userRecommendations.length > 0 ? userRecommendations : fallbackRecommendations;

  // CLEAN: Use centralized greeting service
  const timeGreeting = RecommendationService.getTimeGreeting();

  useEffect(() => {
    // Combine built-in patterns with user library
    const combined = [
      ...builtInPatterns,
      ...userLibrary.map((pattern) => ({
        ...pattern,
        rating: 4.0 + Math.random(),
        usageCount: Math.floor(Math.random() * 100),
        lastUsed: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })),
    ];
    setAllPatterns(combined);
  }, [builtInPatterns, userLibrary]);

  useEffect(() => {
    let filtered = [...allPatterns];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pattern.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (pattern) => pattern.category === selectedCategory
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.usageCount || 0) - (a.usageCount || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "recent":
          return (
            new Date(b.lastUsed || 0).getTime() -
            new Date(a.lastUsed || 0).getTime()
          );
        case "alphabetical":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredPatterns(filtered);
  }, [allPatterns, searchQuery, selectedCategory, sortBy]);

  const handlePatternSelect = (pattern: PatternWithStats) => {
    // Convert back to the format expected by the breathing session
    const sessionPattern = {
      key: pattern.id,
      name: pattern.name,
      phases: pattern.phases,
      cycles: 5, // Default cycles
      hasBreathHold: false,
    };

    // Store the selected pattern and navigate to session
    localStorage.setItem("selectedPattern", JSON.stringify(sessionPattern));
    onPatternSelect(pattern);
  };

  // Using consolidated formatters from utils

  const PatternCard = ({ pattern }: { pattern: PatternWithStats }) => {
    const isRecommended = activeRecommendations.some(rec => rec.patternId === pattern.id);
    const recommendationData = activeRecommendations.find(rec => rec.patternId === pattern.id);

    return (
      <Card
        className={`h-full transition-all hover:shadow-lg cursor-pointer ${
          pattern.featured ? "ring-2 ring-blue-500" : ""
        } ${
          isRecommended
            ? "ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-orange-50"
            : ""
        }`}
        onClick={() => handlePatternSelect(pattern)}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                {pattern.name}
                {isRecommended && recommendationData && (
                  <Badge
                    variant="default"
                    className="text-xs bg-gradient-to-r from-amber-500 to-orange-500"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {recommendationData.badge || "Perfect match"}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                by {pattern.creator}
              </p>
            </div>
            {pattern.featured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
          </div>

          {pattern.rating && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{pattern.rating.toFixed(1)}</span>
              </div>
              {pattern.usageCount && (
                <div className="flex items-center gap-1 ml-auto">
                  <Users className="h-4 w-4" />
                  <span>{pattern.usageCount}</span>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {pattern.description}
          </p>

          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {pattern.category}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {pattern.difficulty}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(pattern.duration)}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {pattern.phases.length} phases •{" "}
            {pattern.lastUsed
              ? `Last used ${new Date(pattern.lastUsed).toLocaleDateString()}`
              : "Never used"}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {timeGreeting}! Choose Your Breathing Pattern
        </h1>
        <p className="text-muted-foreground mb-4">
          Select from our curated collection or your personal library
        </p>
        
        {/* ENHANCEMENT: Mood-based recommendations for user delight */}
        {showMoodSelector && (
          <MoodBasedRecommendations
            variant="compact"
            onRecommendationsUpdate={(recs) => {
              setUserRecommendations(recs);
              if (recs.length > 0) {
                setShowMoodSelector(false);
              }
            }}
            className="mb-6"
          />
        )}
      </div>

      {/* ENHANCED: Smart Recommendations with Clear Explanations */}
      {activeRecommendations.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-amber-500 mr-2" />
              <h3 className="font-semibold">
                {userRecommendations.length > 0 ? "Perfect for your mood" : "Recommended for now"}
              </h3>
            </div>
            {userRecommendations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUserRecommendations([]);
                  setShowMoodSelector(true);
                }}
                className="text-xs"
              >
                Change mood
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeRecommendations.slice(0, 4).map((rec) => {
              const pattern = builtInPatterns.find((p) => p.id === rec.patternId);
              return pattern ? (
                <Button
                  key={rec.patternId}
                  variant="outline"
                  className="h-auto p-4 bg-white/80 hover:bg-white text-left"
                  onClick={() => handlePatternSelect(pattern)}
                >
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold">{pattern.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {rec.badge || "Perfect match"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rec.explanation || rec.reason || "Great for your wellness goals"}
                    </div>
                  </div>
                </Button>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onCreateNew}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="stress">Stress Relief</SelectItem>
              <SelectItem value="sleep">Sleep</SelectItem>
              <SelectItem value="focus">Focus</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="recent">Recently Used</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
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

      {/* Pattern Library */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All Patterns ({filteredPatterns.length})
          </TabsTrigger>
          <TabsTrigger value="built-in">
            Built-in ({builtInPatterns.length})
          </TabsTrigger>
          <TabsTrigger value="my-library">
            My Library ({userLibrary.length})
          </TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPatterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="built-in" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPatterns
              .filter((p) => p.creator === "Built-in")
              .map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="my-library" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPatterns
              .filter((p) => p.creator !== "Built-in")
              .map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
          </div>
          {userLibrary.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No patterns in your library yet.
              </p>
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Pattern
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPatterns
              .filter((p) => p.lastUsed)
              .sort(
                (a, b) =>
                  new Date(b.lastUsed!).getTime() -
                  new Date(a.lastUsed!).getTime()
              )
              .slice(0, 8)
              .map((pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Favorites feature coming soon!
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {filteredPatterns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No patterns found matching your criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Quick Start Options */}
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-16"
            onClick={() =>
              handlePatternSelect(builtInPatterns.find((p) => p.id === "box")!)
            }
          >
            <div className="text-center">
              <div className="font-semibold">Box Breathing</div>
              <div className="text-xs text-muted-foreground">
                Classic 4-4-4-4 pattern
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-16"
            onClick={() =>
              handlePatternSelect(builtInPatterns.find((p) => p.id === "calm")!)
            }
          >
            <div className="text-center">
              <div className="font-semibold">Calm Breathing</div>
              <div className="text-xs text-muted-foreground">
                Gentle relaxation
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-16"
            onClick={() => navigate("/marketplace")}
          >
            <div className="text-center">
              <div className="font-semibold">Explore Marketplace</div>
              <div className="text-xs text-muted-foreground">
                Discover new patterns
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
