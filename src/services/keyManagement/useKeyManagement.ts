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
    isInitialized: keyManagementService.isInitialized(), // Initialize with current service state
    isLoading: false,
    error: null
  });
  
  const user = useAuthStore((state) => state.user);
  const symmetricKey = useAuthStore((state) => state.decryptedSymmetricKey);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  
  // Single, consolidated initialization effect
  useEffect(() => {
    let isMounted = true;
    let initializationAttempted = false;
    
    async function initializeKeyService() {
      // Skip initialization if already initialized or in progress
      if (state.isInitialized || state.isLoading || initializationAttempted) {
        return;
      }
      
      // Skip if we don't have authentication credentials
      if (!isAuthenticated || !user) {
        // Clear service on logout
        if (keyManagementService.isInitialized()) {
          keyManagementService.clear();
          if (isMounted) {
            setState({
              isInitialized: false,
              isLoading: false,
              error: null
            });
          }
        }
        return;
      }
      
      initializationAttempted = true;
      
      // Set loading state
      if (isMounted) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }
      
      try {
        // Case 1: We have the symmetric key in memory - direct initialization
        if (symmetricKey) {
          console.log("Initializing key management service with symmetric key in memory");
          const success = await keyManagementService.initialize(user.id, symmetricKey);
          
          if (isMounted) {
            setState({
              isInitialized: success,
              isLoading: false,
              error: success ? null : 'Failed to initialize key management service'
            });
          }
          
          if (success) {
            console.log("Key management service successfully initialized");
          } else {
            console.error("Key management service initialization failed");
          }
          
          return;
        }
        
        // Case 2: No symmetric key but authenticated - try recovery methods
        console.log("No symmetric key in memory, trying recovery methods");
        
        // First check session storage
        let success = await useAuthStore.getState().checkSessionStorage();
        
        if (success) {
          console.log("Successfully recovered key from session storage");
          // The auth store has updated the symmetric key, but we need to wait for the next render
          return;
        }
        
        // If session storage fails, try other recovery methods
        console.log("Session storage recovery failed, trying session recovery");
        success = await useAuthStore.getState().recoverKeyFromSession();
        
        if (success) {
          console.log("Successfully recovered key from session");
          // The auth store has updated the symmetric key, but we need to wait for the next render
          return;
        }
        
        // If all recovery methods fail, we remain uninitialized but not in an error state
        // This allows components to trigger password prompts as needed
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
        console.log("All key recovery methods failed, awaiting password entry");
        
      } catch (error) {
        console.error("Error during key management service initialization:", error);
        if (isMounted) {
          setState({
            isInitialized: false,
            isLoading: false,
            error: `Initialization error: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
    }
    
    initializeKeyService();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, symmetricKey, state.isInitialized, state.isLoading]);
  
  // Function to ensure KMS is initialized on-demand
  const ensureInitialized = async () => {
    // If already initialized, return immediately
    if (state.isInitialized) return true;
    
    // If not authenticated or no user, initialization will fail
    if (!isAuthenticated || !user) return false;
    
    // If already loading, wait for completion
    if (state.isLoading) {
      const maxWaitTime = 5000; // 5 seconds timeout
      const startTime = Date.now();
      
      return new Promise<boolean>((resolve) => {
        const checkInterval = setInterval(() => {
          if (keyManagementService.isInitialized()) {
            clearInterval(checkInterval);
            setState(prev => ({ ...prev, isInitialized: true }));
            resolve(true);
          } else if (Date.now() - startTime > maxWaitTime) {
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 100);
      });
    }
    
    // Try to initialize using the prompt utility
    const success = await ensureKeyManagementInitialized();
    
    if (success) {
      setState({
        isInitialized: true,
        isLoading: false,
        error: null
      });
    }
    
    return success;
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