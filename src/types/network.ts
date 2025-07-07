/**
 * Network configuration types for blockchain integrations
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress: string;
  apiUrl: string;
  isTestnet: boolean;
}

export interface NetworkState {
  connected: boolean;
  chainId?: number;
  address?: string;
  balance?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
}

export interface BlockchainNetworks {
  flow: NetworkConfig;
  story: NetworkConfig;
  lens: NetworkConfig;
}

export const BLOCKCHAIN_NETWORKS: BlockchainNetworks = {
  flow: {
    name: 'Flow Testnet',
    chainId: 16,
    rpcUrl: 'https://rest-testnet.onflow.org',
    explorerUrl: 'https://testnet.flowscan.org',
    contractAddress: '0xf8d6e0586b0a20c7',
    apiUrl: 'https://rest-testnet.onflow.org/v1',
    isTestnet: true
  },
  story: {
    name: 'Story Aeneid Testnet',
    chainId: 80002,
    rpcUrl: 'https://rpc-testnet.story.xyz',
    explorerUrl: 'https://explorer-testnet.story.xyz',
    contractAddress: '0x09Fd5da2BCF1F2C37AAd3b48F84E0F2F27211534',
    apiUrl: 'https://api-testnet.story.xyz',
    isTestnet: true
  },
  lens: {
    name: 'Lens Chain Testnet',
    chainId: 9090,
    rpcUrl: 'https://rpc-testnet.lens-chain.xyz',
    explorerUrl: 'https://explorer-testnet.lens-chain.xyz',
    contractAddress: '0x3D1bfB3BEcFA3452D83176f772B395b7e9cbC7c3',
    apiUrl: 'https://api-v3-testnet.lens-chain.xyz',
    isTestnet: true
  }
};