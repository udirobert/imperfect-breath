/**
 * Loading States Component
 * Various loading states for marketplace components
 */

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// Pattern Card Skeleton
export const PatternCardSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-9 w-full" />
    </CardContent>
  </Card>
);

// Pattern Grid Skeleton
export const PatternGridSkeleton: React.FC<{ count?: number }> = ({
  count = 6,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <PatternCardSkeleton key={index} />
    ))}
  </div>
);

// Search Results Loading
export const SearchResultsLoading: React.FC = () => (
  <div className="space-y-6">
    {/* Search bar skeleton */}
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>

    {/* Filters skeleton */}
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-20" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Results header skeleton */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-40" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>

    {/* Grid skeleton */}
    <PatternGridSkeleton />
  </div>
);

// Simple spinner loading
export const SpinnerLoading: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

// Empty state component
export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({
  title = "No results found",
  description = "Try adjusting your search or filters",
  icon,
  action,
}) => (
  <div className="text-center py-12 space-y-4">
    {icon && <div className="flex justify-center">{icon}</div>}
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {action && <div className="flex justify-center">{action}</div>}
  </div>
);

// Compact loading for smaller components
export const CompactLoading: React.FC<{ size?: number }> = ({ size = 4 }) => (
  <div className="flex items-center justify-center p-2">
    <Loader2
      className={`h-${size} w-${size} animate-spin text-muted-foreground`}
    />
  </div>
);

// Category filter skeleton
export const CategoryFilterSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-20" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-24" />
      ))}
    </div>
  </div>
);

// Quick filters skeleton
export const QuickFiltersSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-24" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-20" />
      ))}
    </div>
  </div>
);
