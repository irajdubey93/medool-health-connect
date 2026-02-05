/**
 * Upload with Exponential Backoff Retry
 * - 1s → 2s → 4s → 8s delays
 * - Max 3 retries
 * - Progress tracking
 */

import { apiClient } from "./api-client";

interface UploadOptions {
  url: string;
  file: File;
  fieldName?: string;
  additionalData?: Record<string, string>;
  onProgress?: (progress: number) => void;
  onRetry?: (attempt: number, error: Error) => void;
}

interface UploadResult<T> {
  data: T;
  attempts: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Calculate delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("network") || error.message.includes("Network")) {
      return true;
    }
    // Timeout
    if (error.message.includes("timeout")) {
      return true;
    }
  }
  
  // Axios error with status code
  const axiosError = error as { response?: { status: number } };
  if (axiosError.response?.status) {
    const status = axiosError.response.status;
    // Retry on server errors (5xx) and request timeout (408)
    return status >= 500 || status === 408 || status === 429;
  }
  
  return false;
}

/**
 * Upload file with retry logic
 */
export async function uploadWithRetry<T>(
  options: UploadOptions
): Promise<UploadResult<T>> {
  const {
    url,
    file,
    fieldName = "file",
    additionalData = {},
    onProgress,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= MAX_RETRIES) {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      
      // Add additional form data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await apiClient.post<T>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            onProgress?.(progress);
          }
        },
      });

      return {
        data: response.data,
        attempts: attempts + 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempts++;

      // Don't retry if not a retryable error or max retries reached
      if (!isRetryableError(error) || attempts > MAX_RETRIES) {
        break;
      }

      // Notify about retry
      onRetry?.(attempts, lastError);

      // Wait before retrying
      const delay = getRetryDelay(attempts - 1);
      await sleep(delay);

      // Reset progress for retry
      onProgress?.(0);
    }
  }

  // All retries exhausted
  throw lastError || new Error("Upload failed after multiple attempts");
}

/**
 * Helper to format retry message
 */
export function getRetryMessage(attempt: number, maxRetries: number): string {
  return `Retrying upload (${attempt}/${maxRetries})...`;
}
