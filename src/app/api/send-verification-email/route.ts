
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
    const continueUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/action?mode=verifyEmail${referralCode ? `&referralCode=${encodeURIComponent(referralCode)}` : ''}`;
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
      <h1>Welcome to Aernify!</h1>
      <p>Hello,</p>
      <p>Please click the button below to verify your email address and activate your account.</p>
      <a href="${link}" style="background-color: #f5a623; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <p>Thanks,<br/>The Aernify Team</p>
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
