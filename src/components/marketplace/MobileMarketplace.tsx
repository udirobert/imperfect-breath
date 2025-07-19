import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Search,
  Filter,
  Heart,
  Play,
  Star,
  Clock,
  Users,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnhancedCustomPattern } from "@/types/patterns";

interface MobileMarketplaceProps {
  patterns: EnhancedCustomPattern[];
  onPatternSelect: (pattern: EnhancedCustomPattern) => void;
  onPatternLike?: (patternId: string) => void;
  className?: string;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: "🌟" },
  { id: "stress", label: "Stress Relief", icon: "💆" },
  { id: "sleep", label: "Sleep", icon: "😴" },
  { id: "energy", label: "Energy", icon: "⚡" },
  { id: "focus", label: "Focus", icon: "🎯" },
  { id: "performance", label: "Performance", icon: "🏆" },
];

const SORT_OPTIONS = [
  { id: "popular", label: "Most Popular" },
  { id: "recent", label: "Recently Added" },
  { id: "rating", label: "Highest Rated" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
];

export const MobileMarketplace: React.FC<MobileMarketplaceProps> = ({
  patterns,
  onPatternSelect,
  onPatternLike,
  className,
}) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  const filteredPatterns = useMemo(() => {
    let filtered = patterns;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pattern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pattern.creator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((pattern) => pattern.category === selectedCategory);
    }

    // Sort patterns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "popular":
        default:
          return (b.downloads || 0) - (a.downloads || 0);
      }
    });

    return filtered;
  }, [patterns, searchQuery, selectedCategory, sortBy]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search Header */}
      <div className="flex-shrink-0 p-4 bg-background border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patterns, creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 touch-manipulation"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 touch-manipulation"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          <div className="flex-1" />

          <span className="text-sm text-muted-foreground">
            {filteredPatterns.length} patterns
          </span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex-shrink-0 p-4 bg-muted/30 border-b space-y-4">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium mb-2">Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-xs touch-manipulation"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <h3 className="text-sm font-medium mb-2">Sort by</h3>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  variant={sortBy === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option.id)}
                  className="text-xs touch-manipulation justify-start"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pattern Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-4">
          {filteredPatterns.map((pattern) => (
            <Card
              key={pattern.id}
              className="touch-manipulation cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onPatternSelect(pattern)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">
                      {pattern.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      by {pattern.creator}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatPrice(pattern.price || 0)}
                    </Badge>
                    {onPatternLike && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPatternLike(pattern.id);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {pattern.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(pattern.duration || 0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {pattern.rating?.toFixed(1) || "—"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {pattern.downloads || 0}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPatternSelect(pattern);
                    }}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Try
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatterns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No patterns found</p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMarketplace;