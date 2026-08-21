import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

let driveClient: drive_v3.Drive | null = null;
const folderCache = new Map<string, string>();

function getDriveClient(): drive_v3.Drive | null {
  if (driveClient) return driveClient;

  // 1. Prioritize User OAuth2 Refresh Token (Uses 5TB User Quota Directly)
  const oauthClientId = process.env.GDRIVE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.GDRIVE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

  if (oauthClientId && oauthClientSecret && refreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        oauthClientId,
        oauthClientSecret
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      return driveClient;
    } catch (err: any) {
      console.error('[GDrive] Failed to initialize OAuth2 client:', err.message);
    }
  }

  // 2. Fallback to Service Account JWT
  const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
  let privateKey = process.env.GDRIVE_PRIVATE_KEY;
  const jsonKey = process.env.GDRIVE_SERVICE_ACCOUNT_JSON;

  try {
    if (jsonKey) {
      const parsed = JSON.parse(jsonKey.startsWith('{') ? jsonKey : Buffer.from(jsonKey, 'base64').toString('utf-8'));
      const auth = new google.auth.JWT({
        email: parsed.client_email,
        key: parsed.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      driveClient = google.drive({ version: 'v3', auth });
      return driveClient;
    }

    if (clientEmail && privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      driveClient = google.drive({ version: 'v3', auth });
      return driveClient;
    }
  } catch (err: any) {
    console.error('[GDrive] Failed to initialize Google Drive client:', err.message);
  }

  return null;
}

export function isGDriveConfigured(): boolean {
  return Boolean(
    process.env.GDRIVE_REFRESH_TOKEN ||
    process.env.GDRIVE_SERVICE_ACCOUNT_JSON ||
    (process.env.GDRIVE_CLIENT_EMAIL && process.env.GDRIVE_PRIVATE_KEY)
  );
}

export async function getOrCreateFolder(folderName: string, parentId?: string): Promise<string | null> {
  const drive = getDriveClient();
  if (!drive) return null;

  const cacheKey = `${parentId || 'root'}:${folderName}`;
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  const queryParts = [
    `name = '${folderName}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`
  ];
  if (parentId) {
    queryParts.push(`'${parentId}' in parents`);
  }

  try {
    const listRes = await drive.files.list({
      q: queryParts.join(' and '),
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (listRes.data.files && listRes.data.files.length > 0) {
      const id = listRes.data.files[0].id!;
      folderCache.set(cacheKey, id);
      return id;
    }

    // Create folder
    const createRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const newId = createRes.data.id!;
    folderCache.set(cacheKey, newId);
    return newId;
  } catch (err: any) {
    console.error(`[GDrive] Failed to get/create folder '${folderName}':`, err.message);
    return null;
  }
}

import { encryptBuffer } from './crypto.js';

export async function uploadFileToGDrive(
  fileName: string,
  buffer: Buffer,
  _mimeType = 'image/webp',
  folderId?: string
): Promise<{ fileId: string; webViewLink?: string } | null> {
  const drive = getDriveClient();
  if (!drive) return null;

  const targetFolder = folderId || process.env.GDRIVE_ROOT_FOLDER_ID;

  try {
    // 🔒 1. Encrypt buffer with AES-256-GCM (Anti-Ban protection)
    const encryptedBuffer = encryptBuffer(buffer);
    
    // Obfuscate file name to .bin and generic binary octet-stream MIME
    const obfuscatedName = fileName.endsWith('.webp') 
      ? fileName.replace(/\.webp$/, '.bin') 
      : `${fileName}.bin`;

    const stream = new Readable();
    stream.push(encryptedBuffer);
    stream.push(null);

    const res = await drive.files.create({
      requestBody: {
        name: obfuscatedName,
        mimeType: 'application/octet-stream',
        parents: targetFolder ? [targetFolder] : undefined,
      },
      media: {
        mimeType: 'application/octet-stream',
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    if (!res.data.id) throw new Error('No file ID returned by Google Drive');

    return {
      fileId: res.data.id,
      webViewLink: res.data.webViewLink || undefined,
    };
  } catch (err: any) {
    console.error(`[GDrive] Upload failed for '${fileName}':`, err.message);
    throw err;
  }
}
