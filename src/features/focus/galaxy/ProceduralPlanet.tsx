import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type PlanetType = 'rocky' | 'gas' | 'lava' | 'ice';

export interface ProceduralPlanetProps {
  type: PlanetType;
  seed?: number;
  className?: string;
  autoRotate?: boolean;
  showAtmosphere?: boolean;
  showStarfield?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════════
// 1. DETERMINISTIC PRNG & 3D FRACTIONAL BROWNIAN MOTION (fBm) NOISE
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
// 2. PROCEDURAL 512x256 IN-MEMORY CANVAS TEXTURE GENERATOR
// ══════════════════════════════════════════════════════════════════════════════════

function generatePlanetTexture(type: PlanetType, seed: number): THREE.CanvasTexture {
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

      if (type === 'rocky') {
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

// ══════════════════════════════════════════════════════════════════════════════════
// 3. ATMOSPHERE FRESNEL RIM SHADER & PALETTES
// ══════════════════════════════════════════════════════════════════════════════════

const ATMOSPHERE_PALETTES: Record<PlanetType, { color: string; power: number; glowIntensity: number; emissive: number }> = {
  rocky: { color: '#38bdf8', power: 3.2, glowIntensity: 0.85, emissive: 0x000000 },
  gas: { color: '#fbbf24', power: 2.8, glowIntensity: 0.9, emissive: 0x1a0f05 },
  lava: { color: '#ff4500', power: 2.6, glowIntensity: 1.1, emissive: 0x330a00 },
  ice: { color: '#67e8f9', power: 3.0, glowIntensity: 0.95, emissive: 0x001122 },
};

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
    float pulse = 0.95 + 0.05 * sin(uTime * 2.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uPower);
    gl_FragColor = vec4(uColor, fresnel * uIntensity * pulse);
  }
`;

// ══════════════════════════════════════════════════════════════════════════════════
// 4. MAIN PROCEDURAL PLANET COMPONENT (PERSISTENT 60 FPS PIPELINE)
// ══════════════════════════════════════════════════════════════════════════════════

export const ProceduralPlanet: React.FC<ProceduralPlanetProps> = ({
  type = 'rocky',
  seed = 42,
  className = '',
  autoRotate = true,
  showAtmosphere = true,
  showStarfield = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mesh & Material persistent refs
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const planetTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const starsMeshRef = useRef<THREE.Points | null>(null);

  // Dynamic props ref (avoids tearing down scene on prop change)
  const propsRef = useRef({
    type,
    seed,
    autoRotate,
    showAtmosphere,
    showStarfield
  });

  useEffect(() => {
    propsRef.current = {
      type,
      seed,
      autoRotate,
      showAtmosphere,
      showStarfield
    };
  }, [type, seed, autoRotate, showAtmosphere, showStarfield]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ONE-TIME INITIALIZATION EFFECT (Mount once, zero rebuild on prop change)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isMounted = true;

    // 1. Container dimensions with robust fallback (prevents 0x0 collapse)
    const width = container.clientWidth || 350;
    const height = container.clientHeight || 350;

    // 2. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    // 3. WebGL Renderer with mobile DPR clamp (max 1.5)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Clear and attach domElement
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(4.5, 2.8, 3.8);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x111625, 0.45);
    scene.add(ambientLight);

    // 5. Core Planet Mesh
    const initialConfig = ATMOSPHERE_PALETTES[type];
    const planetTexture = generatePlanetTexture(type, seed);
    planetTextureRef.current = planetTexture;

    const planetGeometry = new THREE.SphereGeometry(1.3, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: planetTexture,
      roughness: type === 'ice' ? 0.25 : type === 'gas' ? 0.4 : type === 'lava' ? 0.88 : 0.8,
      metalness: type === 'ice' ? 0.2 : 0.05,
      emissive: new THREE.Color(initialConfig.emissive),
      emissiveIntensity: type === 'lava' ? 0.35 : 0.05
    });
    planetMaterialRef.current = planetMaterial;

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetMeshRef.current = planetMesh;
    scene.add(planetMesh);

    // 6. Atmosphere Fresnel Glow Mesh
    const atmosphereGeometry = new THREE.SphereGeometry(1.36, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(initialConfig.color) },
        uPower: { value: initialConfig.power },
        uIntensity: { value: initialConfig.glowIntensity },
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
    atmosphereMesh.visible = showAtmosphere;
    scene.add(atmosphereMesh);

    // 7. Background Starfield
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 20.0 + Math.random() * 25.0;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const spectral = Math.random();
      if (spectral < 0.65) {
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      } else if (spectral < 0.85) {
        starColors[i * 3] = 0.65;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 0.6;
      }
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.65,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    const starsMesh = new THREE.Points(starGeometry, starMaterial);
    starsMeshRef.current = starsMesh;
    starsMesh.visible = showStarfield;
    scene.add(starsMesh);

    // 8. Persistent 60 FPS Render Loop (Zero Vector Allocations)
    let startTime = performance.now();

    const animate = () => {
      if (!isMounted) return;
      animFrameIdRef.current = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const elapsedSeconds = (currentTime - startTime) * 0.001;

      const currentProps = propsRef.current;

      // Continuous Planet Rotation
      if (currentProps.autoRotate && planetMeshRef.current) {
        planetMeshRef.current.rotation.y += 0.003;
      }

      // Atmosphere Pulsing & Rotation
      if (atmosphereMeshRef.current && atmosphereMaterialRef.current) {
        atmosphereMeshRef.current.visible = currentProps.showAtmosphere;
        atmosphereMaterialRef.current.uniforms.uTime.value = elapsedSeconds;
        if (currentProps.autoRotate) {
          atmosphereMeshRef.current.rotation.y += 0.0025;
        }
      }

      // Starfield Rotation
      if (starsMeshRef.current) {
        starsMeshRef.current.visible = currentProps.showStarfield;
        starsMeshRef.current.rotation.y += 0.00015;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Debounced ResizeObserver with Zero 0x0 Division Protection
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

    // 10. Strict Cleanup Guard
    return () => {
      isMounted = false;
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();

      planetGeometry.dispose();
      planetMaterial.dispose();
      if (planetTextureRef.current) planetTextureRef.current.dispose();

      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();

      starGeometry.dispose();
      starMaterial.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();

      planetMeshRef.current = null;
      planetMaterialRef.current = null;
      atmosphereMeshRef.current = null;
      atmosphereMaterialRef.current = null;
      starsMeshRef.current = null;
    };
  }, []); // Run ONCE on mount

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DYNAMIC UPDATES EFFECT (Updates textures/materials WITHOUT rebuilding scene)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!planetMaterialRef.current || !atmosphereMaterialRef.current) return;

    // 1. Re-generate texture seamlessly on type or seed change
    const newTexture = generatePlanetTexture(type, seed);
    if (planetTextureRef.current) {
      planetTextureRef.current.dispose();
    }
    planetTextureRef.current = newTexture;
    planetMaterialRef.current.map = newTexture;
    planetMaterialRef.current.roughness = type === 'ice' ? 0.25 : type === 'gas' ? 0.4 : type === 'lava' ? 0.88 : 0.8;
    planetMaterialRef.current.metalness = type === 'ice' ? 0.2 : 0.05;

    const atmoConfig = ATMOSPHERE_PALETTES[type];
    planetMaterialRef.current.emissive.set(atmoConfig.emissive);
    planetMaterialRef.current.emissiveIntensity = type === 'lava' ? 0.35 : 0.05;
    planetMaterialRef.current.needsUpdate = true;

    // 2. Update Atmosphere Uniforms
    atmosphereMaterialRef.current.uniforms.uColor.value.set(atmoConfig.color);
    atmosphereMaterialRef.current.uniforms.uPower.value = atmoConfig.power;
    atmosphereMaterialRef.current.uniforms.uIntensity.value = atmoConfig.glowIntensity;

    if (atmosphereMeshRef.current) {
      atmosphereMeshRef.current.visible = showAtmosphere;
    }
    if (starsMeshRef.current) {
      starsMeshRef.current.visible = showStarfield;
    }
  }, [type, seed, showAtmosphere, showStarfield]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[350px] overflow-hidden select-none pointer-events-auto ${className}`}
      aria-label={`Procedural 3D ${type} planet visualization`}
    />
  );
};
