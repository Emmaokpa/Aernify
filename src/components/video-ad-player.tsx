'use client';

import React, { useEffect, useRef } from 'react';
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
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!containerRef.current || playerRef.current) return;

    const videoEl = document.createElement('video');
    videoEl.className = 'video-js vjs-default-skin';
    containerRef.current.appendChild(videoEl);

    const setupPlayer = async () => {
      try {
        // 1. Load Google IMA SDK
        await loadScript(IMA_SDK_SRC);

        // 2. Dynamically import and register plugins
        const VjsContribAds = (await import('videojs-contrib-ads')).default;
        const VjsIma = (await import('videojs-ima')).default;
        
        videojs.registerPlugin('ads', VjsContribAds);
        videojs.registerPlugin('ima', VjsIma);

        // 3. Create Video.js player
        const player = videojs(videoEl, {
          autoplay: false,
          controls: false,
          muted: false,
          width: 640,
          height: 360,
        });

        playerRef.current = player;

        // 4. Initialize ads framework
        (player as any).ads();

        // 5. Defer IMA initialization to the next event loop tick
        setTimeout(() => {
          if (player.isDisposed()) return;
          
          // 6. Initialize IMA
          (player as any).ima({
            adTagUrl,
            debug: true,
          });

          // 7. Require user interaction to start ads
          const startAds = () => {
            player.off('click', startAds);
            // This call is crucial for iOS and other platforms
            (player as any).ima.initializeAdDisplayContainer();
            (player as any).ima.requestAds();
          };

          player.on('click', startAds);

          // 8. Reward only after all ads complete
          player.on('ads-all-ads-completed', () => {
            onAdEnded();
          });

          player.on('adserror', (e: any) => {
            console.error("Ad Error Event:", e);
            onAdError(e);
          });

        }, 0);

      } catch (err) {
        console.error("Error setting up player:", err);
        onAdError(err);
      }
    };

    setupPlayer();

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [adTagUrl, onAdEnded, onAdError]);

  return (
    <div data-vjs-player>
      <div ref={containerRef} />
      <p style={{ textAlign: 'center', marginTop: 8 }}>
        Click the video to start the ad
      </p>
    </div>
  );
}
