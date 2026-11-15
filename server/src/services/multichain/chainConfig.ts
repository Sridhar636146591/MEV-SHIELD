/**
 * Multi-Chain Configuration and Support
 * Supports: Ethereum, Arbitrum, Optimism, Polygon, Base, BNB Chain
 */

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  alchemyId?: string;
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Ethereum Mainnet
  1: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    wsUrl: process.env.ETH_WS_URL || 'wss://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Arbitrum One
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    wsUrl: process.env.ARBITRUM_WS_URL || 'wss://arb-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Optimism
  10: {
    id: 10,
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://opt-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    wsUrl: process.env.OPTIMISM_WS_URL || 'wss://opt-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Polygon PoS
  137: {
    id: 137,
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    wsUrl: process.env.POLYGON_WS_URL || 'wss://polygon-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },

  // Base
  8453: {
    id: 8453,
    name: 'Base',
    rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    wsUrl: process.env.BASE_WS_URL || 'wss://base-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    explorerUrl: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // BNB Chain
  56: {
    id: 56,
    name: 'BNB Chain',
    rpcUrl: process.env.BNB_RPC_URL || 'https://bnb-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    wsUrl: process.env.BNB_WS_URL || 'wss://bnb-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
};

export const SUPPORTED_CHAINS = Object.values(CHAIN_CONFIGS);

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId];
}

export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}

export default CHAIN_CONFIGS;
