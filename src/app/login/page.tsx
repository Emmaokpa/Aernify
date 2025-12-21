'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/icons/logo';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthErrorCodes, User } from 'firebase/auth';
import { Separator } from '@/components/ui/separator';
import GoogleIcon from '@/components/icons/google-icon';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { applyReferralCode } from '@/ai/flows/referral-flow';


// This function is needed for the edge case where a user signs up with Google
// for the first time ever via the login page. The AuthProvider will also handle this,
// but having it here provides a faster initial profile creation.
async function createUserProfile(db: any, user: User) {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    return; // Profile already exists
  }
  
  // This is a simplified profile creation for this edge case.
  const newUserProfile: Omit<UserProfile, 'id' | 'isAdmin' | 'referralCode' | 'weeklyCoins'> = {
    uid: user.uid,
    displayName: user.displayName || 'New User',
    email: user.email || '',
    photoURL: user.photoURL,
    coins: 10,
  };

  const finalProfile = {
      ...newUserProfile,
      weeklyCoins: 0,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      isAdmin: false,
  }

  try {
    await setDoc(userRef, finalProfile);
  } catch (e: any) {
    console.error('Error creating user profile:', e);
    // Emit a contextual error for debugging security rules if needed
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: finalProfile
    }));
  }
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      // Ensure profile exists for users signing in for the first time via Google on the login page.
      await createUserProfile(firestore, userCredential.user);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing, just stop loading.
        console.log('Google Sign-In cancelled by user.');
      } else if (err.code === AuthErrorCodes.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL) {
        setError('An account already exists with this email address. Please sign in with your original method.');
      } else {
        console.error('Google sign-in error:', err);
        setError('An error occurred during Google sign-in. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }


  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      }
    } finally {
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
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to Aernify</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                <p>{error}</p>
              </div>
            )}
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Sign In with Google
            </Button>

            <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required disabled={isLoading || isGoogleLoading}/>
              </div>
              <div className="space-y-2">
                <div className='flex justify-between items-center'>
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className='text-xs text-primary hover:underline'>
                        Forgot Password?
                    </Link>
                </div>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required disabled={isLoading || isGoogleLoading}/>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
