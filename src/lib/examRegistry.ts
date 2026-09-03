import { EXAM_LIST } from './examList';

export interface ExamConfig {
  examId: string;
  displayName: string;
  name?: string;
  category: 'MEDICAL' | 'ENGINEERING' | 'DEFENCE' | 'CIVIL_SERVICES' | 'SSC_BANKING' | 'LAW' | 'MANAGEMENT' | 'TEACHING' | 'STATE_EXAMS' | 'OTHER';
  stages: string[];
  papers: string[];
  subjects: string[];
  syllabusTree: Record<string, { topics: string[]; subtopics?: Record<string, string[]> }>;
  aliasMap: Record<string, string>;
  defaultSubject: string;
  languages: string[];
  difficultyLevels: string[];
  questionTypes: string[];
}

export const EXAM_REGISTRY: Record<string, ExamConfig> = {
  UPSC_CSE: {
    examId: 'UPSC_CSE',
    displayName: 'UPSC Civil Services Examination',
    category: 'CIVIL_SERVICES',
    stages: ['Prelims', 'Mains', 'Interview'],
    papers: ['GS Paper 1', 'GS Paper 2 (CSAT)', 'GS Paper 3', 'GS Paper 4 (Ethics)', 'Essay'],
    subjects: [
      'Indian Polity & Governance',
      'History of India',
      'Economy',
      'Geography',
      'Environment & Ecology',
      'Science & Technology',
      'International Relations & Current Affairs',
      'CSAT (Paper-2)'
    ],
    syllabusTree: {
      'Indian Polity & Governance': {
        topics: ['Constitutional Framework', 'Preamble & Fundamental Rights', 'Parliament & State Legislature', 'Judiciary & Judicial Review', 'Panchayati Raj & Local Bodies', 'Constitutional & Non-Constitutional Bodies'],
      },
      'History of India': {
        topics: ['Ancient History & Indus Valley', 'Vedic Period & Buddhism/Jainism', 'Medieval Empires & Sultanate', 'Modern India & Freedom Movement', 'Art, Architecture & Culture'],
      },
      'Economy': {
        topics: ['Indian Economy & National Income', 'Banking & Monetary Policy', 'Fiscal Policy & Budgeting', 'Financial Markets & Inflation', 'External Sector & Foreign Trade'],
      },
      'Geography': {
        topics: ['Physical Geography & Geomorphology', 'Climatology & Oceanography', 'Indian Physical & Human Geography', 'World Physical Geography'],
      },
      'Environment & Ecology': {
        topics: ['Ecosystems & Biodiversity', 'Climate Change & Global Warming', 'Environmental Laws & Conventions', 'Pollution & Conservation Efforts'],
      },
      'Science & Technology': {
        topics: ['Space Technology & ISRO', 'Defense & Nuclear Tech', 'Biotechnology & Genetics', 'IT, AI & Quantum Tech', 'General Science'],
      }
    },
    aliasMap: {
      'polity': 'Indian Polity & Governance',
      'constitution': 'Indian Polity & Governance',
      'history': 'History of India',
      'modern history': 'History of India',
      'economy': 'Economy',
      'geography': 'Geography',
      'environment': 'Environment & Ecology',
      'science': 'Science & Technology'
    },
    defaultSubject: 'Indian Polity & Governance',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Prelims MCQ', 'Mains Descriptive', 'Essay Paper', 'Ethics Case Study']
  },

  NEET_UG: {
    examId: 'NEET_UG',
    displayName: 'NEET (UG) Medical Entrance Test',
    category: 'MEDICAL',
    stages: ['Main Entrance'],
    papers: ['Paper 1 (PCB)'],
    subjects: ['Physics', 'Chemistry', 'Biology'],
    syllabusTree: {
      'Physics': {
        topics: ['Mechanics & Motion', 'Thermodynamics & Heat', 'Electrostatics & Magnetism', 'Optics & Waves', 'Modern Physics & Semiconductors'],
      },
      'Chemistry': {
        topics: ['Physical Chemistry & Thermodynamics', 'Organic Chemistry & Reaction Mechanisms', 'Inorganic Chemistry & Periodic Table', 'Chemical Bonding & Structure'],
      },
      'Biology': {
        topics: ['Human Physiology & Health', 'Genetics & Evolution', 'Cell Biology & Biomolecules', 'Plant Physiology & Reproduction', 'Ecology & Environment'],
      }
    },
    aliasMap: {
      'physics': 'Physics',
      'physic': 'Physics',
      'chemistry': 'Chemistry',
      'chemist': 'Chemistry',
      'biology': 'Biology',
      'botany': 'Biology',
      'zoology': 'Biology'
    },
    defaultSubject: 'Biology',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ']
  },

  NDA_NA: {
    examId: 'NDA_NA',
    displayName: 'NDA & NA Defence Academy Entrance',
    category: 'DEFENCE',
    stages: ['Written Exam', 'SSB Interview'],
    papers: ['Mathematics (Paper 1)', 'General Ability Test (Paper 2)'],
    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'General Science',
      'History of India',
      'Geography',
      'Current Affairs & GK',
      'English'
    ],
    syllabusTree: {
      'Mathematics': {
        topics: ['Algebra & Matrices', 'Trigonometry', 'Analytical Geometry', 'Differential & Integral Calculus', 'Probability & Statistics'],
      },
      'Physics': {
        topics: ['Properties of Matter', 'Optics & Sound', 'Electricity & Magnetism', 'Work, Power & Energy'],
      },
      'English': {
        topics: ['Grammar & Usage', 'Vocabulary & Synonyms', 'Comprehension', 'Ordering of Words'],
      }
    },
    aliasMap: {
      'math': 'Mathematics',
      'calculus': 'Mathematics',
      'trig': 'Mathematics',
      'english': 'English',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'history': 'History of India',
      'geography': 'Geography'
    },
    defaultSubject: 'Mathematics',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Written MCQ']
  },

  SSC_CGL: {
    examId: 'SSC_CGL',
    displayName: 'SSC Combined Graduate Level',
    category: 'SSC_BANKING',
    stages: ['Tier 1', 'Tier 2'],
    papers: ['Paper 1 (Tier 1)', 'Paper 1 (Tier 2)'],
    subjects: [
      'General Intelligence & Reasoning',
      'General Awareness',
      'Quantitative Aptitude',
      'English Comprehension'
    ],
    syllabusTree: {
      'Quantitative Aptitude': {
        topics: ['Number Systems & Arithmetic', 'Algebra & Geometry', 'Trigonometry & Mensuration', 'Data Interpretation'],
      },
      'General Intelligence & Reasoning': {
        topics: ['Analogy & Classification', 'Coding-Decoding', 'Series & Pattern Completion', 'Non-Verbal Reasoning'],
      },
      'General Awareness': {
        topics: ['Indian History & Polity', 'Geography & Economy', 'General Science', 'Static GK & Current Affairs'],
      },
      'English Comprehension': {
        topics: ['Grammar & Error Spotting', 'Reading Comprehension', 'Cloze Test & Sentence Improvement'],
      }
    },
    aliasMap: {
      'quant': 'Quantitative Aptitude',
      'math': 'Quantitative Aptitude',
      'reasoning': 'General Intelligence & Reasoning',
      'english': 'English Comprehension',
      'gk': 'General Awareness'
    },
    defaultSubject: 'Quantitative Aptitude',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ']
  }
};

