'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Gamepad2,
  ListChecks,
  ShoppingBag,
  Gift,
  Trophy,
  User,
  X,
  Coins,
  Sparkles,
  LogOut,
  Shield,
  Banknote,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';
import Logo from '../icons/logo';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth, useUser } from '@/firebase';
import { useAuthContext } from '@/firebase/auth-provider';

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: <LayoutDashboard /> },
  { title: 'Play Games', href: '/play', icon: <Gamepad2 /> },
  { title: 'Challenges', href: '/challenges', icon: <Sparkles /> },
  { title: 'Earn', href: '/earn', icon: <Coins /> },
  { title: 'Affiliate', href: '/offers', icon: <ListChecks /> },
  { title: 'Shop', href: '/shop', icon: <ShoppingBag /> },
  { title: 'Redeem', href: '/redeem', icon: <Gift /> },
  { title: 'Withdraw', href: '/withdraw', icon: <Banknote /> },
  { title: 'Leaderboard', href: '/leaderboard', icon: <Trophy /> },
  { title: 'Profile', href: '/profile', icon: <User /> },
];


type SidebarProps = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export default function Sidebar({ isOpen, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const auth = useAuth();
  const { profile } = useAuthContext();

  const handleLogout = async () => {
    await auth.signOut();
    setOpen(false);
  };

  const content = (
    <div className="flex h-full flex-col">
       <div className="flex items-center justify-between p-4 border-b border-border md:border-none">
          <Logo />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      <ScrollArea className="flex-grow">
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
                    pathname === item.href && 'bg-primary/20 text-primary font-semibold'
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              </li>
            ))}
             {profile?.isVip ? null : (
                 <li>
                    <Link
                        href="/vip"
                        onClick={() => setOpen(false)}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-primary transition-all bg-primary/10 hover:bg-primary/20',
                             pathname === '/vip' && 'bg-primary/20 text-primary font-semibold'
                        )}
                        >
                        <Crown />
                        VIP Upgrade
                    </Link>
                </li>
             )}
             {profile?.isAdmin && (
                <>
                    <li className='px-3 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Admin</li>
                    <li>
                         <Link
                            href="/admin"
                            onClick={() => setOpen(false)}
                             className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
                                pathname.startsWith('/admin') && 'bg-primary/20 text-primary font-semibold'
                            )}
                         >
                            <Shield />
                            Admin Dashboard
                        </Link>
                    </li>
                </>
            )}
          </ul>
        </nav>
      </ScrollArea>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2" />
            Logout
          </Button>
        </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card md:block">
        {content}
      </aside>
      
      {/* Mobile Sidebar */}
      <div className={cn('fixed inset-0 z-50 bg-black/60 md:hidden', isOpen ? 'block' : 'hidden')} onClick={() => setOpen(false)} />
      <aside className={cn('fixed inset-y-0 left-0 z-50 w-64 bg-card transition-transform md:hidden', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        {content}
      </aside>
    </>
  );
}
