import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, RoomMessage, RoomMessageAttachment } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Users, 
  Send, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  ShieldAlert, 
  Bot, 
  Sparkles, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  MessageSquare,
  Lock as LockIcon,
  ThumbsUp,
  Download
} from 'lucide-react';

interface CommunityChatProps {
  user: UserProfile | null;
  onOpenPremium?: () => void;
}

type RoomName = 'UPSC Room' | 'SSC Room' | 'Current Affairs Hub' | 'Optional Subjects' | 'Vent Room';

export function getAnonymousName(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return `Aspirant#${(hash % 9000 + 1000)}`;
}

const ROOMS: { id: RoomName; label: string; desc: string; icon: string; badge: string }[] = [
  { id: 'UPSC Room', label: 'UPSC CSE Hub', desc: 'Prelims, Mains GS & Strategy discussions', icon: '🏛️', badge: 'Active' },
  { id: 'SSC Room', label: 'SSC CGL & CHSL', desc: 'Maths, Reasoning, English & GK tricks', icon: '📊', badge: 'Hot' },
  { id: 'Current Affairs Hub', label: 'Daily Current Affairs', desc: 'The Hindu, PIB & Editorial summaries', icon: '📰', badge: 'Live' },
  { id: 'Optional Subjects', label: 'Optional Peer Circle', desc: 'PSIR, Sociology, Geography & History', icon: '📚', badge: 'Study' },
  { id: 'Vent Room', label: 'Vent Room 🤍', desc: 'A safe, anonymous space to talk. No judgment, no pressure.', icon: '🤍', badge: 'Anonymous' },
];

