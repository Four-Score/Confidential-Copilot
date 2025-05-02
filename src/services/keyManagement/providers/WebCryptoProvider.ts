import { CryptoProvider } from '../interfaces';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/crypto';

/**
 * Web Crypto API implementation of crypto operations
 */
export class WebCryptoProvider implements CryptoProvider {
  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(data: string, key: CryptoKey): Promise<string> {
    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);
      
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encodedData
      );
      
      // Prepend IV to encrypted data for later decryption
      const resultBuffer = new Uint8Array(iv.length + encryptedData.byteLength);
      resultBuffer.set(iv, 0);
      resultBuffer.set(new Uint8Array(encryptedData), iv.length);
      
      return arrayBufferToBase64(resultBuffer.buffer);
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
      const encryptedBuffer = base64ToArrayBuffer(encryptedData);
      const iv = new Uint8Array(encryptedBuffer.slice(0, 12));
      const data = encryptedBuffer.slice(12); // Use ArrayBuffer directly instead of Uint8Array
      
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );
      
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}