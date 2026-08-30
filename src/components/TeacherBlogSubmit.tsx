import React, { useState, useEffect } from 'react';
import { BlogContentRequest, BlogPost } from '../types';
import { 
  Send, CheckCircle2, AlertCircle, FileText, Image, Sparkles, 
  HelpCircle, ArrowLeft, RefreshCw, UserCheck
} from 'lucide-react';

interface TeacherBlogSubmitProps {
  tokenFromUrl?: string;
  onNavigateHome?: () => void;
}

export const TeacherBlogSubmit: React.FC<TeacherBlogSubmitProps> = ({ 
  tokenFromUrl, 
  onNavigateHome 
}) => {
  const [token, setToken] = useState<string>(tokenFromUrl || '');
  const [request, setRequest] = useState<BlogContentRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [category, setCategory] = useState<string>('Current Affairs');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80');
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedPost, setSubmittedPost] = useState<BlogPost | null>(null);

  const categories = [
    'Current Affairs',
    'Editorial Analysis',
    'GS Paper 1',
    'GS Paper 2',
    'GS Paper 3',
    'Economy',
    'Strategy'
  ];

  const presetImages = [
    { label: 'Standard Editorial', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80' },
    { label: 'Economy & Finance', url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Polity & Constitution', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Tech & Science', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
    { label: 'Environment & Earth', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80' }
  ];

  // Load request from URL or token
  useEffect(() => {
    let effectiveToken = tokenFromUrl;
    if (!effectiveToken) {
      // Check window.location.hash or pathname
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('blog-submit/')) {
        effectiveToken = hash.replace('blog-submit/', '');
      } else {
        const pathParts = window.location.pathname.split('/');
        const idx = pathParts.indexOf('blog-submit');
        if (idx !== -1 && pathParts[idx + 1]) {
          effectiveToken = pathParts[idx + 1];
        }
      }
    }

    if (effectiveToken) {
      setToken(effectiveToken);
      fetchRequestInfo(effectiveToken);
    } else {
      setLoading(false);
      setError('No submission token provided. Please use the unique submission link received in your email.');
    }
  }, [tokenFromUrl]);

  const fetchRequestInfo = async (tok: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/submit/${tok}`);
      const data = await res.json();
      if (res.ok && data.success && data.request) {
        setRequest(data.request);
        if (data.request.status === 'submitted') {
          setError('This blog request has already been submitted. Thank you!');
        }
      } else {
        setError(data.error || 'Invalid or expired submission link.');
      }
    } catch (err: any) {
      setError('Failed to verify submission token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('Please fill out both the title and content body.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/blog/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          category,
          coverImageUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.post) {
        setSubmittedPost(data.post);
      } else {
        alert(data.error || 'Failed to submit post.');
      }
    } catch (err: any) {
      alert('Network error submitting post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300">
        <RefreshCw className="w-10 h-10 animate-spin text-sky-400 mb-4" />
        <p className="font-bold text-base">Verifying Educator Submission Token...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Submission Token Error</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || 'Unable to load submission request.'}
          </p>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
            >
              Return to AspirantX Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (submittedPost) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="bg-slate-900 border border-sky-500/30 rounded-3xl p-8 sm:p-10 max-w-xl w-full text-center shadow-2xl animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2 inline-block">
            Status: Pending Admin Approval
          </span>
          <h2 className="text-2xl font-black text-white mb-3">Content Submitted Successfully!</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Thank you <strong>{request.teacherName}</strong>. Your article <span className="text-sky-300 font-bold">"{submittedPost.title}"</span> has been submitted to the AspirantX editorial desk. Once approved, it will be published live on the public Blog.
          </p>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left mb-6 text-xs text-slate-400 space-y-1">
            <p><strong className="text-slate-200">Category:</strong> {submittedPost.category}</p>
            <p><strong className="text-slate-200">Submitted At:</strong> {new Date(submittedPost.createdAt).toLocaleString()}</p>
            <p><strong className="text-slate-200">Status:</strong> Under Review</p>
          </div>

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-sm transition-all"
            >
              Go to Public Blog & App
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Verified Educator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Daily Current Affairs Submission
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Welcome <strong>{request.teacherName}</strong> ({request.teacherEmail})
            </p>
          </div>

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>App Dashboard</span>
            </button>
          )}
        </div>

        {request.customMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200">
            <strong className="text-sky-400 font-bold">Admin Message:</strong> {request.customMessage}
          </div>
        )}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Article Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Daily Newspaper Analysis & Editorial Highlights (Budget 2026 Special)"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Category Dropdown <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-all font-medium"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Quick Cover Presets */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-2">
            Quick Cover Image Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {presetImages.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setCoverImageUrl(preset.url)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  coverImageUrl === preset.url
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Textarea */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Content Body (Rich / Formatted Text) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Supports Markdown (### Headings, - Bullets)</span>
          </div>
          <textarea
            required
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Write or paste your article content here...

### Key Highlights
- Highlight 1
- Highlight 2

### Detailed Analysis
Write paragraph details here...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-mono leading-relaxed"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Submitted posts will be reviewed by AspirantX admin before publishing.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Article...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Post for Review</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
