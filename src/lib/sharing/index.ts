/**
 * Centralized sharing utilities
 * Implements DRY, modular, and performant sharing functionality
 */

import { toast } from "sonner";
import { SessionData } from "../ai/config"; // DRY: Use unified SessionData interface

// Sharing-specific extensions
export interface ShareableSessionData extends SessionData {
  score?: number;
  cycles?: number;
  insights?: string[];
  flowNFTId?: string;
}

export interface ShareOptions {
  includeScore?: boolean;
  includeCycles?: boolean;
  includeBreathHold?: boolean;
  customHashtags?: string[];
  tone?: 'mindful' | 'achievement' | 'casual';
}

/**
 * Generate formatted share text for different platforms
 */
export class ShareTextGenerator {
  private static readonly DEFAULT_HASHTAGS = {
    mindful: "#Mindfulness #Wellness #BreathingPractice #InnerPeace",
    achievement: "#BreathingPractice #Wellness #Achievement #Mindfulness", 
    casual: "#Breathing #Wellness #SelfCare #Mindfulness"
  };

  private static readonly EMOJIS = {
    breath: "🌬️",
    time: "⏱️", 
    score: "📊",
    cycles: "🔄",
    hold: "💨",
    peace: "✨",
    growth: "🌱"
  };

  static generateTwitterText(sessionData: ShareableSessionData, options: ShareOptions = {}): string {
    const {
      includeScore = true,
      includeCycles = true,
      includeBreathHold = false,
      customHashtags,
      tone = 'mindful'
    } = options;

    const duration = Math.round((sessionData.duration || 0) / 60);
    const score = sessionData.restlessnessScore !== undefined 
      ? Math.max(0, 100 - sessionData.restlessnessScore)
      : sessionData.score || 0;

    const parts = [
      `${this.EMOJIS.breath} Just completed a ${sessionData.patternName || "breathing"} session!`,
      "",
      `${this.EMOJIS.time} ${duration} minute${duration !== 1 ? 's' : ''} of focused breathing`
    ];

    if (includeScore && score > 0) {
      parts.push(`${this.EMOJIS.score} Quality Score: ${score}/100`);
    }

    if (includeCycles && sessionData.cycles) {
      parts.push(`${this.EMOJIS.cycles} ${sessionData.cycles} cycles completed`);
    }

    if (includeBreathHold && sessionData.breathHoldTime) {
      parts.push(`${this.EMOJIS.hold} ${sessionData.breathHoldTime}s breath hold`);
    }

    parts.push("", `Taking time to breathe and be present ${this.EMOJIS.peace}`, "");

    const hashtags = customHashtags?.join(" ") || this.DEFAULT_HASHTAGS[tone];
    parts.push(hashtags);

    return parts.join("\n");
  }

  static generateLensText(sessionData: SessionData, options: ShareOptions = {}): string {
    const duration = Math.round((sessionData.duration || 0) / 60);
    const score = sessionData.restlessnessScore !== undefined 
      ? Math.max(0, 100 - sessionData.restlessnessScore)
      : sessionData.score || 0;

    const content = `🌬️ Just completed a ${sessionData.patternName} breathing session!

⏱️ Duration: ${duration} minutes
${score ? `📊 Score: ${score}/100` : ""}
${sessionData.cycles ? `🔄 Cycles: ${sessionData.cycles}` : ""}
${sessionData.breathHoldTime ? `💨 Breath Hold: ${sessionData.breathHoldTime}s` : ""}

#BreathingPractice #Wellness #Mindfulness #ImperfectBreath`;

    return content;
  }
}

/**
 * Platform-specific sharing handlers
 */
export class SocialShareManager {
  static async shareOnTwitter(sessionData: SessionData, options: ShareOptions = {}): Promise<void> {
    const text = ShareTextGenerator.generateTwitterText(sessionData, options);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    window.open(url, "_blank", "width=550,height=420");
    
    toast.success("Opening Twitter to share your session!", {
      description: "Complete the tweet to share with your followers",
    });
  }

  static async shareNative(sessionData: SessionData, options: ShareOptions = {}): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      const text = ShareTextGenerator.generateTwitterText(sessionData, options);
      
      await navigator.share({
        title: `${sessionData.patternName} Breathing Session`,
        text,
        url: window.location.href,
      });

      toast.success("Shared successfully!");
      return true;
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Failed to share");
      }
      return false;
    }
  }

  static async copyToClipboard(sessionData: SessionData, options: ShareOptions = {}): Promise<void> {
    try {
      const text = ShareTextGenerator.generateTwitterText(sessionData, options);
      await navigator.clipboard.writeText(text);
      
      toast.success("Copied to clipboard!", {
        description: "Share text copied - paste it anywhere you like",
      });
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      throw error;
    }
  }
}

/**
 * Session data formatters and validators
 */
export class SessionDataUtils {
  static validateSessionData(sessionData: SessionData): boolean {
    return !!(sessionData.patternName && sessionData.duration && sessionData.duration > 0);
  }

  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }

  static calculateQualityScore(sessionData: SessionData): number {
    if (sessionData.restlessnessScore !== undefined) {
      return Math.max(0, 100 - sessionData.restlessnessScore);  
    }
    return sessionData.score || 75;
  }
}

/**
 * Convenience hooks for sharing functionality
 */
export const useShareSession = () => {
  const shareOnTwitter = (sessionData: SessionData, options?: ShareOptions) => 
    SocialShareManager.shareOnTwitter(sessionData, options);

  const shareNative = (sessionData: SessionData, options?: ShareOptions) =>
    SocialShareManager.shareNative(sessionData, options);

  const copyToClipboard = (sessionData: SessionData, options?: ShareOptions) =>
    SocialShareManager.copyToClipboard(sessionData, options);

  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return {
    shareOnTwitter,
    shareNative, 
    copyToClipboard,
    hasNativeShare,
    validateSession: SessionDataUtils.validateSessionData,
    formatDuration: SessionDataUtils.formatDuration,
    calculateScore: SessionDataUtils.calculateQualityScore
  };
};