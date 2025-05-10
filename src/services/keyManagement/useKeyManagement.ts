import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { keyManagementService } from './KeyManagementService';
import { ensureKeyManagementInitialized } from './promptUtils';


interface KeyManagementState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for using the key management service in React components
 */
export function useKeyManagement() {
  const [state, setState] = useState<KeyManagementState>({
    isInitialized: false,
    isLoading: false,
    error: null
  });
  
  const user = useAuthStore((state) => state.user);
  const symmetricKey = useAuthStore((state) => state.decryptedSymmetricKey);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  
  useEffect(() => {
    // Update the checkSession function in the useEffect:

  const checkSession = async () => {
    // Skip if already initialized or not authenticated
    if (state.isInitialized || !isAuthenticated || !user) {
      return;
    }
    
    // If we have a symmetric key but service isn't initialized,
    // try to initialize from the key we have
    if (symmetricKey && !state.isInitialized) {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const success = await keyManagementService.initialize(user.id, symmetricKey);
        setState({
          isInitialized: success,
          isLoading: false,
          error: success ? null : 'Failed to initialize key management service'
        });
      } catch (error) {
        console.error('Error initializing key management service from hook:', error);
        setState({
          isInitialized: false,
          isLoading: false,
          error: `Initialization error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
      return;
    }
    
    // If no key in memory but we're authenticated, try recovery options
    if (!symmetricKey && isAuthenticated) {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        // First check session storage
        let success = await useAuthStore.getState().checkSessionStorage();
        
        // If that fails, try to recover from session (new tab case)
        if (!success) {
          console.log("Session storage check failed, trying session recovery");
          success = await useAuthStore.getState().recoverKeyFromSession();
        }
        
        if (!success) {
          setState(prev => ({ ...prev, isLoading: false }));
          console.log("All key recovery methods failed");
        }
      } catch (error) {
        console.error('Error during key recovery:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };
    
  checkSession();
  }, [isAuthenticated, user, symmetricKey, state.isInitialized]);

  useEffect(() => {
    let isMounted = true;
    
    async function initializeService() {
      if (!isAuthenticated || !user || !symmetricKey) {
        return;
      }
      
      // If already initialized, don't reinitialize
      if (state.isInitialized) {
        return;
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const success = await keyManagementService.initialize(
          user.id,
          symmetricKey
        );
        
        if (isMounted) {
          setState({
            isInitialized: success,
            isLoading: false,
            error: success ? null : 'Failed to initialize key management service'
          });
        }
      } catch (error) {
        console.error('Error initializing key management service', error);
        
        if (isMounted) {
          setState({
            isInitialized: false,
            isLoading: false,
            error: `Initialization error: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
    }
    
    initializeService();
    
    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, symmetricKey, state.isInitialized]);
  
  // Clear state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      keyManagementService.clear();
      setState({
        isInitialized: false,
        isLoading: false,
        error: null
      });
    }
  }, [isAuthenticated]);
  
  // Function to ensure KMS is initialized
  const ensureInitialized = async () => {
    if (!state.isInitialized) {
      const success = await ensureKeyManagementInitialized();
      if (success) {
        setState({
          isInitialized: true,
          isLoading: false,
          error: null
        });
      }
      return success;
    }
    return true;
  };
  
  return {
    ...state,
    service: keyManagementService,
    ensureInitialized,
    
    // Helper functions for convenience
    encryptText: async (text: string) => {
      if (!(await ensureInitialized())) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.encryptText(text);
    },
    
    decryptText: async (encryptedText: string) => {
      if (!(await ensureInitialized())) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.decryptText(encryptedText);
    },
    
    encryptMetadata: async (metadata: any) => {
      if (!(await ensureInitialized())) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.encryptMetadata(metadata);
    },
    
    decryptMetadata: async (encryptedMetadata: any) => {
      if (!(await ensureInitialized())) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.decryptMetadata(encryptedMetadata);
    },
    
    encryptVector: async (vector: number[]) => {
      if (!(await ensureInitialized())) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.encryptVector(vector);
    },
    
    decryptVector: async (encryptedVector: number[]) => {
      if (!(await ensureInitialized())) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.decryptVector(encryptedVector);
    }
  };
}