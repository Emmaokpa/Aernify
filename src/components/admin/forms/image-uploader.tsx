
'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2 } from 'lucide-react';

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface ImageUploaderProps {
  value: string;
  onChange: (src: string) => void;
  onRemove: () => void;
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
}: ImageUploaderProps) {
  const cloudinaryRef = useRef<any>();
  const widgetRef = useRef<any>();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    if (cloudinaryRef.current && cloudName) {
      widgetRef.current = cloudinaryRef.current.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: 'next-cloudinary-unsigned',
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            onChange(result.info.secure_url);
          }
        }
      );
    }
  }, [cloudName, onChange]);

  if (!cloudName) {
    console.error('Cloudinary cloud name is not configured. Please check your .env file.');
    return (
        <div className='text-red-500'>
            Image uploader is not configured.
        </div>
    )
  }

  return (
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
        onClick={() => widgetRef.current?.open()}
      >
        <ImagePlus className="h-4 w-4 mr-2" />
        Upload an Image
      </Button>
    </div>
  );
}
