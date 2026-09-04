import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Smile, 
  Frown, 
  CheckCircle,
  HelpCircle,
  Plus,
  Info,
  X,
  Layers
} from 'lucide-react';
import { EXAM_LIST } from '../lib/examList';
import { normalizeExamId } from '../lib/examRegistry';

export interface Flashcard {
  id: string;
  exam: string;
  category: string;
  question: string;
  answer: string;
  hint: string;
  isCustom?: boolean;
}

const SEED_FLASHCARDS: Flashcard[] = [
  // NEET UG Decks
  {
    id: 'neet-f1',
    exam: 'NEET_UG',
    category: 'Biology — Human Physiology',
    question: 'Kupffer cells kin organs me paaye jaate hain aur inka primary function kya hai?',
    answer: 'Kupffer cells Liver ke sinusoids me paaye jane wale specialized Macrophages hote hain. Inka primary function micro-organisms, worn-out red blood cells (RBCs), aur foreign debris ko Phagocytosis ke dwara destroy karna hota hai.',
    hint: 'Phagocytic liver macrophages'
  },
  {
    id: 'neet-f2',
    exam: 'NEET_UG',
    category: 'Chemistry — Chemical Bonding',
    question: 'XeF4 (Xenon Tetrafluoride) ki Molecular Geometry aur Hybridization kya hai?',
    answer: 'XeF4 ki Hybridization sp3d2 hoti hai. Isme 4 Bond Pairs aur 2 Lone Pairs hote hain. Iski Electron Geometry Octahedral aur Molecular Geometry Square Planar hoti hai.',
    hint: '2 Lone pairs occupy axial positions'
  },
  {
    id: 'neet-f3',
    exam: 'NEET_UG',
    category: 'Physics — Electrostatics',
    question: 'Electric dipole in a uniform electric field par net Force aur Torque kitna hota hai?',
    answer: 'Uniform electric field me Electric dipole par Net Force hamesha zero (0) hota hai. Par Torque = p × E = p E sin(θ) act karta hai jo dipole ko field ke direction me align karne ki koshish karta hai.',
    hint: 'Net Force = 0, Torque = p × E'
  },

  // NDA / NA Decks
  {
    id: 'nda-f1',
    exam: 'NDA_NA',
    category: 'General Ability — Physics',
    question: 'Sound waves air me kaunsi type ki wave hoti hain aur vacuum me travel kyu nahi kar sakti?',
    answer: 'Sound waves Mechanical Longitudinal Waves hoti hain. Inhe propagation ke liye material medium (compressions & rarefactions) ki zaroorat hoti hai, isliye ye vacuum me travel nahi kar sakti.',
    hint: 'Speed of sound in air ≈ 343 m/s'
  },
  {
    id: 'nda-f2',
    exam: 'NDA_NA',
    category: 'Mathematics — Matrices & Determinants',
    question: 'If A is a square matrix of order n, then det(adj A) equals what in terms of det(A)?',
    answer: 'det(adj A) = |A|^(n-1). For a 3x3 matrix (n=3), det(adj A) = |A|^2.',
    hint: 'Power is (n - 1)'
  },
  {
    id: 'nda-f3',
    exam: 'NDA_NA',
    category: 'General Knowledge — Indian History',
    question: 'Battle of Plassey (1757) kis kis ke beech hui thi aur iska historic significance kya tha?',
    answer: 'Battle of Plassey 23 June 1757 ko Nawab of Bengal (Siraj-ud-Daulah) aur British East India Company (Robert Clive) ke beech hui थी. Mir Jafar ki treachery ki wajah se Clive jeeta aur Bharat me British rule ki foundation padi.',
    hint: 'Robert Clive vs Siraj-ud-Daulah'
  },

  // UPSC CSE Decks
  {
    id: 'upsc-f1',
    exam: 'UPSC_CSE',
    category: 'Indian Polity & Governance',
    question: 'Writ of Habeas Corpus kya hota hai and iska literary meaning kya hai?',
    answer: 'Habeas Corpus ka literary meaning hai "To have the body of". Ye writ court tab issue karta hai jab kisi person ko illegally detain kiya gaya ho. Court detaining authority ko direct karta hai ki detained person ko court ke samne produce kiya jaye.',
    hint: 'Under Article 32 (Supreme Court) and Article 226 (High Courts)'
  },
  {
    id: 'upsc-f2',
    exam: 'UPSC_CSE',
    category: 'Modern Indian History',
    question: 'Swadeshi Movement ki formal start kab aur kis event ke response me hui thi?',
    answer: 'Swadeshi Movement ki formal start 7 August 1905 ko Town Hall, Calcutta me Boycott Resolution pass hone ke sath hui thi. Ye Lord Curzon dwara announced Partition of Bengal (July 1905) ke response me shuru hua tha.',
    hint: 'Lal-Bal-Pal led this movement in different parts of India'
  },

  // SSC CGL Decks
  {
    id: 'ssc-f1',
    exam: 'SSC_CGL',
    category: 'Quantitative Aptitude — Geometry',
    question: 'Right-angled triangle me Inradius (r) aur Circumradius (R) ki lengths ka formula kya hota hai?',
    answer: 'Right-angled triangle with sides a, b and hypotenuse c:\nInradius r = (a + b - c) / 2\nCircumradius R = c / 2 (Hypotenuse ka half).',
    hint: 'Circumcentre lies at the midpoint of hypotenuse'
  }
];

