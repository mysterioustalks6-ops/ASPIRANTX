import { SyllabusHierarchyNode } from '../types';
const neetPyqs: any[] = [];

export const INITIAL_SYLLABUS_HIERARCHY: SyllabusHierarchyNode[] = [
  {
    id: 'u1-1',
    exam: 'UPSC_CSE',
    paper: 'General Studies - 2',
    subject: 'Indian Polity & Governance',
    chapter: 'Constitutional Framework',
    topic: 'Preamble & Citizenship',
    subtopic: 'Preamble, Citizenship & Basic Structure',
    title: 'Preamble, Citizenship & Basic Structure',
    stage: 'Prelims',
    weightage: 'High',
    estimatedHours: 2.5,
    completed: true,
    description: 'Preamble philosophy, basic structure doctrine, and citizenship acts.',
    difficulty: 'Medium',
    recommendedBooks: ['M. Laxmikanth Indian Polity', 'NCERT Class 11'],
    pyqCount: 14,
    prerequisites: ['Basic Historical Background']
  },
  {
    id: 'u1-2',
    exam: 'UPSC_CSE',
    paper: 'General Studies - 2',
    subject: 'Indian Polity & Governance',
    chapter: 'Constitutional Framework',
    topic: 'Fundamental Rights',
    subtopic: 'Fundamental Rights (Art 12 - 35)',
    title: 'Fundamental Rights (Art 12 - 35)',
    stage: 'Prelims',
    weightage: 'High',
    estimatedHours: 2.5,
    completed: true,
    description: 'Detailed analysis of Articles 12 to 35, Writs, and Judicial Review.',
    difficulty: 'Hard',
    recommendedBooks: ['M. Laxmikanth', 'DD Basu'],
    pyqCount: 22,
    prerequisites: ['Preamble']
  },
  {
    id: 'u1-3',
    exam: 'UPSC_CSE',
    paper: 'General Studies - 2',
    subject: 'Indian Polity & Governance',
    chapter: 'Constitutional Framework',
    topic: 'Directive Principles',
    subtopic: 'Directive Principles (DPSP) & Fundamental Duties',
    title: 'Directive Principles (DPSP) & Fundamental Duties',
    stage: 'Prelims',
    weightage: 'High',
    estimatedHours: 2.5,
    completed: true,
    description: 'DPSP socialist, Gandhian, and liberal-intellectual principles.',
    difficulty: 'Medium',
    recommendedBooks: ['M. Laxmikanth'],
    pyqCount: 15,
    prerequisites: ['Fundamental Rights']
  },
  {
    id: 'u2-1',
    exam: 'UPSC_CSE',
    paper: 'General Studies - 1',
    subject: 'Modern Indian History',
    chapter: 'Freedom Struggle',
    topic: 'Revolt of 1857',
    subtopic: 'Revolt of 1857: Causes, Leaders & Failure',
    title: 'Revolt of 1857: Causes, Leaders & Failure',
    stage: 'Prelims',
    weightage: 'High',
    estimatedHours: 2.5,
    completed: true,
    description: 'Causes, centers of revolt, key leaders, and consequences.',
    difficulty: 'Medium',
    recommendedBooks: ['Spectrum Modern India', 'Bipin Chandra'],
    pyqCount: 18,
    prerequisites: ['British Expansionism']
  },
  {
    id: 's1-1',
    exam: 'SSC_CGL',
    paper: 'Tier-1 Quant',
    subject: 'Quantitative Aptitude',
    chapter: 'Number System',
    topic: 'HCF, LCM & Simplification',
    subtopic: 'Number Systems, HCF & LCM, Simplification',
    title: 'Number Systems, HCF & LCM, Simplification',
    stage: 'Tier-1',
    weightage: 'High',
    estimatedHours: 2.5,
    completed: true,
    description: 'Divisibility rules, unit digits, LCM & HCF word problems.',
    difficulty: 'Medium',
    recommendedBooks: ['RS Aggarwal Quantitative Aptitude'],
    pyqCount: 30,
    prerequisites: ['Basic Calculation Tricks']
  }
];

export const INITIAL_PYQS_DATABASE = neetPyqs || [];

export const INITIAL_QUESTION_BANK = [
  {
    id: 'qb_1',
    subject: 'Indian Polity & Governance',
    topic: 'Fundamental Rights',
    questionText: 'Which Article of the Constitution guarantees right to equality before law?',
    options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
    correctOption: 0,
    explanation: 'Article 14 ensures that the State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.',
    difficulty: 'Medium',
    source: 'PYQ'
  },
  {
    id: 'qb_2',
    subject: 'Modern Indian History',
    topic: 'Gandhian Era',
    questionText: 'In which year was the Non-Cooperation Movement launched by Mahatma Gandhi?',
    options: ['1919', '1920', '1922', '1930'],
    correctOption: 1,
    explanation: 'The Non-Cooperation Movement was officially launched in September 1920 at the Calcutta special session of the Indian National Congress.',
    difficulty: 'Easy',
    source: 'PYQ'
  },
  {
    id: 'qb_3',
    subject: 'Indian Economy',
    topic: 'Monetary Policy',
    questionText: 'Who regulates the monetary policy framework in India?',
    options: ['Ministry of Finance', 'SEBI', 'Reserve Bank of India (RBI)', 'NITI Aayog'],
    correctOption: 2,
    explanation: 'Reserve Bank of India (RBI) is entrusted with the responsibility of monetary policy formulation and maintaining price stability in India.',
    difficulty: 'Easy',
    source: 'PYQ'
  }
];
