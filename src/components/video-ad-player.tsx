
'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type { Player } from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads';
import 'videojs-ima';
import { AlertTriangle, Loader2, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';

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
  const [playerState, setPlayerState] = useState<'idle' | 'loading' | 'error' | 'playing'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // This effect only runs once to create the video element and the player
    if (!videoRef.current || playerRef.current) {
      return;
    }

    const videoElement = document.createElement('video');
    videoElement.classList.add('video-js', 'vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    const playerOptions = {
      controls: false,
      autoplay: false,
      preload: 'auto',
      muted: false,
      fluid: true,
      width: 640,
      height: 360,
    };
    
    const player = videojs(videoElement, playerOptions) as PlayerWithIMA;
    playerRef.current = player;
    
    // Cleanup on unmount
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const initializeIma = () => {
    const player = playerRef.current;
    if (!player || player.ima) { // Don't re-initialize
      return;
    }

    setPlayerState('loading');
    
    const imaOptions = {
      id: 'ima-plugin',
      adTagUrl: adTagUrl,
      debug: false,
      disableAdControls: true,
      autoplay: true,
    };

    player.ima(imaOptions);

    // General ad error listener
    const handleGenericAdError = (event: any) => {
        setPlayerState('error');
        const adError = event.getError ? event.getError() : event;
        let friendlyMessage = 'An ad error occurred. Please try again later.';
        
        if (adError && adError.getErrorCode) {
            switch (adError.getErrorCode()) {
            case 1009: // No ads in VAST response
                friendlyMessage = "No ads are available right now. Please try again later.";
                break;
            case 303: // No supported media file
            case 403: // No compatible video format
                friendlyMessage = "The ad server did not provide a compatible video format.";
                break;
            case 402: // Timeout
                friendlyMessage = "The ad took too long to load. Check your connection.";
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
    
    player.on('adserror', handleGenericAdError);
    player.on('aderror', handleGenericAdError);

    // Ad lifecycle events
    player.on('ads-ad-started', () => {
      setPlayerState('playing');
    });

    player.on('ended', () => {
      onAdEnded();
    });
    
    // This is crucial: request ads *after* setting up listeners
    player.ima.requestAds();
  };

  const handlePlayClick = () => {
    const player = playerRef.current;
    if (!player) return;

    // Initialize IMA on first play click
    if (!player.ima) {
      initializeIma();
    }
    
    // The browser requires a play call directly within the user-initiated event handler
    player.play().catch((error) => {
        // This catch block handles cases where the browser *still* rejects autoplay
        console.error("Player.play() was rejected:", error);
        setPlayerState('error');
        setErrorMessage("Could not start ad playback. Please check your browser settings or try again.");
        onAdError(error);
    });
  };

  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative" data-vjs-player>
      <div ref={videoRef} className="w-full h-full" />
      
      {playerState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 z-20 cursor-pointer" onClick={handlePlayClick}>
           <Button variant="ghost" className="h-24 w-24 rounded-full bg-black/50" size="icon">
              <PlayCircle className="h-16 w-16 text-white" />
           </Button>
           <p className="mt-4 font-semibold text-lg">Play Ad to Earn Reward</p>
        </div>
      )}
      
      {playerState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-center font-semibold">Loading Ad...</p>
        </div>
      )}

      {playerState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-20">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-center font-semibold">Ad Playback Error</p>
          <p className="mt-2 text-center text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
