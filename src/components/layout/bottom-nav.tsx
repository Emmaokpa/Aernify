'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Gamepad2,
  ShoppingBag,
  Gift,
  Trophy,
} from 'lucide-react';
import type { NavItem } from '@/lib/types';

const navItems: NavItem[] = [
  { title: 'Home', href: '/', icon: <LayoutDashboard /> },
  { title: 'Play', href: '/play', icon: <Gamepad2 /> },
  { title: 'Shop', href: '/shop', icon: <ShoppingBag /> },
  { title: 'Redeem', href: '/redeem', icon: <Gift /> },
  { title: 'Top', href: '/leaderboard', icon: <Trophy /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-30 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="p-2">
        <ul className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200',
                    isActive
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <div className="h-6 w-6">{item.icon}</div>
                  <span className="text-xs font-medium">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
