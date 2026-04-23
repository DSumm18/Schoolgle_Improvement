/**
 * OAuth Configuration for Google Drive and Microsoft OneDrive
 *
 * Environment variables needed:
 *
 * Google:
 * - NEXT_PUBLIC_GOOGLE_CLIENT_ID (required)
 * - GOOGLE_CLIENT_SECRET (server-only, required)
 * - NEXT_PUBLIC_APP_URL (required)
 *
 * Microsoft:
 * - NEXT_PUBLIC_MICROSOFT_CLIENT_ID (required)
 * - MICROSOFT_CLIENT_SECRET (server-only, required)
 * - MICROSOFT_TENANT_ID (optional, defaults to 'common')
 */

/**
 * Check if a value looks like a placeholder (not configured)
 */
function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  return lower.includes('your-') ||
         lower.includes('here') ||
         lower.includes('placeholder') ||
         lower.includes('example') ||
         lower.includes('xxx') ||
         value === '';
}

/**
 * Validate OAuth configuration - throw descriptive error if misconfigured
 */
export function validateOAuthConfig(provider: 'google' | 'microsoft' | 'all' = 'all'): void {
  const providers = provider === 'all' ? ['google', 'microsoft'] : [provider];

  for (const p of providers) {
    if (p === 'google') {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;

      if (isPlaceholder(clientId)) {
        throw new Error(
          'OAuth configuration error: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing or set to a placeholder value. ' +
          'Please set a valid Google OAuth Client ID in your environment variables.'
        );
      }
      if (isPlaceholder(clientSecret)) {
        throw new Error(
          'OAuth configuration error: GOOGLE_CLIENT_SECRET is missing or set to a placeholder value. ' +
          'Please set a valid Google OAuth Client Secret in your environment variables.'
        );
      }
      if (isPlaceholder(appUrl)) {
        throw new Error(
          'OAuth configuration error: NEXT_PUBLIC_APP_URL is missing. ' +
          'Please set it to http://localhost:3000 for local development.'
        );
      }
    }

    if (p === 'microsoft') {
      const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

      if (isPlaceholder(clientId)) {
        throw new Error(
          'OAuth configuration error: NEXT_PUBLIC_MICROSOFT_CLIENT_ID is missing or set to a placeholder value.'
        );
      }
      if (isPlaceholder(clientSecret)) {
        throw new Error(
          'OAuth configuration error: MICROSOFT_CLIENT_SECRET is missing or set to a placeholder value.'
        );
      }
    }
  }
}

/**
 * Get OAuth config for a provider with validation
 * This is called at runtime, not module load time
 */
function getProviderConfig(provider: 'google' | 'microsoft') {
  if (provider === 'google') {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (isPlaceholder(clientId)) {
      throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing or invalid');
    }
    if (isPlaceholder(clientSecret)) {
      throw new Error('GOOGLE_CLIENT_SECRET is missing or invalid');
    }
    if (isPlaceholder(appUrl)) {
      throw new Error('NEXT_PUBLIC_APP_URL is missing');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${appUrl}/api/oauth/callback?provider=google`,
      scopes: [
        // Per-file access: allows creating folders/files and reading from them
        // More secure than full drive access - limited to files/folders we create or open
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    };
  }

  // Microsoft
  const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  if (isPlaceholder(clientId)) {
    throw new Error('NEXT_PUBLIC_MICROSOFT_CLIENT_ID is missing or invalid');
  }
  if (isPlaceholder(clientSecret)) {
    throw new Error('MICROSOFT_CLIENT_SECRET is missing or invalid');
  }

  return {
    clientId,
    clientSecret,
    tenantId,
    redirectUri: `${appUrl}/api/oauth/callback?provider=microsoft`,
    scopes: [
      'Files.Read.All',
      'User.Read',
    ],
    authUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
  };
}

// Legacy export for type compatibility - use getProviderConfig() instead
export const OAUTH_CONFIG = {
  get google() {
    return getProviderConfig('google');
  },
  get microsoft() {
    return getProviderConfig('microsoft');
  },
} as const;

export type OAuthProvider = keyof typeof OAUTH_CONFIG;

/**
 * Generate OAuth authorization URL with PKCE
 */
export async function generateAuthUrl(
  provider: OAuthProvider,
  state: string,
  codeVerifier: string,
  organizationId: string,
): Promise<string> {
  const config = getProviderConfig(provider);

  // Generate code challenge for PKCE
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Build auth URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
    state: `${state}:${organizationId}`,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline', // Google: get refresh token
    prompt: 'consent', // Google: force consent to get refresh token
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}> {
  const config = getProviderConfig(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const config = getProviderConfig(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

/**
 * Generate random state parameter for OAuth
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Validate state parameter (prevent CSRF)
 */
export function validateState(state: string, expectedState: string): boolean {
  return state === expectedState;
}
