/**
 * OAuth Authorization Endpoint
 *
 * Initiates OAuth flow for Google Drive or OneDrive
 * Generates authorization URL and returns it to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/api-utils';
import {
  generateAuthUrl,
  generateState,
  generateCodeVerifier,
  validateOAuthConfig,
  type OAuthProvider,
} from '@/lib/oauth-config';

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  try {
    const { provider, organizationId } = await req.json();

    if (!provider || !organizationId) {
      return NextResponse.json(
        { error: 'Provider and organizationId are required' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['google', 'microsoft'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "google" or "microsoft"' },
        { status: 400 }
      );
    }

    // Validate OAuth configuration before proceeding
    try {
      validateOAuthConfig(provider as 'google' | 'microsoft');
    } catch (configError: any) {
      console.error('OAuth config validation failed:', configError.message);
      return NextResponse.json(
        {
          error: 'OAuth configuration error',
          details: configError.message,
          code: 'OAUTH_CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    // Generate OAuth parameters
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    // Create the full state with organizationId (this is what gets sent to Google)
    const fullState = `${state}:${organizationId}`;

    // Generate authorization URL
    const authorizationUrl = await generateAuthUrl(
      provider as OAuthProvider,
      state,
      codeVerifier,
      organizationId
    );

    // Verify the URL doesn't contain placeholder values
    if (authorizationUrl.includes('your-') || authorizationUrl.includes('placeholder')) {
      console.error('Generated OAuth URL contains placeholder values!');
      return NextResponse.json(
        {
          error: 'OAuth configuration error',
          details: 'The OAuth URL contains placeholder values. Please check your environment variables.',
          code: 'OAUTH_PLACEHOLDER_ERROR'
        },
        { status: 500 }
      );
    }

    // Store code verifier in session/cookie for callback
    const response = NextResponse.json({
      authorizationUrl,
      state,
    });

    // Store FULL state (with orgId) in cookie - this must match what Google sends back
    response.cookies.set(`oauth_state_${provider}`, fullState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/', // Important: set path to root so it's accessible everywhere
    });

    response.cookies.set(`oauth_verifier_${provider}`, codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/', // Important: set path to root so it's accessible everywhere
    });

    return response;
  } catch (error: any) {
    console.error('OAuth authorize error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
});
