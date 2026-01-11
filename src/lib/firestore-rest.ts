
/**
 * @fileoverview A server-only helper library for interacting with the
 * Firestore REST API without using any client-side SDKs. This is to avoid
 * build issues on platforms like Vercel.
 */
import 'server-only';
import { create } from 'njwt';

interface AccessToken {
  token: string;
  expires: number; // Expiry time in seconds since epoch
}

let cachedToken: AccessToken | null = null;

/**
 * Gets a Google OAuth access token using a service account.
 * It caches the token to avoid re-requesting on every call.
 * @returns A valid OAuth access token.
 */
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expires > now + 60) {
    return cachedToken.token;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;

  const claims = {
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
  };

  const jwt = create({
    iss: clientEmail,
    sub: clientEmail,
    ...claims,
  }, privateKey, 'RS256');
  
  // Explicitly set both issued at and expiration times to avoid clock skew issues.
  jwt.setIssuedAt(now);
  jwt.setExpiration(now + 3600); // 1 hour expiry

  const compactJwt = jwt.compact();

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: compactJwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorBody}`);
  }

  const tokenData = await tokenResponse.json();
  
  cachedToken = {
    token: tokenData.access_token,
    expires: now + tokenData.expires_in,
  };

  return cachedToken.token;
}

const getBaseUrl = () => `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Performs a Firestore query using the REST API.
 * @param queryBody - The structured query payload.
 * @returns The query results.
 */
export async function runQuery(queryBody: object): Promise<any> {
    const accessToken = await getAccessToken();
    const url = `${getBaseUrl()}:runQuery`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryBody),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Firestore Query Error: ${error.error.message}`);
    }

    return response.json();
}

/**
 * Creates or overwrites a document using the REST API.
 * @param path - The full document path (e.g., 'users/userId').
 * @param data - The document data in Firestore REST format.
 * @param merge - If true, performs an upsert.
 * @returns The fetch response.
 */
export async function setDocument(path: string, data: any, merge: boolean = false) {
    const accessToken = await getAccessToken();
    let url = `${getBaseUrl()}/${path}`;

    if (merge) {
        const queryParams = new URLSearchParams();
        Object.keys(data.fields).forEach(field => {
            queryParams.append('updateMask.fieldPaths', field);
        });
        url += `?${queryParams.toString()}`;
    }
    
    const method = merge ? 'PATCH' : 'POST';

    return fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}


/**
 * Updates a document using the REST API.
 * @param path - The full document path.
 * @param data - The fields to update.
 * @param updateMask - An array of field paths to update.
 * @returns The fetch response.
 */
export async function updateDocument(path: string, data: any, updateMask: string[]) {
    const accessToken = await getAccessToken();
    const mask = updateMask.map(field => `updateMask.fieldPaths=${field}`).join('&');
    const url = `${getBaseUrl()}/${path}?${mask}`;

    return fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

/**
 * Deletes a document using the REST API.
 * @param path - The full document path.
 * @returns The fetch response.
 */
export async function deleteDocument(path: string) {
    const accessToken = await getAccessToken();
    const url = `${getBaseUrl()}/${path}`;

    return fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
}
