import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage, ExamType, AiMentorMode, AiConversation, MainsEvaluationResult } from '../types';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCcw,
  Copy,
  Check,
  AlertTriangle,
  Pin,
  Trash2,
  Edit2,
  Plus,
  Search,
  BookOpen,
  FileText,
  Award,
  Scale,
  Calendar,
  Zap,
  Mic,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Download,
  Square,
  ChevronRight,
  X,
  Layers,
  BarChart2,
  FileCheck2,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

interface AiStudyChatProps {
  exam: ExamType;
  userId?: string;
  userEmail?: string;
}

const MENTOR_MODES: { id: AiMentorMode; label: string; icon: any; description: string; color: string }[] = [
  { id: 'general', label: 'General Mentor', icon: Brain, description: 'Open-ended GS, Optional, & Exam guidance', color: 'from-blue-500 to-cyan-500' },
  { id: 'ncert_mentor', label: 'NCERT Master', icon: BookOpen, description: 'Class 6-12 NCERT concepts & analogies', color: 'from-emerald-500 to-teal-500' },
  { id: 'mains_evaluator', label: 'Mains Evaluator', icon: FileCheck2, description: 'Answer outline & rubric grading', color: 'from-amber-500 to-orange-500' },
  { id: 'essay_evaluator', label: 'Essay Evaluator', icon: FileText, description: 'PESTLE framework & thesis grading', color: 'from-purple-500 to-indigo-500' },
  { id: 'ethics_analyst', label: 'Ethics Specialist', icon: Scale, description: 'GS-4 case studies & dilemma matrix', color: 'from-rose-500 to-pink-500' },
  { id: 'pyq_solver', label: 'PYQ & Tricks', icon: Award, description: 'Past 10 years elimination & frameworks', color: 'from-yellow-500 to-amber-500' },
  { id: 'study_planner', label: 'Study Timetable', icon: Calendar, description: 'Personalized UPSC daily/weekly routine', color: 'from-cyan-500 to-blue-500' },
  { id: 'revision_coach', label: 'Spaced Revision', icon: Zap, description: 'Mnemonics & high-yield flashcard summaries', color: 'from-violet-500 to-purple-500' },
  { id: 'mock_interview', label: 'Mock Interview', icon: Mic, description: 'DAF questioning & personality test simulation', color: 'from-fuchsia-500 to-pink-500' },
];

