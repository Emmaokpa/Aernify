
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { subject, htmlContent } = await request.json();

  if (!subject || !htmlContent) {
    return NextResponse.json({ error: 'Subject and content are required.' }, { status: 400 });
  }

  const { firestore } = initializeFirebase();

  try {
    // 1. Fetch all users from Firestore
    const usersRef = collection(firestore, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });

    if (users.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No users found.' });
    }

    // 2. Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 3. Loop through users and send emails
    let sentCount = 0;
    for (const user of users) {
      if (user.email) {
        try {
          await transporter.sendMail({
            from: `"Aernify" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: subject,
            html: htmlContent,
          });
          sentCount++;
        } catch (emailError) {
          console.warn(`Failed to send email to ${user.email}:`, emailError);
        }
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error: any) {
    console.error('Error in bulk email API route:', error);
    return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}
