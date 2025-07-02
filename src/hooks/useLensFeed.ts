import { useState, useEffect } from "react";
import { publicClient } from "@/lib/publicClient";
import { useLensProfile } from "./useLensProfile";
import { toast } from "sonner";
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from "@/lib/lens";
// Legacy Lens feed hook - using contract calls as fallback

export interface Publication {
  contentURI: string;
  profileIdPointed: bigint;
  pubIdPointed: bigint;
  // Add other publication fields as needed
}

// Legacy Lens feed implementation using contract calls

export const useLensFeed = () => {
  const { lensProfile } = useLensProfile();
  const [feed, setFeed] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);

  // Using legacy contract-based implementation

  useEffect(() => {
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

    fetchFeedLegacy();
  }, [lensProfile]);

  return { feed, loading };
};
