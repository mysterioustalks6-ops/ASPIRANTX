import React, { useState, useEffect } from 'react';
import { 
  Handshake, 
  Users, 
  Sparkles, 
  Mail, 
  Building, 
  Award, 
  Plus, 
  Check, 
  X, 
  Send, 
  Briefcase, 
  Clock, 
  Activity, 
  CheckSquare, 
  Lock, 
  UserCheck, 
  ThumbsUp, 
  TrendingUp, 
  Github, 
  Linkedin, 
  Twitter, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website: string;
  tier: 'gold' | 'silver';
  description: string;
}

interface Collaborator {
  id: string;
  name: string;
  logo: string;
  type: string;
  contribution: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'IDLE' | 'OFFLINE';
  currentActivity?: string;
  joinedAt: string;
}

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  module: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
  assignedAt: string;
  dueDate: string;
}

interface OfficeActivity {
  id: string;
  timestamp: string;
  memberName: string;
  action: string;
  details: string;
}

interface PendingUpload {
  id: string;
  uploader: string;
  exam: string;
  subject: string;
  topic: string;
  questionCount: number;
  title: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface SponsorshipCollaborationProps {
  user: UserProfile;
}

export const SponsorshipCollaboration: React.FC<SponsorshipCollaborationProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'public' | 'office'>('public');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [activityFeed, setActivityFeed] = useState<OfficeActivity[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  
  // Loading & states
  const [loading, setLoading] = useState(true);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  // Form states
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    organization: '',
    email: '',
    message: '',
    tier: 'silver'
  });
  
  const [teamForm, setTeamForm] = useState({
    name: '',
    email: '',
    role: 'Content Contributor',
    bio: '',
    github: '',
    linkedin: ''
  });

  // Current logged in team member simulated status updates
  const [myStatus, setMyStatus] = useState<'ACTIVE' | 'IDLE' | 'OFFLINE'>('ACTIVE');
  const [myActivity, setMyActivity] = useState('');
  
  // Success states
  const [sponsorSuccess, setSponsorSuccess] = useState(false);
  const [teamSuccess, setTeamSuccess] = useState(false);

  // Reject modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch all public details
  const fetchPublicData = async () => {
    try {
      const res = await fetch('/api/collaboration/public');
      const data = await res.json();
      if (data.success) {
        setSponsors(data.sponsors);
        setCollaborators(data.collaborators);
        setTeam(data.team);
      }
    } catch (err) {
      console.error('Error fetching public collab data', err);
    }
  };

  // Fetch full virtual office data
  const fetchOfficeData = async () => {
    try {
      const res = await fetch('/api/collaboration/office');
      const data = await res.json();
      if (data.success) {
        setTeam(data.team);
        setTasks(data.tasks);
        setActivityFeed(data.activity);
        setPendingUploads(data.pendingUploads);
      }
    } catch (err) {
      console.error('Error fetching office data', err);
    }
  };

  useEffect(() => {
    fetchPublicData();
    fetchOfficeData().finally(() => setLoading(false));
    
    // Auto refresh office statistics/presence every 15 seconds
    const interval = setInterval(() => {
      if (activeSubTab === 'office') {
        fetchOfficeData();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  // Handle Sponsor Apply
  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/collaboration/sponsor-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sponsorForm)
      });
      const data = await res.json();
      if (data.success) {
        setSponsorSuccess(true);
        setTimeout(() => {
          setShowSponsorModal(false);
          setSponsorSuccess(false);
          setSponsorForm({ name: '', organization: '', email: '', message: '', tier: 'silver' });
        }, 3000);
        fetchOfficeData();
      }
    } catch (err) {
      console.error('Error applying for sponsorship', err);
    }
  };

  // Handle Join Team
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/collaboration/join-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm)
      });
      const data = await res.json();
      if (data.success) {
        setTeamSuccess(true);
        setTimeout(() => {
          setShowTeamModal(false);
          setTeamSuccess(false);
          setTeamForm({ name: '', email: '', role: 'Content Contributor', bio: '', github: '', linkedin: '' });
        }, 3000);
        fetchOfficeData();
      }
    } catch (err) {
      console.error('Error submitting team application', err);
    }
  };

  // Handle update user status in virtual office
  const handleUpdateStatus = async () => {
    try {
      const res = await fetch('/api/collaboration/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          status: myStatus,
          currentActivity: myActivity
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchOfficeData();
        setMyActivity('');
      }
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  // Move task status
  const handleMoveTask = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/collaboration/update-task-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOfficeData();
      }
    } catch (err) {
      console.error('Error moving task', err);
    }
  };

  // Approve content upload
  const handleApproveContent = async (uploadId: string) => {
    try {
      const res = await fetch('/api/collaboration/approve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, reviewerName: user.name })
      });
      const data = await res.json();
      if (data.success) {
        fetchOfficeData();
      }
    } catch (err) {
      console.error('Error approving content', err);
    }
  };

  // Reject content upload
  const handleRejectContentSubmit = async () => {
    if (!rejectId || !rejectReason) return;
    try {
      const res = await fetch('/api/collaboration/reject-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: rejectId, reason: rejectReason, reviewerName: user.name })
      });
      const data = await res.json();
      if (data.success) {
        setRejectId(null);
        setRejectReason('');
        fetchOfficeData();
      }
    } catch (err) {
      console.error('Error rejecting content', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation / Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/40 border border-white/10 rounded-2xl p-4 gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Partnership & Virtual Office
            </h1>
            <p className="text-xs text-slate-400">
              Explore sponsors, join our community contribution staff, or enter the Team Virtual Office workspace.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveSubTab('public')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'public'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Sponsorship & Team Info</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('office')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'office'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Virtual Office Workspace</span>
            <span className="bg-[#00FF94]/20 text-[#00FF94] text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
              Live
            </span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: PUBLIC SPONSORS, TEAM & FOUNDER ── */}
      {activeSubTab === 'public' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main tags/tagline bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-slate-950/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-4">
                <Sparkles className="w-3 h-3" /> Empowering India
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                India's Largest Free Exam Question Bank & Prep Suite
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                AspirantX connects state, central, and entrance exam aspirants with high-quality previous year questions, solutions, and analytics. We partner with coaching institutes, universities, and educators to keep quality resources open and accessible to all students.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-xl font-black text-cyan-400">4,000+</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Real Exam Questions</div>
                </div>
                <div>
                  <div className="text-xl font-black text-purple-400">35+ Years</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">PYQ Archive</div>
                </div>
                <div>
                  <div className="text-xl font-black text-emerald-400">0 Fees</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">100% Free Core Access</div>
                </div>
              </div>
            </div>

            {/* CTA panel */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Handshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Partner with AspirantX</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Support free education in India by becoming a Gold/Silver sponsor or contributing question banks as an academic collaborator.
                </p>
              </div>

              <div className="space-y-3 pt-6">
                <button
                  onClick={() => setShowSponsorModal(true)}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Become a Sponsor / Content Partner
                </button>
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-white/10 text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  Join the Team as a Contributor
                </button>
              </div>
            </div>
          </div>

          {/* Sponsors Wall */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-white">Our Sponsors Wall</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gold Tiers */}
              {sponsors.filter(s => s.tier === 'gold').map(sp => (
                <div key={sp.id} className="bg-gradient-to-br from-amber-500/10 to-slate-900/80 border-2 border-amber-500/40 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                    Gold Sponsor
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <img src={sp.logo} alt={sp.name} className="w-12 h-12 rounded-xl object-cover border border-amber-500/30" />
                    <div>
                      <h3 className="font-extrabold text-white text-base">{sp.name}</h3>
                      <a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-400 hover:underline">
                        Visit website →
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {sp.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Silver Sponsors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              {sponsors.filter(s => s.tier === 'silver').map(sp => (
                <div key={sp.id} className="bg-slate-900/40 border border-white/10 hover:border-slate-750 rounded-xl p-4 flex items-start gap-4 transition-all">
                  <img src={sp.logo} alt={sp.name} className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{sp.name}</h4>
                      <span className="text-[8px] px-1 bg-slate-800 text-slate-300 rounded font-bold uppercase">Silver</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {sp.description}
                    </p>
                    <a href={sp.website} target="_blank" rel="noopener noreferrer" className="inline-block text-[9px] text-cyan-400 hover:underline">
                      Learn more
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Collaborators & Content Contributors */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-black text-white">Academic & Content Collaborators</h2>
            </div>
            <p className="text-xs text-slate-400 -mt-2">
              Coaching institutes, university professors, and toppers who contribute verified paper transcripts and questions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {collaborators.map(col => (
                <div key={col.id} className="bg-slate-900/20 border border-white/5 hover:border-cyan-500/20 rounded-xl p-4 space-y-3 transition-all relative overflow-hidden group">
                  <div className="flex items-center gap-3">
                    <img src={col.logo} alt={col.name} className="w-10 h-10 rounded-lg object-cover border border-white/5" />
                    <div>
                      <h4 className="font-bold text-white text-xs leading-tight">{col.name}</h4>
                      <span className="text-[9px] text-cyan-400 font-semibold">{col.type}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                    <span className="text-slate-500 font-bold uppercase text-[9px] block mb-0.5">Contribution</span>
                    {col.contribution}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Founder Story & Timelines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" /> Founder Story & Goal
              </h3>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" 
                  alt="Founder Ambuj Yadav" 
                  className="w-24 h-24 rounded-2xl object-cover border border-white/10 shadow-lg shrink-0" 
                />
                <div className="space-y-3">
                  <h4 className="font-extrabold text-white text-sm">Ambuj Yadav — Founder & Creator</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    "AspirantX was started with a simple belief: access to quality practice materials should never depend on a student's bank balance. In India, civil service and competitive entrance exams define careers, but expensive mock papers lock out deserving minds. By combining AI-generated questions with standard PYQs in an open-access system, we level the playing field."
                  </p>
                  <p className="text-slate-400 text-[11px] italic">
                    For inquiries: <span className="text-cyan-400">ambujyadav0010@gmail.com</span>
                  </p>
                </div>
              </div>

              {/* Milestones timeline */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider text-slate-400">Platform Milestones Timeline</h4>
                <div className="relative border-l border-white/10 ml-2 pl-4 space-y-6 text-xs">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                    <span className="font-bold text-cyan-300">August 2026</span>
                    <p className="text-slate-300 mt-0.5 font-medium">Released CBT Mock Test Engine & Verified 45-Day Study Streak Challenge</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-bold text-slate-300">May 2026</span>
                    <p className="text-slate-400 mt-0.5">Implemented AI-powered answer writer evaluator and chatbot mentor</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <span className="font-bold text-slate-400">January 2026</span>
                    <p className="text-slate-500 mt-0.5">Beta release of AspirantX platform with interactive Syllabus Tracker</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Staff Directory */}
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Core Platform Team
              </h3>
              
              <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2">
                {team.slice(0, 5).map(member => (
                  <div key={member.id} className="flex items-center justify-between bg-slate-950/40 border border-white/5 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                      <div>
                        <h4 className="font-bold text-white text-xs leading-none mb-1">{member.name}</h4>
                        <p className="text-[10px] text-slate-400 leading-none">{member.title}</p>
                        <p className="text-[9px] text-cyan-400 font-medium mt-1 uppercase tracking-wide">{member.department}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: VIRTUAL OFFICE WORKSPACE ── */}
      {activeSubTab === 'office' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Status update widget & stats grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-r from-slate-900/60 to-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" /> Update Your Live Office Status
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/3 space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Presence State</label>
                  <select 
                    value={myStatus} 
                    onChange={(e) => setMyStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="ACTIVE">🟢 Online - Working</option>
                    <option value="IDLE">🟡 Idle / Away</option>
                    <option value="OFFLINE">⚪ Offline</option>
                  </select>
                </div>
                
                <div className="w-full sm:w-2/3 space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">What are you working on?</label>
                  <input
                    type="text"
                    value={myActivity}
                    onChange={(e) => setMyActivity(e.target.value)}
                    placeholder="e.g. Uploading UPSC Prelims 2026 Polity papers..."
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  onClick={handleUpdateStatus}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Staff</span>
                <span className="text-2xl font-black text-white flex items-baseline gap-1.5 mt-2">
                  {team.filter(t => t.status === 'ACTIVE').length} <span className="text-xs text-[#00FF94] font-bold">Online</span>
                </span>
              </div>
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks Pending</span>
                <span className="text-2xl font-black text-white flex items-baseline gap-1.5 mt-2">
                  {tasks.filter(t => t.status !== 'COMPLETED').length} <span className="text-xs text-indigo-400 font-bold">Open</span>
                </span>
              </div>
            </div>
          </div>

          {/* Live presence grid */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Virtual Office Presence Desk
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {team.map(member => (
                <div key={member.id} className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-white/15" />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        member.status === 'ACTIVE' ? 'bg-[#00FF94]' : member.status === 'IDLE' ? 'bg-amber-400' : 'bg-slate-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">{member.name}</h4>
                      <p className="text-[10px] text-slate-400 leading-tight">{member.title}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/60 rounded-xl p-2.5 text-[11px] border border-white/5 min-h-[50px] flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Current Activity</span>
                    <span className="text-slate-300 font-medium line-clamp-2">
                      {member.currentActivity || 'Active presence in workspace'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban Task board */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Kanban Task Delegation Board
              </h3>
              <span className="text-xs text-slate-400">Move tasks using status buttons</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* To Do Column */}
              <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">To Do</span>
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-black">
                    {tasks.filter(t => t.status === 'PENDING').length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {tasks.filter(t => t.status === 'PENDING').map(task => (
                    <div key={task.id} className="bg-slate-900/60 border border-white/10 p-3 rounded-xl space-y-2 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">{task.module}</span>
                        {task.priority === 'HIGH' && (
                          <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded font-black border border-rose-500/30">HIGH</span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs leading-snug">{task.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{task.description}</p>
                      
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400">
                        <span>@{task.assignedToName}</span>
                        <button
                          onClick={() => handleMoveTask(task.id, 'IN_PROGRESS')}
                          className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded hover:bg-indigo-600 hover:text-white"
                        >
                          Start →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">In Progress</span>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded font-black">
                    {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
                    <div key={task.id} className="bg-slate-900/60 border border-white/10 p-3 rounded-xl space-y-2 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">{task.module}</span>
                        {task.priority === 'HIGH' && (
                          <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded font-black border border-rose-500/30">HIGH</span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs leading-snug">{task.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{task.description}</p>
                      
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400 gap-1">
                        <span>@{task.assignedToName}</span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveTask(task.id, 'PENDING')}
                            className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                          >
                            ← Pause
                          </button>
                          <button
                            onClick={() => handleMoveTask(task.id, 'IN_REVIEW')}
                            className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded hover:bg-indigo-600 hover:text-white"
                          >
                            Submit →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Review Column */}
              <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">In Review</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-black">
                    {tasks.filter(t => t.status === 'IN_REVIEW').length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {tasks.filter(t => t.status === 'IN_REVIEW').map(task => (
                    <div key={task.id} className="bg-slate-900/60 border border-white/10 p-3 rounded-xl space-y-2 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">{task.module}</span>
                        {task.priority === 'HIGH' && (
                          <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded font-black border border-rose-500/30">HIGH</span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs leading-snug">{task.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{task.description}</p>
                      
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400 gap-1">
                        <span>@{task.assignedToName}</span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveTask(task.id, 'IN_PROGRESS')}
                            className="bg-slate-800 text-slate-300 px-1 rounded"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleMoveTask(task.id, 'COMPLETED')}
                            className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/20 px-1 rounded hover:bg-emerald-600 hover:text-white"
                          >
                            Approve ✅
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Done</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-black">
                    {tasks.filter(t => t.status === 'COMPLETED').length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {tasks.filter(t => t.status === 'COMPLETED').map(task => (
                    <div key={task.id} className="bg-slate-900/40 border border-white/5 p-3 rounded-xl space-y-2 opacity-70">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{task.module}</span>
                      <h4 className="font-bold text-white/80 text-xs leading-snug line-through">{task.title}</h4>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500">
                        <span>@{task.assignedToName}</span>
                        <span className="text-emerald-500 flex items-center gap-1 font-bold">
                          <Check className="w-3 h-3" /> Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Content Approval Workflow & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Content approval workflow panel */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" /> Academic Content Approval Queue
                </h3>
                <span className="text-[10px] font-black uppercase text-indigo-300">Editor Review</span>
              </div>

              {pendingUploads.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 border border-white/5 rounded-xl">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-55" />
                  <p className="text-xs font-bold text-slate-400">All content uploads approved!</p>
                  <p className="text-[10px] text-slate-500">Queue is currently clear.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {pendingUploads.map(up => (
                    <div key={up.id} className="bg-slate-950/60 border border-white/15 p-4 rounded-xl space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-cyan-400">{up.exam.replace('_', ' ')} / {up.subject}</span>
                          <h4 className="font-bold text-white text-xs">{up.title}</h4>
                        </div>
                        <span className="bg-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded font-bold border border-amber-500/30">
                          {up.questionCount} Questions
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded-lg">
                        <div>
                          <span className="text-slate-500 block">Uploader</span>
                          <span className="text-slate-200 font-bold">{up.uploader}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Submitted</span>
                          <span className="text-slate-200">{new Date(up.uploadedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end pt-1">
                        <button
                          onClick={() => {
                            setRejectId(up.id);
                            setRejectReason('');
                          }}
                          className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs rounded-lg transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveContent(up.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Office real-time activity feed */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Real-time Activity Feed
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {activityFeed.map(act => (
                  <div key={act.id} className="bg-slate-950/30 border border-white/5 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-cyan-400">@{act.memberName}</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-medium">
                      <span className="font-black text-indigo-300 mr-2 uppercase text-[9px] border border-indigo-500/20 px-1 rounded">
                        {act.action}
                      </span>
                      {act.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: BECOME SPONSOR FORM ── */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowSponsorModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Become a Sponsor / Collaborator</h3>
                <p className="text-[11px] text-slate-400">Empower competitive students across India</p>
              </div>
            </div>

            {sponsorSuccess ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 bg-emerald-500/20 text-[#00FF94] rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-bounce">
                  ✓
                </div>
                <h4 className="text-white font-bold text-sm">Application Submitted!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Hamari Operations Team aapki sponsorship/collaboration details verify karke jald contact karegi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSponsorSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                    <input
                      type="text"
                      required
                      value={sponsorForm.name}
                      onChange={(e) => setSponsorForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Rahul Verma"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Organization</label>
                    <input
                      type="text"
                      required
                      value={sponsorForm.organization}
                      onChange={(e) => setSponsorForm(prev => ({ ...prev, organization: e.target.value }))}
                      placeholder="e.g. Vision Institute"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={sponsorForm.email}
                    onChange={(e) => setSponsorForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. rahul@vision.in"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Sponsorship Level Tier</label>
                  <select
                    value={sponsorForm.tier}
                    onChange={(e) => setSponsorForm(prev => ({ ...prev, tier: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="gold">Gold Tier Sponsor (₹50,000+/mo)</option>
                    <option value="silver">Silver Tier Sponsor (₹20,000+/mo)</option>
                    <option value="partner">Content / Academic Partner (Free Notes/PYQs)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Inquiry details / message</label>
                  <textarea
                    rows={4}
                    value={sponsorForm.message}
                    onChange={(e) => setSponsorForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us about how you want to contribute or display your brand..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Sponsorship Proposal</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 2: JOIN TEAM FORM ── */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowTeamModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Join the Team / Contributor</h3>
                <p className="text-[11px] text-slate-400">Work inside the AspirantX virtual workspace</p>
              </div>
            </div>

            {teamSuccess ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 bg-[#7000FF]/20 text-purple-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-bounce">
                  ✓
                </div>
                <h4 className="text-white font-bold text-sm">Application Submitted!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Aapki details review karke, platform editors jald email setup code send karenge.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                    <input
                      type="text"
                      required
                      value={teamForm.name}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={teamForm.email}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. priya@gmail.com"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Role You are Applying For</label>
                  <select
                    value={teamForm.role}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Content Uploader">Academic Content Uploader (Tagging PYQs)</option>
                    <option value="Technical Developer">Fullstack Web Developer</option>
                    <option value="Community Moderator">Group Chat Moderator</option>
                    <option value="Syllabus Reviewer">Syllabus Mapping Expert</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">About Yourself / Experience</label>
                  <textarea
                    rows={3}
                    value={teamForm.bio}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Short 2-3 lines about your exam prep history or skills..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">GitHub Profile (optional)</label>
                    <input
                      type="text"
                      value={teamForm.github}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, github: e.target.value }))}
                      placeholder="https://github.com/..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">LinkedIn Profile (optional)</label>
                    <input
                      type="text"
                      value={teamForm.linkedin}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Team Application</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 3: REJECT CONTENT DIALOG ── */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Reject Content Submission
            </h3>
            <p className="text-xs text-slate-400">
              Provide feedback to the uploader explaining why this content is rejected.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Reason for Rejection</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Typo in answer explanations, missing diagrams in GS-2 section..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                onClick={() => setRejectId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectContentSubmit}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20"
              >
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
