type ConnectorFolder = {
  id: string;
  name: string;
};

type DetectedFolderMap = Record<
  string,
  { category?: string; files?: number; folderId?: string }
>;

export type ExistingGoogleConnectionForReauthorisation = {
  refresh_token_encrypted: string | null;
  last_scan_at: string | null;
  detected_folders: DetectedFolderMap | null;
  total_files: number | null;
  total_folders: number | null;
};

export function buildGoogleReauthorisationUpsertPayload(input: {
  organizationId: string;
  connectedBy: string | null;
  connectorFolder: ConnectorFolder;
  accessToken: string;
  refreshTokenFromOAuth: string | null;
  tokenExpiry: string | null;
  connectedAt?: string;
  existingConnection: ExistingGoogleConnectionForReauthorisation | null;
}) {
  const hasExistingScan = Boolean(input.existingConnection?.last_scan_at);

  return {
    organization_id: input.organizationId,
    provider: "google",
    folder_id: input.connectorFolder.id,
    folder_name: input.connectorFolder.name,
    connected_by: input.connectedBy,
    connected_at: input.connectedAt || new Date().toISOString(),
    is_active: true,
    scan_status: hasExistingScan ? "complete" : "idle",
    scan_error: null,
    detected_folders: input.existingConnection?.detected_folders || {},
    total_files: input.existingConnection?.total_files || 0,
    total_folders: input.existingConnection?.total_folders || 0,
    last_scan_at: input.existingConnection?.last_scan_at || null,
    access_token_encrypted: input.accessToken,
    refresh_token_encrypted:
      input.refreshTokenFromOAuth ||
      input.existingConnection?.refresh_token_encrypted ||
      null,
    token_expiry: input.tokenExpiry,
  };
}
