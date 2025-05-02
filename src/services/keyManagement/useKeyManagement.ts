import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { keyManagementService } from './KeyManagementService';

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
  
  return {
    ...state,
    service: keyManagementService,
    
    // Helper functions for convenience
    encryptText: (text: string) => {
      if (!state.isInitialized) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.encryptText(text);
    },
    
    decryptText: (encryptedText: string) => {
      if (!state.isInitialized) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.decryptText(encryptedText);
    },
    
    encryptMetadata: (metadata: string) => {
      if (!state.isInitialized) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.encryptMetadata(metadata);
    },
    
    decryptMetadata: (encryptedMetadata: any) => {
      if (!state.isInitialized) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.decryptMetadata(encryptedMetadata);
    },
    
    encryptVector: (vector: number[]) => {
      if (!state.isInitialized) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.encryptVector(vector);
    },
    
    decryptVector: (encryptedVector: number[]) => {
      if (!state.isInitialized) {
        throw new Error('Key management service not initialized');
      }
      return keyManagementService.decryptVector(encryptedVector);
    }
  };
}