import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Sparkles, Calendar, Clock, BookOpen, Layers, Info } from 'lucide-react';
import { loadStudySessions, getISTDateString } from '../../../lib/gamification';

export interface ConstellationMapProps {
  sessions?: any[];
  userId?: string;
  className?: string;
  onSelectSession?: (session: any) => void;
}

interface StarNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  subject: string;
  topic: string;
  durationMinutes: number;
  dateKey: string;
  color: string;
  raw: any;
}

const SUBJECT_COLORS = [
  '#38bdf8', // Sky
  '#a855f7', // Purple
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f43f5e', // Rose
  '#818cf8', // Indigo
  '#2dd4bf'  // Teal
];

export const ConstellationMap: React.FC<ConstellationMapProps> = ({
  sessions: propSessions,
  userId = 'guest',
  className = '',
  onSelectSession
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSessions, setInternalSessions] = useState<any[]>([]);
  const [selectedStar, setSelectedStar] = useState<StarNode | null>(null);
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Load sessions if not supplied via props
  useEffect(() => {
    if (propSessions && Array.isArray(propSessions)) {
      setInternalSessions(propSessions);
    } else {
      loadStudySessions(userId).then(loaded => {
        if (Array.isArray(loaded)) setInternalSessions(loaded);
      });
    }
  }, [propSessions, userId]);

  // Filter sessions to last 30 days
  const recentSessions = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    return internalSessions.filter(s => {
      const d = s.createdAt ? new Date(s.createdAt).getTime() : now;
      return d >= thirtyDaysAgo;
    });
  }, [internalSessions]);

  // Compute Constellation Clusters and Star Coordinates
  const { stars, constellationLines, subjectGroups } = useMemo(() => {
    const list = recentSessions;
    if (list.length === 0) {
      return { stars: [], constellationLines: [], subjectGroups: [] };
    }

    // Group by subject
    const groups: Record<string, any[]> = {};
    list.forEach(s => {
      const subj = (s.subject || 'General Study').split('—')[0].trim();
      if (!groups[subj]) groups[subj] = [];
      groups[subj].push(s);
    });

    const subjectKeys = Object.keys(groups);
    const starList: StarNode[] = [];
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    const sGroups: { subject: string; color: string; count: number; totalMinutes: number; centerX: number; centerY: number }[] = [];

    const totalSubjects = Math.max(1, subjectKeys.length);

    subjectKeys.forEach((subj, sIdx) => {
      const sColor = SUBJECT_COLORS[sIdx % SUBJECT_COLORS.length];
      const items = groups[subj];
      let totalMins = 0;

      // Position constellation cluster center radially
      const angle = (sIdx / totalSubjects) * Math.PI * 2;
      const centerDist = 0.28 + (sIdx % 2 === 0 ? 0.08 : -0.05);
      const cX = 0.5 + Math.cos(angle) * centerDist;
      const cY = 0.5 + Math.sin(angle) * (centerDist * 0.75);

      const clusterStars: StarNode[] = [];

      items.forEach((item, itemIdx) => {
        const mins = Number(item.minutes) || Math.round((Number(item.completedDuration || item.durationSeconds || 0)) / 60) || 15;
        totalMins += mins;

        // Individual star offset within constellation
        const subAngle = (itemIdx / Math.max(1, items.length)) * Math.PI * 2 + (sIdx * 0.5);
        const radiusOffset = 0.04 + ((itemIdx * 0.02) % 0.09);
        const x = Math.min(0.92, Math.max(0.08, cX + Math.cos(subAngle) * radiusOffset));
        const y = Math.min(0.90, Math.max(0.10, cY + Math.sin(subAngle) * (radiusOffset * 0.8)));

        const star: StarNode = {
          id: item.id || `star_${sIdx}_${itemIdx}`,
          x,
          y,
          radius: Math.min(7, Math.max(3, Math.sqrt(mins) * 0.85)),
          subject: subj,
          topic: item.topic || 'Deep Study Interval',
          durationMinutes: mins,
          dateKey: item.date || (item.createdAt ? getISTDateString(new Date(item.createdAt)) : 'Recent'),
          color: sColor,
          raw: item
        };

        clusterStars.push(star);
        starList.push(star);
      });

      // Connect stars sequentially to form constellation lines
      for (let i = 0; i < clusterStars.length - 1; i++) {
        lines.push({
          x1: clusterStars[i].x,
          y1: clusterStars[i].y,
          x2: clusterStars[i + 1].x,
          y2: clusterStars[i + 1].y,
          color: sColor
        });
      }

      sGroups.push({
        subject: subj,
        color: sColor,
        count: items.length,
        totalMinutes: totalMins,
        centerX: cX,
        centerY: cY
      });
    });

    return { stars: starList, constellationLines: lines, subjectGroups: sGroups };
  }, [recentSessions]);

  // Canvas Render Loop (Zero WebGL overhead, Pure HTML5 2D Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = container.clientWidth || 600);
    let height = (canvas.height = container.clientHeight || 450);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth || 600;
      height = canvas.height = container.clientHeight || 450;
    };

    window.addEventListener('resize', handleResize);

    // Background ambient twinkling stars
    const bgStars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 90; i++) {
      bgStars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.02 + 0.008
      });
    }

    let time = 0;

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);
      time += 0.02;

      ctx.clearRect(0, 0, width, height);

      // Deep Space Gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.5, 20,
        width * 0.5, height * 0.5, width * 0.7
      );
      bgGrad.addColorStop(0, '#060914');
      bgGrad.addColorStop(1, '#020307');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Twinkling Background Stars
      bgStars.forEach(bs => {
        const pulse = Math.sin(time * bs.speed * 8 + bs.x * 20);
        const currentAlpha = Math.max(0.1, bs.alpha + pulse * 0.2);
        ctx.fillStyle = `rgba(224, 231, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(bs.x * width, bs.y * height, bs.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Constellation Connecting Lines
      constellationLines.forEach(l => {
        const x1 = l.x1 * width;
        const y1 = l.y1 * height;
        const x2 = l.x2 * width;
        const y2 = l.y2 * height;

        ctx.strokeStyle = l.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      });

      // 3. Draw Subject Constellation Names
      subjectGroups.forEach(sg => {
        const sX = sg.centerX * width;
        const sY = sg.centerY * height - 32;

        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = sg.color;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.85;
        ctx.fillText(sg.subject.toUpperCase(), sX, sY);

        ctx.font = '9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${sg.count} sessions • ${sg.totalMinutes}m`, sX, sY + 12);
        ctx.globalAlpha = 1.0;
      });

      // 4. Draw Study Session Stars
      stars.forEach(st => {
        const sX = st.x * width;
        const sY = st.y * height;
        const isHovered = hoveredStar?.id === st.id;
        const isSelected = selectedStar?.id === st.id;

        // Outer Glow
        const glowRad = isHovered || isSelected ? st.radius * 3.5 : st.radius * 2.2;
        const glow = ctx.createRadialGradient(sX, sY, 0, sX, sY, glowRad);
        glow.addColorStop(0, st.color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sX, sY, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Core Star
        ctx.fillStyle = isHovered || isSelected ? '#ffffff' : st.color;
        ctx.beginPath();
        ctx.arc(sX, sY, isHovered || isSelected ? st.radius + 1.5 : st.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle cross flare on hovered or long sessions (>45m)
        if (st.durationMinutes >= 45 || isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.moveTo(sX - 9, sY);
          ctx.lineTo(sX + 9, sY);
          ctx.moveTo(sX, sY - 9);
          ctx.lineTo(sX, sY + 9);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      });
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [stars, constellationLines, subjectGroups, hoveredStar, selectedStar]);

  // Pointer Interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const hit = stars.find(st => {
      const dx = (st.x - px) * rect.width;
      const dy = (st.y - py) * rect.height;
      return Math.hypot(dx, dy) <= st.radius + 12;
    });

    setHoveredStar(hit || null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (hoveredStar) {
      setSelectedStar(hoveredStar);
      if (onSelectSession) onSelectSession(hoveredStar.raw);
    } else {
      setSelectedStar(null);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[380px] rounded-3xl overflow-hidden border border-slate-800 bg-[#020307] select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Header Info Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-sky-400 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Celestial Study History (Last 30 Days)</span>
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[10px] font-mono text-slate-400 backdrop-blur-md">
          {stars.length} Stars
        </span>
      </div>

      {/* Empty State Overlay */}
      {stars.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none bg-slate-950/60 backdrop-blur-xs">
          <Sparkles className="w-10 h-10 text-sky-400/50 mb-3 animate-pulse" />
          <h4 className="text-sm font-bold text-white">No Constellations Formed Yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Complete a Pomodoro focus sprint or log continuous study minutes to ignite glowing celestial stars in your 30-day sky map.
          </p>
        </div>
      )}

      {/* Selected / Hovered Star Tooltip Card */}
      {(hoveredStar || selectedStar) && (
        <div className="absolute bottom-4 left-4 right-4 z-20 sm:left-auto sm:right-4 sm:w-80 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-left space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                color: (hoveredStar || selectedStar)!.color,
                borderColor: `${(hoveredStar || selectedStar)!.color}40`,
                backgroundColor: `${(hoveredStar || selectedStar)!.color}15`
              }}
            >
              {(hoveredStar || selectedStar)!.subject}
            </span>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{(hoveredStar || selectedStar)!.durationMinutes} mins</span>
            </span>
          </div>

          <p className="text-xs font-bold text-white truncate">
            {(hoveredStar || selectedStar)!.topic}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>{(hoveredStar || selectedStar)!.dateKey}</span>
            </span>
            <span className="text-sky-400 font-bold">+{(hoveredStar || selectedStar)!.durationMinutes * 10} Dust</span>
          </div>
        </div>
      )}
    </div>
  );
};
