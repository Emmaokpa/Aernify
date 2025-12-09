'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  CreditCard,
  Languages,
  Bell,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldOff,
  Crown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/page-header';
import { currentUser } from '@/lib/data';

const ProfileMenuItem = ({ icon, text, href }: { icon: React.ReactNode, text: string, href?: string }) => {
  const content = (
    <div
      className="flex items-center justify-between p-4 bg-card rounded-lg cursor-pointer hover:bg-muted"
    >
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">{icon}</div>
        <span className="font-medium text-foreground">{text}</span>
      </div>
      <ChevronRight className="text-muted-foreground" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

export default function ProfilePage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
  };

  const menuItems = [
    { icon: <User />, text: 'Edit Profile' },
    { icon: <ShieldCheck />, text: 'Change Password' },
    { icon: <CreditCard />, text: 'Payment history' },
    { icon: <Languages />, text: 'Language' },
    { icon: <Bell />, text: 'Notifications' },
    { icon: <FileText />, text: 'Terms and conditions', href: '/terms' },
    { icon: <HelpCircle />, text: 'Support', href: '/support' },
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <PageHeader title="Profile" />
      
      <div className="flex flex-col items-center text-center mt-4 mb-8">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
          <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
          <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{currentUser.name}</h2>
        <p className="text-muted-foreground">alex.doe@example.com</p>
      </div>

      <Card className="bg-primary/10 border border-primary/20 mb-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-primary">VIP Subscription</h3>
            <p className="font-semibold text-foreground">$4.99/month</p>
          </div>
          <ul className="space-y-3 text-foreground/90 mb-6">
            <li className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>3x Earnings on all rewards</span>
            </li>
            <li className="flex items-center gap-3">
              <ShieldOff className="w-5 h-5 text-primary" />
              <span>Remove all ads</span>
            </li>
            <li className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-primary" />
              <span>Claim exclusive gift cards</span>
            </li>
          </ul>
          <Button className="w-full" disabled>
            Upgrade
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <ProfileMenuItem key={index} {...item} />
        ))}
      </div>
      
      <div className="mt-8">
        <Button onClick={handleLogout} variant="destructive" className="w-full bg-red-600/20 text-red-500 hover:bg-red-600/30 hover:text-red-400">
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
