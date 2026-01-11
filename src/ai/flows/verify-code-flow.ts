
'use server';

/**
 * @fileOverview DEPRECATED. The logic has been moved to /api/verify-code.
 * This Genkit flow was causing build issues with firebase-admin and Next.js.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const VerifyCodeInputSchema = z.object({
  uid: z.string(),
  code: z.string(),
});
export type VerifyCodeInput = z.infer<typeof VerifyCodeInputSchema>;

const VerifyCodeOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type VerifyCodeOutput = z.infer<typeof VerifyCodeOutputSchema>;


export async function verifyCode(input: VerifyCodeInput): Promise<VerifyCodeOutput> {
  console.warn("DEPRECATED: verifyCode flow was called. Use the /api/verify-code endpoint instead.");
  return { success: false, message: "This flow is deprecated and should not be used." };
}

ai.defineFlow(
  {
    name: 'verifyCodeFlow',
    inputSchema: VerifyCodeInputSchema,
    outputSchema: VerifyCodeOutputSchema,
  },
  async () => {
     return { success: false, message: "This flow is deprecated and should not be used." };
  }
);
