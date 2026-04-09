import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  uploadToGoogleDrive,
  createGoogleDriveFolder,
  listGoogleFiles,
} from "@/lib/cloud-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Helper to get a valid access token for an org's Google Drive connection.
 * Refreshes the token if expired.
 */
async function getOrgDriveToken(organizationId: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: connection, error } = await supabase
    .from("ofsted_drive_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", "google")
    .eq("is_active", true)
    .single();

  if (error || !connection) {
    throw new Error(
      "No active Google Drive connection found for this organization",
    );
  }

  // Check if token is expired
  const tokenExpiry = connection.token_expiry
    ? new Date(connection.token_expiry)
    : null;
  const isExpired = tokenExpiry && tokenExpiry < new Date();

  if (isExpired && connection.refresh_token_encrypted) {
    // Refresh the token
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret =
      process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET;

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: connection.refresh_token_encrypted,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error("Failed to refresh Google Drive access token");
    }

    const tokenData = await refreshResponse.json();
    const newExpiry = new Date(
      Date.now() + tokenData.expires_in * 1000,
    ).toISOString();

    // Update stored token
    await supabase
      .from("ofsted_drive_connections")
      .update({
        access_token_encrypted: tokenData.access_token,
        token_expiry: newExpiry,
      })
      .eq("organization_id", organizationId)
      .eq("provider", "google");

    return tokenData.access_token;
  }

  return connection.access_token_encrypted;
}

/**
 * POST /api/drive/upload
 * Upload a file, create a folder, or list files in Google Drive for an organization.
 *
 * Body: { action: "upload" | "create_folder" | "list", organization_id: string, ...params }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, organization_id, ...params } = body;

    if (!organization_id) {
      return NextResponse.json(
        { success: false, error: "organization_id is required" },
        { status: 400 },
      );
    }

    const accessToken = await getOrgDriveToken(organization_id);

    switch (action) {
      case "upload": {
        const { file_name, content, mime_type, folder_id } = params;
        if (!file_name || !content) {
          return NextResponse.json(
            { success: false, error: "file_name and content are required" },
            { status: 400 },
          );
        }
        const uploadResult = await uploadToGoogleDrive(
          accessToken,
          file_name,
          content,
          mime_type || "text/plain",
          folder_id,
        );
        return NextResponse.json({ success: true, data: uploadResult });
      }

      case "create_folder": {
        const { folder_name, parent_folder_id } = params;
        if (!folder_name) {
          return NextResponse.json(
            { success: false, error: "folder_name is required" },
            { status: 400 },
          );
        }
        const folderResult = await createGoogleDriveFolder(
          accessToken,
          folder_name,
          parent_folder_id,
        );
        return NextResponse.json({ success: true, data: folderResult });
      }

      case "list": {
        const { folder_id } = params;
        const files = await listGoogleFiles(
          accessToken,
          folder_id || "root",
        );
        return NextResponse.json({ success: true, data: files });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}. Use: upload, create_folder, list`,
          },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("[Drive Upload] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
