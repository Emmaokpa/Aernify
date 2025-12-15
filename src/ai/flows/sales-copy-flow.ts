'use server';
/**
 * @fileOverview An AI flow for generating sales copy for affiliate products.
 *
 * - generateSalesCopy - A function that generates marketing copy.
 * - SalesCopyInput - The input type for the function.
 * - SalesCopyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SalesCopyInputSchema = z.object({
  productName: z.string().describe('The name of the affiliate product.'),
  productDescription: z.string().describe('A brief description of the product.'),
  productUrl: z.string().url().describe('The user\'s affiliate link for the product.'),
  format: z.enum(['Tweet', 'Facebook Post', 'Email']).describe('The desired format for the sales copy.'),
});
export type SalesCopyInput = z.infer<typeof SalesCopyInputSchema>;

const SalesCopyOutputSchema = z.object({
  salesCopy: z.string().describe('The generated sales copy.'),
});
export type SalesCopyOutput = z.infer<typeof SalesCopyOutputSchema>;

export async function generateSalesCopy(input: SalesCopyInput): Promise<SalesCopyOutput> {
  return salesCopyFlow(input);
}

const salesCopyFlow = ai.defineFlow(
  {
    name: 'salesCopyFlow',
    inputSchema: SalesCopyInputSchema,
    outputSchema: SalesCopyOutputSchema,
  },
  async (input) => {
    const prompt = await salesCopyPrompt.render({
        input: {
            ...input,
            promptAddition: getPromptAddition(input.format),
        }
    });

    const llmResponse = await ai.generate(prompt);

    return {
      salesCopy: llmResponse.text,
    };
  }
);


const salesCopyPrompt = ai.definePrompt(
  {
    name: 'salesCopyPrompt',
    input: {
        schema: z.object({
            productName: z.string(),
            productDescription: z.string(),
            productUrl: z.string(),
            promptAddition: z.string(),
        })
    },
    prompt: `You are an expert marketing copywriter. Your goal is to write compelling, engaging, and persuasive copy to help an affiliate sell a product.

    **Product Information:**
    - **Name:** {{{productName}}}
    - **Description:** {{{productDescription}}}
    - **Affiliate Link:** {{{productUrl}}}

    **Instructions:**
    Write a piece of marketing copy based on the product information provided.
    - The tone should be enthusiastic and trustworthy.
    - It must include the affiliate link.
    - It must be tailored for the specified format.

    {{{promptAddition}}}
    `,
  },
);

function getPromptAddition(format: SalesCopyInput['format']): string {
  switch (format) {
    case 'Tweet':
      return `**Format:** A short, punchy Tweet. Use relevant hashtags. Keep it under 280 characters.`;
    case 'Facebook Post':
      return `**Format:** A friendly and informative Facebook Post. Use emojis to break up text and increase engagement. Start with a hook to grab attention.`;
    case 'Email':
      return `**Format:** A short but persuasive email.
      - Use a clear and compelling subject line.
      - Start with a personal greeting.
      - Explain the main benefit of the product.
      - Have a strong call to action.
      - Use the format:
      Subject: [Your Subject Line]

      [Your email body]`;
    default:
      return '';
  }
}
