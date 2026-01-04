
import { initializeApp, getApps, App } from 'firebase-admin/app';

let adminApp: App;

// In a managed environment like Firebase App Hosting or Cloud Functions,
// calling initializeApp() with no arguments automatically uses the
// project's service account credentials. This is the correct approach.
if (getApps().length === 0) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

export { adminApp };
