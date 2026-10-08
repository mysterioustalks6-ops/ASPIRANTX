import { BikeConfig, RiderConfig } from './types';

export interface DrawMotorcycleOptions {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  groundY: number;
  scale: number; // Scale factor so height is ~5-10% of screen
  time: number;
  speedMultiplier: number;
  isPlaying: boolean;
  bike: BikeConfig;
  rider: RiderConfig;
}

/**
 * Draws a high-fidelity 2D anime hand-illustrated adventure motorcycle & human rider
 * matching the exact art style of Reference 2 (Studio Ghibli / Makoto Shinkai aesthetic).
 *
 * Designed to be viewed from behind at realistic travel scale (5-10% of canvas height).
 */
export function drawIllustratedMotorcycleRider({
  ctx,
  centerX,
  groundY,
  scale,
  time,
  speedMultiplier,
  isPlaying,
  bike,
  rider
}: DrawMotorcycleOptions) {
  ctx.save();

  // Subtle physical travel dynamics
  const speed = isPlaying ? speedMultiplier : 0;
  const bounce = isPlaying ? Math.sin(time * 26 * speed) * (0.8 * scale) : 0;
  const sway = isPlaying ? Math.sin(time * 1.9 * speed) * (1.6 * scale) : 0;
  const lean = isPlaying ? Math.sin(time * 1.9 * speed) * 0.022 : 0;
  const breathing = isPlaying ? Math.sin(time * 2.2) * (0.5 * scale) : 0;

  ctx.translate(centerX + sway, groundY + bounce);
  ctx.rotate(lean);
  ctx.scale(scale, scale);

  // ─────────────────────────────────────────────────────────────
  // 1. ROAD DROP SHADOW (Soft oval cast to the left on asphalt)
  // ─────────────────────────────────────────────────────────────
  ctx.save();
  const shadowGrad = ctx.createRadialGradient(-10, -2, 4, -8, -2, 38);
  shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.65)');
  shadowGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.35)');
  shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(-12, -2, 34, 10, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 2. REAR TIRE & SWINGARM
  // ─────────────────────────────────────────────────────────────
  // Outer tire body
  ctx.fillStyle = '#181b20';
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-7, -26, 14, 26, [3, 3, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // Tread grooves / rolling texture
  ctx.fillStyle = '#0a0d12';
  const treadOffset = isPlaying ? ((time * 42 * speed) % 6) : 0;
  for (let ty = -24 + treadOffset; ty < -2; ty += 6) {
    ctx.fillRect(-6, ty, 12, 2.2);
  }

  // Inner rim / hub shadow
  ctx.fillStyle = '#2d333b';
  ctx.fillRect(-4, -20, 8, 14);

  // ─────────────────────────────────────────────────────────────
  // 3. EXHAUST SYSTEM (Model Specific)
  // ─────────────────────────────────────────────────────────────
  if (bike.id === 'scrambler') {
    // High twin scrambler shotgun pipes on right
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(10, -32, 6, 20, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(13, -34, 6, 18, 2);
    ctx.fill();
    ctx.stroke();
  } else if (bike.id === 'rally') {
    // High rally megaphone exhaust
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, -18);
    ctx.lineTo(15, -34);
    ctx.lineTo(19, -32);
    ctx.lineTo(10, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (bike.id !== 'dualsport') {
    // Standard touring right silencer
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(8, -24, 7, 18, 3);
    ctx.fill();
    ctx.stroke();
    // Chrome endcap
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(9, -26, 5, 3);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. LUGGAGE & SADDLEBAGS (Custom Colors & Styles)
  // ─────────────────────────────────────────────────────────────
  const luggageColor = bike.colors.luggage || '#1e242b';

  if (bike.hasPanniers && bike.id !== 'scrambler' && bike.id !== 'dualsport') {
    // Left Expedition Pannier
    ctx.save();
    ctx.fillStyle = luggageColor;
    ctx.strokeStyle = '#090a0d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-24, -42, 14, 22, [4, 4, 3, 3]);
    ctx.fill();
    ctx.stroke();

    // Corner bumper cap & latch
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-24, -42, 4, 5);
    ctx.fillRect(-14, -42, 4, 5);
    ctx.fillStyle = '#f59e0b'; // Amber safety reflector
    ctx.fillRect(-22, -26, 3, 3);
    ctx.restore();

    // Right Expedition Pannier
    ctx.save();
    ctx.fillStyle = luggageColor;
    ctx.strokeStyle = '#090a0d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(10, -42, 14, 22, [4, 4, 3, 3]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, -42, 4, 5);
    ctx.fillRect(20, -42, 4, 5);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(19, -26, 3, 3);
    ctx.restore();
  } else if (bike.id === 'scrambler') {
    // Single compact vintage leather roll on left
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#271105';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-19, -38, 9, 16, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Top Roll Duffel / Top Box
  if (bike.hasTopBox) {
    ctx.fillStyle = luggageColor;
    ctx.strokeStyle = '#090a0d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-12, -49, 24, 10, 4);
    ctx.fill();
    ctx.stroke();
    // Tie down strap lines
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7, -49, 2, 10);
    ctx.fillRect(5, -49, 2, 10);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. REAR FENDER, LICENSE PLATE & TAILLIGHT
  // ─────────────────────────────────────────────────────────────
  // Black mudguard
  ctx.fillStyle = '#1e242b';
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-7, -34, 14, 12, [2, 2, 1, 1]);
  ctx.fill();
  ctx.stroke();

  // White Japanese-style license plate
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.rect(-5, -27, 10, 7);
  ctx.fill();
  ctx.stroke();
  // Japanese characters / plate markings
  ctx.fillStyle = '#334155';
  ctx.fillRect(-3, -25, 2.5, 3);
  ctx.fillRect(0.5, -25, 2.5, 3);

  // Amber turn indicators
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-11, -31, 3, 3);
  ctx.fillRect(8, -31, 3, 3);

  // Glowing Ruby Red Taillight
  const glowIntensity = isPlaying ? 0.8 + Math.sin(time * 3) * 0.2 : 0.8;
  ctx.save();
  ctx.shadowColor = 'rgba(239, 68, 68, 0.85)';
  ctx.shadowBlur = 8 * glowIntensity;
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-6.5, -39, 13, 6, 2.5);
  ctx.fill();
  ctx.stroke();

  // Bright core highlight
  ctx.fillStyle = '#fecaca';
  ctx.fillRect(-3, -38, 6, 2);
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 6. RIDER SEATED ANATOMICALLY ON MOTORCYCLE
  // ─────────────────────────────────────────────────────────────
  const jacketColor = rider.jacketColor || '#373d47';
  const pantsColor = rider.pantsColor || '#232830';
  const helmetColor = rider.helmetColor || '#e2e8f0';

  // Riding Pants / Pelvis / Legs wrapping naturally around the seat
  ctx.fillStyle = pantsColor;
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 1.5;

  // Pelvis seated on saddle
  ctx.beginPath();
  ctx.roundRect(-10, -48, 20, 11, [4, 4, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // Left leg hugging side of bike
  ctx.beginPath();
  ctx.moveTo(-10, -46);
  ctx.lineTo(-14, -36);
  ctx.lineTo(-9, -29);
  ctx.lineTo(-6, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right leg hugging side of bike
  ctx.beginPath();
  ctx.moveTo(10, -46);
  ctx.lineTo(14, -36);
  ctx.lineTo(9, -29);
  ctx.lineTo(6, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Riding boots on footpegs
  ctx.fillStyle = rider.bootsColor || '#0f172a';
  ctx.fillRect(-12, -29, 5, 4);
  ctx.fillRect(7, -29, 5, 4);

  // ─────────────────────────────────────────────────────────────
  // 7. TOURING JACKET & ARMS (Leaning forward into the wind)
  // ─────────────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(0, -breathing);

  // Torso / Jacket
  ctx.fillStyle = jacketColor;
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 1.6;

  // Trapezoid human back silhouette
  ctx.beginPath();
  ctx.moveTo(-11, -48);
  ctx.lineTo(-13, -64);
  ctx.lineTo(-9, -68);
  ctx.lineTo(9, -68);
  ctx.lineTo(13, -64);
  ctx.lineTo(11, -48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spine ridge / jacket fold shading
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -66);
  ctx.lineTo(0, -50);
  ctx.stroke();

  // Left Arm (reaching naturally to left handlebar grip)
  ctx.fillStyle = jacketColor;
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-12, -64);
  ctx.lineTo(-19, -54);
  ctx.lineTo(-16, -50);
  ctx.lineTo(-9, -60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left Glove
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-19, -52, 4.5, 4.5);

  // Right Arm (reaching to right handlebar grip)
  ctx.fillStyle = jacketColor;
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(12, -64);
  ctx.lineTo(19, -54);
  ctx.lineTo(16, -50);
  ctx.lineTo(9, -60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Glove
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(15, -52, 4.5, 4.5);

  // Rearview Mirrors on handlebars
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-20, -54, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(20, -54, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Optional Hydration Backpack
  if (rider.hasBackpack) {
    ctx.fillStyle = rider.backpackColor || '#0f172a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-7, -64, 14, 15, [3, 3, 2, 2]);
    ctx.fill();
    ctx.stroke();
  }

  // ─────────────────────────────────────────────────────────────
  // 8. ADVENTURE HELMET & HEAD (Clean Anime Illustrated Linework)
  // ─────────────────────────────────────────────────────────────
  // Dark neck collar / balaclava
  ctx.fillStyle = '#1e242b';
  ctx.fillRect(-4.5, -71, 9, 4);

  // Full-face Helmet Shell
  ctx.fillStyle = helmetColor;
  ctx.strokeStyle = '#090a0d';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -78, 8.5, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cel-shading across helmet shell (sunlit highlight on right, shadow on left)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(-2, -78, 6.5, 8.5, 0, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(2.5, -80, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Adventure Sun Peak Visor (Signature adventure dual-sport look)
  if (rider.helmetStyle === 'peak' || rider.helmetStyle === 'expedition') {
    ctx.fillStyle = helmetColor;
    ctx.strokeStyle = '#090a0d';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-8, -84);
    ctx.lineTo(8, -84);
    ctx.lineTo(6, -87);
    ctx.lineTo(-6, -87);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore(); // Restore breathing offset

  ctx.restore(); // Restore translation/scale
}
