'use client';

import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2 } from 'lucide-react';

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
  const handleUpload = (result: any) => {
    onChange(result.info.secure_url);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value && (
          <div className="relative w-48 h-48 rounded-md overflow-hidden">
            <CldImage
              width="192"
              height="192"
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
      <CldUploadWidget
        onSuccess={handleUpload}
        uploadPreset="next-cloudinary-unsigned"
      >
        {({ open }) => {
          return (
            <Button
              type="button"
              variant="outline"
              onClick={() => open()}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Upload an Image
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}
