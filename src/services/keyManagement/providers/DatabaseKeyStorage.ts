import { KeyStorageProvider, StorageResult } from '../interfaces';
import { userDbService } from '@/services/database';

/**
 * Database implementation of key storage
 */
export class DatabaseKeyStorage implements KeyStorageProvider {
  /**
   * Store encrypted DCPE keys in database
   */
  async storeKeys(userId: string, encryptedKeys: string): Promise<StorageResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }
      
      const result = await userDbService.storeUserDcpeKeys(userId, encryptedKeys);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Database storage error: ${errorMessage}`
      };
    }
  }
  
  /**
   * Fetch encrypted DCPE keys from database
   */
  async fetchKeys(userId: string | null): Promise<string | null> {
    try {
      if (!userId) return null;
      
      const result = await userDbService.fetchUserDcpeKeys(userId);
      return result?.encrypted_dcpe_keys || null;
    } catch (error) {
      console.error("Error fetching keys from database:", error);
      return null;
    }
  }
}