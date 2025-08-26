/**
 * Validation utilities for Riva SDK Tokenized Vaults.
 *
 * Centralized input validation for addresses, coin types, amounts, rates,
 * URLs, and composite vault configurations. These helpers throw descriptive
 * errors and are used across client methods and builders.
 */

import type { SuiAddress } from '../types';
import type { CoinType } from '../types';

// ============================================================================
// ADDRESS VALIDATION
// ============================================================================

/**
 * Validate Sui address format
 */
export function isValidSuiAddress(address: string): address is SuiAddress {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Must start with 0x
  if (!address.startsWith('0x')) {
    return false;
  }
  
  // Remove 0x prefix for validation
  const hex = address.slice(2);
  
  // Must be valid hex characters
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return false;
  }
  
  // Must be between 1 and 64 characters (after 0x)
  if (hex.length === 0 || hex.length > 64) {
    return false;
  }
  
  return true;
}

/**
 * Validate and normalize Sui address
 */
export function validateSuiAddress(address: string): SuiAddress {
  if (!isValidSuiAddress(address)) {
    throw new Error(`Invalid Sui address: ${address}`);
  }
  
  // Normalize to full 64-character format
  const hex = address.slice(2);
  const padded = hex.padStart(64, '0');
  return `0x${padded}` as SuiAddress;
}

// ============================================================================
// COIN TYPE VALIDATION
// ============================================================================

/**
 * Validate coin type format
 */
export function isValidCoinType(coinType: string): coinType is CoinType {
  if (!coinType || typeof coinType !== 'string') {
    return false;
  }
  
  // Must follow format: 0x{address}::{module}::{struct}
  const parts = coinType.split('::');
  if (parts.length !== 3) {
    return false;
  }
  
  const [address, module, struct] = parts;
  
  // Validate address part
  if (!isValidSuiAddress(address)) {
    return false;
  }
  
  // Validate module name
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(module)) {
    return false;
  }
  
  // Validate struct name
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(struct)) {
    return false;
  }
  
  return true;
}

/**
 * Validate coin type and throw if invalid
 */
export function validateCoinType(coinType: string): CoinType {
  if (!isValidCoinType(coinType)) {
    throw new Error(`Invalid coin type format: ${coinType}`);
  }
  return coinType;
}

// ============================================================================
// AMOUNT VALIDATION
// ============================================================================

/**
 * Validate amount is a positive integer
 */
export function isValidAmount(amount: string | number | bigint): boolean {
  try {
    const bigintAmount = BigInt(amount.toString());
    return bigintAmount >= 0n;
  } catch {
    return false;
  }
}

/**
 * Validate amount and throw if invalid
 */
