import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Eye,
  Play,
  Heart,
  Brain,
  Target,
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
  MessageCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { PatternStorageService, CustomPattern } from "@/lib/patternStorage";
import { ReviewService, PatternReview } from "@/lib/reviewService";

const patternStorageService = new PatternStorageService();
const reviewService = new ReviewService();

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

interface MarketplacePattern {
  id: string;
  name: string;
  description: string;
  instructor: InstructorProfile;
  category: "stress" | "sleep" | "focus" | "energy" | "performance";
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // in seconds
  expectedSessionDuration: number; // in minutes

  // Content
  hasVideo: boolean;
  hasAudio: boolean;
  hasGuided: boolean;
  videoPreview?: string;
  audioPreview?: string;

  // Social proof
  rating: number;
  reviews: number;
  sessions: number; // total sessions completed
  favorites: number;

  // Pricing
  price: number;
  currency: "ETH" | "USDC";
  isFree: boolean;

  // Benefits & Claims
  primaryBenefits: string[];
  successRate?: number; // % of users who achieve claimed benefit
  avgImprovementTime?: number; // days to see improvement

  // Tags
  tags: string[];
  featured: boolean;
  trending: boolean;
  new: boolean;
}

const categoryIcons = {
  stress: Heart,
  sleep: Moon,
  focus: Target,
  energy: Zap,
  performance: Award,
};

