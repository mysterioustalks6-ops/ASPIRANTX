import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Wind } from 'lucide-react';

export interface EndlessHighwayLandscapeProps {
  className?: string;
  isDriving?: boolean;
  progressPercent?: number; // 0 to 100%
  speedMultiplier?: number;
  playbackRate?: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  hue: number;
  rotation: number;
  rotSpeed: number;
}

interface RoadDash {
  progress: number; // 0 (horizon) to 1 (foreground)
}

interface ReflectorPost {
  z: number; // 0 to 1
  side: -1 | 1;
}

const POSTER_SRC = '/assets/images/relax_himalayan_cinematic.jpg';

export const EndlessHighwayLandscape: React.FC<EndlessHighwayLandscapeProps> = ({
  className = '',
  isDriving = true,
  progressPercent = 0,
  speedMultiplier = 1,
  playbackRate = 1.0
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

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

  // Main 60FPS / 120FPS Cinematic Hardware-Accelerated Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Road motion simulation variables
    let roadOffset = 0;
    let smokeTimer = 0;

    // Roadside reflector posts (3D projection)
    const posts: ReflectorPost[] = [];
    for (let i = 0; i < 8; i++) {
      posts.push({ z: (i / 8), side: i % 2 === 0 ? -1 : 1 });
    }

    // Alpine floating particles (pollen, flower petals, light motes)
    const PARTICLE_COUNT = 32;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.2 + Math.random() * 0.8,
      size: 1.5 + Math.random() * 3.5,
      speedX: 0.015 + Math.random() * 0.035,
      speedY: 0.01 + Math.random() * 0.02,
      alpha: 0.25 + Math.random() * 0.55,
      hue: Math.random() > 0.6 ? 42 : Math.random() > 0.3 ? 180 : 340, // Golden pollen, alpine wind, pink petal
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2.0
    }));

    // Exhaust smoke particles
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
    const smokeList: SmokeParticle[] = [];

    // Canvas sizing with DPR handling
    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // ── MAIN RENDER LOOP ──
    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (width === 0 || height === 0) return;

      const effectiveSpeed = isDriving ? (speedMultiplier * playbackRate) : 0;
      const roadSpeed = effectiveSpeed * 0.85;

      // Advance road stream
      roadOffset = (roadOffset + dt * roadSpeed) % 1.0;

      // Update roadside reflector posts
      if (isDriving) {
        for (let i = 0; i < posts.length; i++) {
          posts[i].z += dt * roadSpeed * 0.45;
          if (posts[i].z > 1.0) {
            posts[i].z -= 1.0;
            posts[i].side = Math.random() > 0.5 ? 1 : -1;
          }
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // ─────────────────────────────────────────────────────────────
      // 1. VOLUMETRIC SUNLIGHT & LENS FLARE (Upper-right mountain summit)
      // ─────────────────────────────────────────────────────────────
      const sunX = width * 0.78;
      const sunY = height * 0.17;
      const sunPulse = 1.0 + Math.sin(now * 0.0018) * 0.08;

      // Wide ambient sunburst
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, Math.min(width * 0.65, 340) * sunPulse);
      sunGlow.addColorStop(0, 'rgba(255, 245, 215, 0.28)');
      sunGlow.addColorStop(0.35, 'rgba(255, 220, 145, 0.14)');
      sunGlow.addColorStop(0.7, 'rgba(255, 195, 110, 0.04)');
      sunGlow.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, width, height * 0.6);

      // Anamorphic Lens Flare Streaks (Cinematic Anime Style)
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(-0.25);
      const flareGrad = ctx.createLinearGradient(-180, 0, 180, 0);
      flareGrad.addColorStop(0, 'rgba(255, 230, 170, 0)');
      flareGrad.addColorStop(0.5, 'rgba(255, 248, 220, 0.35)');
      flareGrad.addColorStop(1, 'rgba(255, 230, 170, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(-180, -2, 360, 4);
      ctx.restore();

      // ─────────────────────────────────────────────────────────────
      // 2. INFINITE STREAMING 3D HIGHWAY (From Horizon to Foreground)
      // ─────────────────────────────────────────────────────────────
      // Road starts at mountain base (y: 0.56) and flares out towards bottom
      const roadHorizonY = height * 0.56;
      const roadBottomY = height * 1.02;

      // Function to calculate road centerline and width at any progress [0 = horizon, 1 = bottom]
      const getRoadProfile = (prog: number) => {
        // Perspective depth curve
        const z = Math.pow(Math.max(0, Math.min(1, prog)), 2.3);
        // S-curve lateral inflection matching the artwork's curving highway
        const curveOffset = Math.sin(prog * Math.PI * 1.2 - 0.2) * (width * 0.038) * (1 - z * 0.6);
        const centerX = width * 0.508 + curveOffset;
        const roadW = (width * 0.045) + (width * 0.88 - width * 0.045) * z;
        return { centerX, roadW, y: roadHorizonY + (roadBottomY - roadHorizonY) * z, z };
      };

      // 2A. Asphalt Speed Streaks & Texture Flow (Subtle motion lines along the road)
      if (isDriving) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const frac1 = ((i / 12) + roadOffset * 0.4) % 1.0;
          const frac2 = Math.min(1.0, frac1 + 0.06);
          const p1 = getRoadProfile(frac1);
          const p2 = getRoadProfile(frac2);
          const laneShift = ((i % 5) - 2) * 0.22;
          ctx.beginPath();
          ctx.moveTo(p1.centerX + p1.roadW * laneShift, p1.y);
          ctx.lineTo(p2.centerX + p2.roadW * laneShift, p2.y);
          ctx.stroke();
        }
      }

      // 2B. Glowing Yellow Centerline Dashes (Perspective Foreshortened)
      const DASH_COUNT = 18;
      for (let i = 0; i < DASH_COUNT; i++) {
        // Linear progress with cyclic offset
        const baseProgress = ((i / DASH_COUNT) + roadOffset) % 1.0;
        if (baseProgress < 0.08 || baseProgress > 0.98) continue;

        const dashLen = 0.045;
        const pStart = getRoadProfile(baseProgress);
        const pEnd = getRoadProfile(Math.min(0.99, baseProgress + dashLen));

        // Thickness scales with perspective z
        const dashThickness = Math.max(1.8, 8.5 * pEnd.z);
        const dashAlpha = Math.min(0.95, Math.max(0.15, pStart.z * 1.4));

        ctx.strokeStyle = `rgba(245, 185, 30, ${dashAlpha})`;
        ctx.lineWidth = dashThickness;
        ctx.lineCap = 'round';

        // Dual center line (Yellow double dashed stripes matching highway standard)
        const gap = Math.max(1.5, 4.5 * pEnd.z);
        ctx.beginPath();
        ctx.moveTo(pStart.centerX - gap, pStart.y);
        ctx.lineTo(pEnd.centerX - gap, pEnd.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pStart.centerX + gap, pStart.y);
        ctx.lineTo(pEnd.centerX + gap, pEnd.y);
        ctx.stroke();
      }

      // 2C. White Shoulder Guidelines (Soft edge illumination)
      for (let s = 0; s < 10; s++) {
        const segStart = ((s / 10) + roadOffset * 0.5) % 1.0;
        if (segStart < 0.1) continue;
        const p1 = getRoadProfile(segStart);
        const p2 = getRoadProfile(Math.min(0.99, segStart + 0.08));

        ctx.strokeStyle = `rgba(240, 245, 255, ${Math.min(0.6, p1.z * 0.85)})`;
        ctx.lineWidth = Math.max(1.2, 4.0 * p1.z);

        // Left white edge
        ctx.beginPath();
        ctx.moveTo(p1.centerX - p1.roadW * 0.48, p1.y);
        ctx.lineTo(p2.centerX - p2.roadW * 0.48, p2.y);
        ctx.stroke();

        // Right white edge
        ctx.beginPath();
        ctx.moveTo(p1.centerX + p1.roadW * 0.48, p1.y);
        ctx.lineTo(p2.centerX + p2.roadW * 0.48, p2.y);
        ctx.stroke();
      }

      // 2D. Roadside 3D Distance Posts / Reflector Markers
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        if (post.z < 0.12 || post.z > 0.95) continue;

        const prof = getRoadProfile(post.z);
        const postX = prof.centerX + (post.side * (prof.roadW * 0.52 + 12 * prof.z));
        const postY = prof.y;
        const postH = Math.max(3, 38 * prof.z);
        const postW = Math.max(1.5, 5 * prof.z);
        const alpha = Math.min(1.0, prof.z * 1.6);

        // Post body (White marker post)
        ctx.fillStyle = `rgba(245, 245, 250, ${alpha})`;
        ctx.fillRect(postX - postW * 0.5, postY - postH, postW, postH);

        // Red reflector cap on top
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.fillRect(postX - postW * 0.5, postY - postH, postW, postH * 0.28);
      }

      // ─────────────────────────────────────────────────────────────
      // 3. MOTORCYCLE RIDER LIVING DYNAMICS (Vibration, Suspension & Lighting)
      // ─────────────────────────────────────────────────────────────
      // The bike rider is stationed on the road around y: 0.73
      const bikeZProgress = 0.74;
      const bikeBaseProfile = getRoadProfile(bikeZProgress);

      // Micro engine vibration (RPM tremor frequency)
      const engineFreq = 0.048 * (playbackRate || 1.0);
      const engineVibeY = isDriving ? Math.sin(now * engineFreq) * 1.2 : 0;
      const engineVibeX = isDriving ? Math.cos(now * engineFreq * 1.5) * 0.6 : 0;

      // Road suspension breathing (Gentle road swell / bobbing)
      const suspensionBob = isDriving
        ? (Math.sin(now * 0.011) * 2.2 + Math.sin(now * 0.024) * 1.1)
        : 0;

      const bikeX = bikeBaseProfile.centerX + engineVibeX;
      const bikeY = bikeBaseProfile.y + engineVibeY + suspensionBob;

      // 3A. Dynamic Tire Contact Shadow (Grounded road occlusion)
      const shadowW = width * 0.16;
      const shadowH = height * 0.022;
      const shadowGrad = ctx.createRadialGradient(bikeX, bikeY + 18, 2, bikeX, bikeY + 18, shadowW * 0.5);
      shadowGrad.addColorStop(0, 'rgba(15, 20, 25, 0.75)');
      shadowGrad.addColorStop(0.5, 'rgba(15, 20, 25, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(15, 20, 25, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(bikeX, bikeY + 18, shadowW * 0.5, shadowH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3B. Glowing LED Ruby Taillight (Engine rhythm pulse)
      const tailPulse = isDriving ? (0.75 + Math.sin(now * 0.008) * 0.25) : 0.6;
      const tailLightY = bikeY - 26;
      const tailLightGrad = ctx.createRadialGradient(bikeX, tailLightY, 2, bikeX, tailLightY, 22);
      tailLightGrad.addColorStop(0, `rgba(255, 60, 60, ${0.9 * tailPulse})`);
      tailLightGrad.addColorStop(0.4, `rgba(239, 68, 68, ${0.45 * tailPulse})`);
      tailLightGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = tailLightGrad;
      ctx.beginPath();
      ctx.arc(bikeX, tailLightY, 22, 0, Math.PI * 2);
      ctx.fill();

      // 3C. Exhaust Heat Haze & Smoke Puffs
      if (isDriving) {
        smokeTimer += dt;
        if (smokeTimer > 0.08) {
          smokeTimer = 0;
          // Twin pipes
          for (const side of [-1, 1]) {
            smokeList.push({
              x: bikeX + side * 14,
              y: bikeY + 6,
              vx: (side * 4 + (Math.random() - 0.5) * 6),
              vy: 22 + Math.random() * 18,
              radius: 3 + Math.random() * 3,
              alpha: 0.35,
              life: 0,
              maxLife: 0.38 + Math.random() * 0.2
            });
          }
        }
      }

      // Draw and update smoke particles
      for (let i = smokeList.length - 1; i >= 0; i--) {
        const sm = smokeList[i];
        sm.life += dt;
        if (sm.life >= sm.maxLife) {
          smokeList.splice(i, 1);
          continue;
        }
        sm.x += sm.vx * dt;
        sm.y += sm.vy * dt;
        sm.radius += 18 * dt;
        const smAlpha = Math.max(0, sm.alpha * (1 - sm.life / sm.maxLife));
        ctx.fillStyle = `rgba(160, 175, 195, ${smAlpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─────────────────────────────────────────────────────────────
      // 4. FLOATING ALPINE PARTICLES (Golden Sun Motes & Wildflower Petals)
      // ─────────────────────────────────────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (isDriving) {
          p.x -= (p.speedX * (0.8 + p.z * 0.5) * (speedMultiplier || 1)) * dt;
          p.y += (p.speedY * (0.8 + p.z * 0.5)) * dt;
          p.rotation += p.rotSpeed * dt;

          if (p.x < -0.05) p.x = 1.05;
          if (p.y > 1.05) p.y = -0.05;
        }

        const px = p.x * width;
        const py = p.y * height;
        const pRad = p.size * p.z;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation);

        if (p.hue === 42) {
          // Golden Sunlight Mote
          ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(0, 0, pRad, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.hue === 340) {
          // Alpine Flower Petal
          ctx.fillStyle = `rgba(251, 182, 206, ${p.alpha * 0.65})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, pRad * 1.8, pRad * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Soft Wind Air Wisp
          ctx.strokeStyle = `rgba(224, 242, 254, ${p.alpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-pRad * 3, 0);
          ctx.lineTo(pRad * 3, 0);
          ctx.stroke();
        }

        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 5. CINEMATIC COLOR GRADING & UI GROUNDING VIGNETTE
      // ─────────────────────────────────────────────────────────────
      // Bottom dark fade for UI buttons contrast
      const bottomVignette = ctx.createLinearGradient(0, height * 0.68, 0, height);
      bottomVignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
      bottomVignette.addColorStop(0.55, 'rgba(2, 6, 23, 0.45)');
      bottomVignette.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
      ctx.fillStyle = bottomVignette;
      ctx.fillRect(0, height * 0.68, width, height * 0.32);

      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDriving, speedMultiplier, playbackRate]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}
      aria-label="High-Fidelity Cinematic Himalayan Endless Highway Ride"
    >
      {/* ── 1. ULTRA HIGH-RES MOVIE-LEVEL ARTWORK BACKDROP ── */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <img
          src={POSTER_SRC}
          alt="Cinematic Himalayan Mountain Highway"
          className="w-full h-full object-cover transition-transform duration-700 ease-out"
          style={{
            // Subtle living breathing scale when driving
            transform: isDriving ? 'scale(1.012)' : 'scale(1.0)',
            willChange: 'transform'
          }}
          loading="eager"
        />
      </div>

      {/* ── 2. 60FPS / 120FPS HARDWARE-ACCELERATED LIVING HIGHWAY & ATMOSPHERIC ENGINE ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none z-10"
        aria-hidden="true"
      />

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
