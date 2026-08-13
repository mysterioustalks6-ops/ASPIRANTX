import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Video, 
  Calendar, 
  Plus, 
  Tv, 
  Award,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  UserCheck,
  Star,
  Ban,
  XCircle
} from 'lucide-react';

interface Educator {
  id: string;
  name: string;
  subject: string;
  experience: string;
  qualification: string;
  avatar: string;
  isVerified?: boolean;
  status?: string;
  email?: string;
  bio?: string;
  availability?: string[];
  rating?: number;
  studentsCount?: number;
  reviewsCount?: number;
  sessionPrice?: number;
  isOnline?: boolean;
}

interface Booking {
  id: string;
  educatorId: string;
  date: string;
  time: string;
  selectedSlot?: string;
  studentEmail: string;
  studentName?: string;
  notes?: string;
  status: string;
  price?: number;
  utrNumber?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  educatorId: string;
  sender: string;
  msg: string;
  timestamp: string;
}

export const TeacherPortal: React.FC = () => {
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loadingEducators, setLoadingEducators] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Educator Registration Modal & Form State
  const [showRegModal, setShowRegModal] = useState<boolean>(false);
  const [submittingReg, setSubmittingReg] = useState<boolean>(false);
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    subject: 'Indian Polity & Governance',
    experience: '',
    qualification: '',
    bio: '',
    avatar: '',
    sessionPrice: 0
  });

  // Booking Modal & Form State
  const [bookingEducator, setBookingEducator] = useState<Educator | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  // View Bookings Drawer/Modal State
  const [viewingBookingsEd, setViewingBookingsEd] = useState<Educator | null>(null);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<boolean>(false);

  // Live Classroom & Chat State
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>('ed_1');
  const [liveChat, setLiveChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingChat, setSendingChat] = useState<boolean>(false);

  // Auto-dismiss alert banner
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // When booking modal opens, initialize selected slot
  useEffect(() => {
    if (bookingEducator) {
      if (bookingEducator.availability && bookingEducator.availability.length > 0) {
        setSelectedSlot(bookingEducator.availability[0]);
      } else {
        setSelectedSlot('');
      }
      setUtrNumber('');
    }
  }, [bookingEducator]);

  // Fetch Educators List
  const fetchEducators = useCallback(async () => {
    try {
      setLoadingEducators(true);
      const res = await fetch('/api/teachers');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.educators)) {
        setEducators(data.educators);
        if (data.educators.length > 0 && !data.educators.some((e: Educator) => e.id === selectedEducatorId)) {
          setSelectedEducatorId(data.educators[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch educators:', err);
    } finally {
      setLoadingEducators(false);
    }
  }, [selectedEducatorId]);

  useEffect(() => {
    fetchEducators();
  }, [fetchEducators]);

  // Fetch Live Chat
  const fetchLiveChat = useCallback(async () => {
    if (!selectedEducatorId) return;
    try {
      const res = await fetch(`/api/teachers/chat/${selectedEducatorId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.chat)) {
        setLiveChat(data.chat);
      }
    } catch (err) {
      console.error('Error fetching live chat:', err);
    }
  }, [selectedEducatorId]);

  useEffect(() => {
    fetchLiveChat();
    const interval = setInterval(fetchLiveChat, 4000);
    return () => clearInterval(interval);
  }, [fetchLiveChat]);

  // Handle Educator Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingReg(true);
      setErrorMsg(null);
      const res = await fetch('/api/teachers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Teacher registration submitted successfully!');
        setShowRegModal(false);
        setRegForm({
          name: '',
          email: '',
          subject: 'Indian Polity & Governance',
          experience: '',
          qualification: '',
          bio: '',
          avatar: '',
          sessionPrice: 0
        });
        fetchEducators();
      } else {
        setErrorMsg(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      console.error('Error registering educator:', err);
      setErrorMsg('Server connection error while registering.');
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle Book Session Submission
  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEducator) return;
    if (!selectedSlot) {
      setErrorMsg('Please select an available session slot.');
      return;
    }
    if (bookingEducator.sessionPrice && bookingEducator.sessionPrice > 0 && !utrNumber.trim()) {
      setErrorMsg('Please enter your payment UTR / Transaction ID to confirm booking.');
      return;
    }

    try {
      setSubmittingBooking(true);
      setErrorMsg(null);
      const res = await fetch(`/api/teachers/${bookingEducator.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot: selectedSlot,
          studentEmail,
          studentName,
          notes,
          utrNumber
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Session booked with ${bookingEducator.name}!`);
        setBookingEducator(null);
        setNotes('');
        setUtrNumber('');
        if (viewingBookingsEd?.id === bookingEducator.id) {
          handleViewBookings(viewingBookingsEd);
        }
      } else {
        setErrorMsg(data.error || 'Booking failed.');
      }
    } catch (err: any) {
      console.error('Error booking session:', err);
      setErrorMsg('Server connection error while booking.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Fetch Bookings for an Educator
  const handleViewBookings = async (ed: Educator) => {
    setViewingBookingsEd(ed);
    try {
      setLoadingBookings(true);
      const res = await fetch(`/api/teachers/${ed.id}/bookings`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.bookings)) {
        setBookingsList(data.bookings);
      } else {
        setBookingsList([]);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookingsList([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Execute Cancel Booking
  const handleExecuteCancelBooking = async () => {
    if (!confirmCancelBooking) return;
    try {
      setCancellingBooking(true);
      const res = await fetch(`/api/teachers/bookings/${confirmCancelBooking.id}/cancel`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Booking cancelled successfully.');
        setConfirmCancelBooking(null);
        if (viewingBookingsEd) {
          await handleViewBookings(viewingBookingsEd);
        }
      } else {
        setErrorMsg(data.error || 'Failed to cancel booking.');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setErrorMsg('Failed to cancel booking due to network error.');
    } finally {
      setCancellingBooking(false);
    }
  };

  // Send Chat Message
  const sendLiveChat = async () => {
    if (!chatInput.trim() || !selectedEducatorId) return;
    try {
      setSendingChat(true);
      const res = await fetch(`/api/teachers/chat/${selectedEducatorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: studentName || 'Aspirant Student',
          msg: chatInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChatInput('');
        fetchLiveChat();
      }
    } catch (err) {
      console.error('Error sending chat:', err);
    } finally {
      setSendingChat(false);
    }
  };

  const selectedEducator = educators.find(e => e.id === selectedEducatorId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5" /> Faculty & Mentorship Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Teacher & Mentor Network
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Connect 1-on-1 with India's top educators for personalized UPSC, SSC, and State PCS exam guidance.
            </p>
          </div>

          <button
            onClick={() => setShowRegModal(true)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 border border-indigo-400/30"
          >
            <Plus className="w-4 h-4" /> Apply as Educator
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Educators & Video Portal (Left) vs Live Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Educators Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Featured Educators
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Verified Faculty Members</span>
            </div>

            {loadingEducators ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs">Loading faculty network...</p>
              </div>
            ) : educators.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No educators registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {educators.map(ed => (
                  <div 
                    key={ed.id}
                    className={`bg-slate-950/60 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                      selectedEducatorId === ed.id ? 'border-indigo-500/60 shadow-lg shadow-indigo-500/10' : 'border-white/5 hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        <img 
                          src={ed.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                          alt={ed.name} 
                          className="w-14 h-14 rounded-2xl border border-white/10 object-cover" 
                        />
                        {/* GAP 4: Online indicator dot */}
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                          ed.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                        }`} />
                      </div>

                      <div className="space-y-1 text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-white text-xs sm:text-sm truncate">{ed.name}</h4>
                          {ed.isVerified && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-bold">Verified</span>}
                        </div>
                        
                        <p className="text-[11px] text-indigo-400 font-bold truncate">{ed.subject}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{ed.experience} • {ed.qualification}</p>

                        {/* GAP 1: Social Proof (Rating + Students Taught) */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {ed.rating && ed.rating > 0 ? (
                            <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-lg">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{ed.rating.toFixed(1)}</span>
                              <span className="text-[9px] text-slate-400 font-normal">({ed.reviewsCount ? ed.reviewsCount.toLocaleString() : 0})</span>
                            </div>
                          ) : (
                            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-lg font-bold">
                              New Educator
                            </span>
                          )}

                          <div className="flex items-center gap-1 text-[10px] text-slate-300 font-medium">
                            <Users className="w-3 h-3 text-indigo-400" />
                            <span>{ed.studentsCount ? ed.studentsCount.toLocaleString() : 0} taught</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GAP 3: Price Display & Actions */}
                    <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-left">
                        {ed.sessionPrice && ed.sessionPrice > 0 ? (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-black">
                            ₹{ed.sessionPrice} / session
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-black">
                            Free Session
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setBookingEducator(ed)}
                          className="px-2.5 py-1.5 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-200 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>Book</span>
                        </button>

                        <button
                          onClick={() => setSelectedEducatorId(ed.id)}
                          className={`px-2 py-1.5 border text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 ${
                            selectedEducatorId === ed.id 
                              ? 'bg-purple-600 text-white border-purple-500' 
                              : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Tv className="w-3 h-3 text-purple-300" />
                          <span>Chat</span>
                        </button>

                        <button
                          onClick={() => handleViewBookings(ed)}
                          className="px-2 py-1.5 bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-[10px] font-bold rounded-xl transition-all flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>List</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video portal playlist */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider pb-3 border-b border-white/5 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" /> Popular Masterclasses
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 rounded-xl overflow-hidden border border-white/5 group">
                <div className="aspect-video bg-gradient-to-tr from-slate-900 to-indigo-950 relative flex items-center justify-center border-b border-white/5">
                  <Video className="w-8 h-8 text-white/40 group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 text-[9px] bg-black/80 text-slate-300 px-1.5 py-0.5 rounded">45:00 Min</span>
                </div>
                <div className="p-3.5 space-y-1 text-left">
                  <h4 className="font-bold text-white text-xs group-hover:text-indigo-400 transition-colors">Indian Polity: Basic Structure Doctrine</h4>
                  <p className="text-[10px] text-slate-400">By Dr. Siddharth Arora • Recorded Lecture</p>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl overflow-hidden border border-white/5 group">
                <div className="aspect-video bg-gradient-to-tr from-slate-900 to-indigo-950 relative flex items-center justify-center border-b border-white/5">
                  <Video className="w-8 h-8 text-white/40 group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 text-[9px] bg-black/80 text-slate-300 px-1.5 py-0.5 rounded">1:12:08 Hr</span>
                </div>
                <div className="p-3.5 space-y-1 text-left">
                  <h4 className="font-bold text-white text-xs group-hover:text-indigo-400 transition-colors">Union Budget Analysis for IAS Mains</h4>
                  <p className="text-[10px] text-slate-400">By Mrunal Patel • Strategy Session</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Classroom & Real-time Chat */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="space-y-1 text-left">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Classroom Chat
              </h3>
              {/* GAP 4: Online/Offline Status in Chat */}
              {selectedEducator && (
                <div className="flex items-center gap-1.5">
                  {selectedEducator.isOnline ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-800/80 border border-white/10 px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                      Offline — replies within a few hours
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-bold">
              {selectedEducator?.name || 'Educator Room'}
            </span>
          </div>

          {/* Whiteboard visual simulator */}
          <div className="aspect-[4/3] bg-slate-950 rounded-xl border border-white/10 p-3 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-950 flex flex-col justify-center items-center p-4">
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-black absolute top-3 left-3">LIVE STREAM</span>
              <div className="text-center space-y-1.5">
                <p className="text-slate-200 text-xs font-black">Interactive Educator Canvas & Video Stream</p>
                <p className="text-[10px] text-slate-400">
                  {selectedEducator?.name || 'Educator'} Live Classroom
                </p>
              </div>
            </div>
          </div>

          {/* Live Chat simulator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-indigo-400" /> Classroom Chat:
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Auto-refreshes live</span>
            </div>
            
            <div className="bg-slate-950/80 border border-white/5 rounded-xl p-3 h-48 overflow-y-auto space-y-2 text-left scrollbar-thin">
              {liveChat.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-14">Iss educator room me abhi koi message nahi hai. Pehla message bhejein!</p>
              ) : (
                liveChat.map((chat) => (
                  <div key={chat.id || Math.random()} className="text-[11px] leading-tight bg-slate-900/40 p-1.5 rounded border border-white/5">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-black text-indigo-400 text-[10px]">{chat.sender}</span>
                      <span className="text-[8px] text-slate-500">{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="text-slate-200">{chat.msg}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendLiveChat()}
                placeholder="Ask doubt or chat live..."
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={sendLiveChat}
                disabled={sendingChat || !chatInput.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shrink-0"
              >
                {sendingChat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Educator Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" /> Apply as an Educator
              </h3>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-400">Join top faculty at AspirantX to guide thousands of students across India.</p>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Dr. Siddharth Arora"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Educator Email Address</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="educator@aspirantx.in"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Syllabus Speciality *</label>
                  <select
                    value={regForm.subject}
                    onChange={(e) => setRegForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Indian Polity & Governance">Indian Polity & Governance</option>
                    <option value="Indian Economy & Budgetary Reforms">Indian Economy</option>
                    <option value="Modern Indian History">Modern Indian History</option>
                    <option value="Geography & Environment">Geography & Environment</option>
                    <option value="Ethics & Case Studies">Ethics & Case Studies</option>
                    <option value="Quantitative Aptitude (SSC/CGL)">Quantitative Aptitude</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Session Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={regForm.sessionPrice}
                    onChange={(e) => setRegForm(prev => ({ ...prev, sessionPrice: Number(e.target.value) }))}
                    placeholder="0 for Free"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Teaching Experience</label>
                <input
                  type="text"
                  value={regForm.experience}
                  onChange={(e) => setRegForm(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="e.g. 8+ Years"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Qualifications / Background</label>
                <input
                  type="text"
                  value={regForm.qualification}
                  onChange={(e) => setRegForm(prev => ({ ...prev, qualification: e.target.value }))}
                  placeholder="e.g. Supreme Court Advocate, PhD"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Bio / Short Introduction</label>
                <textarea
                  rows={2}
                  value={regForm.bio}
                  onChange={(e) => setRegForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Aapki teaching philosophy aur achievements..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Profile Photo URL (Optional)</label>
                <input
                  type="url"
                  value={regForm.avatar}
                  onChange={(e) => setRegForm(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingReg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal (GAP 2 & GAP 3) */}
      {bookingEducator && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="space-y-0.5 text-left">
                <h3 className="font-bold text-slate-100 text-sm">Book 1-on-1 Guidance Session</h3>
                <p className="text-[11px] text-indigo-300 font-bold">{bookingEducator.name}</p>
              </div>
              <button onClick={() => setBookingEducator(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleBookSession} className="space-y-3.5 text-left">
              {/* GAP 2: Tappable Availability Slots Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase flex justify-between">
                  <span>Select Available Slot *</span>
                  <span className="text-indigo-400 font-medium text-[9px]">Tap to choose</span>
                </label>

                {bookingEducator.availability && bookingEducator.availability.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {bookingEducator.availability.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                          selectedSlot === slot
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-950 border-white/10 text-slate-300 hover:border-indigo-500/40'
                        }`}
                      >
                        <span className="truncate">📅 {slot}</span>
                        {selectedSlot === slot && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold">
                    ⚠️ No slots available right now for this educator. Please check back later.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Student Email</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Student Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* GAP 3: Payment UTR Input if Price > 0 */}
              {bookingEducator.sessionPrice && bookingEducator.sessionPrice > 0 ? (
                <div className="space-y-1.5 bg-indigo-950/40 p-3 rounded-2xl border border-indigo-500/30">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Session Fee:</span>
                    <span className="font-black text-emerald-400 text-sm">₹{bookingEducator.sessionPrice}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 font-bold uppercase">Payment UTR / Transaction ID *</label>
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter 12-digit UPI UTR ID"
                      className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <p className="text-[9px] text-slate-400">Pay ₹{bookingEducator.sessionPrice} via UPI QR & enter UTR number for admin verification.</p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Session Fee:</span>
                  <span className="text-emerald-400 font-black">FREE (No payment required)</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Topic / Doubts Note</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Mains Answer Writing doubts & revision roadmap"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              {/* GAP 3: "What happens next" 3-step summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">What Happens Next?</p>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <p>1. {bookingEducator.sessionPrice ? 'Payment verify hoga (Pending Payment)' : 'Instant request submission (Confirmed)'}</p>
                  <p>2. Teacher booking confirm karega</p>
                  <p>3. Aapko meeting link & live classroom access milegi</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBookingEducator(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking || !selectedSlot || (!bookingEducator.availability || bookingEducator.availability.length === 0)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingBooking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bookings Modal (GAP 5: Cancellation Policy) */}
      {viewingBookingsEd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> Bookings for {viewingBookingsEd.name}
              </h3>
              <button onClick={() => setViewingBookingsEd(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            {loadingBookings ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <p className="text-xs">Fetching bookings...</p>
              </div>
            ) : bookingsList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Is educator ke liye abhi koi bookings scheduled nahi hain.</p>
            ) : (
              <div className="space-y-2.5">
                {bookingsList.map(b => {
                  const isCancelled = b.status === 'CANCELLED';
                  return (
                    <div 
                      key={b.id} 
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCancelled 
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-60' 
                          : 'bg-slate-950 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-bold ${isCancelled ? 'line-through text-slate-400' : 'text-indigo-300'}`}>
                          {b.studentName || b.studentEmail}
                        </span>

                        <span className={`text-[9px] px-2 py-0.5 rounded font-black border ${
                          b.status === 'CONFIRMED' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : b.status === 'PENDING_PAYMENT' 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400">📅 Slot: {b.selectedSlot || `${b.date} ${b.time}`}</p>
                      {b.price ? <p className="text-[10px] text-slate-300">💰 Fee: ₹{b.price} {b.utrNumber ? `(UTR: ${b.utrNumber})` : ''}</p> : null}
                      {b.notes && <p className="text-[10px] text-slate-300 italic">"{b.notes}"</p>}

                      {/* GAP 5: Cancel action if active */}
                      {!isCancelled && (
                        <div className="pt-2 mt-2 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => setConfirmCancelBooking(b)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                          >
                            <XCircle className="w-3 h-3 text-rose-400" /> Cancel Booking
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Cancellation */}
      {confirmCancelBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-2xl text-left">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Ban className="w-4 h-4" /> Cancel Booking Confirmation
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to cancel the booking for <strong className="text-white">{confirmCancelBooking.studentName || confirmCancelBooking.studentEmail}</strong> scheduled for <strong className="text-indigo-300">{confirmCancelBooking.selectedSlot || `${confirmCancelBooking.date} ${confirmCancelBooking.time}`}</strong>?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelBooking(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-bold"
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={handleExecuteCancelBooking}
                disabled={cancellingBooking}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1 disabled:opacity-50"
              >
                {cancellingBooking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
