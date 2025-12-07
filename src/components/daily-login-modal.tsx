import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Coins } from 'lucide-react';

type DailyLoginModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function DailyLoginModal({ isOpen, onOpenChange }: DailyLoginModalProps) {
  const dailyReward = 20;

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
