/**
 * Lightweight coin utilities kept in SDK (deployment removed)
 */

import type { SuiClient } from '@mysten/sui/client';
import { VaultError, VaultErrorCode } from '../types';

/**
 * Get user's coin balance
 */
export async function getCoinBalance(
  suiClient: SuiClient,
  owner: string,
  coinType: string
): Promise<string> {
  try {
    const balance = await suiClient.getBalance({ owner, coinType });
    return balance.totalBalance;
  } catch {
    return '0';
  }
}

/**
 * Get all coins of a specific type owned by an address
 */
export async function getCoins(
  suiClient: SuiClient,
  owner: string,
  coinType: string,
  cursor?: string,
  limit = 50
) {
  try {
    return await suiClient.getCoins({ owner, coinType, cursor, limit });
  } catch (error) {
    throw new VaultError(
      VaultErrorCode.NETWORK_ERROR,
      `Failed to get coins: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { originalError: error }
    );
  }
}



