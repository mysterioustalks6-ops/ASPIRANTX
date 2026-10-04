import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, X, BookOpen, MessageSquare, HelpCircle, ArrowRight,
  Target, BookMarked, Award, BarChart3, Timer, CheckSquare, Users, Flame,
  Mic, ShieldCheck, Crown, Gift, Compass, Smartphone, Palette, Shield
} from 'lucide-react';
import { APP_FEATURES } from '../data/appFeatureIndex';
import { soundFx } from '../lib/soundEffects';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

const getFeatureIcon = (iconName: string) => {
  switch (iconName) {
    case 'Target': return Target;
    case 'BookOpen': return BookOpen;
    case 'BookMarked': return BookMarked;
    case 'HelpCircle': return HelpCircle;
    case 'Award': return Award;
    case 'BarChart3': return BarChart3;
    case 'Timer': return Timer;
    case 'CheckSquare': return CheckSquare;
    case 'MessageSquare': return MessageSquare;
    case 'Users': return Users;
    case 'Flame': return Flame;
    case 'Mic': return Mic;
    case 'ShieldCheck': return ShieldCheck;
    case 'Crown': return Crown;
    case 'Gift': return Gift;
    case 'Smartphone': return Smartphone;
    case 'Shield': return Shield;
    default: return Compass;
  }
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ posts: any[]; topics: any[]; questions: any[] }>({
    posts: [],
    topics: [],
    questions: []
  });
  const [loading, setLoading] = useState(false);

  const matchedFeatures = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APP_FEATURES.slice(0, 8); // show popular 8 features by default
    return APP_FEATURES.filter(feature => {
      if (feature.label.toLowerCase().includes(q)) return true;
      if (feature.tab.toLowerCase().includes(q)) return true;
      if (feature.keywords.some(k => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ posts: [], topics: [], questions: [] });
      return;
    }

    const timer = setTimeout(() => {
      fetchSearchResults();
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        const payload = data.data || data.results || { posts: [], topics: [], questions: [] };
        setResults({
          posts: Array.isArray(payload.posts) ? payload.posts : [],
          topics: Array.isArray(payload.topics) ? payload.topics : [],
          questions: Array.isArray(payload.questions) ? payload.questions : [],
        });
      }
    } catch {
      // offline/fallback tolerant
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFeature = (tab: string) => {
    soundFx.playTap();
    soundFx.triggerHaptic(15);
    onClose();
    onNavigate?.(tab);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Search Sheet */}
      <div className="relative w-full max-w-xl max-h-[85vh] sm:max-h-[75vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl z-10 overflow-hidden text-left">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-[var(--sr-line-strong)] mx-auto mt-3 mb-1 sm:hidden" />

        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--sr-line)]">
          <Search className="w-5 h-5 text-[var(--sr-primary)] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search syllabus, PYQs, mocks, focus tools..."
            className="w-full bg-transparent text-[var(--sr-text)] placeholder-[var(--sr-text-subtle)] text-sm font-bold focus:outline-none min-h-[44px]"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] text-xs font-bold"
            >
              Esc
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Tools & Modules */}
          <div>
            <h4 className="text-xs font-black uppercase text-[var(--sr-text-subtle)] tracking-wider mb-2">
              {query ? 'Matched Features & Tools' : 'Quick Jump'}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {matchedFeatures.map((item) => {
                const Icon = getFeatureIcon(item.iconName);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectFeature(item.tab)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-primary-subtle)] border border-[var(--sr-line)] hover:border-[var(--sr-primary)]/40 transition-colors text-left cursor-pointer min-h-[48px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[var(--sr-surface)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-primary)] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                          {item.label}
                        </span>
                        <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Content API Results Exist */}
          {(results.topics.length > 0 || results.questions.length > 0) && (
            <div>
              <h4 className="text-xs font-black uppercase text-[var(--sr-text-subtle)] tracking-wider mb-2">
                Questions & Topics
              </h4>
              <div className="space-y-2">
                {results.topics.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--sr-surface-2)] text-xs text-[var(--sr-text)]">
                    {t.name || t.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
