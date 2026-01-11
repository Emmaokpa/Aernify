
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { isPast } from 'date-fns';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/lib/types';
import { isFuture } from 'date-fns';

export const runtime = 'nodejs';

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

async function applyReferralCodeAdmin(newUserUid: string, referralCode: string) {
    const usersRef = adminDb.collection('users');
    const q = usersRef.where('referralCode', '==', referralCode.toUpperCase()).limit(1);
    
    try {
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            console.warn(`Referral code ${referralCode} not found.`);
            return;
        }

        const referrerDoc = querySnapshot.docs[0];
        const referrerUid = referrerDoc.id;

        if (referrerUid === newUserUid) {
            console.warn(`User ${newUserUid} attempted to refer themselves.`);
            return;
        }
        
        const referrerUserRef = adminDb.doc(`users/${referrerUid}`);
        const referrerProfileSnap = await referrerUserRef.get();

        if (!referrerProfileSnap.exists) return;
        const referrerProfile = referrerProfileSnap.data() as UserProfile;

        const isVip = referrerProfile.vipExpiresAt && isFuture(referrerProfile.vipExpiresAt.toDate());
        const multiplier = isVip ? 2 : 1;
        const referralBonus = 100 * multiplier;

        await referrerUserRef.update({
            coins: FieldValue.increment(referralBonus),
            weeklyCoins: FieldValue.increment(referralBonus),
            referralCount: FieldValue.increment(1),
        });

    } catch (error) {
        console.error("Error applying referral code with Admin SDK:", error);
    }
}

export async function POST(request: NextRequest) {
  const { uid, code } = await request.json();

  if (!uid || !code || code.length !== 6) {
    return NextResponse.json({ message: 'User ID and a 6-digit code are required.' }, { status: 400 });
  }

  try {
    // 1. Find the verification code document for the user
    const verificationCollectionRef = adminDb.collection(`users/${uid}/verification`);
    const q = verificationCollectionRef.orderBy('createdAt', 'desc').limit(1);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return NextResponse.json({ message: 'Invalid or expired code. Please request a new one.' }, { status: 400 });
    }

    const verificationDoc = querySnapshot.docs[0];
    const verificationData = verificationDoc.data();

    // 2. Check if the code is expired
    if (isPast(verificationData.expiresAt.toDate())) {
      await verificationDoc.ref.delete(); // Clean up expired code
      return NextResponse.json({ message: 'This code has expired. Please request a new one.' }, { status: 400 });
    }

    // 3. Check if the code matches
    if (verificationData.code !== code) {
      return NextResponse.json({ message: 'The code you entered is incorrect.' }, { status: 400 });
    }

    // --- At this point, the code is valid ---
    const userRecord = await adminAuth.getUser(uid);
    const userRef = adminDb.doc(`users/${uid}`);
    
    // 4. Create or Update the user profile in Firestore
    const initialProfileData: Omit<UserProfile, 'uid'> = {
        displayName: userRecord.displayName || 'New User',
        email: userRecord.email || '',
        photoURL: userRecord.photoURL || null,
        coins: 0,
        weeklyCoins: 0,
        referralCode: generateReferralCode(),
        referralCount: 0,
        isAdmin: false,
        currentStreak: 0,
        lastLoginDate: '',
        isVip: false,
        vipExpiresAt: undefined,
    };
    
    // Use set with { merge: true } to robustly create or merge the profile
    await userRef.set(initialProfileData, { merge: true });

    // 5. Apply referral code if it exists
    const referralCode = verificationData.referralCode;
    if (referralCode) {
        await applyReferralCodeAdmin(uid, referralCode);
    }
    
    // 6. Delete the used verification code document
    await verificationDoc.ref.delete();
    
    // 7. Finally, mark the user as verified in Firebase Auth
    await adminAuth.updateUser(uid, {
      emailVerified: true,
    });

    return NextResponse.json({ success: true, message: 'Email verified successfully!' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/verify-code:', error);
    return NextResponse.json({ message: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}
