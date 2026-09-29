import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Filter, 
  X,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';
import { OPENKOSH_EXAMS, OpenKoshExamSummary } from '../data/openkoshData';

interface OpenKoshExamDirectoryProps {
  onSelectExam: (examId: string) => void;
  selectedExamId?: string;
  onClose?: () => void;
}

const LOCATIONS = [
  'All locations',
  'Central / National',
  'Uttar Pradesh',
  'Bihar',
  'Madhya Pradesh',
  'Rajasthan',
  'West Bengal'
];

const CATEGORIES = [
  'All categories',
  'Civil Services & General',
  'Banking',
  'Railway',
  'Defence',
  'Teaching',
  'Police & Law Enforcement',
  'Engineering',
  'Nursing & Allied Sciences',
  'Agriculture'
];

export const OpenKoshExamDirectory: React.FC<OpenKoshExamDirectoryProps> = ({
  onSelectExam,
  selectedExamId,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All locations');
  const [selectedCategory, setSelectedCategory] = useState('All categories');

  // Filtered exams
  const filteredExams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return OPENKOSH_EXAMS.filter((exam) => {
      // Location match
      if (selectedLocation !== 'All locations') {
        if (exam.location.toLowerCase() !== selectedLocation.toLowerCase()) {
          return false;
        }
      }

      // Category match
      if (selectedCategory !== 'All categories') {
        if (exam.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Search query match
      if (q) {
        const titleMatch = exam.title.toLowerCase().includes(q);
        const fullMatch = exam.fullName.toLowerCase().includes(q);
        const descMatch = exam.description.toLowerCase().includes(q);
        const searchTermsMatch = (exam.searchTerms || '').toLowerCase().includes(q);
        const locMatch = exam.location.toLowerCase().includes(q);
        const catMatch = exam.category.toLowerCase().includes(q);

        if (!titleMatch && !fullMatch && !descMatch && !searchTermsMatch && !locMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedLocation, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All locations');
    setSelectedCategory('All categories');
  };

  const hasActiveFilters = searchQuery !== '' || selectedLocation !== 'All locations' || selectedCategory !== 'All categories';

  return (
    <div className="w-full space-y-6">
      {/* Hero Banner in OpenKosh style */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-blue-800/40">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            <span>Home</span>
            <span>/</span>
            <span className="text-white">Syllabuses Directory</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Browse exam syllabuses
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-blue-100 max-w-3xl">
            Structured, topic-wise syllabus roadmaps for 45+ central and state competitive exams. Track your study progress offline with instant topic checklists.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-blue-200">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 45 Verified Official Roadmaps
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Offline Browser Persistence
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Zero Login Required
            </span>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </section>

      {/* Filter & Search Bar Container (OpenKosh style 3-column) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Search Box */}
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
            Search exams
            <div className="relative mt-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="exam-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by exam name, state, or category..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-9 py-2.5 text-sm font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </label>

          {/* Location Dropdown */}
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
            Location
            <div className="relative mt-2">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="exam-location-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-8 py-2.5 text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="dark:bg-slate-900">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {/* Category Dropdown */}
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
            Category
            <div className="relative mt-2">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="exam-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-8 py-2.5 text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        {/* Counter and Filter Reset */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            <span className="font-bold text-blue-600 dark:text-blue-400">{filteredExams.length}</span> exams found
            {hasActiveFilters && (
              <span className="ml-2 text-xs text-slate-400">
                (filtered from {OPENKOSH_EXAMS.length} total)
              </span>
            )}
          </p>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Exam Grid */}
      {filteredExams.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => {
            const isSelected = selectedExamId === exam.examId;
            return (
              <motion.article
                key={exam.examId}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400/60 dark:hover:border-blue-500/50 shadow-sm'
                }`}
              >
                <div>
                  {/* Location · Category Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
                      {exam.location} · {exam.category}
                    </p>
                    {isSelected && (
                      <span className="shrink-0 rounded-full bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Title & Full Name */}
                  <h2 className="mt-2 font-serif text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {exam.title}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                    {exam.fullName}
                  </p>

                  {/* Description */}
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                    {exam.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {exam.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Link Button */}
                  <button
                    type="button"
                    onClick={() => onSelectExam(exam.examId)}
                    className="w-full inline-flex items-center justify-between font-semibold text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:translate-x-0.5 transition-all py-1.5"
                  >
                    <span>Open {exam.title} syllabus</span>
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No exams match your filters</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Try searching with a broader term or reset the location and category filters to view all 45 syllabuses.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
