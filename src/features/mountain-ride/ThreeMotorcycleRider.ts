import * as THREE from 'three';
import { BikeConfig, RiderConfig, BikeColors } from './types';

/**
 * Procedural texture helpers for ultra-crisp, high-fidelity WebGL surfaces
 * without external network asset dependencies.
 */
function createKnobbyTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Base tire rubber
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Aggressive dual-sport knobby tread blocks
  ctx.fillStyle = '#0a0d12';
  const blockW = 28;
  const blockH = 34;
  for (let x = 0; x < canvas.width; x += 40) {
    // Center alternating row
    ctx.fillRect(x + 6, 20, blockW, blockH);
    ctx.fillRect(x + 24, 74, blockW, blockH);

    // Shoulder cornering knobs
    ctx.fillRect(x, 2, 22, 14);
    ctx.fillRect(x + 20, canvas.height - 16, 22, 14);
  }

  // Tread grooves
  ctx.strokeStyle = '#05070a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(canvas.width, 64);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

function createPannierTexture(primaryHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 256, 256);

  // Embossed horizontal strengthening ribs
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(20, 60, 216, 12);
  ctx.fillRect(20, 110, 216, 12);
  ctx.fillRect(20, 160, 216, 12);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(20, 58, 216, 3);
  ctx.fillRect(20, 108, 216, 3);
  ctx.fillRect(20, 158, 216, 3);

  // Black protective corner bumper caps
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 36, 36);
  ctx.fillRect(220, 0, 36, 36);
  ctx.fillRect(0, 220, 36, 36);
  ctx.fillRect(220, 220, 36, 36);

  // Reflective diagonal safety hazard chevrons on rear
  ctx.fillStyle = '#f59e0b';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(70 + i * 32, 200);
    ctx.lineTo(84 + i * 32, 200);
    ctx.lineTo(68 + i * 32, 228);
    ctx.lineTo(54 + i * 32, 228);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createCarbonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#27272a';
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      if ((x + y) % 16 === 0) {
        ctx.fillRect(x, y, 7, 7);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

function createShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

export class ThreeMotorcycleRider {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private rootGroup: THREE.Group;
  private bikeGroup: THREE.Group;
  private riderGroup: THREE.Group;
  private rearWheelGroup: THREE.Group;
  private frontWheelGroup: THREE.Group;
  private swingarmGroup: THREE.Group;
  private suspensionGroup: THREE.Group;
  private tailLightMesh: THREE.Mesh | null = null;
  private tailLightGlow: THREE.PointLight | null = null;
  private contactShadow: THREE.Mesh | null = null;

  // Shared Procedural Textures
  private tireTreadTex: THREE.CanvasTexture;
  private carbonTex: THREE.CanvasTexture;
  private shadowTex: THREE.CanvasTexture;

  // Materials map for dynamic updating without scene rebuild
  private materials: {
    primaryPaint?: THREE.MeshStandardMaterial;
    secondaryFrame?: THREE.MeshStandardMaterial;
    seatLeather?: THREE.MeshStandardMaterial;
    luggageCase?: THREE.MeshStandardMaterial;
    chromeExhaust?: THREE.MeshStandardMaterial;
    rubberTire?: THREE.MeshStandardMaterial;
    helmetPaint?: THREE.MeshStandardMaterial;
    jacketFabric?: THREE.MeshStandardMaterial;
    pantsFabric?: THREE.MeshStandardMaterial;
    bootsLeather?: THREE.MeshStandardMaterial;
  } = {};

  private currentBike: BikeConfig;
  private currentRider: RiderConfig;
  private wheelRotation = 0;
  private suspensionPhase = 0;
  private breathingPhase = 0;

  constructor(canvas: HTMLCanvasElement, bike: BikeConfig, rider: RiderConfig) {
    this.currentBike = bike;
    this.currentRider = rider;

    // 1. Procedural High-Res Texture Atlases
    this.tireTreadTex = createKnobbyTreadTexture();
    this.carbonTex = createCarbonTexture();
    this.shadowTex = createShadowTexture();

    // 2. Scene & Lighting
    this.scene = new THREE.Scene();

    // 3. Camera with smart responsive positioning
    this.camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / (canvas.clientHeight || 1), 0.1, 80);
    this.updateCameraLayout(canvas.clientWidth, canvas.clientHeight);

    // 4. Renderer with WebGL Antialiasing & HDR Tonemapping
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // 5. Scene Lighting
    this.setupLighting();

    // 6. Root Hierarchy
    this.rootGroup = new THREE.Group();
    this.bikeGroup = new THREE.Group();
    this.riderGroup = new THREE.Group();
    this.rearWheelGroup = new THREE.Group();
    this.frontWheelGroup = new THREE.Group();
    this.swingarmGroup = new THREE.Group();
    this.suspensionGroup = new THREE.Group();

    this.rootGroup.add(this.bikeGroup);
    this.rootGroup.add(this.riderGroup);
    this.scene.add(this.rootGroup);

    // 7. Ground Contact Shadow
    this.setupContactShadow();

    // 8. Build 3D Assemblies
    this.buildBike();
    this.buildRider();
  }

  private updateCameraLayout(width: number, height: number) {
    const aspect = width / (height || 1);
    this.camera.aspect = aspect;

    if (aspect < 0.6) {
      // Mobile portrait - pull back and slightly up so bike is centered in lower 35% of screen
      this.camera.fov = 44;
      this.camera.position.set(0, 2.35, 6.1);
      this.camera.lookAt(0, 0.85, -0.6);
    } else if (aspect < 1.0) {
      // Tablet / square
      this.camera.fov = 40;
      this.camera.position.set(0, 2.15, 5.4);
      this.camera.lookAt(0, 0.82, -0.6);
    } else {
      // Desktop / widescreen
      this.camera.fov = 36;
      this.camera.position.set(0, 1.95, 4.8);
      this.camera.lookAt(0, 0.85, -0.6);
    }
    this.camera.updateProjectionMatrix();
  }

  private setupLighting() {
    // Ambient Skylight
    const ambientLight = new THREE.AmbientLight(0xcfd8dc, 1.5);
    this.scene.add(ambientLight);

    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.8);
    sunLight.position.set(4, 9, 4);
    this.scene.add(sunLight);

    // Horizon Fill & Rim Light (Gives crisp separation against mountains)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-3.5, 3.5, -4.5);
    this.scene.add(rimLight);

    // Undercarriage Ground Bounce
    const groundBounce = new THREE.DirectionalLight(0x475569, 0.9);
    groundBounce.position.set(0, -3, 0);
    this.scene.add(groundBounce);

    // Glowing Ruby LED Taillight Point Light
    this.tailLightGlow = new THREE.PointLight(0xef4444, 2.8, 4.0);
    this.tailLightGlow.position.set(0, 0.88, 0.72);
    this.scene.add(this.tailLightGlow);
  }

  private setupContactShadow() {
    const shadowGeo = new THREE.PlaneGeometry(1.6, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(0, 0.02, -0.2);
    this.scene.add(this.contactShadow);
  }

  // ─────────────────────────────────────────────────────────────
  // 3D MOTORCYCLE PROCEDURAL MESH BUILDER
  // ─────────────────────────────────────────────────────────────
  public buildBike(bikeConfig?: BikeConfig) {
    if (bikeConfig) this.currentBike = bikeConfig;
    const b = this.currentBike;

    // Clear previous children
    while (this.bikeGroup.children.length > 0) {
      this.bikeGroup.remove(this.bikeGroup.children[0]);
    }

    // Material Definitions with Physical PBR Parameters
    this.materials.primaryPaint = new THREE.MeshStandardMaterial({
      color: new THREE.Color(b.colors.primary),
      metalness: 0.72,
      roughness: 0.22,
      envMapIntensity: 1.2
    });

    this.materials.secondaryFrame = new THREE.MeshStandardMaterial({
      color: new THREE.Color(b.colors.secondary),
      metalness: 0.85,
      roughness: 0.32
    });

    this.materials.seatLeather = new THREE.MeshStandardMaterial({
      color: new THREE.Color(b.colors.seat),
      roughness: 0.88,
      metalness: 0.08
    });

    const pannierTex = createPannierTexture(b.colors.luggage);
    this.materials.luggageCase = new THREE.MeshStandardMaterial({
      map: pannierTex,
      metalness: 0.82,
      roughness: 0.38
    });

    this.materials.chromeExhaust = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.12
    });

    this.materials.rubberTire = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      bumpMap: this.tireTreadTex,
      bumpScale: 0.06,
      roughness: 0.94,
      metalness: 0.04
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      map: this.carbonTex,
      metalness: 0.6,
      roughness: 0.35
    });

    const goldAnodized = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.25
    });

    const darkEngineBlock = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.75,
      roughness: 0.45
    });

    // ── A. REAR WHEEL ASSEMBLY (Rotating Knobby Tire + Spoked Alloy Rim + Rotor + Caliper) ──
    this.rearWheelGroup = new THREE.Group();
    this.rearWheelGroup.position.set(0, 0.44, 0.52);

    // 1. Dual-Sport Tire Carcass
    const tireGeo = new THREE.TorusGeometry(0.36, 0.12, 18, 36);
    const tireMesh = new THREE.Mesh(tireGeo, this.materials.rubberTire);
    this.rearWheelGroup.add(tireMesh);

    // 2. 3D Knobby Tread Lugs around tire perimeter
    const treadLugGeo = new THREE.BoxGeometry(0.045, 0.024, 0.08);
    const numLugs = 22;
    for (let i = 0; i < numLugs; i++) {
      const angle = (i / numLugs) * Math.PI * 2;
      const lugL = new THREE.Mesh(treadLugGeo, this.materials.rubberTire);
      lugL.position.set(0.08, Math.sin(angle) * 0.44, Math.cos(angle) * 0.44);
      lugL.rotation.x = angle;
      this.rearWheelGroup.add(lugL);

      const lugR = new THREE.Mesh(treadLugGeo, this.materials.rubberTire);
      lugR.position.set(-0.08, Math.sin(angle) * 0.44, Math.cos(angle) * 0.44);
      lugR.rotation.x = angle;
      this.rearWheelGroup.add(lugR);

      // Center chevron knob
      const lugC = new THREE.Mesh(treadLugGeo, this.materials.rubberTire);
      lugC.position.set(0, Math.sin(angle + 0.14) * 0.45, Math.cos(angle + 0.14) * 0.45);
      lugC.rotation.x = angle + 0.14;
      this.rearWheelGroup.add(lugC);
    }

    // 3. Wheel Rim & Spoke Hub
    const rimGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.16, 24);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(b.colors.wheels),
      metalness: 0.88,
      roughness: 0.28
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    this.rearWheelGroup.add(rimMesh);

    // Spoke lattice
    const spokeGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.29, 6);
    for (let s = 0; s < 12; s++) {
      const sAngle = (s / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeo, this.materials.chromeExhaust);
      spoke.position.set(0, Math.sin(sAngle) * 0.15, Math.cos(sAngle) * 0.15);
      spoke.rotation.x = sAngle;
      spoke.rotation.z = (s % 2 === 0 ? 0.2 : -0.2);
      this.rearWheelGroup.add(spoke);
    }

    // 4. Stainless Steel Wave Brake Disc
    const discGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.016, 20);
    discGeo.rotateX(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, this.materials.chromeExhaust);
    discMesh.position.x = -0.09;
    this.rearWheelGroup.add(discMesh);

    // 5. Red Brembo Caliper (Stationary on swingarm)
    const caliperGeo = new THREE.BoxGeometry(0.05, 0.09, 0.08);
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 });
    const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
    caliperMesh.position.set(-0.1, 0.23, 0.06);
    this.bikeGroup.add(caliperMesh);

    // 6. Rear Drive Sprocket & Gold O-Ring Chain
    const sprocketGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.018, 24);
    sprocketGeo.rotateX(Math.PI / 2);
    const sprocket = new THREE.Mesh(sprocketGeo, this.materials.secondaryFrame);
    sprocket.position.x = 0.09;
    this.rearWheelGroup.add(sprocket);

    // Gold Chain Segment
    const chainGeo = new THREE.BoxGeometry(0.024, 0.03, 0.65);
    const chainUpper = new THREE.Mesh(chainGeo, goldAnodized);
    chainUpper.position.set(0.09, 0.54, 0.18);
    this.bikeGroup.add(chainUpper);
    const chainLower = new THREE.Mesh(chainGeo, goldAnodized);
    chainLower.position.set(0.09, 0.36, 0.18);
    this.bikeGroup.add(chainLower);

    this.bikeGroup.add(this.rearWheelGroup);

    // ── B. SWINGARM & REAR MONOSHOCK SUSPENSION ──
    const swingarmGeo = new THREE.BoxGeometry(0.048, 0.075, 0.74);
    const swingL = new THREE.Mesh(swingarmGeo, this.materials.secondaryFrame);
    swingL.position.set(-0.11, 0.47, 0.16);
    swingL.rotation.x = -0.14;
    this.bikeGroup.add(swingL);

    const swingR = new THREE.Mesh(swingarmGeo, this.materials.secondaryFrame);
    swingR.position.set(0.11, 0.47, 0.16);
    swingR.rotation.x = -0.14;
    this.bikeGroup.add(swingR);

    // Monoshock Damper with Piggyback Gas Reservoir
    const shockBodyGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.38, 12);
    const shock = new THREE.Mesh(shockBodyGeo, this.materials.chromeExhaust);
    shock.position.set(0, 0.66, 0.1);
    shock.rotation.x = 0.55;
    this.bikeGroup.add(shock);

    // Gold Coiled Spring Rings
    const springRingGeo = new THREE.TorusGeometry(0.052, 0.016, 8, 16);
    for (let c = -3; c <= 3; c++) {
      const ring = new THREE.Mesh(springRingGeo, goldAnodized);
      ring.position.set(0, 0.66 + c * 0.048, 0.1 - c * 0.028);
      ring.rotation.x = 0.55;
      this.bikeGroup.add(ring);
    }

    // ── C. ADVENTURE TWIN ENGINE & CRANKCASE ──
    const crankGeo = new THREE.BoxGeometry(0.36, 0.36, 0.58);
    const crankcase = new THREE.Mesh(crankGeo, darkEngineBlock);
    crankcase.position.set(0, 0.56, -0.42);
    this.bikeGroup.add(crankcase);

    // Boxer Twin Cylinder Heads with 8 Stacked Horizontal Cooling Fins
    const cylHeadGeo = new THREE.BoxGeometry(0.18, 0.18, 0.22);
    const finGeo = new THREE.BoxGeometry(0.22, 0.012, 0.26);

    const cylL = new THREE.Mesh(cylHeadGeo, this.materials.secondaryFrame);
    cylL.position.set(-0.26, 0.54, -0.42);
    this.bikeGroup.add(cylL);

    const cylR = new THREE.Mesh(cylHeadGeo, this.materials.secondaryFrame);
    cylR.position.set(0.26, 0.54, -0.42);
    this.bikeGroup.add(cylR);

    for (let f = -3; f <= 3; f++) {
      const finL = new THREE.Mesh(finGeo, this.materials.chromeExhaust);
      finL.position.set(-0.26, 0.54 + f * 0.024, -0.42);
      this.bikeGroup.add(finL);

      const finR = new THREE.Mesh(finGeo, this.materials.chromeExhaust);
      finR.position.set(0.26, 0.54 + f * 0.024, -0.42);
      this.bikeGroup.add(finR);
    }

    // Heavy-Duty Aluminum Skid / Sump Bash Plate
    const skidGeo = new THREE.BoxGeometry(0.32, 0.03, 0.72);
    const skidPlate = new THREE.Mesh(skidGeo, this.materials.chromeExhaust);
    skidPlate.position.set(0, 0.36, -0.38);
    skidPlate.rotation.x = 0.12;
    this.bikeGroup.add(skidPlate);

    // Tubular Steel Engine Crash Bars
    const crashBarGeo = new THREE.TorusGeometry(0.26, 0.022, 8, 16);
    const crashL = new THREE.Mesh(crashBarGeo, this.materials.secondaryFrame);
    crashL.position.set(-0.26, 0.62, -0.38);
    crashL.rotation.y = Math.PI / 2;
    this.bikeGroup.add(crashL);

    const crashR = new THREE.Mesh(crashBarGeo, this.materials.secondaryFrame);
    crashR.position.set(0.26, 0.62, -0.38);
    crashR.rotation.y = Math.PI / 2;
    this.bikeGroup.add(crashR);

    // ── D. SCULPTED FUEL TANK & BODYWORK ──
    const tankGeo = new THREE.BoxGeometry(0.38, 0.34, 0.58);
    const fuelTank = new THREE.Mesh(tankGeo, this.materials.primaryPaint);
    fuelTank.position.set(0, 0.94, -0.48);
    fuelTank.rotation.x = -0.15;
    this.bikeGroup.add(fuelTank);

    // Billet Aluminum Fuel Filler Cap
    const capGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
    const cap = new THREE.Mesh(capGeo, this.materials.chromeExhaust);
    cap.position.set(0, 1.11, -0.48);
    this.bikeGroup.add(cap);

    // Ergonomic Knee Recesses (Tank Rubber Grip Pads)
    const tankGripGeo = new THREE.BoxGeometry(0.02, 0.16, 0.28);
    const gripL = new THREE.Mesh(tankGripGeo, this.materials.rubberTire);
    gripL.position.set(-0.2, 0.92, -0.42);
    this.bikeGroup.add(gripL);

    const gripR = new THREE.Mesh(tankGripGeo, this.materials.rubberTire);
    gripR.position.set(0.2, 0.92, -0.42);
    this.bikeGroup.add(gripR);

    // ── E. TOURING SADDLE (Two-Tier Sculpted Leather Seat) ──
    const riderSeatGeo = new THREE.BoxGeometry(0.3, 0.12, 0.42);
    const riderSeat = new THREE.Mesh(riderSeatGeo, this.materials.seatLeather);
    riderSeat.position.set(0, 0.88, -0.14);
    riderSeat.rotation.x = 0.08;
    this.bikeGroup.add(riderSeat);

    const pillionSeatGeo = new THREE.BoxGeometry(0.26, 0.14, 0.36);
    const pillionSeat = new THREE.Mesh(pillionSeatGeo, this.materials.seatLeather);
    pillionSeat.position.set(0, 0.95, 0.22);
    this.bikeGroup.add(pillionSeat);

    // ── F. HIGH-PERFORMANCE ADVENTURE EXHAUST SYSTEM ──
    // Header pipe from engine
    const pipeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.82, 12);
    const headerPipe = new THREE.Mesh(pipeGeo, this.materials.chromeExhaust);
    headerPipe.position.set(0.22, 0.58, 0.05);
    headerPipe.rotation.set(-0.25, 0, 0.12);
    this.bikeGroup.add(headerPipe);

    // Oval Adventure Silencer Canister with Carbon Endcap
    const silencerGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.58, 16);
    silencerGeo.rotateZ(Math.PI / 2);
    const silencer = new THREE.Mesh(silencerGeo, this.materials.chromeExhaust);
    silencer.position.set(0.26, 0.78, 0.42);
    silencer.rotation.set(-0.28, 0.08, 0);
    this.bikeGroup.add(silencer);

    const carbonEndcap = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.06, 0.08, 16), carbonMat);
    carbonEndcap.position.set(0.27, 0.85, 0.68);
    carbonEndcap.rotation.x = Math.PI / 2;
    this.bikeGroup.add(carbonEndcap);

    // ── G. EXPEDITION LUGGAGE SYSTEM (Panniers & Top Roll Bag) ──
    if (b.hasPanniers) {
      const pannierGeo = new THREE.BoxGeometry(0.25, 0.36, 0.52);

      // Left Hard Aluminum Pannier
      const panL = new THREE.Mesh(pannierGeo, this.materials.luggageCase);
      panL.position.set(-0.44, 0.88, 0.32);
      this.bikeGroup.add(panL);

      // Right Hard Aluminum Pannier
      const panR = new THREE.Mesh(pannierGeo, this.materials.luggageCase);
      panR.position.set(0.44, 0.88, 0.32);
      this.bikeGroup.add(panR);

      // Steel Pannier Mounting Racks
      const rackGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8);
      const rackL = new THREE.Mesh(rackGeo, this.materials.secondaryFrame);
      rackL.position.set(-0.31, 0.84, 0.32);
      rackL.rotation.z = Math.PI / 2;
      this.bikeGroup.add(rackL);

      const rackR = new THREE.Mesh(rackGeo, this.materials.secondaryFrame);
      rackR.position.set(0.31, 0.84, 0.32);
      rackR.rotation.z = Math.PI / 2;
      this.bikeGroup.add(rackR);
    }

    if (b.hasTopBox) {
      // Cylindrical Dry-Bag Top Duffel with Tie-Down Straps
      const duffelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.54, 16);
      duffelGeo.rotateZ(Math.PI / 2);
      const duffelMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(b.colors.luggage),
        roughness: 0.82
      });
      const topBag = new THREE.Mesh(duffelGeo, duffelMat);
      topBag.position.set(0, 1.12, 0.38);
      this.bikeGroup.add(topBag);

      // Black tie-down straps
      const strapGeo = new THREE.TorusGeometry(0.145, 0.012, 6, 16);
      for (let s = -1; s <= 1; s += 2) {
        const strap = new THREE.Mesh(strapGeo, this.materials.rubberTire);
        strap.position.set(s * 0.18, 1.12, 0.38);
        strap.rotation.y = Math.PI / 2;
        this.bikeGroup.add(strap);
      }
    }

    // ── H. REAR TAIL SECTION, NUMBER PLATE & LED RUBY TAILLIGHT ──
    const mudguardGeo = new THREE.BoxGeometry(0.22, 0.05, 0.42);
    const mudguard = new THREE.Mesh(mudguardGeo, this.materials.rubberTire);
    mudguard.position.set(0, 0.76, 0.56);
    mudguard.rotation.x = -0.22;
    this.bikeGroup.add(mudguard);

    // Number Plate Holder
    const plateGeo = new THREE.BoxGeometry(0.18, 0.14, 0.02);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.62, 0.74);
    plate.rotation.x = -0.15;
    this.bikeGroup.add(plate);

    // Brilliant Ruby Red LED Tail Light Bar
    const tailGeo = new THREE.BoxGeometry(0.24, 0.045, 0.035);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 3.2,
      roughness: 0.15
    });
    this.tailLightMesh = new THREE.Mesh(tailGeo, tailMat);
    this.tailLightMesh.position.set(0, 0.85, 0.66);
    this.bikeGroup.add(this.tailLightMesh);

    // Amber Turn Indicators
    const indGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 10);
    indGeo.rotateZ(Math.PI / 2);
    const indMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.8 });
    const indL = new THREE.Mesh(indGeo, indMat);
    indL.position.set(-0.22, 0.82, 0.64);
    this.bikeGroup.add(indL);
    const indR = new THREE.Mesh(indGeo, indMat);
    indR.position.set(0.22, 0.82, 0.64);
    this.bikeGroup.add(indR);

    // ── I. COCKPIT, HANDLEBARS, RALLY TOWER & MIRRORS ──
    const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.86, 16);
    barGeo.rotateZ(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, this.materials.chromeExhaust);
    bar.position.set(0, 1.28, -0.68);
    this.bikeGroup.add(bar);

    // Barkbusters Handguards with White/Color Shields
    const handguardGeo = new THREE.BoxGeometry(0.12, 0.08, 0.025);
    const guardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.4 });
    const hgL = new THREE.Mesh(handguardGeo, guardMat);
    hgL.position.set(-0.38, 1.28, -0.72);
    this.bikeGroup.add(hgL);
    const hgR = new THREE.Mesh(handguardGeo, guardMat);
    hgR.position.set(0.38, 1.28, -0.72);
    this.bikeGroup.add(hgR);

    // Aerodynamic Rearview Mirrors
    const mirrorStemGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.16, 8);
    const mirrorHeadGeo = new THREE.BoxGeometry(0.09, 0.06, 0.02);
    const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.98, roughness: 0.04 });

    const mStemL = new THREE.Mesh(mirrorStemGeo, this.materials.secondaryFrame);
    mStemL.position.set(-0.4, 1.38, -0.66);
    mStemL.rotation.z = -0.35;
    this.bikeGroup.add(mStemL);

    const mHeadL = new THREE.Mesh(mirrorHeadGeo, mirrorGlassMat);
    mHeadL.position.set(-0.44, 1.46, -0.66);
    this.bikeGroup.add(mHeadL);

    const mStemR = new THREE.Mesh(mirrorStemGeo, this.materials.secondaryFrame);
    mStemR.position.set(0.4, 1.38, -0.66);
    mStemR.rotation.z = 0.35;
    this.bikeGroup.add(mStemR);

    const mHeadR = new THREE.Mesh(mirrorHeadGeo, mirrorGlassMat);
    mHeadR.position.set(0.44, 1.46, -0.66);
    this.bikeGroup.add(mHeadR);

    // Tall Tinted Adventure Windscreen
    const screenGeo = new THREE.BoxGeometry(0.34, 0.42, 0.02);
    const screenMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1
    });
    const windscreen = new THREE.Mesh(screenGeo, screenMat);
    windscreen.position.set(0, 1.48, -0.76);
    windscreen.rotation.x = -0.32;
    this.bikeGroup.add(windscreen);

    // Front Wheel (Visible beneath beak)
    this.frontWheelGroup = new THREE.Group();
    this.frontWheelGroup.position.set(0, 0.46, -1.35);
    const frontTire = new THREE.Mesh(tireGeo, this.materials.rubberTire);
    this.frontWheelGroup.add(frontTire);
    this.bikeGroup.add(this.frontWheelGroup);

    // Gold Inverted Front Suspension Forks
    const forkGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.78, 12);
    const forkL = new THREE.Mesh(forkGeo, goldAnodized);
    forkL.position.set(-0.16, 0.88, -1.05);
    forkL.rotation.x = -0.38;
    this.bikeGroup.add(forkL);

    const forkR = new THREE.Mesh(forkGeo, goldAnodized);
    forkR.position.set(0.16, 0.88, -1.05);
    forkR.rotation.x = -0.38;
    this.bikeGroup.add(forkR);

    // Footpegs with Rubber Traction Insert
    const pegGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8);
    pegGeo.rotateZ(Math.PI / 2);
    const pegL = new THREE.Mesh(pegGeo, this.materials.secondaryFrame);
    pegL.position.set(-0.25, 0.44, -0.06);
    this.bikeGroup.add(pegL);

    const pegR = new THREE.Mesh(pegGeo, this.materials.secondaryFrame);
    pegR.position.set(0.25, 0.44, -0.06);
    this.bikeGroup.add(pegR);
  }

  // ─────────────────────────────────────────────────────────────
  // 3D HUMAN RIDER PROCEDURAL MESH BUILDER
  // ─────────────────────────────────────────────────────────────
  public buildRider(riderConfig?: RiderConfig) {
    if (riderConfig) this.currentRider = riderConfig;
    const r = this.currentRider;

    // Clear previous children
    while (this.riderGroup.children.length > 0) {
      this.riderGroup.remove(this.riderGroup.children[0]);
    }

    // Material Definitions with Textures & Fabric Shading
    this.materials.helmetPaint = new THREE.MeshStandardMaterial({
      color: new THREE.Color(r.helmetColor),
      metalness: 0.65,
      roughness: 0.24,
      envMapIntensity: 1.4
    });

    this.materials.jacketFabric = new THREE.MeshStandardMaterial({
      color: new THREE.Color(r.jacketColor),
      roughness: 0.82,
      metalness: 0.12
    });

    this.materials.pantsFabric = new THREE.MeshStandardMaterial({
      color: new THREE.Color(r.pantsColor),
      roughness: 0.86,
      metalness: 0.08
    });

    this.materials.bootsLeather = new THREE.MeshStandardMaterial({
      color: new THREE.Color(r.bootsColor),
      roughness: 0.65,
      metalness: 0.22
    });

    const carbonArmorMat = new THREE.MeshStandardMaterial({
      map: this.carbonTex,
      metalness: 0.7,
      roughness: 0.3
    });

    const hiVizStripe = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.4,
      roughness: 0.4
    });

    // ── 1. PELVIS / WAIST (Seated firmly and anatomically on the rider saddle) ──
    const pelvisGeo = new THREE.BoxGeometry(0.28, 0.18, 0.26);
    const pelvis = new THREE.Mesh(pelvisGeo, this.materials.pantsFabric);
    pelvis.position.set(0, 0.98, -0.14);
    this.riderGroup.add(pelvis);

    // ── 2. TORSO / TEXTILE TOURING JACKET (Contoured human back leaning forward into the wind) ──
    const torsoGeo = new THREE.BoxGeometry(0.34, 0.42, 0.28);
    const torso = new THREE.Mesh(torsoGeo, this.materials.jacketFabric);
    torso.position.set(0, 1.25, -0.24);
    torso.rotation.x = 0.24; // Realistic adventure touring lean
    this.riderGroup.add(torso);

    // Articulated Spine Protector Armor Strip
    const spineGeo = new THREE.BoxGeometry(0.08, 0.38, 0.035);
    const spine = new THREE.Mesh(spineGeo, carbonArmorMat);
    spine.position.set(0, 1.26, -0.11);
    spine.rotation.x = 0.24;
    this.riderGroup.add(spine);

    // Hi-Viz Reflective Safety Stripes across shoulder blades
    const stripeGeo = new THREE.BoxGeometry(0.32, 0.03, 0.02);
    const stripe = new THREE.Mesh(stripeGeo, hiVizStripe);
    stripe.position.set(0, 1.36, -0.12);
    stripe.rotation.x = 0.24;
    this.riderGroup.add(stripe);

    // ── 3. SHOULDERS & ARMS (Articulated reaching down to handlebars) ──
    const armGeo = new THREE.CylinderGeometry(0.058, 0.052, 0.32, 12);
    const forearmGeo = new THREE.CylinderGeometry(0.052, 0.044, 0.33, 12);
    const shoulderArmorGeo = new THREE.SphereGeometry(0.075, 12, 12);
    const gloveGeo = new THREE.BoxGeometry(0.08, 0.07, 0.11);

    // Left Shoulder Armor Shell
    const shL = new THREE.Mesh(shoulderArmorGeo, carbonArmorMat);
    shL.position.set(-0.24, 1.42, -0.22);
    this.riderGroup.add(shL);

    // Left Upper Arm
    const armL = new THREE.Mesh(armGeo, this.materials.jacketFabric);
    armL.position.set(-0.26, 1.32, -0.34);
    armL.rotation.set(0.68, 0, 0.32);
    this.riderGroup.add(armL);

    // Left Forearm
    const foreL = new THREE.Mesh(forearmGeo, this.materials.jacketFabric);
    foreL.position.set(-0.32, 1.22, -0.52);
    foreL.rotation.set(0.96, 0, 0.18);
    this.riderGroup.add(foreL);

    // Left Glove on Handlebar Grip
    const gloveL = new THREE.Mesh(gloveGeo, carbonArmorMat);
    gloveL.position.set(-0.36, 1.27, -0.68);
    this.riderGroup.add(gloveL);

    // Right Shoulder Armor Shell
    const shR = new THREE.Mesh(shoulderArmorGeo, carbonArmorMat);
    shR.position.set(0.24, 1.42, -0.22);
    this.riderGroup.add(shR);

    // Right Upper Arm
    const armR = new THREE.Mesh(armGeo, this.materials.jacketFabric);
    armR.position.set(0.26, 1.32, -0.34);
    armR.rotation.set(0.68, 0, -0.32);
    this.riderGroup.add(armR);

    // Right Forearm
    const foreR = new THREE.Mesh(forearmGeo, this.materials.jacketFabric);
    foreR.position.set(0.32, 1.22, -0.52);
    foreR.rotation.set(0.96, 0, -0.18);
    this.riderGroup.add(foreR);

    // Right Glove on Handlebar Grip
    const gloveR = new THREE.Mesh(gloveGeo, carbonArmorMat);
    gloveR.position.set(0.36, 1.27, -0.68);
    this.riderGroup.add(gloveR);

    // ── 4. LEGS, KNEE ARMOR & ADVENTURE BOOTS (Firmly planted on footpegs) ──
    const thighGeo = new THREE.BoxGeometry(0.13, 0.15, 0.42);
    const calfGeo = new THREE.BoxGeometry(0.12, 0.35, 0.14);
    const kneeArmorGeo = new THREE.BoxGeometry(0.11, 0.12, 0.08);
    const bootGeo = new THREE.BoxGeometry(0.12, 0.16, 0.25);

    // Left Thigh
    const thighL = new THREE.Mesh(thighGeo, this.materials.pantsFabric);
    thighL.position.set(-0.17, 0.86, -0.26);
    thighL.rotation.set(-0.42, 0.1, 0.15);
    this.riderGroup.add(thighL);

    // Left Knee Armor
    const kneeL = new THREE.Mesh(kneeArmorGeo, carbonArmorMat);
    kneeL.position.set(-0.2, 0.78, -0.38);
    this.riderGroup.add(kneeL);

    // Left Calf
    const calfL = new THREE.Mesh(calfGeo, this.materials.pantsFabric);
    calfL.position.set(-0.23, 0.61, -0.16);
    calfL.rotation.set(0.48, 0, 0.05);
    this.riderGroup.add(calfL);

    // Left Enduro Boot planted on peg
    const bootL = new THREE.Mesh(bootGeo, this.materials.bootsLeather);
    bootL.position.set(-0.25, 0.46, -0.06);
    this.riderGroup.add(bootL);

    // Right Thigh
    const thighR = new THREE.Mesh(thighGeo, this.materials.pantsFabric);
    thighR.position.set(0.17, 0.86, -0.26);
    thighR.rotation.set(-0.42, -0.1, -0.15);
    this.riderGroup.add(thighR);

    // Right Knee Armor
    const kneeR = new THREE.Mesh(kneeArmorGeo, carbonArmorMat);
    kneeR.position.set(0.2, 0.78, -0.38);
    this.riderGroup.add(kneeR);

    // Right Calf
    const calfR = new THREE.Mesh(calfGeo, this.materials.pantsFabric);
    calfR.position.set(0.23, 0.61, -0.16);
    calfR.rotation.set(0.48, 0, -0.05);
    this.riderGroup.add(calfR);

    // Right Enduro Boot planted on peg
    const bootR = new THREE.Mesh(bootGeo, this.materials.bootsLeather);
    bootR.position.set(0.25, 0.46, -0.06);
    this.riderGroup.add(bootR);

    // ── 5. HEAD & DETAILED ADVENTURE HELMET ──
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.58, -0.28);

    // Contoured Full-Face Helmet Shell (Aerodynamic oval with rear diffuser)
    const helmetShellGeo = new THREE.SphereGeometry(0.155, 24, 20);
    const helmet = new THREE.Mesh(helmetShellGeo, this.materials.helmetPaint);
    headGroup.add(helmet);

    // Rear Aerodynamic Spoiler Wing
    const spoilerGeo = new THREE.BoxGeometry(0.14, 0.025, 0.07);
    const spoiler = new THREE.Mesh(spoilerGeo, carbonArmorMat);
    spoiler.position.set(0, 0.06, 0.12);
    spoiler.rotation.x = 0.35;
    headGroup.add(spoiler);

    // Signature Adventure Sun Peak Visor with Airflow Slots
    if (r.helmetStyle === 'peak' || r.helmetStyle === 'expedition') {
      const peakGeo = new THREE.BoxGeometry(0.18, 0.02, 0.18);
      const peak = new THREE.Mesh(peakGeo, this.materials.helmetPaint);
      peak.position.set(0, 0.13, -0.1);
      peak.rotation.x = -0.32;
      headGroup.add(peak);

      // Center air vent cutout on peak
      const ventGeo = new THREE.BoxGeometry(0.05, 0.024, 0.08);
      const vent = new THREE.Mesh(ventGeo, carbonArmorMat);
      vent.position.set(0, 0.132, -0.1);
      vent.rotation.x = -0.32;
      headGroup.add(vent);
    }

    // Glossy Tinted Face Shield Visor
    const visorGeo = new THREE.BoxGeometry(0.19, 0.08, 0.05);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x090d16,
      metalness: 0.95,
      roughness: 0.08,
      reflectivity: 0.9
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, -0.14);
    headGroup.add(visor);

    // Padded Neck Roll / Balaclava connecting to jacket collar
    const neckGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.1, 16);
    const neck = new THREE.Mesh(neckGeo, this.materials.jacketFabric);
    neck.position.set(0, -0.11, -0.01);
    headGroup.add(neck);

    this.riderGroup.add(headGroup);

    // ── 6. HYDRATION EXPEDITION BACKPACK ──
    if (r.hasBackpack) {
      const bpGeo = new THREE.BoxGeometry(0.26, 0.36, 0.13);
      const bpMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r.backpackColor || 0x0f172a),
        roughness: 0.85
      });
      const backpack = new THREE.Mesh(bpGeo, bpMat);
      backpack.position.set(0, 1.28, -0.05);
      backpack.rotation.x = 0.24;
      this.riderGroup.add(backpack);

      // Padded Shoulder Straps
      const strapGeo = new THREE.BoxGeometry(0.05, 0.38, 0.02);
      const strapL = new THREE.Mesh(strapGeo, this.materials.rubberTire);
      strapL.position.set(-0.14, 1.34, -0.18);
      strapL.rotation.set(0.35, 0, 0.15);
      this.riderGroup.add(strapL);

      const strapR = new THREE.Mesh(strapGeo, this.materials.rubberTire);
      strapR.position.set(0.14, 1.34, -0.18);
      strapR.rotation.set(0.35, 0, -0.15);
      this.riderGroup.add(strapR);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // LIVE COLOR UPDATER (100% Instant, Zero Lag)
  // ─────────────────────────────────────────────────────────────
  public updateColors(colors: Partial<BikeColors>) {
    if (colors.primary && this.materials.primaryPaint) {
      this.materials.primaryPaint.color.set(colors.primary);
    }
    if (colors.secondary && this.materials.secondaryFrame) {
      this.materials.secondaryFrame.color.set(colors.secondary);
    }
    if (colors.seat && this.materials.seatLeather) {
      this.materials.seatLeather.color.set(colors.seat);
    }
    if (colors.luggage && this.materials.luggageCase) {
      const newPannierTex = createPannierTexture(colors.luggage);
      this.materials.luggageCase.map = newPannierTex;
      this.materials.luggageCase.needsUpdate = true;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 60FPS PHYSICS & ANIMATION TICK
  // ─────────────────────────────────────────────────────────────
  public update(dt: number, speedMultiplier: number, isPlaying: boolean) {
    if (!isPlaying) return;

    const pace = speedMultiplier;

    // 1. Dual-Wheel Rotation
    this.wheelRotation += dt * 17 * pace;
    this.rearWheelGroup.rotation.x = this.wheelRotation;
    this.frontWheelGroup.rotation.x = this.wheelRotation;

    // 2. Suspension Compression & Road Micro-Vibration
    this.suspensionPhase += dt * 8.2 * pace;
    const roadBumps = Math.sin(this.suspensionPhase) * 0.007 + Math.sin(this.suspensionPhase * 2.1) * 0.0035;
    this.rootGroup.position.y = roadBumps;

    // 3. Chassis Natural Lateral Sway & Gentle Lean
    const sway = Math.sin(this.suspensionPhase * 0.22) * 0.03;
    this.rootGroup.rotation.z = sway;
    this.rootGroup.rotation.y = -sway * 0.35;

    // 4. Human Rider Breathing & Upper Body Rhythm
    this.breathingPhase += dt * 2.0;
    const breathing = Math.sin(this.breathingPhase) * 0.0035;
    this.riderGroup.position.y = breathing;
    this.riderGroup.rotation.x = Math.sin(this.suspensionPhase * 0.45) * 0.012;

    // 5. Ruby Taillight Pulsing Glow
    if (this.tailLightGlow) {
      this.tailLightGlow.intensity = 2.6 + Math.sin(this.suspensionPhase * 1.6) * 0.5;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER CALL
  // ─────────────────────────────────────────────────────────────
  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  // ─────────────────────────────────────────────────────────────
  // RESIZE HANDLER WITH RESPONSIVE ADAPTATION
  // ─────────────────────────────────────────────────────────────
  public handleResize(width: number, height: number) {
    this.updateCameraLayout(width, height);
    this.renderer.setSize(width, height, false);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
