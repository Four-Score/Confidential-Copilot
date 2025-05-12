/**
 * Utility function for making fetch requests with automatic retry capability
 * Specifically designed to handle 401 errors that may occur during authentication initialization
 */

// Configuration type for retry options
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds between retries (default: 500) */
  baseDelay?: number;
  /** Maximum delay in milliseconds between retries (default: 5000) */
  maxDelay?: number;
  /** Whether to use exponential backoff for delays (default: true) */
  useExponentialBackoff?: boolean;
  /** Status codes that should trigger a retry (default: [401]) */
  retryStatusCodes?: number[];
  /** Custom condition to determine if a response should trigger retry */
  retryCondition?: (response: Response) => boolean | Promise<boolean>;
  /** Optional callback that receives the current retry attempt before retrying */
  onRetry?: (attempt: number, delay: number) => void;
}

/**
 * Fetches a resource with retry logic for failed requests
 * Particularly useful for handling 401 errors during session initialization
 * 
 * @param url URL to fetch
 * @param options Fetch options
 * @param retryOptions Configuration for retry behavior
 * @returns Promise resolving to the fetch Response
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  // Default retry options
  const {
    maxRetries = 3,
    baseDelay = 500,
    maxDelay = 5000,
    useExponentialBackoff = true,
    retryStatusCodes = [401],
    retryCondition,
    onRetry
  } = retryOptions || {};

  let attempt = 0;

  // Create a function that calculates the delay for a specific attempt
  const getDelay = (attempt: number): number => {
    if (!useExponentialBackoff) return baseDelay;
    
    // Calculate delay with exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    
    // Apply maximum delay cap
    return Math.min(exponentialDelay, maxDelay);
  };

  while (attempt <= maxRetries) {
    try {
      // Make the fetch request
      const response = await fetch(url, options);
      
      // If response is ok or we've reached max retries, return it
      if (response.ok) {
        return response;
      }
      
      // Check if we should retry based on status code or custom condition
      const shouldRetryByStatus = retryStatusCodes.includes(response.status);
      const shouldRetryByCondition = retryCondition 
        ? await retryCondition(response)
        : false;
        
      if ((shouldRetryByStatus || shouldRetryByCondition) && attempt < maxRetries) {
        // Calculate delay for this attempt
        const delay = getDelay(attempt);
        
        // Call the onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, delay);
        } else {
          console.log(`Request to ${url} failed with status ${response.status}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        }
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increment attempt counter
        attempt++;
      } else {
        // If we shouldn't retry or have reached max retries, return the response
        return response;
      }
    } catch (error) {
      // For network errors, retry if we haven't reached max retries
      if (attempt < maxRetries) {
        const delay = getDelay(attempt);
        
        if (onRetry) {
          onRetry(attempt + 1, delay);
        } else {
          console.error(`Request to ${url} failed with error: ${error instanceof Error ? error.message : String(error)}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        // Rethrow the error if we've reached max retries
        throw error;
      }
    }
  }

  // This should never be reached due to the return statements above,
  // but TypeScript needs a return statement at the end
  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

/**
 * Helper function to fetch JSON with retry capability
 * 
 * @param url URL to fetch
 * @param options Fetch options
 * @param retryOptions Configuration for retry behavior
 * @returns Promise resolving to the parsed JSON response
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions);
  
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}