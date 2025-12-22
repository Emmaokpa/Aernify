
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
  Loader2,
  Pencil,
  Construction,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/page-header';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, isFuture } from 'date-fns';
import { useState } from 'react';
import { sendPasswordResetEmail, updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUploadForm from '@/components/image-upload-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function EditProfileDialog() {
    const { user, profile } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [displayName, setDisplayName] = useState(profile?.displayName || '');
    const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                displayName,
                photoURL,
            });
            if(auth.currentUser) {
              await updateAuthProfile(auth.currentUser, { displayName, photoURL });
            }
            toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <div className="flex items-center justify-between p-4 bg-card rounded-lg cursor-pointer hover:bg-muted">
                    <div className="flex items-center gap-4">
                        <div className="text-muted-foreground"><User /></div>
                        <span className="font-medium text-foreground">Edit Profile</span>
                    </div>
                    <ChevronRight className="text-muted-foreground" />
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Your Profile</DialogTitle>
                    <DialogDescription>Make changes to your public profile.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <Avatar className="w-20 h-20 mb-2">
                            <AvatarImage src={photoURL} />
                            <AvatarFallback>{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <ImageUploadForm onUploadSuccess={(url) => setPhotoURL(url)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const ProfileMenuItem = ({ icon, text, href, onClick, disabled = false, comingSoon = false }: { icon: React.ReactNode, text: string, href?: string, onClick?: () => void, disabled?: boolean, comingSoon?: boolean }) => {
  const content = (
    <div
      className="flex items-center justify-between p-4 bg-card rounded-lg data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none"
      onClick={onClick}
      data-disabled={disabled || comingSoon}
    >
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">{icon}</div>
        <span className="font-medium text-foreground">{text}</span>
         {comingSoon && <span className="text-xs font-semibold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Soon</span>}
      </div>
      <ChevronRight className="text-muted-foreground" />
    </div>
  );

  const wrapper = (children: React.ReactNode) => {
    if (comingSoon) {
       return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className='w-full'>{children}</TooltipTrigger>
                    <TooltipContent><p>This feature is coming soon!</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
       )
    }
    return children;
  }

  if (href && !disabled && !comingSoon) {
    return wrapper(<Link href={href} className="cursor-pointer">{content}</Link>);
  }

  return wrapper(<div className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>{content}</div>);
};


export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, profile, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setIsSendingEmail(true);
    try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
            title: "Password Reset Email Sent",
            description: `An email has been sent to ${user.email} with instructions to reset your password.`,
        });
    } catch (error) {
        console.error("Error sending password reset email:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to send password reset email. Please try again later.",
        });
    } finally {
        setIsSendingEmail(false);
    }
  };

  const menuItems = [
    { icon: <CreditCard />, text: 'Payment history', href: '/profile/history' },
    { icon: <Languages />, text: 'Language', comingSoon: true },
    { icon: <Bell />, text: 'Notifications', comingSoon: true },
    { icon: <FileText />, text: 'Terms and conditions', href: '/terms' },
    { icon: <HelpCircle />, text: 'Support', href: '/support' },
  ];
  
  if (isUserLoading) {
    return (
       <div className="w-full max-w-md mx-auto">
        <PageHeader title="Profile" />
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  const isVipActive = profile?.vipExpiresAt && isFuture(profile.vipExpiresAt.toDate());

  return (
    <div className="w-full max-w-md mx-auto">
      <PageHeader title="Profile" />
      
      <div className="flex flex-col items-center text-center mt-4 mb-8 relative">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
          <AvatarImage src={profile?.photoURL || ''} alt={profile?.displayName || 'User'} />
          <AvatarFallback>{profile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{profile?.displayName || 'Welcome'}</h2>
        <p className="text-muted-foreground">{user?.email}</p>
      </div>

      <Card className="bg-primary/10 border border-primary/20 mb-8">
        <CardContent className="p-6">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold text-primary">
              {isVipActive ? 'VIP Member' : 'VIP Subscription'}
            </h3>
            {!isVipActive && <p className="font-semibold text-foreground">₦5,000/month</p>}
          </div>
           {isVipActive ? (
             <div className="text-center text-primary font-semibold flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-green-400">
                    <Crown className="w-5 h-5" />
                    <span>Your 2x earning rate is active!</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Expires in {formatDistanceToNow(profile.vipExpiresAt.toDate(), { addSuffix: true })}
                </p>
             </div>
           ) : (
            <>
              <ul className="space-y-3 text-foreground/90 mb-6">
                <li className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>2x Earnings on all rewards</span>
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
              <Button className="w-full" asChild>
                <Link href="/vip">Upgrade to VIP</Link>
              </Button>
            </>
           )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <EditProfileDialog />
        <div onClick={handleChangePassword} className="relative">
            <ProfileMenuItem icon={<ShieldCheck />} text="Change Password" disabled={isSendingEmail}/>
            {isSendingEmail && <div className="absolute inset-0 flex items-center justify-end pr-4"><Loader2 className="h-5 w-5 animate-spin"/></div>}
        </div>
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
