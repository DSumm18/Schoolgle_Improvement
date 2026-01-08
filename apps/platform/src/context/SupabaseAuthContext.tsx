"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase"; // Use shared client

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
      // Get organization from JWT claims (set by Supabase Auth hooks)
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        setOrganization(null);
        setOrganizationId(null);
        return;
      }

      // Extract organization_id from JWT claims
      const orgIdFromJWT = currentUser.user_metadata?.organization_id ||
        currentUser.app_metadata?.organization_id;

      if (orgIdFromJWT) {
        setOrganizationId(orgIdFromJWT);

        // Ensure session is set before making requests
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token || '',
          });
        }

        // Fetch organization details - ensure we use the authenticated session
        const { data: org, error } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .eq('id', orgIdFromJWT)
          .single();

        if (!error && org) {
          // Get user's role in organization
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgIdFromJWT)
            .eq('user_id', userId)
            .single();

          setOrganization({
            id: org.id,
            name: org.name,
            role: (membership?.role || 'viewer') as Organization['role'],
            organization_type: org.organization_type
          });
        }
      } else {
        // Fallback: Get first organization user is member of
        // Use .maybeSingle() to avoid errors when user has no organization yet
        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id, role, organizations(id, name, organization_type)')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (membership && membership.organizations) {
          const org = membership.organizations as any;
          setOrganizationId(org.id);
          setOrganization({
            id: org.id,
            name: org.name,
            role: membership.role as Organization['role'],
            organization_type: org.organization_type
          });
        } else {
          // User has no organization - this is OK, they'll be redirected to onboarding
          console.log('[AuthContext] User has no organization membership yet');
          setOrganization(null);
          setOrganizationId(null);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
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
      console.error('[AuthContext] Error syncing profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session with retry logic
    async function initializeAuth() {
      try {
        // Wait a moment for localStorage to be available (especially after redirect)
        await new Promise(resolve => setTimeout(resolve, 100));

        // First attempt
        let { data: { session }, error } = await supabase.auth.getSession();

        // If no session, wait a bit longer and try again (for redirect scenarios)
        if (!session && !error) {
          console.log('[AuthContext] No session on first attempt, retrying...');
          await new Promise(resolve => setTimeout(resolve, 300));
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
          error = retry.error;
        }

        if (error) {
          console.error('[AuthContext] Error getting session:', error);
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
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
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
    });

    return () => {
      mounted = false;
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
      console.error('Error signing in with Google:', error);
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
      console.error('Error signing in with Microsoft:', error);
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
      console.error('Error signing out:', error);
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

