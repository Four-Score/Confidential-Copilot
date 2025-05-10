# Key Management Service Documentation

## Overview

The Key Management Service is a robust, modular system designed to securely handle encryption keys in the Confidential-Copilot application. It provides a clean separation of concerns through provider interfaces, implements a flexible storage strategy for cross-device consistency, and offers deterministic encryption capabilities for searchable encrypted data while maintaining a zero-trust architecture.

The service follows a provider pattern that allows for different implementations of key storage, cryptographic operations, and Deterministic Convergent Privacy Encryption (DCPE) functionality, making it highly extensible and testable.

## Architecture

### Core Components

1. **KeyManagementService**: The main service class that orchestrates all key management operations
2. **Provider Interfaces**: Clear separation of concerns through defined interfaces
   - `KeyStorageProvider`: For storing and retrieving encrypted keys
   - `CryptoProvider`: For cryptographic operations
   - `DCPEProvider`: For deterministic encryption functionality
3. **Provider Implementations**:
   - `DatabaseKeyStorage`: Stores keys in Supabase database for cross-device access
   - `LocalStorageKeyStorage`: Caches keys in browser localStorage for faster access
   - `WebCryptoProvider`: Implements cryptographic operations using Web Crypto API
   - `DCPEWrapper`: Integrates with the DCPE-js library
4. **React Integration**: A custom hook for easy use in React components
5. **Standalone Functions**: Utility functions for use outside of React components
6. **Session Management**: Persistence layer for maintaining keys across page refreshes and browser tabs

### Directory Structure

```
src/
└── services/
    └── keyManagement/
        ├── index.ts                     # Exports all key management components
        ├── interfaces.ts                # Provider interfaces
        ├── KeyManagementService.ts      # Main service class
        ├── useKeyManagement.ts          # React hook
        ├── cryptoUtils.ts               # Helper functions
        ├── sessionKeyManager.ts         # Session storage for key persistence
        ├── promptUtils.ts               # Utilities for key initialization
        └── providers/
            ├── DatabaseKeyStorage.ts    # Database storage provider
            ├── LocalStorageKeyStorage.ts # Local storage provider
            ├── WebCryptoProvider.ts     # Web Crypto API provider
            └── DCPEWrapper.ts           # DCPE implementation wrapper
```

## File Details

### 1. Interface Definitions: `Confidential-Copilot\src\services\keyManagement\interfaces.ts`

Defines the core interfaces for the provider pattern:

```typescript
export interface KeyStorageProvider {
  fetchKeys(userId: string | null): Promise<string | null>;
  storeKeys(userId: string | null, encryptedKeys: string): Promise<StorageResult>;
  clearKeys?(userId: string | null): Promise<void>;
}

export interface CryptoProvider {
  encrypt(data: string, key: CryptoKey): Promise<string>;
  decrypt(encryptedData: string, key: CryptoKey): Promise<string>;
}

export interface DCPEProvider {
  initialize(): Promise<void>;
  generateKeys(): Promise<any>;
  setKeys(keys: any): void;
  encryptText(text: string): string;
  decryptText(encryptedText: string): string;
  encryptMetadata(metadata: string): string;
  decryptMetadata(encryptedMetadata: any): string;
  encryptVector(vector: number[]): number[];
  decryptVector(encryptedVector: number[]): number[];
}
```

### 2. Main Service: `Confidential-Copilot\src\services\keyManagement\KeyManagementService.ts`

The core service that implements the key management logic:

- **Key Functions**:
  - `initialize(userId: string, symmetricKey: CryptoKey)`: Sets up the service with user credentials
  - `initializeWithNewKeys(userId: string, symmetricKey: CryptoKey)`: Special initialization for signup flow
  - `loadDcpeKeys()`: Loads keys based on configured strategy (database → localStorage → generate)
  - `generateAndStoreDcpeKeys()`: Creates and stores new DCPE keys
  - `decryptAndSetDcpeKeys(encryptedKeys: string)`: Handles decryption of stored keys
  - `clear()`: Cleans up all key data when logging out
  - `encryptText()`, `encryptMetadata()`, `encryptVector()`: Public encryption methods
  - `decryptText()`, `decryptMetadata()`, `decryptVector()`: Public decryption methods

