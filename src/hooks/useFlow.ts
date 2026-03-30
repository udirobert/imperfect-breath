import { useState, useCallback } from "react";

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

  const connect = useCallback(async () => {
    console.warn("Flow integration is not configured");
  }, []);

  const disconnect = useCallback(async () => {
    setUser({ loggedIn: false, addr: null, address: null });
  }, []);

  const executeTransaction = useCallback(async (_code: string) => {
    throw new Error("Flow integration is not configured");
  }, []);

  const mintBreathingPattern = useCallback(async (_attributes: unknown, _metadata: unknown) => {
    throw new Error("Flow integration is not configured");
  }, []);

  return {
    state: { isConnected: user.loggedIn },
    user,
    connect,
    disconnect,
    executeTransaction,
    mintBreathingPattern,
    isMinting: false,
    error: null,
  };
};
