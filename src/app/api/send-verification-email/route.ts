
'use server';

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
      <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h1 style="color: #2c3e50; font-size: 24px; text-align: center;">Welcome to Aernify!</h1>
          <p style="font-size: 16px; text-align: center;">Please click the button below to verify your email address and activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #f5a623; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Verify My Account</a>
          </div>
          <p style="font-size: 14px; color: #888; text-align: center;">If you did not create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <p style="font-size: 14px; color: #888; text-align: center;">Thanks,<br/>The Aernify Team</p>
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
