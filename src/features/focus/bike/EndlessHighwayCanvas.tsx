import React, { useRef, useEffect } from 'react';

export interface EndlessHighwayCanvasProps {
  isDriving?: boolean;
  progressPercent?: number; // 0 to 100%
  speedMultiplier?: number;
  playbackRate?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface RoadsideObject {
  z: number;
  side: -1 | 1;
  type: 'tree' | 'pole' | 'sign' | 'cabin';
}

// Scene palette configurations for 0%, 25%, 50%, 75% stages
interface SceneTheme {
  name: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  horizonGlow: string;
  farMountain: string;
  nearMountain: string;
  hills: string;
  treeColor: string;
  asphaltTop: string;
  asphaltBottom: string;
  lineColor: string;
}

const SCENE_THEMES: SceneTheme[] = [
  // Stage 0 (0% - 25%): Misty Mountain Pass
  {
    name: 'Mountain pass',
    skyTop: '#060913',
    skyMid: '#121629',
    skyBottom: '#281c4e',
    horizonGlow: 'rgba(245, 158, 11, 0.45)',
    farMountain: '#1e1b4b',
    nearMountain: '#0f172a',
    hills: '#090d16',
    treeColor: '#070b14',
    asphaltTop: '#1e293b',
    asphaltBottom: '#03060c',
    lineColor: '#f59e0b'
  },
  // Stage 1 (25% - 50%): Quiet Pine Forest
  {
    name: 'Pine forest',
    skyTop: '#031410',
    skyMid: '#062920',
    skyBottom: '#0d4034',
    horizonGlow: 'rgba(52, 211, 153, 0.35)',
    farMountain: '#063026',
    nearMountain: '#041f19',
    hills: '#021612',
    treeColor: '#01100d',
    asphaltTop: '#132c25',
    asphaltBottom: '#020d0a',
    lineColor: '#34d399'
  },
  // Stage 2 (50% - 75%): Aurora Nightway
  {
    name: 'Aurora nightway',
    skyTop: '#040612',
    skyMid: '#0d163a',
    skyBottom: '#133547',
    horizonGlow: 'rgba(45, 212, 191, 0.4)',
    farMountain: '#16233b',
    nearMountain: '#0c1626',
    hills: '#070f1a',
    treeColor: '#040912',
    asphaltTop: '#122633',
    asphaltBottom: '#02080f',
    lineColor: '#38bdf8'
  },
  // Stage 3 (75% - 100%): Golden Twilight
  {
    name: 'Twilight highway',
    skyTop: '#140804',
    skyMid: '#2d120a',
    skyBottom: '#52210a',
    horizonGlow: 'rgba(251, 146, 60, 0.5)',
    farMountain: '#3b180d',
    nearMountain: '#240e07',
    hills: '#170804',
    treeColor: '#0f0502',
    asphaltTop: '#2b1b14',
    asphaltBottom: '#0a0503',
    lineColor: '#fbbf24'
  }
];

export const EndlessHighwayCanvas: React.FC<EndlessHighwayCanvasProps> = ({
  isDriving = true,
  progressPercent = 0,
  speedMultiplier = 1,
  playbackRate = 1.0,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Check user preference for reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Simulation State
    let roadZ = 0;
    let skyOffset = 0;
    let cloudOffset = 0;
    let curveTime = 0;
    let currentCurve = 0;
    let targetCurve = 0;
    let wheelRotation = 0;

    // Fixed particle pool (Zero allocation loop)
    const MAX_PARTICLES = 20;
    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      alpha: 0,
      life: 0,
      maxLife: 1
    }));
    let nextParticleIndex = 0;
    let particleSpawnTimer = 0;

    // Roadside props pool
    const ROADSIDE_COUNT = 14;
    const roadsideObjects: RoadsideObject[] = [];
    for (let i = 0; i < ROADSIDE_COUNT; i++) {
      roadsideObjects.push({
        z: 80 + (i * 38),
        side: i % 2 === 0 ? -1 : 1,
        type: i % 5 === 0 ? 'sign' : i % 3 === 0 ? 'pole' : i === 7 ? 'cabin' : 'tree'
      });
    }

    // Dynamic Sizing
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

    // Stage interpolation calculation (0%, 25%, 50%, 75%)
    let currentThemeIdx = 0;
    let targetThemeIdx = 0;
    let themeBlendRatio = 1.0;

    // ── MAIN 60FPS RENDER LOOP ──
    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (width === 0 || height === 0) return;

      // Determine active scene stage based on progressPercent (0, 25, 50, 75%)
      const stageIdx = Math.min(3, Math.max(0, Math.floor((progressPercent / 100) * 4)));
      if (stageIdx !== targetThemeIdx) {
        currentThemeIdx = targetThemeIdx;
        targetThemeIdx = stageIdx;
        themeBlendRatio = 0.0;
      }
      if (themeBlendRatio < 1.0) {
        themeBlendRatio = Math.min(1.0, themeBlendRatio + dt / 2.0); // 2-second cross-fade
      }

      const activeTheme = SCENE_THEMES[targetThemeIdx];

      // Motion speed: if not driving or reduced motion, movement is strictly 0
      const shouldMove = isDriving && !prefersReducedMotion;
      const forwardSpeed = shouldMove ? 220 * speedMultiplier * playbackRate : 0;
      const distanceCovered = forwardSpeed * dt;

      if (shouldMove) {
        roadZ = (roadZ + distanceCovered) % 100;
        wheelRotation = (wheelRotation + distanceCovered * 0.1) % (Math.PI * 2);

        curveTime += dt * 0.35;
        targetCurve = Math.sin(curveTime * 0.7) * 30 + Math.sin(curveTime * 1.4) * 12;
        currentCurve += (targetCurve - currentCurve) * 0.05;

        skyOffset = (skyOffset + currentCurve * 0.002) % width;
        cloudOffset = (cloudOffset + dt * 6) % width;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const horizonY = height * 0.48;
      const vanishX = width * 0.5 + currentCurve;

      // ─────────────────────────────────────────────────────────────
      // ── LAYER 1: SKY, STARS, SUNRISE & FILLED MOUNTAIN RIDGES ───
      // ─────────────────────────────────────────────────────────────

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, activeTheme.skyTop);
      skyGrad.addColorStop(0.4, activeTheme.skyMid);
      skyGrad.addColorStop(0.85, activeTheme.skyBottom);
      skyGrad.addColorStop(1, activeTheme.horizonGlow);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 2);

      // 2. Stars
      ctx.fillStyle = '#ffffff';
      for (let s = 1; s <= 24; s++) {
        const sx = ((s * 137.5 + skyOffset * 0.2) % width + width) % width;
        const sy = (s * 41.3) % (horizonY * 0.7);
        const sAlpha = 0.25 + ((s * 7) % 7) * 0.1;
        ctx.globalAlpha = sAlpha;
        ctx.beginPath();
        ctx.arc(sx, sy, (s % 4 === 0 ? 1.4 : 0.9), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 3. Sun / Moon Horizon Radial Bloom
      const sunX = vanishX * 0.82;
      const sunY = horizonY - 12;
      const sunBloom = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 110);
      sunBloom.addColorStop(0, activeTheme.horizonGlow);
      sunBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunBloom;
      ctx.fillRect(sunX - 110, sunY - 110, 220, 220);

      ctx.beginPath();
      ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();

      // 4. Soft High Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let c = 0; c < 3; c++) {
        const cx = ((c * (width / 3) + cloudOffset) % width + width) % width;
        const cy = horizonY * 0.28 + (c * 24);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 95 + c * 25, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Far Mountain Ridges (Filled ridges joined to the ground)
      ctx.fillStyle = activeTheme.farMountain;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      const mtnSegments = 14;
      for (let i = 0; i <= mtnSegments; i++) {
        const px = (width / mtnSegments) * i;
        const py = horizonY - 42 - Math.sin(i * 0.85 + skyOffset * 0.002) * 32 - Math.cos(i * 1.6) * 18;
        ctx.lineTo(px, py);
      }
      // Joined to the ground
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // 6. Near Hills & Ridges (Filled ridges joined to the ground)
      ctx.fillStyle = activeTheme.nearMountain;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let i = 0; i <= mtnSegments; i++) {
        const px = (width / mtnSegments) * i;
        const py = horizonY - 24 - Math.sin(i * 1.25 + skyOffset * 0.005) * 22;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // ─────────────────────────────────────────────────────────────
      // ── LAYER 2: MIDGROUND FOOTHILLS & ROADSIDE SCENERY ──────────
      // ─────────────────────────────────────────────────────────────

      // Base terrain below horizon
      ctx.fillStyle = activeTheme.hills;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Rolling foothill contour
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.quadraticCurveTo(width * 0.25, horizonY - 12, width * 0.5, horizonY + 6);
      ctx.quadraticCurveTo(width * 0.75, horizonY - 8, width, horizonY);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // ─────────────────────────────────────────────────────────────
      // ── LAYER 3: ENDLESS ROAD TRACK & PERSPECTIVE PROJECTION ─────
      // ─────────────────────────────────────────────────────────────

      const roadBottomWidth = Math.min(width * 0.86, 680);
      const roadTopWidth = 12;
      const roadBottomLeft = (width - roadBottomWidth) * 0.5;
      const roadBottomRight = roadBottomLeft + roadBottomWidth;
      const roadTopLeft = vanishX - roadTopWidth * 0.5;
      const roadTopRight = vanishX + roadTopWidth * 0.5;

      // 1. Asphalt Road Surface
      const asphaltGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      asphaltGrad.addColorStop(0, activeTheme.asphaltTop);
      asphaltGrad.addColorStop(0.3, '#0f172a');
      asphaltGrad.addColorStop(0.8, activeTheme.asphaltBottom);
      asphaltGrad.addColorStop(1, '#020408');

      ctx.fillStyle = asphaltGrad;
      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, height);
      ctx.lineTo(roadBottomLeft, height);
      ctx.closePath();
      ctx.fill();

      // 2. Alternating Rumble Strips (Kerb Segments)
      const segmentsCount = 36;
      const segLength = 8;

      for (let s = 0; s < segmentsCount; s++) {
        const p1 = (s + (roadZ % segLength) / segLength) / segmentsCount;
        const p2 = (s + 1 + (roadZ % segLength) / segLength) / segmentsCount;
        if (p1 > 1.0) continue;

        const z1 = Math.pow(p1, 2.4);
        const z2 = Math.pow(Math.min(p2, 1.0), 2.4);

        const y1 = horizonY + (height - horizonY) * z1;
        const y2 = horizonY + (height - horizonY) * z2;

        const leftX1 = roadTopLeft + (roadBottomLeft - roadTopLeft) * z1;
        const leftX2 = roadTopLeft + (roadBottomLeft - roadTopLeft) * z2;
        const rightX1 = roadTopRight + (roadBottomRight - roadTopRight) * z1;
        const rightX2 = roadTopRight + (roadBottomRight - roadTopRight) * z2;

        const kerbWidth1 = Math.max(2, 20 * z1);
        const kerbWidth2 = Math.max(2, 20 * z2);

        const isStripe = (Math.floor(s + roadZ / segLength)) % 2 === 0;
        ctx.fillStyle = isStripe ? activeTheme.lineColor : '#334155';

        // Left Rumble
        ctx.beginPath();
        ctx.moveTo(leftX1 - kerbWidth1, y1);
        ctx.lineTo(leftX1, y1);
        ctx.lineTo(leftX2, y2);
        ctx.lineTo(leftX2 - kerbWidth2, y2);
        ctx.closePath();
        ctx.fill();

        // Right Rumble
        ctx.beginPath();
        ctx.moveTo(rightX1, y1);
        ctx.lineTo(rightX1 + kerbWidth1, y1);
        ctx.lineTo(rightX2 + kerbWidth2, y2);
        ctx.lineTo(rightX2, y2);
        ctx.closePath();
        ctx.fill();
      }

      // 3. White Outer Boundary Lines
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(roadTopLeft + 2, horizonY);
      ctx.lineTo(roadBottomLeft + 30, height);
      ctx.moveTo(roadTopRight - 2, horizonY);
      ctx.lineTo(roadBottomRight - 30, height);
      ctx.stroke();

      // 4. Glowing Center Dashes
      const centerDashCount = 16;
      const centerDashStep = 10;

      for (let d = 0; d < centerDashCount; d++) {
        const frac = (d + (roadZ % centerDashStep) / centerDashStep) / centerDashCount;
        if (frac > 1.0) continue;

        const zNear = Math.pow(frac, 2.5);
        const zFar = Math.pow(Math.min(frac + 0.035, 1.0), 2.5);

        const yTop = horizonY + (height - horizonY) * zNear;
        const yBottom = horizonY + (height - horizonY) * zFar;

        const roadCenterTop = roadTopLeft + (roadTopRight - roadTopLeft) * 0.5;
        const roadCenterBottom = roadBottomLeft + (roadBottomRight - roadBottomLeft) * 0.5;

        const xTop = roadCenterTop + (roadCenterBottom - roadCenterTop) * zNear;
        const xBottom = roadCenterTop + (roadCenterBottom - roadCenterTop) * zFar;

        const dashWidth = Math.max(1.5, 11 * zFar);
        const dashAlpha = Math.min(1.0, Math.max(0.2, zFar * 1.3));

        ctx.fillStyle = activeTheme.lineColor;
        ctx.globalAlpha = dashAlpha;
        ctx.beginPath();
        ctx.moveTo(xTop - dashWidth * 0.5, yTop);
        ctx.lineTo(xTop + dashWidth * 0.5, yTop);
        ctx.lineTo(xBottom + dashWidth * 0.5, yBottom);
        ctx.lineTo(xBottom - dashWidth * 0.5, yBottom);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 5. Roadside Scenery Props
      for (let i = 0; i < roadsideObjects.length; i++) {
        const obj = roadsideObjects[i];
        if (shouldMove) {
          obj.z -= distanceCovered * 0.12;
          if (obj.z <= 1) {
            obj.z = 240 + Math.random() * 40;
            obj.side = Math.random() > 0.5 ? 1 : -1;
          }
        }

        const propZRatio = Math.max(0, Math.min(1, 1 - (obj.z / 250)));
        const propScale = Math.pow(propZRatio, 2.8);
        if (propScale < 0.02) continue;

        const propY = horizonY + (height - horizonY) * propScale;
        const roadEdgeX = obj.side === -1
          ? roadTopLeft + (roadBottomLeft - roadTopLeft) * propScale
          : roadTopRight + (roadBottomRight - roadTopRight) * propScale;

        const propX = roadEdgeX + (obj.side * (25 + 110 * propScale));
        const propH = 75 * propScale;
        const propW = 26 * propScale;

        if (obj.type === 'tree') {
          ctx.fillStyle = activeTheme.treeColor;
          ctx.beginPath();
          ctx.moveTo(propX, propY - propH);
          ctx.lineTo(propX + propW * 0.6, propY);
          ctx.lineTo(propX - propW * 0.6, propY);
          ctx.closePath();
          ctx.fill();
        } else if (obj.type === 'pole') {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = Math.max(1.5, 3.5 * propScale);
          ctx.beginPath();
          ctx.moveTo(propX, propY);
          ctx.lineTo(propX, propY - propH * 0.85);
          ctx.moveTo(propX - propW * 0.5, propY - propH * 0.7);
          ctx.lineTo(propX + propW * 0.5, propY - propH * 0.7);
          ctx.stroke();
        } else if (obj.type === 'sign') {
          ctx.fillStyle = '#065f46';
          ctx.fillRect(propX - propW * 0.5, propY - propH * 0.6, propW, propH * 0.35);
          ctx.fillStyle = '#475569';
          ctx.fillRect(propX - 1.5, propY - propH * 0.25, 3, propH * 0.25);
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ── LAYER 4: COMPACT RIDER SLOT (FOCUSED & CLEAN DYNAMICS) ───
      // ─────────────────────────────────────────────────────────────

      const engineVibe = shouldMove ? Math.sin(now * 0.045) * 1.1 : 0;
      const suspensionBounce = shouldMove ? (Math.sin(now * 0.012) * 2.0 + Math.sin(now * 0.027) * 0.8) : 0;
      const riderBankAngle = currentCurve * 0.003;

      const bikeScale = Math.min(width / 520, 1.1) * 0.82;
      const bikeCenterX = width * 0.5 + (shouldMove ? Math.sin(now * 0.003) * 5 : 0);
      const bikeBaseY = height * 0.82 + suspensionBounce;

      // Headlight Beam Cone
      const lightBeam = ctx.createLinearGradient(bikeCenterX, bikeBaseY - 80, bikeCenterX, horizonY + 30);
      lightBeam.addColorStop(0, 'rgba(254, 243, 199, 0.18)');
      lightBeam.addColorStop(0.6, 'rgba(251, 191, 36, 0.06)');
      lightBeam.addColorStop(1, 'rgba(251, 191, 36, 0)');

      ctx.fillStyle = lightBeam;
      ctx.beginPath();
      ctx.moveTo(bikeCenterX - 24 * bikeScale, bikeBaseY - 45);
      ctx.lineTo(bikeCenterX + 24 * bikeScale, bikeBaseY - 45);
      ctx.lineTo(vanishX + 110, horizonY + 20);
      ctx.lineTo(vanishX - 110, horizonY + 20);
      ctx.closePath();
      ctx.fill();

      // Exhaust Particles (Running only)
      if (shouldMove) {
        particleSpawnTimer += dt;
        if (particleSpawnTimer > 0.09) {
          particleSpawnTimer = 0;
          const sideOffset = (nextParticleIndex % 2 === 0 ? -22 : 22) * bikeScale;
          const p = particles[nextParticleIndex];
          p.x = bikeCenterX + sideOffset;
          p.y = bikeBaseY - 10;
          p.vx = (sideOffset > 0 ? 6 : -6) + (Math.random() - 0.5) * 8;
          p.vy = 24 + Math.random() * 16;
          p.radius = 3.5 * bikeScale;
          p.alpha = 0.4;
          p.life = 0;
          p.maxLife = 0.35 + Math.random() * 0.25;

          nextParticleIndex = (nextParticleIndex + 1) % MAX_PARTICLES;
        }
      }

      // Draw active particles
      for (let pi = 0; pi < MAX_PARTICLES; pi++) {
        const p = particles[pi];
        if (p.alpha <= 0) continue;

        p.life += dt;
        if (p.life >= p.maxLife) {
          p.alpha = 0;
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.radius += 20 * dt * bikeScale;
        p.alpha = Math.max(0, 0.4 * (1 - p.life / p.maxLife));

        ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Rider & Motorcycle
      ctx.save();
      ctx.translate(bikeCenterX, bikeBaseY + engineVibe);
      ctx.rotate(riderBankAngle);
      ctx.scale(bikeScale, bikeScale);

      // Contact Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 72, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rear Tire
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-24, -60, 48, 70, 16);
      ctx.fill();
      ctx.stroke();

      // Tire Tread Details
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      for (let tr = -2; tr <= 2; tr++) {
        const ty = -25 + tr * 13 + Math.sin(wheelRotation) * 5;
        if (ty >= -52 && ty <= 4) {
          ctx.beginPath();
          ctx.moveTo(-14, ty);
          ctx.lineTo(-3, ty + 3.5);
          ctx.moveTo(14, ty);
          ctx.lineTo(3, ty + 3.5);
          ctx.stroke();
        }
      }

      // Chrome Dual Pipes
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(-35, -30, 11, 35);
      ctx.strokeRect(-35, -30, 11, 35);
      ctx.fillRect(24, -30, 11, 35);
      ctx.strokeRect(24, -30, 11, 35);

      // LED Taillight Strip
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(-22, -68, 44, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-12, -66, 24, 4, 2);
      ctx.fill();

      // Rider Seat
      ctx.fillStyle = '#0a0e1a';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -78, 30, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rider Legs
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(-32, -75, 12, 38, 5);
      ctx.roundRect(20, -75, 12, 38, 5);
      ctx.fill();

      // Rider Jacket
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-28, -135);
      ctx.quadraticCurveTo(0, -145, 28, -135);
      ctx.lineTo(22, -85);
      ctx.quadraticCurveTo(0, -90, -22, -85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spine Protector Gold Line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -130);
      ctx.lineTo(0, -95);
      ctx.stroke();

      // Handlebars
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-46, -114);
      ctx.lineTo(46, -114);
      ctx.stroke();

      // Helmet
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -152, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Visor Reflection
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, -150, 13, 5, 0, 0, Math.PI);
      ctx.fill();

      ctx.restore();

      // Cinematic Vignette
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.42,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.78
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDriving, progressPercent, speedMultiplier, playbackRate]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label="Layered flat SVG scenery endless highway parallax engine"
      />
    </div>
  );
};
