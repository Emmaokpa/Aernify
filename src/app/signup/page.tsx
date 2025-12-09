'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/icons/logo';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { applyReferralCode } from '@/ai/flows/referral-flow';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Function to generate a random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

async function createUserProfile(db: any, user: User, referralCode: string | null) {
  const userRef = doc(db, 'users', user.uid);
  const newUserProfile = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    coins: 0, // Start with 0 coins
    referralCode: generateReferralCode(),
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, newUserProfile);
    
    // If a referral code was used, apply it
    if (referralCode) {
        const referralResult = await applyReferralCode({ newUserUid: user.uid, referralCode });
        if (referralResult.success) {
            // Award coins to the new user on the client-side representation
            // The flow handles the referrer's reward
            const userDocRef = doc(db, 'users', user.uid);
            // Non-blocking update
            setDoc(userDocRef, { coins: 100 }, { merge: true }).catch(e => {
                console.error("Failed to apply bonus coins to new user", e);
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: { coins: 100 }
                }));
            });
        } else {
            console.warn("Referral code application failed:", referralResult.message);
        }
    }
  } catch (e: any) {
    console.error('Error creating user profile:', e);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: newUserProfile
    }));
  }
}

export default function SignUpPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const referralCode = (formData.get('referralCode') as string) || null;

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      setIsLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, {
          displayName: username,
        });

        // Create the user profile document in Firestore
        await createUserProfile(firestore, user, referralCode);
      }

      toast({
        title: 'Account Created!',
        description: "You've successfully signed up. Redirecting...",
      });
      
      router.push('/');

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please try another.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      }
      setIsLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Join Earnify to start earning rewards today!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder="Your cool name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input id="referralCode" name="referralCode" placeholder="Enter a code" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
