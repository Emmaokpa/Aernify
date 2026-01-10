
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';
import { initializeAdminApp } from '@/firebase/admin';


// --- Main API Route Handler ---
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

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
            return NextResponse.json({ message: 'If an account exists, an email has been sent.' }, { status: 200 });
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

    return NextResponse.json({ message: 'Password reset email sent successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/forgot-password:', error);
    // Return a generic error to the client
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
