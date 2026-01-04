
'use server';
/**
 * @fileOverview A flow for sending transactional emails using a custom SMTP server.
 *
 * - sendPasswordResetEmail - Sends a password reset link.
 * - PasswordResetInput - Input schema for the flow.
 * - PasswordResetOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/firebase/admin';
import { Resend } from 'resend';

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
    // 1. Verify environment variables for SMTP are present
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
        console.error('SMTP environment variables are not configured.');
        return { success: false, message: 'Server email configuration is incomplete. Please contact support.' };
    }

    try {
      const auth = getAuth(adminApp);
      
      // Prevent user enumeration attacks by not revealing if the user exists.
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
      
      // 2. Generate the password reset link using the Firebase Admin SDK
      const actionLink = await auth.generatePasswordResetLink(email);

      // 3. Configure Resend to use your Hostinger SMTP server
      const resend = new Resend({
          apiKey: 're_123456789', // This is a dummy key, not used for SMTP
          baseUrl: 'https://api.resend.com', // Dummy URL, not used for SMTP
          // *** The important part: providing the SMTP transport ***
          transport: {
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465, // `true` for port 465, `false` for 587
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD,
            },
          },
      });

      // 4. Send the email using the generated link and your SMTP server
      await resend.emails.send({
        from: `Aernify <${SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Aernify Password',
        html: `
            <h1>Password Reset Request</h1>
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <p><a href="${actionLink}">Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Thanks,</p>
            <p>The Aernify Team</p>
        `,
      });

      return { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };

    } catch (error: any) {
      console.error('Detailed Error in sendPasswordResetEmailFlow:', error);
      
      // Provide a specific, helpful message for different kinds of errors.
      if (error.code?.startsWith('auth/')) {
          return { success: false, message: `An internal authentication error occurred: "${error.message}".` };
      }
       if (error.name === 'ESOCKET' || error.code === 'ECONNECTION') {
        return { success: false, message: 'Could not connect to the email server. Please check your SMTP configuration and firewall settings.' };
      }

      // Fallback for any other unexpected errors from the email sending step
      return { success: false, message: `Could not send password reset email. The server returned: "${error.message}". Please check your SMTP configuration.` };
    }
  }
);
