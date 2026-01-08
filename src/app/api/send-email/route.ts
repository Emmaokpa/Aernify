
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  // 1. Validate the request body
  const { to, subject, html } = await request.json();
  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
  }

  // 2. Set up the Nodemailer transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 3. Define mail options
  const mailOptions = {
    from: `"Aernify" <${process.env.SMTP_USER}>`,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    // 4. Send the email
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Nodemailer Error:', error);
    // Return a more generic error to the client for security
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
