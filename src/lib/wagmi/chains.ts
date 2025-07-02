import { defineChain } from 'viem';

export const lensTestnet = defineChain({
  id: 37111,
  name: 'Lens Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'GRASS',
    symbol: 'GRASS',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.lens.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lens Explorer',
      url: 'https://explorer.testnet.lens.xyz',
    },
  },
  testnet: true,
});

export const lensMainnet = defineChain({
  id: 232,
  name: 'Lens Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'GHO',
    symbol: 'GHO',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.lens.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lens Explorer',
      url: 'https://explorer.lens.xyz',
    },
  },
  testnet: false,
});