/**
 * RivaClient – Primary programmatic interface to the Tokenized Vaults.
 *
 * Provides high-level, build-only transaction constructors and read utilities
 * for creating and operating Vaults on Sui. The client validates inputs
 * aggressively and throws structured {@link VaultError} instances with
 * precise {@link VaultErrorCode} categories.
 *
 * Design principles:
 * - Keep transaction building pure and side-effect free
 * - Validate early; fail fast with clear error messages
 * - Maintain a minimal, well-documented public surface
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction, type TransactionObjectInput, type TransactionObjectArgument } from '@mysten/sui/transactions';

import type {
  VaultConfig,
  Vault,
  VaultMetadata,
  MintParams,
  RedeemParams,
  DepositParams,
  WithdrawParams,
  UpdateRateParams,
  ExchangeCalculation,
  VaultSDKConfig,
  NetworkConfig,
  CoinType,
} from '../types';

import {
  VaultError,
  VaultErrorCode,
} from '../types';


import { calculateOutputAmount, calculateInputAmount, getCoinBalance, getCoins } from '../utils';

import {
  validateSuiAddress,
  validateCoinType,
  validateAmount,
  validateRate,
  validateVaultConfig,
  validateRpcUrl,
} from '../utils/validators';

import {
  buildCreateVaultTx,
  buildMintTx,
  buildRedeemTx,
  buildDepositTx,
  buildWithdrawTx,
  buildSetRateTx,
} from '../utils/transactions';

// ============================================================================
// VAULT CLIENT CLASS
// ============================================================================

/**
 * Main client class for interacting with Tokenized Vaults.
 *
 * @remarks
 * Instances should be constructed via {@link RivaClient.initialize} to
 * ensure configuration and optional network checks are performed.
 *
 * @example
 * ```typescript
 * import { RivaClient, MAINNET_CONFIG } from '@riva-labs/sdk';
 *
 * const client = await RivaClient.initialize({
 *   network: MAINNET_CONFIG,
 *   debug: false,
 * });
 * 
 * const tx = new Transaction();
 *
 * // Build a new vault creation transaction
 * await client.createVault({
 *   rate: '200000000',
 *   rateDecimals: 9,
 *   inputCoinType: '0x2::sui::SUI',
 *   outputCoinType: '0x<COIN>',
 *   symbol: 'vCOIN',
 *   name: 'Vault Coin',
 *   description: 'Example vault',
 * }, outputCoinTreasury, tx);
 * ```
 */
export class RivaClient {
  private constructor(
    private readonly suiClient: SuiClient,
    private readonly config: VaultSDKConfig
  ) {}

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize a new {@link RivaClient} instance.
   *
   * @param config SDK configuration containing network details and flags
   * @returns A ready-to-use client
   * @throws VaultError with `INVALID_PARAMETERS` when `rpcUrl` or `packageId` are invalid
   * @throws VaultError with `NETWORK_ERROR` when the optional liveness probe fails
   */
  static async initialize(config: VaultSDKConfig): Promise<RivaClient> {
    // Validate configuration
    if (!config.network?.rpcUrl) {
      throw new VaultError(VaultErrorCode.INVALID_PARAMETERS, 'Network RPC URL is required');
    }

    if (!config.network?.packageId) {
      throw new VaultError(VaultErrorCode.INVALID_PARAMETERS, 'Package ID is required');
    }

    // Basic format validation to catch obviously invalid configs even in test mode
    try {
      validateRpcUrl(config.network.rpcUrl);
    } catch (e) {
      throw new VaultError(
        VaultErrorCode.INVALID_PARAMETERS,
        `Invalid RPC URL: ${config.network.rpcUrl}`
      );
    }

    const pkgId = config.network.packageId;
    const isValidPkg = typeof pkgId === 'string' && /^0x[a-fA-F0-9]{64}$/.test(pkgId);
    if (!isValidPkg) {
      throw new VaultError(
        VaultErrorCode.INVALID_PARAMETERS,
        `Invalid package ID: ${pkgId}`
      );
    }

    // Create Sui client
    const suiClient = new SuiClient({ url: config.network.rpcUrl });

    try {
      await suiClient.getLatestSuiSystemState();
    } catch (error) {
      throw new VaultError(
        VaultErrorCode.NETWORK_ERROR,
        `Failed to connect to Sui network: ${error instanceof Error ? error.message : String(error)}`
      );
      }

    const client = new RivaClient(suiClient, config);

    if (config.debug) {
      console.log(`RivaClient initialized for ${config.network.name}`);
      console.log(`Package ID: ${config.network.packageId}`);
      console.log(`RPC URL: ${config.network.rpcUrl}`);
    }

    return client;
  }
  
