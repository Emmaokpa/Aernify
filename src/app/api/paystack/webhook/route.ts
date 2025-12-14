import { NextResponse, NextRequest } from 'next/server';
import * as crypto from 'crypto';
import { initializeFirebase } from '@/firebase'; // Server-side initialization
import { getFirestore, collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

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
    const { customer, amount, reference } = event.data;
    const email = customer.email;
    const accountNumber = event.data.authorization?.receiver_bank_account_number;
    const VIP_FEE_NAIRA = 5000;
    
    // Check if it's a DVA payment
    if (accountNumber) {
        // Check if the amount is correct for a VIP subscription
        if (amount / 100 !== VIP_FEE_NAIRA) {
            console.log(`DVA payment received for ${accountNumber} with incorrect amount: ${amount/100}. Ignoring.`);
            return NextResponse.json({ status: 'success', message: 'Payment received but incorrect amount for VIP.' });
        }

        try {
            const { firestore } = initializeFirebase();
            const usersRef = collection(firestore, 'users');
            
            // Find the user by their dedicated account number
            const q = query(usersRef, where('dvaAccountNumber', '==', accountNumber));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error(`Could not find user for DVA: ${accountNumber}. Payment reference: ${reference}`);
                return NextResponse.json({ status: 'error', message: 'User not found for this account number.' }, { status: 404 });
            }

            const userDoc = querySnapshot.docs[0];
            const batch = writeBatch(firestore);

            // Update user's VIP status
            batch.update(doc(firestore, 'users', userDoc.id), { isVip: true });

            await batch.commit();
            console.log(`VIP status activated for user ${userDoc.id} via DVA payment.`);

        } catch (error) {
            console.error('Error processing VIP webhook:', error);
            return NextResponse.json({ status: 'error', message: 'Internal server error during processing.' }, { status: 500 });
        }
    }
  }

  // 3. Acknowledge receipt of the event
  return NextResponse.json({ status: 'success' });
}
