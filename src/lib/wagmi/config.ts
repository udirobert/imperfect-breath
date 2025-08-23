import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, sepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// Get environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''
const enableWalletConnect = import.meta.env.VITE_ENABLE_WALLET_CONNECT === 'true' && projectId && !projectId.includes('your_') && !projectId.includes('demo')

// Define supported chains
const chains = [mainnet, polygon, arbitrum, sepolia] as const

// Create connectors array conditionally
const connectors = [
  injected(),
  coinbaseWallet({
    appName: 'Imperfect Breath',
    appLogoUrl: 'https://imperfect-breath.com/icon.png',
  }),
  ...(enableWalletConnect ? [walletConnect({ projectId })] : []),
]

// Create Wagmi config
export const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'demo'}`),
    [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'demo'}`),
    [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'demo'}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'demo'}`),
  },
})

// Export chains for use in other parts of the app
export { chains }

// Export types
export type Config = typeof config
export type SupportedChainId = typeof chains[number]['id']
