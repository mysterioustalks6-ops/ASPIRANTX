import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, AlertCircle, Zap, Shield, Sparkles, BookOpen } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  onNavigate?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default_user' })
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm">Notifications & Reminders</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No new notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.actionUrl && onNavigate) {
                      onNavigate(n.actionUrl);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-4 transition-all hover:bg-slate-50 cursor-pointer ${
                    !n.read ? 'bg-indigo-50/50' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-900 text-xs line-clamp-1">{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{n.createdAt}</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
