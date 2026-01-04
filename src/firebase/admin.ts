
import { initializeApp, getApps, App } from 'firebase-admin/app';

let adminApp: App;

// In a managed environment like Firebase App Hosting, calling initializeApp() 
// with no arguments automatically uses the project's service account credentials. 
// This is the correct and necessary approach for this environment.
if (getApps().length === 0) {
  adminApp = initializeApp();
} else {
  // In a local or other environment, get the existing app.
  adminApp = getApps()[0];
}

export { adminApp };
