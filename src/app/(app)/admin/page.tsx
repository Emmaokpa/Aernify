
'use client';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from './AdminAuthWrapper';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Gamepad2,
  Briefcase,
  CheckSquare,
  ShoppingBag,
  Gift,
  ArrowRight,
  TicketCheck,
  Sparkles,
  Trophy,
  PackageCheck,
  UserCog,
  Banknote,
  DollarSign,
} from 'lucide-react';
import type { NavItem } from '@/lib/types';

const adminFeatures: NavItem[] = [
  {
    title: 'Grant Admin',
    href: '/admin/grant-admin',
    icon: <UserCog className="w-8 h-8" />,
  },
  {
    title: 'Manage Games',
    href: '/admin/games',
    icon: <Gamepad2 className="w-8 h-8" />,
  },
  {
    title: 'Manage Offers',
    href: '/admin/offers',
    icon: <Briefcase className="w-8 h-8" />,
  },
  {
    title: 'Manage Affiliate Products',
    href: '/admin/affiliate-products',
    icon: <DollarSign className="w-8 h-8" />,
  },
   {
    title: 'Manage Challenges',
    href: '/admin/challenges',
    icon: <Sparkles className="w-8 h-8" />,
  },
   {
    title: 'Manage Shop',
    href: '/admin/shop',
    icon: <ShoppingBag className="w-8 h-8" />,
  },
   {
    title: 'Manage Gift Cards',
    href: '/admin/gift-cards',
    icon: <Gift className="w-8 h-8" />,
  },
  {
    title: 'Verify Offers',
    href: '/admin/verify-offers',
    icon: <CheckSquare className="w-8 h-8" />,
  },
  {
    title: 'Verify Affiliate Sales',
    href: '/admin/verify-sales',
    icon: <TicketCheck className="w-8 h-8" />,
  },
  {
    title: 'Verify Redemptions',
    href: '/admin/verify-redemptions',
    icon: <TicketCheck className="w-8 h-8" />,
  },
  {
    title: 'Process Withdrawals',
    href: '/admin/withdrawals',
    icon: <Banknote className="w-8 h-8" />,
  },
   {
    title: 'Fulfill Orders',
    href: '/admin/orders',
    icon: <PackageCheck className="w-8 h-8" />,
  },
  {
    title: 'Leaderboard',
    href: '/admin/leaderboard',
    icon: <Trophy className="w-8 h-8" />,
  },
];

export default function AdminDashboardPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin Dashboard"
        description="Select a category to manage your application."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => (
          <Link href={feature.href} key={feature.title}>
            <Card className="group hover:border-primary transition-colors hover:bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-4">
                  <div className="text-primary p-3 bg-primary/10 rounded-lg">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {feature.title}
                  </CardTitle>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </AdminAuthWrapper>
  );
}
