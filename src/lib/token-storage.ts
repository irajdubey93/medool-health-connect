/**
 * Secure Token Storage using IndexedDB
 * - Refresh tokens stored in IndexedDB (not localStorage)
 * - Access tokens kept in-memory only
 * - Token rotation supported
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface MedoolAuthDB extends DBSchema {
  tokens: {
    key: string;
    value: {
      key: string;
      value: string;
      createdAt: number;
    };
  };
}

const DB_NAME = "medool_auth";
const DB_VERSION = 1;
const STORE_NAME = "tokens";
const REFRESH_TOKEN_KEY = "refresh_token";

let dbPromise: Promise<IDBPDatabase<MedoolAuthDB>> | null = null;

/**
 * Get or initialize the IndexedDB connection
 */
async function getDB(): Promise<IDBPDatabase<MedoolAuthDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MedoolAuthDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
      blocked() {
        console.warn("IndexedDB blocked - another tab may have an older version open");
      },
      blocking() {
        console.warn("IndexedDB blocking - closing old connections");
      },
      terminated() {
        console.error("IndexedDB connection terminated unexpectedly");
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

/**
 * Generate a simple obfuscation key based on browser fingerprint
 * Note: This is NOT strong encryption, just obfuscation to prevent casual inspection
 */
function getObfuscationKey(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join("|");
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Simple XOR obfuscation (not cryptographically secure, but prevents casual inspection)
 */
function obfuscate(value: string): string {
  const key = getObfuscationKey();
  let result = "";
  for (let i = 0; i < value.length; i++) {
    result += String.fromCharCode(
      value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result);
}

function deobfuscate(encoded: string): string {
  const key = getObfuscationKey();
  const decoded = atob(encoded);
  let result = "";
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * Store refresh token securely in IndexedDB
 */
export async function storeRefreshToken(token: string): Promise<void> {
  try {
    const db = await getDB();
    const obfuscatedToken = obfuscate(token);
    await db.put(STORE_NAME, {
      key: REFRESH_TOKEN_KEY,
      value: obfuscatedToken,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error("Failed to store refresh token:", error);
    throw new Error("Failed to store authentication data");
  }
}

/**
 * Retrieve refresh token from IndexedDB
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const db = await getDB();
    const record = await db.get(STORE_NAME, REFRESH_TOKEN_KEY);
    
    if (!record) {
      return null;
    }
    
    return deobfuscate(record.value);
  } catch (error) {
    console.error("Failed to retrieve refresh token:", error);
    return null;
  }
}

/**
 * Remove refresh token from IndexedDB (used on logout)
 */
export async function clearRefreshToken(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to clear refresh token:", error);
  }
}

/**
 * Check if refresh token exists
 */
export async function hasRefreshToken(): Promise<boolean> {
  const token = await getRefreshToken();
  return token !== null;
}

/**
 * Clear all auth data (full logout)
 */
export async function clearAllAuthData(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error("Failed to clear auth data:", error);
  }
}

// In-memory access token storage
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Store access token in memory (never persisted)
 */
export function setAccessToken(token: string, expiresInSeconds: number): void {
  accessToken = token;
  // Set expiry with 2-minute buffer for refresh
  tokenExpiresAt = Date.now() + (expiresInSeconds - 120) * 1000;
}

/**
 * Get access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Check if access token is expired or about to expire
 */
export function isAccessTokenExpired(): boolean {
  if (!accessToken || !tokenExpiresAt) {
    return true;
  }
  return Date.now() >= tokenExpiresAt;
}

/**
 * Clear access token from memory
 */
export function clearAccessToken(): void {
  accessToken = null;
  tokenExpiresAt = null;
}

/**
 * Clear all tokens (both memory and IndexedDB)
 */
export async function clearAllTokens(): Promise<void> {
  clearAccessToken();
  await clearAllAuthData();
}