export function validateAmount(amount: string | number | bigint): bigint {
  if (!isValidAmount(amount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  const bigintAmount = BigInt(amount.toString());
  if (bigintAmount < 0n) {
    throw new Error(`Amount must be non-negative: ${amount}`);
  }
  
  return bigintAmount;
}

/**
 * Validate amount is within reasonable bounds
 */
export function validateAmountBounds(
  amount: string | number | bigint,
  options?: {
    min?: bigint;
    max?: bigint;
  }
): bigint {
  const validAmount = validateAmount(amount);
  const { min = 0n, max = BigInt('18446744073709551615') } = options || {};
  
  if (validAmount < min) {
    throw new Error(`Amount ${validAmount} is below minimum ${min}`);
  }
  
  if (validAmount > max) {
    throw new Error(`Amount ${validAmount} exceeds maximum ${max}`);
  }
  
  return validAmount;
}

// ============================================================================
// RATE VALIDATION
// ============================================================================

/**
 * Validate exchange rate
 */
export function isValidRate(rate: string | number | bigint): boolean {
  try {
    const bigintRate = BigInt(rate.toString());
    return bigintRate > 0n;
  } catch {
    return false;
  }
}

/**
 * Validate rate and throw if invalid
 */
export function validateRate(rate: string | number | bigint): bigint {
  if (!isValidRate(rate)) {
    throw new Error(`Invalid rate: ${rate}`);
  }
  
  const bigintRate = BigInt(rate.toString());
  if (bigintRate <= 0n) {
    throw new Error(`Rate must be positive: ${rate}`);
  }
  
  return bigintRate;
}

/**
 * Validate rate decimals
 */
export function validateRateDecimals(decimals: number): number {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error(`Invalid rate decimals: ${decimals}. Must be integer between 0 and 18.`);
  }
  return decimals;
}

// ============================================================================
// OBJECT ID VALIDATION
// ============================================================================

/**
 * Validate object ID format (same as address)
 */
export function isValidObjectId(objectId: string): boolean {
  return isValidSuiAddress(objectId);
}

/**
 * Validate object ID and throw if invalid
 */
export function validateObjectId(objectId: string): string {
  if (!isValidObjectId(objectId)) {
    throw new Error(`Invalid object ID: ${objectId}`);
  }
  return validateSuiAddress(objectId);
}

// ============================================================================
// TRANSACTION DIGEST VALIDATION
// ============================================================================

/**
 * Validate transaction digest format
 */
export function isValidTxDigest(digest: string): boolean {
  if (!digest || typeof digest !== 'string') {
    return false;
  }
  
  // Transaction digests are base58 encoded, typically 43-44 characters
  return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(digest);
}

/**
 * Validate transaction digest and throw if invalid
 */
export function validateTxDigest(digest: string): string {
  if (!isValidTxDigest(digest)) {
    throw new Error(`Invalid transaction digest: ${digest}`);
  }
  return digest;
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL and throw if invalid
 */
export function validateUrl(url: string): string {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }
  return url;
}

/**
 * Validate RPC URL
 */
export function validateRpcUrl(url: string): string {
  const validUrl = validateUrl(url);
  
  // Must be HTTP or HTTPS
  if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
    throw new Error(`RPC URL must use HTTP or HTTPS: ${url}`);
  }
  
  return validUrl;
}

// ============================================================================
// STRING VALIDATION
// ============================================================================

/**
 * Validate string is not empty
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate non-empty string and throw if invalid
 */
export function validateNonEmptyString(value: unknown, fieldName = 'Value'): string {
  if (!isNonEmptyString(value)) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  options: {
    min?: number;
    max?: number;
    fieldName?: string;
  }
): string {
  const { min = 0, max = Infinity, fieldName = 'Value' } = options;
  
  if (value.length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters long`);
  }
  
  if (value.length > max) {
    throw new Error(`${fieldName} must be at most ${max} characters long`);
  }
  
  return value;
}

// ============================================================================
// NETWORK VALIDATION
// ============================================================================

/**
 * Validate network name
 */
export function isValidNetworkName(network: string): network is 'mainnet' | 'testnet' | 'devnet' | 'localnet' {
  return ['mainnet', 'testnet', 'devnet', 'localnet'].includes(network);
}

/**
 * Validate network name and throw if invalid
 */
export function validateNetworkName(network: string): 'mainnet' | 'testnet' | 'devnet' | 'localnet' {
  if (!isValidNetworkName(network)) {
    throw new Error(`Invalid network: ${network}. Must be one of: mainnet, testnet, devnet, localnet`);
  }
  return network;
}

// ============================================================================
// COMPOSITE VALIDATION
// ============================================================================

/**
 * Validate vault configuration
 */
export function validateVaultConfig(config: {
  rate: string | bigint;
  rateDecimals: number;
  symbol: string;
  name: string;
  description: string;
  inputCoinType: string;
  outputCoinType: string;
  iconUrl?: string;
}): void {
  validateRate(config.rate);
  validateRateDecimals(config.rateDecimals);
  validateStringLength(config.symbol, { min: 1, max: 32, fieldName: 'Symbol' });
  validateStringLength(config.name, { min: 1, max: 256, fieldName: 'Name' });
  validateStringLength(config.description, { min: 1, max: 1000, fieldName: 'Description' });
  validateCoinType(config.inputCoinType);
  validateCoinType(config.outputCoinType);
  
  if (config.iconUrl) {
    validateUrl(config.iconUrl);
  }
}
