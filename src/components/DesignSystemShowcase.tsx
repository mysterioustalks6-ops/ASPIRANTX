import React, { useState } from 'react';
import { TactileButton } from '../design-system/TactileButton';
import { ProgressBar } from '../design-system/ProgressBar';
import { ProgressRing } from '../design-system/ProgressRing';
import { StreakFlame } from '../design-system/StreakFlame';
import { XPPill, CoinPill } from '../design-system/GamificationPills';
import { VeerMascot, VeerState } from '../design-system/VeerMascot';
import { MasteryCell } from '../design-system/MasteryCell';
import { CelebrationOverlay } from '../design-system/CelebrationOverlay';
import { ContrastReport } from '../design-system/ContrastReport';
import { Sun, Moon, Sparkles, CheckCircle2, Play, Flame, Zap } from 'lucide-react';

export const DesignSystemShowcase: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'night'>('light');
  const [veerState, setVeerState] = useState<VeerState>('idle');
  const [showCelebration, setShowCelebration] = useState(false);
  const [progressVal, setProgressVal] = useState(65);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'night') => {
    setTheme(newTheme);
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-night', 'dark', 'night');
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark', 'theme-dark');
    } else if (newTheme === 'night') {
      document.documentElement.classList.add('night', 'theme-night');
    } else {
      document.documentElement.classList.add('theme-light');
    }
  };

  return (
    <div className={`min-h-screen bg-[var(--sr-bg)] text-[var(--sr-text)] p-4 sm:p-8 transition-colors duration-200 theme-${theme}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header & Theme Switcher */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--sr-primary)]" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                StudyRide Design System
              </h1>
            </div>
            <p className="text-xs text-[var(--sr-text-muted)] mt-1 font-medium">
              Direction A: "Calm Highway" • Tactile physical depth, zero blur, WCAG AA verified
            </p>
          </div>

          {/* Theme Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)]">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-[var(--sr-surface)] text-[var(--sr-text)] shadow-sm'
                  : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[var(--sr-surface)] text-[var(--sr-text)] shadow-sm'
                  : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => handleThemeChange('night')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === 'night'
                  ? 'bg-[var(--sr-surface)] text-[var(--sr-text)] shadow-sm'
                  : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Night (OLED)</span>
            </button>
          </div>
        </header>

        {/* 1. Veer Mascot Personality Showcase */}
        <section className="p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-tight">1. Veer Companion Mascot</h2>
              <p className="text-xs text-[var(--sr-text-muted)]">
                Original scholar companion with 5 emotional states and Hinglish speech bubbles
              </p>
            </div>
            {/* State selector buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(['idle', 'cheering', 'thinking', 'worried', 'sleeping'] as VeerState[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setVeerState(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    veerState === st
                      ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)]'
                      : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-4 border-t border-[var(--sr-line)]">
            <VeerMascot state={veerState} size="lg" />
            <div className="max-w-xs space-y-2 text-center sm:text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] text-xs font-black uppercase">
                Active State: {veerState}
              </span>
              <p className="text-xs text-[var(--sr-text-muted)] leading-relaxed">
                Veer student ko har step par motivate karta hai bina nag kiye. Tap karne par next dialogue aur sound effect play hota hai.
              </p>
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => setShowCelebration(true)}
              >
                Trigger Ride Celebration 🎉
              </TactileButton>
            </div>
          </div>
        </section>

        {/* 2. Tactile Buttons (Physical Depth Engine) */}
        <section className="p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4">
          <div>
            <h2 className="text-base font-black tracking-tight">2. Tactile Buttons (48dp Touch Targets)</h2>
            <p className="text-xs text-[var(--sr-text-muted)]">
              Solid bottom-depth compression on click, zero blurred neon glows, accessible AA contrast
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <TactileButton variant="primary" size="md" icon={<Play className="w-4 h-4 fill-current" />}>
              Start Aaj ki Ride
            </TactileButton>

            <TactileButton variant="blue" size="md">
              Explore PYQ Archive
            </TactileButton>

            <TactileButton variant="purple" size="md">
              All-India CBT Mock
            </TactileButton>

            <TactileButton variant="secondary" size="md">
              Secondary Action
            </TactileButton>

            <TactileButton variant="danger" size="md">
              Exit Timed Exam
            </TactileButton>

            <TactileButton variant="ghost" size="md">
              Ghost / Tertiary
            </TactileButton>
          </div>
        </section>

        {/* 3. Progress Meters & Gamification Pills */}
        <section className="p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4">
          <div>
            <h2 className="text-base font-black tracking-tight">3. Progress & Gamification Indicators</h2>
            <p className="text-xs text-[var(--sr-text-muted)]">
              Chunky solid progress bars, precision rings, and tactile counters
            </p>
          </div>

          {/* Gamification Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <StreakFlame days={14} size="md" />
            <XPPill xp={480} />
            <CoinPill coins={1250} />
          </div>

          {/* Chunky Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Syllabus Coverage</span>
              <span>{progressVal}% (~62% Marks Weight)</span>
            </div>
            <ProgressBar progress={progressVal} height="md" color="primary" />
          </div>

          {/* Progress Ring & Accents */}
          <div className="flex items-center justify-around gap-4 pt-4 border-t border-[var(--sr-line)]">
            <div className="flex flex-col items-center">
              <ProgressRing progress={88} label="88%" subLabel="Accuracy" color="var(--sr-primary)" />
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing progress={65} label="38d" subLabel="Days Left" color="var(--sr-blue)" />
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing progress={92} label="Pace" subLabel="On Track" color="var(--sr-purple)" />
            </div>
          </div>
        </section>

        {/* 4. Territory Map Mastery Cells */}
        <section className="p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4">
          <div>
            <h2 className="text-base font-black tracking-tight">4. Territory Map Mastery Freshness</h2>
            <p className="text-xs text-[var(--sr-text-muted)]">
              Topic cells visibly reflect revision decay (fading) to prevent memory decay
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MasteryCell
              title="Modern Physics & Photoelectric Effect"
              weightPercent={8}
              freshness="strong"
            />
            <MasteryCell
              title="Chemical Thermodynamics & Gibbs Energy"
              weightPercent={6}
              freshness="fading"
              daysSinceRevision={14}
            />
            <MasteryCell
              title="Electromagnetic Induction & AC Circuits"
              weightPercent={7}
              freshness="learning"
            />
            <MasteryCell
              title="Human Physiology & Endocrine System"
              weightPercent={10}
              freshness="new"
            />
          </div>
        </section>

        {/* 5. Live WCAG AA/AAA Programmatic Contrast Audit */}
        <section>
          <ContrastReport />
        </section>
      </div>

      {/* Celebration Modal */}
      <CelebrationOverlay
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};
