'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Coins, Loader2 } from 'lucide-react';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, increment } from 'firebase/firestore';

type DailyLoginModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const DAILY_REWARD = 20;

export default function DailyLoginModal({ isOpen, onOpenChange }: DailyLoginModalProps) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [modalState, setModalState] = useState<'hidden' | 'loading' | 'reward'>('hidden');

  const todayStr = new Date().toISOString().split('T')[0];

  const dailyLoginDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'daily_logins', `${user.uid}_${todayStr}`);
  }, [user, firestore, todayStr]);

  const { data: dailyLoginDoc, isLoading: isDocLoading } = useDoc(dailyLoginDocRef);

  useEffect(() => {
    if (!isOpen || !user || isUserLoading || isDocLoading) {
      return;
    }

    const checkAndReward = async () => {
      setModalState('loading');
      if (dailyLoginDoc) {
        // Already claimed today
        onOpenChange(false);
        setModalState('hidden');
        return;
      }

      // Not claimed yet, let's reward the user!
      const userDocRef = doc(firestore, 'users', user.uid);
      
      try {
        // Use a transaction or batch write in a real app for atomicity
        await updateDoc(userDocRef, { coins: increment(DAILY_REWARD) });
        await setDoc(dailyLoginDocRef!, { claimedAt: serverTimestamp() });
        setModalState('reward');
      } catch (error) {
        console.error("Failed to grant daily reward:", error);
        onOpenChange(false);
        setModalState('hidden');
      }
    };

    checkAndReward();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, isUserLoading, dailyLoginDocRef, dailyLoginDoc, isDocLoading]);

  const handleClose = () => {
    setModalState('hidden');
    onOpenChange(false);
  }

  if (modalState === 'hidden') {
    return null;
  }
  
  if (modalState === 'loading') {
      return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px] text-center" hideCloseButton>
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <DialogHeader>
                    <DialogTitle className="text-2xl">Checking Daily Bonus...</DialogTitle>
                </DialogHeader>
            </DialogContent>
        </Dialog>
      )
  }


  return (
    <Dialog open={modalState === 'reward'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Daily Login Bonus!</DialogTitle>
          <DialogDescription>
            Thanks for coming back! Here is your daily reward.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6">
          <p className="text-5xl font-bold text-primary flex items-center justify-center gap-2">
            <Coins className="h-10 w-10" />
            {DAILY_REWARD}
          </p>
          <p className="text-muted-foreground">Coins have been added to your balance.</p>
        </div>
        <Button onClick={handleClose} className="w-full">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
