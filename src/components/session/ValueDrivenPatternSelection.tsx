/**
 * Value-Driven Pattern Selection - Enhanced Pattern Discovery
 * 
 * ENHANCEMENT FIRST: Builds on existing PatternSelection with better UX
 * CLEAN: Separates pattern benefits from technical details
 * WELLNESS UX: Helps users understand what they'll achieve
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Star,
  Clock,
  Users,
  Plus,
  Heart,
  Zap,
  Moon,
  Focus,
  Brain,
  Shield,
  Timer,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BREATHING_PATTERNS } from "@/lib/breathingPatterns";
import type { CustomPattern } from "@/lib/ai/providers";
import { SmartPatternRecommendations, type RecommendationContext } from "@/lib/recommendations/SmartPatternRecommendations";

// Enhanced pattern data with user-focused benefits
const ENHANCED_PATTERNS = {
  box: {
    ...BREATHING_PATTERNS.box,
    userBenefit: "Instant stress relief",
    timeToEffect: "30 seconds",
    difficulty: "Beginner",
    bestFor: "First-time users, work stress, anxiety",
    scientificBacking: "Navy SEALs technique",
    icon: Heart,
    color: "green",
    successRate: "98%"
  },
  relaxation: {
    ...BREATHING_PATTERNS.relaxation,
    userBenefit: "Deep relaxation",
    timeToEffect: "2 minutes", 
    difficulty: "Beginner",
    bestFor: "Before sleep, after stressful events",
    scientificBacking: "4-7-8 technique by Dr. Weil",
    icon: Moon,
    color: "blue",
    successRate: "95%"
  },
  wim_hof: {
    ...BREATHING_PATTERNS.wim_hof,
    userBenefit: "Energy boost",
    timeToEffect: "3 minutes",
    difficulty: "Advanced", 
    bestFor: "Morning energy, cold exposure prep",
    scientificBacking: "Wim Hof Method research",
    icon: Zap,
    color: "orange",
    successRate: "87%"
  },
  energy: {
    ...BREATHING_PATTERNS.energy,
    userBenefit: "Mental alertness",
    timeToEffect: "1 minute",
    difficulty: "Intermediate",
    bestFor: "Afternoon slump, pre-workout",
    scientificBacking: "Pranayama tradition",
    icon: Zap,
    color: "yellow",
    successRate: "92%"
  },
  sleep: {
    ...BREATHING_PATTERNS.sleep,
    userBenefit: "Better sleep",
    timeToEffect: "5 minutes",
    difficulty: "Beginner",
    bestFor: "Insomnia, bedtime routine",
    scientificBacking: "Sleep medicine research",
    icon: Moon,
    color: "purple",
    successRate: "89%"
  },
  mindfulness: {
    ...BREATHING_PATTERNS.mindfulness,
    userBenefit: "Present moment awareness",
    timeToEffect: "2 minutes",
    difficulty: "Beginner",
    bestFor: "Meditation, anxiety, focus",
    scientificBacking: "Mindfulness research",
    icon: Brain,
    color: "indigo",
    successRate: "94%"
  }
};

interface ValueDrivenPatternSelectionProps {
  userLibrary: CustomPattern[];
  onPatternSelect: (pattern: CustomPattern | null) => void;
  onCreateNew: () => void;
  showPersonalization?: boolean;
  recommendationContext?: RecommendationContext;
}

export const ValueDrivenPatternSelection: React.FC<ValueDrivenPatternSelectionProps> = ({
  userLibrary,
  onPatternSelect,
  onCreateNew,
  showPersonalization = true,
  recommendationContext = {}
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string>("recommended");
  const navigate = useNavigate();

  // Get smart recommendations
  const smartRecommendations = useMemo(() => {
    return SmartPatternRecommendations.getRecommendations(recommendationContext);
  }, [recommendationContext]);

  // Goal-based filtering with smart recommendations
  const goals = [
    { id: "recommended", label: "Recommended", icon: Star, patterns: smartRecommendations.map(r => r.patternId) },
    { id: "all", label: "All Patterns", icon: Star },
    { id: "stress", label: "Reduce Stress", icon: Heart, patterns: ["box", "relaxation", "mindfulness"] },
    { id: "energy", label: "Boost Energy", icon: Zap, patterns: ["energy", "wim_hof"] },
    { id: "sleep", label: "Better Sleep", icon: Moon, patterns: ["sleep", "relaxation"] },
    { id: "focus", label: "Improve Focus", icon: Focus, patterns: ["box", "mindfulness"] },
    { id: "capacity", label: "Build Lung Capacity", icon: Shield, patterns: ["wim_hof", "energy"] }
  ];

  const filteredPatterns = useMemo(() => {
    let patterns = Object.values(ENHANCED_PATTERNS);
    
    // Filter by goal
    if (selectedGoal === "recommended") {
      // Show only recommended patterns in recommended order
      patterns = smartRecommendations.map(rec => ENHANCED_PATTERNS[rec.patternId as keyof typeof ENHANCED_PATTERNS]).filter(Boolean);
    } else if (selectedGoal !== "all") {
      const goal = goals.find(g => g.id === selectedGoal);
      if (goal?.patterns) {
        patterns = patterns.filter(p => goal.patterns.includes(p.id));
      }
    }
    
    // Filter by search
    if (searchQuery) {
      patterns = patterns.filter(pattern => 
        pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.userBenefit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.bestFor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return patterns;
  }, [searchQuery, selectedGoal, smartRecommendations]);

  const handlePatternSelect = (patternId: string) => {
    const pattern = ENHANCED_PATTERNS[patternId as keyof typeof ENHANCED_PATTERNS];
    if (!pattern) return;

    // Convert to CustomPattern format
    const customPattern: CustomPattern = {
      id: pattern.id,
      name: pattern.name,
      description: `A ${pattern.name.toLowerCase()} breathing pattern for ${pattern.userBenefit}.`,
      category: pattern.userBenefit === "sleep" || pattern.userBenefit === "focus" || pattern.userBenefit === "performance" || pattern.userBenefit === "stress" || pattern.userBenefit === "energy" 
        ? pattern.userBenefit 
        : "stress", // default to stress if not a valid category
      difficulty: "beginner",
      duration: pattern.inhale + pattern.hold + pattern.exhale + pattern.hold_after_exhale,
      creator: "user", // This should be replaced with the actual user ID
      phases: [
        { name: 'inhale', duration: pattern.inhale * 1000 },
        { name: 'hold', duration: pattern.hold * 1000 },
        { name: 'exhale', duration: pattern.exhale * 1000 },
        { name: 'hold_after_exhale', duration: pattern.hold_after_exhale * 1000 }
      ]
    };

    onPatternSelect(customPattern);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: "border-green-200 bg-green-50 text-green-800",
      blue: "border-blue-200 bg-blue-50 text-blue-800", 
      orange: "border-orange-200 bg-orange-50 text-orange-800",
      yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
      purple: "border-purple-200 bg-purple-50 text-purple-800",
      indigo: "border-indigo-200 bg-indigo-50 text-indigo-800"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.green;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Next Pattern</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {selectedGoal === "recommended" 
            ? "Based on the time and your goals, here are the best patterns for you right now."
            : "Each pattern is designed for specific benefits. Pick one that matches what you want to achieve right now."
          }
        </p>
      </div>

      {/* Smart recommendations highlight */}
      {selectedGoal === "recommended" && smartRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Personalized for You</span>
          </div>
          <p className="text-blue-700 text-sm">
            {smartRecommendations[0]?.reason} - {smartRecommendations[0]?.timeToEffect} to feel the benefits.
          </p>
        </div>
      )}

      {/* Goal-based tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {goals.map((goal) => {
          const Icon = goal.icon;
          return (
            <Button
              key={goal.id}
              variant={selectedGoal === goal.id ? "default" : "outline"}
              onClick={() => setSelectedGoal(goal.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {goal.label}
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by benefit or use case..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pattern grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatterns.map((pattern) => {
          const Icon = pattern.icon;
          const colorClasses = getColorClasses(pattern.color);
          
          return (
            <Card key={pattern.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${colorClasses} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pattern.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{pattern.userBenefit}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {pattern.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key benefits */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="h-4 w-4 text-green-500" />
                    <span>Effects in {pattern.timeToEffect}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>{pattern.successRate} success rate</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-orange-500" />
                    <span className="text-muted-foreground">{pattern.bestFor}</span>
                  </div>
                </div>

                {/* Scientific backing */}
                <div className={`p-3 rounded-lg ${colorClasses} border`}>
                  <p className="text-xs font-medium">
                    ✓ {pattern.scientificBacking}
                  </p>
                </div>

                {/* Pattern details */}
                <div className="text-xs text-muted-foreground">
                  {pattern.inhale}s in • {pattern.hold}s hold • {pattern.exhale}s out • {pattern.hold_after_exhale}s rest
                </div>

                {/* Action button */}
                <Button 
                  onClick={() => handlePatternSelect(pattern.id)}
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  Try This Pattern
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create custom pattern */}
      <div className="text-center">
        <Card className="max-w-md mx-auto border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Become an Instructor</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create custom patterns, build courses, and teach others
            </p>
            <Button onClick={() => navigate("/instructor-onboarding?focus=patterns")} variant="outline">
              Become Instructor
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* No results */}
      {filteredPatterns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No patterns found matching your criteria.</p>
          <Button 
            onClick={() => { setSearchQuery(""); setSelectedGoal("all"); }}
            variant="outline"
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ValueDrivenPatternSelection;