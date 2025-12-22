'use client';

import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackButtonProps extends ButtonProps {
  config: {
    key: string;
    email: string;
    amount: number;
    currency: 'NGN';
    ref: string;
    metadata?: Record<string, any>;
  };
  onSuccess: (response: any) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const PaystackButton: React.FC<PaystackButtonProps> = ({
  config,
  onSuccess,
  onClose,
  isProcessing,
  children,
  ...props
}) => {
  const { toast } = useToast();

  const handlePayment = () => {
    if (typeof window.PaystackPop === 'undefined') {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description:
          'The payment service could not be loaded. Please refresh the page and try again.',
      });
      return;
    }

    const handler = window.PaystackPop.setup({
      ...config,
      callback: (response: any) => {
        onSuccess(response);
      },
      onClose: () => {
        onClose();
      },
    });

    handler.openIframe();
  };

  return (
    <Button onClick={handlePayment} {...props}>
      {isProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
      {children}
    </Button>
  );
};

export default PaystackButton;
