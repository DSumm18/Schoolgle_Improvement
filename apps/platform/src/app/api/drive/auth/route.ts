import { NextRequest, NextResponse } from "next/server";
import { CONNECTOR_GOOGLE_SCOPE } from "@/lib/schoolgle-connector";

/**
 * GET /api/drive/auth
 * Initiates Google Drive OAuth flow for the Schoolgle Connector
 *
 * This is a SEPARATE OAuth flow from the main app authentication.
 * It requests Drive scopes for folder creation plus enhanced scanning.
 *
 * The flow:
 * 1. Frontend calls this endpoint
 * 2. We generate a state token for security
 * 3. We redirect to Google's OAuth consent screen
 * 4. User approves Drive connector access
 * 5. Google redirects to the configured callback with authorization code
 * 6. We exchange code for access and refresh tokens for the connection
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectUri =
    searchParams.get("redirect_uri") ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/drive/callback`;
  const organizationId = searchParams.get("organizationId");
  const userId = searchParams.get("userId");
  const shouldRedirect = searchParams.get("redirect") === "1";

  // Build state with CSRF token + org context for persistent connections
  const stateData = {
    csrf: crypto.randomUUID(),
    organizationId: organizationId || null,
    userId: userId || null,
  };
  const state = btoa(JSON.stringify(stateData));

  // Google Drive OAuth configuration
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const scope = CONNECTOR_GOOGLE_SCOPE;

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

  if (shouldRedirect) {
    return NextResponse.redirect(authUrl.toString());
  }

  return NextResponse.json({
    authUrl: authUrl.toString(),
    state: state,
  });
}
