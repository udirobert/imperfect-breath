import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Star,
  Clock,
  Users,
  Eye,
  Play,
  Heart,
  Zap,
  Moon,
  Award,
  Video,
  Volume2,
  DollarSign,
  Sparkles,
  TrendingUp,
  Crown,
  Verified,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatternStorageService } from "@/lib/patternStorage";
import { ReviewService, PatternReview } from "@/lib/reviewService";
import { useAuth } from "@/hooks/useAuth";
import { PatternRecommendationEngine } from "@/lib/ai/recommendations";
import { PatternDetailsModal } from "@/components/marketplace/PatternDetailsModal";
import {
  EnhancedCustomPattern,
  defaultLicense,
  LicenseSettings,
} from "@/types/patterns";

const patternStorageService = new PatternStorageService();
const reviewService = new ReviewService();
const recommendationEngine = new PatternRecommendationEngine();

interface InstructorProfile {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  verified: boolean;
  specializations: string[];
  totalPatterns: number;
  totalEarnings: number;
  rating: number;
  students: number;
  yearsExperience: number;
}

type MarketplacePattern = EnhancedCustomPattern & {
  expectedSessionDuration: number;
  reviews: number;
  sessions: number;
  favorites: number;
  isFree: boolean;
  featured: boolean;
  trending: boolean;
  new: boolean;
  rating: number;
  successRate?: number;
  avgImprovementTime?: number;
};

const categoryIcons = {
  stress: Heart,
  sleep: Moon,
  focus: Sparkles,
  energy: Zap,
  performance: Award,
};

const EnhancedMarketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [patterns, setPatterns] = useState<MarketplacePattern[]>([]);
  const [recommendedPatterns, setRecommendedPatterns] = useState<
    MarketplacePattern[]
  >([]);
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [selectedPattern, setSelectedPattern] =
    useState<MarketplacePattern | null>(null);
  const [licensedPatterns, setLicensedPatterns] = useState<string[]>([]);

  // Advanced filter states
  const [showFree, setShowFree] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    const fetchPatternsAndReviews = async () => {
      setLoading(true);
      try {
        const [fetchedPatterns, allReviews] = await Promise.all([
          patternStorageService.searchPatterns({}),
          reviewService.getAllReviews(),
        ]);

        const reviewsByPattern = allReviews.reduce(
          (acc, review) => {
            (acc[review.pattern_id] = acc[review.pattern_id] || []).push(
              review,
            );
            return acc;
          },
          {} as Record<string, PatternReview[]>,
        );

        const instructorMap = new Map<string, InstructorProfile>();
        fetchedPatterns.forEach((p) => {
          if (!instructorMap.has(p.creator)) {
            instructorMap.set(p.creator, {
              id: p.creator,
              name: `Creator ${p.creator.substring(0, 6)}`,
              avatar: `https://i.pravatar.cc/150?u=${p.creator}`,
              bio: "A passionate breathwork creator.",
              verified: false,
              specializations: ["mindfulness"],
              totalPatterns: 0,
              totalEarnings: 0,
              rating: 4.5,
              students: 0,
              yearsExperience: 1,
            });
          }
          const instructor = instructorMap.get(p.creator)!;
          instructor.totalPatterns += 1;
        });

        const marketplacePatterns: MarketplacePattern[] = fetchedPatterns.map(
          (p: EnhancedCustomPattern) => {
            const patternReviews = reviewsByPattern[p.id] || [];
            const rating =
              patternReviews.length > 0
                ? patternReviews.reduce((sum, r) => sum + r.rating, 0) /
                  patternReviews.length
                : 0;
            const instructor = instructorMap.get(p.creator)!;
            const licenseSettings =
              (p.licensingInfo as LicenseSettings) || defaultLicense;

            return {
              ...p,
              mediaContent: p.mediaContent || {},
              tags: [],
              targetAudience: [],
              primaryBenefits: [],
              secondaryBenefits: [],
              instructorName: instructor.name,
              instructorBio: instructor.bio,
              instructorCredentials: instructor.specializations,
              instructorAvatar: instructor.avatar,
              licenseSettings,
              hasProgressTracking: false,
              hasAIFeedback: false,
              customInstructions: "",
              preparationNotes: "",
              postSessionNotes: "",
              expectedSessionDuration: Math.round(p.duration / 60),
              rating,
              reviews: patternReviews.length,
              sessions: 0,
              favorites: 0,
              isFree: !licenseSettings.price || licenseSettings.price === 0,
              featured: false,
              trending: false,
              new: false,
            };
          },
        );

        setPatterns(marketplacePatterns);
        setInstructors(Array.from(instructorMap.values()));
      } catch (error) {
        console.error("Failed to fetch patterns and reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatternsAndReviews();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (user) {
        setLoadingRecommendations(true);
        try {
          const recommendations =
            await recommendationEngine.getPersonalizedRecommendations(user.id);
          const aiInstructor: InstructorProfile = {
            id: "ai-rec",
            name: "AI Recommender",
            avatar: "/placeholder.svg",
            bio: "Personalized recommendations just for you.",
            verified: true,
            specializations: ["personalization"],
            totalPatterns: 2,
            totalEarnings: 0,
            rating: 5,
            students: 0,
            yearsExperience: 1,
          };

          const mappedRecommendations: MarketplacePattern[] =
            recommendations.map((p: any) => ({
              ...p,
              mediaContent: p.mediaContent || {},
              tags: ["recommended"],
              targetAudience: [],
              primaryBenefits: [],
              secondaryBenefits: [],
              instructorName: aiInstructor.name,
              instructorBio: aiInstructor.bio,
              instructorCredentials: aiInstructor.specializations,
              instructorAvatar: aiInstructor.avatar,
              licenseSettings: defaultLicense,
              hasProgressTracking: false,
              hasAIFeedback: false,
              customInstructions: "",
              preparationNotes: "",
              postSessionNotes: "",
              expectedSessionDuration: Math.round(p.duration / 60),
              rating: 5,
              reviews: 0,
              sessions: 0,
              favorites: 0,
              isFree: true,
              featured: false,
              trending: false,
              new: false,
            }));

          setRecommendedPatterns(mappedRecommendations);
        } catch (error) {
          console.error("Failed to fetch recommendations:", error);
        } finally {
          setLoadingRecommendations(false);
        }
      } else {
        setRecommendedPatterns([]);
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  const handlePurchase = (patternId: string) => {
    setLicensedPatterns((prev) => [...prev, patternId]);
    setSelectedPattern(null);
  };

  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch =
      pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || pattern.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" || pattern.difficulty === selectedDifficulty;
    const matchesFree = !showFree || pattern.isFree;
    const matchesVideo = !hasVideo || (pattern.mediaContent as any)?.video;
    const matchesAudio = !hasAudio || (pattern.mediaContent as any)?.audio;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesDifficulty &&
      matchesFree &&
      matchesVideo &&
      matchesAudio
    );
  });

  const sortedPatterns = [...filteredPatterns].sort((a, b) => {
    switch (sortBy) {
      case "featured":
        return (
          (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating
        );
      case "rating":
        return b.rating - a.rating;
      case "price-low":
        return a.licenseSettings.price - b.licenseSettings.price;
      case "price-high":
        return b.licenseSettings.price - a.licenseSettings.price;
      case "popular":
        return b.sessions - a.sessions;
      default:
        return 0;
    }
  });

  const PatternCard = ({ pattern }: { pattern: MarketplacePattern }) => {
    const CategoryIcon = categoryIcons[pattern.category];

    return (
      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden">
        {pattern.featured && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {pattern.trending && (
          <div className="absolute top-3 right-3 z-10">
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-sm"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          </div>
        )}

        {pattern.new && (
          <div className="absolute top-12 right-3 z-10">
            <Badge className="bg-green-600">New</Badge>
          </div>
        )}

        <CardContent className="p-0">
          <div className="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 rounded-full bg-background/80 backdrop-blur-sm">
                <CategoryIcon className="h-12 w-12 text-primary" />
              </div>
            </div>

            <div className="absolute bottom-3 left-3 flex gap-2">
              {(pattern.mediaContent as any)?.video && (
                <Badge
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              )}
              {(pattern.mediaContent as any)?.audio && (
                <Badge
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Audio
                </Badge>
              )}
            </div>

            <div className="absolute bottom-3 right-3">
              <Button
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPattern(pattern);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                  {pattern.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {pattern.difficulty}
                  </Badge>
                  <span>•</span>
                  <span>{pattern.expectedSessionDuration} min</span>
                </div>
              </div>
              <div className="text-right">
                {pattern.isFree ? (
                  <Badge className="bg-green-600">FREE</Badge>
                ) : (
                  <div className="text-lg font-bold">
                    {pattern.licenseSettings.price}{" "}
                    {pattern.licenseSettings.currency}
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {pattern.description}
            </p>

            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {pattern.primaryBenefits.slice(0, 2).map((benefit, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {benefit.title}
                  </Badge>
                ))}
                {pattern.primaryBenefits.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{pattern.primaryBenefits.length - 2} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={pattern.instructorAvatar} />
                <AvatarFallback>
                  {pattern.instructorName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm truncate">
                    {pattern.instructorName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{pattern.rating}</span>
                  <span className="text-muted-foreground">
                    ({pattern.reviews})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{pattern.sessions.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  {pattern.favorites}
                </span>
              </div>
            </div>

            {pattern.successRate && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-600">
                    {pattern.successRate}%
                  </span>
                </div>
                {pattern.avgImprovementTime && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">
                      Avg. Results In
                    </span>
                    <span className="font-medium">
                      {pattern.avgImprovementTime} days
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const FeaturedInstructors = () => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Featured Instructors</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {instructors.map((instructor) => (
          <Card
            key={instructor.id}
            className="text-center hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-6">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarImage src={instructor.avatar} />
                <AvatarFallback className="text-lg">
                  {instructor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="font-bold">{instructor.name}</h3>
                {instructor.verified && (
                  <Verified className="h-4 w-4 text-blue-600" />
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {instructor.bio}
              </p>

              <div className="flex justify-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-primary">
                    {instructor.totalPatterns}
                  </div>
                  <div className="text-muted-foreground text-xs">Patterns</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-primary">
                    {instructor.students.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground text-xs">Students</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-primary">
                    {instructor.rating}
                  </div>
                  <div className="text-muted-foreground text-xs">Rating</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3 justify-center">
                {instructor.specializations.slice(0, 2).map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Expert Breathing Patterns
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn from certified instructors and transform your wellbeing with
              science-backed breathing techniques
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patterns, instructors, benefits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="stress">🫀 Stress Relief</SelectItem>
                    <SelectItem value="sleep">🌙 Sleep</SelectItem>
                    <SelectItem value="focus">🎯 Focus</SelectItem>
                    <SelectItem value="energy">⚡ Energy</SelectItem>
                    <SelectItem value="performance">🏆 Performance</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  id="showFree"
                  checked={showFree}
                  onChange={(e) => setShowFree(e.target.checked)}
                />
                <label htmlFor="showFree" className="text-sm font-medium">
                  Show Free
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  id="hasVideo"
                  checked={hasVideo}
                  onChange={(e) => setHasVideo(e.target.checked)}
                />
                <label htmlFor="hasVideo" className="text-sm font-medium">
                  Has Video
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  id="hasAudio"
                  checked={hasAudio}
                  onChange={(e) => setHasAudio(e.target.checked)}
                />
                <label htmlFor="hasAudio" className="text-sm font-medium">
                  Has Audio
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {patterns.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Patterns Available
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {instructors.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expert Instructors
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">500K+</div>
                <div className="text-sm text-muted-foreground">
                  Sessions Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">89%</div>
                <div className="text-sm text-muted-foreground">
                  Success Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {user && (loadingRecommendations || recommendedPatterns.length > 0) && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Recommended For You</h2>
            </div>
            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="h-[480px]">
                    <CardContent className="h-full animate-pulse bg-muted" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern)}
                  >
                    <PatternCard pattern={pattern} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="patterns">Browse Patterns</TabsTrigger>
            <TabsTrigger value="instructors">Featured Instructors</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {filteredPatterns.length} Pattern
                  {filteredPatterns.length !== 1 ? "s" : ""} Found
                </h2>
                <p className="text-muted-foreground">
                  Discover breathing techniques from expert instructors
                  worldwide
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <PatternCard pattern={pattern} />
                </div>
              ))}
            </div>

            {sortedPatterns.length === 0 && (
              <div className="text-center py-12">
                <div className="p-6 rounded-full bg-muted w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No patterns found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="instructors">
            <FeaturedInstructors />
          </TabsContent>
        </Tabs>
      </div>

      {selectedPattern && (
        <PatternDetailsModal
          pattern={selectedPattern}
          isOpen={!!selectedPattern}
          onClose={() => setSelectedPattern(null)}
          onPlay={(pattern) => {
            navigate("/session", {
              state: {
                selectedPattern: pattern,
                isLicensed: true,
              },
            });
          }}
          onPurchase={() => {
            if (selectedPattern) {
              handlePurchase(selectedPattern.id);
            }
          }}
          hasAccess={
            selectedPattern.isFree ||
            licensedPatterns.includes(selectedPattern.id)
          }
        />
      )}
    </div>
  );
};

export default EnhancedMarketplace;
