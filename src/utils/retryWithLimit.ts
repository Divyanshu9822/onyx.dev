/**
 * Maximum number of retries for failed API calls
 */
export const MAX_RETRIES = 3;

/**
 * Delay between retries (in milliseconds)
 */
export const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Maximum number of parallel section generation requests
 */
export const MAX_PARALLEL_SECTION_REQUESTS = 4;

/**
 * Maximum number of parallel section edit requests
 */
export const MAX_PARALLEL_EDIT_REQUESTS = 4;

/**
 * Runs a function with retry logic and exponential backoff
 * @param fn The async function to run with retries
 * @param options Configuration options for the retry logic
 * @returns The result of the function if successful
 * @throws The last error encountered if all retries fail
 */
export async function runWithRetries<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    retryDelayBase?: number;
    onRetry?: (error: Error, attempt: number, maxAttempts: number) => void;
    onFailure?: (error: Error, attempts: number) => T | undefined;
    errorFilter?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    retries = MAX_RETRIES,
    retryDelayBase = RETRY_DELAY_BASE,
    onRetry,
    onFailure,
    errorFilter = () => true
  } = options;

  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if we should retry based on the error filter
      if (!errorFilter(lastError)) {
        throw lastError;
      }
      
      // Check if we should retry
      if (retryCount < retries) {
        if (onRetry) {
          onRetry(lastError, retryCount + 1, retries + 1);
        }
        
        // Calculate delay with exponential backoff
        const delay = retryDelayBase * Math.pow(2, retryCount);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      } else {
        // We've exhausted all retries
        if (onFailure) {
          const fallbackResult = onFailure(lastError, retries + 1);
          if (fallbackResult !== undefined) {
            return fallbackResult;
          }
        }
        
        // If no fallback was provided or it returned undefined, throw the error
        throw lastError;
      }
    }
  }
  
  // This should never be reached due to the throw in the catch block
  // but TypeScript needs it for type safety
  throw new Error('Failed after multiple attempts. Please try again.');
}