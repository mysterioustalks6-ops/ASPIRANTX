// ============================================================================
// UNIVERSAL INDIAN COMPETITIVE EXAM CONFIGURATION & PATTERN REGISTRY
// Supports: NTA, UPSC, SSC, IBPS/SBI, RRB, CBSE, State PSCs, Police, Paramedical
// Config-driven architecture: NEVER hardcode questions, timers, or marks.
// ============================================================================

export type ExamCategory = 
  | 'ENGINEERING_MEDICAL_ENTRANCE'
  | 'GOVERNMENT_RECRUITMENT'
  | 'BANKING_INSURANCE'
  | 'DEFENCE_FORCES'
  | 'TEACHING_ELIGIBILITY'
  | 'LAW_MANAGEMENT_PROFESSIONAL'
  | 'STATE_CIVIL_SERVICES'
  | 'STATE_POLICE_PARAMEDICAL';

export type TimingModel = 
  | 'GLOBAL_TIMER'      // Entire paper has one countdown timer (JEE, NEET, UPSC, SSC)
  | 'SECTION_TIMER'     // Each section has fixed independent duration (IBPS PO, SBI PO)
  | 'MIXED_TIMER'       // Some sections independent, some shared
  | 'STAGE_WISE';       // Stage 1 (Prelims), Stage 2 (Mains), etc.

export type NavigationRule = 
  | 'FREE_NAVIGATION'    // Move freely between questions and sections
  | 'SECTION_LOCKED'     // Must finish current section before moving; cannot return
  | 'SEPARATELY_TIMED'   // Section locks automatically when its time expires
  | 'NO_BACK_NAVIGATION' // Question-level forward only
  | 'QUESTION_LOCKED';

export type QuestionType = 
  | 'SINGLE_CORRECT_MCQ'
  | 'MULTIPLE_CORRECT'
  | 'NUMERICAL'
  | 'TRUE_FALSE'
  | 'ASSERTION_REASON'
  | 'MATCH_FOLLOWING'
  | 'PASSAGE_BASED'
  | 'CASE_BASED'
  | 'STATEMENT_BASED'
  | 'COMPREHENSION'
  | 'DESCRIPTIVE';

export interface MarkingScheme {
  positive: number;             // e.g. +4 (JEE/NEET), +2 (UPSC/SSC), +1 (Banking)
  negative: number;             // e.g. 1.0 (JEE/NEET), 0.66 (UPSC 1/3rd), 0.50 (SSC 1/4th), 0.25 (Banking), 0.0 (CTET)
  unattempted: number;          // typically 0
  partialAllowed?: boolean;     // partial marking for multiple correct
}

export interface UniversalSectionConfig {
  id: string;
  name: string;
  subject: string;
  questionCount: number;
  totalMarks: number;
  markingScheme: MarkingScheme;
  durationMinutes?: number;      // Mandatory if SECTION_TIMER
  optionalQuestionCount?: number; // e.g. JEE Main Section B: answer 5 out of 10
  allowedQuestionTypes: QuestionType[];
  navigationRule: NavigationRule;
  difficultyDistribution?: {
    easy: number;               // percentage (e.g. 30)
    medium: number;             // percentage (e.g. 50)
    hard: number;               // percentage (e.g. 20)
  };
}

export interface UniversalPaperConfig {
  paperId: string;
  paperName: string;
  totalDurationMinutes: number;
  timingModel: TimingModel;
  sections: UniversalSectionConfig[];
  qualifyingOnly?: boolean;     // e.g. UPSC CSAT (qualifying 33%)
  cutOffMarks?: number;
}

export interface UniversalStageConfig {
  stageId: string;
  stageName: string;            // e.g. 'Prelims', 'Mains', 'Tier 1', 'Tier 2', 'CBT 1', 'CBT 2'
  papers: UniversalPaperConfig[];
}

export interface UniversalExamConfig {
  examId: string;
  examName: string;
  conductingBody: string;       // NTA, UPSC, SSC, IBPS, RRB, CBSE, State Commissions
  category: ExamCategory;
  version: string;              // e.g. '2026-v1'
  availableLanguages: string[]; // e.g. ['English', 'Hindi']
  defaultLanguage: string;
  stages: UniversalStageConfig[];
  antiCheatConfig?: {
    enforceFullscreen: boolean;
    detectTabSwitch: boolean;
    maxTabSwitchesAllowed: number;
    disableCopyPaste: boolean;
  };
  accessibilityConfig?: {
    allowExtraTimeForPwD: boolean;
    extraTimeRatio: number;      // e.g. 1.33 (20 min per hour)
    fontSizeOptions: string[];
    highContrastMode: boolean;
  };
  normalizationRule?: 'none' | 'percentile_equipercentile' | 'linear_interpolation' | 'z_score';
}

