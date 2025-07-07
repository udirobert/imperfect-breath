/**
 * Statistics about a creator's performance
 */
export interface CreatorStats {
  totalPatterns: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalStudents: number;
  avgRating: number;
  totalSessions: number;
  conversionRate: number;
  topCategory: string;
}

/**
 * Detailed information about a breathing pattern
 */
export interface PatternStats {
  id: string;
  name: string;
  description: string;
  category: "stress" | "sleep" | "focus" | "energy" | "performance";
  difficulty: "beginner" | "intermediate" | "advanced";

  // Creation info
  createdAt: string;
  lastUpdated: string;
  status: "draft" | "published" | "paused";

  // Content
  hasVideo: boolean;
  hasAudio: boolean;
  hasGuided: boolean;
  duration: number; // seconds
  expectedSessionDuration: number; // minutes

  // Performance
  totalSessions: number;
  uniqueUsers: number;
  rating: number;
  reviews: number;
  favorites: number;

  // Monetization
  price: number;
  currency: "ETH" | "USDC";
  isFree: boolean;
  totalEarnings: number;
  monthlyEarnings: number;
  licenseSales: number;

  // IP & Blockchain
  ipRegistered: boolean;
  ipAssetId?: string;
  storyProtocolHash?: string;

  // Success metrics
  completionRate: number;
  retentionRate: number;
  userSatisfaction: number;
}