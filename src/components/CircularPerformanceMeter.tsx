import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, Award, Zap, ShieldCheck } from 'lucide-react';

interface CircularRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  gradientId: string;
  gradientColors: [string, string];
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  valueLabel?: string;
}

export const CircularRingMeter: React.FC<CircularRingProps> = ({
  progress,
  size = 140,
  strokeWidth = 10,
  gradientId,
  gradientColors,
  title,
  subtitle,
  icon,
  valueLabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl group hover:border-indigo-500/30 transition-all duration-300 shadow-lg shadow-black/40">
      {/* Background radial glow */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${gradientColors[0]}, transparent 70%)` }}
      />

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
          </defs>

          {/* Background Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-800/80"
          />

          {/* Animated Glowing Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 6px ${gradientColors[0]}80)`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-slate-400 mb-0.5">{icon}</div>
          <span className="text-xl font-extrabold text-slate-100 tracking-tight">
            {valueLabel || `${Math.round(clampedProgress)}%`}
          </span>
        </div>
      </div>

      <div className="text-center mt-3">
        <h4 className="text-xs font-bold text-slate-200 tracking-wide">{title}</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
};

interface CircularPerformanceHubProps {
  syllabusPercent: number;
  revisionPercent: number;
  testAccuracyPercent: number;
  dailyStudyMinutes: number;
  dailyTargetMinutes?: number;
}

export const CircularPerformanceHub: React.FC<CircularPerformanceHubProps> = ({
  syllabusPercent,
  revisionPercent,
  testAccuracyPercent,
  dailyStudyMinutes,
  dailyTargetMinutes = 600, // 10 hrs
}) => {
  const dailyPacePercent = Math.min(100, Math.round((dailyStudyMinutes / dailyTargetMinutes) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Performance Telemetry Rings</h3>
            <p className="text-[11px] text-slate-400">Holistic multi-dimensional readiness metrics</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Live
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <CircularRingMeter
          progress={syllabusPercent}
          gradientId="grad-syllabus"
          gradientColors={['#6366f1', '#a855f7']}
          title="Syllabus Mastery"
          subtitle="Core curriculum"
          icon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
        />

        <CircularRingMeter
          progress={revisionPercent}
          gradientId="grad-revision"
          gradientColors={['#06b6d4', '#3b82f6']}
          title="Revision Retention"
          subtitle="Memory recall cycle"
          icon={<TrendingUp className="w-3.5 h-3.5 text-cyan-400" />}
        />

        <CircularRingMeter
          progress={testAccuracyPercent}
          gradientId="grad-accuracy"
          gradientColors={['#f59e0b', '#ec4899']}
          title="Mock Accuracy"
          subtitle="Negative mark safety"
          icon={<Award className="w-3.5 h-3.5 text-amber-400" />}
        />

        <CircularRingMeter
          progress={dailyPacePercent}
          gradientId="grad-daily"
          gradientColors={['#10b981', '#14b8a6']}
          title="Today's Study Quota"
          subtitle={`${(dailyStudyMinutes / 60).toFixed(1)} / ${(dailyTargetMinutes / 60).toFixed(0)} hrs`}
          icon={<Zap className="w-3.5 h-3.5 text-emerald-400" />}
        />
      </div>
    </div>
  );
};
