
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Moon,
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
import { Switch } from '@/components/ui/switch';
import PageHeader from '@/components/page-header';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // Memoize the doc reference
  const userDocRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [authUser, firestore]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, isUserLoading, router]);

  const handleLogout = () => {
    signOut(auth);
    router.push('/login');
  };

  const menuItems = [
    { icon: <User />, text: 'Edit Profile' },
    { icon: <ShieldCheck />, text: 'Change Password' },
    { icon: <Moon />, text: 'Dark/light themes', isSwitch: true },
    { icon: <CreditCard />, text: 'Payment history' },
    { icon: <Languages />, text: 'Language' },
    { icon: <Bell />, text: 'Notifications' },
    { icon: <FileText />, text: 'Terms and conditions' },
    { icon: <HelpCircle />, text: 'Support' },
  ];

  const isLoading = isUserLoading || isUserDataLoading;

  if (isLoading || !authUser || !userData) {
    return (
      <div className="w-full max-w-md mx-auto">
        <PageHeader title="Profile" />
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Card className="bg-primary/10 border border-primary/20 mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-3 mb-6">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <PageHeader title="Profile" />
      
      <div className="flex flex-col items-center text-center mt-4 mb-8">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
          <AvatarImage src={userData.photoURL || authUser.photoURL || undefined} alt={userData.username || 'User'} />
          <AvatarFallback>{userData.username?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{userData.username || authUser.displayName}</h2>
        <p className="text-muted-foreground">{authUser.email}</p>
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
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-card rounded-lg cursor-pointer hover:bg-muted"
          >
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground">{item.icon}</div>
              <span className="font-medium text-foreground">{item.text}</span>
            </div>
            {item.isSwitch ? <Switch defaultChecked /> : <ChevronRight className="text-muted-foreground" />}
          </div>
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
