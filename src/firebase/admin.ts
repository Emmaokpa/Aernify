
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import 'server-only';

/**
 * Initializes the Firebase Admin SDK, reusing the existing app instance if one exists.
 * This is the correct way to initialize in serverless environments to avoid errors.
 * @returns The initialized Firebase Admin App instance.
 */
export function initializeAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  // These credentials will be read from .env in the server environment
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Firebase Admin credentials are not configured in environment variables.');
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}
