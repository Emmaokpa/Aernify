
'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  value: string;
  onChange: (src: string) => void;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

export function ImageUploader({
  value,
  onChange,
}: ImageUploaderProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const widgetRef = useRef<any>();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = "qa4yjgs4";

  useEffect(() => {
    if (isScriptLoaded && window.cloudinary && !widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
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
    }
  }, [isScriptLoaded, cloudName, uploadPreset, onChange]);


  const openWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  const handleRemoveImage = () => {
    onChange('');
  }
  
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
        id="cloudinary-upload-widget"
        src="https://upload-widget.cloudinary.com/global/all.js"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div>
        {value ? (
           <div className="mb-4 flex items-center gap-4">
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
                  onClick={handleRemoveImage}
                  variant="destructive"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
             <Button
                type="button"
                variant="outline"
                onClick={openWidget}
                disabled={!isScriptLoaded}
                className="w-full"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Upload an Image
              </Button>
        )}
      </div>
    </>
  );
}
