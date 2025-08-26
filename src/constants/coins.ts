/**
 * Coin type definitions and utilities
 * Comprehensive coin type registry for Sui ecosystem
 */

import type { CoinType } from '../types';

// ============================================================================
// CORE SUI COINS
// ============================================================================

/**
 * Native SUI coin type
 */
export const SUI_COIN_TYPE: CoinType = '0x2::sui::SUI';

/**
 * Major stablecoins on Sui
 */
export const STABLECOIN_TYPES = {
  USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  USDT: '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',
} as const;

/**
 * Popular tokens on Sui (examples - update with actual addresses)
 */
export const POPULAR_COIN_TYPES = {
  // Stablecoins
  ...STABLECOIN_TYPES,
  
  // DeFi tokens (examples - replace with actual addresses)
  DEEP: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
  WBTC: '0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC',
  WAL: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL'
} as const;

// ============================================================================
// COIN METADATA
// ============================================================================

/**
 * Coin metadata for display and calculations
 */
export interface CoinMetadata {
  /** Coin type identifier */
  type: CoinType;
  /** Display symbol (e.g., "SUI", "USDC") */
  symbol: string;
  /** Full name */
  name: string;
  /** Number of decimal places */
  decimals: number;
  /** Optional icon URL */
  iconUrl?: string;
  /** Whether this is a stablecoin */
  isStablecoin?: boolean;
  /** Coingecko ID for price data */
  coingeckoId?: string;
}

/**
 * Registry of coin metadata
 */
export const COIN_REGISTRY: Record<string, CoinMetadata> = {
  [SUI_COIN_TYPE]: {
    type: SUI_COIN_TYPE,
    symbol: 'SUI',
    name: 'Sui',
    decimals: 9,
    iconUrl: 'https://sui.io/img/sui-logo.svg',
    coingeckoId: 'sui',
  },
  [STABLECOIN_TYPES.USDC]: {
    type: STABLECOIN_TYPES.USDC,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    isStablecoin: true,
    coingeckoId: 'usd-coin',
  },
  [STABLECOIN_TYPES.USDT]: {
    type: STABLECOIN_TYPES.USDT,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    isStablecoin: true,
    coingeckoId: 'tether',
  },
};

// ============================================================================
// COIN UTILITIES
// ============================================================================

/**
 * Get coin metadata by type
 */
export function getCoinMetadata(coinType: string): CoinMetadata | undefined {
  return COIN_REGISTRY[coinType];
}

/**
 * Get coin symbol by type
 */
export function getCoinSymbol(coinType: string): string {
  const metadata = getCoinMetadata(coinType);
  return metadata?.symbol || coinType.split('::').pop() || 'UNKNOWN';
}

/**
 * Get coin decimals by type
 */
export function getCoinDecimals(coinType: string): number {
  const metadata = getCoinMetadata(coinType);
  return metadata?.decimals || 9; // Default to 9 decimals like SUI
}

/**
 * Check if coin is a stablecoin
 */
export function isStablecoin(coinType: string): boolean {
  const metadata = getCoinMetadata(coinType);
  return metadata?.isStablecoin || false;
}

/**
 * Format coin amount with proper decimals
 */
export function formatCoinAmount(amount: string | bigint, coinType: string): string {
  const decimals = getCoinDecimals(coinType);
  const amountNum = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  
  const whole = amountNum / divisor;
  const fraction = amountNum % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
}

/**
 * Parse coin amount from human-readable format
 */
export function parseCoinAmount(amount: string, coinType: string): bigint {
  const decimals = getCoinDecimals(coinType);
  const [whole = '0', fraction = ''] = amount.split('.');
  
  const wholeBig = BigInt(whole);
  const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals);
  const fractionBig = BigInt(fractionPadded);
  
  return wholeBig * BigInt(10 ** decimals) + fractionBig;
}

/**
 * Validate coin type format
 */
export function isValidCoinType(coinType: string): coinType is CoinType {
  const regex = /^0x[a-fA-F0-9]{1,64}::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
  return regex.test(coinType);
}

/**
 * Extract package ID from coin type
 */
export function getPackageIdFromCoinType(coinType: string): string {
  return coinType.split('::')[0];
}

/**
 * Extract module name from coin type
 */
export function getModuleFromCoinType(coinType: string): string {
  return coinType.split('::')[1];
}

/**
 * Extract struct name from coin type
 */
export function getStructFromCoinType(coinType: string): string {
  return coinType.split('::')[2];
}

/**
 * Create coin type from components
 */
export function createCoinType(packageId: string, module: string, struct: string): CoinType {
  if (!packageId.startsWith('0x')) {
    packageId = `0x${packageId}`;
  }
  return `${packageId}::${module}::${struct}` as CoinType;
}

/**
 * Common coin type constants for easy access
 */
export const COIN_TYPES = {
  SUI: SUI_COIN_TYPE,
  ...STABLECOIN_TYPES,
  ...POPULAR_COIN_TYPES,
} as const;

/**
 * Get all registered coin types
 */
export function getAllCoinTypes(): CoinType[] {
  return Object.keys(COIN_REGISTRY) as CoinType[];
}

/**
 * Register new coin metadata
 */
export function registerCoin(metadata: CoinMetadata): void {
  COIN_REGISTRY[metadata.type] = metadata;
}

/**
 * Batch register multiple coins
 */
export function registerCoins(coins: CoinMetadata[]): void {
  for (const coin of coins) {
    registerCoin(coin);
  }
}
