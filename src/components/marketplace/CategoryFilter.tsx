/**
 * Category Filter Component
 * Simple category selection for marketplace filtering
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Target, Zap, Moon, Award, Filter } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearAll: () => void;
  showCounts?: boolean;
}

const defaultCategories: Category[] = [
  { id: "relaxation", name: "Relaxation", icon: Heart, count: 45 },
  { id: "focus", name: "Focus", icon: Target, count: 32 },
  { id: "energy", name: "Energy", icon: Zap, count: 28 },
  { id: "sleep", name: "Sleep", icon: Moon, count: 38 },
  { id: "meditation", name: "Meditation", icon: Brain, count: 51 },
  { id: "therapeutic", name: "Therapeutic", icon: Award, count: 19 },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories = defaultCategories,
  selectedCategories,
  onCategoryToggle,
  onClearAll,
  showCounts = true,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Categories
        </h3>
        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategories.includes(category.id);

          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryToggle(category.id)}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              <span>{category.name}</span>
              {showCounts && category.count && (
                <Badge
                  variant={isSelected ? "secondary" : "outline"}
                  className="ml-1 h-4 px-1 text-xs"
                >
                  {category.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {selectedCategories.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedCategories.length} categor
          {selectedCategories.length === 1 ? "y" : "ies"} selected
        </div>
      )}
    </div>
  );
};
