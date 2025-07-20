import { useState } from "react";
import { useLensAccount } from "./useLensAccount";
import { useLens } from "./useLens";
import { toast } from "sonner";
import { useCallback } from "react";

export const useFollow = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followError, setFollowError] = useState<Error | null>(null);
  const { lensAccount } = useLensAccount();
  const { isAuthenticated, followAccount, unfollowAccount } = useLens();

  const follow = useCallback(
    async (address: string) => {
      if (!address) {
        toast.error("Invalid account address.");
        return;
      }

      if (!lensAccount) {
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

        // Use the Lens hook to follow the account
        const result = await followAccount(address);

        if (result.success) {
          toast.success("Follow transaction sent!", {
            description: `Transaction hash: ${result.transactionHash || "Success"}`,
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
    [followAccount, lensAccount, isAuthenticated],
  );

  const unfollow = useCallback(
    async (address: string) => {
      if (!address) {
        toast.error("Invalid account address.");
        return;
      }

      if (!lensAccount) {
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

        // Use the Lens hook to unfollow the account
        const result = await unfollowAccount(address);

        if (result.success) {
          toast.success("Unfollow transaction sent!", {
            description: `Transaction hash: ${result.transactionHash || "Success"}`,
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
    [unfollowAccount, lensAccount, isAuthenticated],
  );

  return {
    follow,
    unfollow,
    isFollowing,
    followError,
  };
};
