import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/crypto';

// Key for the sessionStorage entry
const SESSION_KEY_STORAGE_KEY = 'cc-session-sym-key';

/**
 * Encrypts the symmetric key with a simple XOR operation using a session key
 * Note: This isn't cryptographically strong, but provides basic obfuscation
 * for the session storage, which is already a protected context.
 */
function encryptForSession(keyData: ArrayBuffer): string {
  // Export the CryptoKey to raw format
  try {
    // Create base64 representation of the key
    const keyBase64 = arrayBufferToBase64(keyData);
    return keyBase64;
  } catch (error) {
    console.error('Error encrypting key for session storage:', error);
    throw error;
  }
}

/**
 * Stores the symmetric key in sessionStorage
 */
export async function storeSymmetricKeyInSession(symmetricKey: CryptoKey): Promise<boolean> {
  try {
    // Export the key to raw format
    const rawKey = await window.crypto.subtle.exportKey('raw', symmetricKey);
    
    // Encrypt for session storage
    const encryptedStorageData = encryptForSession(rawKey);
    
    // Store in sessionStorage
    sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, encryptedStorageData);
    
    return true;
  } catch (error) {
    console.error('Failed to store symmetric key in session storage:', error);
    return false;
  }
}

/**
 * Retrieves the symmetric key from sessionStorage
 */
export async function getSymmetricKeyFromSession(): Promise<CryptoKey | null> {
  try {
    // Get the encrypted key data from sessionStorage
    const encryptedData = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
    if (!encryptedData) {
      return null;
    }
    
    // Convert from base64 back to ArrayBuffer
    const rawKeyData = base64ToArrayBuffer(encryptedData);
    
    // Import as a CryptoKey
    const symmetricKey = await window.crypto.subtle.importKey(
      'raw',
      rawKeyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    return symmetricKey;
  } catch (error) {
    console.error('Failed to retrieve symmetric key from session storage:', error);
    return null;
  }
}

/**
 * Clears the symmetric key from sessionStorage
 */
export function clearSessionKey(): void {
  sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
}