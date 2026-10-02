import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PlanetType } from './ProceduralPlanet';

export interface PlanetarySystemProps {
  level?: number;
  streakDays?: number;
  isDeliveringReward?: boolean;
  type?: PlanetType;
  seed?: number;
  className?: string;
  autoRotate?: boolean;
  showStarfield?: boolean;
  onCometAbsorbed?: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════════
// 1. FAST DETERMINISTIC PRNG & 3D FRACTIONAL BROWNIAN MOTION (fBm) NOISE
// ══════════════════════════════════════════════════════════════════════════════════

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPermutation(seed: number): Uint8Array {
  const rand = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
  }
  return perm;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

function grad3(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin3D(x: number, y: number, z: number, perm: Uint8Array): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  const A = perm[X] + Y;
  const AA = perm[A] + Z;
  const AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y;
  const BA = perm[B] + Z;
  const BB = perm[B + 1] + Z;

  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad3(perm[AA], xf, yf, zf), grad3(perm[BA], xf - 1, yf, zf)),
      lerp(u, grad3(perm[AB], xf, yf - 1, zf), grad3(perm[BB], xf - 1, yf - 1, zf))
    ),
    lerp(
      v,
      lerp(u, grad3(perm[AA + 1], xf, yf, zf - 1), grad3(perm[BA + 1], xf - 1, yf, zf - 1)),
      lerp(u, grad3(perm[AB + 1], xf, yf - 1, zf - 1), grad3(perm[BB + 1], xf - 1, yf - 1, zf - 1))
    )
  );
}

function fbm3D(x: number, y: number, z: number, perm: Uint8Array, octaves = 5): number {
  let total = 0;
  let frequency = 1.0;
  let amplitude = 1.0;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += perlin3D(x * frequency, y * frequency, z * frequency, perm) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return total / maxValue;
}

// ══════════════════════════════════════════════════════════════════════════════════
// 2. PROCEDURAL PLANET & RING TEXTURE GENERATORS
// ══════════════════════════════════════════════════════════════════════════════════

