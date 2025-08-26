/**
 * Core types for the Riva SDK
 */

import type { SuiObjectRef } from '@mysten/sui/client';

// Define SuiAddress locally since it's not exported from @mysten/sui/client
export type SuiAddress = string;
import type { TransactionObjectInput } from '@mysten/sui/transactions';

// ============================================================================
// VAULT CORE TYPES
// ============================================================================

/**
 * Vault configuration for creating new vaults
 */
export interface VaultConfig<InputCoin extends string, OutputCoin extends string> {
  /** Exchange rate (with decimals) */
  rate: string | bigint;
  /** Number of decimal places for rate precision */
  rateDecimals: number;
  /** Vault symbol (e.g., "VAULT") */
  symbol: string;
  /** Vault display name */
  name: string;
  /** Vault description */
  description: string;
  /** Optional icon URL */
  iconUrl?: string;
  /** Input coin type identifier */
  inputCoinType: InputCoin;
  /** Output coin type identifier */
  outputCoinType: OutputCoin;
}

/**
 * Vault object representation
 */
export interface Vault<InputCoin extends string, OutputCoin extends string> {
  /** Vault object ID */
  id: string;
  /** Exchange rate multiplier */
  rate: string;
  /** Rate decimal precision */
  rateDecimals: number;
  /** Current reserve balance */
  reserveValue: string;
  /** Input coin type */
  inputCoinType: InputCoin;
  /** Output coin type */
  outputCoinType: OutputCoin;
  /** Object reference for transactions */
  objectRef: SuiObjectRef;
}

/**
 * Vault metadata object
 */
export interface VaultMetadata<InputCoin extends string, OutputCoin extends string> {
  /** Metadata object ID */
  id: string;
  /** Vault display name */
  name: string;
  /** Vault symbol */
  symbol: string;
  /** Vault description */
  description: string;
  /** Optional icon URL */
  iconUrl?: string;
  /** Associated input coin type */
  inputCoinType: InputCoin;
  /** Associated output coin type */
  outputCoinType: OutputCoin;
  /** Object reference for transactions */
  objectRef: SuiObjectRef;
}

/**
 * Owner capability for vault administration
 */
export interface OwnerCap {
  /** Owner cap object ID */
  id: string;
  /** Associated vault ID */
  vaultId: string;
  /** Object reference for transactions */
  objectRef: SuiObjectRef;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * Transaction result with created objects
 */
export interface TransactionResult {
  /** Transaction digest */
  digest: string;
  /** Created object IDs */
  createdObjects: string[];
  /** Gas used */
  gasUsed: string;
  /** Transaction success status */
  success: boolean;
}

/**
 * Mint operation parameters
 */
export interface MintParams<InputCoin extends string, OutputCoin extends string> {
  /** Vault to mint from */
  vaultId: string;
  /** Vault metadata ID */
  metadataId: string;
  /** Input coin object or amount */
  inputCoin: TransactionObjectInput | string;
  /** Input coin type */
  inputCoinType: InputCoin;
  /** Output coin type */
  outputCoinType: OutputCoin;
}

/**
 * Redeem operation parameters
 */
export interface RedeemParams<InputCoin extends string, OutputCoin extends string> {
  /** Vault to redeem from */
  vaultId: string;
  /** Vault metadata ID */
  metadataId: string;
  /** Output coin object or amount */
  outputCoin: TransactionObjectInput | string;
  /** Input coin type */
  inputCoinType: InputCoin;
  /** Output coin type */
  outputCoinType: OutputCoin;
}

/**
 * Deposit operation parameters (owner only)
 */
export interface DepositParams<InputCoin extends string> {
  /** Owner capability */
  ownerCap: TransactionObjectInput | string;
  /** Vault to deposit into */
  vaultId: string;
  /** Input coin to deposit */
  inputCoin: TransactionObjectInput | string;
  /** Input coin type */
  inputCoinType: InputCoin;
}

/**
 * Withdraw operation parameters (owner only)
 */
export interface WithdrawParams<InputCoin extends string> {
  /** Owner capability */
  ownerCap: TransactionObjectInput | string;
  /** Vault to withdraw from */
  vaultId: string;
  /** Amount to withdraw */
  amount: string | bigint;
  /** Input coin type */
  inputCoinType: InputCoin;
}

/**
 * Rate update parameters (owner only)
 */
export interface UpdateRateParams {
  /** Owner capability */
  ownerCap: TransactionObjectInput | string;
  /** Vault to update */
  vaultId: string;
  /** New exchange rate */
  newRate: string | bigint;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

/**
 * Exchange rate calculation result
 */
export interface ExchangeCalculation {
  /** Input amount */
  inputAmount: string;
  /** Output amount */
  outputAmount: string;
  /** Exchange rate used */
  rate: string;
  /** Rate decimals */
  rateDecimals: number;
  /** Price impact percentage */
  priceImpact: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Coin type helper for type safety
 */
export type CoinType = `0x${string}::${string}::${string}`;

/**
 * Common Sui coin types
 */
export const COIN_TYPES = {
  SUI: '0x2::sui::SUI' as const,
  USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN' as const,
  USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN' as const,
} as const;

/**
 * Network configuration
 */
export interface NetworkConfig {
  /** Network name */
  name: 'mainnet' | 'testnet' | 'devnet' | 'localnet' | 'custom';
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Faucet URL (if available) */
  faucetUrl?: string;
  /** Package ID for vault contracts */
  packageId: string;
}

/**
 * SDK configuration options
 */
export interface VaultSDKConfig {
  /** Network configuration */
  network: NetworkConfig;
  /** Default gas budget */
  gasBudget?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom request timeout in ms */
  timeout?: number;
}

