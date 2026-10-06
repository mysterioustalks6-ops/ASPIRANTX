import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, Flame, Trophy, Crown, Video, VideoOff, Mic, MicOff, 
  Play, Pause, CheckCircle2, Plus, Search, Filter, ShieldCheck, 
  Clock, Target, Sparkles, MessageCircle, AlertCircle, ArrowLeft,
  Share2, Camera, Eye, Zap, BookOpen, Coffee, Edit3, Settings,
  Award, TrendingUp, Radio, UserCheck, Check, Volume2, VolumeX,
  Smile, ThumbsUp, Send, Heart, Star
} from 'lucide-react';
import { UserProfile, StudyBattleGroup, StudyBattleMember } from '../types';
import { resolveUserAvatar } from '../lib/avatarStorage';

interface CommunityBattleArenaProps {
  user: UserProfile;
  selectedExam?: string;
  onOpenPremium?: () => void;
}

const PRESET_ARENA_AVATARS = [
  { id: 'lion', label: 'Roaring Lion', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%23ea580c'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>L</text></svg>" },
  { id: 'eagle', label: 'Focus Eagle', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%230284c7'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>E</text></svg>" },
  { id: 'medic', label: 'Doctor Cadet', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%2310b981'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>M</text></svg>" },
  { id: 'atom', label: 'Physics Atom', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%236366f1'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>A</text></svg>" },
  { id: 'library', label: 'Grand Library', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%23f59e0b'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>B</text></svg>" },
  { id: 'night', label: 'Midnight Moon', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%238b5cf6'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>N</text></svg>" },
];

const STUDY_ACTIVITIES = [
  '📖 Reading & Revision',
  '✍️ Solving MCQs / PYQs',
  '📝 Answer Writing Practice',
  '🧠 Flashcards & Memorization',
  '🔬 Lab / Formula Derivations',
  '☕ Quick 5-Min Refresh Break'
];

export const CommunityBattleArena: React.FC<CommunityBattleArenaProps> = ({
  user,
  selectedExam = 'UPSC_CSE',
  onOpenPremium,
}) => {
  // Navigation & View: 'browse' | 'room'
  const [activeGroup, setActiveGroup] = useState<StudyBattleGroup | null>(null);
  const [groups, setGroups] = useState<StudyBattleGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [examFilter, setExamFilter] = useState<string>('ALL');

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupExam, setNewGroupExam] = useState<string>(selectedExam || 'UPSC_CSE');
  const [newGroupGoal, setNewGroupGoal] = useState<number>(8);
  const [newGroupAvatar, setNewGroupAvatar] = useState<string>(PRESET_ARENA_AVATARS[0].url);
  const [newGroupVideoAllowed, setNewGroupVideoAllowed] = useState<boolean>(true);

  // Edit Group Modal (for Host)
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editAnnouncement, setEditAnnouncement] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // Live Study Session state inside Room
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [currentActivity, setCurrentActivity] = useState<string>(STUDY_ACTIVITIES[0]);
  const [studyMode, setStudyMode] = useState<'avatar' | 'video'>('avatar');

  // Video Call Media Stream
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isCamEnabled, setIsCamEnabled] = useState<boolean>(false);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(false);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Ambient focus sound
  const [ambientSound, setAmbientSound] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Toast / Live cheer reactions
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [flyingReactions, setFlyingReactions] = useState<{ id: string; emoji: string }[]>([]);

  // 1. Fetch Battle Groups from server
  useEffect(() => {
    fetchBattleGroups();
  }, [user.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchBattleGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/community/battle-groups?userId=${encodeURIComponent(user.id)}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setGroups(data.groups);
        // If an active group is already open, sync it
        if (activeGroup) {
          const updatedCurrent = data.groups.find((g: StudyBattleGroup) => g.id === activeGroup.id);
          if (updatedCurrent) setActiveGroup(updatedCurrent);
        }
      }
    } catch (e) {
      console.error('Failed to load battle groups', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Stopwatch interval when user is actively studying
  useEffect(() => {
    let interval: any = null;
    if (isStudying) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStudying]);

  // 3. Periodic Auto-Save of study minutes to backend & localStorage (every 60 seconds)
  useEffect(() => {
    if (!isStudying || !activeGroup || sessionSeconds === 0) return;
    if (sessionSeconds % 60 === 0) {
      logStudyMinutes(1);
    }
  }, [sessionSeconds, isStudying, activeGroup?.id]);

  // 4. Handle webcam video stream setup when switching to video mode
  useEffect(() => {
    if (studyMode === 'video') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [studyMode]);

  const startCamera = async () => {
    try {
      setCamError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: isMicEnabled,
        });
        setMediaStream(stream);
        setIsCamEnabled(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        showToast('📷 Live Study Cam activated! Silent library mode enabled.');
      } else {
        setCamError('Camera not supported in this browser.');
        setStudyMode('avatar');
      }
    } catch (err: any) {
      console.warn('Camera access not granted or unavailable:', err);
      setCamError('Camera permission denied or camera not found. Using Focus Avatar mode.');
      setStudyMode('avatar');
      setIsCamEnabled(false);
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCamEnabled(false);
  };

  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicEnabled(audioTrack.enabled);
      } else {
        setIsMicEnabled(!isMicEnabled);
      }
    } else {
      setIsMicEnabled(!isMicEnabled);
    }
  };

  // 5. Ambient White Noise Sound Generator (Web Audio API)
  const toggleAmbientSound = () => {
    if (ambientSound) {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setAmbientSound(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1; // white noise
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        // Soft lowpass filter to create calming rain/library sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.05; // low soothing volume

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start();

        audioContextRef.current = ctx;
        noiseNodeRef.current = whiteNoise;
        setAmbientSound(true);
        showToast('🎧 Soft rain ambiance enabled for deep concentration.');
      } catch (e) {
        console.warn('AudioContext not allowed without gesture', e);
      }
    }
  };

  // 6. Log Study Minutes to Room & Profile
  const logStudyMinutes = async (mins: number) => {
    if (!activeGroup) return;
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const avatar = resolveUserAvatar(user.avatar_url, user.id, user.email);

      const res = await fetch(`/api/community/battle-groups/${activeGroup.id}/log-study`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || 'Aspirant',
          userAvatar: avatar,
          minutes: mins,
          activeStatus: currentActivity,
          isLiveStudying: isStudying,
          isCamOn: isCamEnabled,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setActiveGroup(data.group);
        setGroups((prev) => prev.map((g) => (g.id === data.group.id ? data.group : g)));
      }
    } catch (e) {
      console.error('Failed to log study minutes', e);
    }
  };

  // 7. Join or Leave Group
  const handleToggleJoin = async (group: StudyBattleGroup) => {
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const avatar = resolveUserAvatar(user.avatar_url, user.id, user.email);

      const res = await fetch(`/api/community/battle-groups/${group.id}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || 'Aspirant',
          userAvatar: avatar,
          userExam: user.exam || group.targetExam,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setGroups((prev) => prev.map((g) => (g.id === data.group.id ? data.group : g)));
        if (activeGroup?.id === group.id) {
          setActiveGroup(data.group);
        }
        showToast(data.isJoined ? `🎉 Joined ${group.name}!` : `Left ${group.name}`);
      }
    } catch (e) {
      console.error('Failed to join group', e);
    }
  };

  // 8. Create a New Battle Group (Host is current user)
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreatingGroup(true);
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const avatar = resolveUserAvatar(user.avatar_url, user.id, user.email);

      const res = await fetch('/api/community/battle-groups', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          avatar_url: newGroupAvatar,
          targetExam: newGroupExam,
          dailyGoalHours: newGroupGoal,
          videoCallAllowed: newGroupVideoAllowed,
          hostId: user.id,
          hostName: user.name || 'Aspirant Host',
          hostAvatar: avatar,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setGroups([data.group, ...groups]);
        setActiveGroup(data.group);
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
        showToast(`🏆 Group created! You are now the Official Host of ${data.group.name}.`);
      }
    } catch (e) {
      console.error('Failed to create group', e);
    } finally {
      setCreatingGroup(false);
    }
  };

  // 9. Host updates group announcement or description
  const handleSaveHostUpdates = async () => {
    if (!activeGroup) return;
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/community/battle-groups/${activeGroup.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          announcement: editAnnouncement,
          description: editDescription,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setActiveGroup(data.group);
        setGroups((prev) => prev.map((g) => (g.id === data.group.id ? data.group : g)));
        setShowEditModal(false);
        showToast('✨ Group details updated by Host!');
      }
    } catch (e) {
      console.error('Failed to update group', e);
    }
  };

  // 10. Send quick live reaction
  const triggerCheer = (emoji: string) => {
    const id = Math.random().toString(36).substring(2, 7);
    setFlyingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFlyingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}h ` : ''}${m < 10 && h > 0 ? '0' : ''}${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Format minutes to string
  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} mins`;
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchExam = examFilter === 'ALL' || g.targetExam === examFilter;
      const matchQuery =
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.hostName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchExam && matchQuery;
    });
  }, [groups, examFilter, searchQuery]);

  // Sorted Leaderboard for active group
  const activeLeaderboard = useMemo(() => {
    if (!activeGroup) return [];
    return [...activeGroup.members].sort(
      (a, b) => (b.todayStudyMinutes || 0) - (a.todayStudyMinutes || 0)
    );
  }, [activeGroup]);

  // Current user's rank in active group
  const myRankIndex = useMemo(() => {
    if (!activeGroup) return -1;
    return activeLeaderboard.findIndex((m) => m.id === user.id);
  }, [activeLeaderboard, user.id]);

  const isCurrentUserHost = activeGroup && activeGroup.hostId === user.id;

  // =========================================================================
  // VIEW 1: INSIDE LIVE ARENA ROOM (STUDY BATTLE & LEADERBOARD)
  // =========================================================================
  if (activeGroup) {
    return (
      <div className="space-y-6">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Floating cheer reaction bubbles */}
        <div className="fixed bottom-24 right-10 z-50 pointer-events-none flex flex-col items-center gap-2">
          {flyingReactions.map((r) => (
            <span key={r.id} className="text-4xl animate-bounce drop-shadow-lg">
              {r.emoji}
            </span>
          ))}
        </div>

        {/* ROOM TOP HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white">
          <div
            className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${activeGroup.banner_url || activeGroup.avatar_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  stopCamera();
                  setIsStudying(false);
                  setActiveGroup(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all hover:scale-105 active:scale-95"
                title="Back to All Arenas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-lg shadow-indigo-500/20 shrink-0">
                <img src={activeGroup.avatar_url} alt={activeGroup.name} className="w-full h-full object-cover" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black tracking-wider uppercase">
                    {activeGroup.targetExam.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE BATTLE
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Goal: <strong className="text-white">{activeGroup.dailyGoalHours}h Today</strong>
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">
                  {activeGroup.name}
                </h1>

                {/* Host Info */}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Host: {activeGroup.hostName}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{activeGroup.members.length} Warriors in Room</span>
                </div>
              </div>
            </div>

            {/* Room Actions */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {isCurrentUserHost && (
                <button
                  onClick={() => {
                    setEditAnnouncement(activeGroup.announcement || '');
                    setEditDescription(activeGroup.description || '');
                    setShowEditModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span>Host Controls</span>
                </button>
              )}

              <button
                onClick={toggleAmbientSound}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  ambientSound
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Rain / Library Ambiance"
              >
                {ambientSound ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{ambientSound ? 'Rain Sound On' : 'Study Ambiance'}</span>
              </button>

              <button
                onClick={() => handleToggleJoin(activeGroup)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeGroup.isJoined
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{activeGroup.isJoined ? 'Leave Arena' : 'Join Arena'}</span>
              </button>
            </div>
          </div>

          {/* Group Announcement & Rules Banner */}
          {activeGroup.announcement && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-indigo-200 bg-indigo-950/40 p-3 rounded-2xl border border-indigo-900/40">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 uppercase tracking-wider text-[10px]">Host Announcement:</strong>{' '}
                {activeGroup.announcement}
              </div>
            </div>
          )}
        </div>

        {/* LIVE STUDY DASHBOARD BAR: TIMER + WEBCAM / AVATAR TOGGLE */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
          {/* Active Study Clock */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`p-4 rounded-2xl border flex items-center justify-center ${
              isStudying
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ring-2 ring-emerald-500/20 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isStudying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {isStudying ? '🔴 LIVE SESSION TIMER' : 'SESSION PAUSED'}
                </span>
              </div>
              <div className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                {formatTime(sessionSeconds)}
              </div>
            </div>
          </div>

          {/* Topic Selector */}
          <div className="w-full md:w-auto flex-1 max-w-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Currently Studying:
            </label>
            <select
              value={currentActivity}
              onChange={(e) => {
                setCurrentActivity(e.target.value);
                if (isStudying) {
                  logStudyMinutes(0); // update activity status
                }
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {STUDY_ACTIVITIES.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Controls: Start/Pause + Mode Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            {/* Cam / Avatar Mode Switcher */}
            {activeGroup.videoCallAllowed && (
              <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setStudyMode('avatar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    studyMode === 'avatar'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Avatar</span>
                </button>
                <button
                  onClick={() => setStudyMode('video')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    studyMode === 'video'
                      ? 'bg-rose-600 text-white shadow-sm animate-pulse'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Live Cam</span>
                </button>
              </div>
            )}

            {/* Video Mic Toggle */}
            {studyMode === 'video' && isCamEnabled && (
              <button
                onClick={toggleMic}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isMicEnabled
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={isMicEnabled ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            )}

            {/* Start / Pause Session Button */}
            {!isStudying ? (
              <button
                onClick={() => {
                  setIsStudying(true);
                  showToast('🚀 Study Session started! Ticking live on room leaderboard.');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Live Study</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsStudying(false);
                  const mins = Math.max(1, Math.round(sessionSeconds / 60));
                  logStudyMinutes(mins);
                  showToast(`✨ Saved ${mins} minutes to your profile and group leaderboard!`);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black text-xs rounded-2xl shadow-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause & Save Study</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN ARENA SPLIT: PARTICIPANTS GRID (LEFT) + REAL-TIME RANKING LEADERBOARD (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: PARTICIPANTS STUDY FLOOR */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  Live Battle Floor ({activeGroup.members.length} Aspirants)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Silent Library Protocol • Webcam or Avatar Active
              </span>
            </div>

            {/* Video / Tile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* CURRENT USER TILE (YOU) */}
              <div className={`relative rounded-3xl overflow-hidden border-2 transition-all bg-slate-900 shadow-xl flex flex-col justify-between p-4 min-h-[220px] ${
                isStudying ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-indigo-500/40'
              }`}>
                {/* Live Webcam Stream inside tile if Cam is active */}
                {studyMode === 'video' && isCamEnabled ? (
                  <div className="absolute inset-0 z-0 bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  </div>
                ) : (
                  /* Focus Avatar with animated aura */
                  <div className="flex flex-col items-center justify-center my-auto z-10">
                    <div className="relative">
                      <img
                        src={resolveUserAvatar(user.avatar_url, user.id, user.email)}
                        alt={user.name}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-400 shadow-lg shadow-indigo-500/30"
                      />
                      {isStudying && (
                        <div className="absolute -inset-1 rounded-2xl border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
                      )}
                    </div>
                  </div>
                )}

                {/* Top Tile Badges */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/80 text-white font-black text-[10px] tracking-wider uppercase backdrop-blur-md">
                    YOU {isCurrentUserHost ? '👑 HOST' : ''}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md flex items-center gap-1 ${
                    isStudying ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isStudying ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
                    {isStudying ? 'STUDYING' : 'IDLE'}
                  </span>
                </div>

                {/* Bottom Tile Info */}
                <div className="relative z-10 mt-auto pt-3">
                  <p className="text-xs font-bold text-white truncate drop-shadow">{user.name}</p>
                  <p className="text-[10px] text-indigo-300 truncate drop-shadow">{currentActivity}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-black text-amber-300 drop-shadow">
                    <span>Today: {formatMinutes((activeLeaderboard.find(m => m.id === user.id)?.todayStudyMinutes || 0) + Math.round(sessionSeconds / 60))}</span>
                    {myRankIndex >= 0 && (
                      <span className="text-emerald-400">Rank #{myRankIndex + 1}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* OTHER PARTICIPANTS TILES */}
              {activeGroup.members
                .filter((m) => m.id !== user.id)
                .map((member) => (
                  <div
                    key={member.id}
                    className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/80 shadow-lg flex flex-col justify-between p-4 min-h-[220px] transition-all hover:border-slate-700"
                  >
                    {/* Top badges */}
                    <div className="flex items-center justify-between w-full z-10">
                      {member.isHost ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-[10px] flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> HOST
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {member.exam || activeGroup.targetExam}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                        member.isLiveStudying ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.isLiveStudying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        {member.isLiveStudying ? 'ACTIVE' : 'AWAY'}
                      </span>
                    </div>

                    {/* Member Avatar */}
                    <div className="flex flex-col items-center justify-center my-auto z-10">
                      <div className="relative">
                        <img
                          src={member.avatar_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%230284c7'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>A</text></svg>"}
                          alt={member.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-md"
                        />
                        {member.isCamOn && (
                          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rose-600 text-white text-[8px]" title="Cam Active">
                            <Video className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="mt-auto pt-2 z-10">
                      <p className="text-xs font-bold text-slate-200 truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{member.activeStatus || '📖 Focus Study'}</p>
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-400">
                          {formatMinutes(member.todayStudyMinutes || 0)}
                        </span>
                        <span className="text-slate-500 text-[10px]">{member.lastActive || 'Active'}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Quick Live Cheer Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Motivate Warriors:
              </span>
              <div className="flex items-center gap-2">
                {['🔥 Keep Going!', '☕ Chai Break!', '⚡ Legend!', '🎯 100% Focus!'].map((cheer) => (
                  <button
                    key={cheer}
                    onClick={() => triggerCheer(cheer.split(' ')[0])}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 border border-slate-700"
                  >
                    {cheer}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REAL-TIME RANKING & LEADERBOARD (AAJ KISNE KITNA PADHA) */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-black text-white">Today's Live Leaderboard</h3>
                    <p className="text-[10px] text-slate-400">Aaj is group me kisne kitna padha hai</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black">
                  LIVE RANK
                </span>
              </div>

              {/* Leaderboard List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {activeLeaderboard.map((member, index) => {
                  const isMe = member.id === user.id;
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;

                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isMe
                          ? 'bg-indigo-950/60 border-indigo-500/60 ring-2 ring-indigo-500/30'
                          : isFirst
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Rank & Avatar */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 text-center font-black text-xs shrink-0">
                          {isFirst ? (
                            <Crown className="w-5 h-5 text-amber-400 fill-amber-400 mx-auto animate-bounce" />
                          ) : isSecond ? (
                            <span className="text-slate-300 text-sm font-black">🥈</span>
                          ) : isThird ? (
                            <span className="text-amber-600 text-sm font-black">🥉</span>
                          ) : (
                            <span className="text-slate-500 font-bold">#{index + 1}</span>
                          )}
                        </div>

                        <img
                          src={member.avatar_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%230284c7'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>A</text></svg>"}
                          alt={member.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                        />

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate flex items-center gap-1 ${isMe ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {member.name}
                            {isMe && <span className="text-[10px] text-indigo-400">(You)</span>}
                            {member.isHost && <Crown className="w-3 h-3 text-amber-400" />}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {member.activeStatus || 'Deep Focus'}
                          </p>
                        </div>
                      </div>

                      {/* Hours Studied Today */}
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black block ${
                          isFirst ? 'text-amber-400' : 'text-white'
                        }`}>
                          {formatMinutes(member.todayStudyMinutes + (isMe ? Math.round(sessionSeconds / 60) : 0))}
                        </span>
                        <span className="text-[9px] text-slate-400">logged today</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Motivational Rank Comparison */}
              {myRankIndex > 0 && activeLeaderboard[myRankIndex - 1] && (
                <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300">
                  <span className="font-bold text-amber-300">⚔️ Competitive Drive:</span> You are{' '}
                  <strong>
                    {formatMinutes(
                      (activeLeaderboard[myRankIndex - 1].todayStudyMinutes || 0) -
                        (activeLeaderboard[myRankIndex].todayStudyMinutes || 0)
                    )}
                  </strong>{' '}
                  behind <strong>{activeLeaderboard[myRankIndex - 1].name}</strong>! Keep your timer running to climb up.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HOST EDIT MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  Host Controls • Manage Arena
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Host Announcement (Visible to all warriors):
                  </label>
                  <input
                    type="text"
                    value={editAnnouncement}
                    onChange={(e) => setEditAnnouncement(e.target.value)}
                    placeholder="e.g. Modern History Sprint at 4 PM! Camera on recommended."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Group Rules & Guidelines:
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHostUpdates}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ARENA BROWSER & DIRECTORY (EXPLORE & HOST ROOMS)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP ARENA BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border border-indigo-900/40 p-6 md:p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider mb-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>Real-Time Study Competition & Battle Arenas</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Compete Live • Study Longer • Rank #1 Today
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Join live study rooms with silent library protocols. Compete with aspirants across India via <strong>Live Study Cam</strong> or <strong>Focus Avatar</strong>. Koi bhi aspirant apna room host kar sakta hai!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Host / Create Study Arena</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search group name, host, exam..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Exam Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'UPSC_CSE', 'NEET_UG', 'JEE_ADV', 'ALL_INDIA'].map((exam) => (
            <button
              key={exam}
              onClick={() => setExamFilter(exam)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                examFilter === exam
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {exam === 'ALL' ? 'All Arenas' : exam.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ARENAS CARDS GRID */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Loading Live Study Arenas...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Arenas Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Be the pioneer! Create and host the first live study battle arena for this category.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
          >
            Create First Arena
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => {
            const topMember = group.members.reduce(
              (prev, current) => ((prev.todayStudyMinutes || 0) > (current.todayStudyMinutes || 0) ? prev : current),
              group.members[0]
            );

            return (
              <div
                key={group.id}
                className="group relative rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-2xl"
              >
                {/* Banner / Avatar Header */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-950">
                  <img
                    src={group.banner_url || group.avatar_url}
                    alt={group.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                  {/* Exam badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider">
                    {group.targetExam.replace('_', ' ')}
                  </span>

                  {/* Live status badge */}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {group.members.length} Warriors
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Avatar + Host */}
                    <div className="flex items-center gap-3 -mt-10 mb-3 relative z-10">
                      <img
                        src={group.avatar_url}
                        alt={group.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-900 shadow-xl shrink-0"
                      />
                      <div className="min-w-0 pt-4">
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3 fill-amber-400" /> Host: {group.hostName}
                        </span>
                        <h3 className="text-base font-black text-white truncate group-hover:text-indigo-300 transition-colors">
                          {group.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  {/* Stats Strip */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-indigo-400" /> Daily Target:
                      </span>
                      <strong className="text-white">{group.dailyGoalHours} Hours</strong>
                    </div>

                    {topMember && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                        <span className="text-amber-400 font-bold flex items-center gap-1 truncate max-w-[150px]">
                          🥇 #1 Leader: {topMember.name}
                        </span>
                        <strong className="text-amber-300">{formatMinutes(topMember.todayStudyMinutes || 0)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveGroup(group);
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Enter Battle Room</span>
                    </button>

                    <button
                      onClick={() => handleToggleJoin(group)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        group.isJoined
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title={group.isJoined ? 'Leave Arena' : 'Join Arena'}
                    >
                      {group.isJoined ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW STUDY ARENA MODAL (ANY USER CAN HOST) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Host a New Live Study Arena
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aap room ke Official Host banenge aur rules set kar sakenge.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Arena Name */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Arena / Group Name: *
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. UPSC GS-1 Answer Writing Arena or NEET 12H Sprint"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Target Exam & Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Target Exam:
                  </label>
                  <select
                    value={newGroupExam}
                    onChange={(e) => setNewGroupExam(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UPSC_CSE">UPSC CSE (IAS/IPS)</option>
                    <option value="NEET_UG">NEET UG (Medical)</option>
                    <option value="JEE_ADV">JEE Advanced (IIT)</option>
                    <option value="SSC_CGL">SSC CGL</option>
                    <option value="STATE_PSC">State PCS</option>
                    <option value="ALL_INDIA">All Exams / Open</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Daily Study Target:
                  </label>
                  <select
                    value={newGroupGoal}
                    onChange={(e) => setNewGroupGoal(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={6}>6 Hours / Day</option>
                    <option value={8}>8 Hours / Day (Standard)</option>
                    <option value={10}>10 Hours / Day (Hardcore)</option>
                    <option value={12}>12 Hours / Day (Super Ranker)</option>
                    <option value={14}>14 Hours / Day (Extreme)</option>
                  </select>
                </div>
              </div>

              {/* Description & Rules */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Arena Rules & Guidelines:
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="e.g. Strict silence, camera or study timer on, minimum 4 hours mandatory."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Select Arena Profile Icon:
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {PRESET_ARENA_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setNewGroupAvatar(av.url)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        newGroupAvatar === av.url
                          ? 'border-indigo-500 scale-105 ring-2 ring-indigo-500/40 shadow-lg'
                          : 'border-slate-800 hover:border-slate-700 opacity-75'
                      }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      {newGroupAvatar === av.url && (
                        <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Call Support */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Enable Live Study Cam Option</p>
                    <p className="text-[10px] text-slate-400">Warriors can turn on silent webcam study stream</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newGroupVideoAllowed}
                  onChange={(e) => setNewGroupVideoAllowed(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {creatingGroup ? 'Creating Arena...' : 'Launch Live Arena'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