function generatePlanetTexture(type: PlanetType, seed: number, level: number): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 16;
    fallbackCanvas.height = 16;
    return new THREE.CanvasTexture(fallbackCanvas);
  }

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  const perm = buildPermutation(seed);

  const isProtostar = level >= 750 && level < 1000;
  const isGalaxyCore = level >= 1000;

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const theta = u * Math.PI * 2;

      const nx = sinPhi * Math.cos(theta);
      const ny = cosPhi;
      const nz = sinPhi * Math.sin(theta);

      let r = 0;
      let g = 0;
      let b = 0;

      if (isGalaxyCore) {
        // Supermassive Galactic Singularity Core with Event Horizon Swirls
        const swirlNoise = fbm3D(nx * 3.5, ny * 3.5, nz * 3.5, perm, 5);
        const coreNoise = fbm3D(nx * 8.0, ny * 8.0, nz * 8.0, perm, 3);
        const energy = swirlNoise * 0.7 + coreNoise * 0.3;
        
        r = Math.floor(140 + energy * 95);
        g = Math.floor(60 + energy * 80);
        b = Math.floor(220 + energy * 35);
      } else if (isProtostar) {
        // Solar Star (Protostar) - Roaring Thermonuclear Solar Convection
        const solarNoise = fbm3D(nx * 4.5, ny * 4.5, nz * 4.5, perm, 5);
        const flareNoise = fbm3D(nx * 10.0, ny * 10.0, nz * 10.0, perm, 3);
        const heat = solarNoise * 0.75 + flareNoise * 0.25;

        r = 255;
        g = Math.floor(160 + heat * 90);
        b = Math.floor(30 + heat * 70);
      } else if (type === 'rocky') {
        const continentNoise = fbm3D(nx * 2.2, ny * 2.2, nz * 2.2, perm, 5);
        const detailNoise = fbm3D(nx * 7.5, ny * 7.5, nz * 7.5, perm, 4);
        const elevation = continentNoise * 0.7 + detailNoise * 0.3;
        const polar = Math.abs(ny);

        if (level < 100) {
          // Protoplanet: Desolate grey cratered lunar rock
          const crater = Math.floor(elevation * 110 + 90);
          r = crater;
          g = crater + 5;
          b = crater + 12;
        } else if (polar > 0.88 || elevation > 0.48) {
          r = 240 + Math.floor(detailNoise * 15);
          g = 248 + Math.floor(detailNoise * 7);
          b = 255;
        } else if (elevation < 0.05) {
          r = 14;
          g = 68 + Math.floor(detailNoise * 35);
          b = 138 + Math.floor(detailNoise * 40);
        } else if (elevation < 0.12) {
          r = 210 + Math.floor(detailNoise * 30);
          g = 195 + Math.floor(detailNoise * 20);
          b = 140;
        } else if (elevation < 0.35) {
          r = 42 + Math.floor(detailNoise * 30);
          g = 135 + Math.floor(detailNoise * 45);
          b = 65;
        } else {
          r = 135 + Math.floor(detailNoise * 40);
          g = 110 + Math.floor(detailNoise * 30);
          b = 90;
        }
      } else if (type === 'gas') {
        const bandCoord = ny * 14.0;
        const turbulentDisplacement = fbm3D(nx * 2.5, ny * 1.5, nz * 2.5, perm, 4) * 2.4;
        const bandVal = Math.sin(bandCoord + turbulentDisplacement);
        const fineBands = fbm3D(nx * 6.0, ny * 8.0, nz * 6.0, perm, 3);
        const blend = bandVal * 0.65 + fineBands * 0.35;

        if (blend < -0.3) {
          r = 175 + Math.floor(fineBands * 30);
          g = 115 + Math.floor(fineBands * 25);
          b = 75;
        } else if (blend < 0.15) {
          r = 225 + Math.floor(fineBands * 25);
          g = 175 + Math.floor(fineBands * 30);
          b = 125;
        } else if (blend < 0.6) {
          r = 195 + Math.floor(fineBands * 30);
          g = 135 + Math.floor(fineBands * 25);
          b = 90;
        } else {
          r = 245;
          g = 215 + Math.floor(fineBands * 35);
          b = 175;
        }
      } else if (type === 'lava') {
        const crustNoise = fbm3D(nx * 3.0, ny * 3.0, nz * 3.0, perm, 5);
        const veinNoise = Math.abs(perlin3D(nx * 10.0, ny * 10.0, nz * 10.0, perm) * 2.0 - 1.0);
        const magmaCracks = fbm3D(nx * 14.0, ny * 14.0, nz * 14.0, perm, 3);

        if (crustNoise > 0.15 && veinNoise > 0.35) {
          r = 25 + Math.floor(magmaCracks * 20);
          g = 22 + Math.floor(magmaCracks * 18);
          b = 24 + Math.floor(magmaCracks * 20);
        } else if (veinNoise < 0.12) {
          r = 255;
          g = 230 + Math.floor(magmaCracks * 25);
          b = 90;
        } else {
          r = 240 + Math.floor(magmaCracks * 15);
          g = 70 + Math.floor(magmaCracks * 50);
          b = 15;
        }
      } else {
        // Ice / Terrestrial Oceanic
        const iceNoise = fbm3D(nx * 3.0, ny * 3.0, nz * 3.0, perm, 5);
        const ridgeNoise = fbm3D(nx * 8.0, ny * 8.0, nz * 8.0, perm, 4);
        const elevation = iceNoise * 0.7 + ridgeNoise * 0.3;

        if (elevation < -0.15) {
          r = 6;
          g = 55 + Math.floor((elevation + 1) * 35);
          b = 95 + Math.floor((elevation + 1) * 60);
        } else if (elevation < 0.2) {
          r = 30 + Math.floor(elevation * 60);
          g = 145 + Math.floor(elevation * 90);
          b = 215 + Math.floor(elevation * 40);
        } else if (elevation < 0.45) {
          r = 140 + Math.floor(elevation * 80);
          g = 215 + Math.floor(elevation * 35);
          b = 245 + Math.floor(elevation * 10);
        } else {
          r = 245;
          g = 252;
          b = 255;
        }
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.max(0, Math.min(255, r));
      data[idx + 1] = Math.max(0, Math.min(255, g));
      data[idx + 2] = Math.max(0, Math.min(255, b));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Concentric Transparent Planetary Rings Texture Generator
function generateRingsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fb = document.createElement('canvas');
    fb.width = 16;
    fb.height = 16;
    return new THREE.CanvasTexture(fb);
  }

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, 'rgba(215, 185, 140, 0.0)');
  grad.addColorStop(0.08, 'rgba(215, 185, 140, 0.25)');
  grad.addColorStop(0.22, 'rgba(235, 210, 165, 0.85)');
  grad.addColorStop(0.38, 'rgba(245, 225, 180, 0.95)');
  grad.addColorStop(0.42, 'rgba(180, 150, 110, 0.15)'); // Cassini Division gap
  grad.addColorStop(0.46, 'rgba(140, 110, 80, 0.05)');  // Cassini Division clear
  grad.addColorStop(0.50, 'rgba(225, 195, 150, 0.7)');
  grad.addColorStop(0.72, 'rgba(240, 215, 170, 0.85)');
  grad.addColorStop(0.88, 'rgba(205, 175, 130, 0.4)');
  grad.addColorStop(0.96, 'rgba(180, 150, 110, 0.15)');
  grad.addColorStop(1.0, 'rgba(160, 130, 95, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// Adjust UVs for RingGeometry so texture maps radially
function mapRingUVs(geometry: THREE.RingGeometry) {
  const pos = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const count = pos.count;
  const innerRadius = (geometry.parameters as any).innerRadius || 1.6;
  const outerRadius = (geometry.parameters as any).outerRadius || 2.8;
  const range = outerRadius - innerRadius;

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const u = Math.min(1.0, Math.max(0.0, (r - innerRadius) / range));
    uvs.setXY(i, u, 0.5);
  }
  uvs.needsUpdate = true;
}

