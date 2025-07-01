// TODO: Replace with proper multichain implementation
// import { useAccount, useWriteContract } from 'wagmi';
import { useState } from 'react';
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from '@/lib/lens';
import { toast } from 'sonner';
import { useCallback } from 'react';

export const useFollow = () => {
  const { address, chain } = useAccount();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const follow = useCallback(async (profileId: number) => {
    if (!profileId) {
      toast.error("Invalid profile ID.");
      return;
    }
    if (!address || !chain) {
      toast.error("Please connect your wallet.");
      return;
    }

    try {
      const tx = await writeContractAsync({
        address: LENS_HUB_CONTRACT_ADDRESS,
        abi: LENS_HUB_ABI,
        functionName: 'follow',
        args: [[profileId], [[]]], // Following with no specific data
        account: address,
        chain: chain,
      });
      toast.success("Follow transaction sent!", {
        description: `Transaction hash: ${tx}`,
      });
      return tx;
    } catch (err) {
      console.error("Follow transaction failed:", err);
      toast.error("Follow failed", {
        description: (err as Error).message || "An unknown error occurred.",
      });
    }
  }, [writeContractAsync, address, chain]);

  return {
    follow,
    isFollowing: isPending,
    followError: error,
  };
};