  private isObjectIdString(value: string): boolean {
    return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value);
  }

  // ============================================================================
  // VAULT CREATION
  // ============================================================================

  /**
   * Build a transaction to create a new vault.
   *
   * @typeParam InputCoin - Fully qualified type of the input coin (e.g. `0x2::sui::SUI`)
   * @typeParam OutputCoin - Fully qualified type of the output coin
   * @param config Vault configuration, validated prior to building
   * @param outputCoinTreasury Treasury coin object used to seed output supply
   * @param transaction Transaction instance to append the vault creation call to
   * @returns void — the transaction is mutated in-place
   * @throws VaultError with `INVALID_PARAMETERS` when config validation fails
   */
  async createVault<InputCoin extends CoinType, OutputCoin extends CoinType>(
    config: VaultConfig<InputCoin, OutputCoin>,
    outputCoinTreasury: TransactionObjectInput,
    transaction: Transaction,
  ) {
    validateVaultConfig(config);
    buildCreateVaultTx(transaction, this.config.network.packageId, {
      rate: config.rate,
      outputCoinTreasury,
      rateDecimals: config.rateDecimals,
      symbol: config.symbol,
      name: config.name,
      description: config.description,
      ...(config.iconUrl && { iconUrl: config.iconUrl }),
      inputCoinType: config.inputCoinType,
      outputCoinType: config.outputCoinType,
    });
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  /**
   * Build a mint transaction and return the minted coin object argument.
   *
   * @remarks This method does not transfer the minted coin. Use
   * {@link RivaClient.mint_and_transfer} to mint and transfer in one step.
   *
   * @typeParam InputCoin - Type of the input coin
   * @typeParam OutputCoin - Type of the output coin
   * @param params Mint parameters, including vault and coin types
   * @param transaction Transaction instance to append the mint call to
   * @returns The minted coin handle to be transferred
   * @throws VaultError with `INVALID_PARAMETERS` on malformed IDs or types
   */
  async mint<InputCoin extends CoinType, OutputCoin extends CoinType>(
    params: MintParams<InputCoin, OutputCoin> ,
    transaction: Transaction,
  ): Promise<{ minted: TransactionObjectArgument }> {
    validateCoinType(params.inputCoinType);
    validateCoinType(params.outputCoinType);
    let inputCoin: TransactionObjectInput;
    if (typeof params.inputCoin === 'string') {
      if (!this.isObjectIdString(params.inputCoin)) {
        throw new VaultError(
          VaultErrorCode.INVALID_PARAMETERS,
          'Build-only mint requires inputCoin as an object ID. Pre-select or split coins externally.'
        );
      }
      inputCoin = params.inputCoin;
    } else {
      inputCoin = params.inputCoin;
    }
    const minted = buildMintTx(transaction, this.config.network.packageId, {
      vaultId: params.vaultId,
      metadataId: params.metadataId,
      inputCoin,
      inputCoinType: params.inputCoinType,
      outputCoinType: params.outputCoinType,
    });
    return { minted };
  }

  /**
   * Build a mint transaction and transfer the minted coin to a recipient.
   *
   * @typeParam InputCoin - Type of the input coin
   * @typeParam OutputCoin - Type of the output coin
   * @param params Mint parameters combined with the `recipient` Sui address
   * @param transaction Transaction instance to append the mint + transfer calls to
   * @returns void — the transaction is mutated in-place
   * @throws VaultError with `INVALID_PARAMETERS` on malformed IDs or types
   */
  async mint_and_transfer<InputCoin extends CoinType, OutputCoin extends CoinType>(
    params: MintParams<InputCoin, OutputCoin> & { recipient: string },
    transaction: Transaction,
  ) {
    validateCoinType(params.inputCoinType);
    validateCoinType(params.outputCoinType);
    let inputCoin: TransactionObjectInput;
    if (typeof params.inputCoin === 'string') {
      if (!this.isObjectIdString(params.inputCoin)) {
        throw new VaultError(
          VaultErrorCode.INVALID_PARAMETERS,
          'Build-only mint requires inputCoin as an object ID. Pre-select or split coins externally.'
        );
      }
      inputCoin = params.inputCoin;
    } else {
      inputCoin = params.inputCoin;
    }
    const minted = buildMintTx(transaction, this.config.network.packageId, {
      vaultId: params.vaultId,
      metadataId: params.metadataId,
      inputCoin,
      inputCoinType: params.inputCoinType,
      outputCoinType: params.outputCoinType,
    });

    transaction.transferObjects([minted as any], transaction.pure.address(params.recipient));
  }

  /**
   * Build a redeem transaction and return the redeemed coin object argument.
   *
   * @remarks This method does not transfer the redeemed coin. Use
   * {@link RivaClient.redeem_and_transfer} to redeem and transfer in one step.
   *
   * @typeParam InputCoin - Type of the input coin
   * @typeParam OutputCoin - Type of the output coin
   * @param params Redeem parameters, including vault and coin types
   * @param transaction Transaction instance to append the redeem call to
   * @returns The redeemed coin handle to be transferred
   * @throws VaultError with `INVALID_PARAMETERS` on malformed IDs or types
   */
  // Raw redeem: returns a Transaction and the returned object handle; caller must transfer
  async redeem<InputCoin extends CoinType, OutputCoin extends CoinType>(
    params: RedeemParams<InputCoin, OutputCoin>,
    transaction: Transaction,
  ): Promise<{ redeemed: TransactionObjectArgument }> {
    validateCoinType(params.inputCoinType);
    validateCoinType(params.outputCoinType);
    const redeemed = buildRedeemTx(transaction, this.config.network.packageId, {
      vaultId: params.vaultId,
      metadataId: params.metadataId,
      outputCoin: typeof params.outputCoin === 'string' ? params.outputCoin : params.outputCoin,
      inputCoinType: params.inputCoinType,
      outputCoinType: params.outputCoinType,
    });
    return { redeemed };
  }

  /**
   * Build a redeem transaction and transfer the redeemed coin to a recipient.
   *
   * @typeParam InputCoin - Type of the input coin
   * @typeParam OutputCoin - Type of the output coin
   * @param params Redeem parameters combined with the `recipient` Sui address
   * @param transaction Transaction instance to append the redeem + transfer calls to
   * @returns void — the transaction is mutated in-place
   * @throws VaultError with `INVALID_PARAMETERS` on malformed IDs or types
   */
  // Auto-transfer redeem
  async redeem_and_transfer<InputCoin extends CoinType, OutputCoin extends CoinType>(
    params: RedeemParams<InputCoin, OutputCoin> & { recipient: string },
    transaction: Transaction,
  ) {
    validateCoinType(params.inputCoinType);
    validateCoinType(params.outputCoinType);
    let outputCoin: TransactionObjectInput;
    if (typeof params.outputCoin === 'string') {
      if (!this.isObjectIdString(params.outputCoin)) {
        throw new VaultError(
          VaultErrorCode.INVALID_PARAMETERS,
          'Build-only redeem requires outputCoin as an object ID. Pre-select or split coins externally.'
        );
      }
      outputCoin = params.outputCoin;
    } else {
      outputCoin = params.outputCoin;
    }
    const redeemed = buildRedeemTx(transaction, this.config.network.packageId, {
      vaultId: params.vaultId,
      metadataId: params.metadataId,
      outputCoin,
      inputCoinType: params.inputCoinType,
      outputCoinType: params.outputCoinType,
    });

    transaction.transferObjects([redeemed as any], transaction.pure.address(params.recipient));
  }

  

  /**
   * Retrieve the balance of a specific coin type for an owner.
   *
   * @param owner Sui address of the owner
   * @param coinType Fully qualified coin type
   * @returns Balance in the coin's base units as a string
   */
  async getCoinBalance(owner: string, coinType: string): Promise<string> {
    return await getCoinBalance(this.suiClient, owner, coinType);
  }

  /**
   * List coins of a specific type owned by an address.
   *
   * @param owner Sui address of the owner
   * @param coinType Fully qualified coin type
   * @param cursor Optional pagination cursor
   * @param limit Page size (default 50)
   */
  async getCoins(
    owner: string,
    coinType: string,
    cursor?: string,
    limit = 50
  ) {
    return await getCoins(this.suiClient, owner, coinType, cursor, limit);
  }

  // ============================================================================
  // OWNER OPERATIONS
  // ============================================================================

  /**
   * Build a transaction to deposit input coins into vault reserves (owner only).
   *
   * @typeParam InputCoin - Type of the input coin
   * @param params Deposit parameters including `ownerCap` and coin object
   * @param transaction Transaction instance to append the deposit call to
   * @returns void — the transaction is mutated in-place
   * @throws VaultError with `INVALID_PARAMETERS` on malformed IDs or types
   */
  async deposit<InputCoin extends CoinType>(
    params: DepositParams<InputCoin>,
    transaction: Transaction,
  ) {
    validateCoinType(params.inputCoinType);
    let inputCoin: TransactionObjectInput;
    if (typeof params.inputCoin === 'string') {
      if (!this.isObjectIdString(params.inputCoin)) {
        throw new VaultError(
          VaultErrorCode.INVALID_PARAMETERS,
          'Build-only deposit requires inputCoin as an object ID. Pre-select or split coins externally.'
        );
      }
      inputCoin = params.inputCoin;
    } else {
      inputCoin = params.inputCoin;
    }
    buildDepositTx(transaction, this.config.network.packageId, {
      ownerCap: params.ownerCap,
      vaultId: params.vaultId,
      inputCoin,
      inputCoinType: params.inputCoinType,
      outputCoinType: await this.inferOutputTypeFromVault(params.vaultId),
    });
  }

  /**
   * Build a transaction to withdraw input coins from vault reserves (owner only).
   *
   * @remarks The withdrawn coin is returned as a transaction object argument.
   * Use {@link RivaClient.withdraw_and_transfer} to transfer within the same transaction.
   *
   * @typeParam InputCoin - Type of the input coin
   * @param params Withdraw parameters including `ownerCap` and `amount`
   * @param transaction Transaction instance to append the withdraw call to
   * @returns The withdrawn coin handle to be transferred
   * @throws VaultError with `INVALID_PARAMETERS` on malformed IDs or amounts
   */
  // Raw withdraw: returns a Transaction and the returned object handle; caller must transfer
  async withdraw<InputCoin extends CoinType>(
    params: WithdrawParams<InputCoin>,
    transaction: Transaction,
  ): Promise<{ withdrawn: TransactionObjectArgument }> {
    const amount = validateAmount(params.amount);
    validateCoinType(params.inputCoinType);
    const withdrawn = buildWithdrawTx(transaction, this.config.network.packageId, {
      ownerCap: params.ownerCap,
      vaultId: params.vaultId,
      amount,
      inputCoinType: params.inputCoinType,
      outputCoinType: await this.inferOutputTypeFromVault(params.vaultId),
    });
    return { withdrawn };
  }

  /**
   * Build a withdraw transaction and transfer the withdrawn coin to a recipient.
   *
   * @typeParam InputCoin - Type of the input coin
   * @param params Withdraw parameters combined with the `recipient` Sui address
   * @param transaction Transaction instance to append the withdraw + transfer calls to
   * @returns void — the transaction is mutated in-place
   * @throws VaultError with `INVALID_PARAMETERS` on malformed IDs or amounts
   */
  // Auto-transfer withdraw
  async withdraw_and_transfer<InputCoin extends CoinType>(
    params: WithdrawParams<InputCoin> & { recipient: string },
    transaction: Transaction,
  ) {
    const amount = validateAmount(params.amount);
    validateCoinType(params.inputCoinType);
    const withdrawn = buildWithdrawTx(transaction, this.config.network.packageId, {
      ownerCap: params.ownerCap,
      vaultId: params.vaultId,
      amount,
      inputCoinType: params.inputCoinType,
      outputCoinType: await this.inferOutputTypeFromVault(params.vaultId),
    });
    transaction.transferObjects([withdrawn as any], transaction.pure.address(params.recipient));
  }

  /**
   * Build a transaction to update the vault's exchange rate (owner only).
   *
   * @param params Update parameters including `ownerCap`, `vaultId`, and `newRate`
   * @param transaction Transaction instance to append the rate update call to
   * @returns void — the transaction is mutated in-place
   * @throws VaultError with `INVALID_PARAMETERS` when `newRate` is invalid
   */
  async updateRate(
    params: UpdateRateParams,
    transaction: Transaction,
  ) {
    const newRate = validateRate(params.newRate);
    buildSetRateTx(transaction, this.config.network.packageId, {
      ownerCap: params.ownerCap,
      vaultId: params.vaultId,
      newRate,
      inputCoinType: await this.inferInputTypeFromVault(params.vaultId),
      outputCoinType: await this.inferOutputTypeFromVault(params.vaultId),
    });
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Fetch vault on-chain data for the given object ID.
   *
   * @typeParam InputCoin - Type of the input coin
   * @typeParam OutputCoin - Type of the output coin
   * @param vaultId Vault object ID
   * @returns Parsed vault data, including id, rate, and reserve value
   * @throws VaultError with `INVALID_PARAMETERS` when the vault is not found
   * @throws VaultError with `NETWORK_ERROR` on RPC failures
   */
  async getVault<InputCoin extends CoinType, OutputCoin extends CoinType>(
    vaultId: string
  ): Promise<Vault<InputCoin, OutputCoin>> {
    const objectId = validateSuiAddress(vaultId);
    try {
      const response = await this.suiClient.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
        },
      });
          if (response.data && response.data.content && (response.data.content as any).dataType === 'moveObject') {
            const content = response.data.content as any;
      const fields = content.fields as any;
            const reserveField = (fields as any).reserve;
            const reserveValue =
              typeof reserveField === 'string' ? reserveField
              : typeof reserveField === 'number' ? String(reserveField)
              : (reserveField?.fields?.value)
              || (reserveField?.fields?.balance)
              || (reserveField && typeof reserveField === 'object' && 'value' in reserveField ? (reserveField as any).value : '0');
      return {
        id: vaultId,
        rate: fields.rate,
        rateDecimals: fields.rate_decimals,
              reserveValue: reserveValue || '0',
              inputCoinType: 'unknown' as InputCoin,
              outputCoinType: 'unknown' as OutputCoin,
        objectRef: {
          objectId: response.data.objectId,
          version: response.data.version,
          digest: response.data.digest,
        },
      };
          }
      throw new VaultError(VaultErrorCode.INVALID_PARAMETERS, `Vault not found: ${vaultId}`);
    } catch (error) {
      if (error instanceof VaultError) {
        throw error;
      }
      throw new VaultError(
        VaultErrorCode.NETWORK_ERROR,
        `Failed to fetch vault: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fetch vault metadata for the given metadata object ID.
   *
   * @typeParam InputCoin - Type of the input coin
   * @typeParam OutputCoin - Type of the output coin
   * @param metadataId Metadata object ID
   * @returns Vault metadata including name, symbol, and optional icon URL
   * @throws VaultError with `INVALID_PARAMETERS` when metadata is not found
   */
  async getVaultMetadata<InputCoin extends CoinType, OutputCoin extends CoinType>(
    metadataId: string
  ): Promise<VaultMetadata<InputCoin, OutputCoin>> {
    const objectId = validateSuiAddress(metadataId);
    
    const response = await this.suiClient.getObject({
      id: objectId,
      options: { showContent: true },
    });

    if (!response.data?.content || response.data.content.dataType !== 'moveObject') {
      throw new VaultError(VaultErrorCode.INVALID_PARAMETERS, `Vault metadata not found: ${metadataId}`);
    }

    const fields = response.data.content.fields as any;
    
    return {
      id: metadataId,
      name: fields.name,
      symbol: fields.symbol,
      description: fields.description,
      iconUrl: fields.icon_url?.fields?.url,
      inputCoinType: 'unknown' as InputCoin,
      outputCoinType: 'unknown' as OutputCoin,
      objectRef: {
        objectId: response.data.objectId,
        version: response.data.version,
        digest: response.data.digest,
      },
    };
  }

  /**
   * Calculate input/output amounts based on the vault's current rate.
   *
   * @param vaultId Vault object ID
   * @param inputAmount Input amount in base units
   * @param direction Whether to compute a mint or redeem quote (default `mint`)
   * @returns Deterministic calculation including input, output, rate and decimals
   */
  async calculateExchange<InputCoin extends CoinType, OutputCoin extends CoinType>(
    vaultId: string,
    inputAmount: string | bigint,
    direction: 'mint' | 'redeem' = 'mint'
  ): Promise<ExchangeCalculation> {
    const vault = await this.getVault<InputCoin, OutputCoin>(vaultId);
    const amount = validateAmount(inputAmount);

    let outputAmount: bigint;
    
    if (direction === 'mint') {
      outputAmount = calculateOutputAmount(vault.rate, amount, vault.rateDecimals);
    } else {
      outputAmount = calculateInputAmount(vault.rate, amount, vault.rateDecimals);
    }

    // Calculate price impact (simplified)
    const priceImpact = '0'; // Would calculate based on reserves

    return {
      inputAmount: amount.toString(),
      outputAmount: outputAmount.toString(),
      rate: vault.rate,
      rateDecimals: vault.rateDecimals,
      priceImpact,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Infer the input coin type argument from a vault object's type string.
   *
   * @param vaultId Vault object ID
   * @returns Fully qualified input coin type
   */
  private async inferInputTypeFromVault(vaultId: string): Promise<string> {
    const resp = await this.suiClient.getObject({ id: vaultId, options: { showType: true } });
    const fullType = (resp.data as any)?.type as string;
    // Expecting: <package>::vault::Vault<INPUT, OUTPUT>
    const typeArgs = fullType?.match(/<(.+),\s*(.+)>/);
    if (!typeArgs) return '0x2::sui::SUI';
    return typeArgs[1];
  }

  /**
   * Infer the output coin type argument from a vault object's type string.
   *
   * @param vaultId Vault object ID
   * @returns Fully qualified output coin type
   */
  private async inferOutputTypeFromVault(vaultId: string): Promise<string> {
    const resp = await this.suiClient.getObject({ id: vaultId, options: { showType: true } });
    const fullType = (resp.data as any)?.type as string;
    const typeArgs = fullType?.match(/<(.+),\s*(.+)>/);
    if (!typeArgs) return '0x2::sui::SUI';
    return typeArgs[2];
  }

  /**
   * Derive both input and output coin types from a vault object.
   *
   * @param vaultId Vault object ID
   * @returns Pair of `inputCoinType` and `outputCoinType`
   */
  async getVaultTypes(vaultId: string): Promise<{ inputCoinType: string; outputCoinType: string }> {
    const resp = await this.suiClient.getObject({ id: validateSuiAddress(vaultId), options: { showType: true } });
    const fullType = (resp.data as any)?.type as string;
    const match = fullType?.match(/<(.+),\s*(.+)>/);
    return {
      inputCoinType: match?.[1] || '0x2::sui::SUI',
      outputCoinType: match?.[2],
    };
  }

  /**
   * Derive the metadata object ID associated with a vault.
   *
   * Uses dynamic fields stored under the vault object to locate the metadata.
   *
   * @param vaultId Vault object ID
   * @returns Metadata object ID when found; otherwise `undefined`
   */
  async getVaultMetadataId(vaultId: string): Promise<string | undefined> {
    const parentId = validateSuiAddress(vaultId);
    try {
      const fields = await this.suiClient.getDynamicFields({ parentId, limit: 50 });
      for (const entry of fields.data) {
        const possibleId = (entry as any)?.name?.value;
        if (typeof possibleId === 'string' && /^0x[0-9a-fA-F]{64}$/.test(possibleId)) {
          return possibleId;
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  // Coin selection helpers removed in build-only mode

  /**
   * Retrieve the `OwnerCap` object ID for a given vault and owner.
   *
   * @param vaultId Vault object ID
   * @param ownerAddress Owner Sui address
   * @returns OwnerCap object ID when found; otherwise `undefined`
   */
  async getOwnerCap(vaultId: string, ownerAddress: string): Promise<string | undefined> {
    const normalizedVaultId = validateSuiAddress(vaultId);
    const owner = validateSuiAddress(ownerAddress);
    const resp = await this.suiClient.getOwnedObjects({ owner, options: { showType: true, showContent: true } });
    for (const entry of resp.data) {
      const data: any = entry.data;
      const typeStr = data?.type as string | undefined;
      if (!typeStr || !typeStr.endsWith('::vault::OwnerCap')) continue;
      const capVaultId = data?.content?.fields?.vault_id as string | undefined;
      if (capVaultId && validateSuiAddress(capVaultId) === normalizedVaultId) {
        return data.objectId as string;
      }
    }
    return undefined;
  }

  /**
   * Return the network configuration used by this client.
   */
  getNetworkConfig(): NetworkConfig {
    return this.config.network;
  }

  /**
   * Return the underlying Sui JSON-RPC client instance.
   */
  getSuiClient(): SuiClient {
    return this.suiClient;
  }

  /**
   * Indicate whether debug mode is enabled.
   */
  isDebugEnabled(): boolean {
    return this.config.debug || false;
  }
}