// ══════════════════════════════════════════════════════════════════════════════════
// 3. SHADERS (ATMOSPHERE & PULSING LAVA CRACKS & SOLAR CORONA)
// ══════════════════════════════════════════════════════════════════════════════════

const AtmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const AtmosphereFragmentShader = `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uPower);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`;

const CoronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const CoronaFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 1.8);
    float pulse = 0.85 + 0.15 * sin(uTime * 3.5);
    gl_FragColor = vec4(uColor * 1.3, fresnel * pulse * 0.95);
  }
`;

// ══════════════════════════════════════════════════════════════════════════════════
// 4. MAIN PLANETARY SYSTEM COMPONENT
// ══════════════════════════════════════════════════════════════════════════════════

export const PlanetarySystem: React.FC<PlanetarySystemProps> = ({
  level = 1,
  streakDays = 1,
  isDeliveringReward = false,
  type: propType,
  seed = 42,
  className = '',
  autoRotate = true,
  showStarfield = true,
  onCometAbsorbed,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Derive resolved planet type and stage based on level if not explicitly overridden
  const resolvedType: PlanetType = useMemo(() => {
    if (propType) return propType;
    if (level < 100) return 'rocky';
    if (level < 300) return 'ice';
    if (level < 500) return 'gas';
    if (level < 750) return 'lava';
    if (level < 1000) return 'lava';
    return 'gas';
  }, [propType, level]);

  // Visual Scale & Configurations
  const planetScale = useMemo(() => {
    if (level < 100) return 0.92;      // Lv 1–99: Protoplanet (compact)
    if (level < 300) return 1.20;      // Lv 100–299: Terrestrial
    if (level < 500) return 1.28;      // Lv 300–499: Gas Giant
    if (level < 750) return 1.22;      // Lv 500–749: Lava Core
    if (level < 1000) return 1.34;     // Lv 750–999: Solar Protostar
    return 1.40;                       // Lv 1000: Galaxy Core
  }, [level]);

  // Orbiting Moons Count (Max 5, 1 per 3 streak days)
  const moonsCount = useMemo(() => {
    return Math.min(Math.floor(Math.max(0, streakDays) / 3), 5);
  }, [streakDays]);

  // Touch and interaction refs
  const interactionRef = useRef({
    isInteracting: false,
    lastInteractionTime: Date.now(),
    pointerX: 0,
    pointerY: 0,
    velocityX: 0,
    velocityY: 0,
    cameraDistance: 4.5,
    targetDistance: 4.5,
    initialPinchDistance: 0
  });

  // Comet Delivery Trigger Ref
  const cometTriggerRef = useRef({
    active: false,
    progress: 0,
    shockwaveProgress: 0,
    hasNotified: false
  });

  useEffect(() => {
    if (isDeliveringReward) {
      cometTriggerRef.current = {
        active: true,
        progress: 0,
        shockwaveProgress: 0,
        hasNotified: false
      };
    }
  }, [isDeliveringReward]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, interactionRef.current.cameraDistance);

    // 2. WebGL Renderer with Android DPI Cap (Math.min(DPR, 1.5))
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = level >= 750 ? 1.3 : 1.1;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup
    const dirLight = new THREE.DirectionalLight(0xffffff, level >= 750 ? 3.0 : 2.2);
    dirLight.position.set(4.8, 3.2, 4.0);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(
      level >= 750 ? 0x331a00 : 0x111625, 
      level >= 750 ? 0.7 : 0.45
    );
    scene.add(ambientLight);

    // 4. Core Planet Mesh (Scale dynamically based on level)
    const planetTexture = generatePlanetTexture(resolvedType, seed, level);
    const planetGeometry = new THREE.SphereGeometry(1.3 * planetScale, 64, 64);

    const isLava = level >= 500 && level < 750;
    const isProtostar = level >= 750 && level < 1000;
    const isGalaxyCore = level >= 1000;

    const planetMaterial = new THREE.MeshStandardMaterial({
      map: planetTexture,
      roughness: isProtostar ? 0.1 : isLava ? 0.88 : resolvedType === 'ice' ? 0.25 : 0.65,
      metalness: isProtostar ? 0.0 : resolvedType === 'ice' ? 0.2 : 0.08,
      emissive: isProtostar 
        ? new THREE.Color('#ff4500') 
        : isGalaxyCore 
          ? new THREE.Color('#7e22ce') 
          : isLava 
            ? new THREE.Color('#ff3300') 
            : new THREE.Color(0x000000),
      emissiveIntensity: isProtostar ? 0.75 : isGalaxyCore ? 0.5 : isLava ? 0.4 : 0.0
    });

    const planetPivot = new THREE.Group();
    scene.add(planetPivot);

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetPivot.add(planetMesh);

    // 5. Atmosphere Rim Glow Mesh
    const atmoRadius = 1.3 * planetScale * 1.05;
    const atmosphereGeometry = new THREE.SphereGeometry(atmoRadius, 64, 64);
    const atmoColors: Record<PlanetType, string> = {
      rocky: level < 100 ? '#64748b' : '#38bdf8',
      gas: isGalaxyCore ? '#a855f7' : '#fbbf24',
      lava: isProtostar ? '#ff6b00' : '#ff4500',
      ice: '#34d399'
    };
    const atmoColor = atmoColors[resolvedType];

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(atmoColor) },
        uPower: { value: level < 100 ? 4.2 : 2.8 },
        uIntensity: { value: level < 100 ? 0.45 : isProtostar ? 1.4 : 0.95 }
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planetPivot.add(atmosphereMesh);

    // 6. Level 300–499: Procedural Saturn-Style Rings
    let ringMesh: THREE.Mesh | null = null;
    let ringTexture: THREE.CanvasTexture | null = null;
    let ringGeometry: THREE.RingGeometry | null = null;
    let ringMaterial: THREE.MeshBasicMaterial | null = null;

    if (level >= 300 && level < 500) {
      ringTexture = generateRingsTexture();
      ringGeometry = new THREE.RingGeometry(1.75 * planetScale, 3.1 * planetScale, 64);
      mapRingUVs(ringGeometry);

      ringMaterial = new THREE.MeshBasicMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      });

      ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      // Tilt rings ~25 degrees (0.436 rad)
      ringMesh.rotation.x = Math.PI * 0.42;
      ringMesh.rotation.z = 0.436;
      planetPivot.add(ringMesh);
    }

    // 7. Level 750–999: Solar Protostar Additive Outer Corona
    let coronaMesh: THREE.Mesh | null = null;
    let coronaGeometry: THREE.SphereGeometry | null = null;
    let coronaMaterial: THREE.ShaderMaterial | null = null;

    if (isProtostar || isGalaxyCore) {
      coronaGeometry = new THREE.SphereGeometry(1.3 * planetScale * 1.18, 48, 48);
      coronaMaterial = new THREE.ShaderMaterial({
        vertexShader: CoronaVertexShader,
        fragmentShader: CoronaFragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(isGalaxyCore ? '#c084fc' : '#fb923c') },
          uTime: { value: 0 }
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide
      });

      coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      planetPivot.add(coronaMesh);
    }

    // 8. Orbiting Moons (Streak Representation - up to 5 moons)
    const moonMeshes: {
      mesh: THREE.Mesh;
      orbitRadius: number;
      orbitSpeed: number;
      orbitAngle: number;
      tiltX: number;
      tiltZ: number;
    }[] = [];
    const moonGeometries: THREE.SphereGeometry[] = [];
    const moonMaterials: THREE.MeshStandardMaterial[] = [];

    const moonPalettes = [
      { color: 0x94a3b8, radius: 0.16, dist: 2.1, speed: 0.015, tilt: 0.15 },
      { color: 0x38bdf8, radius: 0.20, dist: 2.6, speed: 0.011, tilt: -0.25 },
      { color: 0xa855f7, radius: 0.18, dist: 3.1, speed: 0.008, tilt: 0.35 },
      { color: 0xfbbf24, radius: 0.24, dist: 3.6, speed: 0.006, tilt: -0.15 },
      { color: 0x34d399, radius: 0.22, dist: 4.1, speed: 0.005, tilt: 0.2 }
    ];

    for (let i = 0; i < moonsCount; i++) {
      const cfg = moonPalettes[i % moonPalettes.length];
      const mGeom = new THREE.SphereGeometry(cfg.radius, 24, 24);
      moonGeometries.push(mGeom);

      const mMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.7,
        metalness: 0.1
      });
      moonMaterials.push(mMat);

      const mMesh = new THREE.Mesh(mGeom, mMat);
      scene.add(mMesh);

      moonMeshes.push({
        mesh: mMesh,
        orbitRadius: cfg.dist * planetScale,
        orbitSpeed: cfg.speed,
        orbitAngle: (i * (Math.PI * 2)) / Math.max(1, moonsCount),
        tiltX: cfg.tilt,
        tiltZ: cfg.tilt * 0.8
      });
    }

    // 9. Signature Comet Delivery Animation & Impact Shockwave
    const cometHeadGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const cometHeadMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cometHeadMesh = new THREE.Mesh(cometHeadGeom, cometHeadMat);
    cometHeadMesh.visible = false;
    scene.add(cometHeadMesh);

    // Comet Trail Line
    const trailPositions = new Float32Array(30 * 3);
    const cometTrailGeom = new THREE.BufferGeometry();
    cometTrailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const cometTrailMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });
    const cometTrailMesh = new THREE.Line(cometTrailGeom, cometTrailMat);
    cometTrailMesh.visible = false;
    scene.add(cometTrailMesh);

    // Shockwave Mesh (Impact Pulse)
    const shockwaveGeom = new THREE.RingGeometry(0.1, 0.25, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeom, shockwaveMat);
    shockwaveMesh.lookAt(camera.position);
    scene.add(shockwaveMesh);

    // 10. Starfield
    let starsMesh: THREE.Points | null = null;
    let starGeometry: THREE.BufferGeometry | null = null;
    let starMaterial: THREE.PointsMaterial | null = null;

    if (showStarfield) {
      const starCount = 650;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const r = 22.0 + Math.random() * 20.0;
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);
      }

      starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starMaterial = new THREE.PointsMaterial({
        size: 0.65,
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      });
      starsMesh = new THREE.Points(starGeometry, starMaterial);
      scene.add(starsMesh);
    }

    // 11. Mobile Touch Drag, Pinch-to-Zoom & Inactivity Auto-Resume Engine
    let touchCount = 0;
    let prevTouchX = 0;
    let prevTouchY = 0;
    let initialPinchDist = 0;
    let initialCameraDist = 4.5;

    const onPointerDown = (e: PointerEvent) => {
      interactionRef.current.isInteracting = true;
      interactionRef.current.lastInteractionTime = Date.now();
      prevTouchX = e.clientX;
      prevTouchY = e.clientY;
      interactionRef.current.velocityX = 0;
      interactionRef.current.velocityY = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactionRef.current.isInteracting) return;
      interactionRef.current.lastInteractionTime = Date.now();

      const deltaX = e.clientX - prevTouchX;
      const deltaY = e.clientY - prevTouchY;
      prevTouchX = e.clientX;
      prevTouchY = e.clientY;

      planetPivot.rotation.y += deltaX * 0.006;
      planetPivot.rotation.x += deltaY * 0.006;

      interactionRef.current.velocityX = deltaX * 0.006;
      interactionRef.current.velocityY = deltaY * 0.006;
    };

    const onPointerUp = () => {
      interactionRef.current.isInteracting = false;
      interactionRef.current.lastInteractionTime = Date.now();
    };

    // Native Touch Handlers for Pinch-to-Zoom on Mobile WebView
    const onTouchStart = (e: TouchEvent) => {
      interactionRef.current.lastInteractionTime = Date.now();
      touchCount = e.touches.length;
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialCameraDist = interactionRef.current.cameraDistance;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      interactionRef.current.lastInteractionTime = Date.now();
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const scale = initialPinchDist / Math.max(1, currentDist);
        const newDist = Math.min(6.5, Math.max(2.5, initialCameraDist * scale));
        interactionRef.current.cameraDistance = newDist;
        interactionRef.current.targetDistance = newDist;
      }
    };

    const onTouchEnd = () => {
      initialPinchDist = 0;
      interactionRef.current.lastInteractionTime = Date.now();
    };

    // Desktop Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      interactionRef.current.lastInteractionTime = Date.now();
      const zoomDelta = e.deltaY * 0.003;
      interactionRef.current.cameraDistance = Math.min(
        6.5, 
        Math.max(2.5, interactionRef.current.cameraDistance + zoomDelta)
      );
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    // 12. Self-Contained Animation Loop
    let clock = new THREE.Clock();
    const cometHistory: THREE.Vector3[] = [];

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera Distance Smooth Lerp
      camera.position.z += (interactionRef.current.cameraDistance - camera.position.z) * 0.1;

      // Inactivity Auto-Resume (after 3 seconds)
      const isIdle = Date.now() - interactionRef.current.lastInteractionTime > 3000;
      if (!interactionRef.current.isInteracting) {
        if (isIdle && autoRotate) {
          planetPivot.rotation.y += 0.0035;
        } else {
          // Damping Inertia
          planetPivot.rotation.y += interactionRef.current.velocityX;
          planetPivot.rotation.x += interactionRef.current.velocityY;
          interactionRef.current.velocityX *= 0.94;
          interactionRef.current.velocityY *= 0.94;
        }
      }

      // Time-based uniform updates
      if (coronaMaterial) {
        coronaMaterial.uniforms.uTime.value = elapsedTime;
      }

      // Lava Pulsing Emission
      if (isLava && planetMaterial) {
        const pulse = 0.35 + 0.15 * Math.sin(elapsedTime * 2.8);
        planetMaterial.emissiveIntensity = pulse;
      }

      // Orbiting Moons Update
      moonMeshes.forEach(m => {
        m.orbitAngle += m.orbitSpeed;
        const x = Math.cos(m.orbitAngle) * m.orbitRadius;
        const z = Math.sin(m.orbitAngle) * m.orbitRadius;

        // Apply elliptical orbit tilts
        m.mesh.position.x = x;
        m.mesh.position.y = z * m.tiltX;
        m.mesh.position.z = z * Math.cos(m.tiltZ);
        m.mesh.rotation.y += 0.01;
      });

      // Signature Comet Delivery Animation
      const cometState = cometTriggerRef.current;
      if (cometState.active) {
        cometState.progress += 0.022; // ~45 frames flight
        cometHeadMesh.visible = true;
        cometTrailMesh.visible = true;

        const start = new THREE.Vector3(-8.0, 6.0, -6.0);
        const end = new THREE.Vector3(0, 0, 0);
        const t = Math.min(1.0, cometState.progress);

        // Curved arrival trajectory
        const curPos = new THREE.Vector3().lerpVectors(start, end, t);
        curPos.y += Math.sin(t * Math.PI) * 2.2;
        curPos.x += Math.sin(t * Math.PI) * 1.5;

        cometHeadMesh.position.copy(curPos);

        // Keep trail positions
        cometHistory.unshift(curPos.clone());
        if (cometHistory.length > 25) cometHistory.pop();

        const posAttr = cometTrailGeom.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < 25; i++) {
          const pt = cometHistory[i] || curPos;
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        posAttr.needsUpdate = true;

        if (cometState.progress >= 1.0) {
          // Impact Point Reached
          cometState.active = false;
          cometHeadMesh.visible = false;
          cometTrailMesh.visible = false;
          cometState.shockwaveProgress = 0.01;
          cometHistory.length = 0;

          if (!cometState.hasNotified) {
            cometState.hasNotified = true;
            onCometAbsorbed?.();
          }
        }
      }

      // Shockwave Burst Animation on Impact
      if (cometState.shockwaveProgress > 0) {
        cometState.shockwaveProgress += 0.035;
        const sw = cometState.shockwaveProgress;
        shockwaveMesh.scale.set(sw * 16, sw * 16, 1);
        shockwaveMat.opacity = Math.max(0, 1.0 - sw);

        if (sw >= 1.0) {
          cometState.shockwaveProgress = 0;
          shockwaveMat.opacity = 0;
        }
      }

      // Starfield slow drift
      if (starsMesh) {
        starsMesh.rotation.y += 0.0001;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 13. ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        }
      }
    });
    resizeObserver.observe(container);

    // 14. Strict Cleanup & Disposal of Geometries, Textures, Shaders & Event Listeners
    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();

      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);

      // Core Planet Disposal
      planetGeometry.dispose();
      planetMaterial.dispose();
      planetTexture.dispose();

      // Atmosphere Disposal
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();

      // Rings Disposal
      if (ringGeometry) ringGeometry.dispose();
      if (ringMaterial) ringMaterial.dispose();
      if (ringTexture) ringTexture.dispose();

      // Corona Disposal
      if (coronaGeometry) coronaGeometry.dispose();
      if (coronaMaterial) coronaMaterial.dispose();

      // Moons Disposal
      moonGeometries.forEach(g => g.dispose());
      moonMaterials.forEach(m => m.dispose());

      // Comet & Shockwave Disposal
      cometHeadGeom.dispose();
      cometHeadMat.dispose();
      cometTrailGeom.dispose();
      cometTrailMat.dispose();
      shockwaveGeom.dispose();
      shockwaveMat.dispose();

      // Starfield Disposal
      if (starGeometry) starGeometry.dispose();
      if (starMaterial) starMaterial.dispose();

      // Renderer Disposal
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();

      scene.clear();
    };
  }, [
    level,
    streakDays,
    resolvedType,
    planetScale,
    moonsCount,
    seed,
    autoRotate,
    showStarfield,
    onCometAbsorbed
  ]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-auto touch-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ minHeight: '260px' }}
      aria-label={`Interactive 3D Planetary System (Level ${level}, ${streakDays} Day Streak)`}
    />
  );
};
