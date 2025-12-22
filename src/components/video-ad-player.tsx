
'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type { Player } from 'video.js';
import 'video.js/dist/video-js.css';

// We need to ensure these are imported for their side-effects
// but will register them manually to avoid bundler issues.
import 'videojs-contrib-ads';
import 'videojs-ima';

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
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // This effect runs only once when the component mounts.
    // It handles the entire setup and cleanup lifecycle.
    if (!containerRef.current || playerRef.current) {
        return;
    }

    const videoEl = document.createElement('video');
    videoEl.className = 'video-js vjs-default-skin';
    containerRef.current.appendChild(videoEl);

    const setupPlayer = async () => {
      try {
        // Phase 1: Load the external Google IMA SDK script.
        await loadScript(IMA_SDK_SRC);

        // Phase 2: Create the Video.js player instance.
        const player = videojs(videoEl, {
          autoplay: false,
          controls: false,
          muted: false,
          width: 640,
          height: 360,
        });

        playerRef.current = player;

        // Phase 3: Initialize the advertising framework on the player instance.
        // This is the call that creates the `.ads()` method.
        (player as any).ads();

        // Phase 4: Initialize the IMA plugin. This requires `.ads()` to exist.
        (player as any).ima({
            adTagUrl,
            debug: true,
        });

        // Phase 5: Set up a listener for a user click to start the ad,
        // which is required by modern browser autoplay policies.
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

        // Phase 6: Set up event listeners for ad lifecycle events.
        player.on('ads-all-ads-completed', onAdEnded);
        player.on('adserror', onAdError);

      } catch (err) {
        onAdError(err);
      }
    };

    setupPlayer();

    // The single cleanup function for this effect.
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once.

  return (
    <div data-vjs-player>
      <div ref={containerRef} />
      <p style={{ textAlign: 'center', marginTop: 8 }}>
        Click the video to start the ad
      </p>
    </div>
  );
}
