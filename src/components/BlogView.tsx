import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { AdSenseBanner } from './AdSenseBanner';
import { 
  BookOpen, Search, Calendar, User, Clock, Share2, ArrowLeft, 
  Sparkles, CheckCircle2, ChevronRight, Filter, AlertCircle, RefreshCw
} from 'lucide-react';

export const BlogView: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const categories = [
    'All', 
    'Current Affairs', 
    'Editorial Analysis', 
    'GS Paper 1', 
    'GS Paper 2', 
    'GS Paper 3', 
    'Economy', 
    'Strategy'
  ];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog/posts?status=published');
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.authorName && post.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleShare = (post: BlogPost) => {
    const url = `${window.location.origin}/#blog?id=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recently';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render markdown-like body
  const renderFormattedBody = (bodyText: string) => {
    const lines = bodyText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-xl font-bold text-slate-100 mt-6 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-sky-500 rounded-full inline-block" />
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-2xl font-black text-white mt-8 mb-4 tracking-tight border-b border-slate-800 pb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-3xl font-black text-white mt-8 mb-4">
            {trimmed.replace('# ', '')}
          </h1>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-300 my-1.5 leading-relaxed font-normal">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      }

      return (
        <p key={idx} className="text-slate-300 my-3 leading-relaxed text-base font-normal">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/20 p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AspirantX Daily Insights</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Current Affairs & Editorial Desk
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Expert analysis, daily current affairs, and strategic exam insights curated directly by top Civil Services educators and UPSC faculty.
          </p>
        </div>
      </div>

      {/* AdSense Banner */}
      <AdSenseBanner slotType="inFeed" />

      {/* Detail Post View Modal */}
      {selectedPost ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl mb-8 animate-fadeIn">
          <button
            onClick={() => setSelectedPost(null)}
            className="mb-6 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-all border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </button>

          <div className="max-w-4xl mx-auto">
            {/* Category & Metadata Header */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold uppercase tracking-wider">
                {selectedPost.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {calculateReadTime(selectedPost.body)}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(selectedPost.publishedAt || selectedPost.createdAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white mb-6 leading-tight">
              {selectedPost.title}
            </h1>

            {/* Author bar */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md">
                  {selectedPost.authorName ? selectedPost.authorName.charAt(0) : 'E'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                    <span>{selectedPost.authorName || 'AspirantX Educator'}</span>
                    <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                  </div>
                  <p className="text-xs text-slate-400">Verified UPSC Faculty & Subject Expert</p>
                </div>
              </div>

              <button
                onClick={() => handleShare(selectedPost)}
                className="px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
              </button>
            </div>

            {/* Cover Image */}
            {selectedPost.coverImageUrl && (
              <div className="mb-8 rounded-2xl overflow-hidden border border-slate-800 shadow-xl max-h-96">
                <img
                  src={selectedPost.coverImageUrl}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-invert max-w-none bg-slate-950/40 p-6 sm:p-8 rounded-2xl border border-slate-800/60">
              {renderFormattedBody(selectedPost.body)}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Blog Feed</span>
              </button>
              <button
                onClick={() => handleShare(selectedPost)}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Copied to Clipboard!' : 'Share Insight'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main List Section */}
      {!selectedPost && (
        <>
          {/* Controls Bar: Search & Category Pills */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search Box */}
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search current affairs, polity, budget..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={fetchPosts}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
                  title="Refresh Posts"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-sm font-medium">Loading published articles...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center my-8">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-200 mb-1">No Published Posts Found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'All' 
                  ? 'No articles match your active filter. Try clearing your search or switching categories.' 
                  : 'Faculty members are currently preparing new daily current affairs content.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/5"
                >
                  {/* Card Cover Image */}
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    <img
                      src={post.coverImageUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-sky-300 border border-sky-500/30 text-[11px] font-bold uppercase tracking-wider">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {calculateReadTime(post.body)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 mb-2 leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed mb-4">
                        {post.body.replace(/[#*`-]/g, '')}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-xs font-bold">
                          {post.authorName ? post.authorName.charAt(0) : 'E'}
                        </div>
                        <span className="text-xs font-medium text-slate-300 truncate max-w-[140px]">
                          {post.authorName || 'Faculty'}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
