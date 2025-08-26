/**
 * @riva/sdk - Main Entry Point
 * 
 * TypeScript SDK for Tokenized Vaults on Sui (Riva Labs)
 * 
 * @example
 * ```typescript
 * import { RivaClient, MAINNET_CONFIG, COIN_TYPES } from '@riva/sdk';
 * 
 * // Initialize client
 * const client = await RivaClient.initialize({
 *   network: MAINNET_CONFIG,
 *   debug: false,
 * });
 * 
 * // Create vault (build-only)
 * const tx = new Transaction();
 * await client.createVault({
 *   rate: '200000000',
 *   rateDecimals: 9,
 *   inputCoinType: COIN_TYPES.SUI,
 *   outputCoinType: COIN_TYPES.USDC,
 *   symbol: 'VAULT',
 *   name: 'SUI-USDC Vault',
 *   description: 'Secure SUI to USDC conversion',
 * }, treasuryCap, tx);
 * ```
 */

// ============================================================================
// MAIN EXPORTS
// ============================================================================

// Core client
export { RivaClient } from './client';

// Types
export type * from './types';
export { VaultError, VaultErrorCode } from './types';

// Constants and configurations (selective exports to avoid conflicts)
export {
  // Network configurations
  MAINNET_CONFIG,
  TESTNET_CONFIG,
  DEVNET_CONFIG,
  LOCALNET_CONFIG,
  DEFAULT_NETWORK,
  
  // SDK constants
  SDK_VERSION,
  DEFAULT_GAS_BUDGET,

  
  // Vault constants
  VAULT_MODULES,
  VAULT_FUNCTIONS,
  VAULT_STRUCTS,
  
  // Error messages
  ERROR_MESSAGES,
  
  // Coin types
  COIN_TYPES,
} from './constants';

// Utilities (selective exports for public API)
export {
  // Calculations
  calculateOutputAmount,
  calculateInputAmount,
  // Internal metric helper; not part of minimal public surface
  
  // Formatters
  formatCoinAmount,
  parseCoinAmount,
  formatAddress,
  formatTxDigest,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  
  // Validators
  isValidSuiAddress,
  isValidCoinType,
  isValidAmount,
  validateSuiAddress,
  validateCoinType,
  validateAmount,
  
  // General utilities
  sleep,
  retry,
  debounce,
  throttle,
  normalizeAddress,
  timeout,
} from './utils';

// ============================================================================
// SDK METADATA
// ============================================================================

/**
 * SDK version
 */
export const VERSION = '1.0.0';

/**
 * Supported networks
 */
export const SUPPORTED_NETWORKS = ['mainnet', 'testnet', 'devnet', 'localnet'] as const;

/**
 * SDK name
 */
export const SDK_NAME = '@riva/sdk';

/**
 * Default configuration for quick setup
 */
export const DEFAULT_CONFIG = {
  gasBudget: '100000000', // 0.1 SUI
  timeout: 30000, // 30 seconds
  debug: false,
} as const;

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick setup function for common use cases
 * 
 * @example
 * ```typescript
 * const client = await quickSetup('mainnet', { debug: true });
 * ```
 */
export async function quickSetup(
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet',
  options?: {
    rpcUrl?: string;
    packageId?: string;
    debug?: boolean;
    gasBudget?: string;
  }
) {
  const { MAINNET_CONFIG, TESTNET_CONFIG, DEVNET_CONFIG, LOCALNET_CONFIG } = await import('./constants');
  
  const networkConfigs = {
    mainnet: MAINNET_CONFIG,
    testnet: TESTNET_CONFIG,
    devnet: DEVNET_CONFIG,
    localnet: LOCALNET_CONFIG,
  };
  
  const baseConfig = networkConfigs[network];
  
  const config = {
    network: {
      ...baseConfig,
      rpcUrl: options?.rpcUrl || baseConfig.rpcUrl,
      packageId: options?.packageId || baseConfig.packageId,
    },
    debug: options?.debug || false,
    gasBudget: options?.gasBudget || DEFAULT_CONFIG.gasBudget,
    timeout: DEFAULT_CONFIG.timeout,
  };
  
  const { RivaClient } = await import('./client');
  return RivaClient.initialize(config);
}

/**
 * Create a vault with sensible defaults (build-only)
 * 
 * @example
 * ```typescript
 * const vault = await createVaultWithDefaults(client, {
 *   inputCoinType: COIN_TYPES.SUI,
 *   outputCoinType: COIN_TYPES.USDC,
 *   rate: '200', // 1 SUI = 0.2 USDC
 * }, keypair, treasuryCap);
 * ```
 */
export async function createVaultWithDefaults<
  InputCoin extends string,
  OutputCoin extends string
>(
  client: any, // RivaClient type
  params: {
    inputCoinType: InputCoin;
    outputCoinType: OutputCoin;
    rate: string | bigint;
    symbol?: string;
    name?: string;
    description?: string;
  },
  treasuryCap: any, // TransactionObjectInput
  transaction: any // Transaction
) {
  const { getCoinSymbol } = await import('./constants');
  
  const inputSymbol = getCoinSymbol(params.inputCoinType);
  const outputSymbol = getCoinSymbol(params.outputCoinType);
  
  return client.createVault({
    rate: params.rate,
    rateDecimals: 9, // Standard precision
    inputCoinType: params.inputCoinType,
    outputCoinType: params.outputCoinType,
    symbol: params.symbol || `${inputSymbol}-${outputSymbol}`,
    name: params.name || `${inputSymbol} to ${outputSymbol} Vault`,
    description: params.description || `Secure conversion from ${inputSymbol} to ${outputSymbol}`,
  }, treasuryCap, transaction);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Check if error is a VaultError
 */
export function isVaultError(error: unknown): error is import('./types').VaultError {
  return error instanceof Error && error.name === 'VaultError';
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isVaultError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Enable debug logging for all SDK operations
 */
export function enableDebugLogging(): void {
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__RIVA_SDK_DEBUG__ = true;
  }
}

/**
 * Disable debug logging
 */
export function disableDebugLogging(): void {
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__RIVA_SDK_DEBUG__ = false;
  }
}
