
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/icons/logo';

export default function VerifyEmailPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Redirect to dashboard if already verified.
  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  // Poll for verification status changes.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      // We need to reload the user from auth to get the latest emailVerified status
      await user.reload();
      if (user.emailVerified) {
        clearInterval(interval);
        // Ensure profile exists before redirecting, in case something went wrong
        // This is a safety net. The main creation happens in /auth/action
        router.push('/auth/action?mode=verifyEmail&oobCode=manual-refresh');
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, router]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);


  const handleResendEmail = useCallback(async () => {
    if (!user || cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      // This now calls our custom backend instead of the default Firebase sender
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }), // No referral code needed on resend
      });

      if (!response.ok) {
        throw new Error('Failed to send email.');
      }

      toast({
        title: 'Verification Email Sent!',
        description: 'A new verification link has been sent to your email address.',
      });
      setCooldown(60); // Start 60-second cooldown
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to resend verification email. Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  }, [user, cooldown, isResending, toast]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (isUserLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }
  
  if (!user) {
    // If no user is found after loading, redirect to login
    router.push('/login');
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email address:
            <br />
            <strong className="text-foreground">{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <MailCheck className="w-16 h-16 text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">
                Please find the email in your inbox and **click the verification link** inside to activate your account. If you don't see it, please check your spam folder.
            </p>
          <Button
            onClick={handleResendEmail}
            className="w-full"
            disabled={isResending || cooldown > 0}
          >
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend Email (${cooldown}s)`
            ) : (
              'Resend Verification Email'
            )}
          </Button>
          <Button variant="link" onClick={handleLogout} className="text-muted-foreground">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
