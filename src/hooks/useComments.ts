import { useState, useEffect } from 'react';
import { publicClient } from '@/providers/Web3Provider';
import { toast } from 'sonner';
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from '@/lib/lens';
import { Publication } from './useLensFeed';

export const useComments = (profileId: bigint, pubId: bigint) => {
  const [comments, setComments] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (!profileId || !pubId) {
        setComments([]);
        return;
      }

      setLoading(true);
      try {
        // Note: This is a simplified approach. A real implementation would
        // involve more complex logic to get all comments, as they are just
        // publications pointing to another publication.
        // We are assuming a non-existent `getComments` function for simplicity,
        // and will fetch the comment publications individually.
        // This part of the Lens ABI is a placeholder.
        const commentIds = (await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: 'getComments',
          args: [profileId, pubId],
        })) as bigint[];

        const commentsPromises = commentIds.map(async (commentId) => {
          try {
            // Assuming comments are made by the same profile for simplicity
            const pub = await publicClient.readContract({
              address: LENS_HUB_CONTRACT_ADDRESS,
              abi: LENS_HUB_ABI,
              functionName: 'getPub',
              args: [profileId, commentId],
            });
            return pub as Publication;
          } catch (error) {
            console.error(`Failed to fetch comment ${commentId}:`, error);
            return null;
          }
        });

        const fetchedComments = (await Promise.all(commentsPromises)).filter(
          (c) => c !== null
        ) as Publication[];

        setComments(fetchedComments);
      } catch (error: any) {
        console.error("Error fetching comments:", error);
        toast.error("Could not fetch comments.");
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [profileId, pubId]);

  return { comments, loading };
};