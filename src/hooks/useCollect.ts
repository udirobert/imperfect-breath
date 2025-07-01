// TODO: Replace with proper multichain implementation
// import { useAccount, useWriteContract } from 'wagmi';
import { useState } from 'react';
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from '@/lib/lens';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useLensProfile } from './useLensProfile';

export const useCollect = () => {
  const { address, chain } = useAccount();
  const { lensProfile } = useLensProfile();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const collect = useCallback(async (profileIdPointed: bigint, pubIdPointed: bigint) => {
    if (!lensProfile) {
      toast.error("You must have a Lens profile to collect.");
      return;
    }
    if (!address || !chain) {
      toast.error("Please connect your wallet.");
      return;
    }

    try {
      const vars = {
        profileId: profileIdPointed,
        pubId: pubIdPointed,
        data: [],
      };

      const tx = await writeContractAsync({
        address: LENS_HUB_CONTRACT_ADDRESS,
        abi: LENS_HUB_ABI,
        functionName: 'collect',
        args: [vars],
        account: address,
        chain: chain,
      });
      toast.success("Collect transaction sent!", {
        description: `Transaction hash: ${tx}`,
      });
      return tx;
    } catch (err) {
      console.error("Collect transaction failed:", err);
      toast.error("Collect failed", {
        description: (err as Error).message || "An unknown error occurred.",
      });
    }
  }, [writeContractAsync, address, chain, lensProfile]);

  return {
    collect,
    isCollecting: isPending,
    collectError: error,
  };
};