import { SyllabusHierarchyNode } from '../types';


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
    completed: false,
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
    completed: false,
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
    completed: false,
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
    completed: false,
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
    completed: false,
    description: 'Divisibility rules, unit digits, LCM & HCF word problems.',
    difficulty: 'Medium',
    recommendedBooks: ['RS Aggarwal Quantitative Aptitude'],
    pyqCount: 30,
    prerequisites: ['Basic Calculation Tricks']
  }
];

import allQuestionsJson from './allQuestionsData.json';

export const INITIAL_PYQS_DATABASE: any[] = (allQuestionsJson as any[]).map((q) => ({
  id: q.id,
  exam: q.exam,
  subject: q.subject,
  topic: q.topic,
  year: q.year || 2023,
  stage: q.stage || 'Prelims',
  difficulty: q.difficulty || 'Medium',
  language: 'English',
  questionText: q.questionText,
  options: q.options,
  correctOption: q.correctOption,
  explanation: q.explanation,
  qualityStatus: 'readable',
  answerVerified: true
}));

export const INITIAL_QUESTION_BANK: any[] = (allQuestionsJson as any[]).map((q) => ({
  id: q.id,
  exam: q.exam,
  subject: q.subject,
  topic: q.topic,
  type: q.type || 'mcq',
  questionText: q.questionText,
  options: q.options,
  correctOption: q.correctOption,
  explanation: q.explanation,
  solutionText: q.explanation,
  difficulty: q.difficulty || 'Medium',
  status: 'published',
  verification_status: 'verified',
  language: 'English'
}));

