import {
  CONNECTOR_BRAND,
  getAppConnectionScope,
  isConnectorArchivePath,
  type SchoolgleAppConnectionScope,
} from "@/lib/schoolgle-connector";

type DetectedFolder = {
  category?: string;
  files?: number;
  folderId?: string;
};

export type SchoolDataConnectionSnapshot = {
  id: string;
  provider: string;
  folder_id: string;
  folder_name: string | null;
  is_active: boolean;
  scan_status: string | null;
  scan_error: string | null;
  last_scan_at: string | null;
  total_files: number | null;
  total_folders: number | null;
  detected_folders: Record<string, DetectedFolder> | null;
};

export type AppConnectionStatus = {
  appKey: string;
  appName: string;
  moduleName: string;
  route: string;
  connectionId: string | null;
  connected: boolean;
  provider: string | null;
  connectorName: string;
  rootFolderName: string;
  primaryPath: string;
  includedPaths: string[];
  sourceOfTruth: string;
  databaseStores: string;
  consumesFrom: string[];
  lastScanAt: string | null;
  scanStatus: string | null;
  scanError: string | null;
  matchedFiles: number;
  matchedFolders: number;
  totalFiles: number;
  totalFolders: number;
  archiveExcluded: boolean;
};

export function buildAppConnectionStatus(
  appKey: string,
  connection: SchoolDataConnectionSnapshot | null,
): AppConnectionStatus | null {
  const scope = getAppConnectionScope(appKey);
  if (!scope) return null;

  if (!connection?.is_active) {
    return buildDisconnectedStatus(scope);
  }

  const detectedFolders = connection.detected_folders || {};
  const includedPaths = scope.includedFolders.map(normalizePath);
  const matchedEntries = Object.entries(detectedFolders).filter(([path]) =>
    isIncludedPath(path, includedPaths),
  );
  const nonArchiveEntries = matchedEntries.filter(
    ([path]) => !isConnectorArchivePath(path),
  );

  return {
    ...baseStatus(scope),
    connectionId: connection.id,
    connected: true,
    provider: connection.provider,
    rootFolderName: connection.folder_name || CONNECTOR_BRAND.homeFolderName,
    primaryPath: `${connection.folder_name || CONNECTOR_BRAND.homeFolderName} / ${scope.primaryFolder}`,
    lastScanAt: connection.last_scan_at,
    scanStatus: connection.scan_status,
    scanError: connection.scan_error,
    matchedFiles: nonArchiveEntries.reduce(
      (sum, [, info]) => sum + Number(info.files || 0),
      0,
    ),
    matchedFolders: nonArchiveEntries.length,
    totalFiles: Number(connection.total_files || 0),
    totalFolders: Number(connection.total_folders || 0),
    archiveExcluded: matchedEntries.length !== nonArchiveEntries.length,
  };
}

function buildDisconnectedStatus(
  scope: SchoolgleAppConnectionScope,
): AppConnectionStatus {
  return {
    ...baseStatus(scope),
    connectionId: null,
    connected: false,
    provider: null,
    rootFolderName: CONNECTOR_BRAND.homeFolderName,
    primaryPath: `${CONNECTOR_BRAND.homeFolderName} / ${scope.primaryFolder}`,
    lastScanAt: null,
    scanStatus: null,
    scanError: null,
    matchedFiles: 0,
    matchedFolders: 0,
    totalFiles: 0,
    totalFolders: 0,
    archiveExcluded: true,
  };
}

function baseStatus(scope: SchoolgleAppConnectionScope) {
  return {
    appKey: scope.appKey,
    appName: scope.appName,
    moduleName: scope.moduleName,
    route: scope.route,
    connectorName: CONNECTOR_BRAND.name,
    includedPaths: scope.includedFolders.map(
      (path) => `${CONNECTOR_BRAND.homeFolderName} / ${path.replace(/\//g, " / ")}`,
    ),
    sourceOfTruth: scope.sourceOfTruth,
    databaseStores: scope.databaseStores,
    consumesFrom: scope.consumesFrom || [],
  };
}

function isIncludedPath(path: string, includedPaths: string[]): boolean {
  const normalizedPath = normalizePath(path);

  return includedPaths.some(
    (includedPath) =>
      normalizedPath === includedPath ||
      normalizedPath.startsWith(`${includedPath}/`),
  );
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}
