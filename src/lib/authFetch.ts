// src/lib/authFetch.ts
import { createClient } from '@/lib/supabase/client';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 3000
};

/**
 * Authentication-aware fetch function that automatically handles tokens
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = defaultRetryOptions
): Promise<Response> {
  const { maxRetries = 3, initialDelay = 500, maxDelay = 3000, onRetry } = retryOptions;
  let attempt = 0;

  while (true) {
    try {
      // Initialize headers if they don't exist
      const headers = new Headers(options.headers || {});
      
      // Get Supabase client
      const supabase = createClient();
      
      // Explicitly get the current session - with error handling
      const { data, error } = await supabase.auth.getSession();

      // If no session after retries, throw a more descriptive error
      if (!data?.session && attempt >= maxRetries) {
        throw new Error("Authentication required. Please ensure you are logged in.");
      }
      
      if (error) {
        console.error("Error getting Supabase session:", error);
      }
      
      const session = data?.session;
      
      // Add auth token if available
      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
        console.debug("Auth token found and set in request headers");
      } else {
        // Try refreshing the session if no token is found
        console.warn("No access token found, attempting to refresh session");
        const { data: refreshData } = await supabase.auth.refreshSession();
        
        if (refreshData?.session?.access_token) {
          headers.set('Authorization', `Bearer ${refreshData.session.access_token}`);
          console.debug("Refreshed token set in request headers");
        } else {
          console.error("Failed to obtain authentication token");
        }
      }
      
      // Make the request with updated headers
      const response = await fetch(url, {
        ...options,
        headers
      });

      // If it's an auth error and we have retries left, retry
      if (response.status === 401 && attempt < maxRetries) {
        attempt++;
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
        console.warn(`Auth failed (attempt ${attempt}), retrying in ${delay}ms...`);
        
        if (onRetry) {
          onRetry(attempt, delay);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
      
    } catch (error) {
      // Handle network errors with retry logic
      if (attempt < maxRetries) {
        attempt++;
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
        
        console.warn(`Network error (attempt ${attempt}), retrying in ${delay}ms...`, error);
        
        if (onRetry) {
          onRetry(attempt, delay);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
}

export async function authFetchJson<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = defaultRetryOptions
): Promise<T> {
  const response = await authFetch(url, options, retryOptions);
  
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
  }
  
  return await response.json() as T;
}