import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

let cachedAuth: { [key: string]: Promise<JWT> } = {};

function normalizePrivateKey(key?: string): string | undefined {
  return key?.replace(/\\n/g, '\n');
}

export async function getServiceAccountAuth(scopes: string[] = DEFAULT_SCOPES): Promise<JWT> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials are not configured.');
  }

  const scopeKey = scopes.sort().join('|');
  if (!cachedAuth[scopeKey]) {
    cachedAuth[scopeKey] = (async () => {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes,
      });
      await auth.authorize();
      return auth;
    })();
  }

  return cachedAuth[scopeKey];
}

export function clearCachedAuth() {
  cachedAuth = {};
}
