/**
 * @riva-labs/sdk - Constants Module
 * 
 * All constants, configurations, and static values for the Riva SDK
 * Production-ready constants for $100B+ volume operations
 */

// Network configurations
export * from './networks';

// Coin type definitions
export * from './coins';

// ============================================================================
// SDK CONSTANTS
// ============================================================================

/**
 * SDK version
 */
export const SDK_VERSION = '1.0.0';

/**
 * Default gas budget for transactions (in MIST)
 */
export const DEFAULT_GAS_BUDGET = '100000000'; // 0.1 SUI

/**
 * Maximum gas budget for complex transactions (in MIST)
 */
export const MAX_GAS_BUDGET = '1000000000'; // 1 SUI

/**
 * Default slippage tolerance (in basis points)
 * 50 = 0.5%
 */
// Slippage constants removed - not applicable to vault protocols

/**
 * Maximum slippage tolerance (in basis points)
 * 1000 = 10%
 */
// Slippage constants removed completely

/**
 * Request timeout in milliseconds
 */
export const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Maximum retry attempts for failed requests
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry delay in milliseconds
 */
export const RETRY_DELAY_MS = 1000;

// ============================================================================
// VAULT PROTOCOL CONSTANTS
// ============================================================================

/**
 * Module names in the vault package
 */
export const VAULT_MODULES = {
  VAULT: 'vault',
} as const;

/**
 * Function names for vault operations
 */
export const VAULT_FUNCTIONS = {
  // Public functions
  CREATE_VAULT: 'create_vault',
  MINT: 'mint',
  REDEEM: 'redeem',
  
  // Owner functions
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  SET_RATE: 'set_rate',
  
  // View functions
  RATE: 'rate',
  RESERVE_VALUE: 'reserve_value',
  IS_VALID_OWNER_CAP: 'is_valid_owner_cap',
} as const;

/**
 * Struct names for vault types
 */
export const VAULT_STRUCTS = {
  VAULT: 'Vault',
  VAULT_METADATA: 'VaultMetadata',
  OWNER_CAP: 'OwnerCap',
} as const;

/**
 * Event types emitted by vault operations
 */
export const VAULT_EVENTS = {
  VAULT_CREATED: 'VaultCreated',
  MINT: 'Mint',
  REDEEM: 'Redeem',
  DEPOSIT: 'Deposit',
  WITHDRAW: 'Withdraw',
  RATE_UPDATE: 'RateUpdate',
} as const;

// ============================================================================
// MATHEMATICAL CONSTANTS
// ============================================================================

/**
 * Basis points denominator (10,000 = 100%)
 */
export const BASIS_POINTS_DENOMINATOR = 10000;

/**
 * Percentage denominator (100 = 100%)
 */
export const PERCENTAGE_DENOMINATOR = 100;

/**
 * Maximum safe integer for JavaScript
 */
export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

/**
 * Maximum u64 value in Move
 */
export const MAX_U64 = BigInt('18446744073709551615');

/**
 * Maximum u128 value in Move
 */
export const MAX_U128 = BigInt('340282366920938463463374607431768211455');

/**
 * Common decimal precisions
 */
export const DECIMAL_PRECISION = {
  SUI: 9,
  USDC: 6,
  USDT: 6,
  DEFAULT: 9,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Standard error messages
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network request failed',
  TIMEOUT_ERROR: 'Request timeout',
  INVALID_NETWORK: 'Invalid network configuration',
  
  // Transaction errors
  TRANSACTION_FAILED: 'Transaction execution failed',
  INSUFFICIENT_GAS: 'Insufficient gas for transaction',
  INVALID_SIGNATURE: 'Invalid transaction signature',
  
  // Vault errors
  WRONG_OWNER_CAP: 'Invalid owner capability',
  INSUFFICIENT_RESERVES: 'Insufficient vault reserves',
  INVALID_RATE: 'Invalid exchange rate',
  INVALID_METADATA: 'Invalid vault metadata',
  ARITHMETIC_OVERFLOW: 'Arithmetic operation overflow',
  DIVISION_BY_ZERO: 'Division by zero',
  
  // SDK errors
  INVALID_COIN_TYPE: 'Invalid coin type format',
  INSUFFICIENT_BALANCE: 'Insufficient coin balance',
  INVALID_PARAMETERS: 'Invalid function parameters',
  
  // Client errors
  CLIENT_NOT_INITIALIZED: 'RivaClient not properly initialized',
  KEYPAIR_REQUIRED: 'Keypair required for this operation',
  INVALID_ADDRESS: 'Invalid Sui address format',
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature flags for SDK functionality
 */
export const FEATURE_FLAGS = {
  ENABLE_CACHING: true,
  ENABLE_RETRY: true,
  ENABLE_DEBUG_LOGGING: false,
  ENABLE_METRICS: true,
  ENABLE_EVENTS: true,
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * Cache TTL values in milliseconds
 */
export const CACHE_TTL = {
  VAULT_DATA: 60000, // 1 minute
  COIN_METADATA: 300000, // 5 minutes
  NETWORK_CONFIG: 3600000, // 1 hour
} as const;

/**
 * Cache size limits
 */
export const CACHE_LIMITS = {
  MAX_VAULT_ENTRIES: 1000,
  MAX_COIN_ENTRIES: 500,
  MAX_EVENT_ENTRIES: 10000,
} as const;
