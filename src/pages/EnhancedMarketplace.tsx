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

// Mock instructor data
const mockInstructors: InstructorProfile[] = [
  {
    id: "instructor_1",
    name: "Dr. Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b422?w=150&h=150&fit=crop&crop=face",
    bio: "Breathwork therapist with 15+ years experience. Specializes in stress-relief and performance breathing.",
    verified: true,
    specializations: ["stress-relief", "performance", "mindfulness"],
    totalPatterns: 23,
    totalEarnings: 12.5,
    rating: 4.9,
    students: 15420,
    yearsExperience: 15,
  },
  {
    id: "instructor_2",
    name: "Marcus Torres",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Former Navy SEAL turned breathing coach. Expert in high-performance breathing for athletes.",
    verified: true,
    specializations: ["performance", "energy", "focus"],
    totalPatterns: 18,
    totalEarnings: 8.7,
    rating: 4.8,
    students: 9240,
    yearsExperience: 8,
  },
  {
    id: "instructor_3",
    name: "Luna Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    bio: "Yoga instructor and meditation teacher. Creates beautiful, gentle breathing patterns for sleep and relaxation.",
    verified: true,
    specializations: ["sleep", "stress-relief", "mindfulness"],
    totalPatterns: 31,
    totalEarnings: 15.2,
    rating: 4.9,
    students: 22100,
    yearsExperience: 12,
  },
];

// Mock pattern data with rich instructor context
const mockPatterns: MarketplacePattern[] = [
  {
    id: "pattern_1",
    name: "Navy SEAL Box Breathing",
    description:
      "The exact breathing technique used by Navy SEALs for stress management and performance under pressure. Master mental resilience.",
    instructor: mockInstructors[1],
    category: "performance",
    difficulty: "intermediate",
    duration: 16000, // 16 seconds per cycle
    expectedSessionDuration: 10,
    hasVideo: true,
    hasAudio: true,
    hasGuided: true,
    videoPreview: "https://www.youtube.com/watch?v=tybOi4hjZFQ", // Example link
    rating: 4.9,
    reviews: 2847,
    sessions: 145230,
    favorites: 8942,
    price: 0.08,
    currency: "ETH",
    isFree: false,
    primaryBenefits: [
      "Reduce anxiety by 70%",
      "Improve focus within 2 minutes",
      "Build mental resilience",
    ],
    successRate: 89,
    avgImprovementTime: 3,
    tags: ["military-grade", "performance", "stress-management", "focus"],
    featured: true,
    trending: true,
    new: false,
  },
  {
    id: "pattern_2",
    name: "Sleep Sanctuary Waves",
    description:
      "Gentle, flowing breathing pattern that mimics ocean waves. Fall asleep 3x faster with this science-backed technique.",
    instructor: mockInstructors[2],
    category: "sleep",
    difficulty: "beginner",
    duration: 24000, // 24 seconds per cycle
    expectedSessionDuration: 15,
    hasVideo: false,
    hasAudio: true,
    hasGuided: true,
    rating: 4.8,
    reviews: 1923,
    sessions: 89456,
    favorites: 5634,
    price: 0.05,
    currency: "ETH",
    isFree: false,
    primaryBenefits: [
      "Fall asleep 3x faster",
      "Improve sleep quality by 85%",
      "Reduce nighttime anxiety",
    ],
    successRate: 92,
    avgImprovementTime: 7,
    tags: ["sleep", "relaxation", "anxiety-relief", "bedtime"],
    featured: true,
    trending: false,
    new: false,
  },
  {
    id: "pattern_3",
    name: "Therapeutic Trauma Release",
    description:
      "Evidence-based breathing technique developed from 15 years of clinical practice. Gentle trauma-informed approach.",
    instructor: mockInstructors[0],
    category: "stress",
    difficulty: "beginner",
    duration: 20000,
    expectedSessionDuration: 20,
    hasVideo: true,
    hasAudio: true,
    hasGuided: true,
    rating: 4.9,
    reviews: 3456,
    sessions: 198745,
    favorites: 12453,
    price: 0.12,
    currency: "ETH",
    isFree: false,
    primaryBenefits: [
      "Process trauma safely",
      "Reduce PTSD symptoms by 60%",
      "Build emotional regulation",
    ],
    successRate: 87,
    avgImprovementTime: 14,
    tags: ["trauma-informed", "therapy", "emotional-healing", "clinical"],
    featured: true,
    trending: false,
    new: false,
  },
  {
    id: "pattern_4",
    name: "Morning Energy Ignition",
    description:
      "Start your day with explosive energy! This energizing technique replaces your morning coffee naturally.",
    instructor: mockInstructors[1],
    category: "energy",
    difficulty: "intermediate",
    duration: 12000,
    expectedSessionDuration: 8,
    hasVideo: true,
    hasAudio: false,
    hasGuided: false,
    rating: 4.7,
    reviews: 1234,
    sessions: 67890,
    favorites: 3421,
    price: 0.03,
    currency: "ETH",
    isFree: false,
    primaryBenefits: [
      "3x morning energy",
      "Replace caffeine naturally",
      "Boost metabolism by 25%",
    ],
    successRate: 84,
    avgImprovementTime: 1,
    tags: ["morning", "energy", "natural", "metabolism"],
    featured: false,
    trending: true,
    new: true,
  },
  {
    id: "pattern_5",
    name: "Free Stress Relief Basics",
    description:
      "Perfect introduction to breathwork. Learn the fundamentals of stress-relief breathing completely free.",
    instructor: mockInstructors[0],
    category: "stress",
    difficulty: "beginner",
    duration: 12000,
    expectedSessionDuration: 5,
    hasVideo: true,
    hasAudio: false,
    hasGuided: false,
    rating: 4.6,
    reviews: 5643,
    sessions: 234567,
    favorites: 18745,
    price: 0,
    currency: "ETH",
    isFree: true,
    primaryBenefits: [
      "Learn breathwork basics",
      "Immediate stress relief",
      "Gateway to advanced techniques",
    ],
    successRate: 78,
    avgImprovementTime: 1,
    tags: ["free", "beginner", "basics", "introduction"],
    featured: false,
    trending: false,
    new: false,
  },
];

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
  const [patterns, setPatterns] = useState<MarketplacePattern[]>(mockPatterns);
  const [selectedPattern, setSelectedPattern] =
    useState<MarketplacePattern | null>(null);

  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch =
      pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || pattern.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" || pattern.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
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
        {mockInstructors.map((instructor) => (
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
                  {mockInstructors.length}
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
