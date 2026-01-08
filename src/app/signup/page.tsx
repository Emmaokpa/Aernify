
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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/icons/logo';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, User, GoogleAuthProvider, signInWithPopup, AuthErrorCodes, sendEmailVerification, ActionCodeSettings } from 'firebase/auth';
import { ensureUserProfile } from '@/lib/auth-utils';
import { Separator } from '@/components/ui/separator';
import GoogleIcon from '@/components/icons/google-icon';

export default function SignUpPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // This function now only handles the redirection part after profile creation.
  async function handleAuthSuccess(user: User, referralCode?: string) {
    await ensureUserProfile(firestore, user, referralCode);
    
    // For non-email providers, redirect immediately.
    // Email provider logic is now fully handled on the client after email is sent.
    const isEmailPasswordUser = user.providerData.some(p => p.providerId === 'password');
    if (!isEmailPasswordUser) {
        toast({
            title: 'Account Ready!',
            description: "You've successfully signed up. Redirecting...",
        });
        router.push('/dashboard');
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        console.log('Google Sign-In cancelled by user.');
      } else if (err.code === AuthErrorCodes.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL) {
        setError('An account with this email already exists. Please sign in using your original method.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('A network error occurred. Please check your connection and try again.');
      }
      else {
        console.error('Google sign-in error:', err);
        setError(err.message || 'An error occurred during Google sign-in. Please try again.');
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
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const referralCode = formData.get('referralCode') as string;


    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      setIsLoading(false);
      return;
    }
    
    try {
      // Step 1: Create the Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Set their display name in Firebase Auth
      await updateProfile(user, { displayName: username });

      // Step 3: Send verification email with referral code in continue URL
      const continueUrl = `${window.location.origin}/auth/action?mode=verifyEmail${referralCode ? `&referralCode=${encodeURIComponent(referralCode)}` : ''}`;
      const actionCodeSettings: ActionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true,
      };

      await sendEmailVerification(user, actionCodeSettings);
      
      // Step 4: DO NOT create the Firestore profile here. Redirect to the verify-email page.
      toast({
            title: 'Almost there!',
            description: "We've sent a verification link to your email. Please verify to continue.",
      });
      router.push('/verify-email');


    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please try another.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('A network error occurred. Please check your internet connection and try again.');
      }
      else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
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
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Join Aernify to start earning rewards today!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
              Sign Up with Google
            </Button>
            <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="Your cool name" required disabled={isLoading || isGoogleLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Email" required disabled={isLoading || isGoogleLoading}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required disabled={isLoading || isGoogleLoading}/>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input id="referralCode" name="referralCode" placeholder="Enter a code" disabled={isLoading || isGoogleLoading}/>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
