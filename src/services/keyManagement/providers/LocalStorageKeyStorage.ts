import { KeyStorageProvider, StorageResult } from '../interfaces';

/**
 * LocalStorage implementation of key storage
 */
export class LocalStorageKeyStorage implements KeyStorageProvider {
  private readonly keyPrefix = 'encrypted_dcpe_keys';
  
  /**
   * Generate a user-specific key name
   * @param userId The user ID
   * @returns A key name specific to the user
   */
  private getKeyName(userId: string | null): string {
    return userId ? `${this.keyPrefix}_${userId}` : this.keyPrefix;
  }
  
  /**
   * Store encrypted DCPE keys in localStorage
   */
  async storeKeys(userId: string | null, encryptedKeys: string): Promise<StorageResult> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }
      
      localStorage.setItem(this.getKeyName(userId), encryptedKeys);
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
      return localStorage.getItem(this.getKeyName(userId));
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
      localStorage.removeItem(this.getKeyName(userId));
    } catch (error) {
      console.error("Error clearing keys from localStorage:", error);
    }
  }
  
  /**
   * Remove all keys that don't belong to the current user
   * This helps prevent stale keys from accumulating in localStorage
   * @param currentUserId The ID of the current user
   */
  async cleanupStaleKeys(currentUserId: string | null): Promise<void> {
    try {
      if (!currentUserId) return;
      
      // Get all keys in localStorage
      const allKeys = Object.keys(localStorage);
      
      // Find keys that start with our prefix but don't belong to the current user
      const staleKeys = allKeys.filter(key => 
        key.startsWith(this.keyPrefix) && 
        key !== this.getKeyName(currentUserId)
      );
      
      // Remove each stale key
      staleKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      if (staleKeys.length > 0) {
        console.log(`Cleaned up ${staleKeys.length} stale key(s) from localStorage`);
      }
    } catch (error) {
      console.error("Error cleaning up stale keys:", error);
    }
  }
}