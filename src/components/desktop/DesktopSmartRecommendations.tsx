/**
 * Desktop Smart Recommendations - Advanced Pattern Recommendation UI
 * 
 * ENHANCEMENT FIRST: Builds on SmartPatternRecommendations with desktop-specific features
 * CLEAN: Separates desktop recommendation UI from mobile simplified views
 * MODULAR: Reuses SmartPatternRecommendations service with enhanced presentation
 * PERFORMANT: Leverages desktop screen space for detailed comparisons
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Sparkles, 
  Star, 
  Clock, 
  Target, 
  Brain,
  Heart,
  Zap,
  Moon,
  Sun,
  Activity,
  BarChart3,
  Filter,
  Search,
  ArrowUpDown,
  CheckCircle,
  Info,
  Lightbulb,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Timer,
  Focus,
  Eye,
  Compare,
  Bookmark,
  Share2
} from "lucide-react";
import { SmartPatternRecommendations, type RecommendationContext } from "../../lib/recommendations/SmartPatternRecommendations";
import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";

interface DesktopSmartRecommendationsProps {
  onPatternSelect?: (patternId: string) => void;
  context?: Partial<RecommendationContext>;
  showComparison?: boolean;
  className?: string;
}

interface FilterOptions {
  difficulty: "all" | "beginner" | "intermediate" | "advanced";
  timeOfDay: "all" | "morning" | "afternoon" | "evening";
  goal: "all" | "stress" | "energy" | "sleep" | "focus";
  duration: "all" | "short" | "medium" | "long";
}

interface SortOption {
  key: "confidence" | "popularity" | "difficulty" | "duration";
  label: string;
  direction: "asc" | "desc";
}

export const DesktopSmartRecommendations: React.FC<DesktopSmartRecommendationsProps> = ({
  onPatternSelect,
  context = {},
  showComparison = true,
  className
}) => {
  const { user } = useAuth();
  const { history } = useSessionHistory();
  
  const [activeTab, setActiveTab] = useState("recommendations");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    difficulty: "all",
    timeOfDay: "all",
    goal: "all",
    duration: "all"
  });
  const [sortBy, setSortBy] = useState<SortOption>({
    key: "confidence",
    label: "Confidence",
    direction: "desc"
  });

  // Build recommendation context
  const currentHour = new Date().getHours();
  const recommendationContext: RecommendationContext = {
    timeOfDay: currentHour,
    sessionHistory: history.map(h => h.patternName),
    userLevel: history.length < 5 ? "beginner" : history.length < 20 ? "intermediate" : "advanced",
    sessionType: "enhanced",
    isFirstSession: history.length === 0,
    ...context
  };

  // Get smart recommendations
  const allRecommendations = SmartPatternRecommendations.getRecommendations(recommendationContext);

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = allRecommendations.filter(rec => {
      const pattern = BREATHING_PATTERNS[rec.patternId];
      if (!pattern) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!pattern.name.toLowerCase().includes(searchLower) &&
            !pattern.description.toLowerCase().includes(searchLower) &&
            !rec.reason.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Difficulty filter
      if (filters.difficulty !== "all") {
        const patternDifficulty = getDifficultyLevel(pattern);
        if (patternDifficulty !== filters.difficulty) return false;
      }

      // Time of day filter
      if (filters.timeOfDay !== "all") {
        const optimalTime = getOptimalTimeOfDay(rec.patternId);
        if (optimalTime !== "any" && optimalTime !== filters.timeOfDay) return false;
      }

      // Goal filter
      if (filters.goal !== "all") {
        const patternGoals = getPatternGoals(rec.patternId);
        if (!patternGoals.includes(filters.goal)) return false;
      }

      // Duration filter
      if (filters.duration !== "all") {
        const duration = getDurationCategory(pattern);
        if (duration !== filters.duration) return false;
      }

      return true;
    });

    // Sort recommendations
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy.key) {
        case "confidence":
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case "popularity":
          aValue = getPatternPopularity(a.patternId);
          bValue = getPatternPopularity(b.patternId);
          break;
        case "difficulty":
          aValue = getDifficultyScore(BREATHING_PATTERNS[a.patternId]);
          bValue = getDifficultyScore(BREATHING_PATTERNS[b.patternId]);
          break;
        case "duration":
          aValue = getPatternDuration(BREATHING_PATTERNS[a.patternId]);
          bValue = getPatternDuration(BREATHING_PATTERNS[b.patternId]);
          break;
        default:
          return 0;
      }

      return sortBy.direction === "desc" ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [allRecommendations, searchQuery, filters, sortBy, history]);

  // Helper functions
  const getDifficultyLevel = (pattern: any): "beginner" | "intermediate" | "advanced" => {
    const totalTime = pattern.inhale + pattern.hold + pattern.exhale + (pattern.hold_after_exhale || 0);
    if (totalTime <= 8) return "beginner";
    if (totalTime <= 16) return "intermediate";
    return "advanced";
  };

  const getOptimalTimeOfDay = (patternId: string): "morning" | "afternoon" | "evening" | "any" => {
    const timeMap: Record<string, string> = {
      "energizing": "morning",
      "wim_hof": "morning",
      "relaxation": "evening",
      "sleep": "evening",
      "box": "any",
      "coherent": "any"
    };
    return timeMap[patternId] as any || "any";
  };

  const getPatternGoals = (patternId: string): string[] => {
    const goalMap: Record<string, string[]> = {
      "box": ["stress", "focus"],
      "relaxation": ["stress", "sleep"],
      "energizing": ["energy", "focus"],
      "wim_hof": ["energy"],
      "coherent": ["focus", "stress"],
      "sleep": ["sleep"]
    };
    return goalMap[patternId] || [];
  };

  const getDurationCategory = (pattern: any): "short" | "medium" | "long" => {
    const totalTime = pattern.inhale + pattern.hold + pattern.exhale + (pattern.hold_after_exhale || 0);
    if (totalTime <= 8) return "short";
    if (totalTime <= 16) return "medium";
    return "long";
  };

  const getDifficultyScore = (pattern: any): number => {
    return pattern.inhale + pattern.hold + pattern.exhale + (pattern.hold_after_exhale || 0);
  };

  const getPatternDuration = (pattern: any): number => {
    return pattern.inhale + pattern.hold + pattern.exhale + (pattern.hold_after_exhale || 0);
  };

  const getPatternPopularity = (patternId: string): number => {
    return history.filter(h => h.patternName === patternId).length;
  };

  const handlePatternToggle = (patternId: string) => {
    setSelectedPatterns(prev => 
      prev.includes(patternId) 
        ? prev.filter(id => id !== patternId)
        : [...prev, patternId]
    );
  };

  const sortOptions: SortOption[] = [
    { key: "confidence", label: "Confidence", direction: "desc" },
    { key: "popularity", label: "Popularity", direction: "desc" },
    { key: "difficulty", label: "Difficulty", direction: "asc" },
    { key: "duration", label: "Duration", direction: "asc" }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Pattern Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>

            {/* Sort */}
            <select
              value={`${sortBy.key}-${sortBy.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                const option = sortOptions.find(opt => opt.key === key);
                if (option) {
                  setSortBy({ ...option, direction: direction as "asc" | "desc" });
                }
              }}
              className="px-3 py-2 border rounded-md"
            >
              {sortOptions.map(option => (
                <option key={`${option.key}-${option.direction}`} value={`${option.key}-${option.direction}`}>
                  {option.label} ({option.direction === "desc" ? "High to Low" : "Low to High"})
                </option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value as any})}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Time of Day</label>
              <select
                value={filters.timeOfDay}
                onChange={(e) => setFilters({...filters, timeOfDay: e.target.value as any})}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Any Time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Goal</label>
              <select
                value={filters.goal}
                onChange={(e) => setFilters({...filters, goal: e.target.value as any})}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Goals</option>
                <option value="stress">Stress Relief</option>
                <option value="energy">Energy Boost</option>
                <option value="sleep">Better Sleep</option>
                <option value="focus">Focus Enhancement</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Duration</label>
              <select
                value={filters.duration}
                onChange={(e) => setFilters({...filters, duration: e.target.value as any})}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Durations</option>
                <option value="short">Short (≤8s)</option>
                <option value="medium">Medium (9-16s)</option>
                <option value="long">Long (>16s)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="comparison">Compare ({selectedPatterns.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRecommendations.map((rec) => {
              const pattern = BREATHING_PATTERNS[rec.patternId];
              if (!pattern) return null;

              const isSelected = selectedPatterns.includes(rec.patternId);
              const difficulty = getDifficultyLevel(pattern);
              const popularity = getPatternPopularity(rec.patternId);

              return (
                <Card 
                  key={rec.patternId}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => onPatternSelect?.(rec.patternId)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{pattern.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {rec.confidence}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {pattern.description}
                        </p>
                        <p className="text-sm text-blue-600 mb-3">
                          <Lightbulb className="h-3 w-3 inline mr-1" />
                          {rec.reason}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < Math.floor(rec.confidence / 20) 
                                  ? "text-yellow-400 fill-current" 
                                  : "text-gray-300"
                              }`} 
                            />
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatternToggle(rec.patternId);
                          }}
                        >
                          {isSelected ? <CheckCircle className="h-3 w-3" /> : <Compare className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">
                          {pattern.inhale + pattern.hold + pattern.exhale}s cycle
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Target className="h-4 w-4 mx-auto mb-1 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">
                          {rec.expectedBenefit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="text-xs">
                          {difficulty}
                        </Badge>
                        {popularity > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Used {popularity} times</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{pattern.inhale}s</span>
                        <ArrowUpDown className="h-3 w-3" />
                        <span>{pattern.hold}s</span>
                        <ArrowUpDown className="h-3 w-3" />
                        <span>{pattern.exhale}s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRecommendations.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No patterns found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters to find more patterns.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {selectedPatterns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Compare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No patterns selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select patterns from the recommendations tab to compare them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pattern Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Pattern</th>
                        <th className="text-center p-2">Cycle Time</th>
                        <th className="text-center p-2">Difficulty</th>
                        <th className="text-center p-2">Confidence</th>
                        <th className="text-center p-2">Your Usage</th>
                        <th className="text-center p-2">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPatterns.map(patternId => {
                        const pattern = BREATHING_PATTERNS[patternId];
                        const rec = allRecommendations.find(r => r.patternId === patternId);
                        if (!pattern || !rec) return null;

                        const difficulty = getDifficultyLevel(pattern);
                        const usage = getPatternPopularity(patternId);

                        return (
                          <tr key={patternId} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div>
                                <p className="font-medium">{pattern.name}</p>
                                <p className="text-xs text-muted-foreground">{pattern.description}</p>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="outline">
                                {pattern.inhale + pattern.hold + pattern.exhale}s
                              </Badge>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="secondary">{difficulty}</Badge>
                            </td>
                            <td className="text-center p-2">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">{rec.confidence}%</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-3 w-3 ${
                                        i < Math.floor(rec.confidence / 20) 
                                          ? "text-yellow-400 fill-current" 
                                          : "text-gray-300"
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <span className="font-medium">{usage}</span>
                              <span className="text-xs text-muted-foreground ml-1">times</span>
                            </td>
                            <td className="text-center p-2">
                              <p className="text-xs">{rec.expectedBenefit}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{allRecommendations.length}</p>
                <p className="text-sm text-muted-foreground">Total Recommendations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">
                  {Math.round(allRecommendations.reduce((acc, r) => acc + r.confidence, 0) / allRecommendations.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">
                  {allRecommendations.filter(r => r.confidence >= 80).length}
                </p>
                <p className="text-sm text-muted-foreground">High Confidence</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommendation Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Most Recommended Patterns</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      allRecommendations.reduce((acc, rec) => {
                        const pattern = BREATHING_PATTERNS[rec.patternId];
                        if (pattern) {
                          acc[pattern.name] = (acc[pattern.name] || 0) + 1;
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm">{name}</span>
                        <Badge variant="outline">{count} times</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Your Pattern Usage</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      history.reduce((acc, h) => {
                        acc[h.patternName] = (acc[h.patternName] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm">{name}</span>
                        <Badge variant="secondary">{count} sessions</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesktopSmartRecommendations;
