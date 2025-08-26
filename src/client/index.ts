/**
 * @riva-labs/sdk - Client Module
 * 
 * Main client interface for Tokenized Vaults operations
 * Production-ready client for $100B+ volume
 */

// Main client class
export { RivaClient } from './VaultClient';

// Re-export types for convenience
export type {
  VaultConfig,
  Vault,
  VaultMetadata,
  OwnerCap,
  MintParams,
  RedeemParams,
  DepositParams,
  WithdrawParams,
  UpdateRateParams,
  ExchangeCalculation,
  VaultSDKConfig,
  TransactionResult,
} from '../types';

// Re-export constants
export {
  MAINNET_CONFIG,
  TESTNET_CONFIG,
  DEVNET_CONFIG,
  LOCALNET_CONFIG,
  DEFAULT_NETWORK,
  COIN_TYPES,
  DEFAULT_GAS_BUDGET,
} from '../constants';
