
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { runQuery, updateDocument, setDocument, deleteDocument } from '@/lib/firestore-rest';
import { isPast, isFuture } from 'date-fns';

export const runtime = 'nodejs';

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

async function applyReferralCodeRest(newUserUid: string, referralCode: string) {
  try {
    const query = {
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'referralCode' },
            op: 'EQUAL',
            value: { stringValue: referralCode.toUpperCase() },
          },
        },
        limit: 1,
      },
    };

    const referrers = await runQuery(query);
    if (!referrers || referrers.length === 0) {
      console.warn(`Referral code ${referralCode} not found.`);
      return;
    }

    const referrerDoc = referrers[0].document;
    const referrerUid = referrerDoc.name.split('/').pop();
    const referrerProfile = referrerDoc.fields;

    if (!referrerUid || referrerUid === newUserUid) {
      console.warn(`User ${newUserUid} attempted to refer themselves or referrer not found.`);
      return;
    }
    
    const isVip = referrerProfile.vipExpiresAt?.timestampValue && isFuture(new Date(referrerProfile.vipExpiresAt.timestampValue));
    const multiplier = isVip ? 2 : 1;
    const referralBonus = 100 * multiplier;
    
    // In REST API, increment is not atomic. We must read, calculate, and write.
    // This is a limitation of this approach but acceptable for non-critical counters.
    const currentCoins = parseInt(referrerProfile.coins?.integerValue || '0');
    const currentWeeklyCoins = parseInt(referrerProfile.weeklyCoins?.integerValue || '0');
    const currentReferralCount = parseInt(referrerProfile.referralCount?.integerValue || '0');

    const referrerPath = `users/${referrerUid}`;
    const updatePayload = {
      fields: {
        coins: { integerValue: (currentCoins + referralBonus).toString() },
        weeklyCoins: { integerValue: (currentWeeklyCoins + referralBonus).toString() },
        referralCount: { integerValue: (currentReferralCount + 1).toString() },
      },
    };
    
    await updateDocument(referrerPath, updatePayload, ['coins', 'weeklyCoins', 'referralCount']);
  } catch (error) {
    console.error("Error applying referral code with REST API:", error);
  }
}

export async function POST(request: NextRequest) {
  const { uid, code } = await request.json();

  if (!uid || !code || code.length !== 6) {
    return NextResponse.json({ message: 'User ID and a 6-digit code are required.' }, { status: 400 });
  }

  try {
    const query = {
      structuredQuery: {
        from: [{ collectionId: 'verification' }],
        where: {
          fieldFilter: { field: { fieldPath: 'code' }, op: 'EQUAL', value: { stringValue: code } },
        },
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: 1,
      },
      parent: `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    };

    const results = await runQuery(query);
    if (!results || results.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired code. Please request a new one.' }, { status: 400 });
    }

    const verificationDoc = results[0].document;
    const verificationData = verificationDoc.fields;
    const docPath = verificationDoc.name.substring(verificationDoc.name.indexOf('/documents/') + 10);
    
    if (isPast(new Date(verificationData.expiresAt.timestampValue))) {
      await deleteDocument(docPath);
      return NextResponse.json({ message: 'This code has expired. Please request a new one.' }, { status: 400 });
    }

    const userRecord = await adminAuth.getUser(uid);
    const initialProfileData = {
      fields: {
        displayName: { stringValue: userRecord.displayName || 'New User' },
        email: { stringValue: userRecord.email || '' },
        photoURL: { stringValue: userRecord.photoURL || '' },
        coins: { integerValue: '0' },
        weeklyCoins: { integerValue: '0' },
        referralCode: { stringValue: generateReferralCode() },
        referralCount: { integerValue: '0' },
        isAdmin: { booleanValue: false },
        currentStreak: { integerValue: '0' },
        lastLoginDate: { stringValue: '' },
        isVip: { booleanValue: false },
        vipExpiresAt: { nullValue: null },
      },
    };

    await setDocument(`users/${uid}`, initialProfileData, true); // Use merge=true as an upsert

    const referralCode = verificationData.referralCode?.stringValue;
    if (referralCode) {
      await applyReferralCodeRest(uid, referralCode);
    }
    
    await deleteDocument(docPath);
    await adminAuth.updateUser(uid, { emailVerified: true });

    return NextResponse.json({ success: true, message: 'Email verified successfully!' });
  } catch (error: any) {
    console.error('API Error in /api/verify-code:', error);
    return NextResponse.json({ message: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}
