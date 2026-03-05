import { google } from 'googleapis';
import { getServiceAccountAuth } from './google-auth';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];

type DriveClient = ReturnType<typeof google.drive>;

export interface DriveInvoiceFile {
  id: string;
  name: string;
  mimeType: string;
  parentId?: string;
  schoolName?: string;
  createdTime?: string;
  modifiedTime?: string;
  siteName?: string;
}

async function getDriveClient() {
  const auth = await getServiceAccountAuth(DRIVE_SCOPES);
  return google.drive({ version: 'v3', auth });
}

export async function listPendingInvoiceFiles(): Promise<DriveInvoiceFile[]> {
  const folderId = process.env.GOOGLE_DRIVE_INVOICE_FOLDER_ID;
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_INVOICE_FOLDER_ID is not configured.');
  }

  const drive = await getDriveClient();

  async function walkFolder(id: string, inferredSchool?: string): Promise<DriveInvoiceFile[]> {
    const response = await drive.files.list({
      q: `'${id}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,parents,createdTime,modifiedTime,appProperties)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    const entries = response.data.files || [];
    const results: DriveInvoiceFile[] = [];

    for (const entry of entries) {
      if (entry.mimeType === 'application/vnd.google-apps.folder') {
        const nestedSchool = inferredSchool ?? entry.name ?? undefined;
        results.push(...await walkFolder(entry.id!, nestedSchool));
        continue;
      }

      const isSupported = entry.mimeType?.startsWith('application/pdf') || entry.mimeType?.startsWith('image/');
      if (!isSupported) continue;
      if (entry.appProperties?.processed === 'true') continue;

      results.push({
        id: entry.id!,
        name: entry.name || 'Unnamed Invoice',
        mimeType: entry.mimeType || 'application/pdf',
        parentId: id,
        schoolName: inferredSchool,
        createdTime: entry.createdTime ?? undefined,
        modifiedTime: entry.modifiedTime ?? undefined,
        siteName: inferredSchool,
      });
    }

    return results;
  }

  return walkFolder(folderId);
}

export async function downloadDriveFile(fileId: string, mimeType?: string): Promise<Buffer | { data: Buffer; mimeType: string; fileName: string }> {
  const drive = await getDriveClient();

  if (mimeType) {
    // Legacy method signature
    const response = await drive.files.get({
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    }, { responseType: 'arraybuffer' });

    return Buffer.from(response.data as ArrayBuffer);
  } else {
    // New method signature
    const fileMeta = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    });

    const fileMimeType = fileMeta.data.mimeType || 'application/octet-stream';
    const fileName = fileMeta.data.name || 'document';

    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      {
        responseType: 'arraybuffer',
      },
    );

    return {
      data: Buffer.from(response.data as ArrayBuffer),
      mimeType: fileMimeType,
      fileName,
    };
  }
}

export async function markFileAsProcessed(fileId: string): Promise<void> {
  const drive = await getDriveClient();

  await drive.files.update({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      appProperties: {
        processed: 'true',
        processedAt: new Date().toISOString(),
      },
    },
  });
}
