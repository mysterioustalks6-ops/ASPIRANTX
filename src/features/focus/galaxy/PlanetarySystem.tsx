import React, { useEffect, useRef } from 'react';
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
  allowIdleRotation?: boolean;
  targetFps?: number;
  starParticleCount?: number;
  devicePixelRatio?: number;
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
// 2. PROCEDURAL TEXTURE GENERATORS
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
        // Celestial Singularity / Galaxy Core (Level 1000)
        const singularity = fbm3D(nx * 3.5, ny * 3.5, nz * 3.5, perm, 5);
        const swirl = Math.sin(Math.atan2(nz, nx) * 4.0 + ny * 8.0 + singularity * 3.0);
        const intensity = (swirl * 0.5 + 0.5) * 0.7 + (singularity * 0.5 + 0.5) * 0.3;

        r = 130 + Math.floor(intensity * 125);
        g = 30 + Math.floor(intensity * 180);
        b = 210 + Math.floor(intensity * 45);
      } else if (isProtostar) {
        // Solar Protostar (Level 750–999)
        const convection = fbm3D(nx * 4.0, ny * 4.0, nz * 4.0, perm, 5);
        const flare = fbm3D(nx * 8.5, ny * 8.5, nz * 8.5, perm, 4);
        const heat = convection * 0.65 + flare * 0.35;

        if (heat > 0.45) {
          r = 255;
          g = 250;
          b = 200 + Math.floor((heat - 0.45) * 100);
        } else if (heat > 0.1) {
          r = 255;
          g = 140 + Math.floor(heat * 220);
          b = 20;
        } else {
          r = 220 + Math.floor((heat + 1) * 30);
          g = 45;
          b = 10;
        }
      } else if (type === 'rocky') {
        const continentNoise = fbm3D(nx * 2.2, ny * 2.2, nz * 2.2, perm, 5);
        const detailNoise = fbm3D(nx * 7.5, ny * 7.5, nz * 7.5, perm, 4);
        const elevation = continentNoise * 0.7 + detailNoise * 0.3;
        const polar = Math.abs(ny);

        if (polar > 0.88 || elevation > 0.48) {
          r = 240 + Math.floor(detailNoise * 15);
          g = 248 + Math.floor(detailNoise * 7);
          b = 255;
        } else if (elevation < -0.05) {
          r = 10;
          g = 45 + Math.floor((elevation + 1) * 30);
          b = 105 + Math.floor((elevation + 1) * 50);
        } else if (elevation < 0.08) {
          r = 14;
          g = 120 + Math.floor(elevation * 200);
          b = 165 + Math.floor(elevation * 220);
        } else if (elevation < 0.22) {
          r = 34 + Math.floor(detailNoise * 30);
          g = 139 + Math.floor(detailNoise * 40);
          b = 64 + Math.floor(detailNoise * 20);
        } else if (elevation < 0.38) {
          r = 175 + Math.floor(detailNoise * 40);
          g = 135 + Math.floor(detailNoise * 30);
          b = 85 + Math.floor(detailNoise * 20);
        } else {
          r = 110 + Math.floor(detailNoise * 30);
          g = 95 + Math.floor(detailNoise * 25);
          b = 85 + Math.floor(detailNoise * 20);
        }
      } else if (type === 'gas') {
        const bandNoise = fbm3D(nx * 1.2, ny * 4.0, nz * 1.2, perm, 4);
        const lat = Math.sin(ny * 22.0 + bandNoise * 3.5);
        const turbulence = fbm3D(nx * 6.0, ny * 8.0, nz * 6.0, perm, 5);
        const mixVal = (lat * 0.5 + 0.5) * 0.65 + (turbulence * 0.5 + 0.5) * 0.35;

        if (mixVal < 0.25) {
          r = 180 + Math.floor(mixVal * 120);
          g = 90 + Math.floor(mixVal * 90);
          b = 40 + Math.floor(mixVal * 40);
        } else if (mixVal < 0.5) {
          r = 225 + Math.floor(mixVal * 60);
          g = 145 + Math.floor(mixVal * 80);
          b = 80 + Math.floor(mixVal * 60);
        } else if (mixVal < 0.75) {
          r = 245 + Math.floor(mixVal * 10);
          g = 190 + Math.floor(mixVal * 50);
          b = 135 + Math.floor(mixVal * 60);
        } else {
          r = 254;
          g = 230 + Math.floor(turbulence * 25);
          b = 190 + Math.floor(turbulence * 40);
        }
      } else if (type === 'lava') {
        const crust = fbm3D(nx * 2.8, ny * 2.8, nz * 2.8, perm, 5);
        const crack = 1.0 - Math.abs(fbm3D(nx * 6.5, ny * 6.5, nz * 6.5, perm, 4));

        if (crack > 0.68 || crust < -0.32) {
          const intensity = Math.min(1, Math.max(0, (crack - 0.68) / 0.32));
          if (intensity > 0.65) {
            r = 255;
            g = 235 + Math.floor(intensity * 20);
            b = 120 + Math.floor(intensity * 80);
          } else if (intensity > 0.3) {
            r = 255;
            g = 110 + Math.floor(intensity * 120);
            b = 15;
          } else {
            r = 190 + Math.floor(intensity * 60);
            g = 25;
            b = 5;
          }
        } else {
          const c = Math.max(10, Math.min(45, Math.floor(25 + crust * 20)));
          r = c + 5;
          g = c;
          b = c + 3;
        }
      } else if (type === 'ice') {
        const glacier = fbm3D(nx * 3.2, ny * 3.2, nz * 3.2, perm, 5);
        const crevasse = Math.abs(fbm3D(nx * 7.0, ny * 7.0, nz * 7.0, perm, 4));
        const elevation = glacier * 0.7 + crevasse * 0.3;

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

function generateRingsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fb = document.createElement('canvas');
    fb.width = 16;
    fb.height = 1;
    return new THREE.CanvasTexture(fb);
  }

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.08, 'rgba(217, 180, 114, 0.4)');
  grad.addColorStop(0.24, 'rgba(238, 214, 168, 0.9)');
  grad.addColorStop(0.38, 'rgba(180, 142, 85, 0.7)');
  grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.05)'); // Cassini Division
  grad.addColorStop(0.48, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(0.55, 'rgba(224, 195, 140, 0.85)');
  grad.addColorStop(0.78, 'rgba(195, 160, 105, 0.75)');
  grad.addColorStop(0.92, 'rgba(160, 125, 75, 0.3)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function mapRingUVs(geometry: THREE.RingGeometry) {
  const pos = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const u = (r - 1.75) / (3.1 - 1.75);
    uvs.setXY(i, Math.max(0, Math.min(1, u)), 0.5);
  }
  uvs.needsUpdate = true;
}

