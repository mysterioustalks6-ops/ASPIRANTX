import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  Calendar, 
  FileCheck2, 
  ExternalLink, 
  BookMarked, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { 
  getOpenKoshDetailed, 
  getRelatedExams, 
  OPENKOSH_EXAMS, 
  OpenKoshDetailedExam 
} from '../data/openkoshData';

interface OpenKoshExamFrameProps {
  examId: string;
  onSelectExam: (examId: string) => void;
  onBrowseAll: () => void;
  totalTopics: number;
  completedTopics: number;
}

export const OpenKoshExamFrame: React.FC<OpenKoshExamFrameProps> = ({
  examId,
  onSelectExam,
  onBrowseAll,
  totalTopics,
  completedTopics
}) => {
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const detailed = getOpenKoshDetailed(examId);
  const relatedExams = getRelatedExams(examId, 3);

  const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Quick switcher filtered list
  const switcherList = quickSearch.trim()
    ? OPENKOSH_EXAMS.filter(e => 
        e.title.toLowerCase().includes(quickSearch.toLowerCase()) ||
        e.fullName.toLowerCase().includes(quickSearch.toLowerCase()) ||
        e.category.toLowerCase().includes(quickSearch.toLowerCase())
      )
    : OPENKOSH_EXAMS;

  if (!detailed) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Bar Navigation: Back to Directory + Quick Exam Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <button
          type="button"
          onClick={onBrowseAll}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All 45 Syllabuses</span>
        </button>

        {/* Quick Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsQuickSwitcherOpen(!isQuickSwitcherOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Switch Exam: <strong>{detailed.title}</strong></span>
          </button>

          {isQuickSwitcherOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-3 space-y-2 overflow-hidden flex flex-col">
              <input
                type="search"
                autoFocus
                placeholder="Search exams..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 pr-1">
                {switcherList.map((ex) => (
                  <button
                    key={ex.examId}
                    type="button"
                    onClick={() => {
                      onSelectExam(ex.examId);
                      setIsQuickSwitcherOpen(false);
                      setQuickSearch('');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      ex.examId === detailed.examId
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{ex.title}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{ex.fullName}</p>
                    </div>
                    {ex.examId === detailed.examId && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hero Header (OpenKosh primary blue container) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-blue-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              {detailed.category} · {detailed.location}
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
              {detailed.title} Syllabus 2026
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-blue-100">
              {detailed.fullName}
            </p>
          </div>

          <div className="flex sm:flex-col gap-3 shrink-0">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-4 text-xs sm:text-sm text-blue-50 min-w-[140px]">
              <p>
                <strong className="text-white text-lg font-bold">{detailed.totalTopicsCount || totalTopics}</strong> trackable topics
              </p>
              <p className="mt-1">
                <strong className="text-white font-semibold">{detailed.difficulty}</strong> difficulty
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Lead Paragraph (OpenKosh left border) */}
      {detailed.overview && (
        <div className="rounded-2xl border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 p-5 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200">
          <p>{detailed.overview}</p>
        </div>
      )}

      {/* 4 Info Cards Grid (OpenKosh pattern) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Conducted by */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-blue-400/50 transition">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Conducted by</span>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
            {detailed.conductedBy || 'Official Examination Authority'}
          </p>
        </div>

        {/* Eligibility */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-blue-400/50 transition">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Eligibility</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
            {detailed.eligibility || 'Check official notification'}
          </p>
        </div>

        {/* Age Limit */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-blue-400/50 transition">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>Age Limit</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
            {detailed.ageLimit || 'As per official rules'}
          </p>
        </div>

        {/* Pattern */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-blue-400/50 transition">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <FileCheck2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Pattern</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
            {detailed.pattern || 'Objective & Subjective phases'}
          </p>
        </div>
      </div>

      {/* Offline Syllabus Progress Banner (OpenKosh style) */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/30 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Offline syllabus progress
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Your checklist is saved automatically in this browser; zero login or sign-in required.
            </p>
          </div>
          <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>{completedTopics} of {totalTopics} topics completed</span>
          <span>{totalTopics - completedTopics} pending</span>
        </div>
      </div>

      {/* Recommended Books Section (if available) */}
      {detailed.books && detailed.books.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Recommended Reference Books
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Subject</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Book Title</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Author / Publisher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {detailed.books.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{b.subject}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{b.book}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{b.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Continue Exploring - Related Exams */}
      {relatedExams.length > 0 && (
        <section className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Continue exploring
              </p>
              <h2 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">
                Related exam syllabuses
              </h2>
            </div>
            <button
              onClick={onBrowseAll}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Browse all 45 exams →
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {relatedExams.map((rel) => (
              <button
                key={rel.examId}
                type="button"
                onClick={() => onSelectExam(rel.examId)}
                className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-400/60 hover:shadow-md transition-all group"
              >
                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {rel.category}
                </p>
                <h3 className="mt-1.5 font-serif text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {rel.title} syllabus
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {rel.fullName}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
