// --- Types ---

export interface FileMetadata {
    id: string;
    name: string;
    mimeType: string;
}

export interface FileMetadataExtended extends FileMetadata {
    modifiedTime?: string;
    size?: number;
    webViewLink?: string;
    folderPath?: string;
    parentId?: string;
    isFolder?: boolean;
}

export interface ScanProgress {
    totalFiles: number;
    processedFiles: number;
    currentFile?: string;
    currentFolder?: string;
}

// --- Google Drive Functions ---

/**
 * List files in a single folder (non-recursive)
 */
export async function listGoogleFiles(accessToken: string, folderId: string): Promise<FileMetadata[]> {
    const query = `'${folderId}' in parents and trashed = false`;
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Google Drive API Error Body: ${errorBody}`);
        throw new Error(`Google Drive API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.files;
}

/**
 * Recursively list all files in folder tree
 */
export async function listGoogleFilesRecursive(
    accessToken: string,
    folderId: string,
    onProgress?: (progress: ScanProgress) => void,
    currentPath: string = 'Root'
): Promise<FileMetadataExtended[]> {
    const allFiles: FileMetadataExtended[] = [];

    // Get all items in current folder
    const query = `'${folderId}' in parents and trashed = false`;
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&pageSize=1000`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const items = data.files || [];

    // Separate folders and files
    const folders: FileMetadataExtended[] = [];
    const files: FileMetadataExtended[] = [];

    items.forEach((item: any) => {
        const metadata: FileMetadataExtended = {
            id: item.id,
            name: item.name,
            mimeType: item.mimeType,
            modifiedTime: item.modifiedTime,
            size: item.size ? parseInt(item.size) : undefined,
            webViewLink: item.webViewLink,
            folderPath: currentPath,
            parentId: folderId,
            isFolder: item.mimeType === 'application/vnd.google-apps.folder'
        };

        if (metadata.isFolder) {
            folders.push(metadata);
        } else {
            files.push(metadata);
        }
    });

    // Add files from current folder
    allFiles.push(...files);

    // Report progress
    if (onProgress) {
        onProgress({
            totalFiles: allFiles.length,
            processedFiles: 0,
            currentFolder: currentPath
        });
    }

    // Recursively process subfolders
    for (const folder of folders) {
        const folderPath = `${currentPath} > ${folder.name}`;
        console.log(`[Scan] Entering folder: ${folderPath}`);

        const subFiles = await listGoogleFilesRecursive(
            accessToken,
            folder.id,
            onProgress,
            folderPath
        );

        allFiles.push(...subFiles);
    }

    return allFiles;
}

/**
 * Get detailed metadata for a specific file
 */
export async function getGoogleFileMetadata(
    accessToken: string,
    fileId: string
): Promise<FileMetadataExtended> {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,modifiedTime,size,webViewLink,parents`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        name: data.name,
        mimeType: data.mimeType,
        modifiedTime: data.modifiedTime,
        size: data.size ? parseInt(data.size) : undefined,
        webViewLink: data.webViewLink,
        parentId: data.parents?.[0]
    };
}

/**
 * Download file content
 */
export async function getGoogleFileContent(accessToken: string, fileId: string): Promise<Buffer> {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Google Drive Download error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Export Google Workspace files as text
 * Supports: Google Docs → text/plain, Google Sheets → text/csv
 */
export async function exportGoogleDoc(
    accessToken: string,
    fileId: string,
    mimeType: string
): Promise<string> {
    // Determine export format based on Google Workspace type
    let exportMimeType = 'text/plain';

    if (mimeType === 'application/vnd.google-apps.document') {
        exportMimeType = 'text/plain'; // Google Docs → plain text
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        exportMimeType = 'text/csv'; // Google Sheets → CSV
    } else if (mimeType === 'application/vnd.google-apps.presentation') {
        exportMimeType = 'text/plain'; // Google Slides → plain text
    } else {
        throw new Error(`Unsupported Google Workspace type: ${mimeType}`);
    }

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Google Drive Export error: ${response.statusText}`);
    }

    return await response.text();
}

/**
 * Check if file needs to be re-scanned (based on modification time)
 */
export function shouldRescanFile(
    fileModifiedTime: string,
    lastScannedTime?: string
): boolean {
    if (!lastScannedTime) {
        return true; // Never scanned before
    }

    const fileDate = new Date(fileModifiedTime);
    const scannedDate = new Date(lastScannedTime);

    return fileDate > scannedDate; // File modified after last scan
}

// --- OneDrive Functions ---

/**
 * List files in a single folder (non-recursive)
 */
export async function listOneDriveFiles(accessToken: string, folderId: string): Promise<FileMetadata[]> {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?select=id,name,file`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Map OneDrive items to common metadata
    return data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        mimeType: item.file?.mimeType || 'application/octet-stream'
    }));
}

/**
 * Recursively list all files in OneDrive folder tree
 */
export async function listOneDriveFilesRecursive(
    accessToken: string,
    folderId: string,
    onProgress?: (progress: ScanProgress) => void,
    currentPath: string = 'Root'
): Promise<FileMetadataExtended[]> {
    const allFiles: FileMetadataExtended[] = [];

    // Get all items in current folder
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?select=id,name,file,folder,lastModifiedDateTime,size,webUrl`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = data.value || [];

    // Separate folders and files
    const folders: FileMetadataExtended[] = [];
    const files: FileMetadataExtended[] = [];

    items.forEach((item: any) => {
        const metadata: FileMetadataExtended = {
            id: item.id,
            name: item.name,
            mimeType: item.file?.mimeType || 'application/octet-stream',
            modifiedTime: item.lastModifiedDateTime,
            size: item.size,
            webViewLink: item.webUrl,
            folderPath: currentPath,
            parentId: folderId,
            isFolder: !!item.folder
        };

        if (metadata.isFolder) {
            folders.push(metadata);
        } else {
            files.push(metadata);
        }
    });

    // Add files from current folder
    allFiles.push(...files);

    // Report progress
    if (onProgress) {
        onProgress({
            totalFiles: allFiles.length,
            processedFiles: 0,
            currentFolder: currentPath
        });
    }

    // Recursively process subfolders
    for (const folder of folders) {
        const folderPath = `${currentPath} > ${folder.name}`;
        console.log(`[Scan] Entering folder: ${folderPath}`);

        const subFiles = await listOneDriveFilesRecursive(
            accessToken,
            folder.id,
            onProgress,
            folderPath
        );

        allFiles.push(...subFiles);
    }

    return allFiles;
}

/**
 * Download OneDrive file content
 */
export async function getOneDriveFileContent(accessToken: string, fileId: string): Promise<Buffer> {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`OneDrive Download error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// --- Utility Functions ---

/**
 * Batch process files with rate limiting
 */
export async function batchProcessFiles<T, R>(
    items: T[],
    processFunc: (item: T) => Promise<R>,
    options: {
        batchSize?: number;
        delayMs?: number;
        onProgress?: (current: number, total: number) => void;
    } = {}
): Promise<R[]> {
    const {
        batchSize = 5,
        delayMs = 1000,
        onProgress
    } = options;

    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(item => processFunc(item))
        );

        results.push(...batchResults);

        if (onProgress) {
            onProgress(Math.min(i + batchSize, items.length), items.length);
        }

        // Delay between batches to avoid rate limiting
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}
