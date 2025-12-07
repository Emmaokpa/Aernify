'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu,
  Gamepad2,
  ShoppingBag,
  Gift,
  Trophy,
} from 'lucide-react';
import type { NavItem } from '@/lib/types';
import { Button } from '../ui/button';

const navItems: NavItem[] = [
  { title: 'Play', href: '/play', icon: <Gamepad2 /> },
  { title: 'Shop', href: '/shop', icon: <ShoppingBag /> },
  { title: 'Redeem', href: '/redeem', icon: <Gift /> },
  { title: 'Top', href: '/leaderboard', icon: <Trophy /> },
];

type BottomNavProps = {
  onMenuClick: () => void;
}

export default function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-30 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="p-2">
        <ul className="grid grid-cols-5 gap-1">
          <li>
            <Button
              onClick={onMenuClick}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200 w-full h-full bg-transparent text-muted-foreground hover:text-primary focus:text-primary shadow-none'
              )}
              variant="ghost"
            >
              <div className="h-6 w-6"><Menu /></div>
              <span className="text-xs font-medium">Menu</span>
            </Button>
          </li>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200',
                    'text-muted-foreground hover:text-primary',
                    isActive && 'text-primary'
                  )}
                >
                  <div className='relative'>
                    <div className="h-6 w-6">{item.icon}</div>
                    {isActive && <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full' />}
                  </div>
                  <span className={cn("text-xs font-medium", isActive && "text-primary")}>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
