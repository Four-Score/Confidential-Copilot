// src/lib/crypto.ts

const PBKDF2_ITERATIONS = 100000; // Number of iterations for PBKDF2
const SALT_LENGTH_BYTES = 16;    // Length of the salt in bytes (128 bits)
const IV_LENGTH_BYTES = 12;      // Length of the IV in bytes (96 bits) recommended for AES-GCM
const RECOVERY_KEY_LENGTH_BYTES = 32; // Length of the recovery key random bytes (256 bits)

// Helper Functions 

/**
 * Converts an ArrayBuffer to a Base64 string.
 * param: buffer - The ArrayBuffer to convert.
 * returns: The Base64 encoded string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 * param: base64 The Base64 string to convert.
 * returns: The corresponding ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converts a string to an ArrayBuffer using UTF-8 encoding.
 * param: str - The string to convert.
 * returns: The corresponding ArrayBuffer.
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder(); // Defaults to UTF-8
    return encoder.encode(str).buffer as ArrayBuffer;
}

// Core Crypto Functions 

// Function 1: generateSalt
/**
 * Generates a cryptographically random salt.
 * returns: A Uint8Array containing the salt.
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH_BYTES);
  window.crypto.getRandomValues(salt);
  return salt;
}

// Function 2: deriveKeyFromPassword
/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 * This key is suitable for wrapping/unwrapping other keys.
 * param: password - The user's password.
 * param: salt - The salt (Uint8Array).
 * returns: A Promise resolving to a CryptoKey.
 */
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordBuffer = stringToArrayBuffer(password);

  // Import the password as a base key for PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false, // Not extractable
    ['deriveKey']
  );

  // Derive the actual key using PBKDF2
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 }, // Algorithm the derived key will be used for
    true, // Make the derived key extractable (for potential debugging, though not strictly needed for wrap/unwrap) - changed to true for consistency, wrapKey/unwrapKey usage is sufficient
    ['wrapKey', 'unwrapKey'] // Key usages
  );

  return derivedKey;
}

// Function 3: generateRandomKey
/**
 * Generates a random symmetric key (AES-GCM 256-bit) for data encryption.
 * returns: A Promise resolving to a CryptoKey.
 */
export async function generateRandomSymmetricKey(): Promise<CryptoKey> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // Key size in bits
    },
    true, // Extractable (so it can be wrapped and stored)
    ['encrypt', 'decrypt'] // Key usages (for actual data operations later)
  );
  return key;
}

// Function 4: generateRecoveryKeyString
/**
 * Generates a secure random recovery key string (Base64 encoded).
 * returns: A Base64 encoded string representing the recovery key.
 */
export function generateRecoveryKeyString(): string {
    const randomBytes = new Uint8Array(RECOVERY_KEY_LENGTH_BYTES);
    window.crypto.getRandomValues(randomBytes);
    return arrayBufferToBase64(randomBytes.buffer);
}

// Function 5: deriveKeyFromRecoveryString
/**
 * Derives a cryptographic key from a recovery key string and salt.
 * Uses SHA-256 hash of (recovery key bytes + salt) as the raw key material.
 * This key is suitable for wrapping/unwrapping the main symmetric key.
 * param: recoveryKeyString - The Base64 encoded recovery key string.
 * param: salt - The salt (Uint8Array) used during original key generation.
 * returns: A Promise resolving to a CryptoKey.
 */
export async function deriveKeyFromRecoveryString(recoveryKeyString: string, salt: Uint8Array): Promise<CryptoKey> {
    try {
        const recoveryKeyBytes = base64ToArrayBuffer(recoveryKeyString);

        // Combine recovery key bytes and salt
        const combined = new Uint8Array(recoveryKeyBytes.byteLength + salt.byteLength);
        combined.set(new Uint8Array(recoveryKeyBytes), 0);
        combined.set(salt, recoveryKeyBytes.byteLength);

        // Hash the combination to get a 256-bit key material
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined.buffer);

        // Import the hash as an AES-GCM key
        const derivedKey = await window.crypto.subtle.importKey(
            'raw',
            hashBuffer,
            { name: 'AES-GCM', length: 256 },
            true, // Extractable (consistent with password derived key)
            ['wrapKey', 'unwrapKey'] // Key usages
        );
        return derivedKey;
    } catch (error) {
        console.error("Error deriving key from recovery string:", error);
        throw new Error("Invalid recovery key format or derivation failed."); // Re-throw a more specific error
    }
}


// Function 6: encryptKey
/**
 * Encrypts a symmetric key using a wrapping key (AES-GCM).
 * param: keyToEncrypt - The symmetric CryptoKey to encrypt.
 * param wrappingKey - The CryptoKey (derived from password or recovery) used for encryption.
 * returns: A Promise resolving to an object containing the ciphertext (ArrayBuffer) and iv (Uint8Array).
 */
