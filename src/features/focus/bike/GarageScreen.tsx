import React, { useState } from 'react';
import { 
  Trophy, Wrench, ChevronRight, ArrowLeft, Sparkles, AlertCircle, 
  CheckCircle2, Clock, Calendar, Lock, Car, Bike, Play, BarChart2, X
} from 'lucide-react';
import { DerivedBikeState, CompletedBikeRecord, getBikeState, loadUserBikePreferences } from '../../../lib/focus/bikeEngine';
import { VehicleTierConfig, DEFAULT_BIKE_CONFIG } from '../../../lib/focus/bikeConfig';
import { loadSessions } from '../../../lib/focus/sessionStore';
import { CompositeBikeCanvas, BikeSlotId } from './CompositeBikeCanvas';
import { RiderAssetSlot } from './RiderAssetSlot';
import { TactileButton } from '../../../design-system/TactileButton';

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
  const bikeState = providedBikeState || getBikeState(
    loadSessions(userId),
    DEFAULT_BIKE_CONFIG,
    new Date(),
    loadUserBikePreferences(userId)
  );
  const handleStartRide = onStartRide || onNavigateToTimer || (() => {});
  const [selectedBike, setSelectedBike] = useState<CompletedBikeRecord | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [activeSlotDetail, setActiveSlotDetail] = useState<string | null>(null);

  const hasBikes = bikeState.completedBikes.length > 0;
  const isTierFullyAssembled = bikeState.progressPercent >= 100;
  const unlockedSlotIds = bikeState.unlockedParts.map(p => p.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 px-3 sm:px-4 text-slate-100 select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to dashboard"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-amber-400" />
              Highway Garage & Collection
            </h1>
            <p className="text-xs text-slate-400">
              Season {bikeState.seasonNumber} • Week {bikeState.currentWeekNumber} of 12 • Real focus builds real speed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {import.meta.env.DEV && onNavigateToAssetCheck && (
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={onNavigateToAssetCheck}
              icon={<Wrench className="w-4 h-4 text-amber-400" />}
            >
              Assets (DEV)
            </TactileButton>
          )}
          {onNavigateToMyRides && (
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={onNavigateToMyRides}
              icon={<BarChart2 className="w-4 h-4 text-indigo-400" />}
            >
              My Rides
            </TactileButton>
          )}
          <TactileButton
            variant="primary"
            size="sm"
            onClick={handleStartRide}
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            Ride Timer
          </TactileButton>
        </div>
      </div>

      {/* ── 12-WEEK SEASON STRIP ── */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Calendar className="w-4 h-4" />
            12-Week Season Progression
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Week {bikeState.currentWeekNumber} of 12
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((weekNum) => {
            const isCurrent = weekNum === bikeState.currentWeekNumber;
            const isCompleted = weekNum < bikeState.currentWeekNumber || 
              bikeState.completedBikes.some(b => b.weekNumber === weekNum);
            const isLocked = weekNum > bikeState.currentWeekNumber;
            const isFinale = weekNum === 12;

            return (
              <div
                key={weekNum}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-indigo-600/30 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60'
                }`}
              >
                <span className="text-[10px] font-mono font-black">
                  W{weekNum}
                </span>
                <div className="mt-1">
                  {isFinale ? (
                    <Car className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIDER COACH NUDGE (ONE SPEAKER: RIDER) ── */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Wrench className="w-6 h-6 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Rider Focus Coach
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <p className="text-xs font-bold text-slate-200 mt-0.5 leading-snug">
            {isTierFullyAssembled
              ? `Machine fully forged! Hit the celebrate button below to admire your Tier ${bikeState.currentTier.tierNumber} build in full glory.`
              : hasBikes
              ? `You have forged ${bikeState.completedBikes.length} machine${bikeState.completedBikes.length > 1 ? 's' : ''} in the garage. Currently assembling: ${bikeState.currentTier.name}.`
              : `Your garage bay is open. Complete 100% of your weekly target to forge the ${bikeState.currentTier.name} into the permanent collection!`}
          </p>
        </div>
        {isTierFullyAssembled && (
          <TactileButton
            variant="secondary"
            size="sm"
            onClick={() => setShowCelebrationModal(true)}
            icon={<Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />}
          >
            Celebrate
          </TactileButton>
        )}
      </div>

      {/* ── CURRENT ACTIVE VEHICLE IN WORKSHOP BAY ── */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-indigo-500/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                Currently On The Assembly Line
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Tier {bikeState.currentTier.tierNumber} / 4
              </span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">
              {bikeState.currentTier.name}
            </h2>
            <p className="text-xs text-slate-400">
              {bikeState.currentTier.subtitle} • {bikeState.currentTier.engineDisplacement}
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-indigo-400">
              {bikeState.progressPercent}%
            </span>
            <p className="text-[10px] font-bold text-slate-400">
              {bikeState.unlockedParts.length} / {bikeState.currentTier.parts.length} Parts
            </p>
          </div>
        </div>

        {/* ── COMPOSITE 8-LAYER BIKE CANVAS ── */}
        <CompositeBikeCanvas
          unlockedSlotIds={unlockedSlotIds}
          tierNumber={bikeState.currentTier.tierNumber}
          isRunning={false}
          isPaused={false}
          onSlotClick={(slotId) => setActiveSlotDetail(slotId)}
        />

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, bikeState.progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>Weekly Target: {bikeState.weeklyTargetHours ? `${bikeState.weeklyTargetHours}h` : 'Unset'}</span>
            <span>Completed: {bikeState.weeklyCountedHours}h</span>
          </div>
        </div>

        {/* Parts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {bikeState.currentTier.parts.map((part) => {
            const isUnlocked = bikeState.unlockedParts.some(p => p.id === part.id);
            return (
              <div
                key={part.id}
                onClick={() => setActiveSlotDetail(part.id)}
                className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  isUnlocked
                    ? 'bg-slate-800/80 border-emerald-500/50 shadow-sm hover:border-emerald-400'
                    : 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-black">
                  <span className={isUnlocked ? 'text-emerald-400' : 'text-slate-400'}>
                    {part.unlockPercent}% Target
                  </span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                </div>
                <div className="my-2">
                  <p className="text-xs font-bold text-slate-200 leading-tight">
                    {part.name}
                  </p>
                  <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                    {part.description}
                  </p>
                </div>
                <span className={`text-[8px] font-mono uppercase font-bold ${
                  isUnlocked ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {isUnlocked ? 'INSTALLED' : 'LOCKED'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GARAGE COMPLETED COLLECTION (OR HONEST EMPTY STATE) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Completed Collection ({bikeState.completedBikes.length})
          </h3>
          <span className="text-xs text-slate-400">
            Season Goal: Complete 12 weeks to unlock the Car
          </span>
        </div>

        {!hasBikes ? (
          /* ── HONEST EMPTY STATE WITH ONE CTA ── */
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500 shadow-inner">
              <Bike className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h4 className="text-base font-black text-white">
                No Completed Bikes Yet
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your garage is ready for its first machine. Meet your weekly focus target to forge and park your first bike here!
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
          /* ── COMPLETED BIKES GRID ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bikeState.completedBikes.map((bike, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedBike(bike)}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
                    Week {bike.weekNumber}
                  </span>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                    {bike.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {bike.totalHours}h logged • {bike.partsUnlockedCount} parts installed
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span>Completed: {bike.completedAt}</span>
                  <span className="text-amber-400 font-bold group-hover:underline">Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FUTURE LOCKED TIERS (SILHOUETTES) ── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Future Tier Roadmaps (Locked Silhouettes)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bikeState.allTiers.map((tier) => {
            const isCurrent = tier.id === bikeState.currentTier.id;
            const isFinished = bikeState.completedBikes.some(b => b.tierId === tier.id);

            return (
              <div
                key={tier.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-900 border-indigo-500/60'
                    : isFinished
                    ? 'bg-slate-900/80 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                  <span className="text-slate-400">Tier {tier.tierNumber}</span>
                  {tier.type === 'car' ? (
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Bike className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <h5 className="text-xs font-bold text-slate-200 truncate">
                  {tier.name}
                </h5>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {isFinished ? 'Completed in Garage' : isCurrent ? 'Active in Progress' : 'Locked Season Reward'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── WEEKLY TIER-UPGRADE CELEBRATION MODAL ── */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-amber-500/50 p-6 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400 shadow-lg">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Tier Upgrade Celebration
              </span>
              <h3 className="text-xl font-black text-white">
                {bikeState.currentTier.name} Complete!
              </h3>
              <p className="text-xs text-slate-300">
                All 8 assembly slots forged through relentless focus hours.
              </p>
            </div>

            {/* Rider Celebrate Slot */}
            <div className="flex items-center justify-center py-2">
              <RiderAssetSlot
                pose="rider_celebrate"
                className="w-44 h-44 mx-auto"
              />
            </div>

            {/* Single Speaker Quote */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left">
              <span className="text-[10px] font-black uppercase text-amber-400">
                Rider Coach
              </span>
              <p className="text-xs text-slate-200 mt-1 italic font-medium">
                "Well rode, partner. This machine is permanently tuned and parked in your garage. Onward to the next milestone!"
              </p>
            </div>

            <TactileButton
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setShowCelebrationModal(false)}
            >
              Keep Riding
            </TactileButton>
          </div>
        </div>
      )}
    </div>
  );
};
