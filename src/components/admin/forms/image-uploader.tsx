'use client';

import { useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, UploadCloud, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Define the Cloudinary and widget types for better type safety
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
  const [widget, setWidget] = useState<({ open: () => void; }) | null>(null);
  const [isScriptLoading, setIsScriptLoading] = useState(true);

  const handleScriptLoad = () => {
    setIsScriptLoading(false);
    if (window.cloudinary) {
      const newWidget = window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: 'default', // Make sure you have a default preset in Cloudinary
          sources: ['local', 'url', 'camera'],
          multiple: false,
          cropping: true,
          croppingAspectRatio: 1,
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            onChange(result.info.secure_url);
          }
        }
      );
      setWidget(newWidget);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent form submission
    widget?.open();
  };

  return (
    <>
      {/* The Script component handles loading the external Cloudinary script */}
      <Script
        id="cloudinary-upload-widget"
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
        onError={() => {
          setIsScriptLoading(false);
          // In a real app, you might want to show a persistent error to the user
          // For now, we just disable the button
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
              onClick={handleUploadClick}
              disabled={isScriptLoading || !widget}
            >
              {isScriptLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isScriptLoading && 'Loading Uploader...'}
              {!isScriptLoading && !widget && 'Uploader Failed'}
              {!isScriptLoading && widget && (
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
