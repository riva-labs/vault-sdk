/**
 * Transaction utilities for Riva SDK Tokenized Vaults.
 *
 * Build-only helpers that append Move calls to a provided Transaction. These
 * functions never execute transactions; callers are responsible for signing
 * and submission.
 */

import { Transaction, type TransactionObjectInput, type TransactionObjectArgument } from '@mysten/sui/transactions';
import { 
  VAULT_MODULES, 
  VAULT_FUNCTIONS 
} from '../constants';

// ============================================================================
// TRANSACTION BUILDERS
// ============================================================================

/**
 * Append a create-vault call to the transaction.
 *
 * @param tx Transaction to mutate
 * @param packageId Deployed package ID that contains the vault module
 * @param params Vault configuration and treasury coin for the output asset
 * @returns void — the transaction is mutated in-place
 */
export function buildCreateVaultTx(
  tx: Transaction,
  packageId: string,
  params: {
    rate: string | bigint;
    outputCoinTreasury: TransactionObjectInput;
    rateDecimals: number;
    symbol: string;
    name: string;
    description: string;
    iconUrl?: string;
    inputCoinType: string;
    outputCoinType: string;
  }
) {
  // Convert parameters
  const symbolBytes = Array.from(new TextEncoder().encode(params.symbol));
  const nameBytes = Array.from(new TextEncoder().encode(params.name));
  const descriptionBytes = Array.from(new TextEncoder().encode(params.description));
  
  // Build Option<Url> from optional icon string
  let optionUrl: TransactionObjectArgument;
  if (params.iconUrl && params.iconUrl.length > 0) {
    const [urlVal] = tx.moveCall({
      target: "0x2::url::new_unsafe",
      arguments: [tx.pure.string(params.iconUrl)],
    });
    [optionUrl] = tx.moveCall({
      target: "0x1::option::some",
      typeArguments: ["0x2::url::Url"],
      arguments: [urlVal],
    });
  } else {
    [optionUrl] = tx.moveCall({
      target: "0x1::option::none",
      typeArguments: ["0x2::url::Url"],
      arguments: [],
    });
  }
  
  tx.moveCall({
    target: `${packageId}::${VAULT_MODULES.VAULT}::${VAULT_FUNCTIONS.CREATE_VAULT}`,
    typeArguments: [params.inputCoinType, params.outputCoinType],
    arguments: [
      tx.pure.u64(params.rate.toString()),
      (typeof params.outputCoinTreasury === 'string' ? tx.object(params.outputCoinTreasury) : params.outputCoinTreasury) as any,
      tx.pure.u8(params.rateDecimals),
      tx.pure.vector('u8', symbolBytes),
      tx.pure.vector('u8', nameBytes),
      tx.pure.vector('u8', descriptionBytes),
      optionUrl as any,
    ],
  });
}

/**
 * Append a mint call to the transaction and return the minted coin handle.
 *
 * @param tx Transaction to mutate
 * @param packageId Deployed package ID that contains the vault module
 * @param params Mint parameters including selected input coin object
 * @returns TransactionObjectArgument representing the minted output coin
 */
export function buildMintTx(
  tx: Transaction,
  packageId: string,
  params: {
    vaultId: string;
    metadataId: string;
    inputCoin: TransactionObjectInput;
    inputCoinType: string;
    outputCoinType: string;
  }
): TransactionObjectArgument {
  
  const [minted] = tx.moveCall({
    target: `${packageId}::${VAULT_MODULES.VAULT}::${VAULT_FUNCTIONS.MINT}`,
    typeArguments: [params.inputCoinType, params.outputCoinType],
    arguments: [
      tx.object(params.vaultId),
      tx.object(params.metadataId),
      (typeof params.inputCoin === 'string' ? tx.object(params.inputCoin) : params.inputCoin) as any,
    ],
  });  
  
  return minted;
}

/**
 * Append a redeem call to the transaction and return the redeemed coin handle.
 *
 * @param tx Transaction to mutate
 * @param packageId Deployed package ID that contains the vault module
 * @param params Redeem parameters including selected output coin object
 * @returns TransactionObjectArgument representing the redeemed input coin
 */
