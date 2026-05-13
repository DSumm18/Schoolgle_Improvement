import type { SupabaseClient } from "@supabase/supabase-js";

type GoogleConnectionTokenFields = {
  id: string;
  access_token_encrypted?: string | null;
  refresh_token_encrypted?: string | null;
  token_expiry?: string | null;
};

type RefreshGoogleAccessTokenOptions = {
  supabase: SupabaseClient;
  connection: GoogleConnectionTokenFields;
};

const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export function googleTokenNeedsRefresh(tokenExpiry?: string | null): boolean {
  if (!tokenExpiry) return false;
  const expiresAt = new Date(tokenExpiry).getTime();
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt <= Date.now() + EXPIRY_BUFFER_MS;
}

export async function getValidGoogleAccessToken({
  supabase,
  connection,
}: RefreshGoogleAccessTokenOptions): Promise<string | null> {
  const currentAccessToken = connection.access_token_encrypted || null;

  if (
    currentAccessToken &&
    !googleTokenNeedsRefresh(connection.token_expiry)
  ) {
    return currentAccessToken;
  }

  const refreshToken = connection.refresh_token_encrypted || null;
  if (!refreshToken) return currentAccessToken;

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google Drive credentials not configured");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    throw new Error(
      `Google Drive token refresh failed: ${tokenResponse.status} ${body}`,
    );
  }

  const tokenData = await tokenResponse.json();
  const refreshedAccessToken = tokenData.access_token as string | undefined;
  if (!refreshedAccessToken) {
    throw new Error("Google Drive token refresh did not return an access token");
  }

  const tokenExpiry = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  await supabase
    .from("school_data_connections")
    .update({
      access_token_encrypted: refreshedAccessToken,
      token_expiry: tokenExpiry,
    })
    .eq("id", connection.id);

  return refreshedAccessToken;
}

export function getGoogleReauthoriseMessage(): string {
  return "This Connector needs to be re-authorised so Schoolgle can refresh secure Google Drive access. Disconnect and connect with Google again.";
}
