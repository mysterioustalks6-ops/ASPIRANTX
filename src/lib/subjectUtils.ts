import { getExamConfig } from './examRegistry';

export const getStandardSubject = (examId: string, rawSubj: string): string => {
  const exam = String(examId || '').toUpperCase();
  let s = String(rawSubj || '').trim().toLowerCase();
  s = s.replace(/^(nda|neet|upsc|ssc)\s+/i, '');

  if (exam.includes('NEET') || exam.includes('JENPAS') || exam.includes('ANM') || exam.includes('GNM') || exam.includes('NURSING')) {
    if (s.includes('physic')) return 'Physics';
    if (s.includes('chemist')) return 'Chemistry';
    if (s.includes('bio') || s.includes('botany') || s.includes('zoolog') || s.includes('physiol')) return 'Biology';
    return 'Biology';
  }

  if (exam.includes('NDA') || exam.includes('CDS') || exam.includes('DEFENCE') || exam.includes('AIR_FORCE')) {
    if (s.includes('math') || s.includes('calculus') || s.includes('algebra') || s.includes('trig') || s.includes('geometry') || s.includes('vector') || s.includes('probab')) return 'Mathematics';
    if (s.includes('engl')) return 'English';
    if (s.includes('physic')) return 'Physics';
    if (s.includes('chemist')) return 'Chemistry';
    if (s.includes('biolog') || s.includes('zoolog') || s.includes('botany')) return 'Biology';
    if (s.includes('geog')) return 'Geography';
    if (s.includes('hist')) return 'History of India';
    if (s.includes('polit')) return 'Indian Polity & Governance';
    if (s.includes('current') || s.includes('gk')) return 'Current Affairs & GK';
    return 'General Science';
  }

  if (exam.includes('UPSC') || exam.includes('PCS') || exam.includes('WBCS') || exam.includes('BPSC')) {
    if (s.includes('polit') || s.includes('govern') || s.includes('constitut') || s.includes('law')) return 'Indian Polity & Governance';
    if (s.includes('histor') || s.includes('culture') || s.includes('art') || s.includes('freedom')) return 'History of India';
    if (s.includes('environ') || s.includes('ecolog')) return 'Environment & Ecology';
    if (s.includes('geograph')) return 'Geography';
    if (s.includes('econom') || s.includes('finance')) return 'Economy';
    if (s.includes('sci') || s.includes('tech')) return 'Science & Technology';
    if (s.includes('internat') || s.includes('current') || s.includes('relation')) return 'International Relations & Current Affairs';
    if (s.includes('csat') || s.includes('aptit') || s.includes('reason') || s.includes('math')) return 'CSAT (Paper-2)';
    return 'General Studies';
  }

  if (exam.includes('SSC') || exam.includes('BANK') || exam.includes('PO') || exam.includes('RRB')) {
    if (s.includes('quant') || s.includes('math') || s.includes('arith') || s.includes('number') || s.includes('geomet') || s.includes('algeb')) return 'Quantitative Aptitude';
    if (s.includes('reason') || s.includes('intellig') || s.includes('logic') || s.includes('mental')) return 'General Intelligence & Reasoning';
    if (s.includes('english') || s.includes('compreh') || s.includes('verbal')) return 'English Comprehension';
    if (s.includes('aware') || s.includes('gk') || s.includes('general') || s.includes('current')) return 'General Awareness';
    return 'General Studies';
  }

  if (s.includes('physic')) return 'Physics';
  if (s.includes('chemist')) return 'Chemistry';
  if (s.includes('biolog') || s.includes('botan') || s.includes('zoolo')) return 'Biology';
  if (s.includes('math')) return 'Mathematics';
  if (s.includes('english')) return 'English';
  if (s.includes('polit')) return 'Indian Polity & Governance';

  return rawSubj || 'General Studies';
};

export const getExamSubjects = (examId: string): string[] => {
  return getExamConfig(examId).subjects;
};
