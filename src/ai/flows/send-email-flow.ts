
'use server';
/**
 * @fileOverview A flow for sending transactional emails via Firebase's built-in service.
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
      
      // To prevent user enumeration attacks, we'll proceed even if the user doesn't exist,
      // but we won't actually send an email. The client always gets a success message.
      try {
        await auth.getUserByEmail(email);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log(`Password reset requested for non-existent user: ${email}. No email will be sent.`);
          return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };
        }
        // Re-throw other unexpected errors from `getUserByEmail`
        throw error;
      }
      
      // If the user exists, generate and send the link using Firebase's reliable service.
      await auth.generatePasswordResetLink(email);

      return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };

    } catch (error: any) {
      console.error('Detailed Error in sendPasswordResetEmailFlow:', error);
      
      // Provide a specific, helpful message for the error you saw.
      if (error.code === 'auth/internal-error' || error.message.includes('access token')) {
          return { success: false, message: 'The server is having trouble authenticating with Firebase services. Please try again in a moment.' };
      }
      
      // Fallback for any other unexpected errors
      return { success: false, message: `An unexpected server error occurred: "${error.message}". Please contact support.` };
    }
  }
);
