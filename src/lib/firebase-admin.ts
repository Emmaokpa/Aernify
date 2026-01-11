
import 'server-only';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Define the structure for the service account credentials
interface ServiceAccount {
  projectId?: string;
  privateKey?: string;
  clientEmail?: string;
}

// Function to get the initialized Firebase Admin App
function getAdminApp(): App {
  // If the app is already initialized, return it
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Otherwise, initialize it
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    // IMPORTANT: Replace escaped newlines and remove quotes for Vercel/similar environments
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Firebase Admin credentials are not configured in environment variables.');
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// Export singleton instances of the services
export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
