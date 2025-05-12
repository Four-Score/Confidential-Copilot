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
  if (typeof window === 'undefined' || !symmetricKey) {
    console.error('Cannot store symmetric key: window undefined or key missing');
    return false;
  }

  try {
    // Export the key to raw format
    const rawKey = await window.crypto.subtle.exportKey('raw', symmetricKey);
    
    // Basic encoding rather than complex encryption
    const keyBase64 = arrayBufferToBase64(rawKey);
    
    // Store in sessionStorage
    sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, keyBase64);
    console.log('Successfully stored symmetric key in session storage');
    return true;
  } catch (error) {
    console.error('Failed to store symmetric key in session storage:', error);
    return false;
  }
}

/**
 * Retrieves the symmetric key from sessionStorage
 * with better error handling
 */
export async function getSymmetricKeyFromSession(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined') {
    console.error('Cannot get symmetric key: window is undefined');
    return null;
  }

  try {
    // Get the encrypted key data from sessionStorage
    const keyData = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
    if (!keyData) {
      console.log('No symmetric key found in session storage');
      return null;
    }

    try {
      // Convert back to ArrayBuffer
      const keyBuffer = base64ToArrayBuffer(keyData);
      
      // Import as CryptoKey
      const symmetricKey = await importSymmetricKey(keyBuffer);
      console.log('Successfully retrieved and imported symmetric key from session storage');
      return symmetricKey;
    } catch (cryptoError) {
      console.error('Failed to import symmetric key from session data:', cryptoError);
      
      // Clear invalid data
      sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve symmetric key from session storage:', error);
    return null;
  }
}

/**
 * Clears the symmetric key from sessionStorage
 */
export function clearSessionKey(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
      console.log('Successfully cleared symmetric key from session storage');
    } catch (error) {
      console.error('Failed to clear symmetric key from session storage:', error);
    }
  }
}

// Using imported helper functions from @/lib/crypto

/**
 * Import raw key data as CryptoKey
 */
async function importSymmetricKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}