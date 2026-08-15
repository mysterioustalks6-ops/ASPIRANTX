import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, Heart, Bookmark, Pin, Share2, Plus, Search, 
  Paperclip, Send, AlertCircle, ShieldCheck, CheckCircle2, ThumbsUp, 
  HelpCircle, MoreHorizontal, Filter, X, Sparkles, UserPlus, UserCheck,
  FileText, Download, Trash2, ArrowUpRight, BarChart2, Radio, Check,
  Coins, Wallet, Zap, ArrowBigUp, ArrowBigDown
} from 'lucide-react';
import { CommunityGroup, CommunityPost, CommunityComment, UserProfile } from '../types';
import { CommunityChat } from './CommunityChat';
import { CommunityWallet } from './CommunityWallet';

interface CommunityPlatformProps {
  userProfile: UserProfile;
  selectedExam?: string;
  onOpenPremium?: () => void;
}

export const CommunityPlatform: React.FC<CommunityPlatformProps> = ({ userProfile, selectedExam = 'NEET_UG', onOpenPremium }) => {
  // Navigation & View Mode
  const [activeSubTab, setActiveSubTab] = useState<'forum' | 'wallet' | 'chat_rooms'>('forum');

  // Groups & Posts state
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'bookmarked' | 'my_posts'>('all');
  const [sortMode, setSortMode] = useState<'recent' | 'popular' | 'discussed'>('recent');

  // Expanded Comments per post: postId -> array of comments
  const [expandedPostComments, setExpandedPostComments] = useState<Record<string, CommunityComment[]>>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);
  const [openCommentSectionPostId, setOpenCommentSectionPostId] = useState<string | null>(null);
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [submittingCommentPostId, setSubmittingCommentPostId] = useState<string | null>(null);

  // Tipping State
  const [tippingPost, setTippingPost] = useState<CommunityPost | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(10);
  const [isTipping, setIsTipping] = useState<boolean>(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<string | null>(null);

  // Toast Notice State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State - New Post
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTargetGroupId, setPostTargetGroupId] = useState('');
  const [postTags, setPostTags] = useState('Preparation, Strategy');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Poll Form State
  const [enablePoll, setEnablePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [pollOption3, setPollOption3] = useState('');
  const [pollOption4, setPollOption4] = useState('');

  // Form State - New Circle
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupExam, setGroupExam] = useState(selectedExam);

  // Report Form State
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'forum') {
      fetchPosts();
    }
  }, [selectedGroupId, searchQuery, selectedTag, feedFilter, sortMode, activeSubTab]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/community/groups', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
        if (!postTargetGroupId && data.groups.length > 0) {
          setPostTargetGroupId(data.groups[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGroupId) params.set('groupId', selectedGroupId);
      if (searchQuery) params.set('search', searchQuery);
      if (selectedTag) params.set('tag', selectedTag);
      if (feedFilter !== 'all') params.set('filter', feedFilter);
      if (sortMode !== 'recent') params.set('sort', sortMode);

      const url = `/api/community/posts?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/community/groups/${groupId}/join`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setGroups((prev) =>
          prev.map((g) => (g.id === groupId ? { ...g, isJoined: data.isJoined, memberCount: data.memberCount } : g))
        );
        showToast(data.isJoined ? 'Joined circle successfully!' : 'Left circle.');
      }
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !groupDescription) return;

    try {
      const res = await fetch('/api/community/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          exam: groupExam,
          category: 'public',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroups((prev) => [...prev, data.group]);
        setShowCreateGroupModal(false);
        setGroupName('');
        setGroupDescription('');
        showToast(`Circle "${data.group.name}" created!`);
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleVotePost = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voteType,
          userId: userProfile.id || 'usr_guest_101',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  score: data.score,
                  upvotesCount: data.upvotesCount,
                  downvotesCount: data.downvotesCount,
                  userVote: data.userVote,
                  isLiked: data.isLiked,
                  likesCount: data.likesCount,
                }
              : p
          )
        );
      } else {
        showToast(data.error || 'Unable to register vote.');
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      showToast('Network error while voting.');
    }
  };

  const handleLikePost = async (postId: string) => {
    return handleVotePost(postId, 'up');
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/bookmark`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, isBookmarked: data.isBookmarked } : p))
        );
        showToast(data.isBookmarked ? 'Saved to Bookmarked discussions' : 'Removed from Bookmarks');
      }
    } catch (err) {
      console.error('Failed to bookmark post:', err);
    }
  };

  const handleVotePoll = async (postId: string, optionId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/poll-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, poll: data.poll } : p)));
        showToast('Vote recorded!');
      }
    } catch (err) {
      console.error('Failed to record poll vote:', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (openCommentSectionPostId === postId) {
      setOpenCommentSectionPostId(null);
      return;
    }

    setOpenCommentSectionPostId(postId);
    if (!expandedPostComments[postId]) {
      setLoadingCommentsPostId(postId);
      try {
        const res = await fetch(`/api/community/posts/${postId}/comments`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setExpandedPostComments((prev) => ({ ...prev, [postId]: data.comments }));
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setLoadingCommentsPostId(null);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputMap[postId] || '').trim();
    if (!text) return;

    setSubmittingCommentPostId(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          authorName: userProfile.name,
          authorAvatar: userProfile.avatar_url,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExpandedPostComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, repliesCount: data.repliesCount } : p))
        );
        setCommentInputMap((prev) => ({ ...prev, [postId]: '' }));
        showToast('Comment published!');
      }
    } catch (err) {
      console.error('Failed to publish comment:', err);
    } finally {
      setSubmittingCommentPostId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        showToast('Discussion deleted.');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleSharePost = (post: CommunityPost) => {
    const shareUrl = `${window.location.origin}?tab=community&postId=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.title}\n${shareUrl}`);
      showToast('Discussion link & title copied to clipboard!');
    } else {
      showToast('Share: ' + post.title);
    }
  };

  const handleTipPost = async (post: CommunityPost, amount: number) => {
    setIsTipping(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userProfile.id,
          senderName: userProfile.name,
          amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, tippedCoins: (p.tippedCoins || 0) + amount } : p))
        );
        showToast(data.message || `Tipped ${amount} coins to ${post.authorName}!`);
        setTippingPost(null);
      } else {
        showToast(data.error || 'Failed to tip coins.');
      }
    } catch (err) {
      showToast('Network error while tipping.');
    } finally {
      setIsTipping(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postContent) return;

    try {
      const tagsArr = postTags.split(',').map((t) => t.trim()).filter(Boolean);
      
      const attachmentsArr = attachmentName ? [
        {
          name: attachmentName,
          type: (attachmentName.endsWith('.pdf') ? 'pdf' : 'image') as 'pdf' | 'image' | 'link' | 'code' | 'audio',
          url: attachmentUrl || '#',
          size: '1.5 MB'
        }
      ] : undefined;

      const pollObj = enablePoll && pollQuestion.trim() && pollOption1.trim() && pollOption2.trim() ? {
        question: pollQuestion.trim(),
        options: [pollOption1, pollOption2, pollOption3, pollOption4].filter((o) => o.trim().length > 0)
      } : undefined;

      const targetGrp = postTargetGroupId || selectedGroupId || groups[0]?.id || 'grp_upsc_general';

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: targetGrp,
          title: postTitle,
          content: postContent,
          tags: tagsArr,
          authorName: userProfile.name,
          attachments: attachmentsArr,
          poll: pollObj
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPosts([data.post, ...posts]);
        setPostTitle('');
        setPostContent('');
        setAttachmentName('');
        setAttachmentUrl('');
        setEnablePoll(false);
        setPollQuestion('');
        setPollOption1('');
        setPollOption2('');
        setPollOption3('');
        setPollOption4('');
        setShowCreateModal(false);
        showToast('New discussion published successfully!');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const handleReportAbuse = async (postId: string) => {
    if (!reportReason) return;
    try {
      await fetch('/api/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'post',
          contentId: postId,
          reason: reportReason,
          reporterName: userProfile.name,
        }),
      });
      showToast('Abuse report submitted to Moderation Team.');
      setShowReportModal(null);
      setReportReason('');
    } catch (err) {
      console.error('Failed to submit report:', err);
    }
  };

  const POPULAR_TAGS = ['Polity', 'PYQ', 'Mains Answer Writing', 'Strategy', 'Quant', 'Current Affairs', 'Economy'];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Aspirant Community Network</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Peer Learning Circles & Live Study Rooms</h1>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Collaborate with toppers, post questions, share answer evaluation notes, and participate in daily live study rooms.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Start Discussion</span>
          </button>
        </div>
      </div>

      {/* SUB TAB NAVIGATION */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('forum')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'forum'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discussions & Q&A Forum</span>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-black">{posts.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wallet')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'wallet'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>🪙 Token Hub & Payouts</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black">Razorpay</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chat_rooms')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeSubTab === 'chat_rooms'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>Live Study Rooms & AI Moderator Chat</span>
        </button>
      </div>

      {/* VIEW MODE 1: LIVE CHAT ROOMS */}
      {activeSubTab === 'chat_rooms' && (
        <CommunityChat user={userProfile} onOpenPremium={onOpenPremium} />
      )}

      {/* VIEW MODE 2: TOKEN HUB & WALLET */}
      {activeSubTab === 'wallet' && (
        <CommunityWallet userProfile={userProfile} onOpenPremium={onOpenPremium} />
      )}

      {/* VIEW MODE 2: DISCUSSIONS FORUM */}
      {activeSubTab === 'forum' && (
        <div className="space-y-6">
          {/* CONTROL BAR: SEARCH, FILTERS, SORTS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
              {/* SEARCH BAR */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, tags, or doubts..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* FEED FILTER & SORT CONTROLS */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {/* FEED FILTER BUTTONS */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setFeedFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      feedFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    All Feed
                  </button>
                  <button
                    onClick={() => setFeedFilter('bookmarked')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                      feedFilter === 'bookmarked' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>Saved</span>
                  </button>
                  <button
                    onClick={() => setFeedFilter('my_posts')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      feedFilter === 'my_posts' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    My Discussions
                  </button>
                </div>

                {/* SORT DROPDOWN */}
                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-500">Sort:</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as any)}
                    className="bg-transparent font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Latest First</option>
                    <option value="popular">Most Liked</option>
                    <option value="discussed">Most Replied</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TAG CHIPS */}
            <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Tags:</span>
              <button
                onClick={() => setSelectedTag('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  selectedTag === '' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT SIDEBAR: LEARNING CIRCLES / GROUPS */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Learning Circles</h3>
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center text-[11px] font-bold space-x-1"
                    title="Create New Circle"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Circle</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedGroupId(null)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                    selectedGroupId === null
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>All Feed Discussions</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-extrabold">
                    {posts.length}
                  </span>
                </button>

                <div className="space-y-2">
                  {groups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGroupId(g.id)}
                        className={`p-3 rounded-xl cursor-pointer text-xs transition-all border ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-200 shadow-xs'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold line-clamp-1 ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                            {g.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                          {g.description}
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                          <span>{g.memberCount} members</span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleJoinGroup(g.id, e)}
                            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                              g.isJoined
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white'
                            }`}
                          >
                            {g.isJoined ? 'Joined ✓' : '+ Join'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MAIN DISCUSSIONS FEED */}
            <div className="lg:col-span-3 space-y-4">
              {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="text-xs font-bold text-slate-600">Loading Community Discussions...</div>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">No discussions found in this circle.</div>
                  <p className="text-xs text-slate-500">Be the first to post a doubt, PYQ solution, or strategy guide!</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Start New Discussion
                  </button>
                </div>
              ) : (
                posts.map((post) => {
                  const isCommentsExpanded = openCommentSectionPostId === post.id;
                  const commentsList = expandedPostComments[post.id] || [];
                  const isCommentsLoading = loadingCommentsPostId === post.id;

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                    >
                      {/* POST AUTHOR HEADER */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <img
                            src={post.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                            alt={post.authorName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-sm">{post.authorName}</span>
                              {post.authorRole && (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100">
                                  {post.authorRole}
                                </span>
                              )}
                              {post.isPinned && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200 flex items-center space-x-1">
                                  <Pin className="w-3 h-3 fill-amber-500" />
                                  <span>Pinned</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {post.groupName} • {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleBookmarkPost(post.id)}
                            className={`p-1.5 rounded-lg transition-all text-xs ${
                              post.isBookmarked
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={post.isBookmarked ? 'Saved' : 'Bookmark Discussion'}
                          >
                            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-indigo-600' : ''}`} />
                          </button>

                          <button
                            onClick={() => setShowReportModal(post.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-xs"
                            title="Report Abuse"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>

                          {(post.authorId === 'usr_curr' || userProfile.role === 'ADMIN') && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-xs"
                              title="Delete Post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* POST TITLE & CONTENT */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{post.title}</h3>
                        <p className="text-slate-700 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {/* INTERACTIVE POLL IF PRESENT */}
                      {post.poll && (
                        <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                              <BarChart2 className="w-4 h-4 text-indigo-600" />
                              <span>{post.poll.question}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {post.poll.totalVotes} Total Votes
                            </span>
                          </div>

                          <div className="space-y-2">
                            {post.poll.options.map((opt) => {
                              const isSelected = post.poll?.userVotedOptionId === opt.id;
                              const pct = post.poll?.totalVotes && post.poll.totalVotes > 0
                                ? Math.round((opt.votes / post.poll.totalVotes) * 100)
                                : 0;

                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleVotePoll(post.id, opt.id)}
                                  className={`w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition-all text-xs ${
                                    isSelected
                                      ? 'border-indigo-600 bg-indigo-100/60 font-bold text-indigo-950 shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                                  }`}
                                >
                                  {/* VOTE PERCENTAGE FILL BAR */}
                                  <div
                                    className="absolute left-0 top-0 bottom-0 bg-indigo-200/50 pointer-events-none transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  ></div>

                                  <div className="relative z-10 flex justify-between items-center">
                                    <span className="flex items-center space-x-2">
                                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                      <span>{opt.text}</span>
                                    </span>
                                    <span className="text-[11px] font-extrabold text-indigo-700">
                                      {pct}% ({opt.votes})
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ATTACHMENTS */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {post.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                            >
                              <FileText className="w-4 h-4 text-indigo-600" />
                              <span>{att.name}</span>
                              <span className="text-[10px] text-slate-400">({att.size || 'Attachment'})</span>
                              <Download className="w-3.5 h-3.5 ml-1" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* TAGS */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* ACTIONS BAR */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
                        <div className="flex items-center space-x-3">
                          {/* REDDIT-STYLE UPVOTE / SCORE / DOWNVOTE */}
                          <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5 border border-slate-200">
                            <button
                              onClick={() => handleVotePost(post.id, 'up')}
                              className={`p-1.5 rounded-lg transition-all flex items-center ${
                                post.userVote === 'up' || (post.userVote === undefined && post.isLiked)
                                  ? 'text-orange-600 bg-orange-100 font-black shadow-xs'
                                  : 'text-slate-500 hover:text-orange-600 hover:bg-slate-200/70'
                              }`}
                              title="Upvote (Helpful/High Quality)"
                            >
                              <ArrowBigUp className={`w-4 h-4 ${post.userVote === 'up' || (post.userVote === undefined && post.isLiked) ? 'fill-orange-600' : ''}`} />
                            </button>

                            <span
                              className={`px-2 text-xs font-black min-w-[28px] text-center ${
                                (post.score ?? post.likesCount ?? 0) > 0
                                  ? 'text-orange-600'
                                  : (post.score ?? post.likesCount ?? 0) < 0
                                  ? 'text-indigo-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {post.score ?? post.likesCount ?? 0}
                            </span>

                            <button
                              onClick={() => handleVotePost(post.id, 'down')}
                              className={`p-1.5 rounded-lg transition-all flex items-center ${
                                post.userVote === 'down'
                                  ? 'text-indigo-600 bg-indigo-100 font-black shadow-xs'
                                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200/70'
                              }`}
                              title="Downvote (Low Quality/Irrelevant)"
                            >
                              <ArrowBigDown className={`w-4 h-4 ${post.userVote === 'down' ? 'fill-indigo-600' : ''}`} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleComments(post.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all ${
                              isCommentsExpanded
                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.repliesCount || 0} Replies</span>
                          </button>

                          <button
                            onClick={() => setTippingPost(post)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all text-amber-600 bg-amber-50 hover:bg-amber-100 font-bold border border-amber-200/60"
                            title="Tip study tokens to author"
                          >
                            <Coins className="w-4 h-4 fill-amber-400 text-amber-600" />
                            <span>{post.tippedCoins ? `${post.tippedCoins} Tipped` : 'Tip Coins'}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleSharePost(post)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all text-xs"
                          title="Share post"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* EXPANDED INTERACTIVE COMMENT SECTION */}
                      {isCommentsExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 bg-slate-50/70 -mx-5 -mb-5 p-5 rounded-b-2xl">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Peer Answers & Discussion Comments ({commentsList.length})</span>
                          </h4>

                          {/* COMMENTS LIST */}
                          {isCommentsLoading ? (
                            <div className="text-center py-4 text-xs text-slate-400">Loading replies...</div>
                          ) : commentsList.length === 0 ? (
                            <div className="text-xs text-slate-400 py-2">No comments yet. Write the first answer or peer review!</div>
                          ) : (
                            <div className="space-y-3">
                              {commentsList.map((cmt) => (
                                <div key={cmt.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                      <img
                                        src={cmt.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                                        alt={cmt.authorName}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                      <span className="font-bold text-xs text-slate-900">{cmt.authorName}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 whitespace-pre-line pl-8">{cmt.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ADD COMMENT INPUT FORM */}
                          <div className="flex items-center space-x-2 pt-2">
                            <input
                              type="text"
                              value={commentInputMap[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                              placeholder="Write a peer answer or comment..."
                              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={submittingCommentPostId === post.id || !(commentInputMap[post.id] || '').trim()}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center space-x-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW DISCUSSION */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Start New Community Discussion</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Study Circle</label>
                <select
                  value={postTargetGroupId}
                  onChange={(e) => setPostTargetGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.exam})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title / Question Headline</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. How to structure GS-2 Mains answers on Supreme Court Judgements?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Content / Details</label>
                <textarea
                  required
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Provide context, handwritten notes summary, or questions for fellow aspirants..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="Polity, Strategy, MainsAnswer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* ATTACHMENT OPTION */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Attach Document or Answer PDF Link (Optional)</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Document Name (e.g. GS2_Notes.pdf)"
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="Download / Preview URL"
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* POLL CREATOR OPTION */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Include Interactive Peer Poll</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={enablePoll}
                    onChange={(e) => setEnablePoll(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {enablePoll && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Poll Question (e.g. Which subject requires maximum revision for Prelims?)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={pollOption1}
                        onChange={(e) => setPollOption1(e.target.value)}
                        placeholder="Option 1"
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={pollOption2}
                        onChange={(e) => setPollOption2(e.target.value)}
                        placeholder="Option 2"
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={pollOption3}
                        onChange={(e) => setPollOption3(e.target.value)}
                        placeholder="Option 3 (Optional)"
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={pollOption4}
                        onChange={(e) => setPollOption4(e.target.value)}
                        placeholder="Option 4 (Optional)"
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Publish Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW LEARNING CIRCLE */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Create Custom Study Circle</span>
              </h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Circle Name</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Geography Optional Mapping Group"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description & Rules</label>
                <textarea
                  required
                  rows={3}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Describe the focus of this learning circle..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Exam Category</label>
                <select
                  value={groupExam}
                  onChange={(e) => setGroupExam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="UPSC_CSE">UPSC CSE</option>
                  <option value="SSC_CGL">SSC CGL / CHSL</option>
                  <option value="STATE_PSC">State PSC (UPPSC/BPSC/MPPSC)</option>
                  <option value="OTHER">General Knowledge & Aptitude</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Create Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REPORT ABUSE */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Report Abuse to Moderation Team</span>
            </h3>
            <p className="text-slate-600 text-xs">
              Please specify why you are reporting this discussion.
            </p>

            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Spam, offensive content, or misleading information"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            ></textarea>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReportAbuse(showReportModal)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TIP STUDY COINS TO AUTHOR */}
      {tippingPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Coins className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Tip Study Tokens</h3>
                  <p className="text-[11px] text-slate-400">Reward {tippingPost.authorName} for high-yield content</p>
                </div>
              </div>
              <button
                onClick={() => setTippingPost(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <p className="text-xs font-bold text-slate-200 line-clamp-1">"{tippingPost.title}"</p>
              <p className="text-[11px] text-slate-400">Author receives 100% of tipped tokens instantly.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Select Coin Amount:</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTipAmount(amt)}
                    className={`py-2 rounded-xl border text-xs font-extrabold transition-all flex flex-col items-center justify-center ${
                      tipAmount === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>🪙 {amt}</span>
                    <span className="text-[9px] font-normal opacity-80">₹{(amt * 0.1).toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setTippingPost(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTipPost(tippingPost, tipAmount)}
                disabled={isTipping}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isTipping ? 'Transferring...' : `Send 🪙 ${tipAmount} Coins`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
