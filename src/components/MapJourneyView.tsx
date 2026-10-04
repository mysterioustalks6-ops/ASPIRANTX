import React, { useState } from 'react';
import { DuolingoPathEngine } from './duolingo/DuolingoPathEngine';
import { SyllabusTracker } from './SyllabusTracker';
import { UserProfile, ActiveTab } from '../types';
import { Map, BookOpen } from 'lucide-react';

interface MapJourneyViewProps {
  user: UserProfile;
  selectedExam: string;
  isAdmin: boolean;
  featureFlagsMap: any;
  onNavigate: (tab: ActiveTab) => void;
  onExamChange: (newExam: string) => void;
  onOpenPremium: () => void;
  onRequireLogin: () => void;
}

export const MapJourneyView: React.FC<MapJourneyViewProps> = ({
  user,
  selectedExam,
  isAdmin,
  featureFlagsMap,
  onNavigate,
  onExamChange,
  onOpenPremium,
  onRequireLogin,
}) => {
  const [viewMode, setViewMode] = useState<'path' | 'checklist'>('path');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Segmented Mode Switcher */}
      <div className="flex items-center justify-center px-4 pt-1">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] max-w-xs w-full shadow-sm">
          <button
            onClick={() => setViewMode('path')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'path'
                ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] shadow-sm'
                : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map Journey</span>
          </button>
          <button
            onClick={() => setViewMode('checklist')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'checklist'
                ? 'bg-[var(--sr-blue)] text-white shadow-sm'
                : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guidebook</span>
          </button>
        </div>
      </div>

      {viewMode === 'path' ? (
        <DuolingoPathEngine
          userProfile={user}
          selectedExam={selectedExam}
          onExamChange={onExamChange}
          onNavigate={(tab) => {
            if (tab === 'syllabus_list' || tab === 'syllabus') {
              setViewMode('checklist');
            } else {
              onNavigate(tab);
            }
          }}
        />
      ) : (
        <SyllabusTracker
          exam={selectedExam as any}
          userId={user.id}
          isGuest={user.isGuest}
          isUserPremium={user.isPremium || isAdmin}
          featureFlags={featureFlagsMap}
          onOpenPremium={onOpenPremium}
          onRequireLogin={onRequireLogin}
        />
      )}
    </div>
  );
};