export const AiStudyChat: React.FC<AiStudyChatProps> = ({ exam, userId, userEmail }) => {
  const effectiveEmail = userEmail || (userId && userId.includes('@') ? userId : undefined) || 'guest@aspirantx.in';
  const getStorageKey = (key: string) => `aspirantx_ai_${key}_${userId || userEmail || 'guest'}`;

  // State Management
  const [activeMode, setActiveMode] = useState<AiMentorMode>('general');
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDrawer, setShowDrawer] = useState<boolean>(true);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  // Mains Evaluator Modal State
  const [showEvaluatorModal, setShowEvaluatorModal] = useState<boolean>(false);
  const [evalQuestion, setEvalQuestion] = useState<string>('');
  const [evalAnswer, setEvalAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<MainsEvaluationResult | null>(null);

  // Streaming Controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Cleanup SSE stream on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load Conversations List
  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/ai/conversations?email=${encodeURIComponent(effectiveEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          if (!activeConvId && data.conversations.length > 0) {
            setActiveConvId(data.conversations[0].id);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch server conversations, using local storage backup');
    }

    // Fallback to LocalStorage
    const raw = localStorage.getItem(getStorageKey('convs'));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setConversations(parsed);
        if (!activeConvId && parsed.length > 0) {
          setActiveConvId(parsed[0].id);
        }
      } catch (e) {}
    } else {
      // Create default initial conversation
      createNewConversation('Initial UPSC Study Session');
    }
  };

  // Load Messages for Active Conversation
  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch messages from server, checking local backup');
    }

    const raw = localStorage.getItem(getStorageKey(`msgs_${convId}`));
    if (raw) {
      try {
        setMessages(JSON.parse(raw));
        return;
      } catch (e) {}
    }

    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: `Hello Aspirant! I am your AspirantX Enterprise AI Mentor calibrated for ${exam}.\n\nHow can I help you today? Select a specialized mentor mode above (NCERT, Mains Evaluator, PYQ Elimination, Ethics Case Study) or ask your question directly!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  useEffect(() => {
    fetchConversations();
  }, [userId, userEmail]);

  useEffect(() => {
    const prefillQuery = localStorage.getItem('aspirantx_ai_prefill_query');
    const prefillMode = localStorage.getItem('aspirantx_ai_prefill_mode');
    if (prefillQuery) {
      setInput(prefillQuery);
      if (prefillMode) {
        setActiveMode(prefillMode as any);
      }
      localStorage.removeItem('aspirantx_ai_prefill_query');
      localStorage.removeItem('aspirantx_ai_prefill_mode');
    }
  }, [userId, userEmail, activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      const activeConv = conversations.find((c) => c.id === activeConvId);
      if (activeConv) {
        setActiveMode(activeConv.mode || 'general');
      }
    }
  }, [activeConvId]);

  // Persist Local Backup
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(getStorageKey('convs'), JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (activeConvId && messages.length > 0) {
      localStorage.setItem(getStorageKey(`msgs_${activeConvId}`), JSON.stringify(messages));
    }
  }, [messages, activeConvId]);

  // Create New Conversation
  const createNewConversation = async (customTitle?: string) => {
    const newId = `conv_${Date.now()}`;
    const newConv: AiConversation = {
      id: newId,
      userEmail: effectiveEmail,
      title: customTitle || `Study Session #${conversations.length + 1}`,
      exam,
      mode: activeMode,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setMessages([
      {
        id: `init_${Date.now()}`,
        sender: 'assistant',
        text: `New AI Study Session initialized in **${MENTOR_MODES.find((m) => m.id === activeMode)?.label}** mode.\n\nAsk any question regarding ${exam} syllabus, request answer evaluation, or generate mnemonics!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConv),
      });
    } catch (e) {}
  };

  // Toggle Pin Conversation
  const togglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    const target = conversations.find((c) => c.id === id);
    if (target) {
      try {
        await fetch(`/api/ai/conversations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPinned: !target.isPinned }),
        });
      } catch (err) {}
    }
  };

  // Delete Conversation
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    localStorage.removeItem(getStorageKey(`msgs_${id}`));

    if (activeConvId === id) {
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
      } else {
        createNewConversation();
      }
    }

    try {
      await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
    } catch (err) {}
  };

  // Rename Conversation
  const handleSaveTitle = async (id: string) => {
    if (!editingTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: editingTitle.trim() } : c))
    );
    setEditingConvId(null);

    try {
      await fetch(`/api/ai/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
    } catch (err) {}
  };

  // Handle SSE Streaming Message Send
  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    if (!activeConvId) {
      await createNewConversation();
    }

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `a_${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    if (!textToSend) setInput('');
    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers,
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          conversationId: activeConvId,
          message: messageText.trim(),
          exam,
          mode: activeMode,
          history: messages.slice(-6),
          userEmail: effectiveEmail,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium Subscription required for AI Mentor access.');
        }
        throw new Error('Failed to connect to AI Mentor streaming service.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('ReadableStream not supported by browser.');

      try {
        let accumulatedText = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataJson = line.replace('data: ', '').trim();
              if (!dataJson) continue;

              try {
                const parsed = JSON.parse(dataJson);
                if (parsed.error) {
                  setError(parsed.error);
                }
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, text: accumulatedText, isStreaming: true }
                        : m
                    )
                  );
                }
                if (parsed.done) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                    )
                  );
                }
              } catch (err) {}
            }
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {}
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          )
        );
      } else {
        console.warn('AI Mentor stream error, generating local diagnostic response fallback:', err);
        // Smart Academic Diagnostic Offline Fallback
        const qLower = messageText.toLowerCase();
        let fallbackText = `**AspirantX AI Study Mentor (${exam} Guidance):**\n\n`;
        if (qLower.includes('syllabus') || qLower.includes('pattern')) {
          fallbackText += `For **${exam}**, focus on high-weightage core subjects first. Complete your NCERT/standard fundamentals, practice at least 50 MCQs daily, and revise previous year questions (PYQs) from the dedicated PYQ tab.`;
        } else if (qLower.includes('revision') || qLower.includes('plan') || qLower.includes('strategy')) {
          fallbackText += `Here is your high-yield strategy for **${exam}**:\n1. **Concept Consolidation**: Dedicate 60% of morning focus blocks to heavy topics.\n2. **Active Recall**: Use the Active Recall Decks tab.\n3. **CBT Speed Testing**: Take weekly full-length tests in the CBT simulator.`;
        } else {
          fallbackText += `Analyzing your query regarding: *"${messageText.trim()}"*.\n\nKey Academic Takeaway for **${exam}**:\n- **Conceptual Core**: Ensure your foundational definitions are memorized using active recall.\n- **Application**: Verify this topic against past 10-year trends in the PYQ section.\n- **Error Log**: Add any tricky formulas or edge-cases to your revision notes.`;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, text: fallbackText, isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Submit Feedback (Like/Dislike)
  const handleFeedback = async (msgId: string, feedbackType: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: feedbackType } : m))
    );

    try {
      await fetch(`/api/ai/messages/${msgId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackType, conversationId: activeConvId }),
      });
    } catch (e) {}
  };

  // Copy Text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Markdown
  const handleExportMarkdown = () => {
    const mdContent = `# AspirantX AI Mentor Session: ${
      conversations.find((c) => c.id === activeConvId)?.title || 'Study Session'
    }\n\nDate: ${new Date().toLocaleDateString()}\nExam Target: ${exam}\nMentor Mode: ${activeMode}\n\n---\n\n` +
      messages.map((m) => `### **${m.sender.toUpperCase()}** (${m.timestamp}):\n\n${m.text}\n\n`).join('---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AspirantX_AI_Session_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Execute Mains Answer Evaluation
  const handleRunEvaluation = async () => {
    if (!evalAnswer.trim() || evalAnswer.trim().length < 10) {
      alert('Please enter at least 10 characters for answer evaluation.');
      return;
    }

    setIsEvaluating(true);
    setEvalResult(null);

    try {
      const res = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: evalQuestion,
          answerText: evalAnswer,
          exam,
          type: 'mains',
        }),
      });

      const data = await res.json();
      if (data && data.success && data.evaluation) {
        setEvalResult(data.evaluation);
      } else {
        alert(data.error || 'Failed to complete AI answer evaluation');
      }
    } catch (e: any) {
      alert('Error connecting to evaluation engine: ' + e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentModeInfo = MENTOR_MODES.find((m) => m.id === activeMode) || MENTOR_MODES[0];

  return (
    <div className="flex h-[calc(100vh-10rem)] max-w-7xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-blue-950/20 relative">
      {/* 📁 LEFT DRAWER: CONVERSATIONS & SESSIONS */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '280px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-slate-950/90 border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden relative z-20"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Study Sessions
                </span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Hide Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Session Button & Search */}
            <div className="p-3 space-y-2 border-b border-slate-800/60">
              <button
                onClick={() => createNewConversation()}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New AI Session</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`group relative p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 font-bold'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {conv.isPinned ? (
                        <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                      )}

                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(conv.id)}
                          onBlur={() => handleSaveTitle(conv.id)}
                          autoFocus
                          className="w-full bg-slate-900 border border-cyan-500 px-1.5 py-0.5 rounded text-xs text-white"
                        />
                      ) : (
                        <span className="truncate text-[11px]">{conv.title}</span>
                      )}
                    </div>

                    {/* Actions on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => togglePin(conv.id, e)}
                        className="p-1 hover:text-amber-400"
                        title={conv.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setEditingTitle(conv.title);
                        }}
                        className="p-1 hover:text-cyan-400"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="p-1 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 RIGHT CHAT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Workspace Top Header */}
        <div className="p-3 px-6 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!showDrawer && (
              <button
                onClick={() => setShowDrawer(true)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                title="Show Sessions Drawer"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>

            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 truncate">
                <span>AspirantX Enterprise AI Mentor</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest hidden sm:inline-block">
                  Gemini 3.6 SSE
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-2">
                <span>Exam Target: <strong className="text-slate-200">{exam}</strong></span>
                <span>•</span>
                <span>Mode: <strong className="text-cyan-300">{currentModeInfo.label}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mains Evaluator Modal Button */}
            <button
              onClick={() => setShowEvaluatorModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Open Mains Answer & Essay Evaluator"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Mains Evaluator</span>
            </button>

            {/* Export Markdown */}
            <button
              onClick={handleExportMarkdown}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5 transition-all"
              title="Export Conversation (.md)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 🎯 SPECIALIZED UPSC MENTOR MODE SELECTOR */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
            Mentor Mode:
          </span>
          {MENTOR_MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;

            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? `bg-gradient-to-r ${m.color} text-slate-950 font-black shadow-md shadow-cyan-500/10`
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                }`}
                title={m.description}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* 📜 MESSAGES STREAM VIEW */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Rich Markdown & LaTeX Math Rendering */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : (
                      <div className="prose prose-invert prose-xs sm:prose-sm max-w-none space-y-2">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.text || (msg.isStreaming ? 'Thinking...' : '')}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Actions Bar for Assistant Messages */}
                    {!isUser && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleFeedback(msg.id, 'like')}
                          className={`hover:text-emerald-400 flex items-center gap-1 ${
                            msg.feedback === 'like' ? 'text-emerald-400 font-bold' : ''
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleFeedback(msg.id, 'dislike')}
                          className={`hover:text-rose-400 flex items-center gap-1 ${
                            msg.feedback === 'dislike' ? 'text-rose-400 font-bold' : ''
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 mt-1 block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Streaming & Stop Generation Bar */}
          {loading && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>AI Mentor streaming real-time response...</span>
              </div>
              <button
                onClick={handleStopStream}
                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1 text-[11px]"
              >
                <Square className="w-3 h-3 fill-rose-300" /> Stop Stream
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ⌨️ BOTTOM INPUT BAR */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder={`Ask AI Mentor in [${currentModeInfo.label}] mode...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>

      {/* 📄 MODAL: MAINS ANSWER & ESSAY EVALUATOR */}
      <AnimatePresence>
        {showEvaluatorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      UPSC Mains Answer & Essay Evaluator
                    </h3>
                    <p className="text-xs text-slate-400">
                      Rubric-based evaluation engine for GS 1-4 papers & Essay draft analysis.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowEvaluatorModal(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Input Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    UPSC GS / Essay Question (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Discuss the constitutional significance of Article 356 and Supreme Court safeguards in S.R. Bommai case."
                    value={evalQuestion}
                    onChange={(e) => setEvalQuestion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Your Written Answer / Essay Outline *
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste your full written answer or bulleted outline here..."
                    value={evalAnswer}
                    onChange={(e) => setEvalAnswer(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <button
                  onClick={handleRunEvaluation}
                  disabled={isEvaluating || !evalAnswer.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Evaluating Answer Rubric...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Run AI Answer Evaluation</span>
                    </>
                  )}
                </button>
              </div>

              {/* Evaluation Results Card */}
              {evalResult && (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
                  {/* Score Rings */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="text-xl font-black text-amber-400">{evalResult.totalScore} / 10</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Overall Grade</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-sm font-bold text-cyan-400">{evalResult.structureScore} / 10</div>
                      <div className="text-[10px] text-slate-400 uppercase">Structure</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-sm font-bold text-emerald-400">{evalResult.contentScore} / 10</div>
                      <div className="text-[10px] text-slate-400 uppercase">Content</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-sm font-bold text-purple-400">{evalResult.keywordsScore} / 10</div>
                      <div className="text-[10px] text-slate-400 uppercase">Keywords</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-sm font-bold text-blue-400">{evalResult.wayForwardScore} / 10</div>
                      <div className="text-[10px] text-slate-400 uppercase">Way Forward</div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                      <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Key Strengths
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {evalResult.strengths?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                      <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {evalResult.weaknesses?.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Missed Keywords */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Missed Keywords & Constitutional References
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {evalResult.missedKeywords?.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Model Blueprint */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Model Answer Blueprint
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {evalResult.modelAnswerBlueprint}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
