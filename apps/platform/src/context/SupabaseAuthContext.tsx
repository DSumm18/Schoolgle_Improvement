"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase"; // Use shared client
import { safeAuthLog, isAbortError } from "@/lib/auth-safety";

export interface Organization {
  id: string;
  name: string;
  role: "admin" | "slt" | "teacher" | "governor" | "viewer";
  organization_type?: "school" | "trust" | "local_authority";
  urn?: string;
  location?: {
    lat?: number;
    lon?: number;
    town?: string;
    address?: string;
    postcode?: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  organization: Organization | null;
  organizationId: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const router = useRouter();

  // Prevent race conditions: track if fetchOrganization is in progress
  const fetchingOrgRef = useRef<Set<string>>(new Set());

  const fetchOrganization = async (
    userId: string,
    sessionUser?: User | null,
  ) => {
    // Prevent concurrent calls for the same user
    if (fetchingOrgRef.current.has(userId)) {
      console.log(
        "[AuthContext] fetchOrganization already in progress for user:",
        userId,
      );
      return;
    }

    fetchingOrgRef.current.add(userId);

    // Use sessionUser if provided (avoids stale closure over user state)
    const resolvedEmail = sessionUser?.email || user?.email || "";
    const resolvedName =
      sessionUser?.user_metadata?.full_name ||
      user?.user_metadata?.full_name ||
      resolvedEmail.split("@")[0] ||
      "User";

    try {
      console.log(
        "[AuthContext] Fetching organization for user:",
        userId,
        "email:",
        resolvedEmail,
      );

      // Use the server-side profile API which bypasses RLS
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: resolvedEmail,
          displayName: resolvedName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.organization) {
          console.log(
            "[AuthContext] Organization loaded via profile API:",
            data.organization.name,
          );
          setOrganizationId(data.organization.id);
          setOrganization({
            id: data.organization.id,
            name: data.organization.name,
            role: (data.organization.role || "viewer") as Organization["role"],
            organization_type: data.organization.organization_type,
          });
          return;
        }
      }

      // Fallback: try client-side query (may work if session is ready)
      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select(
          "organization_id, role, organizations(id, name, organization_type)",
        )
        .eq("user_id", userId);

      if (membershipError) {
        console.error(
          "[AuthContext] Error fetching memberships:",
          membershipError,
        );
      }

      const validMemberships = memberships || [];
      console.log(
        "[AuthContext] Found",
        validMemberships.length,
        "valid memberships (fallback)",
      );

      if (validMemberships.length > 0) {
        // Extract org_id from JWT metadata to find preferred org
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        const orgIdFromJWT =
          currentUser?.user_metadata?.organization_id ||
          currentUser?.app_metadata?.organization_id;

        const preferred = validMemberships.find(
          (m) => m.organization_id === orgIdFromJWT,
        );
        const membership = preferred || validMemberships[0];
        const org = membership.organizations as any;

        setOrganizationId(org.id);
        setOrganization({
          id: org.id,
          name: org.name,
          role: membership.role as Organization["role"],
          organization_type: org.organization_type,
        });
      } else {
        console.log("[AuthContext] User has no organization membership yet");
        setOrganization(null);
        setOrganizationId(null);
      }
    } catch (error) {
      safeAuthLog(
        "[AuthContext] Error in fetchOrganization reconciliation",
        error,
      );
      setOrganization(null);
      setOrganizationId(null);
    } finally {
      fetchingOrgRef.current.delete(userId);
    }
  };

  const syncUserProfile = async (currentUser: User) => {
    try {
      console.log("[AuthContext] Syncing user profile to database...");
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          displayName:
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split("@")[0] ||
            "User",
        }),
      });

      if (!response.ok) {
        // Don't throw - log and continue (user can still use the app)
        const errorText = await response.text().catch(() => "Unknown error");
        console.warn(
          `[AuthContext] Profile sync failed with status: ${response.status}`,
          errorText,
        );
        return; // Exit early but don't throw
      }

      const data = await response.json();
      console.log("[AuthContext] ✅ Profile sync successful");

      // Track signup/login in analytics
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "user_signup",
          properties: {
            userId: currentUser.id,
            email: currentUser.email,
            isFirstSync: data.isNewUser || false, // Assuming API might return this
          },
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});

      // Update organization state if the profile sync returned new data
      if (data.organization && !organizationId) {
        setOrganizationId(data.organization.id);
        setOrganization(data.organization);
      }
    } catch (error) {
      safeAuthLog("[AuthContext] Error syncing profile", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout — if auth never resolves, stop the loading spinner
    let authResolved = false;
    const safetyTimeout = setTimeout(() => {
      if (mounted && !authResolved) {
        console.warn("[AuthContext] Safety timeout — forcing loading=false");
        setLoading(false);
      }
    }, 10000);

    // Single source of truth: onAuthStateChange fires INITIAL_SESSION on load
    // then SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED for subsequent changes.
    // No need for getSession() — Supabase guarantees INITIAL_SESSION fires.
    let initialized = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, currentSession: Session | null) => {
        if (!mounted) return;

        // Only process INITIAL_SESSION and SIGNED_OUT.
        // After INITIAL_SESSION, ignore redundant SIGNED_IN events.
        // TOKEN_REFRESHED just silently updates the session.
        if (event === "TOKEN_REFRESHED") {
          setSession(currentSession);
          return;
        }

        if (initialized && event === "SIGNED_IN") {
          // Already initialized — ignore duplicate SIGNED_IN events
          return;
        }

        console.log(
          "[AuthContext] Auth event:",
          event,
          currentSession?.user?.id || "no user",
        );

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        try {
          if (currentSession?.user) {
            if (!initialized) {
              initialized = true;
              await fetchOrganization(
                currentSession.user.id,
                currentSession.user,
              );
            }
          } else {
            initialized = false;
            setOrganization(null);
            setOrganizationId(null);
          }
        } catch (error) {
          safeAuthLog("[AuthContext] Error in auth callback", error);
        } finally {
          if (mounted) {
            authResolved = true;
            setLoading(false);
          }
        }
      },
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          // PKCE is enabled by default in Supabase
        },
      });

      if (error) throw error;
      // OAuth redirect happens automatically, no need to handle response
    } catch (error: any) {
      safeAuthLog("Error signing in with Google", error);
      // Provide user-friendly error messages
      if (error.message?.includes("popup")) {
        throw new Error("Pop-up blocked. Please allow pop-ups and try again.");
      }
      throw new Error(error.message || "Failed to sign in with Google");
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // OAuth redirect happens automatically, no need to handle response
    } catch (error: any) {
      safeAuthLog("Error signing in with Microsoft", error);
      // Provide user-friendly error messages
      if (error.message?.includes("popup")) {
        throw new Error("Pop-up blocked. Please allow pop-ups and try again.");
      }
      throw new Error(error.message || "Failed to sign in with Microsoft");
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      safeAuthLog("Error signing out", error);
    } finally {
      // Always clear local state and redirect, even if signOut API fails
      setUser(null);
      setSession(null);
      setOrganization(null);
      setOrganizationId(null);
      // Clear any cached tokens
      if (typeof window !== "undefined") {
        localStorage.removeItem("drive_token");
      }
      router.push("/login");
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrganization(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        organization,
        organizationId,
        signInWithGoogle,
        signInWithMicrosoft,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
};

// Note: Import supabase from @/lib/supabase to use the shared client
