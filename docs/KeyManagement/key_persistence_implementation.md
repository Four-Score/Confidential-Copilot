# Key Persistence and Authentication Flow Implementation

## Overview

This document details the implementation of key persistence, session management, and authentication flow in the Confidential-Copilot application. These features enable a seamless user experience while maintaining the zero-trust security model.

## Key Features Implemented

1. **Session-Based Key Persistence**
   - Symmetric keys are securely stored in the browser's session storage
   - Enables persistence across page refreshes
   - Maintains security by clearing keys when the browser is closed

2. **Cross-Tab Authentication**
   - Automatically detects when a new tab is opened
   - Attempts to recover keys from session storage
   - Falls back to password prompt when keys are not available

3. **Password Recovery Flow**
   - Modal-based prompt for password re-entry when needed
   - Seamless re-authentication without requiring full login
   - Re-derives encryption keys client-side

4. **Recovery Key Mechanism**
   - Comprehensive recovery flow using the previously generated recovery key
   - Critical for password changes and account recovery
   - User-friendly recovery process

5. **Automatic Key Initialization**
   - Enhanced key management initialization process
   - Automatic recovery attempts from multiple sources
   - Graceful error handling when keys cannot be recovered

## Implementation Details

### 1. Session Key Manager (`src/services/keyManagement/sessionKeyManager.ts`)

The session key manager provides functionality for storing and retrieving the symmetric key using the browser's session storage:

```typescript
/**
 * Stores the symmetric key in session storage
 */
export async function storeSymmetricKeyInSession(key: CryptoKey): Promise<void> {
  try {
    // Export the key to raw format
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    // Convert to base64 for storage
    const keyBase64 = arrayBufferToBase64(rawKey);
    // Store in session storage
    sessionStorage.setItem(SESSION_KEY_NAME, keyBase64);
  } catch (error) {
    console.error('Failed to store key in session storage:', error);
    throw error;
  }
}

/**
 * Retrieves the symmetric key from session storage
 */
export async function getSymmetricKeyFromSession(): Promise<CryptoKey | null> {
  try {
    const keyBase64 = sessionStorage.getItem(SESSION_KEY_NAME);
    if (!keyBase64) return null;
    
    // Convert back to ArrayBuffer
    const keyBuffer = base64ToArrayBuffer(keyBase64);
    
    // Import as CryptoKey
    return await importSymmetricKey(keyBuffer);
  } catch (error) {
    console.error('Failed to retrieve key from session storage:', error);
    return null;
  }
}

/**
 * Clears the symmetric key from session storage
 */
export async function clearSessionKey(): Promise<void> {
  try {
    sessionStorage.removeItem(SESSION_KEY_NAME);
  } catch (error) {
    console.error('Failed to clear key from session storage:', error);
    throw error;
  }
}
```

### 2. Integration with Auth Store (`src/store/authStore.ts`)

Authentication flows have been enhanced to integrate with session storage:

- **Login Flow**:
  - After successful authentication, the symmetric key is stored in session storage
  - The key management service is initialized with the decrypted key

- **Logout Flow**:
  - The symmetric key is cleared from memory and session storage
  - Key management service is cleared

- **Tab Recovery Flow**:
  - Attempts to recover the key from session storage when a new tab is opened
  - Falls back to password re-entry when session storage is not available

### 3. Password Prompt Mechanism (`src/components/auth/PasswordPromptModal.tsx`)

A modal-based password prompt system has been implemented for recovering the symmetric key when session storage is not available:

```typescript
export function PasswordPromptModal({ onClose }: PasswordPromptModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await recoverWithPassword(password);
      if (result.success) {
        onClose(true);
      } else {
        setError(result.error || 'Failed to recover key');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modal UI rendering
}
```

### 4. Key Recovery Context (`src/contexts/PasswordModalContext.tsx`)

A context provider was implemented to manage password prompt visibility and handle key recovery:

```typescript
export const PasswordModalContext = createContext<PasswordModalContextType>({
  isPasswordModalVisible: false,
  showPasswordPrompt: async () => ({ success: false }),
  hidePasswordPrompt: () => {},
});

export const PasswordModalProvider: React.FC<PasswordModalProviderProps> = ({ children }) => {
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const resolveRef = useRef<(result: PromptResult) => void>();
  
  const showPasswordPrompt = useCallback(async (): Promise<PromptResult> => {
    // First check if key is already available
    if (useAuthStore.getState().decryptedSymmetricKey) {
      return { success: true };
    }
    
    setIsPasswordModalVisible(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);
  
  const hidePasswordPrompt = useCallback((success = false) => {
    setIsPasswordModalVisible(false);
    if (resolveRef.current) {
      resolveRef.current({ success });
    }
  }, []);
  
  // Context provider rendering
};
```

