/**
 * Network configurations for Riva SDK
 * Production-ready network settings for all Sui environments
 */

import type { NetworkConfig } from '../types';

// ============================================================================
// NETWORK CONFIGURATIONS
// ============================================================================

/**
 * Mainnet configuration - Production ready for $100B+ volume
 */
export const MAINNET_CONFIG: NetworkConfig = {
  name: 'mainnet',
  rpcUrl: 'https://fullnode.mainnet.sui.io:443',
  packageId: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

/**
 * Testnet configuration - For testing and staging
 */
export const TESTNET_CONFIG: NetworkConfig = {
  name: 'testnet',
  rpcUrl: 'https://fullnode.testnet.sui.io:443',
  faucetUrl: 'https://faucet.testnet.sui.io/v2/gas',
  packageId: '0x2dc725191c2b57d4d2731ff9c278452cab00a393e0bd0efd6c5c9b01e171b8d3', // Updated vault package
};

/**
 * Devnet configuration - For development
 */
export const DEVNET_CONFIG: NetworkConfig = {
  name: 'devnet',
  rpcUrl: 'https://fullnode.devnet.sui.io:443',
  faucetUrl: 'https://faucet.devnet.sui.io/v2/gas',
  packageId: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

/**
 * Localnet configuration - For local development
 */
export const LOCALNET_CONFIG: NetworkConfig = {
  name: 'localnet',
  rpcUrl: 'http://127.0.0.1:9000',
  faucetUrl: 'http://127.0.0.1:9123/v2/gas',
  packageId: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

/**
 * All available network configurations
 */
export const NETWORK_CONFIGS = {
  mainnet: MAINNET_CONFIG,
  testnet: TESTNET_CONFIG,
  devnet: DEVNET_CONFIG,
  localnet: LOCALNET_CONFIG,
} as const;

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK = TESTNET_CONFIG;

// ============================================================================
// NETWORK UTILITIES
// ============================================================================

/**
 * Get network configuration by name
 */
export function getNetworkConfig(network: keyof typeof NETWORK_CONFIGS): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

/**
 * Validate network configuration
 */
export function validateNetworkConfig(config: NetworkConfig): boolean {
  return (
    config.name !== undefined &&
    config.rpcUrl !== undefined &&
    config.packageId !== undefined &&
    config.packageId.length === 66 && // Valid Sui address length
    config.packageId.startsWith('0x')
  );
}

/**
 * Check if network is production (mainnet)
 */
export function isProductionNetwork(network: NetworkConfig['name']): boolean {
  return network === 'mainnet';
}

/**
 * Check if network has faucet
 */
export function hasFaucet(network: NetworkConfig['name']): boolean {
  return network !== 'mainnet';
}


