import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from '../types';
import { fetchRandomQuote } from '../data/quotes';
import { RefreshCw, Quote as QuoteIcon, Heart, Share2, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '../lib/i18n/LanguageContext';

export const DailyQuoteCard: React.FC = () => {
  const { currentLanguage, isHindi: ctxIsHindi } = useLanguage();
  const isHindi = Boolean(ctxIsHindi || currentLanguage === 'hi');
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
      setError(err?.message || (isHindi ? 'प्रेरणा संदेश लोड करने में त्रुटि' : 'Failed to fetch quote'));
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
      const displayQuote = isHindi && quote.textHi ? quote.textHi : quote.text;
      const displayAuthor = isHindi && quote.authorHi ? quote.authorHi : quote.author;
      const textToCopy = `"${displayQuote}" — ${displayAuthor} (via StudyRide)`;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="daily-quote-card" className="relative group overflow-hidden rounded-2xl bg-[var(--sr-surface)] border border-[var(--sr-line)] p-6 shadow-md transition-all duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border border-[var(--sr-primary)]/20 shadow-inner">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--sr-primary)] flex items-center gap-1.5">
              {isHindi ? 'दैनिक प्रेरणा' : 'Daily Dose of Grit'}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--sr-primary)] animate-ping" />
            </h3>
            <p className="text-[11px] text-[var(--sr-text-secondary)]">
              {isHindi ? 'परीक्षार्थियों के लिए विशेष संकलन' : 'Curated for Aspirants'}
            </p>
          </div>
        </div>

        <button
          id="refresh-quote-btn"
          onClick={loadQuote}
          disabled={loading}
          className="p-2 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] text-[var(--sr-text)] border border-[var(--sr-line)] transition-all duration-200 disabled:opacity-50 active:scale-95 group/btn cursor-pointer"
          title="Get another quote"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--sr-primary)]' : 'group-hover/btn:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[100px] flex items-center justify-center relative z-10 my-2">
        {loading ? (
          <div className="w-full space-y-3 py-2 animate-pulse">
            <div className="h-4 bg-[var(--sr-surface-2)] rounded-full w-11/12" />
            <div className="h-4 bg-[var(--sr-surface-2)] rounded-full w-4/5" />
            <div className="h-3 bg-[var(--sr-surface-2)] rounded-full w-1/3 pt-2" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-rose-500 text-sm mb-2">{error}</p>
            <button
              onClick={loadQuote}
              className="text-xs text-[var(--sr-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
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
              <div className="relative pl-6 border-l-2 border-[var(--sr-primary)]">
                <QuoteIcon className="absolute left-1 top-0 w-4 h-4 text-[var(--sr-primary)] opacity-40 -translate-x-full" />
                <p className="text-[var(--sr-text)] font-medium text-base md:text-lg leading-relaxed italic tracking-tight font-serif">
                  "{isHindi && quote.textHi ? quote.textHi : quote.text}"
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--sr-primary)] tracking-wide">
                    — {isHindi && quote.authorHi ? quote.authorHi : quote.author}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--sr-surface-2)] text-[var(--sr-text-secondary)] border border-[var(--sr-line)] uppercase tracking-widest">
                    #{quote.category}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--sr-line)] relative z-10 text-xs text-[var(--sr-text-secondary)]">
        <div className="flex items-center gap-3">
          <button
            id="like-quote-btn"
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              liked
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-sm'
                : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-secondary)] border-[var(--sr-line)] hover:text-rose-500 hover:bg-[var(--sr-surface-3)]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="font-semibold text-xs text-[var(--sr-text)]">{likeCount}</span>
          </button>

          <button
            id="share-quote-btn"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--sr-surface-2)] text-[var(--sr-text-secondary)] border border-[var(--sr-line)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-3)] transition-all duration-200 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold text-xs">{isHindi ? 'प्रतिलिपि बनाई गई!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="font-semibold text-xs text-[var(--sr-text)]">{isHindi ? 'साझा करें' : 'Share'}</span>
              </>
            )}
          </button>
        </div>

        <span className="text-[11px] text-[var(--sr-text-muted)] hidden sm:inline">
          {isHindi ? 'हर 24 घंटे में या क्लिक पर अपडेट' : 'Refreshes every 24h or on demand'}
        </span>
      </div>
    </div>
  );
};
