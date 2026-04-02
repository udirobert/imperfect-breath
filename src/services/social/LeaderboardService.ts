import { lensAPI } from "@/lib/lens/client";
import type { Post } from "@/lib/lens/types";

export interface LeaderboardEntry {
  address: string;
  username: string;
  totalDuration: number;
  totalScore: number;
  sessionCount: number;
  streak: number;
  avatar?: string;
  rank: number;
}

class LeaderboardService {
  private cache: LeaderboardEntry[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getLeaderboard(forceRefresh = false): Promise<LeaderboardEntry[]> {
    if (!forceRefresh && this.cache.length > 0 && (Date.now() - this.lastFetch < this.CACHE_TTL)) {
      return this.cache;
    }

    try {
      // 1. Fetch recent publications from the community
      // In a real Lens V3 app, we'd query for Acts on the App's account
      const timelineResult = await lensAPI.getTimeline();
      
      if (!timelineResult.success || !timelineResult.data) {
        return this.cache || [];
      }

      const posts = timelineResult.data.items;
      const scores: Record<string, { 
        duration: number, 
        totalScore: number, 
        count: number, 
        user: any,
        dates: Set<string> 
      }> = {};

      // 2. Process posts to aggregate stats
      posts.forEach(post => {
        // Only count verified sessions
        const isVerified = post.metadata?.attributes?.some(attr => attr.key === "verified" && attr.value === "true");
        if (!isVerified) return;

        const addr = post.author.address;
        const duration = parseInt(post.metadata?.attributes?.find(a => a.key === "duration")?.value || "0");
        const score = parseInt(post.metadata?.attributes?.find(a => a.key === "score")?.value || "0");
        const date = new Date(post.timestamp).toDateString();

        if (!scores[addr]) {
          scores[addr] = { 
            duration: 0, 
            totalScore: 0, 
            count: 0, 
            user: post.author,
            dates: new Set() 
          };
        }

        scores[addr].duration += duration;
        scores[addr].totalScore += (score || 0);
        scores[addr].count += 1;
        scores[addr].dates.add(date);
      });

      // 3. Convert to leaderboard entries and calculate streaks
      const entries: LeaderboardEntry[] = Object.entries(scores).map(([addr, data]) => {
        // Simple streak calculation (mock for now, would need chronological sorting)
        const streak = data.dates.size; 

        return {
          address: addr,
          username: data.user.username?.localName || "Anonymous",
          totalDuration: data.duration,
          totalScore: data.totalScore,
          sessionCount: data.count,
          streak: streak,
          avatar: data.user.metadata?.picture,
          rank: 0
        };
      });

      // 4. Sort and rank
      const sorted = entries.sort((a, b) => b.totalScore - a.totalScore);
      const ranked = sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      this.cache = ranked;
      this.lastFetch = Date.now();
      return ranked;

    } catch (error) {
      console.error("❌ Leaderboard fetch error:", error);
      return this.cache || [];
    }
  }

  /**
   * Get specific stats for a user
   */
  async getUserStats(address: string): Promise<LeaderboardEntry | null> {
    const leaderboard = await this.getLeaderboard();
    return leaderboard.find(e => e.address.toLowerCase() === address.toLowerCase()) || null;
  }
}

export const leaderboardService = new LeaderboardService();
