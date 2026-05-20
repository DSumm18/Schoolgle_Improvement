import { describe, expect, it } from "vitest";
import { buildGoogleReauthorisationUpsertPayload } from "./connection-reauthorisation";

describe("connection reauthorisation payload", () => {
  it("preserves existing scan metadata while refreshing tokens", () => {
    const payload = buildGoogleReauthorisationUpsertPayload({
      organizationId: "org-1",
      connectedBy: "user-1",
      connectorFolder: { id: "folder-1", name: "Schoolgle" },
      accessToken: "new-access-token",
      refreshTokenFromOAuth: null,
      tokenExpiry: "2026-05-15T12:00:00.000Z",
      connectedAt: "2026-05-15T10:00:00.000Z",
      existingConnection: {
        refresh_token_encrypted: "existing-refresh-token",
        last_scan_at: "2026-05-14T18:23:00.000Z",
        detected_folders: {
          "Ofsted Readiness/Leadership and Governance": {
            category: "documents",
            files: 3,
            folderId: "leadership-folder",
          },
        },
        total_files: 3,
        total_folders: 1,
      },
    });

    expect(payload).toMatchObject({
      organization_id: "org-1",
      provider: "google",
      folder_id: "folder-1",
      folder_name: "Schoolgle",
      connected_by: "user-1",
      connected_at: "2026-05-15T10:00:00.000Z",
      is_active: true,
      scan_status: "complete",
      scan_error: null,
      access_token_encrypted: "new-access-token",
      refresh_token_encrypted: "existing-refresh-token",
      token_expiry: "2026-05-15T12:00:00.000Z",
      last_scan_at: "2026-05-14T18:23:00.000Z",
      total_files: 3,
      total_folders: 1,
    });
    expect(payload.detected_folders).toEqual({
      "Ofsted Readiness/Leadership and Governance": {
        category: "documents",
        files: 3,
        folderId: "leadership-folder",
      },
    });
  });

  it("uses empty scan metadata for a first-time connection", () => {
    const payload = buildGoogleReauthorisationUpsertPayload({
      organizationId: "org-1",
      connectedBy: null,
      connectorFolder: { id: "folder-1", name: "Schoolgle" },
      accessToken: "new-access-token",
      refreshTokenFromOAuth: "new-refresh-token",
      tokenExpiry: null,
      connectedAt: "2026-05-15T10:00:00.000Z",
      existingConnection: null,
    });

    expect(payload).toMatchObject({
      scan_status: "idle",
      scan_error: null,
      detected_folders: {},
      total_files: 0,
      total_folders: 0,
      refresh_token_encrypted: "new-refresh-token",
      last_scan_at: null,
    });
  });
});
