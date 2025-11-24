interface FileMetadata {
    id: string;
    name: string;
    mimeType: string;
}

export async function listGoogleFiles(accessToken: string, folderId: string): Promise<FileMetadata[]> {
    const query = `'${folderId}' in parents and trashed = false`;
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files;
}

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
        mimeType: item.file?.mimeType || 'application/octet-stream' // OneDrive might not return mimeType in basic select
    }));
}

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
