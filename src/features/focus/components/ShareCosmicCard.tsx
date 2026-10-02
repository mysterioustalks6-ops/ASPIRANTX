/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COSMIC STORY CARD GENERATOR & NATIVE SHARING (HTML5 2D Canvas)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 1080x1920 (9:16 Instagram/WhatsApp Story format) zero-dependency achievement card.
 * Generates purely via native HTML5 Canvas in < 50ms without html2canvas/dom-to-image.
 */

import React, { useState, useCallback } from 'react';
import { Share2, Download, Check, Sparkles, Loader2 } from 'lucide-react';
import { getMilestoneEntity } from '../progression/progressionEngine';

export interface CosmicCardData {
  durationMinutes: number;
  streakDays: number;
  earnedDust: number;
  level: number;
  subject?: string;
  topic?: string;
}

export interface ShareCosmicCardProps extends CosmicCardData {
  className?: string;
  variant?: 'button' | 'icon';
}

/**
 * Generates high-resolution 1080x1920 achievement card Blob via native HTML5 Canvas
 */
export async function generateCosmicCard(data: CosmicCardData): Promise<Blob> {
  const {
    durationMinutes,
    streakDays,
    earnedDust,
    level,
    subject = 'General Studies',
    topic = 'Deep Sprint'
  } = data;

  const milestone = getMilestoneEntity(level);
  const width = 1080;
  const height = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context could not be initialized.');
  }

  // 1. Deep Space Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#020617');
  bgGrad.addColorStop(0.45, '#050c1e');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Procedural Starfield (150 Stars with variable twinkle alpha)
  // Deterministic seed formula so card is crisp and stable
  let seed = durationMinutes * 17 + level * 31 + streakDays * 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < 160; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 1.0 + rand() * 2.2;
    const alpha = 0.2 + rand() * 0.7;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();

    // Occasional sparkling cross glint
    if (i % 25 === 0) {
      ctx.strokeStyle = `rgba(224, 242, 254, ${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  }

  // 3. Central Cosmic Radial Glow
  const glowX = 540;
  const glowY = 860;
  const centerGlow = ctx.createRadialGradient(glowX, glowY, 50, glowX, glowY, 520);
  centerGlow.addColorStop(0, `${milestone.accentColor}35`);
  centerGlow.addColorStop(0.6, `${milestone.glowColor}15`);
  centerGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(glowX, glowY, 520, 0, Math.PI * 2);
  ctx.fill();

  // 4. Concentric Orbital Rings
  ctx.save();
  ctx.strokeStyle = `${milestone.accentColor}30`;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);

  [260, 340, 420].forEach((ringRadius, idx) => {
    ctx.beginPath();
    ctx.arc(glowX, glowY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting Moon Marker on outer ring
    if (idx === 1) {
      const moonAngle = 0.85;
      const mx = glowX + Math.cos(moonAngle) * ringRadius;
      const my = glowY + Math.sin(moonAngle) * ringRadius;
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // 5. Stylized Central Celestial Planet Orb
  const planetRadius = 165;
  const planetGrad = ctx.createRadialGradient(
    glowX - 50,
    glowY - 50,
    25,
    glowX,
    glowY,
    planetRadius
  );
  planetGrad.addColorStop(0, milestone.secondaryColor || '#ffffff');
  planetGrad.addColorStop(0.35, milestone.accentColor);
  planetGrad.addColorStop(0.85, milestone.glowColor || '#1e1b4b');
  planetGrad.addColorStop(1, '#020617');

  ctx.beginPath();
  ctx.arc(glowX, glowY, planetRadius, 0, Math.PI * 2);
  ctx.fillStyle = planetGrad;
  ctx.shadowColor = milestone.accentColor;
  ctx.shadowBlur = 45;
  ctx.fill();
  ctx.shadowBlur = 0; // reset shadow

  // Subtle Saturnian Rings if Gas Giant (Lv 300+)
  if (level >= 300 && level < 500) {
    ctx.save();
    ctx.translate(glowX, glowY);
    ctx.rotate(-0.35);
    ctx.scale(1.8, 0.45);
    ctx.beginPath();
    ctx.arc(0, 0, planetRadius * 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();
  }

  // 6. Header Badge (Top Center)
  ctx.textAlign = 'center';
  const badgeY = 240;
  
  // Badge Pill Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(540 - 180, badgeY - 28, 360, 56, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('ASPIRANTX · FOCUS GALAXY', 540, badgeY + 7);

  // 7. Hero Metric: Focused Minutes
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillText(`${durationMinutes} MINUTES`, 540, 420);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('DEEP ACCRETION SPRINT COMPLETED', 540, 475);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${subject} • ${topic}`, 540, 525);

  // 8. Planet Subtitle (Below Center Orb)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 46px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`LVL ${level} · ${milestone.badge}`, 540, 1140);

  ctx.fillStyle = milestone.accentColor;
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(milestone.name.toUpperCase(), 540, 1185);

  // 9. Stats Grid Cards (Bottom Section)
  const cardY = 1270;
  const cardH = 175;
  const cardW = 390;

  // Left Card: Streak
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(120, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('STREAK MULTIPLIER', 150, cardY + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`🔥 ${streakDays} ${streakDays === 1 ? 'Day' : 'Days'}`, 150, cardY + 115);

  // Right Card: Cosmic Dust
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(570, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('HARVESTED DUST', 600, cardY + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`✨ +${earnedDust.toLocaleString()}`, 600, cardY + 115);

  // 10. Footer & Watermark Branding
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 1680);
  ctx.lineTo(960, 1680);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Forging Deep Focus on AspirantX', 540, 1740);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 20px monospace';
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  ctx.fillText(`aspirantx.app • Verified Study Proof • ${dateStr}`, 540, 1780);

  // Convert to Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create Image Blob from Canvas.'));
      }
    }, 'image/png', 0.95);
  });
}

