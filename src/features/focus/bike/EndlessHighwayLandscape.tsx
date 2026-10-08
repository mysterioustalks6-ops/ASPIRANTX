import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Wind } from 'lucide-react';
import { EndlessHighwayCanvas } from './EndlessHighwayCanvas';

export interface EndlessHighwayLandscapeProps {
  className?: string;
  isDriving?: boolean;
  progressPercent?: number; // 0 to 100%
  speedMultiplier?: number;
  playbackRate?: number;
}

export const EndlessHighwayLandscape: React.FC<EndlessHighwayLandscapeProps> = ({
  className = '',
  isDriving = true,
  progressPercent = 0,
  speedMultiplier = 1,
  playbackRate = 1.0
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Guided breathing cycle (4s in, 4s hold, 4s out) - freezes when ride is paused
  useEffect(() => {
    if (!isDriving) {
      return;
    }
    const cycle = ['Inhale', 'Hold', 'Exhale'] as const;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % 3;
      setBreathPhase(cycle[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isDriving]);

  // Handle Play/Pause and PlaybackRate dynamically
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = Math.max(0.5, Math.min(2.0, playbackRate));

    if (isDriving) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isDriving, playbackRate]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}
      aria-label="Endless highway landscape towards distant mountains and valleys"
    >
      {/* ── 1. FALLBACK ENGINE (60FPS SVG Canvas renders behind video) ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 z-0">
        <EndlessHighwayCanvas
          isDriving={isDriving}
          speedMultiplier={speedMultiplier}
          playbackRate={playbackRate}
          className="w-full h-full"
        />
      </div>

      {/* ── 2. SEAMLESS HARDWARE-ACCELERATED LOOPING VIDEO ── */}
      {!videoError && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-10 pointer-events-none">
          <video
            ref={videoRef}
            src="/assets/videos/relax_highway.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => {
              setVideoLoaded(true);
              setVideoError(false);
            }}
            onError={() => setVideoError(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Subtle vignette gradient for UI contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60 pointer-events-none" />
        </div>
      )}

      {/* ── 3. SUBTLE ZEN BREATHING HUD (TOP AMBIENT DISPLAY) ── */}
      <div className="absolute top-20 sm:top-16 left-0 right-0 flex flex-col items-center px-4 z-20 pointer-events-auto">
        {/* Short Chip (Sentence Case, Tokens) */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300 text-xs shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold">
            Himalayan valley ride
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${isDriving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'} ml-0.5`} />
        </div>

        {/* Calm Breath Cycle Pill (Sentence Case, Max 1 line) */}
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-950/75 px-3 py-1 rounded-full border border-slate-800/80 backdrop-blur-md shadow-sm">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <span>{breathPhase}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{isDriving ? 'Keep riding smoothly' : 'Resting on the verge'}</span>
        </div>
      </div>
    </div>
  );
};
