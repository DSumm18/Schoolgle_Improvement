/**
 * Intelligence Scan API
 *
 * Scans connected Google Drive/OneDrive for pupil and staff data files.
 * Parses files and stores results.
 *
 * POST /api/intelligence/scan
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";
import {
  listGoogleFilesRecursive,
} from "@/lib/cloud-service";
import {
  buildPupilDataConnection,
} from "@/lib/intelligence/connectors/pupil-data-connector";
import { parseCensusXML } from "@/lib/intelligence/parsers/census-parser";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const { userId, organizationId } = auth;

  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const supabase = createClient();

  // Check BOTH tables for existing Google Drive connection
  let cloudConnection: any = null;
  let tableName = "";

  // First check school_data_connections (new table)
  const { data: schoolConn } = await supabase
    .from("school_data_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .maybeSingle();

  if (schoolConn) {
    cloudConnection = schoolConn;
    tableName = "school_data_connections";
  } else {
    // Fallback to ofsted_drive_connections (existing table)
    const { data: ofstedConn } = await supabase
      .from("ofsted_drive_connections")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();

    if (ofstedConn) {
      cloudConnection = ofstedConn;
      tableName = "ofsted_drive_connections";
    }
  }

  if (!cloudConnection) {
    return NextResponse.json(
      {
        error: "No cloud storage connection found.",
        help: "Please connect Google Drive first in Settings → Data Connections",
      },
      { status: 404 }
    );
  }

  try {
    // Get access token (stored in access_token_encrypted field)
    // TODO: Implement proper decryption
    const accessToken = cloudConnection.access_token_encrypted;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Access token not available",
          help: "Please reconnect your Google Drive account",
        },
        { status: 401 }
      );
    }

    // List all files in the connected folder
    const files = await listGoogleFilesRecursive(
      accessToken,
      cloudConnection.folder_id || cloudConnection.folderId
    );

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Connected to Google Drive but no files found in the selected folder",
        filesScanned: 0,
        pupilDataFilesFound: 0,
        hint: "Make sure you've uploaded census XML files to your connected Drive folder",
      });
    }

    // Detect pupil data files
    const pupilConnection = await buildPupilDataConnection(
      organizationId,
      files,
      "google_drive",
      cloudConnection.folder_id || cloudConnection.folderId,
      cloudConnection.folder_name
    );

    // PARSE DETECTED FILES
    for (const file of pupilConnection.files) {
      try {
        // Download file content from Google Drive
        const fileResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.fileId}?alt=media`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!fileResponse.ok) {
          throw new Error(`Failed to download file: ${fileResponse.statusText}`);
        }

        const fileContent = await fileResponse.text();

        // Parse based on file type
        if (file.type === 'census_xml') {
          const parseResult = await parseCensusXML(fileContent, {
            id: file.fileId,
            name: file.fileName,
            mimeType: 'application/xml',
            webViewLink: '',
          });

          if (parseResult.success && parseResult.term) {
            file.parsed = true;
            file.recordCount = parseResult.pupilCount;
            file.dataSummary = {
              totalPupils: parseResult.pupilCount,
              censusDate: parseResult.term.censusDate,
              senCount: parseResult.term.senCount,
              senPercentage: parseResult.term.senPercentage,
              fsmCount: parseResult.term.fsmCount,
              fsmPercentage: parseResult.term.fsmPercentage,
              ealCount: parseResult.term.ealCount,
              ealPercentage: parseResult.term.ealPercentage,
            };
          } else {
            file.parsed = false;
            file.parseError = parseResult.errors.join(', ');
          }
        }
      } catch (parseError) {
        console.error(`Failed to parse ${file.fileName}:`, parseError);
        file.parsed = false;
        file.parseError = parseError instanceof Error ? parseError.message : 'Parse failed';
      }

      // Store/update in intelligence_data_sources table
      const { error: upsertError } = await supabase
        .from("intelligence_data_sources")
        .upsert({
          organization_id: organizationId,
          source_type: file.type,
          file_id: file.fileId,
          file_name: file.fileName,
          file_size: file.size,
          file_modified_time: file.modifiedTime,
          provider: file.source,
          status: file.parsed ? "connected" : "error",
          record_count: file.recordCount,
          data_summary: file.dataSummary || {},
          parsed_at: file.parsed ? new Date().toISOString() : null,
          parse_error: file.parseError,
        }, {
          onConflict: "organization_id,source_type"
        });

      if (upsertError) {
        console.error(`Failed to upsert ${file.type}:`, upsertError);
      }
    }

    // Get summary stats
    const censusFile = pupilConnection.files.find(f => f.type === 'census_xml');

    return NextResponse.json({
      success: true,
      connection: tableName,
      filesScanned: files.length,
      pupilDataFilesFound: pupilConnection.files.length,
      pupilDataParsed: pupilConnection.files.filter(f => f.parsed).length,
      summary: {
        totalPupils: censusFile?.recordCount || 0,
        censusDate: censusFile?.dataSummary?.censusDate,
        sourceFile: censusFile?.fileName,
        senPercentage: censusFile?.dataSummary?.senPercentage,
        fsmPercentage: censusFile?.dataSummary?.fsmPercentage,
        ealPercentage: censusFile?.dataSummary?.ealPercentage,
      },
      detectedFiles: pupilConnection.files.map(f => ({
        name: f.fileName,
        type: f.type,
        status: f.parsed ? 'parsed' : 'detected',
        recordCount: f.recordCount,
      })),
    });

  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      {
        error: `Scan failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
});
