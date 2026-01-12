
import { NextRequest, NextResponse } from 'next/server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Minimal Genkit setup within the API route
const ai = genkit({
  plugins: [googleAI()],
});

const SalesCopyInputSchema = z.object({
  productName: z.string().describe('The name of the affiliate product.'),
  productDescription: z.string().describe('A brief description of the product.'),
  productUrl: z.string().url().describe('The user\'s affiliate link for the product.'),
  format: z.enum(['Tweet', 'Facebook Post', 'Email']).describe('The desired format for the sales copy.'),
});

function getPromptAddition(format: z.infer<typeof SalesCopyInputSchema>['format']): string {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = SalesCopyInputSchema.parse(body);

    const promptAddition = getPromptAddition(input.format);
    const fullPrompt = `You are an expert marketing copywriter. Your goal is to write compelling, engaging, and persuasive copy to help an affiliate sell a product.

    **Product Information:**
    - **Name:** ${input.productName}
    - **Description:** ${input.productDescription}
    - **Affiliate Link:** ${input.productUrl}

    **Instructions:**
    Write a piece of marketing copy based on the product information provided.
    - The tone should be enthusiastic and trustworthy.
    - It must include the affiliate link.
    - It must be tailored for the specified format.

    ${promptAddition}
    `;

    const llmResponse = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: fullPrompt
    });

    const salesCopy = llmResponse.text;

    return NextResponse.json({ salesCopy });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('Sales copy API error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
