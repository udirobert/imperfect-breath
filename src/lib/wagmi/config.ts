import { createConfig, http } from "wagmi";
import { flowTestnet } from "wagmi/chains";
import { injected, walletConnect, metaMask } from "wagmi/connectors";
import { lensTestnet } from "./chains";

// Get project ID from environment (for WalletConnect)
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

// Wagmi configuration with multiple chains
export const wagmiConfig = createConfig({
  chains: [
    lensTestnet, // Lens Chain Testnet
    flowTestnet, // Flow Testnet
  ],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: "Imperfect Breath",
        description: "Decentralized wellness platform for breathing patterns",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:4567",
        icons: ["https://imperfectbreath.com/icon.png"],
      },
    }),
  ],
  transports: {
    [lensTestnet.id]: http(),
    [flowTestnet.id]: http(),
  },
});
