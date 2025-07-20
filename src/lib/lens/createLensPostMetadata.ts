/**
 * Lens Protocol v3 Metadata Creation
 *
 * Creates proper Lens v3 metadata using @lens-protocol/metadata
 * and our consolidated types system
 */

import { textOnly, image, video } from "@lens-protocol/metadata";
import type {
  LensTextOnlyMetadata,
  LensImageMetadata,
  BreathingSession,
  LensPostContent,
} from "./types";
import { getAppAddress } from "./config";

/**
 * Create text-only post metadata for breathing sessions
 */
export function createBreathingSessionMetadata(
  sessionData: BreathingSession,
  aiAnalysis?: string,
): LensTextOnlyMetadata {
  const content = generateBreathingSessionContent(sessionData, aiAnalysis);

  return {
    $schema: "https://json-schemas.lens.dev/posts/text-only/3.0.0.json",
    lens: {
      mainContentFocus: "TEXT_ONLY",
      title: `${sessionData.patternName} Breathing Session`,
      content,
      id: `breathing-session-${sessionData.sessionId || Date.now()}`,
      locale: "en",
      tags: [
        "breathing",
        "wellness",
        "mindfulness",
        "imperfect-breath",
        sessionData.patternName.toLowerCase().replace(/\s+/g, "-"),
      ],
      appId: getAppAddress(),
    },
  };
}

/**
 * Create general text post metadata
 */
export function createTextPostMetadata(
  content: string,
  options?: {
    title?: string;
    tags?: string[];
    id?: string;
  },
): LensTextOnlyMetadata {
  return {
    $schema: "https://json-schemas.lens.dev/posts/text-only/3.0.0.json",
    lens: {
      mainContentFocus: "TEXT_ONLY",
      title: options?.title,
      content,
      id: options?.id || `post-${Date.now()}`,
      locale: "en",
      tags: options?.tags || ["imperfect-breath"],
      appId: getAppAddress(),
    },
  };
}

/**
 * Create image post metadata
 */
export function createImagePostMetadata(
  imageUri: string,
  content?: string,
  options?: {
    title?: string;
    tags?: string[];
    id?: string;
    altTag?: string;
    mimeType?: string;
  },
): LensImageMetadata {
  return {
    $schema: "https://json-schemas.lens.dev/posts/image/3.0.0.json",
    lens: {
      mainContentFocus: "IMAGE",
      title: options?.title,
      content: content || "",
      id: options?.id || `image-post-${Date.now()}`,
      locale: "en",
      tags: options?.tags || ["imperfect-breath"],
      appId: getAppAddress(),
      image: {
        item: imageUri,
        type: options?.mimeType || "image/jpeg",
        altTag: options?.altTag,
      },
    },
  };
}

/**
 * Create metadata using the official @lens-protocol/metadata library
 */
export function createLensPostMetadata(
  contentData: LensPostContent,
): Promise<string> {
  const metadata = textOnly({
    content: contentData.content,
    tags: contentData.tags,
    appId: contentData.appId || getAppAddress(),
  });

  // Return the metadata URI - this would typically be uploaded to IPFS
  return Promise.resolve(
    `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`,
  );
}

/**
 * Generate content text for breathing session posts
 */
