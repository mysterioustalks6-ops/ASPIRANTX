export type ExamType = 'UPSC_CSE' | 'SSC_CGL' | 'SSC_CHSL' | string;

export interface UserProfile {
  department?: string;
  status?: string;
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  exam: ExamType;
  educationCategory?: string;
  stateName?: string;
  boardOrUniversity?: string;
  streamOrSubject?: string;
  targetYear: number;
  streakDays: number;
  lastActiveDate?: string;
  isPremium: boolean;
  premiumUntil?: string; // ISO date string
  premiumSource?: 'paid' | 'reward' | null;
  studyHoursToday: number;
  xp: number;
  coins: number;
  level: number;
  role?: 'ADMIN' | 'CO_ADMIN' | 'DEVELOPER' | 'USER';
  isGuest?: boolean;
  referralCode?: string;
  referredBy?: string;
  totalReferrals?: number;
  referralEarnings?: number;
  bio?: string;
  studyGoal?: string;
  isProfileComplete?: boolean;
}

export type ActiveTab = 'syllabus' | 'pyq' | 'question_bank' | 'cbt' | 'dashboard' | 'leaderboard' | 'cbt_exam' | 'student_dashboard' | 'timer' | 'tasks' | 'chat' | 'community' | 'study_buddy' | 'premium' | 'earn_premium' | 'reward_milestones' | 'admin' | 'collaboration' | 'library' | 'flashcards' | 'weakness' | 'teachers' | 'podcasts' | 'eligibility' | 'feedback' | 'blog' | 'blog_submit';

export interface BlogPost {
  id: string;
  title: string;
  body: string;
  category: string;
  authorTeacherId?: string;
  authorName?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  coverImageUrl?: string;
  createdAt: string;
  publishedAt?: string;
  rejectionReason?: string;
}

export interface BlogContentRequest {
  id: string;
  teacherId: string;
  teacherEmail: string;
  teacherName?: string;
  requestedAt: string;
  status: 'sent' | 'submitted' | 'expired';
  submissionToken: string;
  submittedPostId?: string;
  customMessage?: string;
}

export interface RoomMessageAttachment {
  name: string;
  type: 'image' | 'pdf' | 'other';
  url: string;
  size?: string;
}

export interface RoomMessage {
  id: string;
  room: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isBot?: boolean;
  text: string;
  attachment?: RoomMessageAttachment;
  timestamp: string;
  likes?: number;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'upsc' | 'discipline' | 'grit' | 'ssc';
  likes?: number;
}

export interface SubTopic {
  id: string;
  topicId: string;
  title: string;
  completed: boolean;
  estimatedHours: number; // Default 2.5 hours
  weightage?: 'High' | 'Medium' | 'Low';
  notes?: string;
  origin_official_id?: string;
  time_studied_seconds?: number;
}

export interface SyllabusTopic {
  id: string;
  exam?: string;
  title: string;
  category: string; // e.g., 'Polity', 'History', 'Economy', 'Quant'
  stage: 'Prelims' | 'Mains' | 'Tier-1' | 'Tier-2';
  completed: boolean;
  subtopicsCount: number;
  completedSubtopics: number;
  weightage: 'High' | 'Medium' | 'Low';
  notes?: string;
  subtopics?: SubTopic[];
}

export interface PredictorSettings {
  hoursPerSubtopic: number; // Default 2.5
  dailyStudyHours: number; // Default 10.0
  startDate: string; // ISO date
  actualHoursLoggedToday: number;
}

