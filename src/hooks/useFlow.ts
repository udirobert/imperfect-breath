
import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";
import { useState, useEffect } from "react";
import { config, debugLog } from "@/config/environment";

// Configure FCL with proper environment variables
fcl.config({
  "accessNode.api": config.flow.accessNode,
  "discovery.wallet": config.flow.discoveryWallet,
  "app.detail.title": config.app.name,
  "app.detail.icon": config.app.icon,
  "0xImperfectBreath": config.flow.contractAddress,
  "0xFlowToken": config.flow.flowToken,
  "0xFungibleToken": config.flow.fungibleToken
});

export interface FlowUser {
  loggedIn: boolean | null;
  addr?: string;
  cid?: string;
  expiresAt?: number;
}

export interface TransactionResult {
  transactionId: string;
  status: 'PENDING' | 'FINALIZED' | 'EXECUTED' | 'SEALED' | 'EXPIRED';
  statusCode: number;
  errorMessage?: string;
}

export function useFlow() {
  const [user, setUser] = useState<FlowUser>({ loggedIn: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = fcl.currentUser().subscribe(setUser);
    return () => unsubscribe();
  }, []);

  const logIn = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await fcl.logIn();
      debugLog('User logged in successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('Flow login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await fcl.unauthenticate();
      debugLog('User logged out successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      console.error('Flow logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTransaction = async (
    cadenceCode: string, 
    args: Array<{ value: any; type: string }> = [],
    options: { limit?: number } = {}
  ): Promise<TransactionResult> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user.loggedIn) {
        throw new Error('User must be logged in to execute transactions');
      }

      debugLog('Executing transaction:', { cadenceCode, args });

      const transactionId = await fcl.mutate({
        cadence: cadenceCode,
        args: (arg, t) => args.map(a => arg(a.value, t[a.type as keyof typeof t])),
        proposer: fcl.currentUser().authorization,
        payer: fcl.currentUser().authorization,
        authorizations: [fcl.currentUser().authorization],
        limit: options.limit || 999
      });

      debugLog('Transaction submitted:', transactionId);

      // Wait for transaction to be sealed
      const transactionStatus = await fcl.tx(transactionId).onceSealed();
      
      debugLog('Transaction sealed:', transactionStatus);

      return {
        transactionId,
        status: transactionStatus.status,
        statusCode: transactionStatus.statusCode,
        errorMessage: transactionStatus.errorMessage
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      console.error('Transaction error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const executeScript = async (
    cadenceCode: string, 
    args: Array<{ value: any; type: string }> = []
  ): Promise<any> => {
    try {
      setError(null);
      
      debugLog('Executing script:', { cadenceCode, args });

      const result = await fcl.query({
        cadence: cadenceCode,
        args: (arg, t) => args.map(a => arg(a.value, t[a.type as keyof typeof t]))
      });

      debugLog('Script result:', result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Script execution failed';
      setError(errorMessage);
      console.error('Script error:', err);
      throw err;
    }
  };

  // Helper function to check if user has collection set up
  const checkUserCollection = async (address: string): Promise<boolean> => {
    const script = `
      import ImperfectBreath from 0xImperfectBreath
      
      pub fun main(address: Address): Bool {
        return getAccount(address)
          .getCapability(ImperfectBreath.CollectionPublicPath)
          .check<&{ImperfectBreath.CollectionPublic}>()
      }
    `;

    try {
      return await executeScript(script, [{ value: address, type: 'Address' }]);
    } catch {
      return false;
    }
  };

  // Helper function to set up user collection
  const setupUserCollection = async (): Promise<TransactionResult> => {
    const transaction = `
      import ImperfectBreath from 0xImperfectBreath
      
      transaction {
        prepare(signer: AuthAccount) {
          if signer.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath) == nil {
            signer.save(<-ImperfectBreath.createEmptyCollection(), to: ImperfectBreath.CollectionStoragePath)
            signer.link<&{ImperfectBreath.CollectionPublic}>(
              ImperfectBreath.CollectionPublicPath,
              target: ImperfectBreath.CollectionStoragePath
            )
          }
        }
      }
    `;

    return await executeTransaction(transaction);
  };

  return {
    user,
    isLoading,
    error,
    logIn,
    logOut,
    executeTransaction,
    executeScript,
    checkUserCollection,
    setupUserCollection,
    t // Expose Flow types for convenience
  };
}
