"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { createPublicClient } from "viem";
import { chains } from "@lens-chain/sdk/viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import React from "react";

const config = createConfig(
  getDefaultConfig({
    chains: [chains.mainnet, chains.testnet],
    transports: {
      [chains.mainnet.id]: http(chains.mainnet.rpcUrls.default.http[0]!),
      [chains.testnet.id]: http(chains.testnet.rpcUrls.default.http[0]!),
    },
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID!,
    appName: "Imperfect Breath",
    appDescription:
      "Track your breath. Tokenize your peace. Earn from presence.",
    appUrl: "https://imperfect-breath.vercel.app", // TODO: Update with actual URL
    appIcon: "https://imperfect-breath.vercel.app/apple-touch-icon.png", // TODO: Update with actual URL
  })
);

const queryClient = new QueryClient();

export const publicClient = createPublicClient({
  chain: chains.mainnet, // Or chains.testnet
  transport: http(),
});

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
