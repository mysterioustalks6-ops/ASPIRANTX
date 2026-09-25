import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Check, CheckCheck, Smartphone, Shield, Filter, Clock } from 'lucide-react';

export interface DistractingApp {
  id: string;
  name: string;
  package: string;
  icon: string;
  category?: string;
  isDistraction?: boolean;
  usageMinutes?: number;
}

interface AppPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedApps: DistractingApp[];
  selectedPackages: string[];
  onSave: (selectedPackages: string[], quotaMinutes?: number) => void;
  title?: string;
  subtitle?: string;
  showQuotaSelector?: boolean;
  initialQuotaMinutes?: number;
}

// Popular default apps fallback if device query is empty
export const FALLBACK_DEVICE_APPS: DistractingApp[] = [
  { id: 'com.google.android.youtube', name: 'YouTube', package: 'com.google.android.youtube', icon: '▶️', category: 'Entertainment', usageMinutes: 38 },
  { id: 'com.instagram.android', name: 'Instagram', package: 'com.instagram.android', icon: '📸', category: 'Social', usageMinutes: 24 },
  { id: 'com.facebook.katana', name: 'Facebook', package: 'com.facebook.katana', icon: '👥', category: 'Social', usageMinutes: 15 },
  { id: 'com.snapchat.android', name: 'Snapchat', package: 'com.snapchat.android', icon: '👻', category: 'Social', usageMinutes: 12 },
  { id: 'com.twitter.android', name: 'X / Twitter', package: 'com.twitter.android', icon: '🐦', category: 'Social', usageMinutes: 18 },
  { id: 'com.reddit.frontpage', name: 'Reddit', package: 'com.reddit.frontpage', icon: '🤖', category: 'Social', usageMinutes: 20 },
  { id: 'com.netflix.mediaclient', name: 'Netflix', package: 'com.netflix.mediaclient', icon: '🎬', category: 'Entertainment', usageMinutes: 0 },
  { id: 'in.startv.hotstar', name: 'Disney+ Hotstar', package: 'in.startv.hotstar', icon: '⭐', category: 'Entertainment', usageMinutes: 0 },
  { id: 'com.amazon.avod.thirdpartyclient', name: 'Prime Video', package: 'com.amazon.avod.thirdpartyclient', icon: '🍿', category: 'Entertainment', usageMinutes: 0 },
  { id: 'com.spotify.music', name: 'Spotify', package: 'com.spotify.music', icon: '🎵', category: 'Entertainment', usageMinutes: 45 },
  { id: 'com.pubg.imobile', name: 'BGMI / PUBG', package: 'com.pubg.imobile', icon: '🎮', category: 'Gaming', usageMinutes: 0 },
  { id: 'com.dts.freefireth', name: 'Free Fire MAX', package: 'com.dts.freefireth', icon: '🔥', category: 'Gaming', usageMinutes: 0 },
  { id: 'com.king.candycrushsaga', name: 'Candy Crush', package: 'com.king.candycrushsaga', icon: '🍬', category: 'Gaming', usageMinutes: 5 },
  { id: 'com.roblox.client', name: 'Roblox', package: 'com.roblox.client', icon: '🧱', category: 'Gaming', usageMinutes: 0 },
  { id: 'com.ludo.king', name: 'Ludo King', package: 'com.ludo.king', icon: '🎲', category: 'Gaming', usageMinutes: 0 },
  { id: 'com.flipkart.android', name: 'Flipkart', package: 'com.flipkart.android', icon: '🛍️', category: 'Shopping', usageMinutes: 8 },
  { id: 'com.amazon.mShop.android.shopping', name: 'Amazon Shopping', package: 'com.amazon.mShop.android.shopping', icon: '📦', category: 'Shopping', usageMinutes: 14 },
  { id: 'com.myntra.android', name: 'Myntra', package: 'com.myntra.android', icon: '👗', category: 'Shopping', usageMinutes: 0 },
  { id: 'in.swiggy.android', name: 'Swiggy', package: 'in.swiggy.android', icon: '🍔', category: 'Shopping', usageMinutes: 6 },
  { id: 'com.application.zomato', name: 'Zomato', package: 'com.application.zomato', icon: '🍕', category: 'Shopping', usageMinutes: 4 },
  { id: 'com.android.chrome', name: 'Chrome Browser', package: 'com.android.chrome', icon: '🌐', category: 'Other', usageMinutes: 32 },
  { id: 'com.whatsapp', name: 'WhatsApp', package: 'com.whatsapp', icon: '💬', category: 'Social', usageMinutes: 50 },
  { id: 'org.telegram.messenger', name: 'Telegram', package: 'org.telegram.messenger', icon: '✈️', category: 'Social', usageMinutes: 22 }
];

