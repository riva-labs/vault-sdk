/**
 * @riva-labs/sdk - Types Module
 * 
 * Comprehensive TypeScript type definitions for the Riva SDK
 * Production-ready interfaces for $100B+ volume operations
 */

// Core types
export * from './core';

// Error types
export * from './errors';

// Re-export commonly used types from @mysten/sui for convenience
export type {
  SuiClient,
  SuiObjectRef,
  SuiObjectData,
  SuiObjectResponse,
  PaginatedObjectsResponse,
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
  SuiEvent,
  SuiEventFilter,
  PaginatedEvents,
  DevInspectResults,
} from '@mysten/sui/client';

// Define SuiAddress locally since it's not exported from @mysten/sui/client
export type SuiAddress = string;

export type {
  Transaction,
  TransactionObjectInput,
  TransactionObjectArgument,
  TransactionResult as SuiTransactionResult,
} from '@mysten/sui/transactions';

export type {
  Keypair,
  PublicKey,
} from '@mysten/sui/cryptography';

// Type utilities
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type NonEmptyArray<T> = [T, ...T[]];

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Utility type for extracting coin type from generic
export type ExtractCoinType<T> = T extends string ? T : never;