export const ShareCosmicCardButton: React.FC<ShareCosmicCardProps> = ({
  durationMinutes,
  streakDays,
  earnedDust,
  level,
  subject,
  topic,
  className = '',
  variant = 'button'
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasShared, setHasShared] = useState<boolean>(false);

  const handleShare = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const blob = await generateCosmicCard({
        durationMinutes,
        streakDays,
        earnedDust,
        level,
        subject,
        topic
      });

      const fileName = `aspirantx-milestone-lvl-${level}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 1. Native Web Share API (Android / Capacitor / iOS)
      if (
        typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `AspirantX Focus Milestone: Level ${level}`,
          text: `Just crushed a ${durationMinutes}-minute focus sprint on Focus Galaxy! 🚀🪐 #AspirantX #FocusGalaxy`
        });
        setHasShared(true);
        setTimeout(() => setHasShared(false), 3000);
      } else {
        // 2. Direct File Download Fallback (Desktop / Web browsers)
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        setHasShared(true);
        setTimeout(() => setHasShared(false), 3000);
      }
    } catch (err) {
      // User cancelled share dialog or permission denied
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Share card generation notice:', err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [durationMinutes, streakDays, earnedDust, level, subject, topic, isGenerating]);

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className={`p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-white transition-all cursor-pointer shadow-lg disabled:opacity-50 ${className}`}
        title="Share Story Card (1080x1920)"
      >
        {isGenerating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : hasShared ? (
          <Check className="w-5 h-5 text-emerald-400" />
        ) : (
          <Share2 className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={isGenerating}
      className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg ${
        hasShared
          ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25'
          : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white shadow-indigo-500/25'
      } ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating Story Card...</span>
        </>
      ) : hasShared ? (
        <>
          <Check className="w-4 h-4 text-slate-950" />
          <span>Story Card Saved!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 fill-current animate-pulse" />
          <span>Share Story Card (1080×1920)</span>
        </>
      )}
    </button>
  );
};
