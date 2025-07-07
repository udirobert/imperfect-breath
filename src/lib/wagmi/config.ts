import { createConfig, http } from 'wagmi';
import { flowTestnet } from 'wagmi/chains';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';
import { lensTestnet } from './chains';
import { networkConfig } from '../blockchain/config';

// Create a Story Protocol Aeneid Testnet chain configuration
const storyAeneidTestnet = {
  id: networkConfig.aeneid.chainId,
  name: networkConfig.aeneid.name,
  network: 'story-aeneid-testnet',
  nativeCurrency: {
    name: networkConfig.aeneid.currency.name,
    symbol: networkConfig.aeneid.currency.symbol,
    decimals: networkConfig.aeneid.currency.decimals,
  },
  rpcUrls: {
    default: { http: [networkConfig.aeneid.rpcUrl] },
    public: { http: [networkConfig.aeneid.rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: 'Story Protocol Explorer',
      url: networkConfig.aeneid.blockExplorer,
    },
  },
  testnet: true,
};

// Get project ID from environment (for WalletConnect)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const wagmiConfig = createConfig({
  chains: [
    lensTestnet,        // Lens Chain Testnet
    storyAeneidTestnet, // Story Protocol Aeneid Testnet
    flowTestnet,        // Flow Testnet
  ],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: 'Imperfect Breath',
        description: 'Decentralized wellness platform for breathing patterns',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:8080',
        icons: ['https://imperfectbreath.com/icon.png'],
      },
    }),
  ],
  transports: {
    [lensTestnet.id]: http(),
    [storyAeneidTestnet.id]: http(),
    [flowTestnet.id]: http(),
  },
});