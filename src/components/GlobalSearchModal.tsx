import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, MessageSquare, HelpCircle, FileText, ArrowRight, Sparkles } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ posts: any[]; topics: any[]; questions: any[] }>({
    posts: [],
    topics: [],
    questions: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ posts: [], topics: [], questions: [] });
      return;
    }

    const timer = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Failed to run global search:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden space-y-0">
        {/* SEARCH BAR INPUT */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/50">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across Syllabus, PYQs, Community, Questions & Notes..."
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500 font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">
            ESC
          </button>
        </div>

        {/* RESULTS BODY */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching Enterprise Index...</span>
            </div>
          ) : !query.trim() ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-1">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2 opacity-60" />
              <p className="font-semibold text-slate-400">Global AspirantX Search Engine</p>
              <p>Type keywords like "Polity", "Repo Rate", "Preamble", or "UPSC 2024"</p>
            </div>
          ) : results.posts.length === 0 && results.topics.length === 0 && results.questions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No index results found for "{query}".
            </div>
          ) : (
            <>
              {/* TOPICS & SYLLABUS */}
              {results.topics.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Syllabus Topics</span>
                  </div>
                  <div className="space-y-1">
                    {results.topics.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onNavigate) onNavigate('syllabus');
                          onClose();
                        }}
                        className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800/80 cursor-pointer flex justify-between items-center text-xs transition-all"
                      >
                        <div>
                          <span className="font-bold text-slate-200">{item.title}</span>
                          <span className="text-slate-500 ml-2">({item.subject})</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMUNITY POSTS */}
              {results.posts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Community Discussions</span>
                  </div>
                  <div className="space-y-1">
                    {results.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          if (onNavigate) onNavigate('community');
                          onClose();
                        }}
                        className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800/80 cursor-pointer flex justify-between items-center text-xs transition-all"
                      >
                        <div>
                          <div className="font-bold text-slate-200 line-clamp-1">{post.title}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">By {post.authorName} • {post.groupName}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION BANK */}
              {results.questions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Question Bank</span>
                  </div>
                  <div className="space-y-1">
                    {results.questions.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => {
                          if (onNavigate) onNavigate('question_bank');
                          onClose();
                        }}
                        className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800/80 cursor-pointer flex justify-between items-center text-xs transition-all"
                      >
                        <div>
                          <div className="font-bold text-slate-200 line-clamp-1">{q.text}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{q.subject} • {q.exam}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
