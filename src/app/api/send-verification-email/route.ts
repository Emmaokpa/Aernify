import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { addMinutes } from 'date-fns';
import { setDocument } from '@/lib/firestore-rest';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { uid, email, referralCode, displayName, photoURL } =
      await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { message: 'User ID and email are required.' },
        { status: 400 }
      );
    }

    // 1️⃣ Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 2️⃣ Firestore document path
    const docId = Math.random().toString(36).substring(2, 15);
    const documentPath = `users/${uid}/verification/${docId}`;

    // 3️⃣ Correct timestamps (NO hacks)
    const createdAt = new Date();
    const expiresAt = addMinutes(createdAt, 15);

    const firestoreData = {
      fields: {
        code: { stringValue: code },
        createdAt: { timestampValue: createdAt.toISOString() },
        expiresAt: { timestampValue: expiresAt.toISOString() },
        email: { stringValue: email },
        referralCode: { stringValue: referralCode || '' },
        displayName: { stringValue: displayName || '' },
        photoURL: { stringValue: photoURL || '' },
      },
    };

    // 4️⃣ Store verification code in Firestore (REST)
    const result = await setDocument(documentPath, firestoreData);

    if (!result.ok) {
      const err = await result.json();
      throw new Error(err?.error?.message || 'Firestore write failed');
    }

    // 5️⃣ Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 6️⃣ Email HTML
    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">
          <h2 style="text-align:center;">Verify your email</h2>
          <p style="text-align:center;">Use the code below to verify your Aernify account:</p>
          <div style="text-align:center; margin:30px 0;">
            <span style="font-size:28px; letter-spacing:6px; font-weight:bold;">
              ${code}
            </span>
          </div>
          <p style="text-align:center; color:#777;">
            This code expires in 15 minutes.
          </p>
          <p style="text-align:center; color:#999; font-size:14px;">
            If you didn’t request this, you can ignore this email.
          </p>
        </div>
      </div>
    `;

    // 7️⃣ Send email
    await transporter.sendMail({
      from: `"Aernify" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Aernify Verification Code',
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully.',
    });
  } catch (error: any) {
    console.error('Error in send-verification-email API route:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
