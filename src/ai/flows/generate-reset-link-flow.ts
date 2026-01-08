
'use server';
/**
 * @fileOverview A flow for generating a password reset link using the Firebase Admin SDK.
 *
 * - generatePasswordResetLink - A function that generates the link.
 * - PasswordResetLinkInput - The input type for the function.
 * - PasswordResetLinkOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/firebase/admin';

const PasswordResetLinkInputSchema = z.object({
  email: z.string().email('A valid email address is required.'),
});
export type PasswordResetLinkInput = z.infer<
  typeof PasswordResetLinkInputSchema
>;

const PasswordResetLinkOutputSchema = z.object({
  success: z.boolean(),
  link: z.string().optional(),
  error: z.string().optional(),
});
export type PasswordResetLinkOutput = z.infer<
  typeof PasswordResetLinkOutputSchema
>;

// Exported function that the client can call.
export async function generatePasswordResetLink(
  input: PasswordResetLinkInput
): Promise<PasswordResetLinkOutput> {
  return generatePasswordResetLinkFlow(input);
}

const generatePasswordResetLinkFlow = ai.defineFlow(
  {
    name: 'generatePasswordResetLinkFlow',
    inputSchema: PasswordResetLinkInputSchema,
    outputSchema: PasswordResetLinkOutputSchema,
  },
  async ({ email }) => {
    try {
      const adminApp = initializeAdminApp();
      const auth = getAuth(adminApp);
      const link = await auth.generatePasswordResetLink(email);
      return { success: true, link };
    } catch (error: any) {
      console.error('Admin SDK Error generating password reset link:', error);

      // To avoid leaking user enumeration info, we don't pass the specific error message to the client.
      if (error.code === 'auth/user-not-found') {
        // We'll return success even if user not found to prevent user enumeration.
        // The email simply won't be sent on the client-side, which is the desired behavior.
        return { success: true, link: undefined };
      }

      return {
        success: false,
        error: `An internal server error occurred.`,
      };
    }
  }
);
