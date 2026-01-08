
'use client';

interface MailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * A client-side helper function to send an email using our API route.
 * @param payload - The email details (to, subject, html).
 * @returns An object indicating success or failure.
 */
export async function sendMail({ to, subject, html }: MailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email from API.');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in sendMail client function:', error);
    return { success: false, error: error.message };
  }
}
