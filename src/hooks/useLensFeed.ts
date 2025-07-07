import { useState, useEffect, useCallback } from "react";
import { useLensContext } from "./lens-context-adapter";
import { TimelineItem } from "./lens-types";
import { toast } from "sonner";

export interface Publication {
  contentURI: string;
  profileIdPointed: bigint;
  pubIdPointed: bigint;
  // Fields updated with modern structure
  id: string;
  content: string;
  createdAt: string;
  profile: {
    id: string;
    name?: string;
    handle: string;
    picture?: string;
  };
  stats: {
    comments: number;
    mirrors: number;
    reactions: number;
  };
}

export const useLensFeed = () => {
  const [feed, setFeed] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  
  const {
    isAuthenticated,
    timeline,
    fetchTimeline,
    fetchBreathingContent,
    isLoading
  } = useLensContext();

  // Enhanced fetching that tries both timeline methods
  const fetchFeed = useCallback(async () => {
    if (!isAuthenticated) {
      setFeed([]);
      return;
    }

    setLoading(true);
    try {
      // First try to fetch breathing-specific content
      await fetchBreathingContent();
      
      // If that doesn't yield results, fall back to general timeline
      if (!timeline || timeline.length === 0) {
        await fetchTimeline({
          contentFocus: ["TEXT", "IMAGE", "VIDEO", "AUDIO"],
          tags: ["breathing", "wellness", "meditation"]
        });
      }
      
      // Map timeline data to Publications
      if (timeline && timeline.length > 0) {
        // Convert timeline items to Publication format
        const publications = timeline.map((item: TimelineItem) => ({
          ...item,
          // Ensure all required fields are present
          contentURI: item.contentURI || "",
          profileIdPointed: BigInt(item.profileId || 0),
          pubIdPointed: BigInt(item.pubId || 0),
          // Add modern fields with fallbacks
          id: item.id || `${item.profileId}-${item.pubId}`,
          content: item.content || item.contentURI || "",
          createdAt: item.createdAt || new Date().toISOString(),
          profile: {
            id: item.profile?.id || "",
            name: item.profile?.name,
            handle: item.profile?.handle || "unknown",
            picture: item.profile?.picture
          },
          stats: {
            comments: item.stats?.comments || 0,
            mirrors: item.stats?.mirrors || 0,
            reactions: item.stats?.reactions || 0
          }
        }));
        
        setFeed(publications);
      } else {
        setFeed([]);
      }
    } catch (error: unknown) {
      console.error("Error fetching Lens feed:", error);
      toast.error("Could not fetch Lens feed.", {
        description: "There was an issue fetching your timeline.",
      });
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, timeline, fetchTimeline, fetchBreathingContent]);

  // Fetch feed on mount and when dependencies change
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    feed,
    loading: loading || isLoading,
    refreshFeed: fetchFeed
  };
};
