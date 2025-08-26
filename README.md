# Riva SDK (@riva-labs/sdk)

TypeScript SDK by Riva Labs for interacting with Tokenized Vaults on Sui. The SDK is build-only: all operations append to a provided `Transaction`. Execution and key management are handled by your backend or frontend.

## Installation

```bash
npm install @riva-labs/sdk @mysten/sui
```

## Quick Start

```typescript
import { RivaClient, MAINNET_CONFIG, COIN_TYPES } from '@riva-labs/sdk';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// Initialize network client
const suiClient = new SuiClient({ url: MAINNET_CONFIG.rpcUrl });

// Initialize SDK client
const client = await RivaClient.initialize({ network: MAINNET_CONFIG });

// Prepare a transaction
const tx = new Transaction();

// Create a new vault
await client.createVault(
  {
    rate: '2000000000',            // exchange rate numerator
    rateDecimals: 9,               // rate precision
    inputCoinType: COIN_TYPES.SUI, // fully-qualified type
    outputCoinType: COIN_TYPES.USDC,
    symbol: 'SUI-USDC',
    name: 'SUI to USDC Vault',
    description: 'Fixed-rate tokenized vault',
  },
  '0x<OUTPUT_TREASURY_COIN_ID>',   // treasury coin object for output coin
  tx,
);

// Mint and send to recipient (one step)
await client.mint_and_transfer(
  {
    vaultId: '0x<VAULT_ID>',
    metadataId: '0x<METADATA_ID>',
    inputCoin: '0x<INPUT_COIN_ID>',
    inputCoinType: COIN_TYPES.SUI,
    outputCoinType: COIN_TYPES.USDC,
    recipient: '0x<RECIPIENT_ADDRESS>',
  },
  tx,
);

// Execute the transaction
await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
```

## Core Operations

All methods mutate the provided `Transaction` in place unless noted. Types follow the Sui SDK.

- Create vault
```typescript
await client.createVault(config, outputCoinTreasury, tx);
```

- Mint (returns minted coin handle)
```typescript
const { minted } = await client.mint({ vaultId, metadataId, inputCoin, inputCoinType, outputCoinType }, tx);
// Optional transfer
tx.transferObjects([minted], tx.pure.address(recipient));
```

- Mint and transfer
```typescript
await client.mint_and_transfer({ vaultId, metadataId, inputCoin, inputCoinType, outputCoinType, recipient }, tx);
```

- Redeem (returns redeemed coin handle)
```typescript
const { redeemed } = await client.redeem({ vaultId, metadataId, outputCoin, inputCoinType, outputCoinType }, tx);
// Optional transfer
tx.transferObjects([redeemed], tx.pure.address(recipient));
```

- Redeem and transfer
```typescript
await client.redeem_and_transfer({ vaultId, metadataId, outputCoin, inputCoinType, outputCoinType, recipient }, tx);
```

- Deposit reserves (owner only)
```typescript
await client.deposit({ ownerCap, vaultId, inputCoin, inputCoinType }, tx);
```

- Withdraw reserves (owner only) — returns handle
```typescript
const { withdrawn } = await client.withdraw({ ownerCap, vaultId, amount, inputCoinType }, tx);
// Optional transfer
tx.transferObjects([withdrawn], tx.pure.address(recipient));
```

- Withdraw and transfer (owner only)
```typescript
await client.withdraw_and_transfer({ ownerCap, vaultId, amount, inputCoinType, recipient }, tx);
```

- Update exchange rate (owner only)
```typescript
await client.updateRate({ ownerCap, vaultId, newRate }, tx);
```

## Queries and Utilities

- Get vault data
```typescript
const vault = await client.getVault('0x<VAULT_ID>');
```

- Get vault metadata
```typescript
const meta = await client.getVaultMetadata('0x<METADATA_ID>');
```

- Calculate exchange amounts (read-only)
```typescript
const quote = await client.calculateExchange('0x<VAULT_ID>', '1000000000', 'mint');
```

- Coin balance and listing
```typescript
const balance = await client.getCoinBalance(owner, COIN_TYPES.SUI);
const coins = await client.getCoins(owner, COIN_TYPES.USDC);
```

## Errors

The SDK throws structured errors using `VaultError` and `VaultErrorCode`.

```typescript
import { VaultError, VaultErrorCode } from '@riva-labs/sdk';

try {
  // ...
} catch (e) {
  if (e instanceof VaultError && e.code === VaultErrorCode.INVALID_PARAMETERS) {
    // handle invalid input
  }
}
```

## Notes

- Coin types must be fully qualified Move types (e.g., `0x2::sui::SUI`).
- Object IDs must be 32-byte Sui addresses (hex, 0x-prefixed).
- Network configuration must include a valid `rpcUrl` and package `packageId`.

