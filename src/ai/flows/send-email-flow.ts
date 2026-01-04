
'use server';
/**
 * @fileOverview A flow for sending transactional emails using Firebase's built-in service.
 *
 * - sendPasswordResetEmail - Sends a password reset link.
 * - PasswordResetInput - Input schema for the flow.
 * - PasswordResetOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Helper function to initialize Firebase Admin SDK safely.
function getAdminApp(): App {
  // In a managed environment like Firebase App Hosting, getApps() should be checked.
  // initializeApp() with no arguments automatically uses the project's service account.
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp();
}


const PasswordResetInputSchema = z.object({
  email: z.string().email('A valid email address is required.'),
});
export type PasswordResetInput = z.infer<typeof PasswordResetInputSchema>;

const PasswordResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type PasswordResetOutput = z.infer<typeof PasswordResetOutputSchema>;

// This function will be called from the client component
export async function sendPasswordResetEmail(input: PasswordResetInput): Promise<PasswordResetOutput> {
  return sendPasswordResetEmailFlow(input);
}

const sendPasswordResetEmailFlow = ai.defineFlow(
  {
    name: 'sendPasswordResetEmailFlow',
    inputSchema: PasswordResetInputSchema,
    outputSchema: PasswordResetOutputSchema,
  },
  async ({ email }) => {
    try {
      const adminApp = getAdminApp();
      const auth = getAuth(adminApp);
      
      // This will generate a link and trigger Firebase's built-in email sender.
      await auth.generatePasswordResetLink(email);

      // To prevent user enumeration, we always return a success message,
      // even if the user does not exist. Firebase handles this securely by not sending an email
      // for non-existent accounts.
      return { 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      };

    } catch (error: any) {
      console.error('Firebase Admin Error in sendPasswordResetEmailFlow:', error);
      
      // Provide a more specific error message based on the code.
      let errorMessage = `An internal server error occurred while trying to send the reset email. Please contact support. (Error code: ${error.code || 'UNKNOWN'})`;

      if (error.code === 'auth/user-not-found') {
        // This case is handled by returning success above, but as a fallback.
        return { 
          success: true, 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        };
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }
);
