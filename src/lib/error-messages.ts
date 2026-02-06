/**
 * Backend Error Code → UI Message Mapping
 * Maps API error codes to user-friendly messages
 */

import { ERROR_CODES, type ErrorCode } from "@/types/api";

type ErrorMessageMap = {
  [key in ErrorCode]: string;
};

export const ERROR_MESSAGES: ErrorMessageMap = {
  // Authentication
  [ERROR_CODES.INVALID_OTP]: "Invalid OTP. Please try again.",
  [ERROR_CODES.TOO_MANY_ATTEMPTS]: "Too many failed attempts. Request a new OTP.",
  [ERROR_CODES.OTP_COOLDOWN]: "Please wait before requesting another OTP.",
  [ERROR_CODES.RATE_LIMIT]: "Too many requests. Please wait a moment.",
  [ERROR_CODES.RATE_LIMITED]: "Too many requests. Please wait a moment.",
  [ERROR_CODES.TOKEN_EXPIRED]: "Session expired. Refreshing...",
  [ERROR_CODES.INVALID_REFRESH_TOKEN]: "Session expired. Please log in again.",
  [ERROR_CODES.UNAUTHORIZED]: "Please log in again.",

  // Profile & Address
  [ERROR_CODES.USER_TYPE_LOCKED]: "Cannot change patient type after booking.",
  [ERROR_CODES.PROFILE_INACTIVE]: "This profile is no longer active.",
  [ERROR_CODES.DUPLICATE_SELF]: "Only one Self profile allowed.",
  [ERROR_CODES.NOT_FOUND]: "Not found.",

  // Quote & Order
  [ERROR_CODES.QUOTE_EXPIRED]: "Quote expired. Please create a new quote.",
  [ERROR_CODES.QUOTE_NOT_DRAFT]: "Quote already finalized.",
  [ERROR_CODES.QUOTE_NOT_FINALIZED]: "Please select a lab first.",
  [ERROR_CODES.INVALID_LAB_SELECTION]: "Selected lab is no longer available.",
  [ERROR_CODES.COUPON_LIMIT_EXCEEDED]: "Coupon limit reached. Please remove coupon.",
  [ERROR_CODES.CAPACITY_EXCEEDED]: "Selected slot is no longer available.",

  // Cancellation
  [ERROR_CODES.CANNOT_CANCEL_AFTER_DISPATCH]: "Cannot cancel — rider already assigned.",
  [ERROR_CODES.CANNOT_CANCEL_AFTER_COLLECTION]: "Cannot cancel — samples already collected.",
  [ERROR_CODES.ORDER_NOT_CANCELLABLE]: "This order cannot be cancelled.",

  // Generic
  [ERROR_CODES.VALIDATION_ERROR]: "Validation error", // Will be replaced with details if available
  [ERROR_CODES.FORBIDDEN]: "You don't have permission to do this.",
  [ERROR_CODES.INTERNAL_ERROR]: "Something went wrong. Please try again.",
};

/**
 * Format validation error with field details
 */
export function formatValidationError(
  details: Record<string, string[]> | undefined
): string {
  if (!details || Object.keys(details).length === 0) {
    return "Please check your input and try again.";
  }
  
  // Get the first error message from details
  const firstField = Object.keys(details)[0];
  const firstError = details[firstField]?.[0];
  
  if (firstError) {
    // Capitalize field name and format nicely
    const fieldName = firstField.replace(/_/g, " ");
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${firstError}`;
  }
  
  return "Please check your input and try again.";
}

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(code: string | undefined): string {
  if (!code) {
    return "Something went wrong. Please try again.";
  }
  
  return ERROR_MESSAGES[code as ErrorCode] || "Something went wrong. Please try again.";
}

/**
 * Parse validation errors into field-specific messages
 */
export function parseValidationErrors(
  details: Record<string, string[]> | undefined
): Map<string, string> {
  const errors = new Map<string, string>();
  
  if (!details) {
    return errors;
  }
  
  Object.entries(details).forEach(([field, messages]) => {
    errors.set(field, messages[0] || "Invalid value");
  });
  
  return errors;
}

/**
 * Get generic network error message
 */
export function getNetworkErrorMessage(): string {
  return "No internet connection. Please check your connection and try again.";
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message === "Network Error" ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch")
    );
  }
  return false;
}
