/**
 * Authentication Context
 * - Manages auth state across the app
 * - Handles login, logout, token refresh
 * - Provides user and profile state
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/api-client";
import {
  setAccessToken,
  clearAllTokens,
  storeRefreshToken,
  hasRefreshToken,
  getRefreshToken,
} from "@/lib/token-storage";
import { analytics } from "@/lib/analytics";
import type {
  User,
  Profile,
  AuthTokens,
  OTPRequest,
  OTPResponse,
} from "@/types/api";

interface AuthContextValue {
  // State
  user: User | null;
  profiles: Profile[];
  activeProfile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth actions
  requestOTP: (phone: string) => Promise<OTPResponse>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;

  // Profile actions
  setActiveProfile: (profile: Profile) => void;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Load user data after auth
  const loadUserData = useCallback(async () => {
    try {
      // Fetch profiles
      const profilesData = await api.get<Profile[]>("/profiles");
      setProfiles(profilesData);

      // Set default or first profile as active
      const defaultProfile = profilesData.find((p) => p.is_default) || profilesData[0];
      if (defaultProfile) {
        setActiveProfileState(defaultProfile);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const hasToken = await hasRefreshToken();
        if (!hasToken) {
          setIsLoading(false);
          return;
        }

        // Try to refresh and get user data
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          try {
            const response = await api.post<AuthTokens>("/auth/refresh", {
              refresh_token: refreshToken,
            });
            
            setAccessToken(response.access_token, response.expires_in);
            await storeRefreshToken(response.refresh_token);
            setUser(response.user);
            await loadUserData();
          } catch {
            // Invalid refresh token - clear and continue to login
            await clearAllTokens();
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [loadUserData]);

  // Listen for logout events from API client
  useEffect(() => {
    const handleLogout = async () => {
      await clearAllTokens();
      setUser(null);
      setProfiles([]);
      setActiveProfileState(null);
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // Request OTP
  const requestOTP = useCallback(async (phone: string): Promise<OTPResponse> => {
    const request: OTPRequest = { phone, purpose: "LOGIN" };
    const response = await api.post<OTPResponse>("/auth/request-otp", request);
    analytics.loginStart(phone);
    return response;
  }, []);

  // Verify OTP - NO purpose field as per backend spec
  const verifyOTP = useCallback(
    async (phone: string, otp: string): Promise<void> => {
      const response = await api.post<AuthTokens>("/auth/verify-otp", {
        phone,
        otp,
      });

      // Store tokens
      setAccessToken(response.access_token, response.expires_in);
      await storeRefreshToken(response.refresh_token);

      // Set user
      setUser(response.user);

      // Load profiles
      await loadUserData();

      // Analytics
      const isNewUser = profiles.length === 0;
      analytics.loginSuccess(response.user.id, isNewUser);
    },
    [loadUserData, profiles.length]
  );

  // Logout - send refresh_token to backend
  const logout = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // Ignore logout errors - clear local state anyway
    }

    await clearAllTokens();
    setUser(null);
    setProfiles([]);
    setActiveProfileState(null);
  }, []);

  // Set active profile
  const setActiveProfile = useCallback((profile: Profile) => {
    setActiveProfileState(profile);
  }, []);

  // Refresh profiles
  const refreshProfiles = useCallback(async () => {
    const profilesData = await api.get<Profile[]>("/profiles");
    setProfiles(profilesData);

    // Update active profile if it was deleted
    if (activeProfile) {
      const stillExists = profilesData.find((p) => p.id === activeProfile.id);
      if (!stillExists) {
        const defaultProfile = profilesData.find((p) => p.is_default) || profilesData[0];
        setActiveProfileState(defaultProfile || null);
      }
    }
  }, [activeProfile]);

  const value: AuthContextValue = {
    user,
    profiles,
    activeProfile,
    isAuthenticated,
    isLoading,
    requestOTP,
    verifyOTP,
    logout,
    setActiveProfile,
    refreshProfiles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
