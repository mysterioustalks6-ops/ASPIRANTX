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

export const SUBJECT_HI_MAP: Record<string, string> = {
  'Physics': 'भौतिक विज्ञान',
  'Chemistry': 'रसायन विज्ञान',
  'Biology': 'जीव विज्ञान',
  'Botany': 'वनस्पति विज्ञान',
  'Zoology': 'प्राणी विज्ञान',
  'Mathematics': 'गणित',
  'English': 'अंग्रेजी',
  'History of India': 'भारत का इतिहास',
  'History': 'इतिहास',
  'Indian Polity & Governance': 'भारतीय राजव्यवस्था एवं शासन',
  'Polity': 'राजव्यवस्था',
  'Geography': 'भूगोल',
  'Economy': 'भारतीय अर्थव्यवस्था',
  'Economics': 'अर्थशास्त्र',
  'Environment & Ecology': 'पर्यावरण एवं पारिस्थितिकी',
  'Science & Technology': 'विज्ञान एवं प्रौद्योगिकी',
  'General Science': 'सामान्य विज्ञान',
  'General Studies': 'सामान्य अध्ययन',
  'Quantitative Aptitude': 'संख्यात्मक अभियोग्यता',
  'General Intelligence & Reasoning': 'सामान्य बुद्धिमत्ता एवं तर्कशक्ति',
  'English Comprehension': 'अंग्रेजी बोध',
  'General Awareness': 'सामान्य जागरूकता',
  'Current Affairs & GK': 'समसामयिकी एवं सामान्य ज्ञान',
  'CSAT (Paper-2)': 'सीसैट (प्रश्नपत्र-२)',
  'Mechanics & Motion': 'यांत्रिकी एवं गति',
  'Thermodynamics & Heat': 'ऊष्मागतिकी एवं ऊष्मा',
  'Electrostatics & Magnetism': 'स्थिरवैद्युतिकी एवं चुंबकत्व',
  'Optics & Waves': 'प्रकाशिकी एवं तरंगें',
  'Modern Physics & Semiconductors': 'आधुनिक भौतिकी एवं अर्धचालक',
  'Physical Chemistry & Thermodynamics': 'भौतिक रसायन एवं ऊष्मागतिकी',
  'Organic Chemistry & Reaction Mechanisms': 'कार्बनिक रसायन एवं अभिक्रिया क्रियाविधि',
  'Inorganic Chemistry & Coordination Compounds': 'अकार्बनिक रसायन एवं उपसहसंयोजक यौगिक',
  'Cell Biology & Genetics': 'कोशिका विज्ञान एवं आनुवंशिकी',
  'Human Physiology': 'मानव शरीर क्रिया विज्ञान',
  'Plant Physiology': 'पादप कार्यिकी',
  'Ecology & Environment': 'पारिस्थितिकी एवं पर्यावरण',
  'Diversity in Living World': 'जीव जगत में विविधता',
  'Structural Organisation in Animals & Plants': 'पादप एवं जन्तुओं में संरचनात्मक संगठन',
  'Biotechnology & Applications': 'जैव प्रौद्योगिकी एवं अनुप्रयोग',
  'Biology & Human Welfare': 'मानव कल्याण में जीव विज्ञान'
};

export const EXAM_HI_MAP: Record<string, string> = {
  'NEET (UG)': 'नीट (UG)',
  'NEET': 'नीट (UG)',
  'NEET_UG': 'नीट (UG)',
  'NEET (UG) Medical Entrance Test': 'नीट (यूजी) चिकित्सा प्रवेश परीक्षा',
  'JEE Main': 'जेईई मेन',
  'JEE_MAIN': 'जेईई मेन',
  'JEE Main Engineering Entrance': 'जेईई मेन इंजीनियरिंग प्रवेश परीक्षा',
  'JEE Advanced': 'जेईई एडवांस्ड',
  'JEE_ADVANCED': 'जेईई एडवांस्ड',
  'UPSC': 'यूपीएससी',
  'UPSC CSE': 'यूपीएससी सिविल सेवा',
  'UPSC_CSE': 'यूपीएससी सिविल सेवा',
  'UPSC Civil Services Examination': 'संघ लोक सेवा आयोग सिविल सेवा परीक्षा',
  'SSC CGL': 'एसएससी सीजीएल',
  'SSC_CGL': 'एसएससी सीजीएल',
  'SSC Combined Graduate Level (CGL)': 'कर्मचारी चयन आयोग सीजीएल परीक्षा',
  'NDA / NA': 'एनडीए / एनए',
  'NDA & NA': 'एनडीए एवं एनए',
  'NDA_NA': 'एनडीए एवं एनए',
  'NDA / NA Defence Academy Exam': 'एनडीए / एनए रक्षा अकादमी परीक्षा',
  'GATE': 'गेट',
  'GATE Engineering Graduate Aptitude': 'गेट इंजीनियरिंग स्नातक अभिरुचि परीक्षा',
  'CAT': 'कैट',
  'CAT IIM Management Entrance': 'कैट आईआईएम प्रबंधन प्रवेश परीक्षा',
  'IBPS PO': 'आईबीपीएस पीओ',
  'IBPS_PO': 'आईबीपीएस पीओ',
  'IBPS PO / Clerk Banking Exam': 'आईबीपीएस बैंक पीओ / क्लर्क परीक्षा',
  'Railway RRB NTPC Examination': 'रेलवे भर्ती बोर्ड एनटीपीसी परीक्षा',
  'RRB NTPC': 'आरआरबी एनटीपीसी',
  'RRB_NTPC': 'आरआरबी एनटीपीसी',
  'UGC NET / JRF Assistant Professorship': 'यूजीसी नेट / जेआरएफ परीक्षा',
  'UPPSC State Civil Services Exam': 'यूपीपीएससी राज्य सिविल सेवा परीक्षा',
  'UPPSC PCS': 'यूपीपीएससी पीसीएस',
  'UPPSC_PCS': 'यूपीपीएससी पीसीएस',
  'BPSC Bihar Public Service Commission': 'बीपीएससी बिहार लोक सेवा आयोग परीक्षा',
  'BPSC': 'बीपीएससी',
  'BPSC_CCE': 'बीपीएससी',
  'WB CS / State Civil Services Exam': 'पश्चिम बंगाल राज्य सिविल सेवा परीक्षा'
};

export const getLocalizedSubject = (subject: string, isHindi: boolean): string => {
  if (!isHindi || !subject) return subject;
  return SUBJECT_HI_MAP[subject] || SUBJECT_HI_MAP[subject.trim()] || subject;
};

export const getLocalizedExamName = (name: string, isHindi: boolean): string => {
  if (!isHindi || !name) return name;
  const trimmed = name.trim();
  if (EXAM_HI_MAP[trimmed]) return EXAM_HI_MAP[trimmed];
  const upper = trimmed.toUpperCase();
  if (upper.includes('NEET')) return 'नीट (UG)';
  if (upper.includes('JEE MAIN')) return 'जेईई मेन';
  if (upper.includes('JEE ADV')) return 'जेईई एडवांस्ड';
  if (upper.includes('UPSC')) return 'यूपीएससी';
  if (upper.includes('GATE')) return 'गेट';
  if (upper.includes('NDA')) return 'एनडीए';
  if (upper.includes('CDS')) return 'सीडीएस';
  if (upper.includes('SSC')) return 'एसएससी';
  if (upper.includes('CAT')) return 'कैट';
  if (upper.includes('BANK') || upper.includes('IBPS') || upper.includes('SBI')) return 'बैंकिंग';
  return trimmed;
};

