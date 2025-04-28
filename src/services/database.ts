import { createClient } from '@/lib/supabase/client';
import { KeyMaterial, EncryptedKeyData } from '@/types/auth';

/**
 * Database service for user related queries
 */
export const userDbService = {
  /**
   * Fetches a user's encryption keys from the database
   * @param userId - The user's ID
   * @returns The user's encryption keys, or null if not found
   */
  async fetchUserKeys(userId: string): Promise<EncryptedKeyData | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_keys')
      .select('salt, enc_key_pw, iv_pw, enc_key_recovery, iv_recovery')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error fetching user keys:", error);
      return null;
    }

    return data as EncryptedKeyData;
  },

  /**
   * Stores a user's encryption keys in the database
   * @param keyMaterial - The key material to store
   * @returns Success status and error message if applicable
   */
  async storeUserKeys(keyMaterial: KeyMaterial): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('user_keys')
        .insert({
          user_id: keyMaterial.userId,
          salt: keyMaterial.saltB64,
          enc_key_pw: keyMaterial.encKeyPwB64,
          iv_pw: keyMaterial.ivPwB64,
          enc_key_recovery: keyMaterial.encKeyRecoveryB64,
          iv_recovery: keyMaterial.ivRecoveryB64,
        });

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          return { 
            success: false, 
            error: "Keys already exist for this user."
          };
        }
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error storing user keys:", error);
      return { 
        success: false, 
        error: `Database error: ${error.message}` 
      };
    }
  },

  /**
   * Fetches just the salt for a user
   * @param userId - The user's ID
   * @returns The user's salt or null if not found
   */
  async fetchUserSalt(userId: string): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_keys')
      .select('salt')
      .eq('user_id', userId)
      .single();

    if (error || !data?.salt) {
      console.error("Error fetching user salt:", error);
      return null;
    }

    return data.salt;
  },

    /**
   * Checks if a user exists by email via server API
   * @param email - The email to check
   * @returns Whether the user exists
   */
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/check-user-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        console.error("Error checking if user exists:", await response.text());
        return false;
      }
      
      const { userExists } = await response.json();
      return !!userExists;
    } catch (error: any) {
      console.error("Error checking if user exists:", error);
      return false;
    }
  },

  /**
   * Updates a user's password-encrypted key
   * @param userId - The user's ID
   * @param encKeyPwB64 - The new password-encrypted key
   * @param ivPwB64 - The new IV for the password-encrypted key
   * @returns Success status and error message if applicable
   */
  async updateUserPasswordKey(
    userId: string, 
    encKeyPwB64: string, 
    ivPwB64: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('user_keys')
        .update({
          enc_key_pw: encKeyPwB64,
          iv_pw: ivPwB64,
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error updating user password key:", error);
      return { 
        success: false, 
        error: `Database error: ${error.message}` 
      };
    }
  }
};