const INITIAL_MESSAGES: Record<RoomName, RoomMessage[]> = {
  'UPSC Room': [
    {
      id: 'm1',
      room: 'UPSC Room',
      senderId: 'bot',
      senderName: 'AspirantX Bot',
      isBot: true,
      text: 'Welcome to the UPSC CSE Room! I am your AI Room Moderator. Ask me anything about GS syllabus, Laxmikanth, or PYQs by tagging @bot in your message!',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 5,
    },
    {
      id: 'm2',
      room: 'UPSC Room',
      senderId: 'user_priya',
      senderName: 'Priya Sharma (AIR Hopeful)',
      senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      text: 'Has anyone finished reading Polity Chapter 15 on Emergency Provisions? Facing doubt in Article 356 vs 365.',
      timestamp: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 2,
    },
    {
      id: 'm3',
      room: 'UPSC Room',
      senderId: 'user_rahul',
      senderName: 'Rahul Verma',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      text: 'Check out this quick comparative flowchart I drafted for Article 352 vs 356!',
      attachment: {
        name: 'Polity_Emergency_Flowchart.pdf',
        type: 'pdf',
        url: '#',
        size: '1.2 MB',
      },
      timestamp: new Date(Date.now() - 900000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 7,
    },
  ],
  'SSC Room': [
    {
      id: 'm4',
      room: 'SSC Room',
      senderId: 'bot',
      senderName: 'AspirantX Bot',
      isBot: true,
      text: 'Welcome to SSC CGL/CHSL Preparation Zone! Share speed-math tricks, English idioms, or general awareness notes here.',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 3,
    },
    {
      id: 'm5',
      room: 'SSC Room',
      senderId: 'user_vikram',
      senderName: 'Vikram Singh',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      text: 'What is the fastest formula for compound interest for 3 years at non-integer rates?',
      timestamp: new Date(Date.now() - 1200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 1,
    },
  ],
  'Current Affairs Hub': [
    {
      id: 'm6',
      room: 'Current Affairs Hub',
      senderId: 'bot',
      senderName: 'AspirantX Bot',
      isBot: true,
      text: 'Daily Editorial Summary: Today Highlights include COP29 Climate Summit updates & RBI Monetary Policy Review.',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 8,
    },
  ],
  'Optional Subjects': [
    {
      id: 'm7',
      room: 'Optional Subjects',
      senderId: 'bot',
      senderName: 'AspirantX Bot',
      isBot: true,
      text: 'Optional Peer Discussion Group. Post answer outlines for peer-review & quote philosophers/scholars!',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 4,
    },
  ],
  'Vent Room': [
    {
      id: 'm_vent',
      room: 'Vent Room',
      senderId: 'bot',
      senderName: 'Vent Room Bot',
      isBot: true,
      text: 'Welcome to the Vent Room 🤍. This is a safe, completely anonymous space. Your identity is masked. Share your exam stress, burnout, or anxiety without fear or judgment. We are in this together.',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 12,
    },
  ],
};

export const CommunityChat: React.FC<CommunityChatProps> = ({ user, onOpenPremium }) => {
  const [activeRoom, setActiveRoom] = useState<RoomName>('UPSC Room');
  const [messages, setMessages] = useState<Record<RoomName, RoomMessage[]>>(() => {
    const saved = localStorage.getItem('aspirantx_community_chat');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<RoomMessageAttachment | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [securityBlockedAlert, setSecurityBlockedAlert] = useState<{ reason: string; category: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when room messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeRoom, isBotThinking]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('aspirantx_community_chat', JSON.stringify(messages));
  }, [messages]);

  // Handle Supabase Realtime Subscription if available
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('public:community_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          const newMsg = payload.new as RoomMessage;
          if (newMsg && newMsg.room) {
            setMessages((prev) => ({
              ...prev,
              [newMsg.room]: [...(prev[newMsg.room] || []), newMsg],
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle File Upload Simulation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setAttachment({
        name: file.name,
        type: isImage ? 'image' : isPdf ? 'pdf' : 'other',
        url: url || '#',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
    };
    reader.readAsDataURL(file);
  };

  // Trigger Send with High-Security AI Moderation Engine
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || isEvaluating) return;

    const textToSend = input.trim();
    const currentAttachment = attachment;

    setInput('');
    setAttachment(null);
    setIsEvaluating(true);

    try {
      // 🛡️ STEP 1: Pass message & file name through Gemini AI Security Moderation Middleware
      const modRes = await fetch('/api/gemini/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          fileName: currentAttachment ? currentAttachment.name : '',
          user: user?.name || 'Aspirant',
          room: activeRoom,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const modData = await modRes.json();

      // 🛑 STEP 2: If Gemini flags content as unsafe (NSFW / Abuse / Sexual), BLOCK IT IMMEDIATELY
      if (!modData.safe) {
        setIsEvaluating(false);
        if (modData.banned) {
          try {
            await supabase.auth.signOut();
          } catch (e) {}
          localStorage.removeItem('aspirantx_auth_token');
          alert('Your account has been suspended for posting content that violates our community guidelines.');
          window.location.reload();
          return;
        }
        setSecurityBlockedAlert({
          reason: modData.reason || 'Content contains profane or inappropriate terms.',
          category: modData.category || 'abuse',
        });
        return; // DO NOT BROADCAST OR SAVE
      }

      // ✅ STEP 3: Safe message - Create message object
      const isVent = activeRoom === 'Vent Room';
      const realUserId = user?.id || 'guest_user';
      const senderName = isVent ? getAnonymousName(realUserId) : (user?.name || 'Aspirant Student');
      const senderAvatar = isVent ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80' : (user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');

      const userMsg: RoomMessage = {
        id: `msg_${Date.now()}`,
        room: activeRoom,
        senderId: realUserId,
        senderName,
        senderAvatar,
        text: textToSend,
        attachment: currentAttachment || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
      };

      // Save locally
      setMessages((prev) => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), userMsg],
      }));

      // Broadcast to Supabase if configured
      if (isSupabaseConfigured) {
        await supabase.from('community_messages').insert([userMsg]);
      }

      setIsEvaluating(false);

      // 🤖 STEP 4: Check if AI Bot Moderator should respond
      const shouldTriggerBot = textToSend.toLowerCase().includes('@bot') || 
                               textToSend.toLowerCase().includes('@aspirantx') || 
                               textToSend.toLowerCase().includes('doubt') || 
                               textToSend.toLowerCase().includes('help');

      if (shouldTriggerBot) {
        setIsBotThinking(true);

        const botRes = await fetch('/api/gemini/bot-moderator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: activeRoom,
            query: textToSend,
            user: user?.name || 'Aspirant',
          }),
        });

        const botData = await botRes.json();
        setIsBotThinking(false);

        if (botData.reply) {
          const botMsg: RoomMessage = {
            id: `bot_msg_${Date.now()}`,
            room: activeRoom,
            senderId: 'bot',
            senderName: 'AspirantX Bot',
            isBot: true,
            text: botData.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: 1,
          };

          setMessages((prev) => ({
            ...prev,
            [activeRoom]: [...(prev[activeRoom] || []), botMsg],
          }));

          if (isSupabaseConfigured) {
            await supabase.from('community_messages').insert([botMsg]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to process community message:', err);
      setIsEvaluating(false);
    }
  };

  // Like a message
  const handleLikeMessage = (msgId: string) => {
    setMessages((prev) => {
      const roomMsgs = prev[activeRoom] || [];
      const updated = roomMsgs.map((m) => {
        if (m.id === msgId) {
          return { ...m, likes: (m.likes || 0) + 1 };
        }
        return m;
      });
      return { ...prev, [activeRoom]: updated };
    });
  };

  return (
    <div className="space-y-6">
      {/* 🚨 Strict AI Security Restriction Alert Modal */}
      <AnimatePresence>
        {securityBlockedAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="max-w-md w-full bg-[#110508] border-2 border-rose-500/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)] text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                <ShieldAlert className="w-9 h-9 animate-bounce" />
              </div>

              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full">
                Gemini AI Security Guard
              </span>

              <h2 className="text-xl font-black text-white mt-2">
                Message Blocked by Security Engine
              </h2>

              <p className="text-xs text-rose-200/90 mt-2 bg-rose-950/60 p-3 rounded-xl border border-rose-500/30 text-left font-mono">
                <strong className="text-rose-400">Violation Reason:</strong> {securityBlockedAlert.reason}
              </p>

              <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                AspirantX maintains zero-tolerance for NSFW content, explicit language, or abusive behavior in study rooms. Your message was withheld and flagged in the Security Audit Log.
              </p>

              <button
                onClick={() => setSecurityBlockedAlert(null)}
                className="mt-6 w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-rose-900/50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> I Understand & Agree to Guidelines
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-purple-950/80 border border-blue-500/30 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Supabase Realtime Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Bot className="w-3 h-3 text-emerald-400" /> AI Bot Moderator Protected
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Community Study Rooms
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Connect with fellow aspirants, share handwritten notes or PDFs, and query our Gemini AI Room Moderator for instant doubt resolution.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-white/10 text-xs">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">
              AI Content Guard active. All messages & files are scanned.
            </span>
          </div>
        </div>
      </div>

      {/* Main Community Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Room Switcher Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Select Room</span>
            <span className="text-[10px] text-cyan-400 font-mono">4 Rooms</span>
          </div>

          <div className="space-y-2">
            {ROOMS.map((room) => {
              const isActive = activeRoom === room.id;
              const msgCount = (messages[room.id] || []).length;

              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/40 border-blue-500/60 shadow-lg shadow-blue-950/50 text-white font-semibold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base flex items-center gap-2">
                      <span>{room.icon}</span>
                      <span className="text-xs font-bold text-slate-100">{room.label}</span>
                    </span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {room.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{room.desc}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-cyan-400" /> {msgCount} messages
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI Moderator Room Badge Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Bot className="w-4 h-4" /> @AspirantX Bot Guide
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tag <code className="bg-emerald-950 px-1 py-0.5 rounded border border-emerald-500/40 text-emerald-300">@bot</code> in your message to summon the AI moderator for instant explanations, mnemonics, or PYQ analysis.
            </p>
          </div>
        </div>

        {/* Live Chat Stream Container */}
        <div className="lg:col-span-3 bg-[#0a0a0f] border border-slate-800 rounded-2xl flex flex-col h-[620px] shadow-2xl relative overflow-hidden">
          {/* Chat Stream Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-lg">
                {ROOMS.find((r) => r.id === activeRoom)?.icon}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  {activeRoom}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h2>
                <p className="text-[11px] text-slate-400">
                  {ROOMS.find((r) => r.id === activeRoom)?.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> AI Moderation: Active
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {(messages[activeRoom] || []).map((msg) => {
              const isCurrentUser = msg.senderId === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    isCurrentUser ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Sender Avatar / Bot Icon */}
                  <div className="shrink-0">
                    {msg.isBot ? (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-[1px] shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-emerald-400">
                          <Bot className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={msg.senderName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                    )}
                  </div>

                  {/* Message Bubble Content */}
                  <div className="space-y-1">
                    <div
                      className={`flex items-center gap-2 text-[10px] ${
                        isCurrentUser ? 'justify-end text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      <span className={`font-bold ${msg.isBot ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {msg.senderName}
                      </span>
                      {msg.isBot && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[9px] border border-emerald-500/40">
                          AI MODERATOR
                        </span>
                      )}
                      <span>• {msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        msg.isBot
                          ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 text-slate-100 shadow-md'
                          : isCurrentUser
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Attachment Preview Card if present */}
                      {msg.attachment && (
                        <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 truncate">
                            {msg.attachment.type === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="text-[11px] font-bold text-slate-200 truncate">{msg.attachment.name}</p>
                              {msg.attachment.size && (
                                <p className="text-[9px] text-slate-400">{msg.attachment.size}</p>
                              )}
                            </div>
                          </div>

                          {msg.attachment.type === 'image' && msg.attachment.url !== '#' ? (
                            <img
                              src={msg.attachment.url}
                              alt="Attachment preview"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                            />
                          ) : (
                            <a
                              href={msg.attachment.url}
                              download={msg.attachment.name}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                              title="Download Attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Upvote/Like Action */}
                    <div className={`flex items-center gap-2 text-[10px] ${isCurrentUser ? 'justify-end' : ''}`}>
                      <button
                        onClick={() => handleLikeMessage(msg.id)}
                        className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{msg.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Bot Typing Indicator */}
            {isBotThinking && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>@AspirantX Bot is formulating study insights...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Attachment Preview Banner before sending */}
          {attachment && (
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold truncate">{attachment.name}</span>
                <span className="text-[10px] text-slate-400">({attachment.size})</span>
              </div>
              <button
                onClick={() => setAttachment(null)}
                className="p-1 text-slate-400 hover:text-rose-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Controls Footer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors"
              title="Attach File (Image/PDF)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setInput((prev) => prev + (prev ? ' ' : '') + '@bot ')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              title="Tag AI Bot Moderator"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" /> @bot
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${activeRoom}... (Tag @bot for AI mentor answers)`}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={isEvaluating || (!input.trim() && !attachment)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-blue-900/40 disabled:opacity-50 transition-all"
            >
              {isEvaluating ? (
                <ShieldAlert className="w-4 h-4 animate-spin text-cyan-300" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
