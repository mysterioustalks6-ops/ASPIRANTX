import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Clock, 
  Check, 
  X, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Send,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  loadStudyReminderSettings, 
  saveStudyReminderSettings, 
  StudyReminderSettings,
  requestNotificationPermission,
  checkAndTriggerStudyReminder,
  getDailyStudySummary
} from '../lib/studyReminderService';

interface ReminderSettingsModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  selectedExam?: string;
  onNavigate?: (tab: string) => void;
}

const COMMON_TIME_PRESETS = [
  { label: '6:00 PM (Early Evening)', value: '18:00' },
  { label: '7:00 PM (Evening)', value: '19:00' },
  { label: '8:00 PM (Recommended)', value: '20:00' },
  { label: '9:00 PM (Night Revision)', value: '21:00' },
  { label: '10:00 PM (Late Night)', value: '22:00' },
];

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  user,
  isOpen,
  onClose,
  selectedExam,
  onNavigate,
}) => {
  const [settings, setSettings] = useState<StudyReminderSettings>(() =>
    loadStudyReminderSettings(user?.id)
  );
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadStudyReminderSettings(user?.id));
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
      setSavedSuccess(false);
      setTestSent(false);
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStudyReminderSettings(settings, user?.id);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus(granted ? 'granted' : 'denied');
    }
  };

  const handleSendTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      setPermissionStatus('granted');
    }

    const summary = getDailyStudySummary(user, selectedExam);
    let bodyText = '';
    if (settings.updateType === 'streak_only') {
      bodyText = `${summary.streakCopy}. Take a moment to continue your journey today.`;
    } else {
      const topicList = summary.pendingTopics.map((t) => t.title).join(', ');
      bodyText = topicList
        ? `${topicList} • ${summary.streakCopy}`
        : `${summary.pendingCount} topics left • ${summary.streakCopy}`;
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(summary.headlineCopy, {
          body: bodyText,
          icon: '/favicon.ico',
          tag: 'aspirantx-test-reminder',
        });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } catch (e) {
        console.warn('Test notification error:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto p-5 sm:p-6 space-y-6"
      >
        {/* Glow Top Highlight */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Daily Study Reminder
              </h2>
              <p className="text-xs text-slate-400">
                Evidence-based gentle nudge at your self-chosen time.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Reminders ON / OFF */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">Daily Study Reminders</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Maximum 1 gentle reminder per day. Automatically skipped if tasks are done.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              settings.enabled
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {settings.enabled ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enabled</span>
              </>
            ) : (
              <span>Off</span>
            )}
          </button>
        </div>

        {/* Reminder Time Selector */}
        {settings.enabled && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Preferred Reminder Time</span>
                </span>
                <span className="text-[11px] text-indigo-400 font-bold">
                  Self-Set (Recommended)
                </span>
              </label>

              {/* Time Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {COMMON_TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, reminderTime: preset.value }))}
                    className={`p-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                      settings.reminderTime === preset.value
                        ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Time Input */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs text-slate-400">Custom Time:</span>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => setSettings((s) => ({ ...s, reminderTime: e.target.value }))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Update Type Options */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                What would you like to see in your daily summary?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'both', label: 'Tasks & Streak' },
                  { id: 'tasks_only', label: 'Tasks Only' },
                  { id: 'streak_only', label: 'Streak Only' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        updateType: opt.id as 'both' | 'tasks_only' | 'streak_only',
                      }))
                    }
                    className={`p-2.5 rounded-xl text-xs font-medium text-center transition-all border ${
                      settings.updateType === opt.id
                        ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Permission Status */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Browser/Device Push Permission:</span>
              </div>

              {permissionStatus === 'granted' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Granted
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors"
                >
                  Enable Permissions
                </button>
              )}
            </div>
          </div>
        )}

        {/* Research Note Framing */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gentle Nudge Principle</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Our study reminders use calm, positive framing without alarmist language. You'll never receive more than one notification a day, and reminders stop automatically when today's tasks are done.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-3">
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testSent ? 'Sent!' : 'Preview Copy'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
