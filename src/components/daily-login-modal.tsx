'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Coins, Gift, Sparkles } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { useState, useEffect } from 'react';

type DailyLoginModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  reward: number;
  bonus: number;
  streak: number;
};

const confettiConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 70,
  dragFriction: 0.12,
  duration: 3000,
  stagger: 3,
  width: "10px",
  height: "10px",
  perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

export default function DailyLoginModal({ isOpen, onOpenChange, reward, bonus, streak }: DailyLoginModalProps) {
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti after a short delay to allow the modal to animate in
      const timer = setTimeout(() => setIsConfettiActive(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsConfettiActive(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] text-center" hideCloseButton>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Confetti active={isConfettiActive} config={confettiConfig} />
        </div>
        <DialogHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
             {bonus > 0 ? <Gift className="h-8 w-8 text-primary" /> : <Calendar className="h-8 w-8 text-primary" />}
          </div>
          <DialogTitle className="text-2xl">
            {bonus > 0 ? `Day ${streak} Streak Bonus!` : 'Daily Login Bonus!'}
          </DialogTitle>
          <DialogDescription>
            Thanks for coming back! Here is your reward for today.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Daily Reward</p>
            <p className="text-4xl font-bold text-primary flex items-center justify-center gap-2">
              <Coins className="h-8 w-8" />
              {reward}
            </p>
          </div>

          {bonus > 0 && (
            <div className='animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200'>
              <p className="text-sm text-muted-foreground">Streak Bonus</p>
              <p className="text-3xl font-bold text-amber-400 flex items-center justify-center gap-2">
                <Sparkles className="h-7 w-7" />
                {bonus}
              </p>
            </div>
          )}

          <p className="text-lg font-bold text-foreground pt-4">
             Total: {reward + bonus} Coins!
          </p>
           <p className="text-muted-foreground text-sm">
             You are on a {streak}-day streak. Keep it up!
          </p>
        </div>
        <Button onClick={handleClose} className="w-full">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}

    