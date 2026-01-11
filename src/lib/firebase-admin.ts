
import 'server-only';
import admin from 'firebase-admin';

// Define the structure for the service account credentials
interface ServiceAccount {
  projectId?: string;
  privateKey?: string;
  clientEmail?: string;
}

if (!admin.apps.length) {
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    // IMPORTANT: Replace escaped newlines for Vercel/similar environments
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // You might want to throw the error or handle it as per your app's needs
    // For now, we log it to avoid crashing the server on startup if env vars are missing
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { admin, adminAuth, adminDb };
