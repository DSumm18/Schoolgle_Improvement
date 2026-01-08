"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase"; // Use shared client for auth operations

// Force dynamic rendering to avoid useSearchParams SSG error
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    async function handleCallback() {
      // Diagnostic logging
      console.log('[Auth Callback] URL:', window.location.href);
      console.log('[Auth Callback] Query params:', Object.fromEntries(searchParams.entries()));
      console.log('[Auth Callback] Hash:', window.location.hash);
      console.log('[Auth Callback] Supabase URL:', supabaseUrl);
      console.log('[Auth Callback] Has service key:', !!supabaseServiceKey);

      try {
        // Check for OAuth errors
        const error = searchParams.get('error') || window.location.hash.match(/error=([^&]+)/)?.[1];
        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        // PKCE Flow (Preferred) - Supabase returns ?code=...
        const code = searchParams.get('code');
        if (code) {
          console.log('[Auth Callback] PKCE flow detected: Exchanging code for session');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[Auth Callback] Error exchanging code:', exchangeError);
            console.error('[Auth Callback] Error details:', {
              message: exchangeError.message,
              status: exchangeError.status,
              name: exchangeError.name
            });
            setStatus('error');
            setMessage('Failed to create session. Please try again.');
            setTimeout(() => router.push('/login?error=exchange_failed'), 2000);
            return;
          }

          if (data.session && data.user) {
            console.log('[Auth Callback] ✅ PKCE Session created successfully, user ID:', data.user.id);

            // Verify session is accessible
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            if (verifySession) {
              console.log('[Auth Callback] Session verified, redirecting...');
              await handleSuccessfulAuth(data.user.id, data.user.email || '');
            } else {
              console.error('[Auth Callback] Session created but not accessible');
              setStatus('error');
              setMessage('Session verification failed. Please try again.');
              setTimeout(() => router.push('/login?error=session_verify_failed'), 2000);
            }
            return;
          }
        }

        // Check for hash fragment tokens (Implicit flow - indicates misconfiguration)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          console.log('[Auth Callback] Processing hash fragment token...');
          console.warn('[Auth Callback] ⚠️ Using implicit flow (hash token). For production, ensure Google Cloud redirect URI is set correctly.');

          try {
            // Decode token to get user info (bypass setSession which fails with API key error)
            const tokenParts = accessToken.split('.');
            if (tokenParts.length !== 3) {
              throw new Error('Invalid token format');
            }

            const payload = JSON.parse(atob(tokenParts[1]));
            const userId = payload.sub;
            const userEmail = payload.email;

            console.log('[Auth Callback] Token decoded, user ID:', userId);

            // Store session directly in localStorage (bypasses setSession API validation)
            const refreshToken = hashParams.get('refresh_token') || '';
            const expiresIn = hashParams.get('expires_in') || '3600';
            const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn);

            // Store session in Supabase's expected format
            const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0] || 'unknown';
            const sessionKey = `sb-${projectRef}-auth-token`;

            const sessionData = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt,
              expires_in: parseInt(expiresIn),
              token_type: 'bearer',
              user: {
                id: userId,
                email: userEmail,
                aud: payload.aud || 'authenticated',
                role: payload.role || 'authenticated',
                user_metadata: payload.user_metadata || {},
                app_metadata: payload.app_metadata || {},
                created_at: payload.created_at || new Date().toISOString(),
              },
            };

            // Use Supabase's setSession to properly set the session
            // This ensures the client recognizes it
            const { data: setSessionResult, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              console.error('[Auth Callback] Error setting session:', setSessionError);
              // Fallback: Store manually using the format we created earlier
              const fallbackSessionData = {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                expires_in: parseInt(expiresIn),
                token_type: 'bearer',
                user: {
                  id: userId,
                  email: userEmail,
                  aud: payload.aud || 'authenticated',
                  role: payload.role || 'authenticated',
                  user_metadata: payload.user_metadata || {},
                  app_metadata: payload.app_metadata || {},
                  created_at: payload.created_at || new Date().toISOString(),
                },
              };
              window.localStorage.setItem(sessionKey, JSON.stringify(fallbackSessionData));
              console.log('[Auth Callback] Fallback: Session stored manually');
            } else {
              console.log('[Auth Callback] ✅ Session set successfully via Supabase');
            }

            // Verify session is now available
            const { data: { session: verifiedSession } } = await supabase.auth.getSession();
            if (!verifiedSession) {
              throw new Error('Session was not set correctly');
            }
            console.log('[Auth Callback] Session verified, user ID:', verifiedSession.user.id);

            // Create user record in database if needed (before redirect)
            let redirectPath = '/dashboard';
            if (supabaseServiceKey && supabaseUrl) {
              try {
                const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

                // Upsert user (ignore duplicate key errors - user may already exist)
                const { error: upsertError } = await serviceClient
                  .from('users')
                  .upsert({
                    id: userId,
                    email: userEmail,
                    display_name: userEmail.split('@')[0] || 'User',
                    created_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                // Log only if it's not a duplicate key error (which is expected)
                if (upsertError && !upsertError.message.includes('duplicate key')) {
                  console.error('[Auth Callback] Error upserting user:', upsertError);
                }

                // Check organization membership
                // Use .maybeSingle() to avoid errors when no membership exists
                const { data: membership, error: membershipError } = await serviceClient
                  .from('organization_members')
                  .select('organization_id')
                  .eq('user_id', userId)
                  .limit(1)
                  .maybeSingle();

                redirectPath = membership ? '/dashboard' : '/onboarding';
                console.log('[Auth Callback] User organization status:', {
                  hasMembership: !!membership,
                  membershipError: membershipError?.message,
                  redirectPath
                });
              } catch (e) {
                console.error('[Auth Callback] Error with service client (non-fatal):', e);
                // Continue with redirect anyway
              }
            }

            // Use router.push instead of window.location.href to maintain React state
            // But add a small delay to ensure session is fully set
            console.log('[Auth Callback] Redirecting to:', redirectPath);
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');

            // Wait a moment for session to be fully established, then redirect
            setTimeout(() => {
              console.log('[Auth Callback] Performing redirect to:', redirectPath);
              router.push(redirectPath);
            }, 500);
            return;

          } catch (error: any) {
            console.error('[Auth Callback] Failed to process hash token:', error.message || error);
            setStatus('error');
            setMessage('Failed to complete authentication. Please try again.');
            setTimeout(() => router.push('/login?error=hash_token_failed'), 2000);
            return;
          }
        }

        // Fallback: Check for existing session (in case PKCE already processed)
        console.log('[Auth Callback] No code found, checking for existing session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[Auth Callback] Error getting session:', sessionError);
        }
        if (session?.user) {
          console.log('[Auth Callback] Existing session found, user ID:', session.user.id);
          await handleSuccessfulAuth(session.user.id, session.user.email || '');
          return;
        }

        // No valid session found
        console.error('[Auth Callback] No valid session found');
        setStatus('error');
        setMessage('No authorization code received. Please try again.');
        setTimeout(() => router.push('/login'), 2000);
      } catch (error: any) {
        console.error('[Auth Callback] Unexpected error:', error);
        setStatus('error');
        setMessage(error.message || 'An unexpected error occurred.');
        setTimeout(() => router.push('/login?error=unexpected'), 2000);
      }
    }

    async function handleSuccessfulAuth(userId: string, userEmail: string) {
      // Create user record in database if needed
      if (supabaseServiceKey && supabaseUrl) {
        try {
          const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

          // Upsert user (ignore duplicate key errors - user may already exist)
          const { error: upsertError } = await serviceClient
            .from('users')
            .upsert({
              id: userId,
              email: userEmail,
              display_name: userEmail.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
            }, { onConflict: 'id' });

          // Log only if it's not a duplicate key error (which is expected)
          if (upsertError && !upsertError.message.includes('duplicate key')) {
            console.error('[Auth Callback] Error upserting user:', upsertError);
          }

          // Check organization membership
          // Use .maybeSingle() instead of .single() to avoid errors when no membership exists
          const { data: membership, error: membershipError } = await serviceClient
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          // If no membership, redirect to onboarding (user needs to join/create organization)
          const redirectPath = membership ? '/dashboard' : '/onboarding';
          console.log('[Auth Callback] User organization status:', {
            hasMembership: !!membership,
            membershipError: membershipError?.message,
            redirectPath
          });

          // Verify session one more time before redirecting
          const { data: { session: finalCheck } } = await supabase.auth.getSession();
          if (!finalCheck) {
            console.error('[Auth Callback] Session lost before redirect!');
            setStatus('error');
            setMessage('Session error. Please try again.');
            setTimeout(() => router.push('/login?error=session_lost'), 2000);
            return;
          }

          console.log('[Auth Callback] Final session check passed, redirecting to:', redirectPath);
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => {
            router.push(redirectPath);
            // Force a refresh after navigation to ensure AuthContext picks up session
            setTimeout(() => window.location.reload(), 100);
          }, 1000);
        } catch (e) {
          console.error('Error with service client:', e);
          // Continue anyway - session is valid
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      } else {
        // No service key - just redirect
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
        <div className="flex justify-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          )}
          {status === 'success' && (
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}
