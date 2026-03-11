import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/drive/callback
 * Handles Google Drive OAuth callback and exchanges code for access token.
 *
 * When organizationId and userId are passed via state, the refresh token is
 * persisted server-side in ofsted_drive_connections so the org stays connected
 * until an admin removes access.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Parse state - may contain organizationId and userId for persistent connections
  let organizationId: string | null = null;
  let userId: string | null = null;
  if (stateParam) {
    try {
      const stateData = JSON.parse(atob(stateParam));
      organizationId = stateData.organizationId || null;
      userId = stateData.userId || null;
    } catch {
      // State is just a plain CSRF token (legacy flow)
    }
  }

  // Handle user denial or error
  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/ofsted-readiness?drive_error=${error}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/ofsted-readiness?drive_error=no_code`,
    );
  }

  try {
    // Exchange authorization code for access token
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret =
      process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/drive/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Google Drive credentials not configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      throw new Error("Failed to exchange authorization code for token");
    }

    const tokenData = await tokenResponse.json();

    // If we have org context, persist the connection server-side
    if (organizationId && tokenData.refresh_token) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const tokenExpiry = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null;

        await supabase.from("ofsted_drive_connections").upsert(
          {
            organization_id: organizationId,
            provider: "google",
            folder_id: "root",
            folder_name: "Entire Google Drive",
            access_token_encrypted: tokenData.access_token,
            refresh_token_encrypted: tokenData.refresh_token,
            token_expiry: tokenExpiry,
            connected_by: userId,
            connected_at: new Date().toISOString(),
            is_active: true,
            scan_status: "idle",
            scan_frequency: "weekly",
          },
          {
            onConflict: "organization_id,provider",
          },
        );

        console.log(
          "[Drive Callback] Persisted org-level connection for",
          organizationId,
        );
      } catch (dbErr) {
        console.error("[Drive Callback] Failed to persist connection:", dbErr);
        // Don't fail the whole flow - still pass token to frontend
      }
    }

    // Return the token data in the URL hash (client-side will pick it up)
    const tokenFragment = `#drive_token=${encodeURIComponent(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      }),
    )}`;

    return NextResponse.redirect(
      `${appUrl}/dashboard/ofsted-readiness${tokenFragment}`,
    );
  } catch (error: any) {
    console.error("Drive OAuth callback error:", error);
    return NextResponse.redirect(
      `${appUrl}/dashboard/ofsted-readiness?drive_error=${encodeURIComponent(error.message || "Unknown error")}`,
    );
  }
}
