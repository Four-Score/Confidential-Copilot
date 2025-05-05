import { KeyStorageProvider, CryptoProvider, DCPEProvider } from './interfaces';
import { DatabaseKeyStorage } from './providers/DatabaseKeyStorage';
import { LocalStorageKeyStorage } from './providers/LocalStorageKeyStorage';
import { WebCryptoProvider } from './providers/WebCryptoProvider';
import { DCPEWrapper } from './providers/DCPEWrapper';
import { createClient } from '@/lib/supabase/client';

export interface KeyLoadStrategy {
  priorityOrder: ('database' | 'localStorage' | 'generate')[];
}

/**
 * Main service for key management
 */
export class KeyManagementService {
  // Default strategy
  private static readonly DEFAULT_STRATEGY: KeyLoadStrategy = {
    priorityOrder: ['database', 'localStorage', 'generate']
  };
  
  // Singleton pattern
  private static instance: KeyManagementService;
  
  private userId: string | null = null;
  private symmetricKey: CryptoKey | null = null;
  private initialized = false;
  private dcpeKeysString: string | null = null;
  
  private readonly databaseStorage: KeyStorageProvider;
  private readonly localStorageStorage: KeyStorageProvider;
  private readonly cryptoProvider: CryptoProvider;
  private readonly dcpeProvider: DCPEProvider;
  private readonly loadStrategy: KeyLoadStrategy;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }
  
  private constructor() {
    // Initialize providers
    this.databaseStorage = new DatabaseKeyStorage();
    this.localStorageStorage = new LocalStorageKeyStorage();
    this.cryptoProvider = new WebCryptoProvider();
    this.dcpeProvider = new DCPEWrapper();
    this.loadStrategy = KeyManagementService.DEFAULT_STRATEGY;
  }
  
  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Initialize the key management service
   */
  public async initialize(userId: string, symmetricKey: CryptoKey): Promise<boolean> {
    try {
      // Reset state
      this.userId = userId;
      this.symmetricKey = symmetricKey;
      
      // Initialize DCPE provider
      await this.dcpeProvider.initialize();
      
      // Load DCPE keys based on strategy
      const dcpeKeysLoaded = await this.loadDcpeKeys();
      
      if (!dcpeKeysLoaded) {
        // No keys could be loaded, generate new ones
        console.log('No valid DCPE keys found, generating new keys');
        await this.generateAndStoreDcpeKeys();
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize key management service', error);
      return false;
    }
  }
  
  /**
   * Initialize with direct DCPE keys (for signup flow)
   * This bypasses the loading strategy and directly sets the DCPE keys
   * Useful when we've just generated keys during signup
   */
  public async initializeWithNewKeys(userId: string, symmetricKey: CryptoKey): Promise<boolean> {
    try {
      // Reset state
      this.userId = userId;
      this.symmetricKey = symmetricKey;
      
      // Initialize DCPE provider
      await this.dcpeProvider.initialize();
      
      // Generate new keys immediately without checking storage
      console.log('Generating new DCPE keys during signup');
      await this.generateAndStoreDcpeKeys();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize key management service with new keys', error);
      return false;
    }
  }
  
  /**
   * Load DCPE keys based on configured strategy
   */
  private async loadDcpeKeys(): Promise<boolean> {
    const { priorityOrder } = this.loadStrategy;
    
    for (const source of priorityOrder) {
      if (source === 'generate') continue; // Skip generation in loading phase
      
      try {
        let encryptedKeys: string | null = null;
        
        if (source === 'database' && this.userId) {
          console.log('Attempting to load DCPE keys from database');
          encryptedKeys = await this.databaseStorage.fetchKeys(this.userId);
        } else if (source === 'localStorage') {
          console.log('Attempting to load DCPE keys from localStorage');
          encryptedKeys = await this.localStorageStorage.fetchKeys(null);
        }
        
        if (encryptedKeys) {
          const loaded = await this.decryptAndSetDcpeKeys(encryptedKeys);
          
          if (loaded) {
            console.log(`Successfully loaded DCPE keys from ${source}`);
            
            // Sync keys to other storage if needed
            if (source === 'localStorage' && this.userId) {
              // Sync localStorage keys to database for cross-device consistency
              await this.databaseStorage.storeKeys(this.userId, encryptedKeys);
            } else if (source === 'database' && this.userId) { // Added check for clarity, though logically guaranteed
              // Sync database keys to localStorage for faster access
              // Pass this.userId (guaranteed non-null string here) to satisfy type checker
              await this.localStorageStorage.storeKeys(this.userId, encryptedKeys);
            }
            
            return true;
          }
        }
      } catch (error) {
        console.error(`Failed to load DCPE keys from ${source}`, error);
      }
    }
    
    return false;
  }
  
  /**
   * Decrypt and set DCPE keys
   */
  private async decryptAndSetDcpeKeys(encryptedKeys: string): Promise<boolean> {
    if (!this.symmetricKey) return false;
    
    try {
      const decryptedKeys = await this.cryptoProvider.decrypt(encryptedKeys, this.symmetricKey);
      const parsedKeys = JSON.parse(decryptedKeys);
      
      this.dcpeProvider.setKeys(parsedKeys);
      this.dcpeKeysString = decryptedKeys;
      
      return true;
    } catch (error) {
      console.error('Failed to decrypt DCPE keys', error);
      return false;
    }
  }
  
  /**
   * Generate and store new DCPE keys
   */
  private async generateAndStoreDcpeKeys(): Promise<boolean> {
    if (!this.symmetricKey || !this.userId) return false;
    
    try {
      // Generate new keys
      const keys = await this.dcpeProvider.generateKeys();
      this.dcpeProvider.setKeys(keys);
      
      // Store keys as string
      this.dcpeKeysString = JSON.stringify(keys);
      
      // Encrypt keys with symmetric key
      const encryptedKeys = await this.cryptoProvider.encrypt(
        this.dcpeKeysString,
        this.symmetricKey
      );
      
      // Store encrypted keys in both storage locations
      await this.localStorageStorage.storeKeys(this.userId, encryptedKeys);
      await this.databaseStorage.storeKeys(this.userId, encryptedKeys);
      
      return true;
    } catch (error) {
      console.error('Failed to generate and store DCPE keys', error);
      return false;
    }
  }
  
  /**
   * Clear all key data
   */
  public clear(): void {
    this.initialized = false;
    this.symmetricKey = null;
    this.dcpeKeysString = null;
    
    // Clear localStorage
    this.localStorageStorage.clearKeys?.(null);
    
    this.userId = null;
  }
  
  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): boolean {
    if (!this.initialized || !this.symmetricKey) {
      console.error('Key management service not initialized');
      return false;
    }
    return true;
  }
  
  // Public encryption methods
  
  /**
   * Encrypt text using DCPE
   */
  public encryptText(text: string): string {
    if (!this.ensureInitialized()) throw new Error('Service not initialized');
    return this.dcpeProvider.encryptText(text);
  }
  
  /**
   * Decrypt text using DCPE
   */
  public decryptText(encryptedText: string): string {
    if (!this.ensureInitialized()) throw new Error('Service not initialized');
    return this.dcpeProvider.decryptText(encryptedText);
  }
  
  /**
   * Encrypt metadata using DCPE
   */
  public encryptMetadata(metadata: string): string {
    if (!this.ensureInitialized()) throw new Error('Service not initialized');
    return this.dcpeProvider.encryptMetadata(metadata);
  }
  
  /**
   * Decrypt metadata using DCPE
   */
  public decryptMetadata(encryptedMetadata: any): string {
    if (!this.ensureInitialized()) throw new Error('Service not initialized');
    return this.dcpeProvider.decryptMetadata(encryptedMetadata);
  }

  /**
 * Decrypts multiple text items in a single batch operation
 * @param encryptedTexts Array of encrypted text strings
 * @returns Array of decrypted text strings in the same order
 */
