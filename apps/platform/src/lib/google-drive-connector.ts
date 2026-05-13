import {
  CONNECTOR_BRAND,
  SCHOOLGLE_CONNECTOR_FOLDERS,
} from "@/lib/schoolgle-connector";

export type GoogleDriveFolder = {
  id: string;
  name: string;
  mimeType: string;
};

export async function findSchoolgleFolder(
  accessToken: string,
): Promise<GoogleDriveFolder | null> {
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${CONNECTOR_BRAND.homeFolderName.replace(/'/g, "\\'")}'`,
  ].join(" and ");

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
      q: query,
      fields: "files(id,name,mimeType)",
      pageSize: "1",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    })}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.files?.[0] || null;
}

export async function ensureConnectorFolderStructure(
  accessToken: string,
  parentFolderId: string,
): Promise<void> {
  for (const folder of SCHOOLGLE_CONNECTOR_FOLDERS) {
    const topLevelFolder = await findChildFolder(
      accessToken,
      parentFolderId,
      folder.name,
    );
    const appFolder =
      topLevelFolder ||
      (await createDriveFolder(accessToken, {
        name: folder.name,
        parentId: parentFolderId,
      }));

    for (const child of folder.children || []) {
      const existingChild = await findChildFolder(
        accessToken,
        appFolder.id,
        child.name,
      );
      if (!existingChild) {
        await createDriveFolder(accessToken, {
          name: child.name,
          parentId: appFolder.id,
        });
      }
    }
  }
}

export async function findChildFolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string,
): Promise<GoogleDriveFolder | null> {
  const escapedName = folderName.replace(/'/g, "\\'");
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `'${parentFolderId}' in parents`,
    `name = '${escapedName}'`,
  ].join(" and ");

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
      q: query,
      fields: "files(id,name,mimeType)",
      pageSize: "1",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    })}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.files?.[0] || null;
}

export async function createDriveFolder(
  accessToken: string,
  input: { name: string; parentId?: string },
): Promise<GoogleDriveFolder> {
  const body: Record<string, unknown> = {
    name: input.name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (input.parentId) body.parents = [input.parentId];

  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Failed to create ${input.name} folder: ${message}`);
  }

  return res.json();
}
