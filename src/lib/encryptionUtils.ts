const DCPE = require('dcpe-js');
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { arrayBufferToBase64, base64ToArrayBuffer } from './crypto';

/**
 * Encryption service for secure document storage and retrieval.
 * Uses DCPE-js for searchable encryption and integrates with the application's
 * authentication system for key security.
 */
export class EncryptionService {
  private dcpe: typeof DCPE | null = null;
  private initialized = false;
  private symmetricKey: CryptoKey | null = null;
  private dcpeKeysString: string | null = null;

  /**
   * Initializes the encryption service with the user's symmetric key.
   * @param symmetricKey The user's symmetric key from auth system
   * @returns Promise resolving to true if initialization was successful
   */
  async initialize(symmetricKey: CryptoKey): Promise<boolean> {
    try {
      if (!symmetricKey) {
        console.error("No symmetric key provided for encryption initialization");
        return false;
      }

      this.symmetricKey = symmetricKey;
      this.dcpe = new DCPE();
      
      // Check if we have stored DCPE keys
      const storedKeys = localStorage.getItem('encrypted_dcpe_keys');
      
      if (storedKeys) {
        // Decrypt and use stored keys
        try {
          const decryptedKeys = await this.decryptWithSymmetricKey(storedKeys);
          const parsedKeys = JSON.parse(decryptedKeys);
          this.dcpe.setKeys(parsedKeys);
          this.dcpeKeysString = decryptedKeys;
          this.initialized = true;
          return true;
        } catch (error) {
          console.error("Failed to load stored DCPE keys, generating new ones:", error);
          // Fall through to key generation
        }
      }
      
      // Generate new DCPE keys
      const keys = await this.dcpe.generateKeys();
      this.dcpe.setKeys(keys);
      
      // Store the keys securely
      this.dcpeKeysString = JSON.stringify(keys);
      const encryptedKeys = await this.encryptWithSymmetricKey(this.dcpeKeysString);
      localStorage.setItem('encrypted_dcpe_keys', encryptedKeys);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize encryption service:", error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Encrypts data using the user's symmetric key
   * @param data String to encrypt
   * @returns Promise resolving to encrypted string (Base64)
   */
  private async encryptWithSymmetricKey(data: string): Promise<string> {
    if (!this.symmetricKey) {
      throw new Error("Symmetric key not available");
    }
    
    // Convert data to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.symmetricKey,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Return as Base64
    return arrayBufferToBase64(combined.buffer);
  }

  /**
   * Decrypts data using the user's symmetric key
   * @param encryptedData Base64 string of encrypted data
   * @returns Promise resolving to decrypted string
   */
  private async decryptWithSymmetricKey(encryptedData: string): Promise<string> {
    if (!this.symmetricKey) {
      throw new Error("Symmetric key not available");
    }
    
    // Convert Base64 to ArrayBuffer
    const combined = base64ToArrayBuffer(encryptedData);
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = new Uint8Array(combined.slice(0, 12));
    const data = new Uint8Array(combined.slice(12));
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.symmetricKey,
      data
    );
    
    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Checks if the encryption service is initialized.
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized && this.dcpe !== null && this.symmetricKey !== null;
  }

  /**
   * Ensures the encryption service is initialized.
   * @throws Error if not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error("Encryption service not initialized. Call initialize() first.");
    }
  }

  /**
   * Encrypts document content using standard encryption.
   * @param content The plaintext content
   * @returns The encrypted content
   */
  encryptText(content: string): string {
    this.ensureInitialized();
    try {
      return this.dcpe!.encryptText(content);
    } catch (error) {
      console.error("Failed to encrypt text:", error);
      throw new Error("Failed to encrypt text content");
    }
  }

  /**
   * Decrypts document content.
   * @param encryptedContent The encrypted content
   * @returns The decrypted content
   */
  decryptText(encryptedContent: string): string {
    this.ensureInitialized();
    try {
      return this.dcpe!.decryptText(encryptedContent);
    } catch (error) {
      console.error("Failed to decrypt text:", error);
      throw new Error("Failed to decrypt text content");
    }
  }

  /**
   * Encrypts metadata using deterministic encryption.
   * @param metadata The plaintext metadata
   * @returns The encrypted metadata
   */
  encryptMetadata(metadata: string): string {
    this.ensureInitialized();
    try {
      return this.dcpe!.encryptMetadata(metadata);
    } catch (error) {
      console.error("Failed to encrypt metadata:", error);
      throw new Error("Failed to encrypt metadata");
    }
  }

  /**
   * Decrypts metadata.
   * @param encryptedMetadata The encrypted metadata
   * @returns The decrypted metadata
   */
  decryptMetadata(encryptedMetadata: string): string {
    this.ensureInitialized();
    try {
      return this.dcpe!.decryptMetadata(encryptedMetadata);
    } catch (error) {
      console.error("Failed to decrypt metadata:", error);
      throw new Error("Failed to decrypt metadata");
    }
  }

  /**
   * Encrypts vector embeddings.
   * @param vector The vector to encrypt
   * @returns The encrypted vector
   */
  encryptVector(vector: number[]): number[] {
    this.ensureInitialized();
    try {
      return this.dcpe!.encryptVector(vector);
    } catch (error) {
      console.error("Failed to encrypt vector:", error);
      throw new Error("Failed to encrypt vector");
    }
  }

  /**
   * Decrypts vector embeddings.
   * @param encryptedVector The encrypted vector
   * @returns The decrypted vector
   */
  decryptVector(encryptedVector: number[]): number[] {
    this.ensureInitialized();
    try {
      return this.dcpe!.decryptVector(encryptedVector);
    } catch (error) {
      console.error("Failed to decrypt vector:", error);
      throw new Error("Failed to decrypt vector");
    }
  }

  /**
   * Clears the encryption service state and removes stored keys.
   */
  clear(): void {
    this.dcpe = null;
    this.symmetricKey = null;
    this.dcpeKeysString = null;
    this.initialized = false;
    localStorage.removeItem('encrypted_dcpe_keys');
  }
}

// Create a singleton instance
export const encryptionService = new EncryptionService();

/**
 * React hook for using the encryption service in components.
 * @returns Object containing the encryption service and loading state
 */
export function useEncryptionService() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const symmetricKey = useAuthStore((state) => state.decryptedSymmetricKey);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    let isMounted = true;
    
