
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadFormProps {
  onUploadSuccess: (url: string) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function ImageUploadForm({ onUploadSuccess }: ImageUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setError(null);
      setImageUrl(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const successData = await response.json();
      setImageUrl(successData.imageUrl);
      setStatus('success');
      onUploadSuccess(successData.imageUrl);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image-upload">Select Image</Label>
          <Input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={status === 'uploading'}
          />
        </div>
        {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
        <Button type="submit" disabled={!file || status === 'uploading'}>
          {status === 'uploading' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload Image
        </Button>
      </form>
      
      {status === 'uploading' && (
        <div className="text-sm text-muted-foreground flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Uploading...</span>
        </div>
      )}

      {status === 'success' && imageUrl && (
         <div className="text-sm text-green-600 flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Upload Successful!</p>
              {imageUrl && (
                <div className='mt-2'>
                  <p className='text-xs text-muted-foreground break-all'>URL: {imageUrl}</p>
                  <div className='relative w-24 h-24 mt-2 rounded-md overflow-hidden border'>
                    <Image src={imageUrl} alt="Uploaded image" fill className="object-cover" />
                  </div>
                </div>
              )}
            </div>
        </div>
      )}

      {status === 'error' && error && (
         <div className="text-sm text-destructive flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
             <XCircle className="h-5 w-5" />
             <p>{error}</p>
        </div>
      )}
    </div>
  );
}
