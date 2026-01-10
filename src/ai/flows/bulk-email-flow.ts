'use server';
/**
 * @fileOverview A flow for sending bulk emails to all users.
 *
 * - sendBulkEmail - A function that handles fetching users and dispatching emails.
 * - BulkEmailInput - The input type for the function.
 * - BulkEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import nodemailer from 'nodemailer';

const BulkEmailInputSchema = z.object({
  subject: z.string().describe('The subject of the email.'),
  htmlContent: z.string().describe('The HTML content of the email body.'),
});
export type BulkEmailInput = z.infer<typeof BulkEmailInputSchema>;

const BulkEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful.'),
  sentCount: z.number().describe('The number of emails successfully sent.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type BulkEmailOutput = z.infer<typeof BulkEmailOutputSchema>;

export async function sendBulkEmail(input: BulkEmailInput): Promise<BulkEmailOutput> {
  return bulkEmailFlow(input);
}

const bulkEmailFlow = ai.defineFlow(
  {
    name: 'bulkEmailFlow',
    inputSchema: BulkEmailInputSchema,
    outputSchema: BulkEmailOutputSchema,
  },
  async ({ subject, htmlContent }) => {
    const { firestore } = initializeFirebase();

    try {
      // 1. Fetch all users from Firestore
      const usersRef = collection(firestore, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });

      if (users.length === 0) {
        return { success: true, sentCount: 0, error: 'No users found in the database.' };
      }

      // 2. Set up Nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // 3. Loop through users and send emails
      let sentCount = 0;
      for (const user of users) {
        // Ensure user has an email before attempting to send
        if (user.email) {
          try {
            await transporter.sendMail({
              from: `"Aernify" <${process.env.SMTP_USER}>`,
              to: user.email,
              subject: subject,
              html: htmlContent, // Here you could personalize with {{user.displayName}} if using a template engine
            });
            sentCount++;
          } catch (emailError) {
            console.warn(`Failed to send email to ${user.email}:`, emailError);
          }
        }
      }

      return { success: true, sentCount };
    } catch (error: any) {
      console.error('Error in bulk email flow:', error);
      return { success: false, sentCount: 0, error: error.message || 'An unexpected server error occurred.' };
    }
  }
);
