
'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  value: string;
  onChange: (src: string) => void;
  onRemove: () => void;
}

// Declare the Cloudinary object on the window
declare global {
  interface Window {
    cloudinary: any;
  }
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
}: ImageUploaderProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [widgetInstance, setWidgetInstance] = useState<any>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = 'next-cloudinary-unsigned';

  // This function will be called by the `onLoad` prop of the `next/script` component
  const initializeCloudinaryWidget = () => {
    if (window.cloudinary) {
      const myWidget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            onChange(result.info.secure_url);
          }
        }
      );
      setWidgetInstance(myWidget);
    }
  };
  
  const openWidget = () => {
    if (widgetInstance) {
      widgetInstance.open();
    }
  };

  if (!cloudName) {
    console.error('Cloudinary cloud name is not configured. Please check your .env file.');
    return (
        <div className='text-red-500'>
            Image uploader is not configured.
        </div>
    )
  }

  return (
    <>
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        onLoad={() => {
          setIsScriptLoaded(true);
          initializeCloudinaryWidget();
        }}
      />
      <div>
        <div className="mb-4 flex items-center gap-4">
          {value && (
            <div className="relative w-48 h-48 rounded-md overflow-hidden">
              <Image
                fill
                src={value}
                alt="Uploaded image"
                className="object-cover"
              />
              <div className="absolute top-2 right-2 z-10">
                <Button
                  type="button"
                  onClick={onRemove}
                  variant="destructive"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={openWidget}
          disabled={!isScriptLoaded}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Upload an Image
        </Button>
      </div>
    </>
  );
}