public decryptTextBatch(encryptedTexts: string[]): string[] {
  // Validate input
  if (!encryptedTexts || !encryptedTexts.length) return [];
  
  // Check if service is initialized
  if (!this.ensureInitialized()) {
    throw new Error('DCPE provider is not initialized');
  }
  
  // Process each text, capturing errors per item
  return encryptedTexts.map(text => {
    try {
      return this.dcpeProvider.decryptText(text);
    } catch (error) {
      console.error('Failed to decrypt text:', error);
      return ''; // Return empty string for failed items
    }
  });
}

/**
 * Decrypts multiple metadata items in a single batch operation
 * @param encryptedMetadataItems Array of encrypted metadata items
 * @returns Array of decrypted metadata items in the same order
 */
public decryptMetadataBatch(encryptedMetadataItems: any[]): any[] {
  // Validate input
  if (!encryptedMetadataItems || !encryptedMetadataItems.length) return [];
  
  // Check if DCPE provider is initialized
  if (!this.ensureInitialized) {
    throw new Error('DCPE provider is not initialized');
  }
  
  // Process each metadata item, capturing errors per item
  return encryptedMetadataItems.map(item => {
    try {
      return this.dcpeProvider.decryptMetadata(item);
    } catch (error) {
      console.error('Failed to decrypt metadata:', error);
      return {}; // Return empty object for failed items
    }
  });
}
  
  /**
   * Encrypt vector using DCPE
   */
  public encryptVector(vector: number[]): number[] {
    if (!this.ensureInitialized()) throw new Error('Service not initialized');
    return this.dcpeProvider.encryptVector(vector);
  }
  
  /**
   * Decrypt vector using DCPE
   */
  public decryptVector(encryptedVector: number[]): number[] {
    if (!this.ensureInitialized()) throw new Error('Service not initialized');
    return this.dcpeProvider.decryptVector(encryptedVector);
  }
}

// Singleton export
export const keyManagementService = KeyManagementService.getInstance();