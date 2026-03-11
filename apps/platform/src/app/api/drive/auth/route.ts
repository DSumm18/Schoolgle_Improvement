import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/drive/auth
 * Initiates Google Drive OAuth flow for read-only access
 *
 * This is a SEPARATE OAuth flow from the main app authentication.
 * It requests ONLY the drive.readonly scope - no email, profile, or other data.
 *
 * The flow:
 * 1. Frontend calls this endpoint
 * 2. We generate a state token for security
 * 3. We redirect to Google's OAuth consent screen
 * 4. User approves read-only Drive access
 * 5. Google redirects to /api/drive/callback with authorization code
 * 6. We exchange code for access token (never stored in DB, only session)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectUri =
    searchParams.get("redirect_uri") ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/drive/callback`;
  const organizationId = searchParams.get("organizationId");
  const userId = searchParams.get("userId");

  // Build state with CSRF token + org context for persistent connections
  const stateData = {
    csrf: crypto.randomUUID(),
    organizationId: organizationId || null,
    userId: userId || null,
  };
  const state = btoa(JSON.stringify(stateData));

  // Google Drive OAuth configuration - READ ONLY SCOPE
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const scope = "https://www.googleapis.com/auth/drive.readonly";

  if (!clientId) {
    return NextResponse.json(
      { error: "Google Drive Client ID not configured" },
      { status: 500 },
    );
  }

  // Build the OAuth URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.json({
    authUrl: authUrl.toString(),
    state: state,
  });
}