interface FlashcardEngineProps {
  selectedExam?: string;
  onExamChange?: (exam: string) => void;
}

export const FlashcardEngine: React.FC<FlashcardEngineProps> = ({ 
  selectedExam = 'NEET_UG',
  onExamChange 
}) => {
  const [cards, setCards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('aspirantx_custom_flashcards');
      if (saved) {
        const custom: Flashcard[] = JSON.parse(saved);
        return [...SEED_FLASHCARDS, ...custom];
      }
    } catch {
      // fallback
    }
    return SEED_FLASHCARDS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New card form state
  const [newCategory, setNewCategory] = useState<string>('');
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newAnswer, setNewAnswer] = useState<string>('');
  const [newHint, setNewHint] = useState<string>('');

  // Review tracking status per card
  const [reviews, setReviews] = useState<{ [cardId: string]: 'easy' | 'hard' }>(() => {
    try {
      const saved = localStorage.getItem('aspirantx_flashcard_reviews');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Filter cards strictly for normalized active exam or universal cards
  const normActive = normalizeExamId(selectedExam);
  const examCards = cards.filter(c => c.exam === 'ALL' || normalizeExamId(c.exam) === normActive);
  const filteredCards = examCards.filter(c => selectedCategory === 'ALL' || c.category === selectedCategory);

  // Reset index when exam or category changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [selectedExam, selectedCategory]);

  const categories = Array.from(new Set(examCards.map(c => c.category)));
  const currentCard = filteredCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setTimeout(() => {
      setCurrentIndex(prev => (filteredCards.length > 0 ? (prev + 1) % filteredCards.length : 0));
    }, 150);
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setTimeout(() => {
      setCurrentIndex(prev => (filteredCards.length > 0 ? (prev - 1 + filteredCards.length) % filteredCards.length : 0));
    }, 150);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newCard: Flashcard = {
      id: `custom-${Date.now()}`,
      exam: selectedExam,
      category: newCategory.trim() || 'Custom Notes',
      question: newQuestion,
      answer: newAnswer,
      hint: newHint || 'Custom user note',
      isCustom: true
    };

    const updated = [...cards, newCard];
    setCards(updated);

    try {
      const customOnly = updated.filter(c => c.isCustom);
      localStorage.setItem('aspirantx_custom_flashcards', JSON.stringify(customOnly));
    } catch {
      // ignore
    }

    setNewCategory('');
    setNewQuestion('');
    setNewAnswer('');
    setNewHint('');
    setShowCreateModal(false);
  };

  const markReview = (status: 'easy' | 'hard') => {
    if (!currentCard) return;
    setReviews(prev => {
      const next = { ...prev, [currentCard.id]: status };
      try {
        localStorage.setItem('aspirantx_flashcard_reviews', JSON.stringify(next));
      } catch {}
      return next;
    });
    handleNext();
  };

  const easyCount = Object.values(reviews).filter(v => v === 'easy').length;
  const hardCount = Object.values(reviews).filter(v => v === 'hard').length;

  const currentExamLabel = EXAM_LIST.find(e => e.id === selectedExam)?.label || selectedExam.replace(/_/g, ' ');

  return (
    <div className="space-y-6">
      {/* Top Header & Exam Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 gap-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shrink-0 font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">Active Recall Flashcards</h1>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-500/20 font-semibold uppercase">
                {currentExamLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-yield spaced repetition cards mapped strictly to <strong className="text-slate-200">{currentExamLabel}</strong>.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowInfoDrawer(prev => !prev)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Info className="w-4 h-4 text-sky-400" />
            <span>Why Use Flashcards?</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Custom Card</span>
          </button>
        </div>
      </div>

      {/* "WHY USE FLASHCARDS?" SIDE INFORMATION PANEL */}
      {showInfoDrawer && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative text-left">
          <button
            onClick={() => setShowInfoDrawer(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Why Active Recall Flashcards are Essential for Competitive Exams</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-300 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <strong className="text-sky-400 block font-bold">🧠 1. Active Recall</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Reading passive notes leads to an illusion of competence. Flashcards force your brain to actively retrieve information from memory.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <strong className="text-sky-400 block font-bold">📈 2. Spaced Repetition</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Reviewing hard concepts right before you forget them flattens Ebbinghaus's Forgetting Curve and locks facts into long-term memory.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <strong className="text-emerald-400 block font-bold">⏱️ 3. High-Yield Revision</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Perfect for 10-minute daily review sessions before solving PYQs or CBT mock papers to eliminate negative marking.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <strong className="text-cyan-400 block font-bold">🎯 4. Exam Tailored</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Every card is linked directly to {currentExamLabel} syllabus topics, equations, articles, and formulas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter & Deck Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" /> Deck Category:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Decks ({examCards.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat} ({examCards.filter(c => c.category === cat).length})
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
          <span>Reviewed: {easyCount + hardCount}</span>
          <span className="text-emerald-400 font-medium">({easyCount} Easy</span>
          <span className="text-rose-400 font-medium">• {hardCount} Hard)</span>
        </div>
      </div>

      {/* Flashcard Active Viewer */}
      {filteredCards.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <HelpCircle className="w-10 h-10 text-sky-400 mx-auto animate-bounce" />
          <h3 className="text-base font-bold text-white">No flashcards found for {currentExamLabel} in category "{selectedCategory}"</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>"+ Add Custom Card"</strong> above to create your own high-yield cards for this subject!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center text-xs font-semibold text-slate-400">
            Card {currentIndex + 1} of {filteredCards.length}
          </div>

          <div
            onClick={handleFlip}
            className={`min-h-[260px] p-8 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between relative shadow-sm ${
              isFlipped
                ? 'bg-slate-900 border-sky-500/40 text-slate-100'
                : 'bg-slate-900 border-slate-800 hover:border-sky-500/30 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-semibold uppercase">
                {currentCard.category}
              </span>

              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-sky-400" /> Click anywhere to flip
              </span>
            </div>

            <div className="my-6 text-center text-base sm:text-lg font-bold leading-relaxed whitespace-pre-line px-4">
              {isFlipped ? (
                <div className="space-y-2 text-left">
                  <span className="text-xs text-emerald-400 font-bold block">✓ Model Answer & Explanation:</span>
                  <div className="text-slate-200 text-sm font-normal leading-relaxed">{currentCard.answer}</div>
                </div>
              ) : (
                <div className="space-y-2 text-left">
                  <span className="text-xs text-sky-400 font-bold block">❓ Active Recall Question:</span>
                  <div className="text-white text-base font-semibold leading-relaxed">{currentCard.question}</div>
                </div>
              )}
            </div>

            {/* Hint Drawer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              {currentCard.hint ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {showHint ? `Hint: ${currentCard.hint}` : 'Show Memory Hint'}
                </button>
              ) : <div />}

              <span className="text-[10px] text-slate-500">
                {isFlipped ? 'Answer View' : 'Question View'}
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Card
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => markReview('hard')}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Mark for Spaced Repetition Review"
              >
                <Frown className="w-4 h-4" /> Hard
              </button>
              <button
                onClick={() => markReview('easy')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Mastered"
              >
                <Smile className="w-4 h-4" /> Easy
              </button>
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              Next Card <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM FLASHCARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Add Custom Flashcard for {currentExamLabel}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Subject / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Physics — Thermodynamics"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Active Recall Question</label>
                <textarea
                  rows={2}
                  placeholder="e.g. What is the first law of thermodynamics?"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Model Answer / Formula</label>
                <textarea
                  rows={3}
                  placeholder="e.g. ΔU = Q - W (Energy cannot be created or destroyed)"
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Memory Hint (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Conservation of Energy principle"
                  value={newHint}
                  onChange={e => setNewHint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