export function buildRedeemTx(
  tx: Transaction,
  packageId: string,
  params: {
    vaultId: string;
    metadataId: string;
    outputCoin: TransactionObjectInput;
    inputCoinType: string;
    outputCoinType: string;
  }
): TransactionObjectArgument {
  const [redeemed] = tx.moveCall({
    target: `${packageId}::${VAULT_MODULES.VAULT}::${VAULT_FUNCTIONS.REDEEM}`,
    typeArguments: [params.inputCoinType, params.outputCoinType],
    arguments: [
      tx.object(params.vaultId),
      tx.object(params.metadataId),
      (typeof params.outputCoin === 'string' ? tx.object(params.outputCoin) : params.outputCoin) as any,
    ],
  });

  return redeemed;
}


/**
 * Append a deposit call (owner only) to the transaction.
 *
 * @param tx Transaction to mutate
 * @param packageId Deployed package ID that contains the vault module
 * @param params Deposit parameters including owner capability and input coin
 * @returns void — the transaction is mutated in-place
 */
export function buildDepositTx(
  tx: Transaction,
  packageId: string,
  params: {
    ownerCap: TransactionObjectInput;
    vaultId: string;
    inputCoin: TransactionObjectInput;
    inputCoinType: string;
    outputCoinType: string;
  }
) {
  tx.moveCall({
    target: `${packageId}::${VAULT_MODULES.VAULT}::${VAULT_FUNCTIONS.DEPOSIT}`,
    typeArguments: [params.inputCoinType, params.outputCoinType],
    arguments: [
      (typeof params.ownerCap === 'string' ? tx.object(params.ownerCap) : params.ownerCap) as any,
      tx.object(params.vaultId),
      (typeof params.inputCoin === 'string' ? tx.object(params.inputCoin) : params.inputCoin) as any,
    ],
  });
}

/**
 * Append a withdraw call (owner only) to the transaction and return the withdrawn coin handle.
 *
 * @param tx Transaction to mutate
 * @param packageId Deployed package ID that contains the vault module
 * @param params Withdraw parameters including owner capability and amount
 * @returns TransactionObjectArgument representing the withdrawn input coin
 */
export function buildWithdrawTx(
  tx: Transaction,
  packageId: string,
  params: {
    ownerCap: TransactionObjectInput;
    vaultId: string;
    amount: string | bigint;
    inputCoinType: string;
    outputCoinType: string;
  }
): TransactionObjectArgument {
  const [withdrawn] = tx.moveCall({
    target: `${packageId}::${VAULT_MODULES.VAULT}::${VAULT_FUNCTIONS.WITHDRAW}`,
    typeArguments: [params.inputCoinType, params.outputCoinType],
    arguments: [
      (typeof params.ownerCap === 'string' ? tx.object(params.ownerCap) : params.ownerCap) as any,
      tx.object(params.vaultId),
      tx.pure.u64(params.amount.toString()),
    ],
  });
  
  return withdrawn;
}

/**
 * Append a set-rate call (owner only) to the transaction.
 *
 * @param tx Transaction to mutate
 * @param packageId Deployed package ID that contains the vault module
 * @param params New rate parameters including owner capability
 * @returns void — the transaction is mutated in-place
 */
export function buildSetRateTx(
  tx: Transaction,
  packageId: string,
  params: {
    ownerCap: TransactionObjectInput;
    vaultId: string;
    newRate: string | bigint;
    inputCoinType: string;
    outputCoinType: string;
  }
) {
  tx.moveCall({
    target: `${packageId}::${VAULT_MODULES.VAULT}::${VAULT_FUNCTIONS.SET_RATE}`,
    typeArguments: [params.inputCoinType, params.outputCoinType],
    arguments: [
      (typeof params.ownerCap === 'string' ? tx.object(params.ownerCap) : params.ownerCap) as any,
      tx.object(params.vaultId),
      tx.pure.u64(params.newRate.toString()),
    ],
  });
}





