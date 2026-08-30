import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  Download, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  BookMarked,
  X
} from 'lucide-react';
import { ResourceBook, UserProfile } from '../types';

interface LibraryEngineProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
}

export const LibraryEngine: React.FC<LibraryEngineProps> = ({ user, onNavigate }) => {
  const [books, setBooks] = useState<ResourceBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState(user?.exam || 'ALL');

  useEffect(() => {
    if (user?.exam) {
      setSelectedExam(user.exam);
    }
  }, [user?.exam]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  
  // Bookmarks (LocalStorage persisted)
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('aspirantx_library_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  // Simulated Download States
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Admin CRUD Modal States
  const [showCrudModal, setShowCrudModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Partial<ResourceBook> | null>(null);
  const [crudForm, setCrudForm] = useState({
    id: '',
    title: '',
    author: '',
    category: 'Standard Book' as any,
    subject: 'Indian Polity & Governance',
    exam: 'UPSC_CSE',
    mappedTopics: '',
    description: '',
    edition: 'Latest Edition',
    importance: 'Essential' as any,
    coverColor: 'bg-indigo-900'
  });

  const isAdmin = user.role === 'ADMIN' || user.role === 'CO_ADMIN' || user.role === 'DEVELOPER';

  // Fetch books from server database with instant offline fallback
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedExam !== 'ALL') queryParams.append('exam', selectedExam);
      if (selectedCategory !== 'ALL') queryParams.append('category', selectedCategory);
      if (selectedSubject !== 'ALL') queryParams.append('subject', selectedSubject);
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await fetch(`/api/academic/books?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.books) && data.books.length > 0) {
        setBooks(data.books);
        return;
      }
    } catch (err) {
      console.warn('Loading curated offline book repository fallback');
    } finally {
      // Offline fallback from comprehensive books database
      const { COMPREHENSIVE_BOOKS_DATABASE } = await import('../data/booksData');
      let filtered = [...COMPREHENSIVE_BOOKS_DATABASE];
      if (selectedExam !== 'ALL') {
        filtered = filtered.filter(b => b.exam === selectedExam || b.exam === 'ALL');
      }
      if (selectedCategory !== 'ALL') {
        filtered = filtered.filter(b => b.category === selectedCategory);
      }
      if (selectedSubject !== 'ALL') {
        filtered = filtered.filter(b => b.subject === selectedSubject);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b => 
          b.title.toLowerCase().includes(q) || 
          b.author.toLowerCase().includes(q) || 
          b.description.toLowerCase().includes(q)
        );
      }
      setBooks(filtered);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedExam, selectedCategory, selectedSubject, searchQuery]);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('aspirantx_library_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Toggle Bookmark
  const toggleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  // Discuss with AI Mentor Redirect Hook
  const handleDiscussWithAi = (book: ResourceBook) => {
    const prefillQuery = `Hey AI Mentor! I am studying from the book "${book.title}" by ${book.author} (${book.edition}) for ${book.exam.replace('_', ' ')}. Could you summarize the core chapters and explain the most high-yield topics mapped to this book?`;
    localStorage.setItem('aspirantx_ai_prefill_query', prefillQuery);
    localStorage.setItem('aspirantx_ai_prefill_mode', 'ncert_mentor');
    onNavigate('chat');
  };

  // Simulate High-Speed Notes Download
  const handleDownloadNotes = (bookId: string) => {
    if (downloadingId) return;
    setDownloadingId(bookId);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setDownloadingId(null), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Admin Save Book (Create/Update)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...crudForm,
        mappedTopics: crudForm.mappedTopics.split(',').map(t => t.trim()).filter(Boolean)
      };

      const res = await fetch('/api/academic/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchBooks();
        setShowCrudModal(false);
        setEditingBook(null);
      }
    } catch (err) {
      console.error('Failed to save book record:', err);
    }
  };

  // Admin Delete Book
  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Kya aap sach me is book reference ko remove karna chahte hain?')) return;
    try {
      const res = await fetch(`/api/academic/books/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchBooks();
      }
    } catch (err) {
      console.error('Failed to delete book record:', err);
    }
  };

  // Open Edit Modal
  const openEditModal = (book: ResourceBook) => {
    setEditingBook(book);
    setCrudForm({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      subject: book.subject,
      exam: book.exam,
      mappedTopics: book.mappedTopics.join(', '),
      description: book.description,
      edition: book.edition || 'Latest Edition',
      importance: book.importance,
      coverColor: book.coverColor || 'bg-indigo-900'
    });
    setShowCrudModal(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingBook(null);
    setCrudForm({
      id: '',
      title: '',
      author: '',
      category: 'Standard Book',
      subject: 'Indian Polity & Governance',
      exam: user.exam || 'UPSC_CSE',
      mappedTopics: 'Constitutional Framework, Fundamental Rights',
      description: '',
      edition: 'Latest Edition',
      importance: 'Essential',
      coverColor: 'bg-indigo-900'
    });
    setShowCrudModal(true);
  };

  // Subject list extracted dynamically
  const subjectsList = ['ALL', 'Indian Polity & Governance', 'Modern Indian History', 'Art & Culture', 'Geography', 'Indian Economy', 'Environment & Ecology', 'Ethics, Integrity & Aptitude', 'Mathematics & Quantitative Aptitude', 'Reasoning & Intelligence'];

  const filteredBooks = books.filter(book => {
    if (showBookmarksOnly && !bookmarks.includes(book.id)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upper Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/40 border border-white/10 rounded-2xl p-5 gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Aspirants Reference Library
            </h1>
            <p className="text-xs text-slate-400">
              UPSC standard textbooks, old/new NCERT collections, and government policy reports in one central library.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBookmarksOnly(prev => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              showBookmarksOnly 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-950/80 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>My Reading List ({bookmarks.length})</span>
          </button>

          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book Reference</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by book title, author, or keyword topics..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Read-Only Active Exam Indicator */}
          <div className="relative">
            <div className="w-full bg-slate-950/80 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-emerald-200 font-bold flex items-center justify-between">
              <span>{selectedExam === 'ALL' ? 'Active Profile Exam' : selectedExam.replace(/_/g, ' ')}</span>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded uppercase font-semibold">Profile Context</span>
            </div>
          </div>

          {/* Category filters */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Standard Book">Standard Books</option>
              <option value="NCERT">NCERTs (Class 6-12)</option>
              <option value="Government Report">Government Reports</option>
              <option value="Reference Manual">Reference Manuals</option>
            </select>
          </div>
        </div>

        {/* Subject scroll selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase shrink-0">Subjects:</span>
          {subjectsList.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border shrink-0 ${
                selectedSubject === sub
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              {sub === 'ALL' ? 'All Subjects' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* Main Books Grid View */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading library references...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-16 text-center space-y-4">
          <BookMarked className="w-12 h-12 text-slate-600 mx-auto opacity-40" />
          <div className="space-y-1">
            <h3 className="text-white font-bold text-sm">Koi books nahi mili</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Aapki current search filters ke parameters ke mutabik library database me koi record save nahi hai.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => {
            const isBookmarked = bookmarks.includes(book.id);
            return (
              <div 
                key={book.id} 
                className="bg-slate-900/40 border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                {/* Visual 3D Book Graphic Accent */}
                <div className="absolute top-0 left-0 w-2 h-full bg-slate-950 pointer-events-none" />

                <div className="space-y-4">
                  {/* Top line badges */}
                  <div className="flex items-center justify-between pl-2">
                    <span className="text-[9px] bg-slate-950 border border-white/10 text-slate-400 px-2 py-0.5 rounded font-black uppercase">
                      {book.category}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase border ${
                        book.importance === 'Essential' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : book.importance === 'Recommended'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-slate-800 text-slate-400 border-white/5'
                      }`}>
                        {book.importance}
                      </span>
                      
                      <button
                        onClick={() => toggleBookmark(book.id)}
                        className="text-slate-400 hover:text-amber-400 p-0.5"
                        title={isBookmarked ? 'Remove from reading list' : 'Add to reading list'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Book cover visual & title */}
                  <div className="flex items-start gap-4 pl-2">
                    {/* Simulated Book Spine Cover */}
                    <div className={`w-14 h-20 rounded-md shadow-md flex items-center justify-center shrink-0 border border-white/10 p-1 relative ${book.coverColor || 'bg-indigo-900'}`}>
                      <div className="absolute left-1 top-0 bottom-0 w-[2px] bg-black/40" />
                      <span className="text-[8px] font-black text-white text-center leading-tight line-clamp-3">
                        {book.title}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-white text-sm leading-snug group-hover:text-emerald-400 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">By {book.author}</p>
                      {book.edition && (
                        <p className="text-[10px] text-slate-500 font-medium">{book.edition}</p>
                      )}
                    </div>
                  </div>

                  {/* Book details */}
                  <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-3 pl-2">
                    {book.description}
                  </p>

                  {/* Mapped topics badges */}
                  {book.mappedTopics && book.mappedTopics.length > 0 && (
                    <div className="space-y-1 pl-2">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase">Mapped Topics:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {book.mappedTopics.map(topic => (
                          <span 
                            key={topic}
                            onClick={() => setSearchQuery(topic)}
                            className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-[9px] text-cyan-400 hover:text-cyan-300 rounded font-semibold cursor-pointer transition-colors"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions panel */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(book)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-white/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Simulated Download Guide */}
                    {downloadingId === book.id ? (
                      <div className="w-24 space-y-1.5">
                        <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                          <span>Downloading</span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${downloadProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownloadNotes(book.id)}
                        className="px-2.5 py-1.5 bg-slate-950 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Notes</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDiscussWithAi(book)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] rounded-lg shadow-md transition-all flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Discuss with AI</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADMIN CRUD MODAL ── */}
      {showCrudModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowCrudModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  {editingBook ? 'Edit Book Reference' : 'Add New Book Reference'}
                </h3>
                <p className="text-[11px] text-slate-400">Admin Academic Library CRUD operations</p>
              </div>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Book ID (optional)</label>
                  <input
                    type="text"
                    disabled={Boolean(editingBook)}
                    value={crudForm.id}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g. b_laxmikanth"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Edition</label>
                  <input
                    type="text"
                    required
                    value={crudForm.edition}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, edition: e.target.value }))}
                    placeholder="e.g. 7th Edition (Latest)"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Title</label>
                  <input
                    type="text"
                    required
                    value={crudForm.title}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Indian Polity"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Author</label>
                  <input
                    type="text"
                    required
                    value={crudForm.author}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="e.g. M. Laxmikanth"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                  <select
                    value={crudForm.category}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Standard Book">Standard Book</option>
                    <option value="NCERT">NCERT</option>
                    <option value="Government Report">Government Report</option>
                    <option value="Reference Manual">Reference Manual</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Importance</label>
                  <select
                    value={crudForm.importance}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, importance: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Essential">Essential 🔴</option>
                    <option value="Recommended">Recommended 🔵</option>
                    <option value="Supplementary">Supplementary ⚪</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Cover Theme</label>
                  <select
                    value={crudForm.coverColor}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, coverColor: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="bg-indigo-900">Indigo Dark</option>
                    <option value="bg-emerald-950">Emerald Green</option>
                    <option value="bg-blue-900">Royal Blue</option>
                    <option value="bg-rose-900">Crimson Rose</option>
                    <option value="bg-amber-900">Amber Golden</option>
                    <option value="bg-slate-800">Slate Grey</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Subject Name</label>
                <input
                  type="text"
                  required
                  value={crudForm.subject}
                  onChange={(e) => setCrudForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Indian Polity & Governance"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Mapped Syllabus Topics (Comma Separated)</label>
                <input
                  type="text"
                  value={crudForm.mappedTopics}
                  onChange={(e) => setCrudForm(prev => ({ ...prev, mappedTopics: e.target.value }))}
                  placeholder="e.g. Constitutional Framework, Preamble, Amendments"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Book description / study note overview</label>
                <textarea
                  rows={3}
                  value={crudForm.description}
                  onChange={(e) => setCrudForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe the significance of this book and what chapters/topics it covers..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                {editingBook ? 'Update Book Reference' : 'Save Book Reference'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
