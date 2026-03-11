"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface DriveTokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  expires_at?: number;
}

interface UseGoogleDriveAccessResult {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Custom hook for managing Google Drive OAuth access
 *
 * This hook:
 * 1. Initiates the Google Drive OAuth flow (read-only scope)
 * 2. Handles the callback and extracts the token from URL hash
 * 3. Stores the token in memory (not in database)
 * 4. Provides methods to use and revoke the token
 *
 * The token is ONLY stored in browser memory and localStorage (session).
 * It is NEVER sent to our backend for storage - privacy-first approach.
 */
export function useGoogleDriveAccess(): UseGoogleDriveAccessResult {
  const [tokenData, setTokenData] = useState<DriveTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedCallback = useRef(false);

  // Check for token in URL hash (OAuth callback)
  useEffect(() => {
    if (hasCheckedCallback.current) return;
    hasCheckedCallback.current = true;

    // Check if we have a token in the URL hash (from OAuth callback)
    const hash = window.location.hash;
    const driveTokenMatch = hash.match(/#drive_token=([^&]+)/);

    if (driveTokenMatch) {
      try {
        const tokenJson = decodeURIComponent(driveTokenMatch[1]);
        const data: DriveTokenData = JSON.parse(tokenJson);

        // Calculate expiration time
        if (data.expires_in) {
          data.expires_at = Date.now() + data.expires_in * 1000;
        }

        // Store in localStorage for persistence across refreshes
        localStorage.setItem("drive_token", JSON.stringify(data));

        // Clean up the URL hash
        window.location.hash = "";

        setTokenData(data);
        console.log("[useGoogleDriveAccess] Token received and stored");
      } catch (err) {
        console.error("[useGoogleDriveAccess] Failed to parse token:", err);
        setError("Failed to process authorization");
      }
      return;
    }

    // Check for token in localStorage (previous session)
    const storedToken = localStorage.getItem("drive_token");
    if (storedToken) {
      try {
        const data: DriveTokenData = JSON.parse(storedToken);

        // Check if token is expired
        if (data.expires_at && Date.now() > data.expires_at) {
          console.log("[useGoogleDriveAccess] Token expired, clearing");
          localStorage.removeItem("drive_token");
          return;
        }

        setTokenData(data);
        console.log("[useGoogleDriveAccess] Token loaded from storage");
      } catch (err) {
        console.error(
          "[useGoogleDriveAccess] Failed to load stored token:",
          err,
        );
        localStorage.removeItem("drive_token");
      }
    }

    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const driveError = urlParams.get("drive_error");
    if (driveError) {
      setError(
        driveError === "access_denied"
          ? "Drive access was denied"
          : "Authorization failed",
      );
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Connect to Google Drive - initiates OAuth flow
  const connect = useCallback(
    async (organizationId?: string, userId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Request the auth URL from our backend, passing org context for persistent connections
        const params = new URLSearchParams();
        if (organizationId) params.set("organizationId", organizationId);
        if (userId) params.set("userId", userId);

        const response = await fetch(`/api/drive/auth?${params}`);
        if (!response.ok) {
          throw new Error("Failed to initialize authorization");
        }

        const { authUrl, state } = await response.json();

        // Store state for validation
        sessionStorage.setItem("drive_oauth_state", state);

        // Redirect to Google's OAuth consent screen
        window.location.href = authUrl;
      } catch (err: any) {
        console.error("[useGoogleDriveAccess] Failed to initiate OAuth:", err);
        setError(err.message || "Failed to connect to Google Drive");
        setIsLoading(false);
      }
    },
    [],
  );

  // Disconnect - clears token
  const disconnect = useCallback(() => {
    localStorage.removeItem("drive_token");
    sessionStorage.removeItem("drive_oauth_state");
    setTokenData(null);
    setError(null);
    console.log("[useGoogleDriveAccess] Disconnected from Google Drive");
  }, []);

  // Check if token is expired
  const isExpired = tokenData?.expires_at
    ? Date.now() > tokenData.expires_at
    : false;

  // Get the access token (null if expired or not connected)
  const accessToken = tokenData && !isExpired ? tokenData.access_token : null;

  return {
    isConnected: !!accessToken,
    isLoading,
    error,
    accessToken,
    connect,
    disconnect,
  };
}