const EnhancedMarketplace = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [patterns, setPatterns] = useState<MarketplacePattern[]>([]);
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] =
    useState<MarketplacePattern | null>(null);

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

        const reviewsByPattern = allReviews.reduce((acc, review) => {
          (acc[review.pattern_id] = acc[review.pattern_id] || []).push(review);
          return acc;
        }, {} as Record<string, PatternReview[]>);

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
          (p) => {
            const patternReviews = reviewsByPattern[p.id] || [];
            const rating =
              patternReviews.length > 0
                ? patternReviews.reduce((sum, r) => sum + r.rating, 0) /
                  patternReviews.length
                : 0;

            return {
              id: p.id,
              name: p.name,
              description: p.description,
              instructor: instructorMap.get(p.creator)!,
              category: p.category,
              difficulty: p.difficulty,
              duration: p.duration,
              expectedSessionDuration: Math.round(p.duration / 60),
              hasVideo: !!(p.mediaContent as any)?.video,
              hasAudio: !!(p.mediaContent as any)?.audio,
              hasGuided: !!(p.mediaContent as any)?.guided,
              rating,
              reviews: patternReviews.length,
              sessions: 0, // Mock data
              favorites: 0, // Mock data
              price: (p.licensingInfo as any)?.price || 0,
              currency: (p.licensingInfo as any)?.currency || "ETH",
              isFree:
                !(p.licensingInfo as any)?.price ||
                (p.licensingInfo as any)?.price === 0,
              primaryBenefits: [], // Mock data
              tags: [], // Mock data
              featured: false, // Mock data
              trending: false, // Mock data
              new: false, // Mock data
            };
          }
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

  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch =
      pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || pattern.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" || pattern.difficulty === selectedDifficulty;
    const matchesFree = !showFree || pattern.isFree;
    const matchesVideo = !hasVideo || pattern.hasVideo;
    const matchesAudio = !hasAudio || pattern.hasAudio;

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
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
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
          {/* Preview Image/Video Area */}
          <div className="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 rounded-full bg-background/80 backdrop-blur-sm">
                <CategoryIcon className="h-12 w-12 text-primary" />
              </div>
            </div>

            {/* Media Indicators */}
            <div className="absolute bottom-3 left-3 flex gap-2">
              {pattern.hasVideo && (
                <Badge
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              )}
              {pattern.hasAudio && (
                <Badge
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Audio
                </Badge>
              )}
            </div>

            {/* Quick Action */}
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

          {/* Content */}
          <div className="p-6">
            {/* Header */}
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
                    {pattern.price} {pattern.currency}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {pattern.description}
            </p>

            {/* Benefits */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {pattern.primaryBenefits.slice(0, 2).map((benefit, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
                {pattern.primaryBenefits.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{pattern.primaryBenefits.length - 2} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={pattern.instructor.avatar} />
                <AvatarFallback>
                  {pattern.instructor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm truncate">
                    {pattern.instructor.name}
                  </span>
                  {pattern.instructor.verified && (
                    <Verified className="h-3 w-3 text-blue-600" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pattern.instructor.totalPatterns} patterns •{" "}
                  {pattern.instructor.students.toLocaleString()} students
                </div>
              </div>
            </div>

            {/* Stats */}
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

            {/* Success Metrics */}
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
      {/* Hero Section */}
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

          {/* Search & Filters */}
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

            {/* Advanced Filters */}
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

            {/* Quick Stats */}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="patterns">Browse Patterns</TabsTrigger>
            <TabsTrigger value="instructors">Featured Instructors</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns">
            {/* Results Info */}
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

            {/* Pattern Grid */}
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

      {/* Pattern Detail Modal */}
      <Dialog
        open={!!selectedPattern}
        onOpenChange={() => setSelectedPattern(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPattern && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl mb-2">
                      {selectedPattern.name}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedPattern.description}
                    </DialogDescription>
                  </div>
                  <div className="text-right">
                    {selectedPattern.isFree ? (
                      <Badge className="bg-green-600 text-lg px-3 py-1">
                        FREE
                      </Badge>
                    ) : (
                      <div className="text-2xl font-bold">
                        {selectedPattern.price} {selectedPattern.currency}
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Instructor & Content */}
                <div className="space-y-6">
                  {/* Instructor Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Instructor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={selectedPattern.instructor.avatar}
                          />
                          <AvatarFallback className="text-lg">
                            {selectedPattern.instructor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">
                              {selectedPattern.instructor.name}
                            </h3>
                            {selectedPattern.instructor.verified && (
                              <Verified className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {selectedPattern.instructor.yearsExperience} years
                              exp.
                            </span>
                            <span>•</span>
                            <span>
                              {selectedPattern.instructor.students.toLocaleString()}{" "}
                              students
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedPattern.instructor.bio}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {selectedPattern.instructor.specializations.map(
                          (spec) => (
                            <Badge
                              key={spec}
                              variant="outline"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Content Included */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What's Included</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedPattern.hasVideo && (
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">
                              Instructional Video
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Step-by-step technique demonstration
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPattern.hasAudio && (
                        <div className="flex items-center gap-3">
                          <Volume2 className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">
                              Guided Audio Session
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Voice-guided breathing practice
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">Breathing Pattern</div>
                          <div className="text-sm text-muted-foreground">
                            Custom timing and instructions
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Benefits & Stats */}
                <div className="space-y-6">
                  {/* Benefits */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Expected Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedPattern.primaryBenefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      {selectedPattern.successRate && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              Success Rate
                            </span>
                            <span className="text-sm font-bold text-green-600">
                              {selectedPattern.successRate}%
                            </span>
                          </div>
                          {selectedPattern.avgImprovementTime && (
                            <div className="text-xs text-muted-foreground">
                              Most users see results within{" "}
                              {selectedPattern.avgImprovementTime} days
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Social Proof */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Social Proof</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {selectedPattern.rating}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rating
                          </div>
                          <div className="flex justify-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(selectedPattern.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {selectedPattern.sessions.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sessions
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                          {selectedPattern.reviews.toLocaleString()} reviews •{" "}
                          {selectedPattern.favorites.toLocaleString()} favorites
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        // Demo licensing action
                        console.log(
                          "Demo: Licensing pattern",
                          selectedPattern.name
                        );
                        navigate("/session", {
                          state: {
                            selectedPattern,
                            isLicensed: true,
                          },
                        });
                      }}
                    >
                      {selectedPattern.isFree ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Free Session
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          License & Practice ({selectedPattern.price}{" "}
                          {selectedPattern.currency})
                        </>
                      )}
                    </Button>

                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Pattern
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMarketplace;
