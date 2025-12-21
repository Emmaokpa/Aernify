
'use client';
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import type { Player } from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-ima';


// The IMA SDK script must be loaded from Google's servers.
const IMA_SDK_SRC = '//imasdk.googleapis.com/js/sdkloader/ima3.js';

interface VideoAdPlayerProps {
  adTagUrl: string;
  onAdEnded: () => void;
  onAdError: (error: any) => void;
}

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (error) => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

const VideoAdPlayer: React.FC<VideoAdPlayerProps> = ({ adTagUrl, onAdEnded, onAdError }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (playerRef.current || !videoRef.current) {
      return;
    }

    const videoElement = document.createElement("video");
    videoElement.classList.add("video-js", "vjs-default-skin");
    videoRef.current.appendChild(videoElement);

    const initializePlayer = () => {
        const imaOptions = {
            id: videoElement.id,
            adTagUrl: adTagUrl,
        };

        const player = videojs(videoElement, {
            autoplay: true,
            controls: false,
            muted: false,
            width: 640,
            height: 360,
            // Pass IMA options directly into the player constructor
            plugins: {
                ima: imaOptions
            }
        });
        playerRef.current = player;
        
        // Set up event listeners
        player.on('ads-ad-started', () => {
            console.log('Ad has started playing.');
        });

        player.on('ads-all-ads-completed', () => {
            console.log('All ads completed.');
            onAdEnded();
        });

        player.on('adserror', (event: any) => {
            console.error('VAST Ad Error:', event);
            onAdError(event);
        });
    }
    
    loadScript(IMA_SDK_SRC)
      .then(initializePlayer)
      .catch(err => {
        console.error('Failed to load IMA SDK', err);
        onAdError(err);
      });

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoAdPlayer;
