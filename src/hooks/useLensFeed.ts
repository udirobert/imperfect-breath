import { useState, useEffect } from 'react';
import { publicClient } from '@/providers/Web3Provider';
import { useLensProfile } from './useLensProfile';
import { toast } from 'sonner';
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from '@/lib/lens';

export interface Publication {
  contentURI: string;
  profileIdPointed: bigint;
  pubIdPointed: bigint;
  // Add other publication fields as needed
}

export const useLensFeed = () => {
  const { lensProfile } = useLensProfile();
  const [feed, setFeed] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
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
          functionName: 'getFollows',
          args: [lensProfile.profileId],
        })) as bigint[];

        // 2. Fetch the latest publication from each followed profile
        const publicationsPromises = followedProfileIds.map(async (profileId) => {
          try {
            const pubCount = await publicClient.readContract({
              address: LENS_HUB_CONTRACT_ADDRESS,
              abi: LENS_HUB_ABI,
              functionName: 'getProfile',
              args: [profileId],
            }).then(data => (data as any).pubCount);

            if (pubCount > 0) {
              const pub = await publicClient.readContract({
                address: LENS_HUB_CONTRACT_ADDRESS,
                abi: LENS_HUB_ABI,
                functionName: 'getPub',
                args: [profileId, pubCount],
              });
              return pub as Publication;
            }
            return null;
          } catch (error) {
            console.error(`Failed to fetch publication for profile ${profileId}:`, error);
            return null; // Continue if one profile fails
          }
        });

        const publications = (await Promise.all(publicationsPromises)).filter(
          (p) => p !== null
        ) as Publication[];

        setFeed(publications);
      } catch (error: any) {
        console.error("Error fetching Lens feed:", error);
        toast.error("Could not fetch Lens feed.", {
          description: "There was an issue fetching publications from followed profiles."
        });
        setFeed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [lensProfile]);

  return { feed, loading };
};