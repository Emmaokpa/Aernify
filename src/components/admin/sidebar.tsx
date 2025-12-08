
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Gamepad2,
  ListChecks,
  ShoppingBag,
  Gift,
  X,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';
import Logo from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard /> },
];

type SidebarProps = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export function Sidebar({ isOpen, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = () => {
    if (!auth) return;
    signOut(auth);
    router.push('/login');
    setOpen(false);
  };
  
  const handleBackToApp = () => {
    router.push('/');
    setOpen(false);
  }

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
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">MANAGE</p>
          <ul className="space-y-2">
            {adminNavItems.map((item) => (
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
          </ul>
        </nav>
      </ScrollArea>
      <div className="p-4 border-t space-y-2">
          <Button variant="outline" className="w-full" onClick={handleBackToApp}>
            <ArrowLeft className="mr-2" />
            Back to App
          </Button>
          <Button variant="destructive" className="w-full bg-red-600/20 text-red-500 hover:bg-red-600/30 hover:text-red-400" onClick={handleLogout}>
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
