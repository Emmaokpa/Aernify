'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type { Player } from 'video.js';
import 'video.js/dist/video-js.css';

const IMA_SDK_SRC = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';

interface VideoAdPlayerProps {
  adTagUrl: string;
  onAdEnded: () => void;
  onAdError: (error: any) => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function VideoAdPlayer({
  adTagUrl,
  onAdEnded,
  onAdError,
}: VideoAdPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  // Phase 1: Create the player instance.
  useEffect(() => {
    if (player || !containerRef.current) return;

    const videoEl = document.createElement('video');
    videoEl.className = 'video-js vjs-default-skin';
    containerRef.current.appendChild(videoEl);

    const playerInstance = videojs(videoEl, {
      autoplay: false,
      controls: false,
      muted: false,
      width: 640,
      height: 360,
    });

    setPlayer(playerInstance);

    return () => {
      if (playerInstance && !playerInstance.isDisposed()) {
        playerInstance.dispose();
      }
      setPlayer(null);
    };
  }, [player]);

  // Phase 2: Initialize ads on the player once it's ready.
  useEffect(() => {
    if (!player) return;

    const setupAds = async () => {
      try {
        await loadScript(IMA_SDK_SRC);
        await import('videojs-contrib-ads');
        await import('videojs-ima');

        // Check if player is still valid after async operations
        if (player.isDisposed()) return;
        
        // Initialize the base ads plugin
        (player as any).ads();
        
        // Initialize the IMA plugin
        (player as any).ima({
            adTagUrl,
            debug: true,
        });

        // Add user interaction listener
        const startAds = () => {
          player.off('click', startAds);
          try {
            (player as any).ima.initializeAdDisplayContainer();
            (player as any).ima.requestAds();
            player.play();
          } catch (e) {
            onAdError(e);
          }
        };

        player.on('click', startAds);

        // Add event listeners for ad lifecycle
        player.on('ads-all-ads-completed', onAdEnded);
        player.on('adserror', onAdError);

      } catch (err) {
        onAdError(err);
      }
    };

    setupAds();

  }, [player, adTagUrl, onAdEnded, onAdError]);

  return (
    <div data-vjs-player>
      <div ref={containerRef} />
      <p style={{ textAlign: 'center', marginTop: 8 }}>
        Click the video to start the ad
      </p>
    </div>
  );
}
