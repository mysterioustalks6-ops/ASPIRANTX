import React, { useState } from 'react';
import { 
  Trophy, Wrench, ArrowLeft, Sparkles, CheckCircle2, Lock, Car, Bike, Play, BarChart2, X, ChevronRight, Target
} from 'lucide-react';
import { DerivedBikeState, CompletedBikeRecord, getBikeState, loadUserBikePreferences, saveUserBikePreferences } from '../../../lib/focus/bikeEngine';
import { DEFAULT_BIKE_CONFIG } from '../../../lib/focus/bikeConfig';
import { loadSessions } from '../../../lib/focus/sessionStore';
import { CompositeBikeCanvas, BikeSlotId } from './CompositeBikeCanvas';
import { TactileButton } from '../../../design-system/TactileButton';
import { VeerMascot } from '../../../design-system/VeerMascot';

export interface GarageScreenProps {
  userId?: string;
  bikeState?: DerivedBikeState;
  onNavigateToTimer?: () => void;
  onNavigateToMyRides?: () => void;
  onNavigateToAssetCheck?: () => void;
  onStartRide?: () => void;
  onBack?: () => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  userId = 'guest',
  bikeState: providedBikeState,
  onNavigateToTimer,
  onNavigateToMyRides,
  onNavigateToAssetCheck,
  onStartRide,
  onBack
}) => {
  const [userPrefs, setUserPrefs] = useState(() => loadUserBikePreferences(userId));
  const bikeState = providedBikeState || getBikeState(
    loadSessions(userId),
    DEFAULT_BIKE_CONFIG,
    new Date(),
    userPrefs
  );

  const handleStartRide = onStartRide || onNavigateToTimer || (() => {});
  const [selectedBike, setSelectedBike] = useState<CompletedBikeRecord | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  const hasBikes = bikeState.completedBikes.length > 0;
  const isTierFullyAssembled = bikeState.progressPercent >= 100;
  const unlockedSlotIds = bikeState.unlockedParts.map(p => p.id);

  // Suggested target formula: 20.8h
  const suggestedTargetHours = 20.8;
  const hasUserSetTarget = typeof userPrefs.weeklyTargetHours === 'number' && userPrefs.weeklyTargetHours > 0;

  const handleApplySuggestedTarget = () => {
    const updated = { ...userPrefs, weeklyTargetHours: suggestedTargetHours };
    saveUserBikePreferences(userId, updated);
    setUserPrefs(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28 px-3 sm:px-4 text-[var(--sr-text)] select-none">
      {/* ── 1. TOP HEADER (ONE-LINE TITLE "GARAGE", BUTTONS WRAP UNDER IF NEEDED) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to dashboard"
              className="p-2.5 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] text-slate-300 border border-[var(--sr-line)] transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Garage
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onNavigateToMyRides && (
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={onNavigateToMyRides}
              icon={<BarChart2 className="w-4 h-4 text-[var(--sr-blue)]" />}
            >
              My rides
            </TactileButton>
          )}
          <TactileButton
            variant="primary"
            size="sm"
            onClick={handleStartRide}
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            Start ride
          </TactileButton>
        </div>
      </div>

      {/* ── 2. RIDER FOCUS COACH CARD (VEER MASCOT) ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] shadow-md flex items-center gap-3.5">
        <div className="shrink-0 relative">
          <VeerMascot 
            state={isTierFullyAssembled ? 'cheering' : 'idle'} 
            size="sm" 
            showClickTip={false} 
            showSpeechBubble={false} 
          />
          {/* Friendly Wrench in Veer's wing */}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[var(--sr-surface-3)] border border-[var(--sr-line-strong)] text-slate-300 shadow-sm">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--sr-amber)] animate-pulse" />
            <span className="text-xs font-bold text-[var(--sr-amber)]">
              Rider focus coach
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-200 mt-1 leading-snug">
            {isTierFullyAssembled
              ? `Machine fully forged! Hit celebrate to park your Cruiser in the permanent garage collection!`
              : hasBikes
              ? `You have forged ${bikeState.completedBikes.length} machine${bikeState.completedBikes.length > 1 ? 's' : ''}. Complete 100% of your weekly target to forge the ${bikeState.currentTier.name}!`
              : `Your garage bay is open. Complete 100% of your weekly target to forge the ${bikeState.currentTier.name} into the permanent collection.`}
          </p>
        </div>

        {isTierFullyAssembled && (
          <TactileButton
            variant="primary"
            size="sm"
            onClick={() => setShowCelebrationModal(true)}
            icon={<Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />}
          >
            Celebrate
          </TactileButton>
        )}
      </div>

      {/* ── 3. TIER PROGRESS DIAL CARD (CIRCULAR RING + SPECS) ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] shadow-md flex items-center gap-4 sm:gap-6">
        {/* Left Circular Ring Dial */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="var(--sr-surface-3)"
              strokeWidth="8"
              fill="none"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="var(--sr-blue)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * Math.min(100, bikeState.progressPercent)) / 100}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-bold text-white">
              {bikeState.progressPercent}%
            </span>
            <span className="text-[10px] font-bold text-[var(--sr-blue)]">
              {bikeState.unlockedParts.length}/{bikeState.currentTier.parts.length} parts
            </span>
          </div>
        </div>

        {/* Right Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg bg-[var(--sr-surface-2)] border border-[var(--sr-line)] text-[10px] font-bold text-[var(--sr-amber)] whitespace-nowrap">
              Tier {bikeState.currentTier.tierNumber} / 4
            </span>
            <span className="text-xs text-[var(--sr-text-subtle)] font-bold">
              Current weekly build
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-bold text-white truncate">
            {bikeState.currentTier.name}
          </h2>
          <p className="text-xs text-[var(--sr-text-subtle)] font-medium mt-1 leading-relaxed">
            {[bikeState.currentTier.subtitle, bikeState.currentTier.engineDisplacement].filter(Boolean).join(' • ')}
          </p>
        </div>
      </div>

      {/* ── 4. WORKSHOP BAY SHOWCASE (MOTORCYCLE ART + 8 PART BADGES) ── */}
      <CompositeBikeCanvas
        unlockedSlotIds={unlockedSlotIds}
        tierNumber={bikeState.currentTier.tierNumber}
        progressPercent={bikeState.progressPercent}
        isRunning={false}
        isPaused={false}
      />

      {/* ── 5. WEEKLY TARGET CARD (EMPTY BY DEFAULT UNTIL "USE SUGGESTED") ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--sr-primary)]" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Weekly target: {hasUserSetTarget ? `${userPrefs.weeklyTargetHours}h` : 'Empty (Unset)'}
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] text-xs font-bold">
            {hasUserSetTarget ? `${bikeState.progressPercent}% target` : 'Target unset'}
          </span>
        </div>

        {/* Target Progress Bar */}
        <div className="w-full h-3.5 bg-[var(--sr-surface-3)] rounded-full overflow-hidden p-0.5 border border-[var(--sr-line)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--sr-blue)] to-[var(--sr-primary)] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, hasUserSetTarget ? bikeState.progressPercent : 0)}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
          <span className="text-xs text-[var(--sr-text-subtle)] font-medium">
            {hasUserSetTarget 
              ? `${bikeState.weeklyCountedHours}h studied of ${userPrefs.weeklyTargetHours}h goal`
              : 'Set a weekly target to calculate part unlock milestones.'}
          </span>

          {!hasUserSetTarget && (
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={handleApplySuggestedTarget}
              icon={<Target className="w-3.5 h-3.5 text-emerald-400" />}
            >
              Use suggested (20.8h)
            </TactileButton>
          )}
        </div>
      </div>

      {/* ── 6. 12-WEEK SEASON STRIP ── */}
      <div className="p-4 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--sr-text-subtle)]">
          <span className="flex items-center gap-1.5 text-[var(--sr-blue)]">
            12-Week season progression
          </span>
          <span className="text-[11px] font-bold text-[var(--sr-text-muted)]">
            Week {bikeState.currentWeekNumber} of 12
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((weekNum) => {
            const isCurrent = weekNum === bikeState.currentWeekNumber;
            const isCompleted = weekNum < bikeState.currentWeekNumber || 
              bikeState.completedBikes.some(b => b.weekNumber === weekNum);
            const isFinale = weekNum === 12;

            return (
              <div
                key={weekNum}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 text-center transition-all ${
                  isCurrent
                    ? 'bg-[var(--sr-blue-subtle)] border-[var(--sr-blue)] text-white shadow-sm ring-1 ring-[var(--sr-blue)]'
                    : isCompleted
                    ? 'bg-[var(--sr-primary-subtle)] border-[var(--sr-primary)] text-[var(--sr-primary)]'
                    : 'bg-[var(--sr-surface-2)]/60 border-[var(--sr-line)] text-slate-500 opacity-60'
                }`}
              >
                <span className="text-[10px] font-bold">
                  W{weekNum}
                </span>
                <div className="mt-1">
                  {isFinale ? (
                    <Car className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--sr-primary)]" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--sr-blue)] animate-pulse" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 7. COMPLETED COLLECTION (HONEST EMPTY STATE) ── */}
      <div className="space-y-3 pt-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Completed collection ({bikeState.completedBikes.length})
        </h3>

        {!hasBikes ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] mx-auto flex items-center justify-center text-slate-400">
              <Bike className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h4 className="text-base font-bold text-white">
                No completed bikes yet
              </h4>
              <p className="text-xs text-[var(--sr-text-subtle)] leading-relaxed">
                Your garage is ready for its first machine. Complete your weekly focus target to forge and park your Cruiser here!
              </p>
            </div>
            <div>
              <TactileButton
                variant="primary"
                size="md"
                onClick={handleStartRide}
                icon={<Play className="w-4 h-4 fill-current" />}
              >
                Start your first ride
              </TactileButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {bikeState.completedBikes.map((bike, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedBike(bike)}
                className="p-4 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] hover:border-amber-400/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] text-[10px] font-bold">
                    Week {bike.weekNumber}
                  </span>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {bike.name}
                  </h4>
                  <p className="text-xs text-[var(--sr-text-subtle)]">
                    {[bike.totalHours ? `${bike.totalHours}h logged` : '', bike.partsUnlockedCount ? `${bike.partsUnlockedCount} parts installed` : ''].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 8. CELEBRATION MODAL ── */}
      {showCelebrationModal && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowCelebrationModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-[var(--sr-surface)] border-2 border-amber-400 p-6 space-y-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400">
              <Sparkles className="w-10 h-10 fill-current" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Cruiser 150 assembled!
            </h3>
            <p className="text-xs text-[var(--sr-text-muted)] leading-relaxed">
              Incredible focus dedication! All 8 parts forged and tuned. Your Highway Cruiser is ready for the open road.
            </p>
            <TactileButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setShowCelebrationModal(false)}
            >
              Claim to collection
            </TactileButton>
          </div>
        </div>
      )}
    </div>
  );
};
