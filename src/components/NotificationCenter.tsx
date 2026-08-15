import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  Clock, 
  AlertCircle, 
  Zap, 
  Shield, 
  Sparkles, 
  BookOpen, 
  Megaphone, 
  X, 
  Flame, 
  Calendar 
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  onNavigate?: (tab: string) => void;
  selectedExam?: string;
  userId?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  onNavigate, 
  selectedExam,
  userId = 'default_user' 
}) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeExam = selectedExam || localStorage.getItem('aspirantx_global_selected_exam') || 'NEET_UG';

  // Load dismissed announcement IDs from localStorage
  const getDismissedAnnouncementIds = (): string[] => {
    try {
      const stored = localStorage.getItem('dismissed_announcements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const fetchAllNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const dismissedIds = getDismissedAnnouncementIds();

      // Parallel fetch: regular notifications and announcements
      const [notifsRes, annsRes] = await Promise.allSettled([
        fetch('/api/notifications', { cache: 'no-store' }).then((r) => r.json()),
        fetch(`/api/announcements?exam=${encodeURIComponent(activeExam)}`, { cache: 'no-store' }).then((r) => r.json()),
      ]);

      const mergedList: AppNotification[] = [];

      // 1. Process regular user notifications
      if (notifsRes.status === 'fulfilled' && notifsRes.value?.success && Array.isArray(notifsRes.value?.notifications)) {
        notifsRes.value.notifications.forEach((n: any) => {
          mergedList.push({
            id: String(n.id || `notif_${Math.random()}`),
            userId: n.userId || userId,
            title: n.title || 'Notification',
            message: n.message || '',
            type: n.type || 'system',
            read: Boolean(n.read),
            createdAt: n.createdAt || new Date().toISOString(),
            actionUrl: n.actionUrl,
            isAnnouncement: false,
          });
        });
      }

      // 2. Process admin exam announcements
      if (annsRes.status === 'fulfilled' && annsRes.value?.success && Array.isArray(annsRes.value?.announcements)) {
        annsRes.value.announcements.forEach((ann: any) => {
          const isDismissed = dismissedIds.includes(ann.id);
          mergedList.push({
            id: String(ann.id),
            userId: userId,
            title: ann.title || 'Platform Announcement',
            message: ann.message || '',
            type: 'announcement',
            read: isDismissed,
            createdAt: ann.createdAt || new Date().toISOString(),
            priority: ann.priority === 'urgent' ? 'urgent' : 'normal',
            examTags: Array.isArray(ann.examTags) ? ann.examTags : [],
            isAnnouncement: true,
          });
        });
      }

      // Sort: unread urgent announcements first, then descending by createdAt timestamp
      mergedList.sort((a, b) => {
        if (a.isAnnouncement && a.priority === 'urgent' && !a.read && (!b.isAnnouncement || b.priority !== 'urgent' || b.read)) {
          return -1;
        }
        if (b.isAnnouncement && b.priority === 'urgent' && !b.read && (!a.isAnnouncement || a.priority !== 'urgent' || a.read)) {
          return 1;
        }
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });

      setItems(mergedList);
    } catch (err) {
      console.warn('Failed to load notifications/announcements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeExam, userId]);

  // Initial load and periodic refresh (every 60s)
  useEffect(() => {
    fetchAllNotifications();
    const interval = setInterval(fetchAllNotifications, 60000);

    const handleAnnouncementsUpdate = () => fetchAllNotifications();
    const handleNotificationsUpdate = () => fetchAllNotifications();

    window.addEventListener('aspirantx_announcements_updated', handleAnnouncementsUpdate);
    window.addEventListener('aspirantx_notifications_updated', handleNotificationsUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('aspirantx_announcements_updated', handleAnnouncementsUpdate);
      window.removeEventListener('aspirantx_notifications_updated', handleNotificationsUpdate);
    };
  }, [fetchAllNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAllRead = async () => {
    try {
      // 1. Mark server notifications as read
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});

      // 2. Dismiss all announcement items in localStorage
      const announcementIds = items.filter((i) => i.isAnnouncement).map((i) => i.id);
      if (announcementIds.length > 0) {
        const existing = getDismissedAnnouncementIds();
        const merged = Array.from(new Set([...existing, ...announcementIds]));
        localStorage.setItem('dismissed_announcements', JSON.stringify(merged));
      }

      // 3. Update local state
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDismissSingleAnnouncement = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const existing = getDismissedAnnouncementIds();
    if (!existing.includes(id)) {
      const updated = [...existing, id];
      localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const unreadCount = items.filter((n) => !n.read).length;
  const hasUrgentUnread = items.some((n) => n.isAnnouncement && n.priority === 'urgent' && !n.read);

  const getNotificationIcon = (item: AppNotification) => {
    if (item.isAnnouncement) {
      if (item.priority === 'urgent') {
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      }
      return <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />;
    }

    switch (item.type) {
      case 'exam_countdown':
        return <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'revision':
      case 'study_reminder':
        return <Clock className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'goal':
        return <Flame className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'mock_test':
        return <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'ai_suggestion':
        return <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'pyq_alert':
        return <Zap className="w-4 h-4 text-yellow-400 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all ${
          isOpen
            ? 'bg-slate-800 text-indigo-400 border-indigo-500/40'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
        }`}
        title="Notifications & Announcements"
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 ${hasUrgentUnread ? 'text-rose-400 animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-lg ${
              hasUrgentUnread
                ? 'bg-rose-600 ring-2 ring-rose-950 animate-pulse'
                : 'bg-indigo-600 ring-2 ring-slate-950'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[520px] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                  Notification Center
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Announcements & Daily Reminders</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-800/40 transition-colors"
                title="Mark all notifications and announcements as read"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Body List */}
          <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1 overscroll-contain">
            {items.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-300">No notifications yet</div>
                <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto">
                  Exam countdowns, revision reminders, and platform announcements will appear here.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.actionUrl && onNavigate) {
                      onNavigate(item.actionUrl);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 transition-all text-left group relative ${
                    item.actionUrl ? 'cursor-pointer hover:bg-slate-800/60' : 'hover:bg-slate-800/40'
                  } ${
                    !item.read
                      ? item.isAnnouncement && item.priority === 'urgent'
                        ? 'bg-rose-950/20 border-l-2 border-l-rose-500'
                        : item.isAnnouncement
                        ? 'bg-amber-950/15 border-l-2 border-l-amber-500'
                        : 'bg-indigo-950/25 border-l-2 border-l-indigo-500'
                      : 'bg-transparent border-l-2 border-l-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getNotificationIcon(item)}</div>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Badge / Header info */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isAnnouncement && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                item.priority === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {item.priority === 'urgent' ? '🚨 Urgent Announcement' : '📢 Announcement'}
                            </span>
                          )}

                          {item.examTags && item.examTags.length > 0 && (
                            <span className="text-[9px] text-slate-400 font-medium bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {item.examTags.join(', ')}
                            </span>
                          )}

                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 font-medium shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs font-bold leading-snug ${
                          item.priority === 'urgent'
                            ? 'text-rose-200'
                            : item.isAnnouncement
                            ? 'text-amber-200'
                            : 'text-slate-100'
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Message Content */}
                      <p className="text-[11px] text-slate-300 leading-relaxed font-normal whitespace-pre-line break-words">
                        {item.message}
                      </p>

                      {/* Action CTA indicator if actionUrl exists */}
                      {item.actionUrl && (
                        <div className="pt-1 text-[10px] font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                          <span>View in platform →</span>
                        </div>
                      )}
                    </div>

                    {/* Single announcement dismiss button */}
                    {item.isAnnouncement && !item.read && (
                      <button
                        onClick={(e) => handleDismissSingleAnnouncement(e, item.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
                        title="Dismiss announcement"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Status */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 px-4">
            <span className="truncate">
              Target: <span className="font-semibold text-indigo-300">{activeExam}</span>
            </span>
            <span className="text-slate-500">Auto-synced</span>
          </div>
        </div>
      )}
    </div>
  );
};
