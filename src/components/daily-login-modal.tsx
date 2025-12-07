
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Coins } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';

type DailyLoginModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function DailyLoginModal({ isOpen, onOpenChange }: DailyLoginModalProps) {
  const dailyReward = 20;
  const { user } = useUser();
  const firestore = useFirestore();
  const [bonusClaimed, setBonusClaimed] = useState(false);

  useEffect(() => {
    // Only attempt to claim the bonus if the modal is open, a user is logged in, and it hasn't been claimed in this session.
    if (isOpen && user && !bonusClaimed) {
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
      const lastLoginDate = localStorage.getItem(`lastLogin_${user.uid}`);

      if (lastLoginDate !== today) {
        const userDocRef = doc(firestore, 'users', user.uid);
        
        // Use non-blocking update to increment coins
        updateDocumentNonBlocking(userDocRef, {
          coins: increment(dailyReward),
          lastLogin: new Date().toISOString(),
        });

        localStorage.setItem(`lastLogin_${user.uid}`, today);
        setBonusClaimed(true);
      } else {
        // If they already logged in today, just close the modal.
        // We can do this silently or after a short delay.
        // For now, let's just not show the reward state.
        // In a more robust app, we might not even open the modal.
      }
    }
  }, [isOpen, user, firestore, bonusClaimed]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            {dailyReward}
          </p>
          <p className="text-muted-foreground">Coins have been added to your balance.</p>
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
