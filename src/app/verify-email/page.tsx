
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
import { Loader2, MailCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/icons/logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VerifyEmailPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if already verified.
  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendCode = useCallback(async () => {
    if (!user || cooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    try {
      const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
      
      toast({
        title: 'Verification Code Sent!',
        description: 'A new code has been sent to your email address.',
      });
      setCooldown(60);
    } catch (error: any) {
      console.error('Error resending verification code:', error);
      setError(error.message || 'Failed to resend verification code.');
      toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to resend code. Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  }, [user, cooldown, isResending, toast]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || code.length !== 6) {
        setError("Please enter a valid 6-digit code.");
        return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
        const response = await fetch('/api/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid, code }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Verification failed.');
        }
        
        toast({
            title: "Success!",
            description: "Your email has been verified. Welcome to Aernify!",
        });

        // The user's auth state will update automatically, triggering the redirect effect.
        await user.reload();
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Error verifying code:", error);
        setError(error.message);
    } finally {
        setIsVerifying(false);
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
  
  if (!user) {
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
            We've sent a 6-digit code to your email address:
            <br />
            <strong className="text-foreground">{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <MailCheck className="w-16 h-16 text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">
                Please enter the code below to activate your account.
            </p>
            <form onSubmit={handleVerifyCode} className="space-y-4 pt-4">
              {error && (
                <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}
                <div className="space-y-2 text-left">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input 
                        id="verification-code" 
                        value={code}
                        onChange={(e) => setCode(e.target.value.trim())}
                        maxLength={6}
                        placeholder="_ _ _ _ _ _"
                        className="text-center text-lg font-mono tracking-[0.5em]"
                    />
                </div>
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isVerifying || code.length !== 6}
                >
                    {isVerifying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ): null}
                    Verify Account
                </Button>
            </form>
          <Button
            onClick={handleResendCode}
            className="w-full"
            variant="secondary"
            disabled={isResending || cooldown > 0}
          >
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend Code (${cooldown}s)`
            ) : (
              'Resend Code'
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
