// This script tests DCPE encryption/decryption with various buffer formats

// Import the DCPE-js package directly
import { DCPE } from 'dcpe-js';

// Utility functions for buffer conversion
function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function base64ToArrayBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

// Test different approaches for buffer conversion
async function testDCPE() {
  console.log("Starting DCPE encryption/decryption tests...");
  
  try {
    // Initialize DCPE
    const dcpe = new DCPE();
    const keys = await dcpe.generateKeys();
    dcpe.setKeys(keys);
    console.log("DCPE initialized successfully");
    
    // Test string to encrypt/decrypt
    const originalText = "Test Document 123";
    console.log(`Original text: "${originalText}"`);
    
    // ===== TEST 1: Direct Encryption/Decryption =====
    console.log("\n--- TEST 1: Direct Encryption/Decryption ---");
    
    try {
      // Encrypt metadata
      const encryptedMetadata = dcpe.encryptMetadata(originalText);
      console.log("Encrypted Metadata (Direct):", encryptedMetadata);
      
      // Check the type of the encrypted result
      console.log(`Encrypted metadata type: ${typeof encryptedMetadata}`);
      if (Buffer.isBuffer(encryptedMetadata)) {
        console.log(`Encrypted is Buffer of length ${encryptedMetadata.length}`);
      } else if (encryptedMetadata instanceof Uint8Array) {
        console.log(`Encrypted is Uint8Array of length ${encryptedMetadata.length}`);
      } else if (typeof encryptedMetadata === 'string') {
        console.log(`Encrypted is String of length ${encryptedMetadata.length}`);
      }
      
      // Try direct decryption
      try {
        const decryptedMetadata = dcpe.decryptMetadata(encryptedMetadata);
        console.log(`Decrypted metadata: "${decryptedMetadata}"`);
        console.log("TEST 1 PASSED: Direct encryption/decryption works");
      } catch (error) {
        console.error(`Direct decryption failed: ${error.message}`);
      }
    } catch (error) {
      console.error(`Test 1 failed: ${error.message}`);
    }
    
    // ===== TEST 2: Database Simulation (String Storage) =====
    console.log("\n--- TEST 2: Database Simulation (String Storage) ---");
    
    try {
      // Encrypt metadata
      const encryptedMetadata = dcpe.encryptMetadata(originalText);
      console.log("Original encrypted metadata type:", typeof encryptedMetadata);
      
      // Convert to string/base64 for storage (simulating database storage)
      let storageFormat;
      if (Buffer.isBuffer(encryptedMetadata)) {
        // If it's a Buffer, convert to base64 string
        storageFormat = encryptedMetadata.toString('base64');
        console.log(`Converted Buffer to base64 string: ${storageFormat.substring(0, 30)}...`);
      } else if (encryptedMetadata instanceof Uint8Array) {
        // If it's a Uint8Array, convert to base64 string
        storageFormat = Buffer.from(encryptedMetadata).toString('base64');
        console.log(`Converted Uint8Array to base64 string: ${storageFormat.substring(0, 30)}...`);
      } else {
        // If it's already a string, use as-is
        storageFormat = encryptedMetadata.toString();
        console.log(`Using string directly: ${storageFormat.substring(0, 30)}...`);
      }
      
      // Now simulate retrieval and decryption
      console.log("\nAttempting decryption with different approaches:");
      
      // Approach 1: Convert from base64 string back to Buffer
      try {
        const buffer = Buffer.from(storageFormat, 'base64');
        console.log("Approach 1 - From base64 to Buffer:", buffer);
        const decrypted1 = dcpe.decryptMetadata(buffer);
        console.log(`Approach 1 (Base64 → Buffer): "${decrypted1}"`);
        console.log("APPROACH 1 SUCCESSFUL");
      } catch (error) {
        console.error(`Approach 1 failed: ${error.message}`);
      }
      
      // Approach 2: Use string directly
      try {
        console.log("Approach 2 - Using string directly");
        const decrypted2 = dcpe.decryptMetadata(storageFormat);
        console.log(`Approach 2 (Direct string): "${decrypted2}"`);
        console.log("APPROACH 2 SUCCESSFUL");
      } catch (error) {
        console.error(`Approach 2 failed: ${error.message}`);
      }
      
      // Approach 3: Convert to Uint8Array
      try {
        const buffer = Buffer.from(storageFormat, 'base64');
        const uint8Array = new Uint8Array(buffer);
        console.log("Approach 3 - From base64 to Uint8Array:", uint8Array);
        const decrypted3 = dcpe.decryptMetadata(uint8Array);
        console.log(`Approach 3 (Base64 → Uint8Array): "${decrypted3}"`);
        console.log("APPROACH 3 SUCCESSFUL");
      } catch (error) {
        console.error(`Approach 3 failed: ${error.message}`);
      }
    } catch (error) {
      console.error(`Test 2 failed: ${error.message}`);
    }
    
    // ===== TEST 3: Testing with a simulated re-initialized DCPE instance =====
    console.log("\n--- TEST 3: Re-initialized DCPE Instance ---");
    
    try {
      // Original encryption with first instance
      const encryptedMetadata = dcpe.encryptMetadata(originalText);
      
      // Convert to base64 for storage
      let storageFormat;
      if (Buffer.isBuffer(encryptedMetadata) || encryptedMetadata instanceof Uint8Array) {
        storageFormat = Buffer.from(encryptedMetadata).toString('base64');
      } else {
        storageFormat = encryptedMetadata.toString();
      }
      console.log(`Storage format: ${storageFormat.substring(0, 30)}...`);
      
      // Create a new DCPE instance with the same keys
      console.log("Creating new DCPE instance with same keys");
      const newDcpe = new DCPE();
      newDcpe.setKeys(keys);
      
      // Try to decrypt with new instance
      const successfulApproaches = [];
      
      // Approach 1: Buffer from base64
      try {
        const buffer = Buffer.from(storageFormat, 'base64');
        const decrypted1 = newDcpe.decryptMetadata(buffer);
        console.log(`New instance - Approach 1 (Buffer): "${decrypted1}"`);
        successfulApproaches.push("Buffer from base64");
      } catch (error) {
        console.error(`New instance - Approach 1 failed: ${error.message}`);
      }
      
      // Approach 2: Uint8Array from base64
      try {
        const buffer = Buffer.from(storageFormat, 'base64');
        const uint8Array = new Uint8Array(buffer);
        const decrypted2 = newDcpe.decryptMetadata(uint8Array);
        console.log(`New instance - Approach 2 (Uint8Array): "${decrypted2}"`);
        successfulApproaches.push("Uint8Array from base64");
      } catch (error) {
        console.error(`New instance - Approach 2 failed: ${error.message}`);
      }
      
      // Summarize results
      if (successfulApproaches.length > 0) {
        console.log(`Successful approaches with new instance: ${successfulApproaches.join(', ')}`);
      } else {
        console.error("No successful approaches with new instance");
      }
    } catch (error) {
      console.error(`Test 3 failed: ${error.message}`);
    }
    
    console.log("\nDCPE testing completed");
    
  } catch (error) {
    console.error("Failed to initialize DCPE:", error);
  }
}

// Run the test
testDCPE().catch(console.error);