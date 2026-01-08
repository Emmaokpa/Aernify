
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import 'server-only';

let adminApp: App;

/**
 * Initializes the Firebase Admin SDK, reusing the existing app instance if one exists.
 * This is the correct way to initialize in serverless environments to avoid errors.
 * @returns The initialized Firebase Admin App instance.
 */
export function initializeAdminApp() {
  if (getApps().some(app => app.name === '[DEFAULT]')) {
    adminApp = getApp();
  } else {
    // initializeApp() with no args will automatically use the environment's
    // service account credentials in a managed environment like Firebase App Hosting.
    adminApp = initializeApp();
  }
  return adminApp;
}
