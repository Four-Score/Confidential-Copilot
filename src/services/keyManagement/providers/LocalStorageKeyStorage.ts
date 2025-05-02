import { KeyStorageProvider, StorageResult } from '../interfaces';

/**
 * LocalStorage implementation of key storage
 */
export class LocalStorageKeyStorage implements KeyStorageProvider {
  private readonly keyPrefix = 'encrypted_dcpe_keys';
  
  /**
   * Store encrypted DCPE keys in localStorage
   */
  async storeKeys(userId: string | null, encryptedKeys: string): Promise<StorageResult> {
    try {
      localStorage.setItem(this.keyPrefix, encryptedKeys);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `LocalStorage error: ${errorMessage}`
      };
    }
  }
  
  /**
   * Fetch encrypted DCPE keys from localStorage
   */
  async fetchKeys(userId: string | null): Promise<string | null> {
    try {
      return localStorage.getItem(this.keyPrefix);
    } catch (error) {
      console.error("Error fetching keys from localStorage:", error);
      return null;
    }
  }
  
  /**
   * Clear encrypted DCPE keys from localStorage
   */
  async clearKeys(userId: string | null): Promise<void> {
    try {
      localStorage.removeItem(this.keyPrefix);
    } catch (error) {
      console.error("Error clearing keys from localStorage:", error);
    }
  }
}