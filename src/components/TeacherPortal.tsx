import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Video, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  BookOpen, 
  Award, 
  UserCheck, 
  GraduationCap, 
  Send, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  Edit3, 
  X, 
  Search, 
  Check, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { 
  UserProfile, 
  TeacherProfile, 
  TeacherClass, 
  ClassAssignment, 
  AssignmentSubmission, 
  TeacherStudentAggregate,
  ActiveTab 
} from '../types';

interface TeacherPortalProps {
  user: UserProfile;
  onNavigate?: (tab: ActiveTab) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ user, onNavigate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'assignments' | 'students' | 'profile' | 'live_classes'>('classes');
  
  // Teacher Profile state
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    subjects: user.streamOrSubject ? [user.streamOrSubject] : ['General Studies'],
    subjectInput: '',
    bio: user.bio || '',
    qualification: 'Faculty / Educator',
    experienceYears: 3,
    photoUrl: user.avatar_url || ''
  });

  // Classes state
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [classStudents, setClassStudents] = useState<{ enrollments: any[]; attendance: any[] }>({ enrollments: [], attendance: [] });
  const [loadingClassStudents, setLoadingClassStudents] = useState<boolean>(false);

  // New Class Form state
  const [classForm, setClassForm] = useState({
    title: '',
    subject: user.streamOrSubject || 'General Studies',
    description: '',
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    durationMins: 60,
    maxStudents: 100,
    meetingLink: ''
  });

  // Recording link state
  const [recordingUrlInput, setRecordingUrlInput] = useState<string>('');

  // Assignments state
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState<boolean>(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
    attachmentUrl: ''
  });
  const [selectedAssignment, setSelectedAssignment] = useState<ClassAssignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [gradingModalSub, setGradingModalSub] = useState<AssignmentSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  // My Students state
  const [studentsList, setStudentsList] = useState<TeacherStudentAggregate[]>([]);
  const [loadingStudentsList, setLoadingStudentsList] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Notice & Notification banner
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('aspirantx_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (user.role) headers['X-User-Role'] = user.role;
    return headers;
  };

  // 1. Fetch Teacher Profile
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/teacher/profile?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setTeacherProfile(data.profile);
        setProfileForm({
          name: data.profile.name || user.name || '',
          subjects: data.profile.subjects || ['General Studies'],
          subjectInput: '',
          bio: data.profile.bio || '',
          qualification: data.profile.qualification || 'Faculty',
          experienceYears: data.profile.experienceYears || 3,
          photoUrl: data.profile.photoUrl || user.avatar_url || ''
        });
      } else {
        // Auto show setup modal if not created yet
        setShowProfileModal(true);
      }
    } catch (_e) {
      setShowProfileModal(true);
    } finally {
      setLoadingProfile(false);
    }
  };

  // 2. Fetch Teacher Classes
  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await fetch(`/api/teacher/classes?teacherId=${encodeURIComponent(user.id)}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.classes)) {
        setClasses(data.classes);
        if (data.classes.length > 0 && !selectedClass) {
          setSelectedClass(data.classes[0]);
        }
      }
    } catch (_e) {} finally {
      setLoadingClasses(false);
    }
  };

  // Fetch Class Enrolled & Attendance
  const fetchClassStudents = async (classId: string) => {
    setLoadingClassStudents(true);
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/students`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setClassStudents({ enrollments: data.enrollments || [], attendance: data.attendance || [] });
      }
    } catch (_e) {} finally {
      setLoadingClassStudents(false);
    }
  };

  // Fetch Assignments for selected class
  const fetchClassAssignments = async (classId: string) => {
    setLoadingAssignments(true);
    try {
      const res = await fetch(`/api/teacher/classes/${classId}/assignments`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.assignments)) {
        setAssignments(data.assignments);
      }
    } catch (_e) {} finally {
      setLoadingAssignments(false);
    }
  };

  // Fetch Submissions for assignment
  const fetchSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/teacher/assignments/${assignmentId}/submissions`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
      }
    } catch (_e) {} finally {
      setLoadingSubmissions(false);
    }
  };

  // Fetch My Students
  const fetchMyStudents = async () => {
    setLoadingStudentsList(true);
    try {
      const res = await fetch(`/api/teacher/my-students?teacherId=${encodeURIComponent(user.id)}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        setStudentsList(data.students);
      }
    } catch (_e) {} finally {
      setLoadingStudentsList(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchClasses();
  }, [user.id]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass.id);
      fetchClassAssignments(selectedClass.id);
      setRecordingUrlInput(selectedClass.recordingUrl || '');
    }
  }, [selectedClass?.id]);

  useEffect(() => {
    if (activeSubTab === 'students') {
      fetchMyStudents();
    }
  }, [activeSubTab]);

  // Handle Save Teacher Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: profileForm.name,
          subjects: profileForm.subjects,
          bio: profileForm.bio,
          qualification: profileForm.qualification,
          experienceYears: Number(profileForm.experienceYears),
          photoUrl: profileForm.photoUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setTeacherProfile(data.profile);
        setShowProfileModal(false);
        setActionNotice('✅ Teacher profile saved successfully!');
      }
    } catch (_e) {
      setActionNotice('Profile updated locally');
    }
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Handle Schedule Class
  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          teacherId: user.id,
          teacherName: teacherProfile?.name || user.name || 'Faculty Member',
          title: classForm.title,
          subject: classForm.subject,
          description: classForm.description,
          scheduledAt: new Date(classForm.scheduledAt).toISOString(),
          durationMins: Number(classForm.durationMins),
          maxStudents: Number(classForm.maxStudents),
          meetingLink: classForm.meetingLink || `https://meet.jit.si/aspirantx-class-${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setClasses((prev) => [data.class, ...prev]);
        setSelectedClass(data.class);
        setShowScheduleModal(false);
        setClassForm({
          title: '',
          subject: user.streamOrSubject || 'General Studies',
          description: '',
          scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
          durationMins: 60,
          maxStudents: 100,
          meetingLink: ''
        });
        setActionNotice('✅ Class scheduled successfully!');
      }
    } catch (_e) {}
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Handle Update Class Status
  const handleUpdateClassStatus = async (classId: string, newStatus: 'SCHEDULED' | 'LIVE' | 'COMPLETED', recUrl?: string) => {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          ...(recUrl !== undefined ? { recordingUrl: recUrl } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, status: newStatus, recordingUrl: recUrl || c.recordingUrl } : c)));
        if (selectedClass?.id === classId) {
          setSelectedClass((prev) => (prev ? { ...prev, status: newStatus, recordingUrl: recUrl || prev.recordingUrl } : prev));
        }
        setActionNotice(`✅ Class marked as ${newStatus}`);
      }
    } catch (_e) {}
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Handle Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          teacherId: user.id,
          title: assignmentForm.title,
          description: assignmentForm.description,
          dueDate: new Date(assignmentForm.dueDate).toISOString(),
          attachmentUrl: assignmentForm.attachmentUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssignments((prev) => [data.assignment, ...prev]);
        setShowCreateAssignmentModal(false);
        setAssignmentForm({
          title: '',
          description: '',
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
          attachmentUrl: ''
        });
        setActionNotice('✅ Assignment created for class!');
      }
    } catch (_e) {}
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Handle Grade Submission
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModalSub) return;

    try {
      const res = await fetch(`/api/teacher/submissions/${gradingModalSub.id}/grade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          grade: gradeInput,
          feedback: feedbackInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions((prev) => prev.map((s) => (s.id === gradingModalSub.id ? { ...s, grade: gradeInput, feedback: feedbackInput, gradedAt: new Date().toISOString() } : s)));
        setGradingModalSub(null);
        setGradeInput('');
        setFeedbackInput('');
        setActionNotice('✅ Submission graded!');
      }
    } catch (_e) {}
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Add/Remove subject tag
  const handleAddSubjectTag = () => {
    if (profileForm.subjectInput.trim() && !profileForm.subjects.includes(profileForm.subjectInput.trim())) {
      setProfileForm((prev) => ({
        ...prev,
        subjects: [...prev.subjects, prev.subjectInput.trim()],
        subjectInput: ''
      }));
    }
  };

  const handleRemoveSubjectTag = (sub: string) => {
    setProfileForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== sub)
    }));
  };

  const filteredStudents = studentsList.filter((s) =>
    s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.studentEmail.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <GraduationCap className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Teacher Portal & Faculty Center
                </h1>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Verified Faculty
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                Schedule live classes, manage enrolled students, issue class assignments, track attendance, and grade submissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule Class
            </button>            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="mt-4 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {actionNotice}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-extrabold'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          My Classes ({classes.length})
        </button>

        <button
          onClick={() => setActiveSubTab('assignments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'assignments'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-extrabold'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Assignments & Submissions ({assignments.length})
        </button>

        <button
          onClick={() => setActiveSubTab('students')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'students'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-extrabold'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          My Enrolled Students
        </button>
      </div>

      {/* TAB 1: CLASSES DASHBOARD & DETAILS */}
      {activeSubTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Classes List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Scheduled Classes
              </h3>
              <span className="text-xs text-slate-400 font-mono">{classes.length} total</span>
            </div>

            {loadingClasses ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs animate-pulse">
                Loading classes...
              </div>
            ) : classes.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <Video className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">No classes scheduled yet.</p>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Schedule First Class
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => {
                  const isSelected = selectedClass?.id === cls.id;
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                          {cls.subject}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          cls.status === 'LIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            : cls.status === 'COMPLETED'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}>
                          {cls.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">{cls.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{cls.description || 'No description provided.'}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {new Date(cls.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Users className="w-3 h-3 text-slate-500" />
                          {cls.enrolledCount || 0} enrolled
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Class Detail View */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClass ? (
              <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {selectedClass.subject}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedClass.status === 'LIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : selectedClass.status === 'COMPLETED'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      }`}>
                        {selectedClass.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedClass.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">{selectedClass.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedClass.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleUpdateClassStatus(selectedClass.id, 'LIVE')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Go Live Now
                      </button>
                    )}

                    {selectedClass.status === 'LIVE' && (
                      <button
                        onClick={() => handleUpdateClassStatus(selectedClass.id, 'COMPLETED')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>

                {/* Class Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    <div className="text-slate-400 text-[10px] font-extrabold uppercase">Scheduled Time</div>
                    <div className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {new Date(selectedClass.scheduledAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    <div className="text-slate-400 text-[10px] font-extrabold uppercase">Duration & Limit</div>
                    <div className="text-xs font-bold text-slate-200 mt-1">
                      {selectedClass.durationMins} Mins • Max {selectedClass.maxStudents} Students
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    <div className="text-slate-400 text-[10px] font-extrabold uppercase">Class Meeting Link</div>
                    <a
                      href={selectedClass.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-400 hover:underline mt-1 truncate block flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      Join Meeting Room
                    </a>
                  </div>
                </div>

                {/* Class Recording Link Input */}
                <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Class Recording URL (for completed session)</span>
                    {selectedClass.recordingUrl && (
                      <a href={selectedClass.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-[11px]">
                        Preview Recording
                      </a>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={recordingUrlInput}
                      onChange={(e) => setRecordingUrlInput(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or Drive link"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleUpdateClassStatus(selectedClass.id, selectedClass.status, recordingUrlInput)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Save Link
                    </button>
                  </div>
                </div>

                {/* Enrolled Students & Attendance Log */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      Enrolled Students & Class Attendance ({classStudents.enrollments.length})
                    </h3>
                  </div>

                  {loadingClassStudents ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading student attendance...</div>
                  ) : classStudents.enrollments.length === 0 ? (
                    <div className="p-6 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                      No students enrolled in this class session yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Enrolled At</th>
                            <th className="p-3 text-right">Attendance Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {classStudents.enrollments.map((enr) => {
                            const hasAttended = classStudents.attendance.some((a) => a.studentId === enr.studentId || a.studentEmail === enr.studentEmail);
                            return (
                              <tr key={enr.id} className="hover:bg-slate-900/40">
                                <td className="p-3 font-bold text-white">{enr.studentName}</td>
                                <td className="p-3 text-slate-400 font-mono">{enr.studentEmail}</td>
                                <td className="p-3 text-slate-400">{new Date(enr.enrolledAt).toLocaleDateString()}</td>
                                <td className="p-3 text-right">
                                  {hasAttended ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      Attended Live
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-800 text-slate-500">
                                      Not Attended
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400 space-y-2">
                <Video className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm">Select a class from the left list to view details & manage attendance.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS MANAGER */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Class Assignments & Student Submissions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedClass ? `Viewing assignments for ${selectedClass.title}` : 'Select a class to manage assignments.'}
              </p>
            </div>

            <button
              onClick={() => setShowCreateAssignmentModal(true)}
              disabled={!selectedClass}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assignments List */}
            <div className="lg:col-span-1 space-y-3">
              {loadingAssignments ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                  <FileText className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">No assignments created for this class yet.</p>
                </div>
              ) : (
                assignments.map((asg) => {
                  const isSelected = selectedAssignment?.id === asg.id;
                  return (
                    <div
                      key={asg.id}
                      onClick={() => {
                        setSelectedAssignment(asg);
                        fetchSubmissions(asg.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <h4 className="text-sm font-bold text-white">{asg.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{asg.description || 'No description'}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60">
                        <span>Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                        <span className="font-bold text-indigo-400">{asg.submissionCount || 0} Submissions</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Submissions Detail List */}
            <div className="lg:col-span-2 space-y-4">
              {selectedAssignment ? (
                <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                  <div className="pb-3 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">{selectedAssignment.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{selectedAssignment.description}</p>
                  </div>

                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Student Submissions ({submissions.length})
                  </h4>

                  {loadingSubmissions ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading submissions...</div>
                  ) : submissions.length === 0 ? (
                    <div className="p-6 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                      No submissions received for this assignment yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((sub) => (
                        <div key={sub.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-sm text-white">{sub.studentName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{sub.studentEmail} • Submitted {new Date(sub.submittedAt).toLocaleString()}</div>
                            </div>

                            {sub.grade ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Grade: {sub.grade}
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setGradingModalSub(sub);
                                  setGradeInput(sub.grade || '');
                                  setFeedbackInput(sub.feedback || '');
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
                              >
                                Grade Submission
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                            {sub.submissionText || 'No text provided.'}
                          </p>

                          {sub.feedback && (
                            <div className="text-xs text-indigo-300 bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20">
                              <strong className="text-indigo-400">Teacher Feedback:</strong> {sub.feedback}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400">
                  Select an assignment from the left column to view student submissions & grade.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY ENROLLED STUDENTS */}
      {activeSubTab === 'students' && (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Aggregated Student Enrolment List
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of students attending your scheduled live classes across all modules.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name or email..."
                className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>

          {loadingStudentsList ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading student roster...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No enrolled students found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3 text-center">Classes Attended</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredStudents.map((std, i) => (
                    <tr key={i} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {std.studentName.charAt(0).toUpperCase()}
                        </div>
                        {std.studentName}
                      </td>
                      <td className="p-3 text-slate-400 font-mono">{std.studentEmail}</td>
                      <td className="p-3 text-center font-bold text-indigo-400">{std.classesAttendedCount} Session(s)</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Active Enrolled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE CLASS MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Schedule New Live Class
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleClass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Class Title *</label>
                <input
                  type="text"
                  required
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  placeholder="e.g. Masterclass on Modern Indian History"
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Subject *</label>
                  <input
                    type="text"
                    required
                    value={classForm.subject}
                    onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                    placeholder="e.g. History"
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={classForm.durationMins}
                    onChange={(e) => setClassForm({ ...classForm, durationMins: Number(e.target.value) })}
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={classForm.scheduledAt}
                  onChange={(e) => setClassForm({ ...classForm, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  placeholder="Overview of topics to be covered..."
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Custom Meeting Link (Optional)</label>
                <input
                  type="url"
                  value={classForm.meetingLink}
                  onChange={(e) => setClassForm({ ...classForm, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/xyz or auto-generated Jitsi room"
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Create New Class Assignment
              </h3>
              <button onClick={() => setShowCreateAssignmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. Essay on Indian Federalism"
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Instructions / Prompt</label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Detailed instructions for students..."
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Due Date *</label>
                <input
                  type="datetime-local"
                  required
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADE SUBMISSION MODAL */}
      {gradingModalSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                Grade Student Submission
              </h3>
              <button onClick={() => setGradingModalSub(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <div className="text-xs text-slate-400">Student: <span className="font-bold text-white">{gradingModalSub.studentName}</span></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Grade / Score *</label>
                <input
                  type="text"
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="e.g. A+, 95/100, Excellent"
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Feedback / Remarks</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Constructive feedback for the student..."
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingModalSub(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                Setup / Edit Faculty Profile
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Qualification</label>
                  <input
                    type="text"
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    placeholder="e.g. M.Sc, Ph.D, Ex-IAS"
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Experience (Years)</label>
                  <input
                    type="number"
                    value={profileForm.experienceYears}
                    onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Subjects Taught</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={profileForm.subjectInput}
                    onChange={(e) => setProfileForm({ ...profileForm, subjectInput: e.target.value })}
                    placeholder="Add subject (e.g. Physics, History)..."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubjectTag}
                    className="px-3 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profileForm.subjects.map((sub, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      {sub}
                      <button type="button" onClick={() => handleRemoveSubjectTag(sub)} className="hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Bio / Summary</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Share your teaching experience & background..."
                  className="w-full px-3 py-2 mt-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
