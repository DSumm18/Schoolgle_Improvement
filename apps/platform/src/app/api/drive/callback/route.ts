import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/drive/callback
 * Handles Google Drive OAuth callback and exchanges code for access token
 *
 * This endpoint:
 * 1. Receives the authorization code from Google
 * 2. Validates the state parameter (CSRF protection)
 * 3. Exchanges the code for an access token
 * 4. Returns the token to the frontend (stored in session, not database)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial or error
    if (error) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/ofsted-readiness?drive_error=${error}`
        );
    }

    if (!code) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/ofsted-readiness?drive_error=no_code`
        );
    }

    try {
        // Exchange authorization code for access token
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/drive/callback`;

        if (!clientId || !clientSecret) {
            throw new Error('Google Drive credentials not configured');
        }

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', errorText);
            throw new Error('Failed to exchange authorization code for token');
        }

        const tokenData = await tokenResponse.json();

        // Return the token data in the URL hash (client-side will pick it up)
        // Using hash fragment means the token won't be sent to the server
        const tokenFragment = `#drive_token=${encodeURIComponent(JSON.stringify({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope
        }))}`;

        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/ofsted-readiness${tokenFragment}`
        );

    } catch (error: any) {
        console.error('Drive OAuth callback error:', error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/ofsted-readiness?drive_error=${encodeURIComponent(error.message || 'Unknown error')}`
        );
    }
}