- **Features**:
  - Singleton pattern for global access
  - Prioritized loading strategy for keys
  - Cross-device synchronization
  - Error handling and proper cleanup
  - User state awareness

### 3. React Hook: `Confidential-Copilot\src\services\keyManagement\useKeyManagement.ts`

Provides a React-friendly way to access the key management service:

```typescript
export function useKeyManagement() {
  const [state, setState] = useState<KeyManagementState>({
    isInitialized: false,
    isLoading: false,
    error: null
  });
  
  const user = useAuthStore((state) => state.user);
  const symmetricKey = useAuthStore((state) => state.decryptedSymmetricKey);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  
  // Initialize and manage key service based on auth state
  useEffect(() => {
    // Implementation details...
  }, [isAuthenticated, user, symmetricKey]);

  // Session recovery functionality
  // ...

  return {
    ...state,
    service: keyManagementService,
    ensureInitialized,
    // Helper methods for encryption/decryption
  };
}
```

### 4. Provider Implementations

#### Database Storage: `Confidential-Copilot\src\services\keyManagement\providers\DatabaseKeyStorage.ts`

Handles storing and retrieving encrypted keys from Supabase:

- `fetchKeys(userId: string)`: Gets encrypted keys from user_keys table
- `storeKeys(userId: string, encryptedKeys: string)`: Updates encrypted_dcpe_keys column

#### Local Storage: `Confidential-Copilot\src\services\keyManagement\providers\LocalStorageKeyStorage.ts`

Caches encrypted keys in browser localStorage:

- `fetchKeys()`: Retrieves from localStorage
- `storeKeys()`: Saves to localStorage
- `clearKeys()`: Removes from localStorage

#### Web Crypto Provider: `Confidential-Copilot\src\services\keyManagement\providers\WebCryptoProvider.ts`

Implements encryption/decryption using the Web Crypto API:

- `encrypt(data: string, key: CryptoKey)`: AES-GCM encryption
- `decrypt(encryptedData: string, key: CryptoKey)`: AES-GCM decryption

#### DCPE Wrapper: `Confidential-Copilot\src\services\keyManagement\providers\DCPEWrapper.ts`

Integrates with the DCPE-js library:

- `initialize()`: Sets up the DCPE library
- `generateKeys()`: Creates new DCPE keys
- `setKeys(keys)`: Configures DCPE with provided keys
- `encryptText()`, `encryptMetadata()`, `encryptVector()`: DCPE encryption methods
- `decryptText()`, `decryptMetadata()`, `decryptVector()`: DCPE decryption methods

### 5. Integration File: `Confidential-Copilot\src\services\keyManagement\index.ts`

Export file that provides access to all key management components:

```typescript
export { keyManagementService } from './KeyManagementService';
export { useKeyManagement } from './useKeyManagement';
export { encryptText, encryptMetadata, encryptVector } from './cryptoUtils';
export { ensureKeyManagementInitialized } from './promptUtils';
```

### 6. Utility Functions: `Confidential-Copilot\src\services\keyManagement\cryptoUtils.ts`

Standalone utility functions for encryption outside of React components:

- `encryptText(text: string, symmetricKey?: CryptoKey)`: Encrypts text
- `encryptMetadata(metadata: string, symmetricKey?: CryptoKey)`: Encrypts metadata deterministically
- `encryptVector(vector: number[], symmetricKey?: CryptoKey)`: Encrypts vector data

### 7. Session Management: `Confidential-Copilot\src\services\keyManagement\sessionKeyManager.ts`

