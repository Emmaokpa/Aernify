import { Coins } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Coins className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold text-foreground">Earnify</h1>
    </div>
  );
}