### 5. Enhanced Key Management Hook (`src/services/keyManagement/useKeyManagement.ts`)

The key management hook has been enhanced to support key persistence and recovery:

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
  
  // Initialize key service when auth state changes
  useEffect(() => {
    const checkSession = async () => {
      // Skip if already initialized or not authenticated
      if (state.isInitialized || !isAuthenticated || !user) {
        return;
      }
      
      // Initialize from memory key if available
      if (symmetricKey && !state.isInitialized) {
        try {
          const success = await keyManagementService.initialize(user.id, symmetricKey);
          setState({
            isInitialized: success,
            isLoading: false,
            error: success ? null : 'Failed to initialize key management service'
          });
        } catch (error) {
          // Handle error
        }
        return;
      }
      
      // Try recovery methods if no key in memory
      if (!symmetricKey && isAuthenticated) {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
          // First check session storage
          let success = await useAuthStore.getState().checkSessionStorage();
          
          // If that fails, try to recover from session
          if (!success) {
            success = await useAuthStore.getState().recoverKeyFromSession();
          }
          
          if (!success) {
            setState(prev => ({ ...prev, isLoading: false }));
            console.log("All key recovery methods failed");
          }
        } catch (error) {
          // Handle error
        }
      }
    };
    
    checkSession();
  }, [isAuthenticated, user, symmetricKey, state.isInitialized]);
  
  // Additional hook functionality
  
  return {
    ...state,
    service: keyManagementService,
    ensureInitialized: async () => {
      // Implementation to ensure key is available,
      // potentially showing password prompt if needed
    }
  };
}
```

## Usage Examples

### 1. Ensuring Key Availability Before Encryption

```typescript
import { useKeyManagement } from '@/services/keyManagement';

function EncryptionComponent() {
  const { service, isLoading, error, ensureInitialized } = useKeyManagement();
  
  const handleEncrypt = async (text: string) => {
    try {
      await ensureInitialized(); // This will prompt for password if needed
      if (service) {
        const encrypted = service.encryptText(text);
        // Use the encrypted data
      }
    } catch (error) {
      console.error("Failed to encrypt:", error);
    }
  };
  
  // Component rendering
}
```

### 2. Handling New Tab Recovery

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useKeyManagement } from '@/services/keyManagement';
import { usePasswordModalContext } from '@/contexts/PasswordModalContext';

function AppInitializer() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  const { isInitialized } = useKeyManagement();
  const { showPasswordPrompt } = usePasswordModalContext();
  
  useEffect(() => {
    const recoverKey = async () => {
      if (isAuthenticated && !isInitialized) {
        const recovered = await useAuthStore.getState().checkSessionStorage();
        if (!recovered) {
          // Show password prompt if session storage recovery fails
          await showPasswordPrompt();
        }
      }
    };
    
    recoverKey();
  }, [isAuthenticated, isInitialized, showPasswordPrompt]);
  
  return null; // This is just an initializer component
}
```

## Security Considerations

1. **Session Storage Limitations**
   - Session storage is cleared when the browser is closed
   - Not shared between tabs (requires password re-entry in new tabs)
   - Provides better security than localStorage, which persists across browser restarts

2. **Zero-Trust Principles**
   - All cryptographic operations remain client-side
   - Plaintext keys are never stored on the server
   - Keys in session storage are cleared on logout

3. **Key Recovery Security**
   - Password re-entry requires the correct password
   - Recovery key provides a secure backup mechanism
   - Multiple authentication factors can be used for recovery

## Testing and Validation

The key persistence and authentication flow implementation has been thoroughly tested to ensure:

1. Keys persist correctly across page refreshes
2. New tabs handle authentication gracefully
3. Password prompts function correctly for key recovery
4. Recovery keys provide a viable backup mechanism
5. Password changes update keys securely

## Conclusion

The implementation of session-based key persistence, cross-tab authentication, and recovery mechanisms significantly improves the user experience while maintaining the zero-trust security model of the application. These features enable seamless use of the application across page refreshes and multiple browser tabs without compromising on security.