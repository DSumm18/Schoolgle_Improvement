import { buildAppConnectionStatus } from "./app-connection-status";

describe("app connection status", () => {
  it("summarises files for a module-owned connector folder", () => {
    const status = buildAppConnectionStatus("policy-manager", {
      id: "conn-1",
      provider: "google",
      folder_id: "schoolgle-folder",
      folder_name: "Schoolgle",
      is_active: true,
      scan_status: "complete",
      scan_error: null,
      last_scan_at: "2026-05-01T07:00:00.000Z",
      total_files: 23,
      total_folders: 14,
      detected_folders: {
        "Policies/Current Policies": {
          category: "documents",
          files: 2,
          folderId: "policies-current",
        },
        "Policies/Review Due": {
          category: "documents",
          files: 1,
          folderId: "policies-review",
        },
        "Policies/_Archive - Do Not Scan": {
          category: "archive",
          files: 9,
          folderId: "policies-archive",
        },
        "Ofsted Readiness/Safeguarding": {
          category: "documents",
          files: 4,
          folderId: "ofsted-safeguarding",
        },
      },
    });

    expect(status?.connected).toBe(true);
    expect(status?.connectionId).toBe("conn-1");
    expect(status?.primaryPath).toBe("Schoolgle / Policies");
    expect(status?.matchedFiles).toBe(3);
    expect(status?.matchedFolders).toBe(2);
    expect(status?.totalFiles).toBe(23);
    expect(status?.archiveExcluded).toBe(true);
  });

  it("returns disconnected context without pretending files are available", () => {
    const status = buildAppConnectionStatus("ofsted-readiness", null);

    expect(status?.connected).toBe(false);
    expect(status?.connectionId).toBeNull();
    expect(status?.primaryPath).toBe("Schoolgle / Ofsted Readiness");
    expect(status?.matchedFiles).toBe(0);
    expect(status?.sourceOfTruth).toContain("Drive or SharePoint");
  });

  it("rejects unknown app keys", () => {
    expect(buildAppConnectionStatus("unknown-app", null)).toBeNull();
  });
});
