import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  BookOpen, 
  BookMarked, 
  HelpCircle, 
  ChevronRight, 
  Sparkles,
  Layers
} from 'lucide-react';

interface AcademicGlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResource?: (type: 'syllabus' | 'pyq' | 'question', item: any) => void;
}

export const AcademicGlobalSearchModal: React.FC<AcademicGlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResource,
}) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{
    syllabus: any[];
    pyqs: any[];
    questions: any[];
  }>({ syllabus: [], pyqs: [], questions: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ syllabus: [], pyqs: [], questions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/academic/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setResults({
              syllabus: data.syllabus || [],
              pyqs: data.pyqs || [],
              questions: data.questions || [],
            });
          }
        }
      } catch (e) {
        console.warn('Search query failed');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.syllabus.length + results.pyqs.length + results.questions.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-[#0b0b10] border border-white/10 p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Global Search across Syllabus, 35+ Years PYQs, and Question Bank..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-black/60 border border-white/15 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={onClose}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="py-6 text-center text-xs text-slate-400">Searching academic database...</div>
        )}

        {!loading && query && totalResults === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            No matching items found for &quot;{query}&quot;.
          </div>
        )}

        {/* Results Sections */}
        <div className="space-y-4">
          {/* Syllabus Matches */}
          {results.syllabus.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Syllabus Nodes ({results.syllabus.length})
              </span>
              <div className="space-y-1.5">
                {results.syllabus.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (onSelectResource) onSelectResource('syllabus', s);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-100 block">{s.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {s.paper} • {s.subject} • {s.chapter}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PYQ Matches */}
          {results.pyqs.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5" /> Past Year Questions ({results.pyqs.length})
              </span>
              <div className="space-y-1.5">
                {results.pyqs.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectResource) onSelectResource('pyq', p);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-100 block line-clamp-1">
                        [{p.year} {p.exam}] {p.questionText}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.subject} • {p.topic}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Bank Matches */}
          {results.questions.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Question Bank Items ({results.questions.length})
              </span>
              <div className="space-y-1.5">
                {results.questions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => {
                      if (onSelectResource) onSelectResource('question', q);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-100 block line-clamp-1">{q.questionText}</span>
                      <span className="text-[10px] text-slate-400">
                        {q.type} • {q.subject}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
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
