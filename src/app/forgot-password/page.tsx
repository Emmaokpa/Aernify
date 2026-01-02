
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
import { Loader2, MailCheck, AlertTriangle } from 'lucide-react';
import Logo from '@/components/icons/logo';
import { sendPasswordResetEmail } from '@/ai/flows/send-email-flow';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    try {
      // We now call our custom Genkit flow instead of the Firebase client SDK
      const result = await sendPasswordResetEmail({ email });
      if (result.success) {
        setEmailSent(true);
      } else {
        setError(result.message || 'An unexpected error occurred. Please try again.');
      }
    } catch (err: any) {
      console.error("Forgot Password Error:", err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
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
          <CardTitle>Forgot Your Password?</CardTitle>
          <CardDescription>
            {emailSent
              ? "Check your inbox for a password reset link."
              : "No worries! Enter your email and we'll send you a reset link."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-6">
                <MailCheck className='w-16 h-16 text-green-500 mx-auto' />
                <p className='text-muted-foreground'>If an account with that email exists, a password reset link has been sent. Please check your spam folder if you don't see it.</p>
                <Button asChild className='w-full'>
                    <Link href="/login">Back to Sign In</Link>
                </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
           {!emailSent && (
             <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered your password?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
                </Link>
            </p>
           )}
        </CardContent>
      </Card>
    </main>
  );
}
