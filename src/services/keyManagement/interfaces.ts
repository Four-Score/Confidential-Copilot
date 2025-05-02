/**
 * Interface for providers that store encryption keys
 */
export interface KeyStorageProvider {
  /**
   * Store encrypted DCPE keys
   */
  storeKeys(userId: string, encryptedKeys: string): Promise<StorageResult>;
  
  /**
   * Retrieve encrypted DCPE keys
   */
  fetchKeys(userId: string | null): Promise<string | null>;
  
  /**
   * Clear stored keys (if applicable)
   */
  clearKeys?(userId: string | null): Promise<void>;
}

/**
 * Interface for cryptographic operations provider
 */
export interface CryptoProvider {
  /**
   * Encrypt data using the provided key
   */
  encrypt(data: string, key: CryptoKey): Promise<string>;
  
  /**
   * Decrypt data using the provided key
   */
  decrypt(encryptedData: string, key: CryptoKey): Promise<string>;
}

/**
 * Interface for the DCPE operations provider
 */
export interface DCPEProvider {
  /**
   * Initialize the provider with keys
   */
  initialize(): Promise<void>;
  
  /**
   * Generate new DCPE keys
   */
  generateKeys(): Promise<any>;
  
  /**
   * Set DCPE keys
   */
  setKeys(keys: any): void;
  
  /**
   * Encrypt text with DCPE
   */
  encryptText(text: string): string;
  
  /**
   * Decrypt text with DCPE
   */
  decryptText(encryptedText: string): string;
  
  /**
   * Encrypt metadata with DCPE
   */
  encryptMetadata(metadata: string): string;
  
  /**
   * Decrypt metadata with DCPE
   */
  decryptMetadata(encryptedMetadata: any): string;
  
  /**
   * Encrypt vector with DCPE
   */
  encryptVector(vector: number[]): number[];
  
  /**
   * Decrypt vector with DCPE
   */
  decryptVector(encryptedVector: number[]): number[];
}

export interface StorageResult {
  success: boolean;
  error?: string;
}