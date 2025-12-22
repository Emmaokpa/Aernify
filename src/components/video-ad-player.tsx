
'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type { Player } from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads'; // Import contrib-ads before IMA
import 'videojs-ima';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

// Extend the Player interface from video.js to include the 'ima' property
interface PlayerWithIMA extends Player {
  ima: any;
}

interface VideoAdPlayerProps {
  adTagUrl: string;
  onAdEnded: () => void;
  onAdError: (error: any) => void;
}

export default function VideoAdPlayer({
  adTagUrl,
  onAdEnded,
  onAdError,
}: VideoAdPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerWithIMA | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const { toast } = useToast();

  useEffect(() => {
    if (!videoRef.current || playerRef.current) {
      return;
    }

    // 1. Create video element
    const videoElement = document.createElement('video');
    videoElement.classList.add('video-js', 'vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    // 2. Define player and IMA options
    const playerOptions = {
      controls: false,
      preload: 'auto',
      muted: false,
      fluid: true,
      width: 640,
      height: 360,
    };

    const imaOptions = {
      id: 'ima-plugin',
      adTagUrl: adTagUrl,
      debug: process.env.NODE_ENV === 'development',
      disableAdControls: true,
    };
    
    // 3. Initialize player
    const player = videojs(videoElement, playerOptions) as PlayerWithIMA;
    playerRef.current = player;
    setStatus('ready');

    // 4. Initialize IMA plugin on the player
    player.ima(imaOptions);

    // 5. Setup event listeners
    const handleAdEnd = () => {
      onAdEnded();
    };

    const handleAdsError = (event: any) => {
      setStatus('error');
      const adError = event.getError ? event.getError() : event;
      let friendlyMessage = 'An ad error occurred. Please try again later.';
      
      if (adError && adError.getErrorCode) {
        switch (adError.getErrorCode()) {
          case 1009: // VAST response contains no ads
            friendlyMessage = "No ads are available at this moment. Please try again later.";
            break;
          case 303: // No supported media file
            friendlyMessage = "The ad server did not provide a compatible video format.";
            break;
          case 402: // Timeout
            friendlyMessage = "The ad took too long to load. Please check your connection.";
            break;
          default:
            console.error(`Unhandled Ad Error Code: ${adError.getErrorCode()}`, adError.getMessage());
            break;
        }
      } else {
        console.error("Unknown Ad Error Structure:", adError);
      }
      
      setErrorMessage(friendlyMessage);
      onAdError(adError || new Error(friendlyMessage));
    };

    player.on('ended', handleAdEnd);
    player.on('adserror', handleAdsError);
    player.on('aderror', handleAdsError); // Catch more general ad errors

    // Cleanup on unmount
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [adTagUrl, onAdEnded, onAdError]);


  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative" data-vjs-player>
      <div ref={videoRef} className="w-full h-full" />
      
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-center font-semibold">Loading Ad...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-20">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-center font-semibold">Ad Playback Error</p>
          <p className="mt-2 text-center text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