// ══════════════════════════════════════════════════════════════════════════════════
// 3. SHADER DEFINITIONS
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
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float pulse = 0.95 + 0.05 * sin(uTime * 2.5);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uPower);
    gl_FragColor = vec4(uColor, fresnel * uIntensity * pulse);
  }
`;

const CoronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CoronaFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float wave = sin(vPosition.x * 4.0 + uTime * 3.0) * cos(vPosition.y * 4.0 + uTime * 2.0);
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
    float alpha = rim * (0.65 + wave * 0.25);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ══════════════════════════════════════════════════════════════════════════════════
// 4. MAIN PLANETARY SYSTEM COMPONENT (PERSISTENT 60 FPS PIPELINE)
// ══════════════════════════════════════════════════════════════════════════════════

export const PlanetarySystem: React.FC<PlanetarySystemProps> = ({
  level = 1,
  streakDays = 1,
  isDeliveringReward = false,
  type,
  seed = 42,
  className = '',
  autoRotate = true,
  allowIdleRotation = true,
  targetFps = 60,
  starParticleCount = 650,
  devicePixelRatio: customDpr,
  showStarfield = true,
  onCometAbsorbed,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Persistent Scene Objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetPivotRef = useRef<THREE.Group | null>(null);

  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const planetTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  const ringMeshRef = useRef<THREE.Mesh | null>(null);
  const ringTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const coronaMeshRef = useRef<THREE.Mesh | null>(null);
  const coronaMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  const moonEntriesRef = useRef<{
    mesh: THREE.Mesh;
    orbitRadius: number;
    orbitSpeed: number;
    orbitAngle: number;
    tiltX: number;
    tiltZ: number;
  }[]>([]);

  const cometHeadRef = useRef<THREE.Mesh | null>(null);
  const cometTrailRef = useRef<THREE.Line | null>(null);
  const cometTrailGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const shockwaveMeshRef = useRef<THREE.Mesh | null>(null);
  const shockwaveMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const starsMeshRef = useRef<THREE.Points | null>(null);

  // Dynamic props ref (avoids tearing down scene on prop change)
  const propsRef = useRef({
    level,
    streakDays,
    type,
    seed,
    autoRotate,
    allowIdleRotation,
    targetFps,
    starParticleCount,
    customDpr,
    showStarfield,
    onCometAbsorbed
  });

  useEffect(() => {
    propsRef.current = {
      level,
      streakDays,
      type,
      seed,
      autoRotate,
      allowIdleRotation,
      targetFps,
      starParticleCount,
      customDpr,
      showStarfield,
      onCometAbsorbed
    };
  }, [
    level,
    streakDays,
    type,
    seed,
    autoRotate,
    allowIdleRotation,
    targetFps,
    starParticleCount,
    customDpr,
    showStarfield,
    onCometAbsorbed
  ]);

  // Comet state
  const cometTriggerRef = useRef({
    active: false,
    progress: 0,
    shockwaveProgress: 0,
    hasNotified: false
  });

  // Watch for isDeliveringReward prop trigger
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

  // Interaction State
  const interactionRef = useRef({
    isInteracting: false,
    velocityX: 0,
    velocityY: 0,
    lastInteractionTime: Date.now(),
    cameraDistance: 4.5,
    targetDistance: 4.5
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ONE-TIME INITIALIZATION (Mount once, zero scene recreation on prop changes)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isMounted = true;

    // 1. Container dimensions with robust fallback
    const width = container.clientWidth || 350;
    const height = container.clientHeight || 350;

    // 2. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;

    const maxDpr = customDpr || Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = level >= 750 ? 1.3 : 1.1;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight.position.set(4.8, 3.2, 4.0);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x111625, 0.5);
    scene.add(ambientLight);

    // 5. Planet Pivot Group
    const planetPivot = new THREE.Group();
    planetPivotRef.current = planetPivot;
    scene.add(planetPivot);

    // 6. Core Planet Mesh
    const initialType = type || (level >= 1000 ? 'gas' : level >= 750 ? 'lava' : level >= 500 ? 'lava' : level >= 300 ? 'gas' : 'rocky');
    const planetTexture = generatePlanetTexture(initialType, seed, level);
    planetTextureRef.current = planetTexture;

    const planetGeometry = new THREE.SphereGeometry(1.3, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: planetTexture,
      roughness: 0.65,
      metalness: 0.08
    });
    planetMaterialRef.current = planetMaterial;

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetMeshRef.current = planetMesh;
    planetPivot.add(planetMesh);

    // 7. Atmosphere Rim Glow Mesh
    const atmosphereGeometry = new THREE.SphereGeometry(1.365, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color('#38bdf8') },
        uPower: { value: 3.2 },
        uIntensity: { value: 0.85 },
        uTime: { value: 0 }
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide
    });
    atmosphereMaterialRef.current = atmosphereMaterial;

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphereMeshRef.current = atmosphereMesh;
    planetPivot.add(atmosphereMesh);

    // 8. Rings Mesh (Level 300–499)
    const ringTexture = generateRingsTexture();
    ringTextureRef.current = ringTexture;
    const ringGeometry = new THREE.RingGeometry(1.75, 3.1, 64);
    mapRingUVs(ringGeometry);

    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });

    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI * 0.42;
    ringMesh.rotation.z = 0.436;
    ringMesh.visible = level >= 300 && level < 500;
    ringMeshRef.current = ringMesh;
    planetPivot.add(ringMesh);

    // 9. Solar Protostar Corona Mesh (Level 750+)
    const coronaGeometry = new THREE.SphereGeometry(1.3 * 1.18, 48, 48);
    const coronaMaterial = new THREE.ShaderMaterial({
      vertexShader: CoronaVertexShader,
      fragmentShader: CoronaFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color('#fb923c') },
        uTime: { value: 0 }
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide
    });
    coronaMaterialRef.current = coronaMaterial;

    const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
    coronaMesh.visible = level >= 750;
    coronaMeshRef.current = coronaMesh;
    planetPivot.add(coronaMesh);

    // 10. Orbiting Moons Pool (Streak Representation - 5 persistent moons)
    const moonPalettes = [
      { color: 0x94a3b8, radius: 0.16, dist: 2.1, speed: 0.015, tilt: 0.15 },
      { color: 0x38bdf8, radius: 0.20, dist: 2.6, speed: 0.011, tilt: -0.25 },
      { color: 0xa855f7, radius: 0.18, dist: 3.1, speed: 0.008, tilt: 0.35 },
      { color: 0xfbbf24, radius: 0.24, dist: 3.6, speed: 0.006, tilt: -0.15 },
      { color: 0x34d399, radius: 0.22, dist: 4.1, speed: 0.005, tilt: 0.2 }
    ];

    const initialMoonCount = Math.min(5, Math.max(1, Math.floor(streakDays / 7) + 1));
    const moonEntries: {
      mesh: THREE.Mesh;
      orbitRadius: number;
      orbitSpeed: number;
      orbitAngle: number;
      tiltX: number;
      tiltZ: number;
    }[] = [];
    const moonGeometries: THREE.SphereGeometry[] = [];
    const moonMaterials: THREE.MeshStandardMaterial[] = [];

    for (let i = 0; i < 5; i++) {
      const cfg = moonPalettes[i];
      const mGeom = new THREE.SphereGeometry(cfg.radius, 24, 24);
      moonGeometries.push(mGeom);

      const mMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.7,
        metalness: 0.1
      });
      moonMaterials.push(mMat);

      const mMesh = new THREE.Mesh(mGeom, mMat);
      mMesh.visible = i < initialMoonCount;
      scene.add(mMesh);

      moonEntries.push({
        mesh: mMesh,
        orbitRadius: cfg.dist,
        orbitSpeed: cfg.speed,
        orbitAngle: (i * (Math.PI * 2)) / 5,
        tiltX: cfg.tilt,
        tiltZ: cfg.tilt * 0.8
      });
    }
    moonEntriesRef.current = moonEntries;

    // 11. Comet Delivery & Shockwave Burst
    const cometHeadGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const cometHeadMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cometHeadMesh = new THREE.Mesh(cometHeadGeom, cometHeadMat);
    cometHeadMesh.visible = false;
    cometHeadRef.current = cometHeadMesh;
    scene.add(cometHeadMesh);

    const trailPositions = new Float32Array(30 * 3);
    const cometTrailGeom = new THREE.BufferGeometry();
    cometTrailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    cometTrailGeomRef.current = cometTrailGeom;

    const cometTrailMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });
    const cometTrailMesh = new THREE.Line(cometTrailGeom, cometTrailMat);
    cometTrailMesh.visible = false;
    cometTrailRef.current = cometTrailMesh;
    scene.add(cometTrailMesh);

    const shockwaveGeom = new THREE.RingGeometry(0.1, 0.25, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    shockwaveMatRef.current = shockwaveMat;
    const shockwaveMesh = new THREE.Mesh(shockwaveGeom, shockwaveMat);
    shockwaveMesh.lookAt(camera.position);
    shockwaveMeshRef.current = shockwaveMesh;
    scene.add(shockwaveMesh);

    // 12. Starfield
    const starCount = starParticleCount || 650;
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

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.65,
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const starsMesh = new THREE.Points(starGeometry, starMaterial);
    starsMesh.visible = showStarfield;
    starsMeshRef.current = starsMesh;
    scene.add(starsMesh);

    // 13. Touch & Mouse Event Handlers
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

    const onTouchStart = (e: TouchEvent) => {
      interactionRef.current.lastInteractionTime = Date.now();
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

    // 14. Pre-Allocated Vector Math (ZERO Allocations Inside 60FPS RAF)
    const vCometStart = new THREE.Vector3(-8.0, 6.0, -6.0);
    const vCometEnd = new THREE.Vector3(0, 0, 0);
    const vCurPos = new THREE.Vector3();
    const cometHistory: THREE.Vector3[] = [];
    for (let i = 0; i < 30; i++) cometHistory.push(new THREE.Vector3());

    let clock = new THREE.Clock();
    let lastFrameTime = 0;

    // 15. Persistent Animation Loop
    const animate = (timestamp: number = performance.now()) => {
      if (!isMounted) return;
      animFrameIdRef.current = requestAnimationFrame(animate);

      const curProps = propsRef.current;
      const minFrameInterval = curProps.targetFps < 60 ? 1000 / curProps.targetFps : 0;

      if (minFrameInterval > 0) {
        if (timestamp - lastFrameTime < minFrameInterval) return;
        lastFrameTime = timestamp;
      }

      const elapsedTime = clock.getElapsedTime();

      // Camera Distance Smooth Lerp
      camera.position.z += (interactionRef.current.cameraDistance - camera.position.z) * 0.1;

      // Inactivity Auto-Resume
      const isIdle = Date.now() - interactionRef.current.lastInteractionTime > 3000;
      if (!interactionRef.current.isInteracting) {
        if (isIdle && curProps.autoRotate && curProps.allowIdleRotation) {
          planetPivot.rotation.y += 0.0035;
        } else if (!isIdle) {
          planetPivot.rotation.y += interactionRef.current.velocityX;
          planetPivot.rotation.x += interactionRef.current.velocityY;
          interactionRef.current.velocityX *= 0.94;
          interactionRef.current.velocityY *= 0.94;
        }
      }

      // Shader Uniforms Update
      if (atmosphereMaterialRef.current) {
        atmosphereMaterialRef.current.uniforms.uTime.value = elapsedTime;
      }
      if (coronaMaterialRef.current && coronaMeshRef.current?.visible) {
        coronaMaterialRef.current.uniforms.uTime.value = elapsedTime;
      }

      // Lava / Protostar Dynamic Pulsing
      const isLava = curProps.level >= 500 && curProps.level < 750;
      if (isLava && planetMaterialRef.current) {
        planetMaterialRef.current.emissiveIntensity = 0.35 + 0.15 * Math.sin(elapsedTime * 2.8);
      }

      // Orbiting Moons Revolution
      moonEntriesRef.current.forEach(m => {
        if (!m.mesh.visible) return;
        m.orbitAngle += m.orbitSpeed;
        const x = Math.cos(m.orbitAngle) * m.orbitRadius;
        const z = Math.sin(m.orbitAngle) * m.orbitRadius;

        m.mesh.position.x = x;
        m.mesh.position.y = z * m.tiltX;
        m.mesh.position.z = z * Math.cos(m.tiltZ);
        m.mesh.rotation.y += 0.01;
      });

      // Comet Delivery Flight
      const cometState = cometTriggerRef.current;
      if (cometState.active && cometHeadRef.current && cometTrailRef.current && cometTrailGeomRef.current) {
        cometState.progress += 0.022;
        cometHeadRef.current.visible = true;
        cometTrailRef.current.visible = true;

        const t = Math.min(1.0, cometState.progress);
        vCurPos.lerpVectors(vCometStart, vCometEnd, t);
        vCurPos.y += Math.sin(t * Math.PI) * 2.2;
        vCurPos.x += Math.sin(t * Math.PI) * 1.5;

        cometHeadRef.current.position.copy(vCurPos);

        // Update trail buffer without allocations
        const posAttr = cometTrailGeomRef.current.attributes.position as THREE.BufferAttribute;
        for (let i = 24; i > 0; i--) {
          cometHistory[i].copy(cometHistory[i - 1]);
          posAttr.setXYZ(i, cometHistory[i].x, cometHistory[i].y, cometHistory[i].z);
        }
        cometHistory[0].copy(vCurPos);
        posAttr.setXYZ(0, vCurPos.x, vCurPos.y, vCurPos.z);
        posAttr.needsUpdate = true;

        if (cometState.progress >= 1.0) {
          cometState.active = false;
          cometHeadRef.current.visible = false;
          cometTrailRef.current.visible = false;
          cometState.shockwaveProgress = 0.01;

          if (!cometState.hasNotified) {
            cometState.hasNotified = true;
            curProps.onCometAbsorbed?.();
          }
        }
      }

      // Shockwave Burst Animation on Impact
      if (cometState.shockwaveProgress > 0 && shockwaveMeshRef.current && shockwaveMatRef.current) {
        cometState.shockwaveProgress += 0.035;
        const sw = cometState.shockwaveProgress;
        shockwaveMeshRef.current.scale.set(sw * 16, sw * 16, 1);
        shockwaveMatRef.current.opacity = Math.max(0, 1.0 - sw);

        if (sw >= 1.0) {
          cometState.shockwaveProgress = 0;
          shockwaveMatRef.current.opacity = 0;
        }
      }

      // Starfield Rotation
      if (starsMeshRef.current && curProps.showStarfield) {
        starsMeshRef.current.rotation.y += 0.0001;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 16. Safe ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (!isMounted) return;
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 10 && newH > 10) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        }
      }
    });
    resizeObserver.observe(container);

    // 17. Cleanup Guard
    return () => {
      isMounted = false;
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

      planetGeometry.dispose();
      planetMaterial.dispose();
      if (planetTextureRef.current) planetTextureRef.current.dispose();

      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();

      ringGeometry.dispose();
      ringMaterial.dispose();
      if (ringTextureRef.current) ringTextureRef.current.dispose();

      coronaGeometry.dispose();
      coronaMaterial.dispose();

      moonGeometries.forEach(g => g.dispose());
      moonMaterials.forEach(m => m.dispose());

      cometHeadGeom.dispose();
      cometHeadMat.dispose();
      cometTrailGeom.dispose();
      cometTrailMat.dispose();
      shockwaveGeom.dispose();
      shockwaveMat.dispose();

      starGeometry.dispose();
      starMaterial.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();

      planetPivotRef.current = null;
      planetMeshRef.current = null;
      atmosphereMeshRef.current = null;
      ringMeshRef.current = null;
      coronaMeshRef.current = null;
      moonEntriesRef.current = [];
      starsMeshRef.current = null;
    };
  }, []); // Run ONCE on mount

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DYNAMIC UPDATES EFFECT (Updates textures/scales/moons WITHOUT rebuilding)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!planetMeshRef.current || !planetMaterialRef.current) return;

    // 1. Calculate dynamic level-based scale & planet tier
    const planetScale = Math.min(1.45, Math.max(0.75, 0.75 + (level / 1000) * 0.7));
    const resolvedType: PlanetType = type || (
      level >= 1000 ? 'gas' :
      level >= 750 ? 'lava' :
      level >= 500 ? 'lava' :
      level >= 300 ? 'gas' : 'rocky'
    );

    const isLava = level >= 500 && level < 750;
    const isProtostar = level >= 750 && level < 1000;
    const isGalaxyCore = level >= 1000;

    // 2. Update Planet Scale
    planetMeshRef.current.scale.set(planetScale, planetScale, planetScale);

    // 3. Update Planet Texture & Material
    const newTexture = generatePlanetTexture(resolvedType, seed, level);
    if (planetTextureRef.current) {
      planetTextureRef.current.dispose();
    }
    planetTextureRef.current = newTexture;
    planetMaterialRef.current.map = newTexture;
    planetMaterialRef.current.roughness = isProtostar ? 0.1 : isLava ? 0.88 : resolvedType === 'ice' ? 0.25 : 0.65;
    planetMaterialRef.current.metalness = isProtostar ? 0.0 : resolvedType === 'ice' ? 0.2 : 0.08;

    planetMaterialRef.current.emissive.set(
      isProtostar ? '#ff4500' : isGalaxyCore ? '#7e22ce' : isLava ? '#ff3300' : 0x000000
    );
    planetMaterialRef.current.emissiveIntensity = isProtostar ? 0.75 : isGalaxyCore ? 0.5 : isLava ? 0.4 : 0.0;
    planetMaterialRef.current.needsUpdate = true;

    // 4. Update Atmosphere Scale & Color
    if (atmosphereMeshRef.current && atmosphereMaterialRef.current) {
      atmosphereMeshRef.current.scale.set(planetScale, planetScale, planetScale);

      const atmoColors: Record<PlanetType, string> = {
        rocky: level < 100 ? '#64748b' : '#38bdf8',
        gas: isGalaxyCore ? '#a855f7' : '#fbbf24',
        lava: isProtostar ? '#ff6b00' : '#ff4500',
        ice: '#34d399'
      };
      atmosphereMaterialRef.current.uniforms.uColor.value.set(atmoColors[resolvedType]);
      atmosphereMaterialRef.current.uniforms.uPower.value = level < 100 ? 4.2 : 2.8;
      atmosphereMaterialRef.current.uniforms.uIntensity.value = level < 100 ? 0.45 : isProtostar ? 1.4 : 0.95;
    }

    // 5. Update Rings Visibility & Scale (Level 300–499)
    if (ringMeshRef.current) {
      ringMeshRef.current.visible = level >= 300 && level < 500;
      ringMeshRef.current.scale.set(planetScale, planetScale, planetScale);
    }

    // 6. Update Protostar Corona Visibility (Level 750+)
    if (coronaMeshRef.current && coronaMaterialRef.current) {
      coronaMeshRef.current.visible = isProtostar || isGalaxyCore;
      coronaMeshRef.current.scale.set(planetScale, planetScale, planetScale);
      coronaMaterialRef.current.uniforms.uColor.value.set(isGalaxyCore ? '#c084fc' : '#fb923c');
    }

    // 7. Update Moons Pool Visibility & Orbit Radius
    const moonsCount = Math.min(5, Math.max(1, Math.floor(streakDays / 7) + 1));
    moonEntriesRef.current.forEach((m, idx) => {
      m.mesh.visible = idx < moonsCount;
      m.orbitRadius = [2.1, 2.6, 3.1, 3.6, 4.1][idx] * planetScale;
    });

    // 8. Starfield Visibility
    if (starsMeshRef.current) {
      starsMeshRef.current.visible = showStarfield;
    }
  }, [level, streakDays, type, seed, showStarfield]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[350px] overflow-hidden select-none pointer-events-auto touch-none cursor-grab active:cursor-grabbing ${className}`}
      aria-label={`Interactive 3D Planetary System (Level ${level}, ${streakDays} Day Streak)`}
    />
  );
};