import { getCustomExamConfig, getCustomExamsFromStorage } from './customExamStore';

/**
 * Normalizes any exam identifier, label, or alias into the canonical EXAM_LIST ID.
 * Returns a stable, canonical uppercase ID (e.g. 'UPSC_CSE', 'SSC_CGL', 'NEET_UG', 'NDA_NA').
 */
export function normalizeExamId(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return 'UPSC_CSE';
  const trimmed = raw.trim();
  if (!trimmed) return 'UPSC_CSE';

  // 1. Exact match in EXAM_LIST by ID
  const exactId = EXAM_LIST.find((e) => e.id.toLowerCase() === trimmed.toLowerCase());
  if (exactId) return exactId.id;

  // 2. Match by label in EXAM_LIST
  const exactLabel = EXAM_LIST.find((e) => e.label.toLowerCase() === trimmed.toLowerCase());
  if (exactLabel) return exactLabel.id;

  // 3. Match in custom exams
  try {
    const customExams = getCustomExamsFromStorage();
    const customMatch = customExams.find(
      (c) => c.id.toLowerCase() === trimmed.toLowerCase() || c.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (customMatch) return customMatch.id;
  } catch (e) {}

  // 4. Common canonical patterns
  const s = trimmed.toLowerCase();
  if (s.includes('upsc') || s.includes('civil service') || s.includes('ias')) return 'UPSC_CSE';
  if (s.includes('neet') || s.includes('national eligibility')) return 'NEET_UG';
  if (s.includes('ssc cgl') || s.includes('combined graduate level')) return 'SSC_CGL';
  if (s.includes('ssc chsl')) return 'SSC_CHSL';
  if (s.includes('nda') || s.includes('naval academy') || s.includes('national defence academy')) return 'NDA_NA';
  if (s.includes('cds') || s.includes('combined defence')) return 'CDS';
  if (s.includes('rrb ntpc')) return 'RRB_NTPC';
  if (s.includes('uppsc') || s.includes('up pcs')) return 'UPPSC_PCS';
  if (s.includes('bpsc')) return 'BPSC';
  if (s.includes('mppsc')) return 'MPPSC';
  if (s.includes('ibps po')) return 'IBPS_PO';
  if (s.includes('sbi po')) return 'SBI_PO';

  // 5. Look for partial match in EXAM_LIST
  const partial = EXAM_LIST.find((e) => s.includes(e.id.toLowerCase()) || e.label.toLowerCase().includes(s));
  if (partial) return partial.id;

  // 6. Clean uppercase fallback
  return trimmed.toUpperCase().replace(/[-\s]/g, '_');
}

export const getExamConfig = (examId: string): ExamConfig => {
  const normId = normalizeExamId(examId);
  if (EXAM_REGISTRY[normId]) {
    return EXAM_REGISTRY[normId];
  }

  // Check if exam is a user-created Custom Exam
  const customConfig = getCustomExamConfig(examId) || getCustomExamConfig(normId);
  if (customConfig) {
    return customConfig;
  }

  // Generic Dynamic Fallback Config for ANY exam in EXAM_LIST
  const match = EXAM_LIST.find(e => e.id === normId || e.id.toLowerCase() === examId.toLowerCase());
  const label = match ? match.label : normId.replace(/_/g, ' ');

  return {
    examId: normId,
    displayName: label,
    category: normId.includes('NEET') || normId.includes('NURSING') ? 'MEDICAL' :
              normId.includes('JEE') || normId.includes('GATE') ? 'ENGINEERING' :
              normId.includes('NDA') || normId.includes('CDS') || normId.includes('AFCAT') ? 'DEFENCE' :
              normId.includes('SSC') || normId.includes('IBPS') || normId.includes('SBI') ? 'SSC_BANKING' :
              normId.includes('LAW') || normId.includes('CLAT') ? 'LAW' :
              normId.includes('CAT') || normId.includes('MAT') ? 'MANAGEMENT' : 'OTHER',
    stages: ['Main Stage'],
    papers: ['General Paper'],
    subjects: ['General Studies', 'Aptitude & Reasoning', 'English & Verbal'],
    syllabusTree: {
      'General Studies': { topics: ['Core Concepts', 'Practice Topics'] }
    },
    aliasMap: {},
    defaultSubject: 'General Studies',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ']
  };
};
