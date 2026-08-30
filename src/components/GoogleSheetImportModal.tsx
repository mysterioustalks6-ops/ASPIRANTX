import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  X, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ExternalLink,
  Layers,
  BookOpen,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { fetchAndParseGoogleSheet, SAMPLE_GOOGLE_SHEET_CSV } from '../utils/googleSheets';
import { SyllabusTopic } from '../types';

interface GoogleSheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (topics: SyllabusTopic[], message: string) => void;
}

export const GoogleSheetImportModal: React.FC<GoogleSheetImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    topics: SyllabusTopic[];
    totalSubtopics: number;
  } | null>(null);
  const [copiedSample, setCopiedSample] = useState<boolean>(false);

  // Sample Public Google Spreadsheet URL for 1-click test
  const SAMPLE_PUBLIC_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';

  const handleFetch = async (urlToFetch?: string) => {
    const targetUrl = urlToFetch || sheetUrl;
    if (!targetUrl.trim()) {
      setError('Please paste a public Google Spreadsheet URL or Sheet ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setParsedPreview(null);

    const result = await fetchAndParseGoogleSheet(targetUrl);

    if (result.success && result.topics.length > 0) {
      setParsedPreview({
        topics: result.topics,
        totalSubtopics: result.totalSubtopics,
      });
    } else {
      setError(result.message || 'Could not parse Google Spreadsheet. Ensure link is shared publicly.');
    }
    setLoading(false);
  };

  const handleApply = () => {
    if (parsedPreview) {
      onImportSuccess(
        parsedPreview.topics,
        `Imported ${parsedPreview.topics.length} topics (${parsedPreview.totalSubtopics} sub-topics) from Google Spreadsheet!`
      );
      onClose();
    }
  };

  const handleLoadSample = () => {
    setSheetUrl(SAMPLE_PUBLIC_SHEET_URL);
    handleFetch(SAMPLE_PUBLIC_SHEET_URL);
  };

  const handleCopySampleCsv = () => {
    navigator.clipboard.writeText(SAMPLE_GOOGLE_SHEET_CSV);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,255,148,0.15)] overflow-hidden"
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FF94]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7000FF]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-[#00FF94]/10 text-[#00FF94] border border-[#00FF94]/30 shadow-[0_0_15px_rgba(0,255,148,0.2)]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Import Google Spreadsheet
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#00FF94]/10 text-[#00FF94] border border-[#00FF94]/30">
                  Live Sync API
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Paste any public Google Sheet link containing Topics & Sub-topics to parse automatically.
              </p>
            </div>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Google Spreadsheet URL or Sheet ID
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00FF94] focus:ring-1 focus:ring-[#00FF94] transition-all"
                />
                <button
                  onClick={() => handleFetch()}
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#00FF94] hover:bg-[#00e082] text-black font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(0,255,148,0.4)] disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" /> Fetch Syllabus
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions / Sample Links */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[#00FF94] hover:underline font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Sample UPSC Public Sheet
              </button>

              <button
                type="button"
                onClick={handleCopySampleCsv}
                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                {copiedSample ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Sample CSV!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Standard CSV Headers
                  </>
                )}
              </button>
            </div>

            {/* Format Instructions Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 space-y-1.5">
              <p className="font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Spreadsheet Columns Format:
              </p>
              <p className="text-[11px] leading-relaxed">
                Include columns titled: <code className="text-[#00FF94] bg-white/5 px-1 py-0.5 rounded">Topic</code>, <code className="text-[#00FF94] bg-white/5 px-1 py-0.5 rounded">Subtopic</code>, <code className="text-cyan-400 bg-white/5 px-1 py-0.5 rounded">Category</code>, <code className="text-purple-400 bg-white/5 px-1 py-0.5 rounded">Stage</code>, and <code className="text-amber-400 bg-white/5 px-1 py-0.5 rounded">Hours</code> (default 2.5).
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Import Error</p>
                  <p className="mt-0.5 text-slate-300">{error}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Tip: Ensure the spreadsheet permission is set to <strong>'Anyone with the link can view'</strong> in Google Sheets Share Settings.
                  </p>
                </div>
              </div>
            )}

            {/* Parsed Preview Result */}
            {parsedPreview && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121212] to-[#080808] border border-[#00FF94]/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#00FF94]" />
                    <span className="font-bold text-white text-sm">Spreadsheet Parsed Successfully</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/30">
                    {parsedPreview.topics.length} Topics • {parsedPreview.totalSubtopics} Sub-topics
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {parsedPreview.topics.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{t.title}</p>
                        <p className="text-[11px] text-slate-400">{t.category} • {t.subtopics?.length || 0} subtopics</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-cyan-300 border border-white/10">
                        {t.stage}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00FF94] to-cyan-400 hover:opacity-90 text-black font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(0,255,148,0.4)] flex items-center gap-2"
                  >
                    Apply to Syllabus Tracker <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
