import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  CONNECTOR_BRAND,
  getSafeConnectorFolderTarget,
} from "@/lib/schoolgle-connector";
import {
  createDriveFolder,
  ensureConnectorFolderStructure,
  findSchoolgleFolder,
} from "@/lib/google-drive-connector";
import { getEnabledConnectorAppKeys } from "@/lib/connectors/connector-entitlements";
import { buildGoogleReauthorisationUpsertPayload } from "@/lib/connectors/connection-reauthorisation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectBase = `${appUrl}/dashboard/settings/data-connections`;

  let organizationId: string | null = null;
  let userId: string | null = null;

  if (stateParam) {
    try {
      const stateData = JSON.parse(atob(stateParam));
      organizationId = stateData.organizationId || null;
      userId = stateData.userId || null;
    } catch {
      return NextResponse.redirect(`${redirectBase}?connector_error=bad_state`);
    }
  }

  if (error) {
    return NextResponse.redirect(
      `${redirectBase}?connector_error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !organizationId) {
    return NextResponse.redirect(
      `${redirectBase}?connector_error=missing_context`,
    );
  }

  try {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret =
      process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/data-connections/oauth/callback`;

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
      throw new Error("Failed to exchange authorization code for token");
    }

    const tokenData = await tokenResponse.json();
    const connectorFolder = getSafeConnectorFolderTarget(
      (await findSchoolgleFolder(tokenData.access_token)) ||
        (await createDriveFolder(tokenData.access_token, {
          name: CONNECTOR_BRAND.homeFolderName,
        })),
    );

    if (!connectorFolder) {
      return NextResponse.redirect(
        `${redirectBase}?connector_error=${encodeURIComponent(
          `No ${CONNECTOR_BRAND.homeFolderName} folder found. Create or share a folder called ${CONNECTOR_BRAND.homeFolderName}, then connect again.`,
        )}`,
      );
    }
    const tokenExpiry = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const enabledConnectorAppKeys = await getEnabledConnectorAppKeys(
      supabase,
      organizationId,
    );
    await ensureConnectorFolderStructure(
      tokenData.access_token,
      connectorFolder.id,
      { appKeys: enabledConnectorAppKeys },
    );

    const { data: existingConnection } = await supabase
      .from("school_data_connections")
      .select(
        "refresh_token_encrypted,last_scan_at,detected_folders,total_files,total_folders",
      )
      .eq("organization_id", organizationId)
      .eq("provider", "google")
      .maybeSingle();

    await supabase.from("school_data_connections").upsert(
      buildGoogleReauthorisationUpsertPayload({
        organizationId,
        connectedBy: userId,
        connectorFolder,
        accessToken: tokenData.access_token,
        refreshTokenFromOAuth: tokenData.refresh_token || null,
        tokenExpiry,
        existingConnection,
      }),
      { onConflict: "organization_id,provider" },
    );

    return NextResponse.redirect(`${redirectBase}?connector=connected`);
  } catch (err: unknown) {
    console.error("[Schoolgle Connector] OAuth callback error:", err);
    const message = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      `${redirectBase}?connector_error=${encodeURIComponent(message)}`,
    );
  }
}