    async function initializeEncryption() {
      if (!symmetricKey) {
        if (isMounted) {
          setIsLoading(false);
          if (isAuthenticated) {
            setError(new Error("Authentication successful but symmetric key not available"));
          }
        }
        return;
      }

      try {
        if (!encryptionService.isInitialized()) {
          await encryptionService.initialize(symmetricKey);
        }
        
        if (isMounted) {
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to initialize encryption service:", err);
          setError(err instanceof Error ? err : new Error("Unknown error initializing encryption"));
          setIsLoading(false);
        }
      }
    }

    initializeEncryption();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [symmetricKey, isAuthenticated]);

  // Reset encryption service on logout
  useEffect(() => {
    if (!isAuthenticated && encryptionService.isInitialized()) {
      encryptionService.clear();
    }
  }, [isAuthenticated]);

  return { 
    service: encryptionService.isInitialized() ? encryptionService : null,
    isLoading,
    error
  };
}

/**
 * Standalone utility functions for use outside of React components
 */

/**
 * Ensures the encryption service is initialized with the provided symmetric key.
 * @param symmetricKey The symmetric key to use for initialization
 */
export async function initializeEncryption(symmetricKey: CryptoKey): Promise<void> {
  if (!encryptionService.isInitialized() && symmetricKey) {
    await encryptionService.initialize(symmetricKey);
  }
}

/**
 * Encrypts text content.
 * @param text The text to encrypt
 * @param symmetricKey The symmetric key (required if service not initialized)
 */
export async function encryptText(
  text: string, 
  symmetricKey?: CryptoKey
): Promise<string> {
  if (!encryptionService.isInitialized() && symmetricKey) {
    await initializeEncryption(symmetricKey);
  }
  return encryptionService.encryptText(text);
}

/**
 * Encrypts metadata deterministically.
 * @param metadata The metadata to encrypt
 * @param symmetricKey The symmetric key (required if service not initialized)
 */
export async function encryptMetadata(
  metadata: string, 
  symmetricKey?: CryptoKey
): Promise<string> {
  if (!encryptionService.isInitialized() && symmetricKey) {
    await initializeEncryption(symmetricKey);
  }
  return encryptionService.encryptMetadata(metadata);
}

/**
 * Encrypts vector embeddings.
 * @param vector The vector to encrypt
 * @param symmetricKey The symmetric key (required if service not initialized)
 */
export async function encryptVector(
  vector: number[], 
  symmetricKey?: CryptoKey
): Promise<number[]> {
  if (!encryptionService.isInitialized() && symmetricKey) {
    await initializeEncryption(symmetricKey);
  }
  return encryptionService.encryptVector(vector);
}