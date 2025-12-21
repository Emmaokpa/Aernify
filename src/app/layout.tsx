
'use client';

import './globals.css';
import 'video.js/dist/video-js.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { cn } from '@/lib/utils';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark">
      <head>
         <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
         <script async src="https://cdn.asacdn.com/aclib.js"></script>
         <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
                aclib.runAutoTag({
                    zoneId: 'fike34hhxa',
                });
              `,
            }}
          />
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