// ============================================================================
// MASTER CONFIGURATION MAPS FOR ALL REAL INDIAN EXAMINATIONS
// Grounded in official examination body notification patterns
// ============================================================================

export const UNIVERSAL_EXAM_CONFIGS: Record<string, UniversalExamConfig> = {
};

export const UNIVERSAL_EXAM_CATALOG = UNIVERSAL_EXAM_CONFIGS;

Object.assign(UNIVERSAL_EXAM_CONFIGS, {
  // ── 1. JEE MAIN (NTA Engineering Pattern) ──────────────────────────────────
  JEE_MAIN: {
    examId: 'JEE_MAIN',
    examName: 'JEE (Main) — Joint Entrance Examination',
    conductingBody: 'National Testing Agency (NTA)',
    category: 'ENGINEERING_MEDICAL_ENTRANCE',
    version: '2026-NTA-v1',
    availableLanguages: ['English', 'Hindi', 'Gujarati', 'Marathi', 'Bengali', 'Tamil', 'Telugu'],
    defaultLanguage: 'English',
    normalizationRule: 'percentile_equipercentile',
    stages: [
      {
        stageId: 'paper1',
        stageName: 'Paper 1 (B.E. / B.Tech)',
        papers: [
          {
            paperId: 'jee_main_p1',
            paperName: 'B.E./B.Tech Computer-Based Test',
            totalDurationMinutes: 180,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'physics',
                name: 'Physics',
                subject: 'Physics',
                questionCount: 25, // 20 MCQs + 5 Numericals
                totalMarks: 100,
                markingScheme: { positive: 4, negative: 1, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'NUMERICAL', 'ASSERTION_REASON'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'chemistry',
                name: 'Chemistry',
                subject: 'Chemistry',
                questionCount: 25,
                totalMarks: 100,
                markingScheme: { positive: 4, negative: 1, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'NUMERICAL', 'ASSERTION_REASON'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'mathematics',
                name: 'Mathematics',
                subject: 'Mathematics',
                questionCount: 25,
                totalMarks: 100,
                markingScheme: { positive: 4, negative: 1, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'NUMERICAL', 'ASSERTION_REASON'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 2. JEE ADVANCED (IIT Entrance Pattern) ─────────────────────────────────
  JEE_ADVANCED: {
    examId: 'JEE_ADVANCED',
    examName: 'JEE (Advanced) — IIT Entrance Examination',
    conductingBody: 'Joint Admission Board (IITs)',
    category: 'ENGINEERING_MEDICAL_ENTRANCE',
    version: '2026-IIT-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'cbt_exam',
        stageName: 'Paper 1 & Paper 2',
        papers: [
          {
            paperId: 'jee_adv_p1',
            paperName: 'Paper 1 (Morning Shift)',
            totalDurationMinutes: 180,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'adv_physics',
                name: 'Physics',
                subject: 'Physics',
                questionCount: 18,
                totalMarks: 60,
                markingScheme: { positive: 4, negative: 2, unattempted: 0, partialAllowed: true },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'MULTIPLE_CORRECT', 'NUMERICAL', 'MATCH_FOLLOWING'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'adv_chemistry',
                name: 'Chemistry',
                subject: 'Chemistry',
                questionCount: 18,
                totalMarks: 60,
                markingScheme: { positive: 4, negative: 2, unattempted: 0, partialAllowed: true },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'MULTIPLE_CORRECT', 'NUMERICAL', 'MATCH_FOLLOWING'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'adv_math',
                name: 'Mathematics',
                subject: 'Mathematics',
                questionCount: 18,
                totalMarks: 60,
                markingScheme: { positive: 4, negative: 2, unattempted: 0, partialAllowed: true },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'MULTIPLE_CORRECT', 'NUMERICAL', 'MATCH_FOLLOWING'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 3. NEET-UG (NTA Medical Pattern) ───────────────────────────────────────
  NEET_UG: {
    examId: 'NEET_UG',
    examName: 'NEET (UG) — National Eligibility Cum Entrance Test',
    conductingBody: 'National Testing Agency (NTA)',
    category: 'ENGINEERING_MEDICAL_ENTRANCE',
    version: '2026-NTA-v1',
    availableLanguages: ['English', 'Hindi', 'Urdu', 'Bengali', 'Tamil', 'Telugu', 'Gujarati'],
    defaultLanguage: 'English',
    normalizationRule: 'percentile_equipercentile',
    stages: [
      {
        stageId: 'single_stage',
        stageName: 'NEET (UG) Single Paper',
        papers: [
          {
            paperId: 'neet_paper',
            paperName: 'Medical Entrance Comprehensive Paper',
            totalDurationMinutes: 200, // 3 hours 20 minutes
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'physics',
                name: 'Physics',
                subject: 'Physics',
                questionCount: 45, // 35 Section A + 10 from Sec B
                totalMarks: 180,
                markingScheme: { positive: 4, negative: 1, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'ASSERTION_REASON'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'chemistry',
                name: 'Chemistry',
                subject: 'Chemistry',
                questionCount: 45,
                totalMarks: 180,
                markingScheme: { positive: 4, negative: 1, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'ASSERTION_REASON'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'botany',
                name: 'Botany',
                subject: 'Biology',
                questionCount: 45,
                totalMarks: 180,
                markingScheme: { positive: 4, negative: 1, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'ASSERTION_REASON', 'MATCH_FOLLOWING'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'zoology',
                name: 'Zoology',
                subject: 'Biology',
                questionCount: 45,
                totalMarks: 180,
                markingScheme: { positive: 4, negative: 1, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'ASSERTION_REASON', 'MATCH_FOLLOWING'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 4. UPSC CSE (Union Public Service Commission Civil Services) ───────────
  UPSC_CSE: {
    examId: 'UPSC_CSE',
    examName: 'UPSC Civil Services Examination',
    conductingBody: 'Union Public Service Commission (UPSC)',
    category: 'GOVERNMENT_RECRUITMENT',
    version: '2026-UPSC-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Preliminary Examination (Objective)',
        papers: [
          {
            paperId: 'upsc_gs1',
            paperName: 'General Studies Paper-I',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'gs1',
                name: 'General Studies Paper-I',
                subject: 'General Studies',
                questionCount: 100,
                totalMarks: 200,
                markingScheme: { positive: 2.0, negative: 0.66, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'ASSERTION_REASON', 'STATEMENT_BASED', 'MATCH_FOLLOWING'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          },
          {
            paperId: 'upsc_csat',
            paperName: 'General Studies Paper-II (CSAT)',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            qualifyingOnly: true,
            cutOffMarks: 66, // 33% of 200
            sections: [
              {
                id: 'csat',
                name: 'CSAT (Reading Comprehension & Aptitude)',
                subject: 'Aptitude & Comprehension',
                questionCount: 80,
                totalMarks: 200,
                markingScheme: { positive: 2.5, negative: 0.833, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 5. SSC CGL (Staff Selection Commission Combined Graduate Level) ────────
  SSC_CGL: {
    examId: 'SSC_CGL',
    examName: 'SSC CGL — Combined Graduate Level',
    conductingBody: 'Staff Selection Commission (SSC)',
    category: 'GOVERNMENT_RECRUITMENT',
    version: '2026-SSC-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'linear_interpolation',
    stages: [
      {
        stageId: 'tier1',
        stageName: 'Tier-1 (Computer Based Examination)',
        papers: [
          {
            paperId: 'ssc_cgl_t1',
            paperName: 'Tier-1 Paper',
            totalDurationMinutes: 60, // 60 minutes
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'reasoning',
                name: 'General Intelligence and Reasoning',
                subject: 'Reasoning',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'general_awareness',
                name: 'General Awareness',
                subject: 'General Knowledge',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'quantitative_aptitude',
                name: 'Quantitative Aptitude',
                subject: 'Mathematics',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'english_comprehension',
                name: 'English Comprehension',
                subject: 'English',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 6. SSC CHSL ────────────────────────────────────────────────────────────
  SSC_CHSL: {
    examId: 'SSC_CHSL',
    examName: 'SSC CHSL — Combined Higher Secondary Level',
    conductingBody: 'Staff Selection Commission (SSC)',
    category: 'GOVERNMENT_RECRUITMENT',
    version: '2026-SSC-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'linear_interpolation',
    stages: [
      {
        stageId: 'tier1',
        stageName: 'Tier-1 CBT',
        papers: [
          {
            paperId: 'ssc_chsl_t1',
            paperName: 'Tier-1 Paper',
            totalDurationMinutes: 60,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'english',
                name: 'English Language',
                subject: 'English',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'reasoning',
                name: 'General Intelligence',
                subject: 'Reasoning',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'quant',
                name: 'Quantitative Aptitude',
                subject: 'Mathematics',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'ga',
                name: 'General Awareness',
                subject: 'General Knowledge',
                questionCount: 25,
                totalMarks: 50,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 7. IBPS PO (CRITICAL MODEL B: SECTION-WISE TIMED & LOCKED) ──────────────
  IBPS_PO: {
    examId: 'IBPS_PO',
    examName: 'IBPS PO — Probationary Officer',
    conductingBody: 'Institute of Banking Personnel Selection (IBPS)',
    category: 'BANKING_INSURANCE',
    version: '2026-IBPS-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'linear_interpolation',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Preliminary Examination (Section-Timed)',
        papers: [
          {
            paperId: 'ibps_po_pre',
            paperName: 'Prelims Online Examination',
            totalDurationMinutes: 60,
            timingModel: 'SECTION_TIMER', // MODEL B: SECTION-WISE TIMER
            sections: [
              {
                id: 'english_lang',
                name: 'English Language',
                subject: 'English',
                questionCount: 30,
                totalMarks: 30,
                durationMinutes: 20, // Exactly 20 minutes
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'SEPARATELY_TIMED' // Locked when 20m expires, candidate cannot leave early
              },
              {
                id: 'quant_apt',
                name: 'Quantitative Aptitude',
                subject: 'Mathematics',
                questionCount: 35,
                totalMarks: 35,
                durationMinutes: 20, // Exactly 20 minutes
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'SEPARATELY_TIMED'
              },
              {
                id: 'reasoning_ability',
                name: 'Reasoning Ability',
                subject: 'Reasoning',
                questionCount: 35,
                totalMarks: 35,
                durationMinutes: 20, // Exactly 20 minutes
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'SEPARATELY_TIMED'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 8. SBI PO (SECTION-WISE TIMED & LOCKED) ─────────────────────────────────
  SBI_PO: {
    examId: 'SBI_PO',
    examName: 'SBI PO — State Bank of India Probationary Officer',
    conductingBody: 'State Bank of India',
    category: 'BANKING_INSURANCE',
    version: '2026-SBI-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'linear_interpolation',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Phase-I: Preliminary Examination',
        papers: [
          {
            paperId: 'sbi_po_pre',
            paperName: 'Phase-I Paper',
            totalDurationMinutes: 60,
            timingModel: 'SECTION_TIMER',
            sections: [
              {
                id: 'english',
                name: 'English Language',
                subject: 'English',
                questionCount: 30,
                totalMarks: 30,
                durationMinutes: 20,
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'SEPARATELY_TIMED'
              },
              {
                id: 'quant',
                name: 'Quantitative Aptitude',
                subject: 'Mathematics',
                questionCount: 35,
                totalMarks: 35,
                durationMinutes: 20,
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'SEPARATELY_TIMED'
              },
              {
                id: 'reasoning',
                name: 'Reasoning Ability',
                subject: 'Reasoning',
                questionCount: 35,
                totalMarks: 35,
                durationMinutes: 20,
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'SEPARATELY_TIMED'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 9. IBPS CLERK (SECTION-WISE TIMED) ──────────────────────────────────────
  IBPS_CLERK: {
    examId: 'IBPS_CLERK',
    examName: 'IBPS Clerk — Clerical Cadre',
    conductingBody: 'IBPS',
    category: 'BANKING_INSURANCE',
    version: '2026-IBPS-v1',
    availableLanguages: ['English', 'Hindi', 'Regional'],
    defaultLanguage: 'English',
    normalizationRule: 'linear_interpolation',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Prelims Examination',
        papers: [
          {
            paperId: 'ibps_clerk_pre',
            paperName: 'Prelims Paper',
            totalDurationMinutes: 60,
            timingModel: 'SECTION_TIMER',
            sections: [
              {
                id: 'english',
                name: 'English Language',
                subject: 'English',
                questionCount: 30,
                totalMarks: 30,
                durationMinutes: 20,
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'SEPARATELY_TIMED'
              },
              {
                id: 'quant',
                name: 'Numerical Ability',
                subject: 'Mathematics',
                questionCount: 35,
                totalMarks: 35,
                durationMinutes: 20,
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'SEPARATELY_TIMED'
              },
              {
                id: 'reasoning',
                name: 'Reasoning Ability',
                subject: 'Reasoning',
                questionCount: 35,
                totalMarks: 35,
                durationMinutes: 20,
                markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'SEPARATELY_TIMED'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 10. RRB NTPC (Railway Recruitment Board Non-Technical Popular Categories)
  RRB_NTPC: {
    examId: 'RRB_NTPC',
    examName: 'RRB NTPC — Non-Technical Popular Categories',
    conductingBody: 'Railway Recruitment Boards (RRB)',
    category: 'GOVERNMENT_RECRUITMENT',
    version: '2026-RRB-v1',
    availableLanguages: ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati'],
    defaultLanguage: 'English',
    normalizationRule: 'percentile_equipercentile',
    stages: [
      {
        stageId: 'cbt1',
        stageName: '1st Stage Computer Based Test (CBT-1)',
        papers: [
          {
            paperId: 'rrb_ntpc_cbt1',
            paperName: 'CBT-1 Comprehensive Paper',
            totalDurationMinutes: 90, // 90 minutes
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'ga',
                name: 'General Awareness',
                subject: 'General Knowledge',
                questionCount: 40,
                totalMarks: 40,
                markingScheme: { positive: 1.0, negative: 0.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'math',
                name: 'Mathematics',
                subject: 'Mathematics',
                questionCount: 30,
                totalMarks: 30,
                markingScheme: { positive: 1.0, negative: 0.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'reasoning',
                name: 'General Intelligence and Reasoning',
                subject: 'Reasoning',
                questionCount: 30,
                totalMarks: 30,
                markingScheme: { positive: 1.0, negative: 0.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 11. NDA & NA (UPSC Defence Pattern) ────────────────────────────────────
  NDA_NA: {
    examId: 'NDA_NA',
    examName: 'NDA & NA — National Defence Academy & Naval Academy',
    conductingBody: 'Union Public Service Commission (UPSC)',
    category: 'DEFENCE_FORCES',
    version: '2026-UPSC-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'written',
        stageName: 'Written Examination',
        papers: [
          {
            paperId: 'nda_math',
            paperName: 'Paper-I: Mathematics',
            totalDurationMinutes: 150, // 2.5 hours
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'math',
                name: 'Mathematics',
                subject: 'Mathematics',
                questionCount: 120,
                totalMarks: 300,
                markingScheme: { positive: 2.5, negative: 0.83, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          },
          {
            paperId: 'nda_gat',
            paperName: 'Paper-II: General Ability Test (GAT)',
            totalDurationMinutes: 150,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'english',
                name: 'Part A: English',
                subject: 'English',
                questionCount: 50,
                totalMarks: 200,
                markingScheme: { positive: 4.0, negative: 1.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'gk',
                name: 'Part B: General Knowledge',
                subject: 'General Studies',
                questionCount: 100,
                totalMarks: 400,
                markingScheme: { positive: 4.0, negative: 1.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'STATEMENT_BASED'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 12. CDS (Combined Defence Services) ────────────────────────────────────
  CDS: {
    examId: 'CDS',
    examName: 'CDS — Combined Defence Services',
    conductingBody: 'UPSC',
    category: 'DEFENCE_FORCES',
    version: '2026-UPSC-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'written',
        stageName: 'Written Test',
        papers: [
          {
            paperId: 'cds_eng',
            paperName: 'English Paper',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'eng',
                name: 'English',
                subject: 'English',
                questionCount: 120,
                totalMarks: 100,
                markingScheme: { positive: 0.833, negative: 0.27, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          },
          {
            paperId: 'cds_gk',
            paperName: 'General Knowledge Paper',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'gk',
                name: 'General Knowledge',
                subject: 'General Knowledge',
                questionCount: 120,
                totalMarks: 100,
                markingScheme: { positive: 0.833, negative: 0.27, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 13. CTET (Central Teacher Eligibility Test — ZERO NEGATIVE MARKING) ────
  CTET: {
    examId: 'CTET',
    examName: 'CTET — Central Teacher Eligibility Test',
    conductingBody: 'Central Board of Secondary Education (CBSE)',
    category: 'TEACHING_ELIGIBILITY',
    version: '2026-CBSE-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'paper1',
        stageName: 'Paper-I (Classes I to V)',
        papers: [
          {
            paperId: 'ctet_p1',
            paperName: 'Paper-I Primary Stage',
            totalDurationMinutes: 150,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'cdp',
                name: 'Child Development and Pedagogy',
                subject: 'Pedagogy',
                questionCount: 30,
                totalMarks: 30,
                markingScheme: { positive: 1.0, negative: 0.0, unattempted: 0 }, // ZERO NEGATIVE MARKING
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'math',
                name: 'Mathematics',
                subject: 'Mathematics',
                questionCount: 30,
                totalMarks: 30,
                markingScheme: { positive: 1.0, negative: 0.0, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'evs',
                name: 'Environmental Studies (EVS)',
                subject: 'Environmental Science',
                questionCount: 30,
                totalMarks: 30,
                markingScheme: { positive: 1.0, negative: 0.0, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'lang1',
                name: 'Language I',
                subject: 'Language',
                questionCount: 30,
                totalMarks: 30,
                markingScheme: { positive: 1.0, negative: 0.0, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'lang2',
                name: 'Language II',
                subject: 'Language',
                questionCount: 30,
                totalMarks: 30,
                markingScheme: { positive: 1.0, negative: 0.0, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'PASSAGE_BASED'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 14. UGC NET (National Eligibility Test — ZERO NEGATIVE MARKING) ─────────
  UGC_NET: {
    examId: 'UGC_NET',
    examName: 'UGC NET — National Eligibility Test',
    conductingBody: 'National Testing Agency (NTA)',
    category: 'TEACHING_ELIGIBILITY',
    version: '2026-NTA-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'percentile_equipercentile',
    stages: [
      {
        stageId: 'cbt_single_session',
        stageName: 'Paper 1 & Paper 2 (Single 3-Hour Session)',
        papers: [
          {
            paperId: 'ugc_net_session',
            paperName: 'Teaching & Research Aptitude + Subject',
            totalDurationMinutes: 180,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'paper1',
                name: 'Paper-I: Teaching & Research Aptitude',
                subject: 'Research Aptitude',
                questionCount: 50,
                totalMarks: 100,
                markingScheme: { positive: 2.0, negative: 0.0, unattempted: 0 }, // NO NEGATIVE MARKING
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'ASSERTION_REASON'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'paper2',
                name: 'Paper-II: Domain Subject',
                subject: 'Domain Specialization',
                questionCount: 100,
                totalMarks: 200,
                markingScheme: { positive: 2.0, negative: 0.0, unattempted: 0 }, // NO NEGATIVE MARKING
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'STATEMENT_BASED', 'MATCH_FOLLOWING'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 15. UPPSC PCS (Uttar Pradesh Public Service Commission) ────────────────
  UPPSC_PCS: {
    examId: 'UPPSC_PCS',
    examName: 'UPPSC PCS — Combined State / Upper Subordinate Services',
    conductingBody: 'Uttar Pradesh Public Service Commission (UPPSC)',
    category: 'STATE_CIVIL_SERVICES',
    version: '2026-UPPSC-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'Hindi',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Preliminary Examination',
        papers: [
          {
            paperId: 'uppsc_gs1',
            paperName: 'General Studies Paper-I',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'gs1',
                name: 'General Studies-I (incl. UP Special)',
                subject: 'General Studies',
                questionCount: 150,
                totalMarks: 200,
                markingScheme: { positive: 1.33, negative: 0.44, unattempted: 0 }, // 1/3rd negative
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ', 'MATCH_FOLLOWING', 'ASSERTION_REASON'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 16. BPSC PCS (Bihar Public Service Commission) ─────────────────────────
  BPSC_PCS: {
    examId: 'BPSC_PCS',
    examName: 'BPSC Combined Competitive Examination (CCE)',
    conductingBody: 'Bihar Public Service Commission (BPSC)',
    category: 'STATE_CIVIL_SERVICES',
    version: '2026-BPSC-v1',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'Hindi',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Integrated 70th/71st CCE Prelims',
        papers: [
          {
            paperId: 'bpsc_gs',
            paperName: 'General Studies (with Bihar Special)',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'bpsc_gs_sec',
                name: 'General Studies',
                subject: 'General Studies',
                questionCount: 150,
                totalMarks: 150,
                markingScheme: { positive: 1.0, negative: 0.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 17. WBCS (West Bengal Civil Services) ──────────────────────────────────
  WBCS: {
    examId: 'WBCS',
    examName: 'WBCS — West Bengal Civil Service (Executive)',
    conductingBody: 'Public Service Commission, West Bengal (WBPSC)',
    category: 'STATE_CIVIL_SERVICES',
    version: '2026-WBPSC-v1',
    availableLanguages: ['English', 'Bengali'],
    defaultLanguage: 'English',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Preliminary Examination',
        papers: [
          {
            paperId: 'wbcs_pre',
            paperName: 'General Studies Paper',
            totalDurationMinutes: 150,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'wbcs_all',
                name: 'General Studies (8 Subjects x 25Q)',
                subject: 'General Studies',
                questionCount: 200,
                totalMarks: 200,
                markingScheme: { positive: 1.0, negative: 0.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 18. UP POLICE CONSTABLE ────────────────────────────────────────────────
  UP_POLICE_CONSTABLE: {
    examId: 'UP_POLICE_CONSTABLE',
    examName: 'UP Police Constable Direct Recruitment',
    conductingBody: 'Uttar Pradesh Police Recruitment & Promotion Board (UPPRPB)',
    category: 'STATE_POLICE_PARAMEDICAL',
    version: '2026-UPPRPB-v1',
    availableLanguages: ['Hindi', 'English'],
    defaultLanguage: 'Hindi',
    normalizationRule: 'percentile_equipercentile',
    stages: [
      {
        stageId: 'written_omr_cbt',
        stageName: 'Written Examination',
        papers: [
          {
            paperId: 'up_police_const_p1',
            paperName: 'General Studies, Hindi, Math & Reasoning',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'gs',
                name: 'General Knowledge',
                subject: 'General Knowledge',
                questionCount: 38,
                totalMarks: 76,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'hindi',
                name: 'General Hindi',
                subject: 'Hindi Language',
                questionCount: 37,
                totalMarks: 74,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'math',
                name: 'Numerical & Mental Ability',
                subject: 'Mathematics',
                questionCount: 38,
                totalMarks: 76,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              },
              {
                id: 'reasoning',
                name: 'Mental Aptitude / Reasoning',
                subject: 'Reasoning',
                questionCount: 37,
                totalMarks: 74,
                markingScheme: { positive: 2.0, negative: 0.50, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 19. BIHAR POLICE SI ───────────────────────────────────────────────────
  BIHAR_POLICE_SI: {
    examId: 'BIHAR_POLICE_SI',
    examName: 'Bihar Police Sub-Inspector (Daroga)',
    conductingBody: 'Bihar Police Sub-ordinate Services Commission (BPSSC)',
    category: 'STATE_POLICE_PARAMEDICAL',
    version: '2026-BPSSC-v1',
    availableLanguages: ['Hindi', 'English'],
    defaultLanguage: 'Hindi',
    normalizationRule: 'none',
    stages: [
      {
        stageId: 'prelims',
        stageName: 'Preliminary Written Test',
        papers: [
          {
            paperId: 'bpsi_pre',
            paperName: 'General Knowledge & Current Events',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'gk_ca',
                name: 'General Knowledge & Current Affairs',
                subject: 'General Studies',
                questionCount: 100,
                totalMarks: 200,
                markingScheme: { positive: 2.0, negative: 0.20, unattempted: 0 }, // BPSSC uses 0.2 marks deduction
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  }
});

/**
 * Universal Exam Config Resolver.
 * Resolves verified configuration or generates an official-rule template fallback.
 */
export function getUniversalExamConfig(examId: string): UniversalExamConfig {
  const rawKey = (examId || '').toUpperCase().trim();
  const withUnderscore = rawKey.replace(/-/g, '_');
  const withHyphen = rawKey.replace(/_/g, '-');
  
  if (UNIVERSAL_EXAM_CONFIGS[withUnderscore]) return UNIVERSAL_EXAM_CONFIGS[withUnderscore];
  if (UNIVERSAL_EXAM_CONFIGS[rawKey]) return UNIVERSAL_EXAM_CONFIGS[rawKey];
  if (UNIVERSAL_EXAM_CONFIGS[withHyphen]) return UNIVERSAL_EXAM_CONFIGS[withHyphen];

  const foundKey = Object.keys(UNIVERSAL_EXAM_CONFIGS).find(k => 
    k === withUnderscore || k.replace(/_/g, '') === withUnderscore.replace(/_/g, '')
  );
  if (foundKey) return UNIVERSAL_EXAM_CONFIGS[foundKey];

  const normalizedKey = withUnderscore;

  // Dynamic template derivation based on keyword recognition
  const isBanking = normalizedKey.includes('IBPS') || normalizedKey.includes('SBI') || normalizedKey.includes('BANK');
  const isTeaching = normalizedKey.includes('TET') || normalizedKey.includes('NET') || normalizedKey.includes('BED');
  const isRailway = normalizedKey.includes('RRB') || normalizedKey.includes('RAILWAY');
  const isPolice = normalizedKey.includes('POLICE') || normalizedKey.includes('CONSTABLE') || normalizedKey.includes('SI');
  const isMedicalNursing = normalizedKey.includes('NURSING') || normalizedKey.includes('ANM') || normalizedKey.includes('GNM') || normalizedKey.includes('PNST');

  if (isBanking) {
    return {
      examId: normalizedKey,
      examName: `${normalizedKey} Banking Examination`,
      conductingBody: 'Banking Examination Authority',
      category: 'BANKING_INSURANCE',
      version: '2026-AUTO-BANKING',
      availableLanguages: ['English', 'Hindi'],
      defaultLanguage: 'English',
      normalizationRule: 'linear_interpolation',
      stages: [
        {
          stageId: 'prelims',
          stageName: 'Prelims Examination (Section-Timed)',
          papers: [
            {
              paperId: `${normalizedKey.toLowerCase()}_p1`,
              paperName: 'Preliminary Test',
              totalDurationMinutes: 60,
              timingModel: 'SECTION_TIMER', // Model B
              sections: [
                {
                  id: 'english',
                  name: 'English Language',
                  subject: 'English',
                  questionCount: 30,
                  totalMarks: 30,
                  durationMinutes: 20,
                  markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                  allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                  navigationRule: 'SEPARATELY_TIMED'
                },
                {
                  id: 'quant',
                  name: 'Quantitative Aptitude',
                  subject: 'Mathematics',
                  questionCount: 35,
                  totalMarks: 35,
                  durationMinutes: 20,
                  markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                  allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                  navigationRule: 'SEPARATELY_TIMED'
                },
                {
                  id: 'reasoning',
                  name: 'Reasoning Ability',
                  subject: 'Reasoning',
                  questionCount: 35,
                  totalMarks: 35,
                  durationMinutes: 20,
                  markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 },
                  allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                  navigationRule: 'SEPARATELY_TIMED'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  if (isTeaching) {
    return {
      examId: normalizedKey,
      examName: `${normalizedKey} Teacher Eligibility Examination`,
      conductingBody: 'Teaching Regulatory Examination Board',
      category: 'TEACHING_ELIGIBILITY',
      version: '2026-AUTO-TEACHING',
      availableLanguages: ['English', 'Hindi'],
      defaultLanguage: 'Hindi',
      normalizationRule: 'none',
      stages: [
        {
          stageId: 'written',
          stageName: 'Eligibility Paper',
          papers: [
            {
              paperId: `${normalizedKey.toLowerCase()}_p1`,
              paperName: 'Eligibility Comprehensive Paper',
              totalDurationMinutes: 150,
              timingModel: 'GLOBAL_TIMER',
              sections: [
                {
                  id: 'core_pedagogy',
                  name: 'Pedagogy & Subject Knowledge',
                  subject: 'Pedagogy',
                  questionCount: 150,
                  totalMarks: 150,
                  markingScheme: { positive: 1.0, negative: 0.0, unattempted: 0 }, // NO NEGATIVE MARKING
                  allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                  navigationRule: 'FREE_NAVIGATION'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  // Default Standard National Exam Template (e.g. State PSC / Police / Technical)
  return {
    examId: normalizedKey,
    examName: `${normalizedKey} Examination`,
    conductingBody: 'Examination Authority',
    category: isPolice ? 'STATE_POLICE_PARAMEDICAL' : isRailway ? 'GOVERNMENT_RECRUITMENT' : 'GOVERNMENT_RECRUITMENT',
    version: '2026-AUTO-STANDARD',
    availableLanguages: ['English', 'Hindi'],
    defaultLanguage: 'English',
    normalizationRule: 'linear_interpolation',
    stages: [
      {
        stageId: 'stage1',
        stageName: 'Stage 1 Written Examination',
        papers: [
          {
            paperId: `${normalizedKey.toLowerCase()}_p1`,
            paperName: 'General Comprehensive Paper',
            totalDurationMinutes: 120,
            timingModel: 'GLOBAL_TIMER',
            sections: [
              {
                id: 'general_section',
                name: 'General Studies & Aptitude',
                subject: 'General Knowledge',
                questionCount: 100,
                totalMarks: 100,
                markingScheme: { positive: 1.0, negative: 0.33, unattempted: 0 },
                allowedQuestionTypes: ['SINGLE_CORRECT_MCQ'],
                navigationRule: 'FREE_NAVIGATION'
              }
            ]
          }
        ]
      }
    ]
  };
}