export async function encryptKey(keyToEncrypt: CryptoKey, wrappingKey: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  // Export the symmetric key to raw format (ArrayBuffer)
  const keyData = await window.crypto.subtle.exportKey('raw', keyToEncrypt);

  // Generate a random IV
  const iv = new Uint8Array(IV_LENGTH_BYTES);
  window.crypto.getRandomValues(iv);

  // Encrypt the key data
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    wrappingKey,
    keyData
  );

  return { ciphertext, iv };
}


// Function 7: decryptKey
/**
 * Decrypts an encrypted symmetric key using a wrapping key (AES-GCM).
 * param: encryptedKeyData - The ciphertext (ArrayBuffer) of the encrypted key.
 * param: iv The Initialization Vector - (Uint8Array) used during encryption.
 * param: wrappingKey The CryptoKey - (derived from password or recovery) used for decryption.
 * returns: A Promise resolving to the raw decrypted key data (ArrayBuffer).
 */
export async function decryptKey(encryptedKeyData: ArrayBuffer, iv: Uint8Array, wrappingKey: CryptoKey): Promise<ArrayBuffer> {
  try {
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      wrappingKey,
      encryptedKeyData
    );
    return decryptedData;
  } catch (error) {
    console.error("Decryption failed:", error);
    // Avoid logging sensitive details in production, but signal failure clearly.
    // This error often means the wrong password/recovery key was used, or the data is corrupt.
    throw new Error("Failed to decrypt key. Incorrect password, recovery key, or data corruption.");
  }
}

/**
 * Imports raw key bytes back into a usable AES-GCM CryptoKey for encryption/decryption.
 * param: rawKey - The raw key data (ArrayBuffer) obtained after decryption.
 * returns: A Promise resolving to a CryptoKey.
 */
export async function importSymmetricKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
    try {
        const key = await window.crypto.subtle.importKey(
            'raw',
            rawKey,
            { name: 'AES-GCM', length: 256 },
            true, // Must be true to be usable
            ['encrypt', 'decrypt']
        );
        return key;
    } catch (error) {
        console.error("Error importing symmetric key:", error);
        throw new Error("Failed to import symmetric key.");
    }
}

// Testing Functions (for manual testing in browser console)
/*
async function testCrypto() {
  try {
    const password = "mysecretpassword";
    const salt = generateSalt();
    console.log("Generated Salt (b64):", arrayBufferToBase64(salt.buffer));

    const passwordKey = await deriveKeyFromPassword(password, salt);
    console.log("Password Derived Key:", passwordKey);

    const recoveryString = generateRecoveryKeyString();
    console.log("Generated Recovery Key String:", recoveryString);

    const recoveryKey = await deriveKeyFromRecoveryString(recoveryString, salt);
    console.log("Recovery Derived Key:", recoveryKey);

    const symmetricKey = await generateRandomSymmetricKey();
    console.log("Generated Symmetric Key:", symmetricKey);
    const exportedSymmetricKey = await window.crypto.subtle.exportKey('raw', symmetricKey);
    console.log("Exported Symmetric Key (b64):", arrayBufferToBase64(exportedSymmetricKey));


    // Encrypt with password key
    const { ciphertext: ctPw, iv: ivPw } = await encryptKey(symmetricKey, passwordKey);
    console.log("Encrypted with PW Key (b64):", arrayBufferToBase64(ctPw));
    console.log("IV for PW Key (b64):", arrayBufferToBase64(ivPw.buffer));

    // Encrypt with recovery key
    const { ciphertext: ctRec, iv: ivRec } = await encryptKey(symmetricKey, recoveryKey);
    console.log("Encrypted with Recovery Key (b64):", arrayBufferToBase64(ctRec));
    console.log("IV for Recovery Key (b64):", arrayBufferToBase64(ivRec.buffer));

    // --- Decryption ---
    console.log("\n--- Decrypting ---");

    // Decrypt with correct password key
    const decryptedRawPw = await decryptKey(ctPw, ivPw, passwordKey);
    console.log("Decrypted Raw Key (from PW - b64):", arrayBufferToBase64(decryptedRawPw));
    const importedKeyPw = await importSymmetricKey(decryptedRawPw);
    console.log("Imported Symmetric Key (from PW):", importedKeyPw);

    // Decrypt with correct recovery key
    const decryptedRawRec = await decryptKey(ctRec, ivRec, recoveryKey);
    console.log("Decrypted Raw Key (from Recovery - b64):", arrayBufferToBase64(decryptedRawRec));
    const importedKeyRec = await importSymmetricKey(decryptedRawRec);
    console.log("Imported Symmetric Key (from Recovery):", importedKeyRec);


    // Test decryption failure (using password key on recovery ciphertext)
    try {
        console.log("\n--- Testing Decryption Failure ---");
        await decryptKey(ctRec, ivRec, passwordKey); // Should fail
    } catch (e) {
        console.log("Expected decryption failure:", e.message);
    }

  } catch (error) {
    console.error("Crypto test failed:", error);
  }
}

// To run the test, open browser console on a page where this script is loaded and run:
// testCrypto();
*/