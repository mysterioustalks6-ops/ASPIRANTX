import React, { useRef, useEffect } from 'react';

export interface CelestialMoon {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  color?: string;
}

export interface CelestialBody {
  id: string;
  name: string;
  type: 'rocky' | 'gas_giant' | 'ringed' | 'ice' | 'lava' | 'ocean' | 'pulsar' | 'star';
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  primaryColor: string;
  secondaryColor: string;
  atmosphereColor?: string;
  hasRings?: boolean;
  ringColor?: string;
  subject?: string;
  topic?: string;
  durationMinutes?: number;
  dateKey?: string;
  moons?: CelestialMoon[];
}

interface GalaxyCanvasProps {
  stage: number; // 1 to 10 (Cosmic Dust -> Universe)
  activeProgress?: number; // 0 to 1 (current active session progress)
  isTimerRunning?: boolean;
  bodies?: CelestialBody[];
  className?: string;
  seed?: string;
  interactive?: boolean;
  viewScale?: 'cluster' | 'system' | 'arm' | 'galaxy';
  heroPlanetName?: string;
  heroPlanetType?: string;
  heroAccentColor?: string;
  onSelectBody?: (body: CelestialBody) => void;
}

// Deterministic seed PRNG (Mulberry32)
function createSeededRandom(seedStr: string) {
  let h = 0xdeadbeef;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const GalaxyCanvas: React.FC<GalaxyCanvasProps> = ({
  stage = 1,
  activeProgress = 0,
  isTimerRunning = false,
  bodies = [],
  className = '',
  seed = 'aspirantx-cosmos',
  viewScale = 'system',
  heroPlanetName,
  heroPlanetType,
  heroAccentColor,
  onSelectBody
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    const rng = createSeededRandom(seed);

    // Setup viewport resolution with DPR cap (1.5) for high performance on mobile & budget devices
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.clientWidth || 300;
      const h = rect.height || canvas.clientHeight || 300;
      if (!w || !h) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Generate persistent starfield (3 parallax layers with realistic color temperature)
    const starCount = Math.min(180, Math.floor(canvas.clientWidth * 0.4));
    const stars = Array.from({ length: starCount }, () => {
      const layer = Math.floor(rng() * 3); // 0 = far dim, 1 = mid, 2 = near bright
      const colors = ['#f8fafc', '#93c5fd', '#fef08a', '#fda4af', '#c4b5fd'];
      return {
        x: rng() * canvas.clientWidth,
        y: rng() * canvas.clientHeight,
        radius: layer === 0 ? 0.6 : layer === 1 ? 1.0 : 1.6 + rng() * 0.8,
        color: colors[Math.floor(rng() * colors.length)],
        alpha: layer === 0 ? 0.35 : layer === 1 ? 0.65 : 0.95,
        twinkleSpeed: 0.015 + rng() * 0.035,
        twinkleOffset: rng() * Math.PI * 2,
        hasSpikes: layer === 2 && rng() > 0.65, // JWST diffraction spikes on bright stars
      };
    });

    // Particle cosmic dust for accretion during active study timer
    const dustParticles = Array.from({ length: 65 }, () => ({
      angle: rng() * Math.PI * 2,
      distance: 60 + rng() * 160,
      speed: 0.006 + rng() * 0.015,
      size: 1 + rng() * 2,
      color: rng() > 0.4 ? 'rgba(56, 189, 248, ' : 'rgba(168, 85, 247, ',
      opacity: 0.2 + rng() * 0.6
    }));

    let time = 0;

    const render = () => {
      time += 0.016;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // ── LAYER 1: DEEP COSMIC VOID & VOLUMETRIC NEBULA ────────────────
      const deepGrad = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, Math.max(width, height) * 0.75
      );
      deepGrad.addColorStop(0, 'rgba(14, 27, 46, 0.45)');
      deepGrad.addColorStop(0.5, 'rgba(8, 14, 26, 0.65)');
      deepGrad.addColorStop(1, 'rgba(6, 8, 13, 0.95)');
      ctx.fillStyle = deepGrad;
      ctx.fillRect(0, 0, width, height);

      // Volumetric Nebula Clouds (James Webb Infrared Glow)
      const nebulaColor1 = stage >= 4 ? 'rgba(99, 102, 241, 0.09)' : 'rgba(2, 132, 199, 0.09)';
      const nebulaColor2 = stage >= 5 ? 'rgba(236, 72, 153, 0.07)' : 'rgba(16, 185, 129, 0.06)';

      const nebGrad1 = ctx.createRadialGradient(
        centerX + Math.cos(time * 0.2) * 40,
        centerY + Math.sin(time * 0.2) * 30,
        20,
        centerX,
        centerY,
        width * 0.45
      );
      nebGrad1.addColorStop(0, nebulaColor1);
      nebGrad1.addColorStop(0.8, 'transparent');
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, width, height);

      const nebGrad2 = ctx.createRadialGradient(
        centerX - Math.sin(time * 0.15) * 50,
        centerY + Math.cos(time * 0.18) * 40,
        10,
        centerX,
        centerY,
        width * 0.55
      );
      nebGrad2.addColorStop(0, nebulaColor2);
      nebGrad2.addColorStop(0.85, 'transparent');
      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, width, height);

      // ── LAYER 2: 3-TIER REALISTIC STARFIELD ─────────────────────────
      for (const s of stars) {
        const twinkle = Math.sin(time * s.twinkleSpeed * 60 + s.twinkleOffset);
        const currentAlpha = Math.max(0.15, s.alpha + twinkle * 0.25);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();

        // James Webb 6-Point Diffraction Spikes on bright foreground stars
        if (s.hasSpikes && currentAlpha > 0.7) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(s.x - 7, s.y);
          ctx.lineTo(s.x + 7, s.y);
          ctx.moveTo(s.x, s.y - 7);
          ctx.lineTo(s.x, s.y + 7);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1.0;

      // ── LAYER 3: SPIRAL GALAXY ARMS (If Stage >= 3) ──────────────────
      if (stage >= 3) {
        const arms = stage >= 5 ? 4 : 2;
        const armLength = Math.min(width, height) * 0.38;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 0.03);

        for (let a = 0; a < arms; a++) {
          const armAngle = (a * (Math.PI * 2)) / arms;
          ctx.beginPath();
          for (let r = 25; r < armLength; r += 6) {
            const theta = armAngle + (r / 38);
            const px = Math.cos(theta) * r;
            const py = Math.sin(theta) * r;
            const alpha = Math.max(0, 0.25 - (r / armLength) * 0.22);
            ctx.fillStyle = stage >= 5 ? `rgba(168, 85, 247, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
            ctx.fillRect(px, py, 2, 2);
          }
        }
        ctx.restore();
      }

      // ── LAYER 4: ORBIT PATHS & CELESTIAL BODIES ──────────────────────
      const activeBodies = bodies.length > 0 ? bodies : [
        {
          id: 'earth-proto',
          name: 'Terra Nova',
          type: 'rocky' as const,
          radius: 12,
          orbitRadius: 90,
          orbitSpeed: 0.008,
          orbitAngle: 0.5,
          primaryColor: '#0284c7',
          secondaryColor: '#10b981',
          atmosphereColor: '#38bdf8'
        },
        {
          id: 'jovian-1',
          name: 'Aurelia Gas Giant',
          type: 'ringed' as const,
          radius: 18,
          orbitRadius: 155,
          orbitSpeed: 0.004,
          orbitAngle: 2.2,
          primaryColor: '#f59e0b',
          secondaryColor: '#d97706',
          hasRings: true,
          ringColor: 'rgba(251, 191, 36, 0.45)'
        }
      ];

      // Draw subtle orbital guide tracks
      for (const body of activeBodies) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, body.orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Compute orbital position
        const currentAngle = body.orbitAngle + time * body.orbitSpeed;
        const bx = centerX + Math.cos(currentAngle) * body.orbitRadius;
        const by = centerY + Math.sin(currentAngle) * body.orbitRadius;

        // Render Photorealistic Planet Sphere with Light Terminator
        ctx.save();
        ctx.translate(bx, by);

        // 1. Atmosphere Scattering Glow
        if (body.atmosphereColor) {
          const atmGrad = ctx.createRadialGradient(0, 0, body.radius * 0.8, 0, 0, body.radius * 1.5);
          atmGrad.addColorStop(0, body.atmosphereColor);
          atmGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = atmGrad;
          ctx.beginPath();
          ctx.arc(0, 0, body.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Planet Sphere with Sunlit Side Facing Central Star
        const angleToCenter = Math.atan2(centerY - by, centerX - bx);
        const sunOffsetX = Math.cos(angleToCenter) * (body.radius * 0.35);
        const sunOffsetY = Math.sin(angleToCenter) * (body.radius * 0.35);

        const sphereGrad = ctx.createRadialGradient(
          sunOffsetX, sunOffsetY, body.radius * 0.1,
          0, 0, body.radius
        );
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.25, body.primaryColor);
        sphereGrad.addColorStop(0.75, body.secondaryColor);
        sphereGrad.addColorStop(1, '#030712'); // Deep shadow on dark side

        ctx.beginPath();
        ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.fill();

        // 3. Planetary Rings (If Jovian/Ringed)
        if (body.hasRings) {
          ctx.save();
          ctx.rotate(0.45);
          ctx.scale(1, 0.32);
          ctx.beginPath();
          ctx.arc(0, 0, body.radius * 2.3, 0, Math.PI * 2);
          ctx.strokeStyle = body.ringColor || 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }

        // 4. Orbiting Moons (Accreted Task Moons)
        if (body.moons && body.moons.length > 0) {
          for (let mIdx = 0; mIdx < body.moons.length; mIdx++) {
            const moon = body.moons[mIdx];
            const mDist = moon.orbitRadius || (body.radius + 14 + mIdx * 9);
            const mAngle = time * (moon.orbitSpeed || 0.025) + (mIdx * (Math.PI * 2 / body.moons.length));
            const mx = Math.cos(mAngle) * mDist;
            const my = Math.sin(mAngle) * mDist;

            ctx.beginPath();
            ctx.arc(0, 0, mDist, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 0.75;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(mx, my, moon.radius || 3, 0, Math.PI * 2);
            ctx.fillStyle = moon.color || '#e2e8f0';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }

        ctx.restore();
      }

      // ── LAYER 5: CENTRAL STAR / QUANTUM FOCUS CORE ──────────────────
      // Central Star dynamically pulses with study flow
      const coreBreath = isTimerRunning
        ? 1.0 + Math.sin(time * 2.5) * 0.08
        : 1.0 + Math.sin(time * 0.8) * 0.04;
      const coreRadius = (22 + stage * 2.5) * coreBreath;

      // Outer Corona Glow
      const coronaGrad = ctx.createRadialGradient(
        centerX, centerY, coreRadius * 0.4,
        centerX, centerY, coreRadius * 3.2
      );
      coronaGrad.addColorStop(0, heroAccentColor ? `${heroAccentColor}70` : 'rgba(56, 189, 248, 0.45)');
      coronaGrad.addColorStop(0.4, heroAccentColor ? `${heroAccentColor}30` : 'rgba(2, 132, 199, 0.2)');
      coronaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Core Star Surface (Pure Stellar Light)
      const starGrad = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreRadius
      );
      starGrad.addColorStop(0, '#ffffff');
      starGrad.addColorStop(0.4, '#e0f2fe');
      starGrad.addColorStop(0.8, heroAccentColor || '#38bdf8');
      starGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── LAYER 6: ACTIVE FOCUS ACCRETION DISK (When Timer is Running) ─
      if (isTimerRunning || activeProgress > 0) {
        // Gravitational particle suction inward towards stellar core
        for (const p of dustParticles) {
          p.angle += p.speed * (isTimerRunning ? 1.5 : 0.5);
          // Gently pull particles inward based on session progress
          const currentDist = p.distance - (activeProgress * 40);
          const px = centerX + Math.cos(p.angle) * currentDist;
          const py = centerY + Math.sin(p.angle) * currentDist;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.opacity})`;
          ctx.fill();
        }

        // Circular accretion ring displaying active percentage
        if (activeProgress > 0) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius * 1.5, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * activeProgress));
          ctx.strokeStyle = heroAccentColor || '#38bdf8';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // ── LAYER 7: PERIODIC CELESTIAL COMET STREAK ──────────────────
      const cometCycle = time % 16;
      if (cometCycle < 2.5) {
        const cometProgress = cometCycle / 2.5;
        const startX = -80;
        const startY = height * 0.15;
        const endX = width + 80;
        const endY = height * 0.75;
        const cx = startX + (endX - startX) * cometProgress;
        const cy = startY + (endY - startY) * cometProgress;

        const cometGrad = ctx.createLinearGradient(cx - 60, cy - 35, cx, cy);
        cometGrad.addColorStop(0, 'transparent');
        cometGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
        cometGrad.addColorStop(1, '#ffffff');

        ctx.beginPath();
        ctx.moveTo(cx - 60, cy - 35);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = cometGrad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Interactive Click / Tap handling for Inspecting Celestial Worlds
    const handleClick = (e: MouseEvent) => {
      if (!onSelectBody) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const centerX = canvas.clientWidth / 2;
      const centerY = canvas.clientHeight / 2;

      for (const body of bodies) {
        const currentAngle = body.orbitAngle + time * body.orbitSpeed;
        const bx = centerX + Math.cos(currentAngle) * body.orbitRadius;
        const by = centerY + Math.sin(currentAngle) * body.orbitRadius;
        const dist = Math.hypot(clickX - bx, clickY - by);
        if (dist <= body.radius + 14) {
          onSelectBody(body);
          break;
        }
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [stage, activeProgress, isTimerRunning, bodies, seed, onSelectBody, heroAccentColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block touch-manipulation cursor-pointer ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};
