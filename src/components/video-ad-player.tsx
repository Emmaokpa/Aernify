
'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type { Player } from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads'; // Import contrib-ads before IMA
import 'videojs-ima';
import { AlertTriangle } from 'lucide-react';

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

  useEffect(() => {
    // Ensure this effect runs only once and that the video element is available
    if (!videoRef.current || playerRef.current) {
        return;
    }

    const videoElement = document.createElement('video');
    videoElement.classList.add('video-js', 'vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      autoplay: true, // Let IMA SDK handle autoplay
      controls: false,
      preload: 'auto',
      muted: true, // Start muted to help with autoplay policies
      fluid: true,
      width: 640,
      height: 360,
    }) as PlayerWithIMA;

    playerRef.current = player;
    
    // IMA SDK settings
    const imaOptions = {
        id: 'ima-plugin',
        adTagUrl: adTagUrl,
        debug: process.env.NODE_ENV === 'development', // Enable debug logging in dev
        disableAdControls: true,
    };

    player.ima(imaOptions);

    // Event listeners
    const handleAdEnd = () => {
        onAdEnded();
    };

    const handleAdsError = (event: any) => {
        // The event object is an AdErrorEvent from the IMA SDK
        const adError = event.getError ? event.getError() : event;
        console.error('Ad Error from IMA SDK:', adError);

        let friendlyMessage = 'An ad error occurred. Please try again later.';

        // IMAError Codes: https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/reference/js/google.ima.AdError.ErrorCode
        if (adError && adError.getErrorCode) {
            switch (adError.getErrorCode()) {
                case 301: // VAST media timeout
                    friendlyMessage = "The ad took too long to load.";
                    break;
                case 400: // General VAST linear error
                case 402: // VAST media file not found
                    friendlyMessage = "The ad video could not be played.";
                    break;
                case 1009: // VAST response contains no ads
                    friendlyMessage = "No ads are available at the moment. Please try again later.";
                    break;
                default:
                    // Provide a more detailed error for debugging if possible
                    friendlyMessage = `Ad Error: ${adError.getMessage()} (Code: ${adError.getErrorCode()})`;
                    break;
            }
        }
        setErrorMessage(friendlyMessage);
        onAdError(adError || new Error(friendlyMessage));
    };
    
    // Request ads after IMA is ready.
    player.on('ima_ready', () => {
      player.ima.requestAds();
    });

    player.on('ended', handleAdEnd);
    // Listen to the generic 'adserror' which catches many IMA issues.
    player.on('adserror', handleAdsError);
    // This specific event can sometimes catch errors that 'adserror' misses.
    player.on('aderror', handleAdsError);


    // Cleanup on component unmount
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    
  }, [adTagUrl, onAdEnded, onAdError]);

  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden" data-vjs-player>
      <div ref={videoRef} />
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-center font-semibold">Ad Playback Error</p>
          <p className="mt-2 text-center text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
