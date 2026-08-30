import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from '../types';
import { fetchRandomQuote } from '../data/quotes';
import { RefreshCw, Quote as QuoteIcon, Heart, Share2, Sparkles, Check } from 'lucide-react';

export const DailyQuoteCard: React.FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const loadQuote = async () => {
    setLoading(true);
    setError(null);
    setLiked(false);
    try {
      const q = await fetchRandomQuote();
      setQuote(q);
      setLikeCount(q.likes || 100);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch quote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, []);

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    } else {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    }
  };

  const handleShare = () => {
    if (quote) {
      const textToCopy = `"${quote.text}" — ${quote.author} (via AspirantX)`;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="daily-quote-card" className="relative group overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-6 shadow-2xl shadow-cyan-950/20 transition-all duration-300 hover:border-cyan-500/40">
      {/* Background Ambient Glows */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90 flex items-center gap-1.5">
              Daily Dose of Grit
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </h3>
            <p className="text-[11px] text-slate-400">Curated for UPSC & SSC Aspirants</p>
          </div>
        </div>

        <button
          id="refresh-quote-btn"
          onClick={loadQuote}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700/50 transition-all duration-200 disabled:opacity-50 active:scale-95 group/btn"
          title="Get another quote"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : 'group-hover/btn:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[100px] flex items-center justify-center relative z-10 my-2">
        {loading ? (
          <div className="w-full space-y-3 py-2 animate-pulse">
            <div className="h-4 bg-slate-800/80 rounded-full w-11/12" />
            <div className="h-4 bg-slate-800/80 rounded-full w-4/5" />
            <div className="h-3 bg-slate-800/50 rounded-full w-1/3 pt-2" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-rose-400 text-sm mb-2">{error}</p>
            <button
              onClick={loadQuote}
              className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              Try again
            </button>
          </div>
        ) : quote ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <div className="relative pl-6 border-l-2 border-gradient-to-b border-cyan-500">
                <QuoteIcon className="absolute left-1 top-0 w-4 h-4 text-cyan-500/30 -translate-x-full" />
                <p className="text-slate-100 font-medium text-base md:text-lg leading-relaxed italic tracking-tight font-serif">
                  "{quote.text}"
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300/90 tracking-wide">
                    — {quote.author}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-purple-300 border border-purple-500/20 uppercase tracking-widest">
                    #{quote.category}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/60 relative z-10 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            id="like-quote-btn"
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              liked
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-950/40'
                : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:text-rose-400 hover:bg-slate-800/80'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="font-medium text-xs">{likeCount}</span>
          </button>

          <button
            id="share-quote-btn"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-cyan-300 hover:bg-slate-800/80 transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium text-xs">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="font-medium text-xs">Share</span>
              </>
            )}
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Refreshes every 24h or on demand
        </span>
      </div>
    </div>
  );
};
