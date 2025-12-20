import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import Link from 'next/link';

const LandingHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

const LandingFooter = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
        <Logo href="/" />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Aernify. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Terms of Service
          </Link>
          <Link
            href="/support"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authPages = ['/login', '/signup', '/forgot-password', '/auth/action'];
  // A bit of a hack to get the pathname on the server.
  // In a real app, you might use middleware or a different approach.
  const isAuthPage = typeof window !== 'undefined' && authPages.includes(window.location.pathname);

  if (isAuthPage) {
    return <main className="flex items-center justify-center min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-grow">{children}</main>
      <LandingFooter />
    </div>
  );
}
