'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Coins, LogOut, Menu, User, LogIn } from 'lucide-react';
import Logo from '../icons/logo';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { currentUser as staticUser } from '@/lib/data';

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  // Do not render the header on the profile page or auth pages
  if (pathname === '/profile' || pathname === '/login' || pathname === '/signup') {
    return null;
  }
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6 md:h-auto md:relative md:border-none md:bg-transparent md:backdrop-filter-none">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="hidden md:block">
        <Logo />
      </div>
      <div className="flex w-full items-center justify-end gap-4">
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary">
          <Coins className="h-5 w-5" />
          <span>{staticUser.coins.toLocaleString() || 0}</span>
        </div>
        
        {isUserLoading && <Skeleton className="h-10 w-10 rounded-full" />}
        {!isUserLoading && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!isUserLoading && !user && (
           <Button asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
