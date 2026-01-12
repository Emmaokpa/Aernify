'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
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
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyEmailPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Set up a listener to check for email verification status
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          toast({
            title: "Success!",
            description: "Your email has been verified. Welcome to Aernify!",
          });
          router.push('/dashboard');
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [user, router, toast]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendLink = useCallback(async () => {
    if (!user || cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Link Sent!',
        description: 'A new verification link has been sent to your email address.',
      });
      setCooldown(60);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to resend link. Please try again later.',
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

  if (!user || user.emailVerified) {
     router.push('/dashboard');
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
            Please click the link in the email to activate your account. You can close this tab after verifying.
          </p>
          <Button
            onClick={handleResendLink}
            className="w-full"
            variant="secondary"
            disabled={isResending || cooldown > 0}
          >
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend Link (${cooldown}s)`
            ) : (
              'Resend Link'
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