function generateBreathingSessionContent(
  sessionData: BreathingSession,
  aiAnalysis?: string,
): string {
  const durationMinutes = Math.floor(sessionData.duration / 60);
  const durationSeconds = sessionData.duration % 60;

  let content = `🌬️ Just completed a ${sessionData.patternName} breathing session!\n\n`;

  // Duration
  content += `⏱️ Duration: ${durationMinutes}m ${durationSeconds}s\n`;

  // Score if available
  if (sessionData.score !== undefined) {
    const scoreEmoji = getScoreEmoji(sessionData.score);
    content += `📊 Session Score: ${sessionData.score}/100 ${scoreEmoji}\n`;
  }

  // Breath hold time if available
  if (sessionData.breathHoldTime) {
    content += `💨 Longest Breath Hold: ${sessionData.breathHoldTime}s\n`;
  }

  // Cycles if available
  if (sessionData.cycles) {
    content += `🔄 Completed Cycles: ${sessionData.cycles}\n`;
  }

  // Restlessness score if available
  if (sessionData.restlessnessScore !== undefined) {
    const calmnessScore = 100 - sessionData.restlessnessScore;
    content += `🧘 Calmness Level: ${calmnessScore}/100\n`;
  }

  // AI analysis if provided
  if (aiAnalysis) {
    content += `\n🤖 AI Insights: ${aiAnalysis}\n`;
  }

  // Insights if available
  if (sessionData.insights && sessionData.insights.length > 0) {
    content += `\n💡 Key Insights:\n`;
    sessionData.insights.forEach((insight, index) => {
      content += `${index + 1}. ${insight}\n`;
    });
  }

  // Tags and call to action
  content += `\n#BreathingPractice #Wellness #Mindfulness #ImperfectBreath`;
  content += `\n\nJoin me on the journey to better breathing! 🌱`;

  return content;
}

/**
 * Get emoji based on session score
 */
function getScoreEmoji(score: number): string {
  if (score >= 90) return "🌟";
  if (score >= 80) return "✨";
  if (score >= 70) return "👍";
  if (score >= 60) return "👌";
  if (score >= 50) return "🙂";
  return "💪";
}

/**
 * Create metadata for breathing challenges
 */
export function createChallengeMetadata(
  challengeTitle: string,
  challengeDescription: string,
  patternName: string,
): LensTextOnlyMetadata {
  const content = `🏆 New Breathing Challenge: ${challengeTitle}\n\n${challengeDescription}\n\nPattern: ${patternName}\n\n#BreathingChallenge #Wellness #Community #ImperfectBreath`;

  return {
    $schema: "https://json-schemas.lens.dev/posts/text-only/3.0.0.json",
    lens: {
      mainContentFocus: "TEXT_ONLY",
      title: challengeTitle,
      content,
      id: `challenge-${Date.now()}`,
      locale: "en",
      tags: [
        "breathing-challenge",
        "wellness",
        "community",
        "imperfect-breath",
        patternName.toLowerCase().replace(/\s+/g, "-"),
      ],
      appId: getAppAddress(),
    },
  };
}

/**
 * Create metadata for achievement unlocks
 */
export function createAchievementMetadata(
  achievementTitle: string,
  achievementDescription: string,
  rarity: string,
): LensTextOnlyMetadata {
  const rarityEmoji = getRarityEmoji(rarity);
  const content = `${rarityEmoji} Achievement Unlocked: ${achievementTitle}\n\n${achievementDescription}\n\nRarity: ${rarity}\n\n#Achievement #BreathingJourney #Wellness #ImperfectBreath`;

  return {
    $schema: "https://json-schemas.lens.dev/posts/text-only/3.0.0.json",
    lens: {
      mainContentFocus: "TEXT_ONLY",
      title: `Achievement: ${achievementTitle}`,
      content,
      id: `achievement-${Date.now()}`,
      locale: "en",
      tags: [
        "achievement",
        "breathing-journey",
        "wellness",
        "imperfect-breath",
        rarity,
      ],
      appId: getAppAddress(),
    },
  };
}

/**
 * Get emoji based on achievement rarity
 */
function getRarityEmoji(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case "legendary":
      return "🏆";
    case "epic":
      return "💎";
    case "rare":
      return "🌟";
    case "common":
    default:
      return "🏅";
  }
}

/**
 * Validate metadata before posting
 */
export function validateMetadata(
  metadata: LensTextOnlyMetadata | LensImageMetadata,
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata.lens.content || metadata.lens.content.trim().length === 0) {
    errors.push("Content cannot be empty");
  }

  if (metadata.lens.content && metadata.lens.content.length > 2000) {
    errors.push("Content exceeds maximum length of 2000 characters");
  }

  if (!metadata.lens.id || metadata.lens.id.trim().length === 0) {
    errors.push("ID is required");
  }

  if (metadata.lens.tags && metadata.lens.tags.length > 10) {
    errors.push("Too many tags (maximum 10)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
