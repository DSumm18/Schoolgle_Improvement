import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/ofsted/connections
 * List active drive connections for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: connections, error } = await supabase
    .from("ofsted_drive_connections")
    .select(
      "id, provider, folder_id, folder_name, connected_at, last_scan_at, is_active, scan_frequency, scan_status, scan_error, total_files_scanned, total_evidence_found, connected_by",
    )
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("connected_at", { ascending: false });

  if (error) {
    console.error("Error fetching drive connections:", error);
    return apiError("Failed to fetch drive connections", 500);
  }

  return apiSuccess({
    connections: connections || [],
    total: connections?.length || 0,
  });
});

/**
 * POST /api/ofsted/connections
 * Create or update a drive connection
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const {
    provider,
    folder_id,
    folder_name,
    access_token_encrypted,
    refresh_token_encrypted,
    token_expiry,
    connected_by,
    scan_frequency,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !provider || !folder_id) {
    return apiError(
      "Missing required fields: organization_id, provider, folder_id",
      400,
    );
  }

  if (!["google", "onedrive"].includes(provider)) {
    return apiError('Invalid provider. Must be "google" or "onedrive"', 400);
  }

  const supabase = createServiceRoleClient();

  const upsertData = {
    organization_id: orgId,
    provider,
    folder_id,
    folder_name: folder_name || null,
    access_token_encrypted: access_token_encrypted || null,
    refresh_token_encrypted: refresh_token_encrypted || null,
    token_expiry: token_expiry || null,
    connected_by: connected_by || auth.userId || null,
    connected_at: new Date().toISOString(),
    is_active: true,
    scan_frequency: scan_frequency || "manual",
  };

  const { data, error } = await supabase
    .from("ofsted_drive_connections")
    .upsert(upsertData, {
      onConflict: "organization_id,provider",
    })
    .select(
      "id, provider, folder_id, folder_name, connected_at, last_scan_at, is_active, scan_frequency",
    )
    .single();

  if (error) {
    console.error("Error upserting drive connection:", error);
    return apiError("Failed to save drive connection", 500);
  }

  return apiSuccess({ connection: data });
});

/**
 * PATCH /api/ofsted/connections
 * Refresh access token using stored refresh token, or update scan status
 */
export const PATCH = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { action } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Get the active connection
  const { data: connection, error: fetchError } = await supabase
    .from("ofsted_drive_connections")
    .select("*")
    .eq("organization_id", orgId)
    .eq("provider", "google")
    .eq("is_active", true)
    .single();

  if (fetchError || !connection) {
    return apiError("No active Google Drive connection found", 404);
  }

  if (action === "clear_error") {
    // Simply reset the error state so scanning can be retried
    await supabase
      .from("ofsted_drive_connections")
      .update({ scan_status: "idle", scan_error: null })
      .eq("id", connection.id);

    return apiSuccess({ success: true });
  }

  if (action === "refresh_token") {
    // Refresh the access token using the refresh token
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret =
      process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || !connection.refresh_token_encrypted) {
      return apiError("Cannot refresh token - missing credentials", 400);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token_encrypted,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Connections] Token refresh failed:", errorText);

      // Mark the connection as errored
      await supabase
        .from("ofsted_drive_connections")
        .update({
          scan_status: "error",
          scan_error:
            "Google Drive access has been revoked or expired. An admin needs to reconnect.",
        })
        .eq("id", connection.id);

      return apiError(
        "Token refresh failed - access may have been revoked",
        401,
      );
    }

    const tokenData = await tokenResponse.json();
    const tokenExpiry = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Update stored tokens
    await supabase
      .from("ofsted_drive_connections")
      .update({
        access_token_encrypted: tokenData.access_token,
        token_expiry: tokenExpiry,
        scan_status: "idle",
        scan_error: null,
      })
      .eq("id", connection.id);

    return apiSuccess({
      accessToken: tokenData.access_token,
      expiresAt: tokenExpiry,
    });
  }

  return apiError("Unknown action", 400);
});

/**
 * DELETE /api/ofsted/connections
 * Soft-delete (deactivate) a drive connection
 */
export const DELETE = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  const connectionId = searchParams.get("id");
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!connectionId || !organizationId) {
    return apiError("Missing required parameters: id, organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("ofsted_drive_connections")
    .update({ is_active: false })
    .eq("id", connectionId)
    .eq("organization_id", organizationId)
    .select("id, provider, is_active")
    .single();

  if (error) {
    console.error("Error deactivating drive connection:", error);
    return apiError("Failed to deactivate drive connection", 500);
  }

  if (!data) {
    return apiError("Connection not found", 404);
  }

  return apiSuccess({
    message: "Connection deactivated successfully",
    connection: data,
  });
});
