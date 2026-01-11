
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

// This API key is safe to be exposed on the server side.
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;


async function generatePasswordResetLink(email: string): Promise<string> {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email: email,
        }),
    });

    const result = await response.json();

    if (!response.ok) {
        // To prevent user enumeration, we won't throw an error if the user isn't found.
        if (result.error && result.error.message === 'EMAIL_NOT_FOUND') {
            console.log(`Password reset requested for non-existent user: ${email}`);
            // Return an empty string to signify we should not send an email.
            return '';
        }
        // For other errors, we throw.
        throw new Error(result.error?.message || 'Failed to generate password reset link.');
    }

    // The REST API doesn't return the full link, so we construct it.
    // This is a standard approach.
    const oobCode = result.oobCode;
    const link = `https://${FIREBASE_AUTH_DOMAIN}/__/auth/action?mode=resetPassword&oobCode=${oobCode}`;
    return link;
}


// --- Main API Route Handler ---
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Step 1: Generate the link using the Firebase Auth REST API
    const link = await generatePasswordResetLink(email);
    
    // If the link is empty, it means the user was not found. We exit gracefully.
    if (!link) {
        return NextResponse.json({ message: 'If an account exists, an email has been sent.' }, { status: 200 });
    }

    // Step 2: Send the Email with Nodemailer
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
      <a href="${link}" style="background-color: #4B0082; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If you didn’t ask to reset your password, you can ignore this email.</p>
      <p>Thanks,<br/>The Aernify Team</p>
    `;

    await transporter.sendMail({
        from: `"Aernify" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Aernify Password',
        html: emailHtml,
    });

    return NextResponse.json({ message: 'Password reset email sent successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/forgot-password:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
