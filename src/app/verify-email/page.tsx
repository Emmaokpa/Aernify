
'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // If the user's email is verified, redirect them to the dashboard.
    // This handles the case where they verify in another tab and come back.
    if (user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  // Regularly check the user's verification status
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          router.push('/dashboard');
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [auth, router]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);


  const handleResendEmail = async () => {
    if (!user || cooldown > 0) return;

    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Email Sent!',
        description: 'A new verification link has been sent to your email address.',
      });
      setCooldown(60); // Start 60-second cooldown
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      if (error.code === 'auth/too-many-requests') {
          toast({
            variant: 'destructive',
            title: 'Too Many Requests',
            description: 'You have requested too many verification emails. Please wait a moment before trying again.',
          });
      } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to resend verification email. Please try again later.',
        });
      }
    } finally {
      setIsResending(false);
    }
  };

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
                Please find the email in your inbox and click the verification link inside to activate your account. You do not need to enter a code.
            </p>
          <Button
            onClick={handleResendEmail}
            className="w-full"
            disabled={isResending || cooldown > 0}
          >
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend available in ${cooldown}s`
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
