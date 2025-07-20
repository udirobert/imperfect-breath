import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useLens } from "./useLens";

export interface LensV3Account {
  address: string;
  username?: string;
  name?: string;
  picture?: string;
  followersCount?: number;
  followingCount?: number;
  isVerified?: boolean;
}

interface UseLensAccountReturn {
  lensAccount: LensV3Account | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

export const useLensAccount = (): UseLensAccountReturn => {
  const { profile } = useAuth();
  const { isAuthenticated, currentAccount, authError } = useLens();
  const [lensAccount, setLensAccount] = useState<LensV3Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!profile?.wallet_address || !isAuthenticated || !currentAccount) {
      setLensAccount(null);
      setError(null);
      return;
    }

    const convertToLensV3Account = () => {
      setLoading(true);
      setError(null);

      try {
        // Convert our new lens account structure to the legacy format
        const convertedAccount: LensV3Account = {
          address: currentAccount.ownedBy.address,
          username: currentAccount.handle?.fullHandle || currentAccount.id,
          name: currentAccount.metadata?.displayName || "Lens User",
          picture:
            currentAccount.metadata?.picture?.__typename === "ImageSet"
              ? currentAccount.metadata.picture.optimized?.uri
              : undefined,
          followersCount: currentAccount.stats?.followers || 0,
          followingCount: currentAccount.stats?.following || 0,
          isVerified: false, // We don't have verification data in our current structure
        };

        setLensAccount(convertedAccount);
      } catch (err) {
        console.error("Error converting Lens account:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(err instanceof Error ? err : new Error(errorMessage));
        setLensAccount(null);
      } finally {
        setLoading(false);
      }
    };

    convertToLensV3Account();
  }, [profile?.wallet_address, isAuthenticated, currentAccount]);

  // Convert auth error to Error object if needed
  useEffect(() => {
    if (authError) {
      setError(new Error(authError));
    } else {
      setError(null);
    }
  }, [authError]);

  return {
    lensAccount,
    loading,
    error,
    isAuthenticated,
  };
};
