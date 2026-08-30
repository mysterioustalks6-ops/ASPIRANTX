import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, RoomMessage, RoomMessageAttachment } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Users, 
  Send, 
  Paperclip, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCcw, 
  Award, 
  Calendar,
  Lock,
  MessageSquare
} from 'lucide-react';

export const EXAMS = [
  'UPSC CSE', 'SSC CGL/CHSL', 'Banking (IBPS/SBI)', 'Railways (RRB)',
  'State PSC', 'Defence (NDA/CDS)', 'Teaching (CTET)'
];

interface StudyBuddyProps {
  user: UserProfile | null;
  onNavigate?: (tab: string) => void;
}

export const StudyBuddy: React.FC<StudyBuddyProps> = ({ user, onNavigate }) => {
  const [selectedExam, setSelectedExam] = useState<string>(user?.exam || 'UPSC CSE');
  const [targetYear, setTargetYear] = useState<number>(user?.targetYear || 2026);
  
  const [status, setStatus] = useState<'unmatched' | 'waiting' | 'matched'>('unmatched');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [buddyEmail, setBuddyEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chat state when matched
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [attachment, setAttachment] = useState<RoomMessageAttachment | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [securityBlockedAlert, setSecurityBlockedAlert] = useState<{ reason: string; category: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // Check initial status on mount
  useEffect(() => {
    checkBuddyStatus();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Poll status when waiting
  useEffect(() => {
    if (status === 'waiting') {
      pollIntervalRef.current = setInterval(() => {
        checkBuddyStatus();
      }, 5000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status]);

  // Load chat messages when matched
  useEffect(() => {
    if (status === 'matched' && roomId) {
      fetchRoomMessages(roomId);

      if (isSupabaseConfigured) {
        const channel = supabase
          .channel(`public:community_messages:${roomId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `room=eq.${roomId}` },
            (payload) => {
              const newMsg = payload.new as RoomMessage;
              if (newMsg && newMsg.room === roomId) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [status, roomId]);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkBuddyStatus = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/buddy/status?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'matched' && data.roomId) {
          setStatus('matched');
          setRoomId(data.roomId);
          setBuddyEmail(data.buddyEmail || 'Aspirant Peer');
        } else if (data.status === 'waiting') {
          setStatus('waiting');
        } else {
          if (status === 'waiting') {
            setStatus('unmatched');
          }
        }
      }
    } catch (e) {
      console.error('Error checking buddy status:', e);
    }
  };

  const fetchRoomMessages = async (rId: string) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('community_messages')
          .select('*')
          .eq('room', rId)
          .order('timestamp', { ascending: true });

        if (!error && data) {
          setMessages(data);
          return;
        }
      }
      // Fallback local
      const local = localStorage.getItem(`study_buddy_chat_${rId}`);
      if (local) {
        setMessages(JSON.parse(local));
      } else {
        setMessages([
          {
            id: 'init_buddy',
            room: rId,
            senderId: 'system',
            senderName: 'Study Buddy Bot',
            isBot: true,
            text: 'You are now connected with your Study Buddy! Share your daily targets, quiz scores, and motivate each other to crack the exam.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: 1,
          },
        ]);
      }
    } catch (e) {
      console.error('Error fetching room messages:', e);
    }
  };

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please login to find a study buddy.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/buddy/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: selectedExam,
          targetYear,
          email: user.email,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.matched) {
          setStatus('matched');
          setRoomId(data.roomId);
          setBuddyEmail(data.buddyEmail || 'Aspirant Peer');
        } else if (data.waiting) {
          setStatus('waiting');
        }
      } else {
        setErrorMessage(data.error || 'Failed to join queue.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueueOrMatch = async () => {
    try {
      await fetch('/api/buddy/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      setStatus('unmatched');
      setRoomId(null);
      setBuddyEmail(null);
      setMessages([]);
    } catch (e) {
      console.error('Error leaving buddy match:', e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setAttachment({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        url: url || '#',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isEvaluating || !roomId) return;

    const textToSend = input.trim();
    const currentAttachment = attachment;

    setInput('');
    setAttachment(null);
    setIsEvaluating(true);

    try {
      // Moderate message with Gemini AI middleware
      const modRes = await fetch('/api/gemini/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          fileName: currentAttachment ? currentAttachment.name : '',
          user: user?.name || 'Aspirant',
          room: roomId,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const modData = await modRes.json();
      if (!modData.safe) {
        setIsEvaluating(false);
        if (modData.banned) {
          alert('Account suspended for community guideline violations.');
          window.location.reload();
          return;
        }
        setSecurityBlockedAlert({
          reason: modData.reason || 'Message flagged by AI safety filter.',
          category: modData.category || 'abuse',
        });
        return;
      }

      const userMsg: RoomMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        room: roomId,
        senderId: user?.id || 'guest',
        senderName: user?.name || 'Aspirant',
        senderAvatar: user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        text: textToSend,
        attachment: currentAttachment || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
      };

      setMessages((prev) => [...prev, userMsg]);
      localStorage.setItem(`study_buddy_chat_${roomId}`, JSON.stringify([...messages, userMsg]));

      if (isSupabaseConfigured) {
        await supabase.from('community_messages').insert([userMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/80 p-8 border border-indigo-500/20 backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Users className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Peer Accountability Matching
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Study Buddy Matcher 🤝</h1>
          <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
            Get paired 1-on-1 with a verified aspirant preparing for the exact same exam and target year. Share study schedules, quiz each other, and stay accountable.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {status === 'unmatched' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 rounded-3xl p-8 border border-white/10 shadow-xl backdrop-blur-xl max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">Find Your Dedicated Study Partner</h2>
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleJoinQueue} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Select Target Exam</label>
              <div className="w-full bg-slate-950/80 border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-200 text-sm font-bold flex items-center justify-between">
                <span>{selectedExam}</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-semibold uppercase">Profile Context</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Target Exam Year</label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Searching Queue...</>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Find a Study Buddy Now
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {status === 'waiting' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/80 rounded-3xl p-12 border border-indigo-500/30 shadow-2xl backdrop-blur-xl text-center max-w-lg mx-auto space-y-6">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Users className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Looking for your Study Buddy...</h2>
            <p className="text-slate-400 text-sm">
              Matching you with an aspirant preparing for <span className="text-indigo-300 font-semibold">{selectedExam} ({targetYear})</span>. This usually takes under 30 seconds.
            </p>
          </div>
          <button
            onClick={handleLeaveQueueOrMatch}
            className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors border border-white/10"
          >
            Cancel & Leave Queue
          </button>
        </motion.div>
      )}

      {status === 'matched' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/90 rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                🤝
              </div>
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  Study Buddy Session
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">Active 1-on-1</span>
                </h3>
                <p className="text-slate-400 text-xs">Partner: <span className="text-indigo-300">{buddyEmail}</span> • {selectedExam}</p>
              </div>
            </div>
            <button
              onClick={handleLeaveQueueOrMatch}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Find New Buddy
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div ref={chatScrollRef} className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!msg.isBot && (
                    <img src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                  )}
                  {msg.isBot && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">🤖</div>
                  )}
                  <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-semibold text-slate-400">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : msg.isBot ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.attachment && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-xs">
                          <Paperclip className="w-3.5 h-3.5" />
                          <a href={msg.attachment.url} target="_blank" rel="noreferrer" className="underline font-medium hover:text-indigo-200 truncate">
                            {msg.attachment.name} ({msg.attachment.size})
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security Alert Toast */}
          <AnimatePresence>
            {securityBlockedAlert && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-6 mb-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>AI Safety Notice:</strong> {securityBlockedAlert.reason}</span>
                </div>
                <button onClick={() => setSecurityBlockedAlert(null)} className="text-amber-400 hover:underline font-bold">Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/80 border-t border-white/10 flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-white/10 shrink-0"
              title="Attach study note or image"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message to your study buddy..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isEvaluating || (!input.trim() && !attachment)}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};
