'use server';
/**
 * @fileOverview A flow for generating and emailing a password reset link.
 *
 * - generateAndEmailResetLink - A function that handles the server-side logic.
 * - ResetLinkInput - The input type for the function.
 * - ResetLinkOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';

// --- Input and Output Schemas ---
const ResetLinkInputSchema = z.object({
  email: z.string().email().describe('The email address of the user requesting a password reset.'),
});
export type ResetLinkInput = z.infer<typeof ResetLinkInputSchema>;

const ResetLinkOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful.'),
  message: z.string().describe('A message describing the result.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type ResetLinkOutput = z.infer<typeof ResetLinkOutputSchema>;

// --- Firebase Admin Initialization ---
// This function initializes the Admin SDK, reusing the app if it's already created.
function initializeAdminApp() {
  // These credentials will be read from .env in the server environment
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Firebase Admin credentials are not configured in environment variables.');
  }

  if (getApps().length) {
    return getApp();
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}


// --- Public Function ---
// This is the function that the client-side component will call.
export async function generateAndEmailResetLink(input: ResetLinkInput): Promise<ResetLinkOutput> {
  return generateResetLinkFlow(input);
}


// --- Genkit Flow Definition ---
const generateResetLinkFlow = ai.defineFlow(
  {
    name: 'generateResetLinkFlow',
    inputSchema: ResetLinkInputSchema,
    outputSchema: ResetLinkOutputSchema,
  },
  async ({ email }) => {
    try {
      // --- Step 1: Generate Password Reset Link (Server-Side) ---
      const adminApp = initializeAdminApp();
      const auth = getAuth(adminApp);
      
      let link: string;
      try {
          link = await auth.generatePasswordResetLink(email);
      } catch (error: any) {
          // If the user does not exist, Firebase throws an error.
          // We'll catch it and return a success response to prevent user enumeration.
          if (error.code === 'auth/user-not-found') {
              console.log(`Password reset requested for non-existent user: ${email}`);
              // We exit gracefully without sending an email. The client will show a generic success message.
              return { success: true, message: 'If an account exists, an email has been sent.' };
          }
          // For any other Firebase Admin errors, we re-throw to be caught by the outer block.
          throw error;
      }

      // --- Step 2: Send the Email with Nodemailer (Server-Side) ---
      const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.hostinger.com',
          port: Number(process.env.SMTP_PORT || 465),
          secure: true,
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
          },
      });

      const emailHtml = `
        <h1>Reset Your Password</h1>
        <p>Hello,</p>
        <p>Follow this link to reset your password for your Aernify account.</p>
        <a href="${link}" style="background-color: #f5a623; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>If you didn’t ask to reset your password, you can ignore this email.</p>
        <p>Thanks,<br/>The Aernify Team</p>
      `;

      await transporter.sendMail({
          from: `"Aernify" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Reset Your Aernify Password',
          html: emailHtml,
      });

      return { success: true, message: 'Password reset email sent successfully.' };

    } catch (error: any) {
      console.error('Error in generateResetLinkFlow:', error);
      // Return a generic error to the client
      return { success: false, message: 'An internal server error occurred.', error: error.message };
    }
  }
);
