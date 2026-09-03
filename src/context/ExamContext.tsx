import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { EXAM_LIST, ExamOption } from '../lib/examList';
import { ExamConfig, getExamConfig, normalizeExamId } from '../lib/examRegistry';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { syncAuthoritativeWallpaperToNative } from '../lib/nativeWallpaperBridge';

export interface ExamFeatureFlags {
  cbt: boolean;
  pyq: boolean;
  questionBank: boolean;
  syllabus: boolean;
  studyPlan: boolean;
  pomodoro: boolean;
  weaknessDetector: boolean;
  flashcards: boolean;
  analytics: boolean;
  leaderboard: boolean;
}

export interface ExamContextValue {
  selectedExamId: string;
  examConfig: ExamConfig;
  examOption: ExamOption;
  featureFlags: ExamFeatureFlags;
  setSelectedExamId: (examId: string, options?: { persist?: boolean; syncUser?: boolean; userId?: string }) => Promise<void>;
  availableExams: ExamOption[];
  isLoadingExam: boolean;
  examError: string | null;
}

const STORAGE_KEY = 'aspirantx_global_selected_exam';

const DEFAULT_FEATURE_FLAGS: ExamFeatureFlags = {
  cbt: true,
  pyq: true,
  questionBank: true,
  syllabus: true,
  studyPlan: true,
  pomodoro: true,
  weaknessDetector: true,
  flashcards: true,
  analytics: true,
  leaderboard: true,
};

const ExamContext = createContext<ExamContextValue | undefined>(undefined);

interface ExamProviderProps {
  children: ReactNode;
  initialExamId?: string;
  userId?: string;
}

export const ExamProvider: React.FC<ExamProviderProps> = ({ children, initialExamId, userId }) => {
  // Resolve initial exam with strict priority:
  // 1. Explicit initialExamId passed from authenticated profile
  // 2. localStorage 'aspirantx_global_selected_exam'
  // 3. Fallback to 'UPSC_CSE'
  const [selectedExamId, setSelectedExamIdState] = useState<string>(() => {
    if (initialExamId) {
      return normalizeExamId(initialExamId);
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return normalizeExamId(stored);
      }
    } catch (e) {}
    return 'UPSC_CSE';
  });

  const [isLoadingExam, setIsLoadingExam] = useState<boolean>(false);
  const [examError, setExamError] = useState<string | null>(null);

  // Available Exams List (Built-in + User Custom Exams)
  const availableExams = useMemo<ExamOption[]>(() => {
    try {
      const custom = getCustomExamsFromStorage();
      const customOptions: ExamOption[] = custom.map((c) => ({
        id: c.id,
        label: c.label || c.id,
      }));
      // Merge unique by ID
      const map = new Map<string, ExamOption>();
      EXAM_LIST.forEach((e) => map.set(e.id, e));
      customOptions.forEach((c) => map.set(c.id, c));
      return Array.from(map.values());
    } catch (e) {
      return EXAM_LIST;
    }
  }, [selectedExamId]);

  // Derive authoritative ExamConfig
  const examConfig = useMemo<ExamConfig>(() => {
    return getExamConfig(selectedExamId);
  }, [selectedExamId]);

  // Derive authoritative ExamOption label
  const examOption = useMemo<ExamOption>(() => {
    const found = availableExams.find((e) => e.id === selectedExamId);
    if (found) return found;
    return {
      id: selectedExamId,
      label: examConfig.displayName || selectedExamId.replace(/_/g, ' '),
    };
  }, [selectedExamId, availableExams, examConfig]);

  // Derive feature flags
  const featureFlags = useMemo<ExamFeatureFlags>(() => {
    return DEFAULT_FEATURE_FLAGS;
  }, [selectedExamId]);

  // Synchronize when initialExamId prop updates (e.g. auth finishes loading)
  useEffect(() => {
    if (initialExamId) {
      const norm = normalizeExamId(initialExamId);
      if (norm !== selectedExamId) {
        setSelectedExamIdState(norm);
        try {
          localStorage.setItem(STORAGE_KEY, norm);
        } catch (e) {}
      }
    }
  }, [initialExamId]);

  // Authoritative Exam Switcher
  const setSelectedExamId = useCallback(
    async (rawExamId: string, options?: { persist?: boolean; syncUser?: boolean; userId?: string }) => {
      const persist = options?.persist ?? true;
      const syncUser = options?.syncUser ?? true;
      const targetUserId = options?.userId || userId;

      const normId = normalizeExamId(rawExamId);
      if (normId === selectedExamId) return;

      const prevExamId = selectedExamId;
      setIsLoadingExam(true);
      setExamError(null);

      try {
        // 1. Update State
        setSelectedExamIdState(normId);

        // 2. Persist to localStorage
        if (persist) {
          localStorage.setItem(STORAGE_KEY, normId);
        }

        // 3. Update fast cached profile if available
        if (targetUserId) {
          try {
            const cacheKey = `aspirantx_profile_cache_${targetUserId}`;
            const rawProfile = localStorage.getItem(cacheKey);
            if (rawProfile) {
              const parsed = JSON.parse(rawProfile);
              parsed.targetExam = normId;
              parsed.updatedAt = new Date().toISOString();
              localStorage.setItem(cacheKey, JSON.stringify(parsed));
            }
          } catch (e) {}
        }

        // 4. Dispatch Global Exam Changed Event across all decoupled components
        window.dispatchEvent(
          new CustomEvent('aspirantx_exam_changed', {
            detail: {
              examId: normId,
              prevExamId,
              userId: targetUserId,
              timestamp: Date.now(),
            },
          })
        );

        // 4b. Synchronize native Android live wallpaper without network calls
        syncAuthoritativeWallpaperToNative(targetUserId, normId).catch(() => {});

        // 5. Asynchronously notify backend server
        if (syncUser && targetUserId && targetUserId !== 'guest') {
          try {
            const authToken = localStorage.getItem('aspirantx_auth_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

            fetch('/api/user/set-exam', {
              method: 'POST',
              headers,
              body: JSON.stringify({ userId: targetUserId, examId: normId }),
            }).catch(() => {});
          } catch (netErr) {}
        }
      } catch (err: any) {
        console.error('Error changing exam:', err);
        setExamError(err.message || 'Failed to change exam');
      } finally {
        setIsLoadingExam(false);
      }
    },
    [selectedExamId, userId]
  );

  const contextValue = useMemo<ExamContextValue>(
    () => ({
      selectedExamId,
      examConfig,
      examOption,
      featureFlags,
      setSelectedExamId,
      availableExams,
      isLoadingExam,
      examError,
    }),
    [selectedExamId, examConfig, examOption, featureFlags, setSelectedExamId, availableExams, isLoadingExam, examError]
  );

  return <ExamContext.Provider value={contextValue}>{children}</ExamContext.Provider>;
};

export const useExam = (): ExamContextValue => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};
