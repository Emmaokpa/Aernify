
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';
import { add } from 'date-fns';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { uid, email, referralCode } = await request.json();

  if (!uid || !email) {
    return NextResponse.json({ message: 'User ID and email are required.' }, { status: 400 });
  }

  // 1. Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 2. Define where to store the code in Firestore
  // We create a new doc to avoid overwriting previous ones, and query for the latest later.
  const verificationRef = adminDb.collection(`users/${uid}/verification`).doc();
  const expiresAt = add(new Date(), { minutes: 15 }); // Code is valid for 15 minutes

  try {
    // 3. Store the code, expiry, and optional referral code using Admin SDK
    await verificationRef.set({
      code: code,
      createdAt: new Date(),
      expiresAt: expiresAt,
      referralCode: referralCode || null,
    });

    // 4. Send the email with Nodemailer
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
          <h1 style="color: #2c3e50; font-size: 24px; text-align: center;">Your Verification Code</h1>
          <p style="font-size: 16px; text-align: center;">Use the code below to verify your email address and activate your Aernify account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="background-color: #eee; color: #333; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 28px; letter-spacing: 0.2em;">${code}</p>
          </div>
          <p style="font-size: 14px; color: #888; text-align: center;">This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <p style="font-size: 14px; color: #888; text-align: center;">Thanks,<br/>The Aernify Team</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
        from: `"Aernify" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Aernify Verification Code',
        html: emailHtml,
    });

    return NextResponse.json({ success: true, message: 'Verification code sent.' });

  } catch (error: any) {
      console.error('Error in send-verification-email API route:', error);
      return NextResponse.json({ message: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}
