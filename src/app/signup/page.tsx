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

export default function SignUpPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success
    toast({
      title: 'Account Created!',
      description: "You've successfully signed up. Redirecting to login...",
    });
    
    router.push('/login');
    setIsLoading(false);
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
              <Input id="username" placeholder="Your cool name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input id="referralCode" placeholder="Enter a code" />
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
