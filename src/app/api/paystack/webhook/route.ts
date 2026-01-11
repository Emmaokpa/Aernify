
import { NextResponse, NextRequest } from 'next/server';
import * as crypto from 'crypto';
import { add } from 'date-fns';
import { updateDocument } from '@/lib/firestore-rest';

export const runtime = 'nodejs';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error('Paystack secret key is not set in environment variables.');
}

export async function POST(request: NextRequest) {
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ status: 'error', message: 'Server misconfiguration: Paystack secret not found.' }, { status: 500 });
  }

  const signature = request.headers.get('x-paystack-signature');
  const body = await request.text(); // Read body as text to verify signature

  // 1. Verify the webhook signature
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(body).digest('hex');

  if (hash !== signature) {
    console.warn('Invalid Paystack webhook signature received.');
    return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse the body and process the event
  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const { amount, reference, metadata } = event.data;
    
    // Check if it is a VIP subscription payment by looking for our custom metadata
    if (metadata && metadata.payment_type === 'vip_subscription' && metadata.user_id) {
        const userId = metadata.user_id;
        const VIP_FEE_NAIRA = 5000;
        
        // Verify the amount is correct for a VIP subscription
        if (amount / 100 < VIP_FEE_NAIRA) {
            console.log(`VIP payment received for user ${userId} with incorrect amount: ${amount / 100}. Ignoring.`);
            return NextResponse.json({ status: 'success', message: 'Payment received but incorrect amount for VIP.' });
        }

        try {
            const userPath = `users/${userId}`;
            const newExpirationDate = add(new Date(), { days: 30 });

            const updatePayload = {
              fields: {
                vipExpiresAt: { timestampValue: newExpirationDate.toISOString() },
              },
            };
            
            // Use the REST API helper to update the document
            const updateResult = await updateDocument(userPath, updatePayload, ['vipExpiresAt']);

            if (!updateResult.ok) {
              const error = await updateResult.json();
              throw new Error(`Firestore REST API Error: ${error.error.message}`);
            }

            console.log(`VIP status for user ${userId} extended/activated until ${newExpirationDate.toISOString()}.`);
            return NextResponse.json({ status: 'success', message: 'VIP status updated.' });

        } catch (error) {
            console.error(`Error processing VIP webhook for user ${userId}:`, error);
            return NextResponse.json({ status: 'error', message: 'Internal server error during processing.' }, { status: 500 });
        }
    }
  }

  // 3. Acknowledge receipt of other events without processing
  return NextResponse.json({ status: 'success' });
}
