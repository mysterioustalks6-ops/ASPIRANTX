import React, { useRef, useEffect, useState } from 'react';
import { BikeConfig, RiderConfig, EnvironmentId, WeatherType, BIKE_PRESETS, RIDER_PRESETS } from './types';
import { ENVIRONMENTS } from './environments';
import { drawIllustratedMotorcycleRider } from './IllustratedMotorcycleRider';

export interface MountainRideCanvasProps {
  isPlaying: boolean;
  speedMultiplier: number;
  isAudioEnabled?: boolean;
  triggerIntroCamera?: boolean;
  onIntroComplete?: () => void;
  bikeConfig?: BikeConfig;
  riderConfig?: RiderConfig;
  environmentId?: EnvironmentId;
  weather?: WeatherType;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: 'mote' | 'snow' | 'mist' | 'leaf';
  phase: number;
}

interface ReflectorPost {
  prog: number; // 0 (horizon in valley) to 1 (passed camera)
  side: -1 | 1; // Left or Right edge of road
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export const MountainRideCanvas: React.FC<MountainRideCanvasProps> = ({
  isPlaying = true,
  speedMultiplier = 1.0,
  isAudioEnabled = false,
  bikeConfig = BIKE_PRESETS.adventure,
  riderConfig = RIDER_PRESETS.adventure_touring,
  environmentId = 'alpine',
  weather = 'clear',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Image Cache
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [currentEnvId, setCurrentEnvId] = useState<EnvironmentId>(environmentId);
  const [targetEnvId, setTargetEnvId] = useState<EnvironmentId>(environmentId);
  const crossfadeAlphaRef = useRef<number>(1.0);

  // Persistent Simulation State
  const simStateRef = useRef({
    totalTime: 0,
    roadScroll: 0,
    cameraSway: 0,
    cameraBounce: 0,
    smokeTimer: 0,
    lastFrameTime: performance.now(),
    particles: [] as Particle[],
    smokeList: [] as SmokeParticle[],
    posts: [] as ReflectorPost[]
  });

  // Web Audio Context for synthesized wind & motorcycle engine
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);

  // Preload Environment Images
  useEffect(() => {
    Object.values(ENVIRONMENTS).forEach((preset) => {
      const src = preset.bgImage;
      if (src && !imageCacheRef.current.has(src)) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          imageCacheRef.current.set(src, img);
        };
      }
    });
  }, []);

  // Smooth Environment Crossfade Trigger
  useEffect(() => {
    if (environmentId !== currentEnvId) {
      setTargetEnvId(environmentId);
      crossfadeAlphaRef.current = 0.0;
    }
  }, [environmentId, currentEnvId]);

  // Audio Synthesis Setup
  useEffect(() => {
    if (!isAudioEnabled) {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend().catch(() => {});
      }
      return;
    }

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // Soft Mountain Wind (Pink Noise Generator)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.08;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.setValueAtTime(420, ctx.currentTime);

        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.09, ctx.currentTime);
        windGainRef.current = windGain;

        whiteNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(ctx.destination);
        whiteNoise.start();

        // Warm 4-Stroke Adventure Twin Engine Rumble
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(54, ctx.currentTime);
        engineOscRef.current = osc;

        const engineFilter = ctx.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.setValueAtTime(140, ctx.currentTime);

        const engineGain = ctx.createGain();
        engineGain.gain.setValueAtTime(0.045, ctx.currentTime);
        engineGainRef.current = engineGain;

        osc.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(ctx.destination);
        osc.start();
      }

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {
      // Audio fallback
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isAudioEnabled]);

  // Adjust audio pitch & gain dynamically with speedMultiplier & isPlaying
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    if (!isPlaying) {
      if (engineGainRef.current) engineGainRef.current.gain.setTargetAtTime(0, now, 0.2);
      if (windGainRef.current) windGainRef.current.gain.setTargetAtTime(0.015, now, 0.3);
    } else {
      if (engineGainRef.current) engineGainRef.current.gain.setTargetAtTime(0.045, now, 0.15);
      if (windGainRef.current) windGainRef.current.gain.setTargetAtTime(0.08 * speedMultiplier, now, 0.2);
      if (engineOscRef.current) {
        const targetFreq = 54 + (speedMultiplier - 1.0) * 16;
        engineOscRef.current.frequency.setTargetAtTime(targetFreq, now, 0.15);
      }
    }
  }, [isPlaying, speedMultiplier]);

  // ─────────────────────────────────────────────────────────────
  // MAIN ANIMATION & RENDERING LOOP
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2.0);

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const s = simStateRef.current;

    // Initialize 16 roadside alpine reflector posts along the road edges
    if (s.posts.length === 0) {
      for (let i = 0; i < 16; i++) {
        s.posts.push({
          prog: i / 16,
          side: i % 2 === 0 ? -1 : 1
        });
      }
    }

    // Initialize 3D atmospheric particles (floating golden motes / pollen)
    if (s.particles.length === 0) {
      for (let i = 0; i < 36; i++) {
        s.particles.push({
          x: Math.random(),
          y: Math.random(),
          z: 0.1 + Math.random() * 0.9,
          vx: (Math.random() - 0.5) * 0.02 - 0.012,
          vy: 0.01 + Math.random() * 0.04,
          size: 1.5 + Math.random() * 3.5,
          alpha: 0.25 + Math.random() * 0.65,
          type: 'mote',
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // Key control points precisely tracing the painted alpine highway in Reference 2:
    // Horizon valley -> curving through meadow -> rider travel lane -> foreground exit
    const roadControlPoints = [
      { t: 0.00, x: 0.510, w: 0.035 },
      { t: 0.25, x: 0.530, w: 0.065 },
      { t: 0.45, x: 0.540, w: 0.115 },
      { t: 0.65, x: 0.525, w: 0.190 },
      { t: 0.74, x: 0.508, w: 0.260 }, // Rider position
      { t: 0.88, x: 0.435, w: 0.520 },
      { t: 1.00, x: 0.330, w: 0.920 }  // Foreground exit
    ];

    // ─────────────────────────────────────────────────────────────
    // RENDER FRAME
    // ─────────────────────────────────────────────────────────────
    const render = () => {
      animId = requestAnimationFrame(render);

      const now = performance.now();
      const dt = Math.min((now - s.lastFrameTime) / 1000, 0.1);
      s.lastFrameTime = now;

      const currentSpeed = isPlaying ? speedMultiplier : 0;
      if (isPlaying) {
        s.totalTime += dt;
        s.roadScroll = (s.roadScroll + dt * currentSpeed * 1.35) % 10000.0;

        // Dynamic Chase-Camera Sway & Vibration
        const targetSway = Math.sin(s.totalTime * 1.5 * currentSpeed) * 0.016;
        s.cameraSway += (targetSway - s.cameraSway) * Math.min(1.0, dt * 5.0);

        // High-frequency tarmac micro-bounce (chase camera vibration)
        s.cameraBounce = Math.sin(s.totalTime * 26 * currentSpeed) * (0.85 * dpr);

        // Update posts forward travel along road
        for (let i = 0; i < s.posts.length; i++) {
          s.posts[i].prog += dt * currentSpeed * 0.62;
          if (s.posts[i].prog > 1.0) {
            s.posts[i].prog -= 1.0;
            s.posts[i].side = i % 2 === 0 ? -1 : 1;
          }
        }

        // Smooth crossfade progression
        if (crossfadeAlphaRef.current < 1.0) {
          crossfadeAlphaRef.current = Math.min(1.0, crossfadeAlphaRef.current + dt * 0.85);
          if (crossfadeAlphaRef.current >= 1.0) {
            setCurrentEnvId(targetEnvId);
          }
        }
      } else {
        s.cameraBounce = 0;
      }

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // ─────────────────────────────────────────────────────────────
      // 1. MAJESTIC MOUNTAIN & VALLEY BACKDROP (Reference 2 Landscape)
      // ─────────────────────────────────────────────────────────────
      const cameraDriftX = s.cameraSway * w;
      const curPreset = ENVIRONMENTS[currentEnvId] || ENVIRONMENTS.alpine;
      const tgtPreset = ENVIRONMENTS[targetEnvId] || ENVIRONMENTS.alpine;
      const curImg = curPreset.bgImage ? imageCacheRef.current.get(curPreset.bgImage) : null;
      const tgtImg = tgtPreset.bgImage ? imageCacheRef.current.get(tgtPreset.bgImage) : null;

      const drawBackdrop = (img: HTMLImageElement, alpha: number) => {
        if (!img.complete || img.naturalWidth === 0) return;
        ctx.save();
        ctx.globalAlpha = alpha;

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = w / h;
        let dw: number, dh: number, dx: number, dy: number;

        if (canvasRatio > imgRatio) {
          dw = w;
          dh = w / imgRatio;
          dx = 0;
          dy = (h - dh) * 0.35;
        } else {
          dh = h;
          dw = h * imgRatio;
          dx = (w - dw) * 0.5 + cameraDriftX * 0.2;
          dy = 0;
        }

        ctx.drawImage(img, dx, dy + s.cameraBounce * 0.25, dw, dh);
        ctx.restore();
      };

      if (curImg && curImg.complete) {
        drawBackdrop(curImg, 1.0);
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
        skyGrad.addColorStop(0, curPreset.skyColors[0]);
        skyGrad.addColorStop(0.5, curPreset.skyColors[1]);
        skyGrad.addColorStop(1, curPreset.skyColors[2]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.6);
      }

      if (crossfadeAlphaRef.current < 1.0 && tgtImg && tgtImg.complete) {
        drawBackdrop(tgtImg, crossfadeAlphaRef.current);
      }

      // ─────────────────────────────────────────────────────────────
      // 2. DRIFTING CLOUDS & VOLUMETRIC SUNLIGHT
      // ─────────────────────────────────────────────────────────────
      const cloudOffset = (s.totalTime * 6.0) % w;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.ellipse((w * 0.35 + cloudOffset) % w, h * 0.16, w * 0.32, h * 0.04, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Soft volumetric sunlight
      const sunX = w * 0.76;
      const sunY = h * 0.18;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, Math.min(w * 0.55, 340));
      sunGlow.addColorStop(0, 'rgba(255, 245, 215, 0.20)');
      sunGlow.addColorStop(0.4, 'rgba(255, 220, 145, 0.07)');
      sunGlow.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, w, h * 0.55);
      ctx.restore();

      // ─────────────────────────────────────────────────────────────
      // 3. EXACT CATMULL-ROM 3D ROAD SPLINE (ALIGNED WITH REFERENCE 2)
      // ─────────────────────────────────────────────────────────────
      const getRoadSpline = (t: number) => {
        const clampedT = Math.max(0, Math.min(1, t));
        const depth = Math.pow(clampedT, 2.2);
        const y = h * 0.575 + depth * (h * 0.425);

        // Find segment in control points
        let i = 0;
        while (i < roadControlPoints.length - 2 && roadControlPoints[i + 1].t < clampedT) {
          i++;
        }

        const p0 = roadControlPoints[Math.max(0, i - 1)];
        const p1 = roadControlPoints[i];
        const p2 = roadControlPoints[Math.min(roadControlPoints.length - 1, i + 1)];
        const p3 = roadControlPoints[Math.min(roadControlPoints.length - 1, i + 2)];

        const segSpan = Math.max(0.001, p2.t - p1.t);
        const lt = Math.max(0, Math.min(1, (clampedT - p1.t) / segSpan));
        const lt2 = lt * lt;
        const lt3 = lt2 * lt;

        // Smooth Catmull-Rom interpolation
        const normX = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * lt +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * lt2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * lt3
        );

        const normW = 0.5 * (
          (2 * p1.w) +
          (-p0.w + p2.w) * lt +
          (2 * p0.w - 5 * p1.w + 4 * p2.w - p3.w) * lt2 +
          (-p0.w + 3 * p1.w - 3 * p2.w + p3.w) * lt3
        );

        const centerX = normX * w - cameraDriftX * (1 - depth * 0.25);
        const roadW = normW * w;

        // Tangent calculation
        const dt = 0.02;
        const nextT = Math.min(1, clampedT + dt);
        const nextDepth = Math.pow(nextT, 2.2);
        const nextY = h * 0.575 + nextDepth * (h * 0.425);
        const nextNormX = normX + ((-p0.x + p2.x) * 0.5 + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * lt) * (dt / segSpan);
        const nextX = nextNormX * w;
        const tangent = Math.atan2(nextX - centerX, nextY - y);

        return { x: centerX, y, roadW, depth, tangent };
      };

      // ─────────────────────────────────────────────────────────────
      // 4. FLOWING 3D ASPHALT SPEED STREAMING ("CHALTI HUI ROAD")
      // ─────────────────────────────────────────────────────────────
      const scrollPos = s.roadScroll;
      const NUM_FLOW_LINES = 36;

      ctx.save();
      ctx.lineWidth = 1.4 * dpr;
      for (let i = 0; i < NUM_FLOW_LINES; i++) {
        const streakT1 = ((i / NUM_FLOW_LINES) + (scrollPos * 0.75) % 1.0) % 1.0;
        const streakT2 = Math.min(1.0, streakT1 + 0.045);
        if (streakT1 < 0.15) continue;

        const p1 = getRoadSpline(streakT1);
        const p2 = getRoadSpline(streakT2);
        const laneShift = ((i % 9) - 4) * 0.10;

        const streakAlpha = Math.min(0.28, p1.depth * 0.45);
        ctx.strokeStyle = (i % 4 === 0)
          ? `rgba(254, 240, 138, ${streakAlpha * 0.8})`
          : `rgba(255, 255, 255, ${streakAlpha})`;

        ctx.beginPath();
        ctx.moveTo(p1.x + p1.roadW * laneShift, p1.y);
        ctx.lineTo(p2.x + p2.roadW * laneShift, p2.y);
        ctx.stroke();
      }

      // Tire wear tracks streaming along both travel lanes
      const TIRE_SEGMENTS = 30;
      for (let k = 0; k < TIRE_SEGMENTS; k++) {
        const t1 = k / TIRE_SEGMENTS;
        const t2 = (k + 1) / TIRE_SEGMENTS;
        if (t1 < 0.20) continue;

        const p1 = getRoadSpline(t1);
        const p2 = getRoadSpline(t2);

        const rubberAlpha = Math.min(0.18, p1.depth * 0.25);
        ctx.fillStyle = `rgba(15, 23, 42, ${rubberAlpha})`;

        // Left lane track
        ctx.fillRect(p1.x - p1.roadW * 0.18, p1.y, p1.roadW * 0.08, p2.y - p1.y + 1);
        // Right lane track
        ctx.fillRect(p1.x + p1.roadW * 0.16, p1.y, p1.roadW * 0.08, p2.y - p1.y + 1);
      }
      ctx.restore();

      // ─────────────────────────────────────────────────────────────
      // 5. STREAMING DOUBLE YELLOW CENTER LINE (TRUE 1/Z PERSPECTIVE)
      // ─────────────────────────────────────────────────────────────
      const DASH_COUNT = 24;
      ctx.save();
      for (let d = 0; d < DASH_COUNT; d++) {
        const dashTStart = ((d / DASH_COUNT) + (scrollPos * 0.65) % 1.0) % 1.0;
        if (dashTStart < 0.08 || dashTStart > 0.98) continue;

        const dashLenFrac = 0.040;
        const p1 = getRoadSpline(dashTStart);
        const p2 = getRoadSpline(Math.min(0.99, dashTStart + dashLenFrac));

        const dashWidth = Math.max(1.5 * dpr, p1.depth * 5.5 * dpr);
        const lineGap = Math.max(2.0 * dpr, p1.depth * 6.5 * dpr);
        const yellowAlpha = Math.min(0.85, Math.max(0.25, p1.depth * 1.5));

        ctx.strokeStyle = `rgba(250, 204, 21, ${yellowAlpha})`;
        ctx.lineWidth = dashWidth;
        ctx.lineCap = 'round';

        const nx = Math.cos(p1.tangent);
        const ny = -Math.sin(p1.tangent);

        // Left yellow stripe
        ctx.beginPath();
        ctx.moveTo(p1.x - nx * lineGap * 0.5, p1.y - ny * lineGap * 0.5);
        ctx.lineTo(p2.x - nx * lineGap * 0.5, p2.y - ny * lineGap * 0.5);
        ctx.stroke();

        // Right yellow stripe
        ctx.beginPath();
        ctx.moveTo(p1.x + nx * lineGap * 0.5, p1.y + ny * lineGap * 0.5);
        ctx.lineTo(p2.x + nx * lineGap * 0.5, p2.y + ny * lineGap * 0.5);
        ctx.stroke();
      }
      ctx.restore();

      // ─────────────────────────────────────────────────────────────
      // 6. SOLID WHITE OUTER ROAD EDGE LINES
      // ─────────────────────────────────────────────────────────────
      ctx.save();
      const EDGE_SEGMENTS = 50;
      for (let e = 0; e < EDGE_SEGMENTS; e++) {
        const t1 = e / EDGE_SEGMENTS;
        const t2 = (e + 1) / EDGE_SEGMENTS;
        if (t1 < 0.15) continue;

        const p1 = getRoadSpline(t1);
        const p2 = getRoadSpline(t2);

        const edgeW = Math.max(1.2 * dpr, p1.depth * 4.0 * dpr);
        const edgeAlpha = Math.min(0.80, 0.20 + p1.depth * 0.55);
        ctx.strokeStyle = `rgba(248, 250, 252, ${edgeAlpha})`;
        ctx.lineWidth = edgeW;

        // Left white edge
        ctx.beginPath();
        ctx.moveTo(p1.x - p1.roadW * 0.315, p1.y);
        ctx.lineTo(p2.x - p2.roadW * 0.315, p2.y);
        ctx.stroke();

        // Right white edge
        ctx.beginPath();
        ctx.moveTo(p1.x + p1.roadW * 0.685, p1.y);
        ctx.lineTo(p2.x + p2.roadW * 0.685, p2.y);
        ctx.stroke();
      }
      ctx.restore();

      // ─────────────────────────────────────────────────────────────
      // 7. THE TRAVELER (RIDER & MOTORCYCLE LIVING CHASE EFFECTS)
      // ─────────────────────────────────────────────────────────────
      // In Reference 2, the rider is at t = 0.74 (y ~ 0.74 of screen)
      const riderProg = 0.74;
      const riderGeom = getRoadSpline(riderProg);
      const bikeX = riderGeom.x;
      const bikeY = riderGeom.y + s.cameraBounce;

      // 7A. Dynamic Ground Occlusion Tire Contact Shadow
      const shadowW = w * 0.12;
      const shadowH = h * 0.016;
      const shadowGrad = ctx.createRadialGradient(bikeX, bikeY + 14 * dpr, 2, bikeX, bikeY + 14 * dpr, shadowW * 0.5);
      shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.65)');
      shadowGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
      shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(bikeX, bikeY + 14 * dpr, shadowW * 0.5, shadowH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 7B. Glowing LED Ruby Taillight (Engine RPM Pulse)
      const tailPulse = isPlaying ? (0.75 + Math.sin(s.totalTime * 8.0 * currentSpeed) * 0.25) : 0.6;
      const tailLightY = bikeY - 22 * dpr;
      const tailGrad = ctx.createRadialGradient(bikeX, tailLightY, 2, bikeX, tailLightY, 18 * dpr);
      tailGrad.addColorStop(0, `rgba(255, 50, 50, ${0.95 * tailPulse})`);
      tailGrad.addColorStop(0.35, `rgba(239, 68, 68, ${0.45 * tailPulse})`);
      tailGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.arc(bikeX, tailLightY, 18 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // 7C. Dynamic Exhaust Heat Haze & Anime Smoke Puffs
      if (isPlaying) {
        s.smokeTimer += dt;
        if (s.smokeTimer > 0.08 / Math.max(0.5, currentSpeed)) {
          s.smokeTimer = 0;
          s.smokeList.push({
            x: bikeX + 10 * dpr,
            y: bikeY + 2 * dpr,
            vx: ((Math.random() - 0.5) * 8 + 4) * dpr,
            vy: (18 + Math.random() * 14) * dpr * currentSpeed,
            radius: (3 + Math.random() * 2.5) * dpr,
            alpha: 0.35,
            life: 0,
            maxLife: 0.40 + Math.random() * 0.20
          });
        }
      }

      // Update and draw exhaust smoke puffs
      for (let i = s.smokeList.length - 1; i >= 0; i--) {
        const sm = s.smokeList[i];
        if (isPlaying) {
          sm.life += dt;
          if (sm.life >= sm.maxLife) {
            s.smokeList.splice(i, 1);
            continue;
          }
          sm.x += sm.vx * dt;
          sm.y += sm.vy * dt;
          sm.radius += 14 * dpr * dt;
        }
        const smAlpha = Math.max(0, sm.alpha * (1 - sm.life / sm.maxLife));
        ctx.fillStyle = `rgba(203, 213, 225, ${smAlpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7D. If custom preset is selected (non-default), draw custom rider overlay
      const isCustomSetup = bikeConfig.id !== 'adventure' || riderConfig.id !== 'adventure_touring';
      if (isCustomSetup) {
        const targetBikeHeight = h * 0.078;
        const bikeBaseHeight = 90;
        const bikeScale = targetBikeHeight / bikeBaseHeight;
        drawIllustratedMotorcycleRider({
          ctx,
          centerX: bikeX,
          groundY: bikeY + 12 * dpr,
          scale: bikeScale,
          time: s.totalTime,
          speedMultiplier,
          isPlaying,
          bike: bikeConfig,
          rider: riderConfig
        });
      }

      // ─────────────────────────────────────────────────────────────
      // 9. 3D FLOATING ATMOSPHERIC PARTICLES & SPEED MOTES
      // ─────────────────────────────────────────────────────────────
      ctx.save();
      const isSnow = weather === 'light_snow' || curPreset.defaultWeather === 'light_snow';
      const isMist = weather === 'mist' || curPreset.defaultWeather === 'mist';

      for (const p of s.particles) {
        if (isPlaying) {
          p.x += p.vx * currentSpeed;
          p.y += p.vy * currentSpeed * (isSnow ? 2.5 : 1.2);
          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
          if (p.y > 1) p.y -= 1;
          if (p.y < 0) p.y += 1;
        }

        const px = p.x * w;
        const py = p.y * h;

        if (isSnow) {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 1.1 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (isMist) {
          ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha * 0.16})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 4.0 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(253, 224, 71, ${p.alpha * 0.65})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, speedMultiplier, currentEnvId, targetEnvId, weather, bikeConfig, riderConfig]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full select-none pointer-events-none" />
    </div>
  );
};
