import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Send, 
  MapPin, 
  ShieldAlert, 
  UserX,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface FeedbackEngineProps {
  userEmail?: string;
}

interface FeedbackRecord {
  id: string;
  section: string;
  type: string;
  description: string;
  email: string;
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';
  createdAt: string;
  adminNote?: string | null;
}

const PROFANITY_LIST = [
  // English
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'cunt', 'dick', 'pussy', 'asshat',
  // Hindi / Hinglish Transliterations
  'chutiya', 'bhenchod', 'madarchod', 'loda', 'gaand', 'lund', 'saala', 'harami', 
  'bkl', 'mc', 'bc', 'bkc', 'kutta', 'kameena', 'gandu', 'chut', 'bhonsd'
];

export const FeedbackEngine: React.FC<FeedbackEngineProps> = ({ userEmail = 'guest@example.com' }) => {
  const [section, setSection] = useState<string>('cbt');
  const [issueType, setIssueType] = useState<string>('bug');
  const [description, setDescription] = useState<string>('');
  const [email, setEmail] = useState<string>(userEmail);
  const [logs, setLogs] = useState<FeedbackRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [violationCount, setViolationCount] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Check description for profanity
  const checkAbusiveContent = (text: string): boolean => {
    const cleanText = text.toLowerCase();
    return PROFANITY_LIST.some(word => cleanText.includes(word));
  };

  const hasProfanity = checkAbusiveContent(description);

  const fetchUserReports = async () => {
    setIsLoadingLogs(true);
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/feedback/mine', { headers });
      const data = await res.json();
      if (res.status === 401) {
        setLogs([]);
        return;
      }
      if (data.success && Array.isArray(data.feedback)) {
        setLogs(data.feedback.map((r: any) => ({
          id: r.id,
          section: r.section,
          type: r.type,
          description: r.description,
          email: r.user_email || r.email || email,
          status: r.status,
          createdAt: r.created_at ? new Date(r.created_at).toLocaleString() : new Date().toLocaleString(),
          adminNote: r.admin_note
        })));
      }
    } catch (err) {
      console.error('Failed to fetch user feedback reports:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUserReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasProfanity) {
      const nextCount = violationCount + 1;
      setViolationCount(nextCount);
      if (nextCount >= 3) {
        setIsLockedOut(true);
      } else {
        alert(`🚨 Warning: Abusive/Profane content is strictly prohibited! (Violation: ${nextCount}/3)`);
      }
      return;
    }

    if (!description.trim()) {
      alert('Please fill out the description field.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          section: section.replace('_', ' ').toUpperCase(),
          type: issueType.toUpperCase(),
          description: description.trim(),
          user_email: email.trim().toLowerCase()
        })
      });

      const data = await res.json();
      if (data.success) {
        setDescription('');
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 4000);
        fetchUserReports();
      } else {
        alert(`Error submitting report: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Failed to submit feedback: ${err.message || 'Network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLockedOut) {
    return (
      <div className="min-h-[70vh] bg-rose-950/20 border-2 border-rose-500/40 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto backdrop-blur-xl">
        <UserX className="w-20 h-20 text-rose-500 animate-bounce" />
        <div className="space-y-2">
          <h2 className="text-xl font-black text-rose-300 uppercase tracking-tight">Security Lockout Active</h2>
          <p className="text-xs text-rose-200 leading-relaxed max-w-sm">
            Aapne 3 baar warning ke baad bhi feedback form me abusive content use kiya hai. Policy rules ke according aapka portal access temporarily block kar diya gaya hai.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-rose-950/50 border border-rose-500/20 text-[11px] font-bold text-rose-400 font-mono">
          REF_ID: AX_LOCKOUT_{Date.now().toString().slice(-6)}
        </div>
        <button
          onClick={() => {
            setIsLockedOut(false);
            setViolationCount(0);
            setDescription('');
          }}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
        >
          Reset Security Verification (Admin Only)
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* Feedback input form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-6 rounded-3xl bg-[#0d0d12]/80 border border-white/10 space-y-6 backdrop-blur-xl relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Submit Feedback & Report Bugs
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Profanity Guard active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                AspirantX portal me aane waali kisi bhi dikkat ko direct report karein.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            
            {/* Section & Type selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Platform Section / Page
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-rose-500/50"
                >
                  <option value="cbt">CBT Exam Practice Engine</option>
                  <option value="pyq">PYQ Bank Archive</option>
                  <option value="question_bank">Question Bank Engine</option>
                  <option value="syllabus">Syllabus Tracker</option>
                  <option value="library">NCERT Reference Library</option>
                  <option value="flashcards">Flashcard Recall Engine</option>
                  <option value="teachers">Teacher Live Portal</option>
                  <option value="podcasts">Topper Podcast Series</option>
                  <option value="eligibility">Eligibility Check Calc</option>
                  <option value="ai_chat">Gemini Study Buddy Chat</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5">Issue/Feedback Category</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-rose-500/50"
                >
                  <option value="bug">Technical Bug / Interface Error</option>
                  <option value="content">Content Correctness Issue</option>
                  <option value="font">Readability / Font Mismatch</option>
                  <option value="feature">New Feature Proposal</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>
            </div>

            {/* Email input */}
            <div>
              <label className="text-slate-400 block mb-1.5">Your Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-rose-500/50 font-mono"
              />
            </div>

            {/* Feedback details */}
            <div className="relative">
              <label className="text-slate-400 block mb-1.5">Explain what went wrong</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Issue ke regarding details likhein..."
                className={`w-full p-3.5 rounded-2xl bg-black/60 border transition-all text-xs font-semibold leading-relaxed text-white focus:outline-none ${
                  hasProfanity 
                    ? 'border-rose-500/80 bg-rose-950/10 focus:border-rose-500' 
                    : 'border-white/10 focus:border-rose-500/50'
                }`}
              />

              {/* Profanity Guard Warning Overlay */}
              <AnimatePresence>
                {hasProfanity && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[11px]">🚨 Form Submission Blocked: Abusive Language</p>
                      <p className="text-[10px] text-rose-200 mt-0.5">
                        Humari security policy ke accoring feedback form me abusive content allowed nahi hai. Krpya clean and professional language me submit karein.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[10px] text-slate-500 font-bold">
                Violation Tracker: {violationCount}/3 warnings
              </div>

              <button
                type="submit"
                disabled={hasProfanity || isSubmitting}
                className={`px-5 py-3 rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-1.5 ${
                  hasProfanity || isSubmitting
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 cursor-not-allowed' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Report
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Success Overlay toast */}
          <AnimatePresence>
            {submissionSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0d0d12] flex flex-col items-center justify-center text-center space-y-3 p-6 z-10"
              >
                <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                <div>
                  <h4 className="text-white font-extrabold text-sm">Feedback Registered Successfully</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                    Thank you! Aapka bug report secure database par save kar diya gaya hai. Admin team isko review karegi.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Audit logs & previous feedback */}
      <div className="space-y-4">
        <div className="p-5 rounded-3xl bg-[#0d0d12]/80 border border-white/10 space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" /> My Submitted Feedback
            </h3>
            <button
              onClick={fetchUserReports}
              disabled={isLoadingLogs}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {isLoadingLogs ? (
              <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> Loading report history...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs rounded-xl bg-black/40 border border-white/5 font-mono">
                No feedback reports found for your account.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-rose-400 font-extrabold font-mono">
                        {log.section}
                      </span>
                      <h4 className="font-black text-white text-[11px] mt-1">{log.type}</h4>
                    </div>
                    
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded shrink-0 ${
                      log.status === 'Resolved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : log.status === 'Under Review'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : log.status === 'Rejected'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 font-medium leading-relaxed bg-slate-950 p-2 rounded-lg font-serif">
                    "{log.description}"
                  </p>

                  {log.adminNote && (
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[10px] text-emerald-300">
                      <span className="font-extrabold text-emerald-400 block text-[9px] uppercase tracking-wider mb-0.5">Admin Note / Resolution:</span>
                      {log.adminNote}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                    <span className="font-mono">{log.email}</span>
                    <span>{log.createdAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
