// Centralized environment configuration for multichain architecture

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  flow: {
    accessNode: string;
    discoveryWallet: string;
    contractAddress: string;
    fungibleToken: string;
    flowToken: string;
  };
  lens: {
    environment: 'testnet' | 'mainnet';
    apiUrl: string;
    appAddress: string;
  };
  story: {
    chainId: string;
    rpcUrl: string;
  };
  ai: {
    geminiApiKey: string;
  };
  app: {
    name: string;
    description: string;
    url: string;
    icon: string;
  };
  development: {
    debugMode: boolean;
    enableAnalytics: boolean;
  };
}

// Validate required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_FLOW_ACCESS_NODE',
  'VITE_FLOW_CONTRACT_ADDRESS',
  'VITE_LENS_API_URL',
  'VITE_STORY_RPC_URL',
  'VITE_GEMINI_API_KEY',
] as const;

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
}

export const config: EnvironmentConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  },
  flow: {
    accessNode: import.meta.env.VITE_FLOW_ACCESS_NODE!,
    discoveryWallet: import.meta.env.VITE_FLOW_DISCOVERY_WALLET || 'https://fcl-discovery.onflow.org/testnet/authn',
    contractAddress: import.meta.env.VITE_FLOW_CONTRACT_ADDRESS!,
    fungibleToken: import.meta.env.VITE_FLOW_FUNGIBLE_TOKEN || '0x9a0766d93b6608b7',
    flowToken: import.meta.env.VITE_FLOW_FLOW_TOKEN || '0x7e60df042a9c0868',
  },
  lens: {
    environment: (import.meta.env.VITE_LENS_ENVIRONMENT as 'testnet' | 'mainnet') || 'testnet',
    apiUrl: import.meta.env.VITE_LENS_API_URL!,
    appAddress: import.meta.env.VITE_LENS_APP_ADDRESS || '0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7', // Testnet default
  },
  story: {
    chainId: import.meta.env.VITE_STORY_CHAIN_ID || '11155111',
    rpcUrl: import.meta.env.VITE_STORY_RPC_URL!,
  },
  ai: {
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY!,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Imperfect Breath',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Decentralized wellness platform for breathing patterns',
    url: import.meta.env.VITE_APP_URL || 'https://imperfectbreath.com',
    icon: import.meta.env.VITE_APP_ICON || 'https://imperfectbreath.com/icon.png',
  },
  development: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  },
} as const;

// Export individual configs for convenience
export const { supabase, flow, lens, story, ai, app, development } = config;

// Development helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Logging helper that respects debug mode
export const debugLog = (...args: any[]) => {
  if (development.debugMode || isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
};

export default config;
