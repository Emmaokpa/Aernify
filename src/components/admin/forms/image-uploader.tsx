'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, UploadCloud, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: any,
        callback: (error: any, result: any) => void
      ) => { open: () => void };
    };
  }
}

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const widgetRef = useRef<({ open: () => void; }) | null>(null);

  const handleScriptLoad = () => {
    setIsScriptLoading(false);
    if (window.cloudinary) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: 'default',
          sources: ['local', 'url', 'camera'],
          multiple: false,
          cropping: true,
          croppingAspectRatio: 16/9,
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            onChange(result.info.secure_url);
          }
        }
      );
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    widgetRef.current?.open();
  };

  return (
    <>
      <Script
        id="cloudinary-upload-widget-script"
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
        onError={() => setIsScriptLoading(false)}
      />
      
      <div>
        {value ? (
          <div className="relative group">
            <Image
              src={value}
              alt="Uploaded image"
              width={400}
              height={225}
              className="rounded-md object-cover w-full aspect-[16/9]"
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
              onClick={handleUploadClick}
              disabled={isScriptLoading || !widgetRef.current}
            >
              {isScriptLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isScriptLoading && 'Loading Uploader...'}
              {!isScriptLoading && !widgetRef.current && 'Uploader Failed'}
              {!isScriptLoading && widgetRef.current && (
                <>
                  <UploadCloud className="mr-2" />
                  Upload an Image
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
