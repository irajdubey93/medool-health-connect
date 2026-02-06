/**
 * Medool API Client
 * - Environment-driven base URL
 * - Automatic token attachment
 * - Token refresh on 401
 * - Error envelope parsing
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  setAccessToken,
  isAccessTokenExpired,
  getRefreshToken,
  storeRefreshToken,
  clearAllTokens,
} from "./token-storage";
import { type APIError, type AuthTokens } from "@/types/api";
import { getErrorMessage, isNetworkError, getNetworkErrorMessage } from "./error-messages";

// Environment-driven API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL environment variable is not set. " +
    "Please add it to your .env file."
  );
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }

  try {
    // Use a separate axios instance to avoid interceptor loop
    const response = await axios.post<AuthTokens>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

    // Store new tokens (rotation - old refresh token is now invalid)
    setAccessToken(access_token, expires_in);
    await storeRefreshToken(newRefreshToken);

    return access_token;
  } catch (error) {
    // Refresh failed - clear all tokens
    await clearAllTokens();
    return null;
  }
}

/**
 * Get valid access token (refresh if needed)
 */
async function getValidAccessToken(): Promise<string | null> {
  const currentToken = getAccessToken();
  
  if (currentToken && !isAccessTokenExpired()) {
    return currentToken;
  }

  // Token expired or missing - refresh
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// Request interceptor - attach auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for public endpoints
    const publicEndpoints = [
      "/auth/request-otp",
      "/auth/verify-otp",
      "/auth/refresh",
      "/cities",
      "/tests",
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      const token = await getValidAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<APIError>) => {
    const originalRequest = error.config;

    // Handle network errors
    if (isNetworkError(error)) {
      return Promise.reject(new Error(getNetworkErrorMessage()));
    }

    // Handle 401 - try refresh once
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      // Refresh failed - redirect to login
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    // Parse API error envelope
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      // For validation errors, include the details in the message
      let message: string;
      if (apiError.code === "validation_error" && apiError.details) {
        // Import dynamically to avoid circular dependency issues at module load
        const { formatValidationError } = await import("./error-messages");
        message = formatValidationError(apiError.details);
      } else {
        message = getErrorMessage(apiError.code);
      }
      
      const customError = new Error(message) as Error & {
        code: string;
        details?: Record<string, string[]>;
      };
      customError.code = apiError.code;
      customError.details = apiError.details;
      return Promise.reject(customError);
    }

    // Generic error
    return Promise.reject(
      new Error(error.message || "Something went wrong. Please try again.")
    );
  }
);

export { apiClient };

// Convenience methods
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((res) => res.data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((res) => res.data),

  delete: <T>(url: string) =>
    apiClient.delete<T>(url).then((res) => res.data),
};
