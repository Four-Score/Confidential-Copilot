import { keyManagementService } from './KeyManagementService';
import { useAuthStore } from '@/store/authStore';
import { ensureKeyManagementInitialized } from './promptUtils';


/**
 * Initialize the key management service with the current user and symmetric key
 */
async function ensureInitialized(symmetricKey?: CryptoKey): Promise<boolean> {
  
  try {

    if (keyManagementService.isInitialized()) {
      return true;
    }
    // Get user and symmetric key from auth store if not provided
    const user = useAuthStore.getState().user;
    const key = symmetricKey || useAuthStore.getState().decryptedSymmetricKey;
    
    if (!user || !key) {
      console.error('User or symmetric key not available');
      return false;
    }
    
    if (keyManagementService.isInitialized()) {
      return true;
    }
    
    return await keyManagementService.initialize(user.id, key);
  } catch (error) {
    console.error('Error initializing key management service', error);
    return false;
  }
}

/**
 * Encrypt text using DCPE
 */
export async function encryptText(text: string, symmetricKey?: CryptoKey): Promise<string> {
  const initialized = await ensureInitialized(symmetricKey);
  if (!initialized) {
    throw new Error('Failed to initialize key management service');
  }
  return keyManagementService.encryptText(text);
}

/**
 * Decrypt text using DCPE
 */
export async function decryptText(encryptedText: string, symmetricKey?: CryptoKey): Promise<string> {
  const initialized = await ensureInitialized(symmetricKey);
  if (!initialized) {
    throw new Error('Failed to initialize key management service');
  }
  return keyManagementService.decryptText(encryptedText);
}

/**
 * Encrypt metadata using DCPE
 */
export async function encryptMetadata(metadata: string, symmetricKey?: CryptoKey): Promise<string> {
  const initialized = await ensureInitialized(symmetricKey);
  if (!initialized) {
    throw new Error('Failed to initialize key management service');
  }
  return keyManagementService.encryptMetadata(metadata);
}

/**
 * Decrypt metadata using DCPE
 */
export async function decryptMetadata(encryptedMetadata: any, symmetricKey?: CryptoKey): Promise<string> {
  const initialized = await ensureInitialized(symmetricKey);
  if (!initialized) {
    throw new Error('Failed to initialize key management service');
  }
  return keyManagementService.decryptMetadata(encryptedMetadata);
}

/**
 * Encrypt vector using DCPE
 */
export async function encryptVector(vector: number[], symmetricKey?: CryptoKey): Promise<number[]> {
  const initialized = await ensureInitialized(symmetricKey);
  if (!initialized) {
    throw new Error('Failed to initialize key management service');
  }
  return keyManagementService.encryptVector(vector);
}

/**
 * Decrypt vector using DCPE
 */
export async function decryptVector(encryptedVector: number[], symmetricKey?: CryptoKey): Promise<number[]> {
  const initialized = await ensureInitialized(symmetricKey);
  if (!initialized) {
    throw new Error('Failed to initialize key management service');
  }
  return keyManagementService.decryptVector(encryptedVector);
}