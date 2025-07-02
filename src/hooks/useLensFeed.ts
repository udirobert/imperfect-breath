import { useState, useEffect } from "react";
import { publicClient } from "@/lib/publicClient";
import { useLensProfile } from "./useLensProfile";
import { toast } from "sonner";
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from "@/lib/lens";
import { useModernLensFeed, ModernLensPost } from "./useModernLensFeed";

export interface Publication {
  contentURI: string;
  profileIdPointed: bigint;
  pubIdPointed: bigint;
  // Add other publication fields as needed
}

// Helper function to convert ModernLensPost to legacy Publication format
const convertToLegacyPublication = (
  modernPost: ModernLensPost,
): Publication => {
  return {
    contentURI: modernPost.metadata?.content || modernPost.content || "",
    profileIdPointed: BigInt(parseInt(modernPost.author.id, 16) || 0),
    pubIdPointed: BigInt(parseInt(modernPost.id, 16) || 0),
  };
};

export const useLensFeed = () => {
  const { lensProfile } = useLensProfile();
  const [feed, setFeed] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);

  // Try to use modern Lens V3 SDK first
  const {
    feed: modernFeed,
    loading: modernLoading,
    error: modernError,
  } = useModernLensFeed();

  useEffect(() => {
    // First, try to use the modern Lens V3 SDK
    if (modernFeed && modernFeed.length > 0 && !modernError) {
      const legacyFeed = modernFeed.map(convertToLegacyPublication);
      setFeed(legacyFeed);
      setLoading(modernLoading);
      return;
    }

    // Fallback to legacy implementation if modern V3 SDK fails or no feed found
    const fetchFeedLegacy = async () => {
      if (!lensProfile) {
        setFeed([]);
        return;
      }

      setLoading(true);
      try {
        // 1. Get the list of profiles the user follows
        const followedProfileIds = (await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: "getFollows",
          args: [lensProfile.profileId],
        })) as bigint[];

        // 2. Fetch the latest publication from each followed profile
        const publicationsPromises = followedProfileIds.map(
          async (profileId) => {
            try {
              const pubCount = await publicClient
                .readContract({
                  address: LENS_HUB_CONTRACT_ADDRESS,
                  abi: LENS_HUB_ABI,
                  functionName: "getProfile",
                  args: [profileId],
                })
                .then((data) => (data as { pubCount: number }).pubCount);

              if (pubCount > 0) {
                const pub = await publicClient.readContract({
                  address: LENS_HUB_CONTRACT_ADDRESS,
                  abi: LENS_HUB_ABI,
                  functionName: "getPub",
                  args: [profileId, pubCount],
                });
                return pub as Publication;
              }
              return null;
            } catch (error) {
              console.error(
                `Failed to fetch publication for profile ${profileId}:`,
                error,
              );
              return null; // Continue if one profile fails
            }
          },
        );

        const publications = (await Promise.all(publicationsPromises)).filter(
          (p) => p !== null,
        ) as Publication[];

        setFeed(publications);
      } catch (error: unknown) {
        console.error("Error fetching Lens feed:", error);
        toast.error("Could not fetch Lens feed.", {
          description:
            "There was an issue fetching publications from followed profiles.",
        });
        setFeed([]);
      } finally {
        setLoading(false);
      }
    };

    // Only use legacy if modern V3 SDK didn't work
    if (!modernFeed?.length && !modernLoading) {
      fetchFeedLegacy();
    } else {
      setLoading(modernLoading);
    }
  }, [lensProfile, modernFeed, modernLoading, modernError]);

  return { feed, loading };
};