Provides functionality for managing key persistence across sessions and tabs:

- `storeSymmetricKeyInSession(key: CryptoKey)`: Securely stores the key in session storage
- `getSymmetricKeyFromSession()`: Retrieves and imports the key from session storage
- `clearSessionKey()`: Removes the key from session storage during logout

## Modified Files

### 1. Auth Store: `Confidential-Copilot\src\store\authStore.ts`

- Implements the `KeyManagementService` integration throughout the authentication flow
- Handles key persistence across sessions and browser tabs
- Manages key recovery and password reset functionality
- Implements cross-tab session synchronization

### 2. Document Processing: `Confidential-Copilot\src\lib\processingUtils.ts`

- Uses encryption functions from the key management service
- Handles document encryption with proper key initialization checks

### 3. Client Processing: `Confidential-Copilot\src\lib\clientProcessing.ts`

- Integrates with the key management service for client-side encryption
- Ensures key availability before encryption operations

### 4. Document Uploader: `Confidential-Copilot\src\components\documents\DocumentUploader.tsx`

- Uses the `useKeyManagement` hook for secure document processing
- Implements proper loading states during key initialization

### 5. Project Page: `Confidential-Copilot\src\app\projects\[id]\page.tsx`

- Integrates with the key management service for project data encryption
- Handles key initialization and error states gracefully

## Key Features and Benefits

### 1. Provider Pattern

The service uses a provider pattern that separates:
- **Storage concerns**: Where and how encrypted keys are stored
- **Cryptographic operations**: How encryption/decryption is performed
- **DCPE functionality**: How deterministic encryption is managed

This separation makes the code:
- More testable through mock providers
- More maintainable with clear boundaries
- More extensible for future changes

### 2. Cross-Device Consistency

DCPE keys are stored in both the database and localStorage:
- Database storage provides cross-device consistency
- localStorage provides faster access on the same device
- Synchronization ensures both sources stay up-to-date

This approach enables:
- Seamless user experience across multiple devices
- Consistent search and filtering on encrypted data
- Better performance through local caching

### 3. Enhanced Security

The service maintains zero-trust principles:
- All encryption/decryption happens client-side
- Keys are always encrypted before storage
- Plaintext keys exist only in memory
- DCPE keys are encrypted with the user's symmetric key

### 4. Session Persistence and Recovery

The service includes robust session management:
- Keys are persisted across page refreshes using session storage
- Support for multi-tab browsing with key recovery
- Automatic key recovery when opening new tabs
- Graceful handling of expired sessions

### 5. Error Handling

The service includes proper error handling:
- Descriptive error messages for debugging
- Fallbacks when a storage method fails
- Non-fatal errors that don't break the user experience
- Proper cleanup of sensitive data

## WebCryptoProvider Fix

A critical issue in the `WebCryptoProvider.decrypt` method was fixed:

```typescript
async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);
    const iv = new Uint8Array(encryptedBuffer.slice(0, 12));
    const data = encryptedBuffer.slice(12); // Use ArrayBuffer directly
    
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
```

The change is in how the encrypted data is handled:
- Original: `const data = new Uint8Array(encryptedBuffer.slice(12))`
- Fixed: `const data = encryptedBuffer.slice(12)`

This ensures the `ArrayBuffer` is passed directly to the Web Crypto API's decrypt method without unnecessary conversion to `Uint8Array`, resolving the "Failed to decrypt DCPE keys" error.

## Conclusion

The Key Management Service provides a robust, modular system for handling encryption keys in the Confidential-Copilot application. Its provider-based architecture ensures clear separation of concerns, making the code more maintainable and extensible. The service maintains zero-trust principles while enabling cross-device consistency for deterministic encryption.

The session persistence layer ensures a seamless user experience across page refreshes and multiple browser tabs, while maintaining the security of the encryption keys. The service's error handling and recovery mechanisms provide resilience against common issues, ensuring users can always access their encrypted data.