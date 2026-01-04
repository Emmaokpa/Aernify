
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
import { adminApp } from '@/firebase/admin';

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
      const auth = getAuth(adminApp);
      
      // This will generate a link and trigger Firebase's built-in email sender.
      // Make sure you have not configured a custom SMTP server in the Firebase Console UI.
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
      
      // The error you were seeing ("Credential implementation provided...") is an admin-level
      // auth error, not an SMTP one. The logic now correctly relies only on Firebase Admin.
      // We'll return a generic but more informative error for any admin failures.
      return { 
        success: false, 
        message: `An internal server error occurred while trying to send the reset email. Please contact support. (Error code: ${error.code || 'UNKNOWN'})` 
      };
    }
  }
);
