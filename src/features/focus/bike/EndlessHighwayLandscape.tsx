import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Wind } from 'lucide-react';
import { EndlessHighwayCanvas } from './EndlessHighwayCanvas';

export interface EndlessHighwayLandscapeProps {
  className?: string;
  isDriving?: boolean;
  progressPercent?: number; // 0 to 100%
  speedMultiplier?: number;
  playbackRate?: number;
}

const CROSSFADE_SEC = 0.45; // 450ms crossfade buffer (0.3s - 0.5s requirement)
const VIDEO_SRC = '/assets/videos/relax_highway.mp4';
const POSTER_SRC = '/assets/images/relax_himalayan_cinematic.jpg';

export const EndlessHighwayLandscape: React.FC<EndlessHighwayLandscapeProps> = ({
  className = '',
  isDriving = true,
  progressPercent = 0,
  speedMultiplier = 1,
  playbackRate = 1.0
}) => {
  // Concurrent double-buffer video refs
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);

  // Active player tracking ('A' | 'B')
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const activePlayerRef = useRef<'A' | 'B'>('A');
  activePlayerRef.current = activePlayer;

  const [videoALoaded, setVideoALoaded] = useState(false);
  const [videoBLoaded, setVideoBLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isTransitioningRef = useRef(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Sync playbackRate to both video decoders
  useEffect(() => {
    const rate = Math.max(0.5, Math.min(2.0, playbackRate));
    if (videoARef.current) videoARef.current.playbackRate = rate;
    if (videoBRef.current) videoBRef.current.playbackRate = rate;
  }, [playbackRate]);

  // Handle Play/Pause when isDriving changes
  useEffect(() => {
    const vA = videoARef.current;
    const vB = videoBRef.current;

    if (isDriving) {
      const active = activePlayerRef.current === 'A' ? vA : vB;
      if (active) {
        const p = active.play();
        if (p !== undefined) p.catch(() => {});
      }
    } else {
      if (vA) vA.pause();
      if (vB) vB.pause();
    }
  }, [isDriving]);

  // Seamless Double-Buffer Handover Trigger
  const triggerHandover = useCallback(() => {
    if (isTransitioningRef.current || !isDriving) return;
    isTransitioningRef.current = true;

    const currentIsA = activePlayerRef.current === 'A';
    const outgoing = currentIsA ? videoARef.current : videoBRef.current;
    const incoming = currentIsA ? videoBRef.current : videoARef.current;

    if (!incoming) {
      isTransitioningRef.current = false;
      return;
    }

    // 1. Prime incoming player at byte 0 and start hardware decoding
    incoming.currentTime = 0;
    const playPromise = incoming.play();
    if (playPromise !== undefined) playPromise.catch(() => {});

    // 2. Flip active player state (triggers CSS crossfade: incoming 0->1, outgoing 1->0)
    setActivePlayer(currentIsA ? 'B' : 'A');

    // 3. After the crossfade duration, pause and rewind outgoing player
    setTimeout(() => {
      if (outgoing) {
        outgoing.pause();
        outgoing.currentTime = 0;
      }
      isTransitioningRef.current = false;
    }, Math.round(CROSSFADE_SEC * 1000) + 60);
  }, [isDriving]);

  // High-precision RAF loop to monitor video position and initiate crossfade 0.45s before end
  useEffect(() => {
    if (!isDriving) return;

    let rafId: number;
    const checkProgress = () => {
      const active = activePlayerRef.current === 'A' ? videoARef.current : videoBRef.current;
      if (active && active.duration > 0 && !isTransitioningRef.current) {
        const remaining = active.duration - active.currentTime;
        if (remaining <= CROSSFADE_SEC) {
          triggerHandover();
        }
      }
      rafId = requestAnimationFrame(checkProgress);
    };

    rafId = requestAnimationFrame(checkProgress);
    return () => cancelAnimationFrame(rafId);
  }, [isDriving, triggerHandover]);

  // Timeupdate fallback to guarantee handover even if RAF is throttled
  const handleTimeUpdate = (playerId: 'A' | 'B') => {
    if (playerId !== activePlayerRef.current || isTransitioningRef.current || !isDriving) return;
    const active = playerId === 'A' ? videoARef.current : videoBRef.current;
    if (active && active.duration > 0) {
      const remaining = active.duration - active.currentTime;
      if (remaining <= CROSSFADE_SEC) {
        triggerHandover();
      }
    }
  };

  // Guided breathing cycle (4s in, 4s hold, 4s out)
  useEffect(() => {
    if (!isDriving) return;
    const cycle = ['Inhale', 'Hold', 'Exhale'] as const;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % 3;
      setBreathPhase(cycle[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isDriving]);

  const anyLoaded = videoALoaded || videoBLoaded;

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}
      aria-label="Cinematic high-fidelity endless highway ride towards majestic mountain peaks"
    >
      {/* ── 1. FALLBACK ENGINE (60FPS SVG Canvas behind backdrop) ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 z-0 pointer-events-none">
        <EndlessHighwayCanvas
          isDriving={isDriving}
          speedMultiplier={speedMultiplier}
          playbackRate={playbackRate}
          className="w-full h-full"
        />
      </div>

      {/* ── 2. HIGH-RES CINEMATIC POSTER BACKDROP (Prevents black flashes) ── */}
      <div className="absolute inset-0 w-full h-full z-[1] pointer-events-none overflow-hidden">
        <img
          src={POSTER_SRC}
          alt="Majestic mountain landscape"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* ── 3. SEAMLESS DOUBLE-BUFFER CROSSFADER VIDEO PLAYERS (Player A & Player B) ── */}
      {!hasError && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-10 pointer-events-none">
          {/* PLAYER A */}
          <video
            ref={videoARef}
            src={VIDEO_SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoALoaded(true)}
            onError={() => setHasError(true)}
            onTimeUpdate={() => handleTimeUpdate('A')}
            onEnded={() => {
              if (activePlayerRef.current === 'A') triggerHandover();
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ease-in-out"
            style={{
              opacity: videoALoaded && activePlayer === 'A' ? 1 : 0,
              willChange: 'opacity'
            }}
          />

          {/* PLAYER B */}
          <video
            ref={videoBRef}
            src={VIDEO_SRC}
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setVideoBLoaded(true)}
            onError={() => setHasError(true)}
            onTimeUpdate={() => handleTimeUpdate('B')}
            onEnded={() => {
              if (activePlayerRef.current === 'B') triggerHandover();
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ease-in-out"
            style={{
              opacity: videoBLoaded && activePlayer === 'B' ? 1 : 0,
              willChange: 'opacity'
            }}
          />

          {/* ── 4. CINEMATIC LIGHTING & 3D DEPTH OVERLAYS (Movie-Level Richness) ── */}
          {/* Warm Sunlight & Natural Lens Flare (Sun glow matching mountain anime peak) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 55% 45% at 75% 20%, rgba(255, 240, 205, 0.22) 0%, rgba(255, 215, 140, 0.08) 45%, transparent 75%)',
              mixBlendMode: 'screen'
            }}
          />

          {/* Natural Atmospheric Haze & Top/Bottom Vignette (Depth grounding) */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/50 pointer-events-none" />

          {/* Delicate Roadside Light Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 100px rgba(10, 15, 29, 0.5)'
            }}
          />
        </div>
      )}

      {/* ── 5. SUBTLE ZEN BREATHING HUD (TOP AMBIENT DISPLAY) ── */}
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
