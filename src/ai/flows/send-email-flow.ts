
'use server';
/**
 * @fileOverview A flow for sending transactional emails via Resend.
 *
 * - sendPasswordResetEmail - Sends a password reset link.
 * - PasswordResetInput - Input schema for the flow.
 * - PasswordResetOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';
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
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set in environment variables.');
      return { success: false, message: 'Server is not configured for sending emails.' };
    }

    try {
      // 1. Generate the password reset link using the Firebase Admin SDK
      const auth = getAuth(adminApp);
      // To prevent user enumeration attacks, we'll proceed even if the user doesn't exist,
      // but we won't send an email. The client gets a success message either way.
      let userExists = true;
      try {
        await auth.getUserByEmail(email);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          userExists = false;
        } else {
          throw error; // Re-throw other unexpected errors
        }
      }

      if (!userExists) {
        console.log(`Password reset requested for non-existent user: ${email}. No email sent.`);
        return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };
      }
      
      const link = await auth.generatePasswordResetLink(email);

      // 2. Send the email using Resend
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'Aernify <noreply@aernify.fun>', // Replace with your verified Resend domain
        to: email,
        subject: 'Reset Your Aernify Password',
        html: `
          <h1>Reset Your Password</h1>
          <p>We received a request to reset the password for your Aernify account.</p>
          <p>Please click the link below to set a new password:</p>
          <a href="${link}" style="background-color: #fdd835; color: #333; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thanks,<br>The Aernify Team</p>
        `,
      });

      return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };
    } catch (error: any) {
      console.error('Error in sendPasswordResetEmailFlow:', error);
      // In production, you might want a more generic error message
      return { success: false, message: 'Could not send password reset email. Please try again later.' };
    }
  }
);
