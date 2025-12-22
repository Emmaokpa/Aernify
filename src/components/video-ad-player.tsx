
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VASTClient } from 'vast-client';
import { Loader2, AlertTriangle, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';

interface VideoAdPlayerProps {
  adTagUrl: string;
  onAdEnded: () => void;
  onAdError: (error: any) => void;
}

type AdStatus = 'loading' | 'ready' | 'playing' | 'error';

export default function VideoAdPlayer({
  adTagUrl,
  onAdEnded,
  onAdError,
}: VideoAdPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<AdStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adCreative, setAdCreative] = useState<any>(null);

  useEffect(() => {
    const vastClient = new VASTClient();

    vastClient.get(adTagUrl, { wrapperChain: [] })
      .then(res => {
        if (res && res.ads && res.ads.length > 0) {
          const firstAd = res.ads[0];
          const creative = firstAd.creatives.find(c => c.type === 'linear');
          if (creative && creative.mediaFiles.length > 0) {
            // Find a playable media file (e.g., mp4)
            const playableFile = creative.mediaFiles.find(
              (mf: any) => mf.type === 'video/mp4'
            );
            if (playableFile) {
              setAdCreative(playableFile);
              setStatus('ready');
            } else {
              throw new Error('No compatible MP4 media file found in the ad response.');
            }
          } else {
            throw new Error('No video creative found in the ad response.');
          }
        } else {
          // This is the key change: handle the "no ads" case gracefully.
          setErrorMessage('No ads available right now. Please try again later.');
          setStatus('error');
          // We call onAdError so the parent component knows to close the modal, but we've set a more specific message.
          onAdError(new Error('No ads found in VAST response.'));
        }
      })
      .catch(err => {
        setErrorMessage(err.message || 'Failed to fetch or parse the ad tag.');
        setStatus('error');
        onAdError(err);
      });
  }, [adTagUrl, onAdError]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(onAdError);
      setStatus('playing');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center text-white h-full">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="mt-4">Loading Ad...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center text-white h-full p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="mt-4 text-center text-sm">Ad failed to load</p>
            <p className="mt-2 text-center text-xs text-muted-foreground">{errorMessage}</p>
          </div>
        );
      case 'ready':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button variant="ghost" className="text-white bg-black/50 rounded-full h-20 w-20" onClick={handlePlay}>
              <PlayCircle className="h-16 w-16" />
            </Button>
          </div>
        );
      case 'playing':
        return null; // Video is playing, no overlay needed
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
      {adCreative && (
        <video
          ref={videoRef}
          src={adCreative.fileURL}
          className="w-full h-full"
          onEnded={onAdEnded}
          controls={false}
          playsInline
          muted={false}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}
