
'use server';

/**
 * @fileOverview A flow for handling referral code application.
 * THIS FLOW IS DEPRECATED.
 * The logic has been moved to a server-only admin function in `lib/auth-utils.ts`
 * and is called from the `verify-code-flow` to avoid SDK conflicts and build errors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReferralInputSchema = z.object({
  newUserUid: z.string(),
  referralCode: z.string(),
});
export type ReferralInput = z.infer<typeof ReferralInputSchema>;

const ReferralOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ReferralOutput = z.infer<typeof ReferralOutputSchema>;

// This function is now deprecated and should not be used.
export async function applyReferralCode(input: ReferralInput): Promise<ReferralOutput> {
  console.warn("DEPRECATED: applyReferralCode flow was called. Use applyReferralCodeAdmin instead.");
  return { success: false, message: "This flow is deprecated." };
}

const applyReferralCodeFlow = ai.defineFlow(
  {
    name: 'applyReferralCodeFlow',
    inputSchema: ReferralInputSchema,
    outputSchema: ReferralOutputSchema,
  },
  async () => {
     return { success: false, message: "This flow is deprecated." };
  }
);
