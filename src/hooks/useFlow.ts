import { useState, useCallback, useEffect } from "react";
import * as fcl from "@onflow/fcl";
import { blockchainAuthService } from "../services/blockchain/BlockchainAuthService";

interface FlowUser {
  loggedIn: boolean;
  addr: string | null;
  address: string | null;
}

interface FlowState {
  isConnected: boolean;
}

interface UseFlowReturn {
  state: FlowState;
  user: FlowUser;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  executeTransaction: (code: string) => Promise<string>;
  mintBreathingPattern: (attributes: unknown, metadata: unknown) => Promise<string>;
  isMinting: boolean;
  error: string | null;
}

export const useFlow = (_options?: { network?: string }): UseFlowReturn => {
  const [user, setUser] = useState<FlowUser>({
    loggedIn: false,
    addr: null,
    address: null,
  });
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fcl.currentUser().subscribe((currentUser: { addr: string | null; loggedIn: boolean }) => {
      setUser({
        loggedIn: currentUser.loggedIn,
        addr: currentUser.addr,
        address: currentUser.addr,
      });
    });
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      await blockchainAuthService.authenticateFlow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Flow");
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await fcl.unauthenticate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }, []);

  const executeTransaction = useCallback(async (code: string) => {
    try {
      setError(null);
      const transactionId = await fcl.mutate({
        cadence: code,
        limit: 1000,
      });
      return transactionId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const mintBreathingPattern = useCallback(async (attributes: unknown, metadata: unknown) => {
    if (!user.loggedIn) {
      await connect();
    }
    
    setIsMinting(true);
    setError(null);
    try {
      // Functional FCL minting implementation placeholder
      // Connect to the specific NFT contract with correct Vaults
      const txId = await fcl.mutate({
        cadence: `
          transaction {
            prepare(acct: auth(Storage) &Account) {
              log("Minting breathing pattern on Flow via FCL")
            }
            execute {
            }
          }
        `,
        limit: 1000,
      });
      return txId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Minting failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsMinting(false);
    }
  }, [user.loggedIn, connect]);

  return {
    state: { isConnected: user.loggedIn },
    user,
    connect,
    disconnect,
    executeTransaction,
    mintBreathingPattern,
    isMinting,
    error,
  };
};
