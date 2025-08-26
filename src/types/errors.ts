/**
 * Error types and error codes for Vault operations
 * Production-ready error handling for $100B+ volume
 */

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Comprehensive error codes for all vault operations
 */
export enum VaultErrorCode {
  // Parameter validation errors
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Balance and reserve errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_RESERVES = 'INSUFFICIENT_RESERVES',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Arithmetic errors
  ARITHMETIC_OVERFLOW = 'ARITHMETIC_OVERFLOW',
  DIVISION_BY_ZERO = 'DIVISION_BY_ZERO',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// ERROR CLASS
// ============================================================================

/**
 * Custom error class for vault operations
 * Provides structured error information with codes and details
 */
export class VaultError extends Error {
  public readonly code: VaultErrorCode;
  public readonly details?: any;
  
  constructor(
    code: VaultErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'VaultError';
    this.code = code;
    this.details = details;
    
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, VaultError.prototype);
  }
  
  /**
   * Convert error to JSON for serialization
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
    };
  }
  
  /**
   * Create error from unknown error
   */
  static fromUnknown(error: unknown, fallbackMessage = 'Unknown error occurred'): VaultError {
    if (error instanceof VaultError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new VaultError(
        VaultErrorCode.UNKNOWN_ERROR,
        error.message,
        { originalError: error }
      );
    }
    
    return new VaultError(
      VaultErrorCode.UNKNOWN_ERROR,
      fallbackMessage,
      { originalError: error }
    );
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Type guard to check if error is a VaultError
 */
export function isVaultError(error: unknown): error is VaultError {
  return error instanceof VaultError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: VaultError): string {
  switch (error.code) {
    case VaultErrorCode.INSUFFICIENT_BALANCE:
      return 'Insufficient balance to complete the transaction';
    case VaultErrorCode.INSUFFICIENT_RESERVES:
      return 'Vault has insufficient reserves for this operation';
    case VaultErrorCode.INVALID_PARAMETERS:
      return 'Invalid parameters provided';
    case VaultErrorCode.NETWORK_ERROR:
      return 'Network error occurred. Please try again';
    case VaultErrorCode.TIMEOUT:
      return 'Request timed out. Please try again';
    case VaultErrorCode.UNAUTHORIZED:
      return 'Unauthorized operation';
    case VaultErrorCode.ARITHMETIC_OVERFLOW:
      return 'Calculation overflow. Amount too large';
    case VaultErrorCode.DIVISION_BY_ZERO:
      return 'Invalid calculation. Rate cannot be zero';
    default:
      return error.message || 'An unknown error occurred';
  }
}

/**
 * Get HTTP status code for error
 */
export function getHttpStatusCode(error: VaultError): number {
  switch (error.code) {
    case VaultErrorCode.INVALID_PARAMETERS:
    case VaultErrorCode.VALIDATION_ERROR:
      return 400; // Bad Request
    case VaultErrorCode.UNAUTHORIZED:
      return 401; // Unauthorized
    case VaultErrorCode.INSUFFICIENT_BALANCE:
    case VaultErrorCode.INSUFFICIENT_RESERVES:
      return 402; // Payment Required
    case VaultErrorCode.TIMEOUT:
      return 408; // Request Timeout
    case VaultErrorCode.RATE_LIMIT_EXCEEDED:
      return 429; // Too Many Requests
    case VaultErrorCode.NETWORK_ERROR:
      return 502; // Bad Gateway
    default:
      return 500; // Internal Server Error
  }
}
