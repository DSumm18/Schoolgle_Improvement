"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase"; // Use shared client
import { safeAuthLog, isAbortError } from "@/lib/auth-safety";

export interface Organization {
  id: string;
  name: string;
  role: 'admin' | 'slt' | 'teacher' | 'governor' | 'viewer';
  organization_type?: 'school' | 'trust' | 'local_authority';
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const router = useRouter();

  // Prevent race conditions: track if fetchOrganization is in progress
  const fetchingOrgRef = useRef<Set<string>>(new Set());

  const fetchOrganization = async (userId: string) => {
    // Prevent concurrent calls for the same user
    if (fetchingOrgRef.current.has(userId)) {
      console.log('[AuthContext] fetchOrganization already in progress for user:', userId);
      return;
    }

    fetchingOrgRef.current.add(userId);

    try {
      console.log('[AuthContext] Fetching organization for user:', userId);
      // Get organization from JWT claims (set by Supabase Auth hooks)
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        console.warn('[AuthContext] No current user found in verify check');
        setOrganization(null);
        setOrganizationId(null);
        return;
      }

      // Extract organization_id from JWT claims
      const orgIdFromJWT = currentUser.user_metadata?.organization_id ||
        currentUser.app_metadata?.organization_id;

      console.log('[AuthContext] Org ID from JWT:', orgIdFromJWT);

      // CRITICAL FIX: Always verify membership even if orgIdFromJWT is present
      // This prevents "ghost" IDs from sticking in the frontend state

      // Get all memberships for the user
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(id, name, organization_type)')
        .eq('user_id', userId);

      if (membershipError) {
        console.error('[AuthContext] Error fetching memberships:', membershipError);
        // If we can't fetch memberships, we can't reliably reconcile
      }

      const validMemberships = memberships || [];
      console.log('[AuthContext] Found', validMemberships.length, 'valid memberships');

      // 1. Try to find the JWT organization in the valid memberships
      const currentMembership = validMemberships.find(m => m.organization_id === orgIdFromJWT);

      if (orgIdFromJWT && currentMembership && currentMembership.organizations) {
        // JWT ID is valid and user is a member
        console.log('[AuthContext] JWT Org ID is valid and verified:', orgIdFromJWT);
        const org = currentMembership.organizations as any;
        setOrganizationId(org.id);
        setOrganization({
          id: org.id,
          name: org.name,
          role: currentMembership.role as Organization['role'],
          organization_type: org.organization_type
        });
      } else if (validMemberships.length > 0) {
        // JWT ID is missing or invalid (GHOST ID detected) - Use first valid membership
        const fallback = validMemberships[0];
        const org = fallback.organizations as any;
        console.warn('[AuthContext] JWT Org ID mismatch. Falling back to verified membership:', org.id);

        setOrganizationId(org.id);
        setOrganization({
          id: org.id,
          name: org.name,
          role: fallback.role as Organization['role'],
          organization_type: org.organization_type
        });
      } else {
        // User has no organization memberships at all
        console.log('[AuthContext] User has no organization membership yet');
        setOrganization(null);
        setOrganizationId(null);
      }
    } catch (error) {
      safeAuthLog('[AuthContext] Error in fetchOrganization reconciliation', error);
      setOrganization(null);
      setOrganizationId(null);
    } finally {
      fetchingOrgRef.current.delete(userId);
    }
  };

  const syncUserProfile = async (currentUser: User) => {
    try {
      console.log('[AuthContext] Syncing user profile to database...');
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          displayName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User'
        })
      });

      if (!response.ok) {
        // Don't throw - log and continue (user can still use the app)
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`[AuthContext] Profile sync failed with status: ${response.status}`, errorText);
        return; // Exit early but don't throw
      }

      const data = await response.json();
      console.log('[AuthContext] ✅ Profile sync successful');

      // Track signup/login in analytics
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'user_signup',
          properties: {
            userId: currentUser.id,
            email: currentUser.email,
            isFirstSync: data.isNewUser || false // Assuming API might return this
          },
          timestamp: new Date().toISOString()
        })
      }).catch(() => { });

      // Update organization state if the profile sync returned new data
      if (data.organization && !organizationId) {
        setOrganizationId(data.organization.id);
        setOrganization(data.organization);
      }
    } catch (error) {
      safeAuthLog('[AuthContext] Error syncing profile', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    // Get initial session with retry logic
    async function initializeAuth() {
      try {
        // Wait a moment for localStorage to be available (especially after redirect)
        await new Promise(resolve => setTimeout(resolve, 100));

        // First attempt with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth init timeout')), 5000)
        );

        let { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]).catch((err) => {
          console.warn('[AuthContext] getSession timeout or error:', err.message);
          return { data: { session: null }, error: null };
        }) as any;

        // If no session, wait a bit longer and try again (for redirect scenarios)
        if (!session && !error) {
          console.log('[AuthContext] No session on first attempt, retrying...');
          await new Promise(resolve => setTimeout(resolve, 300));
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
          error = retry.error;
        }

        if (error) {
          safeAuthLog('[AuthContext] Error getting session', error);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            console.log('[AuthContext] ✅ Session found, user ID:', session.user.id);
            await syncUserProfile(session.user);
            await fetchOrganization(session.user.id);
          } else {
            console.log('[AuthContext] No session found on initial load');
          }

          setLoading(false);
        }
      } catch (error: any) {
        safeAuthLog('[AuthContext] Error initializing auth', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Set a safety timeout to ensure loading is always cleared
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[AuthContext] Safety timeout triggered, forcing loading=false');
        setLoading(false);
      }
    }, 10000); // 10 second safety timeout

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      try {
        console.log('[AuthContext] Auth state changed:', event, session?.user?.id || 'no user');

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await syncUserProfile(session.user);
            await fetchOrganization(session.user.id);
          } else {
            setOrganization(null);
            setOrganizationId(null);
          }

          setLoading(false);
        }
      } catch (error) {
        safeAuthLog('[AuthContext] Error in onAuthStateChange callback', error);
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // PKCE is enabled by default in Supabase
        },
      });

      if (error) throw error;
      // OAuth redirect happens automatically, no need to handle response
    } catch (error: any) {
      safeAuthLog('Error signing in with Google', error);
      // Provide user-friendly error messages
      if (error.message?.includes('popup')) {
        throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
      }
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // OAuth redirect happens automatically, no need to handle response
    } catch (error: any) {
      safeAuthLog('Error signing in with Microsoft', error);
      // Provide user-friendly error messages
      if (error.message?.includes('popup')) {
        throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
      }
      throw new Error(error.message || 'Failed to sign in with Microsoft');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setOrganization(null);
      setOrganizationId(null);
      router.push('/login');
    } catch (error) {
      safeAuthLog('Error signing out', error);
      throw error;
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

