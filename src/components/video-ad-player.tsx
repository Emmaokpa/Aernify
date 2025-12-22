
'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type { Player } from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads'; // Import contrib-ads before IMA
import 'videojs-ima';
import { AlertTriangle, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';

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
  const [adStarted, setAdStarted] = useState(false);
  const [imaInitialized, setImaInitialized] = useState(false);

  // Effect for basic player setup
  useEffect(() => {
    if (!videoRef.current || playerRef.current) {
      return;
    }

    const videoElement = document.createElement('video');
    videoElement.classList.add('video-js', 'vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: false,
      preload: 'auto',
      muted: true, // Mute by default to help with autoplay
      fluid: true,
      width: 640,
      height: 360,
    }) as PlayerWithIMA;
    
    playerRef.current = player;

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const initializeIma = () => {
    if (!playerRef.current || imaInitialized) return;

    const player = playerRef.current;
    
    // IMA SDK settings
    const imaOptions = {
        id: 'ima-plugin',
        adTagUrl: adTagUrl,
        debug: process.env.NODE_ENV === 'development',
        disableAdControls: true,
    };

    player.ima(imaOptions);
    setImaInitialized(true);

    const handleAdEnd = () => {
        onAdEnded();
    };

    const handleAdsError = (event: any) => {
        const adError = event.getError ? event.getError() : event;
        let friendlyMessage = 'An ad error occurred. Please try again later.';
        if (adError && adError.getErrorCode) {
            switch (adError.getErrorCode()) {
                case 1009: // VAST response contains no ads
                    friendlyMessage = "No ads are available at the moment. Please try again later.";
                    break;
                default:
                    friendlyMessage = `Ad Error: ${adError.getMessage()} (Code: ${adError.getErrorCode()})`;
                    break;
            }
        }
        setErrorMessage(friendlyMessage);
        onAdError(adError || new Error(friendlyMessage));
    };

    player.on('ended', handleAdEnd);
    player.on('adserror', handleAdsError);
    player.on('aderror', handleAdsError);
    player.on('ads-ad-started', () => {
        setAdStarted(true); // Hide the play button
    });
    
    // Now that IMA is initialized, request ads.
    player.ima.requestAds();
  };

  const handlePlayClick = () => {
    if (playerRef.current) {
      // First, try to play the video to get user gesture.
      playerRef.current.play()
        .then(() => {
          // Now initialize IMA after a successful play call
          initializeIma();
        })
        .catch(err => {
          console.error("Play was prevented:", err);
          // If play fails, we can still try to initialize IMA
          initializeIma();
        });
    }
  };

  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative" data-vjs-player>
      <div ref={videoRef} className="w-full h-full" />
      
      {!adStarted && !errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Button
            variant="ghost"
            className="text-white scale-150 transform hover:scale-175 transition-transform"
            onClick={handlePlayClick}
          >
            <PlayCircle className="w-20 h-20" />
          </Button>
        </div>
      )}

      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-20">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-center font-semibold">Ad Playback Error</p>
          <p className="mt-2 text-center text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
