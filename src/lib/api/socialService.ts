import { handleError } from "../utils/error-utils";

/**
 * Interface for social post data
 */
export interface SocialPost {
  id: string;
  content: string;
  author: {
    address: string;
    username?: string;
    name?: string;
    avatar?: string;
  };
  metadata?: {
    type?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  stats?: {
    reactions: number;
    comments: number;
    mirrors: number;
  };
  reaction?: {
    isReacted: boolean;
  };
  createdAt: string;
}

/**
 * Interface for trending pattern data
 */
export interface TrendingPattern {
  name: string;
  usageCount: number;
  avgScore: number;
  trend: "up" | "down" | "stable";
}

/**
 * Fetches timeline posts from Lens Protocol
 */
export async function getTimeline(
  address: string,
): Promise<{ items: SocialPost[] }> {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("lens_auth_token");

    if (!token) {
      throw new Error("Authentication required to fetch timeline");
    }

    const response = await fetch("/api/social/timeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to fetch timeline`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw handleError("fetch timeline", error);
  }
}

/**
 * Fetches trending patterns from Lens Protocol
 */
export async function getTrendingPatterns(): Promise<TrendingPattern[]> {
  try {
    const response = await fetch("/api/patterns/trending", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to fetch trending patterns`,
      );
    }

    const data = await response.json();

    // Validate data structure
    if (!Array.isArray(data)) {
      throw new Error("Invalid trending patterns data format");
    }

    return data;
  } catch (error) {
    throw handleError("fetch trending patterns", error);
  }
}

/**
 * Reacts to a post (like/unlike)
 */
export async function reactToPost(
  publicationId: string,
  remove: boolean,
): Promise<boolean> {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("lens_auth_token");

    if (!token) {
      throw new Error("Authentication required to react to post");
    }

    const response = await fetch("/api/social/react", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        publicationId,
        reaction: "UPVOTE",
        remove,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to react to post`,
      );
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    throw handleError("react to post", error);
  }
}

/**
 * Follows a user account
 */
export async function followAccount(
  address: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("lens_auth_token");

    if (!token) {
      throw new Error("Authentication required to follow account");
    }

    const response = await fetch("/api/social/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetAddress: address }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to follow account`,
      );
    }

    const data = await response.json();
    return {
      success: data.success === true,
      error: data.error,
    };
  } catch (error) {
    throw handleError("follow account", error);
  }
}

/**
 * Shares a breathing session to Lens Protocol
 */
export async function shareBreathingSession(sessionData: {
  patternName: string;
  duration: number;
  score: number;
  insights?: string[];
  content?: string;
}): Promise<string> {
  try {
    // Get auth token from local storage
    const token = localStorage.getItem("lens_auth_token");

    if (!token) {
      throw new Error("Authentication required to share session");
    }

    const response = await fetch("/api/social/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "BREATHING_SESSION",
        content:
          sessionData.content ||
          `Just completed a ${sessionData.patternName} breathing session with ${sessionData.score}% focus!`,
        metadata: {
          breathingPattern: {
            name: sessionData.patternName,
            duration: sessionData.duration,
            score: sessionData.score,
            insights: sessionData.insights || [],
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to share session`,
      );
    }

    const data = await response.json();

    if (!data.postHash) {
      throw new Error("Failed to get transaction hash");
    }

    return data.postHash;
  } catch (error) {
    throw handleError("share breathing session", error);
  }
}
