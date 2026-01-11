
'use server';
/**
 * @fileOverview DEPRECATED. The logic has been moved to /api/send-verification-email.
 * This Genkit flow was causing build issues with firebase-admin and Next.js.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SendCodeInputSchema = z.object({
  uid: z.string(),
  email: z.string(),
  referralCode: z.string().optional(),
});
export type SendCodeInput = z.infer<typeof SendCodeInputSchema>;

const SendCodeOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendCodeOutput = z.infer<typeof SendCodeOutputSchema>;


export async function sendVerificationCode(input: SendCodeInput): Promise<SendCodeOutput> {
  console.warn("DEPRECATED: sendVerificationCode flow was called. Use the /api/send-verification-email endpoint instead.");
  return { success: false, message: "This flow is deprecated and should not be used." };
}

ai.defineFlow(
  {
    name: 'sendCodeFlow',
    inputSchema: SendCodeInputSchema,
    outputSchema: SendCodeOutputSchema,
  },
  async () => {
     return { success: false, message: "This flow is deprecated and should not be used." };
  }
);