export const AppPickerModal: React.FC<AppPickerModalProps> = ({
  isOpen,
  onClose,
  installedApps,
  selectedPackages: initialSelected,
  onSave,
  title = 'Select Apps to Protect',
  subtitle = 'Choose apps to block or limit on your device',
  showQuotaSelector = false,
  initialQuotaMinutes = 30
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [quotaMins, setQuotaMins] = useState<number>(initialQuotaMinutes);

  // Combine real installed apps with fallbacks if empty
  const allApps = useMemo(() => {
    if (installedApps && installedApps.length > 0) {
      return installedApps;
    }
    return FALLBACK_DEVICE_APPS;
  }, [installedApps]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    allApps.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [allApps]);

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return allApps.filter(app => {
      const matchSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.package.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === 'ALL' || app.category?.toUpperCase() === selectedCategory.toUpperCase();
      return matchSearch && matchCategory;
    });
  }, [allApps, searchQuery, selectedCategory]);

  const toggleApp = (pkg: string) => {
    setSelected(prev =>
      prev.includes(pkg) ? prev.filter(p => p !== pkg) : [...prev, pkg]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredPkgs = filteredApps.map(a => a.package);
    setSelected(prev => {
      const combined = new Set([...prev, ...filteredPkgs]);
      return Array.from(combined);
    });
  };

  const handleClearFiltered = () => {
    const filteredPkgs = new Set(filteredApps.map(a => a.package));
    setSelected(prev => prev.filter(p => !filteredPkgs.has(p)));
  };

  const handleConfirm = () => {
    onSave(selected, showQuotaSelector ? quotaMins : undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="max-w-lg w-full max-h-[90vh] rounded-3xl bg-[#0C0F0D] border border-[#1E2520] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E2520] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="p-4 border-b border-[#1E2520] space-y-3 bg-[#121614]/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search apps by name (e.g. YouTube, Instagram)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#161B18] border border-[#1E2520] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-[#161B18] border border-[#1E2520] text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'All Apps' : cat}
              </button>
            ))}
          </div>

          {/* Selection Quick Actions */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
            <span className="font-semibold text-emerald-400">
              {selected.length} apps selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllFiltered}
                className="text-[11px] font-bold text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Select Filtered ({filteredApps.length})
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={handleClearFiltered}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Apps Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[42vh] divide-y divide-[#1E2520]/40">
          {filteredApps.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No apps found matching "{searchQuery}"
            </div>
          ) : (
            filteredApps.map(app => {
              const isChecked = selected.includes(app.package);
              return (
                <div
                  key={app.package}
                  onClick={() => toggleApp(app.package)}
                  className={`pt-2 pb-2 px-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-950/20 border border-emerald-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-[#1E2520]">
                      {app.icon || '📱'}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white">{app.name}</h4>
                        {app.category && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                            {app.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                        {app.package}
                      </p>
                      {app.usageMinutes !== undefined && app.usageMinutes > 0 && (
                        <p className="text-[10px] text-amber-400 font-medium">
                          Today's usage: {app.usageMinutes}m
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Custom Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'border-2 border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Optional Quota Selector */}
        {showQuotaSelector && (
          <div className="p-4 border-t border-[#1E2520] bg-[#121614] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Daily Usage Quota
              </span>
              <span className="text-emerald-400 font-bold font-mono">{quotaMins} minutes</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[15, 30, 45, 60, 90].map(m => (
                <button
                  key={m}
                  onClick={() => setQuotaMins(m)}
                  className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    quotaMins === m
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-sm'
                      : 'bg-[#161B18] border-[#1E2520] text-slate-400 hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Bottom Confirm Bar */}
        <div className="p-4 border-t border-[#1E2520] bg-[#0C0F0D] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Apply ({selected.length} Apps)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
