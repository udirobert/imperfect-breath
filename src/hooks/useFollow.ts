import { useState, useCallback } from "react";
import { useLens } from "./useLens";
import { toast } from "sonner";

export const useFollow = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followError, setFollowError] = useState<Error | null>(null);
  const { currentAccount, isAuthenticated, followUser, unfollowUser } = useLens();

  const follow = useCallback(
    async (address: string) => {
      if (!address) {
        toast.error("Invalid account address.");
        return;
      }

      if (!currentAccount) {
        toast.error("You must have a Lens account to follow.");
        return;
      }

      if (!isAuthenticated) {
        toast.error("Please authenticate with Lens first.");
        return;
      }

      setIsFollowing(true);
      setFollowError(null);

      try {
        toast.info("Processing follow...");

        // Use the modern useLens hook to follow the account
        const result = await followUser(address);

        if (result.success) {
          toast.success("Follow transaction sent!", {
            description: `Transaction hash: ${result.hash || "Success"}`,
          });
        } else {
          throw new Error(result.error || "Follow failed");
        }

        return result;
      } catch (err) {
        console.error("Follow transaction failed:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setFollowError(err instanceof Error ? err : new Error(errorMessage));
        toast.error("Follow failed", {
          description: errorMessage,
        });
      } finally {
        setIsFollowing(false);
      }
    },
    [followUser, currentAccount, isAuthenticated],
  );

  const unfollow = useCallback(
    async (address: string) => {
      if (!address) {
        toast.error("Invalid account address.");
        return;
      }

      if (!currentAccount) {
        toast.error("You must have a Lens account to unfollow.");
        return;
      }

      if (!isAuthenticated) {
        toast.error("Please authenticate with Lens first.");
        return;
      }

      setIsFollowing(true);
      setFollowError(null);

      try {
        toast.info("Processing unfollow...");

        // Use the modern useLens hook to unfollow the account
        const result = await unfollowUser(address);

        if (result.success) {
          toast.success("Unfollow transaction sent!", {
            description: `Transaction hash: ${result.hash || "Success"}`,
          });
        } else {
          throw new Error(result.error || "Unfollow failed");
        }

        return result;
      } catch (err) {
        console.error("Unfollow transaction failed:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setFollowError(err instanceof Error ? err : new Error(errorMessage));
        toast.error("Unfollow failed", {
          description: errorMessage,
        });
      } finally {
        setIsFollowing(false);
      }
    },
    [unfollowUser, currentAccount, isAuthenticated],
  );

  return {
    follow,
    unfollow,
    isFollowing,
    followError,
  };
};
