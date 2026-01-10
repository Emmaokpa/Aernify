
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';

// --- Firebase Admin Initialization ---
function initializeAdminApp() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Firebase Admin credentials are not configured in environment variables.');
  }

  if (getApps().length) {
    return getApp();
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// --- Main API Route Handler ---
export async function POST(request: NextRequest) {
  try {
    const { email, referralCode } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // --- Step 1: Generate Verification Link (Server-Side) ---
    const adminApp = initializeAdminApp();
    const auth = getAuth(adminApp);
    
    // Append referral code to the continue URL if it exists
    const continueUrl = `https://aernify.fun/auth/action${referralCode ? `?referralCode=${encodeURIComponent(referralCode)}` : ''}`;
    const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true,
    };

    let link: string;
    try {
        link = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.warn(`Verification email requested for non-existent user: ${email}`);
            // Still return success to prevent user enumeration
            return NextResponse.json({ message: 'If an account exists, a verification email has been sent.' }, { status: 200 });
        }
        throw error; // Re-throw other Firebase errors
    }

    // --- Step 2: Send the Email with Nodemailer ---
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
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #f0f0f0; background-color: #121212; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e1e1e; padding: 30px; border-radius: 8px;">
          <h1 style="color: #FFD700; font-size: 24px;">Welcome to Aernify!</h1>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">Please click the button below to verify your email address and activate your account.</p>
          <a href="${link}" style="background-color: #FFD700; color: #121212; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px; margin: 20px 0;">Verify My Account</a>
          <p style="font-size: 14px; color: #888;">If you did not create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
          <p style="font-size: 14px;">Thanks,<br/>The Aernify Team</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
        from: `"Aernify" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Email Address for Aernify',
        html: emailHtml,
    });

    return NextResponse.json({ message: 'Verification email sent successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/send-verification-email:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
