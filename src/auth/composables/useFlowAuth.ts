import { useState } from "react";

interface FlowUser {
  loggedIn: boolean;
  address?: string;
}

export const useFlowAuth = () => {
  const [flowUser, setFlowUser] = useState<FlowUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setIsLoading(true);
    try {
      // Stub implementation - actual Flow auth would go here
      setFlowUser({ loggedIn: true, address: "0x0000000000000000" });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setFlowUser(null);
  };

  return {
    flowUser,
    login,
    logout,
    isLoading,
  };
};
