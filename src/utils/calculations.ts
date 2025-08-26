/**
 * Mathematical calculation utilities for Riva Tokenized Vaults.
 *
 * Minimal public surface with overflow-safe rate conversions used by the SDK.
 */

import BigNumber from 'bignumber.js';
import { MAX_U64 } from '../constants';
import { VaultError, VaultErrorCode } from '../types';

// Configure BigNumber for precision
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-18, 18],
});

// ============================================================================
// EXCHANGE CALCULATIONS
// ============================================================================

/**
 * Calculate output amount from input amount using exchange rate
 * Implements the same logic as the Move contract with overflow protection
 */
export function calculateOutputAmount(
  rate: string | bigint,
  inputValue: string | bigint,
  rateDecimals: number
): bigint {
  const rateBN = new BigNumber(rate.toString());
  const inputBN = new BigNumber(inputValue.toString());
  const divisor = new BigNumber(10).pow(rateDecimals);
  
  // Validate inputs
  if (rateBN.lte(0)) {
    throw new VaultError(VaultErrorCode.DIVISION_BY_ZERO, 'Rate must be greater than zero');
  }
  
  if (inputBN.lt(0)) {
    throw new VaultError(VaultErrorCode.INVALID_PARAMETERS, 'Input value must be non-negative');
  }
  
  // Check for multiplication overflow
  const maxInput = new BigNumber(MAX_U64.toString()).div(rateBN);
  if (inputBN.gt(maxInput)) {
    throw new VaultError(
      VaultErrorCode.ARITHMETIC_OVERFLOW,
      `Input value too large: ${inputBN.toString()} > ${maxInput.toString()}`
    );
  }
  
  // Calculate: (rate * input_value) / 10^rate_decimals
  const result = rateBN.multipliedBy(inputBN).div(divisor);
  
  // Ensure result fits in u64
  if (result.gt(MAX_U64.toString())) {
    throw new VaultError(
      VaultErrorCode.ARITHMETIC_OVERFLOW,
      `Result too large: ${result.toString()}`
    );
  }
  
  return BigInt(result.integerValue().toString());
}

/**
 * Calculate required input amount for desired output value
 * Implements the same logic as the Move contract with overflow protection
 */
export function calculateInputAmount(
  rate: string | bigint,
  outputValue: string | bigint,
  rateDecimals: number
): bigint {
  const rateBN = new BigNumber(rate.toString());
  const outputBN = new BigNumber(outputValue.toString());
  const multiplier = new BigNumber(10).pow(rateDecimals);
  
  // Validate inputs
  if (rateBN.lte(0)) {
    throw new VaultError(VaultErrorCode.DIVISION_BY_ZERO, 'Rate must be greater than zero');
  }
  
  if (outputBN.lt(0)) {
    throw new VaultError(VaultErrorCode.INVALID_PARAMETERS, 'Output value must be non-negative');
  }
  
  // Check for multiplication overflow
  const maxOutput = new BigNumber(MAX_U64.toString()).div(multiplier);
  if (outputBN.gt(maxOutput)) {
    throw new VaultError(
      VaultErrorCode.ARITHMETIC_OVERFLOW,
      `Output value too large: ${outputBN.toString()} > ${maxOutput.toString()}`
    );
  }
  
  // Calculate: (output_value * 10^rate_decimals) / rate
  const result = outputBN.multipliedBy(multiplier).div(rateBN);
  
  // Ensure result fits in u64
  if (result.gt(MAX_U64.toString())) {
    throw new VaultError(
      VaultErrorCode.ARITHMETIC_OVERFLOW,
      `Result too large: ${result.toString()}`
    );
  }
  
  return BigInt(result.integerValue().toString());
}

/**
 * Calculate exchange rate from two amounts
 */
export function calculateExchangeRate(
  inputAmount: string | bigint,
  outputAmount: string | bigint,
  rateDecimals: number
): bigint {
  const inputBN = new BigNumber(inputAmount.toString());
  const outputBN = new BigNumber(outputAmount.toString());
  const multiplier = new BigNumber(10).pow(rateDecimals);
  
  if (inputBN.lte(0)) {
    throw new VaultError(VaultErrorCode.DIVISION_BY_ZERO, 'Input amount must be greater than zero');
  }
  
  // Calculate: (output_amount * 10^rate_decimals) / input_amount
  const rate = outputBN.multipliedBy(multiplier).div(inputBN);
  
  if (rate.gt(MAX_U64.toString())) {
    throw new VaultError(VaultErrorCode.ARITHMETIC_OVERFLOW, 'Calculated rate too large');
  }
  
  return BigInt(rate.integerValue().toString());
}

