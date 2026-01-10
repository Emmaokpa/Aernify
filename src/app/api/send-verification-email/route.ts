
'use server';
// This file is now deprecated and will be removed. 
// The logic has been moved to the `send-code-flow.ts` Genkit flow.
// This is left here to avoid breaking any potential imports until a full cleanup.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
        error: 'This endpoint is deprecated. Please use the sendVerificationCode flow.'
    }, { status: 410 });
}
