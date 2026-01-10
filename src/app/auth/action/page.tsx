
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
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
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';

type ActionState = 'loading' | 'invalid' | 'form' | 'success' | 'error';

function ResetPasswordForm({ actionCode }: { actionCode: string }) {
  const auth = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<ActionState>('form');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/expired-action-code') {
        setError(
          'This password reset link has expired. Please request a new one.'
        );
      } else if (err.code === 'auth/invalid-action-code') {
        setError(
          'This password reset link is invalid. It may have already been used.'
        );
      } else if (err.code === 'auth/weak-password') {
        setError('The new password is too weak.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center space-y-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <CardTitle>Password Reset!</CardTitle>
        <p className="text-muted-foreground">
          Your password has been successfully updated.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Proceed to Sign In</Link>
        </Button>
      </div>
    );
  }

  if (status === 'error') {
     return (
      <div className="text-center space-y-6">
        <XCircle className="w-16 h-16 text-destructive mx-auto" />
        <CardTitle>Reset Failed</CardTitle>
        <p className="text-muted-foreground">
          {error}
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
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
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
         <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
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
      <Button
        type="submit"
        className="w-full"
        disabled={status === 'loading'}
      >
        {status === 'loading' && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Reset Password
      </Button>
    </form>
  );
}

// This component is now largely deprecated in favor of the code-based flow.
// It will only handle password resets.
function AuthActionHandler() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');

  const [status, setStatus] = useState<ActionState>('loading');
  
  const verifyResetCode = useCallback(async (code: string) => {
      try {
        await verifyPasswordResetCode(auth, code);
        setStatus('form');
      } catch (err: any) {
        console.error("Failed to verify password reset code", err);
        setStatus('invalid');
      }
  }, [auth]);

  useEffect(() => {
    if (!mode || !actionCode) {
      setStatus('invalid');
      return;
    }
    
    if (mode === 'resetPassword') {
       verifyResetCode(actionCode);
    } else {
        // All other modes like verifyEmail are now handled differently
        setStatus('invalid');
    }
  }, [mode, actionCode, auth, verifyResetCode]);

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
            <Logo />
          </div>
          {status === 'loading' && <CardTitle>Verifying link...</CardTitle>}
          {status === 'form' && <CardTitle>Reset Your Password</CardTitle>}
          {status === 'invalid' && <CardTitle>Invalid or Expired Link</CardTitle>}
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
          {status === 'invalid' && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                This link is invalid or has expired. It may have already been used.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          )}
          {status === 'form' && actionCode && (
            <ResetPasswordForm actionCode={actionCode} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}


export default function AuthActionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AuthActionHandler />
        </Suspense>
    )
}
