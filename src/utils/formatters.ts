/**
 * Formatting utilities for display and parsing
 * Production-ready formatters for user interfaces
 */

import BigNumber from 'bignumber.js';
import { getCoinDecimals, getCoinSymbol } from '../constants';
import type { CoinType } from '../types';

// ============================================================================
// AMOUNT FORMATTING
// ============================================================================

/**
 * Format coin amount for display with proper decimals
 */
export function formatCoinAmount(
  amount: string | bigint | number,
  coinType?: string,
  options?: {
    decimals?: number;
    showSymbol?: boolean;
    compact?: boolean;
    precision?: number;
  }
): string {
  const {
    decimals = coinType ? getCoinDecimals(coinType) : 9,
    showSymbol = false,
    compact = false,
    precision = 6,
  } = options || {};

  const amountBN = new BigNumber(amount.toString());
  const divisor = new BigNumber(10).pow(decimals);
  const formatted = amountBN.div(divisor);

  let result: string;

  if (compact) {
    result = formatCompactNumber(formatted.toNumber());
  } else {
    result = formatted.decimalPlaces(precision, BigNumber.ROUND_DOWN).toFormat();
  }

  if (showSymbol && coinType) {
    const symbol = getCoinSymbol(coinType);
    result += ` ${symbol}`;
  }

  return result;
}

/**
 * Parse human-readable coin amount to raw amount
 */
export function parseCoinAmount(
  amount: string,
  coinType?: string,
  decimals?: number
): bigint {
  const actualDecimals = decimals || (coinType ? getCoinDecimals(coinType) : 9);
  
  // Remove any non-numeric characters except decimal point
  const cleanAmount = amount.replace(/[^\d.]/g, '');
  
  const amountBN = new BigNumber(cleanAmount);
  if (amountBN.isNaN()) {
    throw new Error(`Invalid amount format: ${amount}`);
  }
  
  const multiplier = new BigNumber(10).pow(actualDecimals);
  const result = amountBN.multipliedBy(multiplier);
  
  return BigInt(result.integerValue().toString());
}

/**
 * Format number in compact notation (1.2K, 3.4M, etc.)
 */
export function formatCompactNumber(num: number): string {
  const absNum = Math.abs(num);
  
  if (absNum >= 1e12) {
    return (num / 1e12).toFixed(1) + 'T';
  }
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (absNum >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  
  return num.toFixed(2);
}

/**
 * Format percentage with basis points
 */
export function formatPercentage(
  bps: number,
  options?: {
    precision?: number;
    showSign?: boolean;
  }
): string {
  const { precision = 2, showSign = false } = options || {};
  
  const percentage = bps / 100;
  const formatted = percentage.toFixed(precision);
  
  const sign = showSign && percentage > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}


// ============================================================================
// ADDRESS FORMATTING
// ============================================================================

/**
 * Format Sui address for display
 */
export function formatAddress(
  address: string,
  options?: {
    short?: boolean;
    prefix?: boolean;
  }
): string {
  const { short = true, prefix = true } = options || {};
  
  if (!address) return '';
  
  // Ensure address starts with 0x
  const fullAddress = address.startsWith('0x') ? address : `0x${address}`;
  
  if (!short) {
    return fullAddress;
  }
  
  // Show first 6 and last 4 characters
  const start = prefix ? fullAddress.slice(0, 6) : fullAddress.slice(2, 6);
  const end = fullAddress.slice(-4);
  
  return `${start}...${end}`;
}

/**
 * Format object ID for display
 */
export function formatObjectId(objectId: string, short = true): string {
  return formatAddress(objectId, { short });
}

/**
 * Format transaction digest for display
 */
export function formatTxDigest(digest: string, short = true): string {
  if (!short) return digest;
  
  return `${digest.slice(0, 8)}...${digest.slice(-8)}`;
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format timestamp to human-readable date
 */
export function formatDate(
  timestamp: number | Date,
  options?: {
    includeTime?: boolean;
    relative?: boolean;
  }
): string {
  const { includeTime = true, relative = false } = options || {};
  
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  
  if (relative) {
    return formatRelativeTime(date);
  }
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return formatDate(date, { includeTime: false });
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and format coin type
 */
export function formatCoinType(coinType: string): CoinType {
  // Remove any whitespace
  const cleaned = coinType.trim();
  
  // Ensure it starts with 0x
  if (!cleaned.startsWith('0x')) {
    throw new Error(`Invalid coin type format: ${coinType}`);
  }
  
  // Validate format: 0x{address}::{module}::{struct}
  const parts = cleaned.split('::');
  if (parts.length !== 3) {
    throw new Error(`Invalid coin type format: ${coinType}`);
  }
  
  const [address, module, struct] = parts;
  
  // Validate address format
  if (!/^0x[a-fA-F0-9]+$/.test(address)) {
    throw new Error(`Invalid address in coin type: ${address}`);
  }
  
  // Validate module and struct names
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(module)) {
    throw new Error(`Invalid module name in coin type: ${module}`);
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(struct)) {
    throw new Error(`Invalid struct name in coin type: ${struct}`);
  }
  
  return cleaned as CoinType;
}

/**
 * Format gas amount for display
 */
export function formatGas(gasUsed: string | number): string {
  const gas = typeof gasUsed === 'string' ? parseFloat(gasUsed) : gasUsed;
  const sui = gas / 1e9; // Convert MIST to SUI
  
  if (sui < 0.001) {
    return `${gas} MIST`;
  }
  
  return `${sui.toFixed(6)} SUI`;
}

/**
 * Format APY percentage
 */
export function formatAPY(apy: number): string {
  if (apy === 0) return '0%';
  if (apy < 0.01) return '<0.01%';
  if (apy > 1000) return '>1000%';
  
  return `${apy.toFixed(2)}%`;
}

/**
 * Format large numbers with proper suffixes
 */
export function formatLargeNumber(
  num: number | string,
  options?: {
    precision?: number;
    notation?: 'compact' | 'standard';
  }
): string {
  const { precision = 2, notation = 'compact' } = options || {};
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (notation === 'standard') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
    }).format(numValue);
  }
  
  return formatCompactNumber(numValue);
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Clean up common error messages
    let message = error.message;
    
    // Remove technical details that users don't need
    message = message.replace(/^Error: /, '');
    message = message.replace(/^\d+: /, ''); // Remove error codes
    
    // Make common errors more user-friendly
    if (message.includes('insufficient')) {
      return 'Insufficient balance for this transaction';
    }
    
    if (message.includes('slippage')) {
      return 'Price changed too much. Try adjusting slippage tolerance.';
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'Network error. Please try again.';
    }
    
    return message;
  }
  
  return 'An unexpected error occurred';
}
