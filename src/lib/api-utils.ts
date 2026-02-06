/**
 * API Response Utilities
 * Safe extraction for varying API response structures
 */

import type { PaginatedResponse } from "@/types/api";

/**
 * Safely extract items array from API response
 * Handles various response structures:
 * - Direct array
 * - { items: [...] }
 * - { data: [...] }
 * - { data: { items: [...] } }
 * - { results: [...] }
 */
export function extractItems<T>(response: unknown): T[] {
  if (!response || typeof response !== "object") {
    console.error("Invalid response:", typeof response);
    return [];
  }

  // Direct array
  if (Array.isArray(response)) {
    return response;
  }

  const r = response as Record<string, unknown>;

  // Try common wrapper patterns
  if (Array.isArray(r.items)) return r.items;
  if (Array.isArray(r.data)) return r.data;
  if (Array.isArray(r.results)) return r.results;

  // Nested patterns
  if (r.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.results)) return d.results;
  }

  console.error("Unknown response structure:", Object.keys(r));
  return [];
}

/**
 * Normalize API response to PaginatedResponse format
 * Ensures consistent pagination structure regardless of backend format
 */
export function normalizePaginatedResponse<T>(
  response: unknown,
  params: { limit?: number; offset?: number } = {}
): PaginatedResponse<T> {
  const items = extractItems<T>(response);
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  // If response has pagination info, use it
  if (response && typeof response === "object") {
    const r = response as Record<string, unknown>;
    
    return {
      items,
      total: typeof r.total === "number" ? r.total : items.length + offset,
      limit: typeof r.limit === "number" ? r.limit : limit,
      offset: typeof r.offset === "number" ? r.offset : offset,
      has_more: typeof r.has_more === "boolean" 
        ? r.has_more 
        : (typeof r.hasMore === "boolean" ? r.hasMore : items.length >= limit),
    };
  }

  // Fallback for direct array
  return {
    items,
    total: items.length + offset,
    limit,
    offset,
    has_more: items.length >= limit,
  };
}
