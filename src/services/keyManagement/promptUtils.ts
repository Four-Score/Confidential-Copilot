import { keyManagementService } from './KeyManagementService';

// Global flag to prevent multiple prompts
let isPromptingForPassword = false;

/**
 * Shows the password prompt if Key Management Service is not initialized
 * Uses the modal context to show the password prompt
 * Returns true if KMS is initialized or becomes initialized after password prompt
 */
export async function ensureKeyManagementInitialized(): Promise<boolean> {
  // If KMS is already initialized, nothing to do
  if (keyManagementService.isInitialized()) {
    return true;
  }
  
  // Avoid multiple prompts at the same time
  if (isPromptingForPassword) {
    // Wait for the current prompt to complete
    return new Promise<boolean>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isPromptingForPassword) {
          clearInterval(checkInterval);
          resolve(keyManagementService.isInitialized());
        }
      }, 500);
    });
  }
  
  // Show password prompt via the global modal context
  try {
    isPromptingForPassword = true;
    
    // Get the modal context - we need to do this dynamically since this is a utility function
    // that might be called outside of React components
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('cc-show-password-prompt');
      window.dispatchEvent(event);
    }
    
    // Return a promise that resolves when KMS is initialized
    return new Promise<boolean>((resolve) => {
      const checkInterval = setInterval(() => {
        if (keyManagementService.isInitialized()) {
          clearInterval(checkInterval);
          isPromptingForPassword = false;
          resolve(true);
        }
      }, 500);
      
      // Set a timeout to avoid infinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        isPromptingForPassword = false;
        resolve(keyManagementService.isInitialized());
      }, 60000); // 1 minute timeout
    });
  } catch (error) {
    isPromptingForPassword = false;
    console.error("Error showing password prompt:", error);
    return false;
  }
}