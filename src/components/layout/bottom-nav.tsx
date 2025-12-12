'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu,
  Gamepad2,
  ShoppingBag,
  Gift,
  Coins,
} from 'lucide-react';
import type { NavItem } from '@/lib/types';
import { Button } from '../ui/button';

const navItems: NavItem[] = [
  { title: 'Play', href: '/play', icon: <Gamepad2 /> },
  { title: 'Shop', href: '/shop', icon: <ShoppingBag /> },
  { title: 'Earn', href: '/earn', icon: <Coins /> },
  { title: 'Redeem', href: '/redeem', icon: <Gift /> },
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
                  )}
                >
                  <div className='relative w-full text-center'>
                    <div className={cn(
                      'inline-block p-1 rounded-full transition-all duration-300',
                      isActive ? 'bg-primary/20' : ''
                    )}>
                      <div className={cn("h-6 w-6", isActive && "text-primary")}>{item.icon}</div>
                    </div>
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
