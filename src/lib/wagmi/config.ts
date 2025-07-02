import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, flowTestnet } from 'wagmi/chains';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';
import { lensTestnet, lensMainnet } from './chains';

// Get project ID from environment (for WalletConnect)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const wagmiConfig = createConfig({
  chains: [
    lensTestnet,
    lensMainnet,
    mainnet,
    sepolia,
    flowTestnet,
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
    [lensMainnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [flowTestnet.id]: http(),
  },
});