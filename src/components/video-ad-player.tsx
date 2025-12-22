
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface VideoAdPlayerProps {
  adTagUrl: string;
  onAdEnded: () => void;
  onAdError: (error: any) => void;
}

type PlayerStatus = 'loading' | 'playing' | 'error' | 'ended';

export default function VideoAdPlayer({
  adTagUrl,
  onAdEnded,
  onAdError,
}: VideoAdPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAndParseVast = async () => {
      setStatus('loading');
      try {
        const response = await fetch(adTagUrl);
        if (!response.ok) {
          throw new Error(`VAST request failed with status: ${response.status}`);
        }
        const vastString = await response.text();

        if (!isMounted) return;

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(vastString, 'text/xml');
        
        const errorNode = xmlDoc.querySelector('Error');
        if (errorNode) {
            const errorCode = errorNode.getAttribute('errorCode');
            let message = `Ad server returned an error (Code: ${errorCode || 'unknown'}).`;
            // Common VAST error codes for "no ad available"
            if (errorCode === '301' || errorCode === '303' || !errorCode) {
                 message = 'No ads are available at the moment. Please try again later.';
            }
            // Instead of throwing, set the error state
            setErrorMessage(message);
            setStatus('error');
            onAdError(new Error(message));
            return; // Stop further processing
        }

        const mediaFiles = xmlDoc.getElementsByTagName('MediaFile');
        let compatibleUrl: string | null = null;
        
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const type = file.getAttribute('type');
          if (type === 'video/mp4' || type === 'video/webm' || type === 'video/ogg') {
            compatibleUrl = file.textContent?.trim() || null;
            break;
          }
        }
        
        if (compatibleUrl) {
          setVideoSrc(compatibleUrl);
          setStatus('playing');
        } else {
          throw new Error('No compatible video format (MP4, WebM, OGV) found in the ad response.');
        }

      } catch (error: any) {
        if (isMounted) {
          setErrorMessage(error.message);
          setStatus('error');
          onAdError(error);
        }
      }
    };

    fetchAndParseVast();

    return () => {
      isMounted = false;
    };
  }, [adTagUrl, onAdError]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (status === 'playing' && videoSrc && videoElement) {
      videoElement.play().catch(err => {
         console.error("Autoplay failed:", err);
         setErrorMessage("Could not automatically play ad. Please ensure your browser allows autoplay.");
         setStatus('error');
         onAdError(err);
      });
    }
  }, [status, videoSrc, onAdError]);


  const handleVideoEnded = () => {
      if (status !== 'ended') {
          setStatus('ended');
          onAdEnded();
      }
  }

  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative flex items-center justify-center">
      {status === 'loading' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="absolute bottom-4 text-white text-sm">Loading Ad...</p>
        </>
      )}

      {status === 'error' && (
        <div className="text-center p-4 text-white">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <p className="font-semibold">Ad Playback Error</p>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      )}

      {videoSrc && status === 'playing' && (
        <video
          key={videoSrc} // Force re-mount of video element when src changes
          ref={videoRef}
          src={videoSrc}
          onEnded={handleVideoEnded}
          onError={() => {
             setStatus('error');
             setErrorMessage('The video file could not be played.');
             onAdError(new Error('Video element failed to play the source.'));
          }}
          className={'w-full h-full object-contain'}
          controls
          playsInline
        />
      )}
    </div>
  );
}