export interface CustomSubject {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ManualQuestion {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  questionText: string;
  options?: string[];
  correctOption?: number | null;
  explanation?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  source: 'manual';
  answerVerified: boolean;
  createdAt: string;
}

export interface PomodoroQuestionRef {
  id: string;
  source: 'pyq' | 'question_bank' | 'manual';
  questionText?: string;
  subject?: string;
  topic?: string;
  options?: string[];
  correctOption?: number | null;
  explanation?: string;
  answerVerified?: boolean;
}

export interface PomodoroSessionData {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  duration: number; // planned duration in minutes
  startTime: string;
  endTime?: string;
  completedDuration: number; // actual seconds
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  questionsAttempted: number;
  correctAnswers?: number;
  questionIds: string[];
  questionSources: ('pyq' | 'question_bank' | 'manual')[];
  manualQuestions?: ManualQuestion[];
  selectedQuestions?: PomodoroQuestionRef[];
  accuracy: number;
  xpEarned: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId?: string;
  subject: string;
  durationSeconds: number;
  createdAt: string;
  xpEarned: number;
  coinsEarned: number;
  mode: 'stopwatch' | 'pomodoro';
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TaskItem {
  id: string;
  title: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  status: TaskStatus;
  dueDate: string;
  estimatedMinutes: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  subjectTag?: string;
  feedback?: 'like' | 'dislike' | null;
  modeTag?: string;
  tokensUsed?: number;
  isStreaming?: boolean;
}

export type AiMentorMode = 
  | 'ncert_mentor' 
  | 'mains_evaluator' 
  | 'essay_evaluator' 
  | 'ethics_analyst' 
  | 'pyq_solver' 
  | 'study_planner' 
  | 'revision_coach' 
  | 'mock_interview' 
  | 'general';

export interface AiConversation {
  id: string;
  userEmail: string;
  title: string;
  exam: ExamType;
  mode: AiMentorMode;
  isPinned: boolean;
  isArchived: boolean;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface MainsEvaluationResult {
  totalScore: number; // Out of 250 or 10
  structureScore: number; // Out of 10
  contentScore: number; // Out of 10
  keywordsScore: number; // Out of 10
  wayForwardScore: number; // Out of 10
  strengths: string[];
  weaknesses: string[];
  missedKeywords: string[];
  suggestedAdditions: string[];
  modelAnswerBlueprint: string;
}

// ==========================================
// PHASE 4: ENTERPRISE ACADEMIC ENGINE TYPES
// ==========================================

export interface SyllabusHierarchyNode {
  id: string;
  exam: string; // UPSC_CSE, SSC_CGL, BANKING_PO, RAILWAY_NTPC, STATE_PSC, SSC_CHSL, SSC_MTS
  paper: string; // e.g. 'GS Paper 1', 'Tier-1 Quant', 'Prelims Paper 1'
  subject: string; // e.g. 'Indian Polity & Governance', 'Quantitative Aptitude'
  chapter: string; // e.g. 'Constitutional Framework', 'Number System'
  topic: string; // e.g. 'Preamble & Fundamental Rights', 'HCF & LCM'
  subtopic: string; // e.g. 'Article 14 - Right to Equality', 'Divisibility Rules'
  title: string;
  stage: 'Prelims' | 'Mains' | 'Tier-1' | 'Tier-2' | 'Interview' | 'All';
  weightage: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  completed?: boolean;
  description?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  recommendedBooks?: string[];
  pyqCount?: number;
  prerequisites?: string[];
  version?: number;
  updatedAt?: string;
  subtopics?: SubTopic[];
}

export interface ResourceBook {
  id: string;
  title: string;
  author: string;
  category: 'NCERT' | 'Standard Book' | 'Government Report' | 'Reference Manual';
  subject: string;
  exam: string;
  mappedTopics: string[];
  description: string;
  coverColor?: string;
  edition?: string;
  importance: 'Essential' | 'Recommended' | 'Supplementary';
}

export interface PredictionAnalyticsData {
  totalSyllabusPercent: number;
  completedPercent: number;
  remainingPercent: number;
  totalHours: number;
  completedHours: number;
  remainingHours: number;
  totalSubtopics: number;
  completedSubtopics: number;
  remainingSubtopics: number;
  targetExamDate: string;
  daysLeft: number;
  estimatedCompletionDate: string;
  currentDailyPaceHours: number;
  requiredDailyPaceHours: number;
  status: 'ahead_of_schedule' | 'on_track' | 'behind_schedule';
  daysDifference: number; // Positive = Ahead, Negative = Behind
  weeklyTargetSubtopics: number;
  monthlyTargetSubtopics: number;
  recoveryPlan: {
    recommendedDailyHours: number;
    recommendedSubtopicsPerDay: number;
    prioritySubjectsToFocus: string[];
    aiSuggestions: string[];
  };
  weeklyProgressTrend: { weekLabel: string; completedCount: number; targetCount: number }[];
  subjectWeightageBreakdown: { subject: string; total: number; completed: number; percentage: number }[];
}

export interface PyqRecord {
  id: string;
  exam: string;
  year: number; // 1991 to 2026
  stage: 'Prelims' | 'Mains' | 'Tier-1' | 'Tier-2';
  paper: string;
  subject: string;
  topic: string;
  subtopic?: string;
  questionText: string;
  options?: string[]; // For MCQ/Prelims
  correctOption?: number; // 0-based index
  explanation?: string;
  marks?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: 'English' | 'Hindi';
  tags?: string[];
  source?: string;
  createdAt?: string;
  repeatCount?: number;
  repeatYears?: number[];
  repeatType?: 'exact' | 'similar' | 'none';
}

export interface QuestionBankRecord {
  id: string;
  exam: string;
  type: 'mcq' | 'mains_descriptive' | 'essay' | 'case_study';
  subject: string;
  topic: string;
  subtopic?: string;
  questionText: string;
  options?: string[];
  correctOption?: number;
  solutionText: string;
  imageUrl?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'draft' | 'published';
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  repeatCount?: number;
  repeatYears?: number[];
  repeatType?: 'exact' | 'similar' | 'none';
}

export interface BulkImportResult {
  success: boolean;
  type: 'syllabus' | 'pyqs' | 'questions';
  totalRows: number;
  parsed: number;
  duplicates: number;
  inserted: number;
  failed: number;
  errors?: string[];
  sampleParsed?: any[];
  detectedHierarchy?: any[];
}

// ==========================================
// PHASE 5: ENTERPRISE CBT EXAM & ECOSYSTEM TYPES
// ==========================================

export type CbtQuestionType = 'mcq' | 'passage' | 'paragraph' | 'assertion_reason' | 'matrix_match' | 'numerical';

export interface CbtQuestion {
  id: string;
  type: CbtQuestionType;
  section: string;
  questionText: string;
  options: string[];
  correctOption: number;
  passageText?: string;
  assertionText?: string;
  reasonText?: string;
  imageUrl?: string;
  language: 'English' | 'Hindi';
  explanation: string;
  subject: string;
  topic: string;
  marks: number;
  negativeMarks: number;
}

export interface CbtTest {
  id: string;
  title: string;
  exam: string;
  durationMinutes: number;
  totalMarks: number;
  sections: { name: string; durationMinutes?: number; totalQuestions: number }[];
  questions: CbtQuestion[];
  markingScheme: { correct: number; incorrect: number };
}

export type CbtQuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_and_marked';

export interface CbtUserResponse {
  questionId: string;
  selectedOption: number | null;
  status: CbtQuestionStatus;
  timeSpentSeconds: number;
}

export interface CbtExamSessionState {
  testId: string;
  startTimeIso: string;
  elapsedSeconds: number;
  currentQuestionIndex: number;
  responses: Record<string, CbtUserResponse>;
  isSubmitted: boolean;
  currentSection: string;
  language: 'English' | 'Hindi';
}

export interface CbtExamResult {
  testId: string;
  testTitle: string;
  sessionState: CbtExamSessionState;
  score: number;
  totalPossibleScore: number;
  accuracy: number;
  attemptRate: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  globalRank: number;
  percentile: number;
  timePerSubject: Record<string, number>;
  timePerQuestion: Record<string, number>;
  weakSubjects: string[];
  strongSubjects: string[];
  weakTopics: string[];
  strongTopics: string[];
  aiMistakeAnalysis: string[];
  aiImprovementSuggestions: string[];
  nextRevisionPlan: string[];
  recommendedPyqIds: string[];
  recommendedTopics: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  score: number;
  percentile: number;
  stateName?: string;
  cityName?: string;
  batchName?: string;
  subject?: string;
  xp: number;
  exam: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: 'public' | 'private' | 'invite_only' | 'mentor' | 'batch' | 'subject';
  exam: string;
  memberCount: number;
  isJoined?: boolean;
  isPinned?: boolean;
  icon?: string;
}

export interface CommunityPost {
  id: string;
  groupId: string;
  groupName: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  attachments?: RoomMessageAttachment[];
  poll?: {
    question: string;
    options: { id: string; text: string; votes: number }[];
    totalVotes: number;
    userVotedOptionId?: string;
  };
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likesCount: number;
  parentId?: string;
  mentions?: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'study_reminder' | 'revision' | 'goal' | 'exam_countdown' | 'mock_test' | 'community' | 'ai_suggestion' | 'pyq_alert' | 'system';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface StudentDashboardData {
  todayStudyMinutes: number;
  weeklyStudyHours: number;
  monthlyStudyHours: number;
  currentStreak: number;
  longestStreak: number;
  topicsCompleted: number;
  totalTopics: number;
  overallProgressPercent: number;
  daysLeftForExam: number;
  estimatedCompletionDate: string;
  dailyTargetHours: number;
  weeklyTargetTopics: number;
  monthlyTargetTopics: number;
  revisionProgressPercent: number;
  testAccuracyPercent: number;
  rankTrend: { date: string; rank: number }[];
  studyHeatmap: { date: string; hours: number }[];
  aiSuggestions: string[];
}

export interface ModerationReport {
  id: string;
  contentType: 'post' | 'comment' | 'user';
  contentId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}



export type EnterpriseDepartment = 
  | 'Executive Leadership' 
  | 'Academics & Question Bank' 
  | 'Finance & Monetization' 
  | 'Community & Moderation' 
  | 'Engineering & Infrastructure'
  | 'Human Resources & Compliance'
  | 'Cyber Security';

export type EnterpriseRole = 
  | 'SUPER_ADMIN' 
  | 'ACADEMIC_LEAD' 
  | 'FINANCE_MANAGER' 
  | 'COMMUNITY_LEAD' 
  | 'TECH_LEAD'
  | 'HR_MANAGER'
  | 'SECURITY_OFFICER'
  | 'CONTENT_EDITOR'
  | 'QA_LEAD'
  | 'PRODUCT_MANAGER';

export interface EnterprisePermissions {
  canManageFinance: boolean;
  canManageAdsense: boolean;
  canManageFlags: boolean;
  canManageUsers: boolean;
  canManageTeam: boolean;
  canManageWatchdog: boolean;
  canManageCustomizer: boolean;
  canManageContent: boolean;
  canManageSecurity: boolean;
  canManageHR: boolean;
}

export interface EnterpriseTeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  role: EnterpriseRole;
  department: EnterpriseDepartment;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  joinedAt: string;
  permissions: EnterprisePermissions;
}

export interface EnterpriseAuditLog {
  id: string;
  timestamp: string;
  employeeId: string;
  teamId?: string;
  department?: string;
  role?: string;
  permissionUsed?: string;
  ip: string;
  browser: string;
  device: string;
  os: string;
  action: string;
  previousData?: string;
  updatedData?: string;
  requestId: string;
  approvalChain?: string;
  sessionId?: string;
  geoInfo?: string;
  failureReason?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  rollbackReference?: string;
  endpoint?: string;
  details: string;
}
