'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, UploadCloud, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface CloudinaryWidget {
  open: () => void;
}

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const widgetRef = useRef<CloudinaryWidget | null>(null);

  const initializeWidget = () => {
    if (window.cloudinary && !widgetRef.current) {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: 'default',
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            onChange(result.info.secure_url);
          }
        }
      );
      widgetRef.current = widget;
      setIsScriptLoading(false);
    }
  };

  const openWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  return (
    <>
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="lazyOnload"
        onLoad={initializeWidget}
        onError={() => {
          // In a real app, you'd show a UI error here.
          // For now, we just log and prevent the button from being enabled.
          setIsScriptLoading(false); 
        }}
      />
      <div>
        {value ? (
          <div className="relative group">
            <Image
              src={value}
              alt="Uploaded image"
              width={400}
              height={300}
              className="rounded-md object-cover w-full aspect-[4/3]"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <div className="mb-4">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="mb-4 text-muted-foreground">
              No image uploaded.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={openWidget}
              disabled={isScriptLoading}
            >
              {isScriptLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2" />
              )}
              Upload an Image
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
