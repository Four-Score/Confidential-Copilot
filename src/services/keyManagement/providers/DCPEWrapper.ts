import { DCPEProvider } from '../interfaces';
import { DCPE } from 'dcpe-js';

/**
 * Wrapper for DCPE library
 */
export class DCPEWrapper implements DCPEProvider {
  private dcpe: InstanceType<typeof DCPE> | null = null;
  
  /**
   * Initialize DCPE provider
   */
  async initialize(): Promise<void> {
    try {
      this.dcpe = new DCPE();
    } catch (error) {
      console.error('Failed to initialize DCPE', error);
      throw new Error(`DCPE initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate new DCPE keys
   */
  async generateKeys(): Promise<any> {
    if (!this.dcpe) {
      await this.initialize();
    }
    return this.dcpe!.generateKeys();
  }
  
  /**
   * Set DCPE keys
   */
  setKeys(keys: any): void {
    if (!this.dcpe) {
      throw new Error('DCPE not initialized');
    }
    this.dcpe.setKeys(keys);
  }
  
  /**
   * Encrypt text using DCPE
   */
  encryptText(text: string): string {
    if (!this.dcpe) throw new Error('DCPE not initialized');
    return this.dcpe.encryptText(text);
  }
  
  /**
   * Decrypt text using DCPE
   */
  decryptText(encryptedText: string): string {
    try {
      // Parse the JSON string to get the object representation
      const encryptedData = JSON.parse(encryptedText);
      
      // Convert the data arrays to Buffer objects
      const ciphertext = Buffer.from(encryptedData.ciphertext.data);
      const iv = Buffer.from(encryptedData.iv.data);
      const tag = Buffer.from(encryptedData.tag.data);
      
      // Create the formatted object expected by DCPE
      const formattedEncryptedText = {
        ciphertext,
        iv,
        tag
      };
      
      // Use the properly formatted encrypted text
      return this.dcpe.decryptText(formattedEncryptedText);
    } catch (error) {
      console.error('DCPEWrapper decryptText error:', error);
      throw error;
    }
  }
  
  /**
   * Encrypt metadata using DCPE
   */
  encryptMetadata(metadata: string): string {
    if (!this.dcpe) throw new Error('DCPE not initialized');
    return this.dcpe.encryptMetadata(metadata);
  }
  
  /**
   * Decrypt metadata using DCPE
   */
  decryptMetadata(encryptedMetadata: any): string {
    if (!this.dcpe) throw new Error('DCPE not initialized');
    
    // Handle serialized Buffer objects from database
    if (typeof encryptedMetadata === 'object' && encryptedMetadata.type === 'Buffer' && Array.isArray(encryptedMetadata.data)) {
      try {
        // Convert the serialized Buffer back to an actual Buffer
        const buffer = Buffer.from(encryptedMetadata.data);
        return this.dcpe.decryptMetadata(buffer);
      } catch (error) {
        console.error('Error converting serialized Buffer to Buffer:', error);
        return JSON.stringify(encryptedMetadata);
      }
    }
    
    // Handle case where it might be a stringified JSON representation of a Buffer
    if (typeof encryptedMetadata === 'string' && encryptedMetadata.includes('"type":"Buffer"')) {
      try {
        const parsed = JSON.parse(encryptedMetadata);
        if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
          const buffer = Buffer.from(parsed.data);
          return this.dcpe.decryptMetadata(buffer);
        }
      } catch (e) {
        // Not valid JSON or doesn't have expected structure, continue with original logic
      }
    }
    
    // Original logic for normal encrypted strings
    try {
      return this.dcpe.decryptMetadata(encryptedMetadata);
    } catch (error) {
      console.log('Received unencrypted metadata, returning as-is:', encryptedMetadata);
      return typeof encryptedMetadata === 'object' ? JSON.stringify(encryptedMetadata) : encryptedMetadata;
    }
  }
  
  /**
   * Encrypt vector using DCPE
   */
  encryptVector(vector: number[]): number[] {
    if (!this.dcpe) throw new Error('DCPE not initialized');
    return this.dcpe.encryptVector(vector);
  }
  
  /**
   * Decrypt vector using DCPE
   */
  decryptVector(encryptedVector: number[]): number[] {
    if (!this.dcpe) throw new Error('DCPE not initialized');
    return this.dcpe.decryptVector(encryptedVector);
  }
}