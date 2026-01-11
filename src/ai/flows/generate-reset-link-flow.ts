'use server';
/**
 * @fileOverview DEPRECATED. This flow for generating a password reset link is deprecated.
 * The logic has been moved to the /api/forgot-password route to avoid build issues
 * with firebase-admin and the Next.js environment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ResetLinkInputSchema = z.object({
  email: z.string().email(),
});
export type ResetLinkInput = z.infer<typeof ResetLinkInputSchema>;

const ResetLinkOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ResetLinkOutput = z.infer<typeof ResetLinkOutputSchema>;


export async function generateAndEmailResetLink(input: ResetLinkInput): Promise<ResetLinkOutput> {
  console.warn("DEPRECATED: generateAndEmailResetLink flow was called. Use the /api/forgot-password endpoint instead.");
  return { success: false, message: "This flow is deprecated and should not be used." };
}

ai.defineFlow(
  {
    name: 'generateResetLinkFlow',
    inputSchema: ResetLinkInputSchema,
    outputSchema: ResetLinkOutputSchema,
  },
  async () => {
     return { success: false, message: "This flow is deprecated and should not be used." };
  }
);
