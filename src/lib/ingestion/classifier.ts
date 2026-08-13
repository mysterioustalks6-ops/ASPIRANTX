// ============================================================
// SUBJECT / TOPIC / EXAM CLASSIFIER
// Uses canonical taxonomy from ExamConfig.
// Never uses loose fuzzy matching for subject assignment.
// ============================================================

import type { ExamId } from './types.js';

// ── Canonical subject taxonomies ────────────────────────────
export const CANONICAL_SUBJECTS: Record<ExamId, string[]> = {
  NEET_UG: ['Biology', 'Physics', 'Chemistry'],
  NDA_NA: ['Mathematics', 'Physics', 'Chemistry'],
  UPSC_CSE: [
    'History of India',
    'Indian Polity & Governance',
    'Economy',
    'Geography',
    'Science & Technology',
    'Environment & Ecology',
    'Current Affairs',
    'Art & Culture',
    'International Relations',
    'Social Issues',
  ],
  SSC_CGL: [
    'Quantitative Aptitude',
    'General Intelligence & Reasoning',
    'English Comprehension',
    'General Awareness',
  ],
};

// ── Subject keyword maps ─────────────────────────────────────
// Each keyword strongly signals a particular subject.
// Keywords are lowercase. Must appear as standalone words/phrases.
type SubjectKeywords = Record<string, string[]>;

const SUBJECT_KEYWORDS: Record<ExamId, SubjectKeywords> = {
  NEET_UG: {
    Biology: [
      'cell', 'mitosis', 'meiosis', 'chloroplast', 'mitochondri', 'dna', 'rna', 'gene',
      'chromosome', 'mutation', 'evolution', 'natural selection', 'photosynthesis',
      'respiration', 'transpiration', 'osmosis', 'diffusion', 'heredity', 'mendel',
      'taxonomy', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species',
      'bacteria', 'virus', 'fungi', 'algae', 'bryophyt', 'pteridophyt', 'gymnosperm',
      'angiosperm', 'morphology', 'anatomy', 'physiology', 'endocrin', 'nervous system',
      'heart', 'kidney', 'liver', 'lung', 'digestion', 'immune', 'vaccine', 'antibody',
      'enzyme', 'protein', 'amino acid', 'lipid', 'carbohydrate', 'nucleic acid',
      'biotechnology', 'cloning', 'pcr', 'gel electrophoresis', 'recombinant',
      'ecosystem', 'biodiversity', 'population', 'community',
    ],
    Physics: [
      'velocity', 'acceleration', 'force', 'momentum', 'torque', 'friction', 'gravitation',
      'orbit', 'projectile', 'collision', 'elastic', 'pressure', 'volume', 'entropy',
      'carnot', 'heat engine', 'conductor', 'insulator', 'semiconductor', 'transistor',
      'diode', 'capacitor', 'inductor', 'resistor', 'magnetic field', 'electric field',
      'flux', 'emf', 'ampere', 'ohm', 'watt', 'joule', 'photon', 'photoelectric',
      'x-ray', 'nuclear', 'radioactive', 'fission', 'fusion', 'transformer', 'motor',
      'generator', 'lens', 'mirror', 'refraction', 'reflection', 'diffraction',
      'interference', 'wavelength', 'frequency', 'amplitude', 'work done', 'kinetic energy',
      'potential energy', 'power', 'uniform rod', 'circular ring', 'charged sphere',
    ],
    Chemistry: [
      'organic', 'inorganic', 'bond', 'mole', 'molarity', 'normality', 'redox',
      'oxidation', 'reduction', 'electrochemistry', 'galvanic', 'electrolytic', 'ph',
      'acid', 'base', 'buffer', 'halogen', 'carbonyl', 'ester', 'aldehyde', 'ketone',
      'carboxyl', 'amine', 'polymer', 'petroleum', 'isomer', 'stereoisomer',
      'enantiomer', 'nucleophil', 'electrophil', 'benzene', 'aromatic', 'phenol',
      'alcohol', 'noble gas', 'hybridization', 'orbital', 'atomic radius',
      'ionization energy', 'electron affinity', 'lattice', 'crystal', 'catalyst',
      'colloidal', 'coordination', 'ligand', 'chelate', 'valence', 'periodic table',
      'avogadro', 'stoichiometry', 'reaction rate', 'equilibrium', 'le chatelier',
    ],
  },
  NDA_NA: {
    Mathematics: [
      'determinant', 'matrix', 'vector', 'scalar', 'dot product', 'cross product',
      'polynomial', 'quadratic', 'cubic', 'binomial theorem', 'permutation',
      'combination', 'probability', 'statistics', 'mean', 'median', 'mode',
      'standard deviation', 'variance', 'regression', 'correlation',
      'integral', 'derivative', 'differentiat', 'limit', 'continuity',
      'arithmetic progression', 'geometric progression', 'harmonic progression',
      'in hp', 'in gp', 'in ap', 'logarithm', 'log', 'complex number',
      'argand', 'modulus', 'argument', 'locus', 'conic section', 'parabola',
      'ellipse', 'hyperbola', 'circle', 'straight line', 'triangle', 'polygon',
      'trigonometric equation', 'inverse trigonometric', 'heights and distances',
      'set theory', 'relation', 'function', 'sequence', 'series',
    ],
    Physics: [
      'newton', 'velocity', 'acceleration', 'momentum', 'torque', 'gravitation',
      'orbit', 'projectile', 'collision', 'pressure', 'thermodynamics', 'entropy',
      'carnot', 'capacitor', 'inductor', 'resistor', 'magnetic', 'electric field',
      'electromagnetic', 'photon', 'photoelectric', 'nuclear', 'radioactive',
      'lens', 'mirror', 'refraction', 'diffraction', 'interference',
    ],
    Chemistry: [
      'organic', 'inorganic', 'bond', 'mole', 'molarity', 'redox',
      'oxidation', 'acid', 'base', 'halogen', 'polymer', 'isomer',
      'benzene', 'phenol', 'alcohol', 'hybridization', 'periodic table',
      'catalyst', 'equilibrium', 'reaction rate', 'electrochemistry',
    ],
  },
  UPSC_CSE: {
    'History of India': [
      'ancient india', 'medieval india', 'mughal', 'maratha', 'british raj',
      'freedom movement', 'gandhi', 'nehru', 'congress', 'revolt 1857',
      'partition', 'independence', 'harappa', 'mohenjo', 'vedic', 'maurya',
      'gupta', 'delhi sultanate', 'vijayanagara', 'colonialism',
    ],
    'Indian Polity & Governance': [
      'constitution', 'fundamental right', 'directive principle', 'parliament',
      'lok sabha', 'rajya sabha', 'president', 'prime minister', 'supreme court',
      'high court', 'panchayati raj', 'municipality', 'governor', 'federalism',
      'amendment', 'article', 'schedule', 'election commission', 'cag',
      'upsc commission', 'finance commission', 'planning commission',
    ],
    Economy: [
      'gdp', 'gnp', 'inflation', 'fiscal', 'monetary', 'rbi', 'sebi',
      'budget', 'revenue', 'capital expenditure', 'deficit', 'debt',
      'agriculture', 'industry', 'service sector', 'fdi', 'fpi',
      'trade', 'export', 'import', 'wto', 'imf', 'world bank',
      'poverty', 'employment', 'mgnrega', 'msme',
    ],
    Geography: [
      'mountain', 'river', 'ocean', 'climate', 'monsoon', 'soil',
      'vegetation', 'forest', 'desert', 'plateau', 'plain',
      'latitude', 'longitude', 'tropic', 'equator', 'himalaya',
      'deccan', 'western ghats', 'eastern ghats', 'delta', 'estuary',
      'mineral', 'coal', 'iron ore', 'petroleum',
    ],
    'Science & Technology': [
      'satellite', 'isro', 'space', 'nuclear energy', 'nanotechnology',
      'artificial intelligence', 'biotechnology', 'internet', '5g',
      'semiconductor', 'quantum', 'vaccine development', 'genome',
      'climate technology', 'renewable energy', 'solar', 'wind energy',
    ],
    'Environment & Ecology': [
      'biodiversity', 'wildlife', 'national park', 'tiger reserve',
      'wetland', 'ramsar', 'coral reef', 'mangrove', 'climate change',
      'global warming', 'carbon', 'greenhouse', 'ozone', 'pollution',
      'endangered species', 'conservation', 'ecosystem services',
    ],
  },
  SSC_CGL: {
    'Quantitative Aptitude': [
      'percentage', 'profit', 'loss', 'interest', 'ratio', 'proportion',
      'average', 'time and work', 'speed', 'distance', 'algebra',
      'geometry', 'mensuration', 'trigonometry', 'number system',
      'lcm', 'hcf', 'simplification', 'square root', 'cube root',
      'boat and stream', 'pipe', 'cistern', 'mixture',
    ],
    'General Intelligence & Reasoning': [
      'analogy', 'series', 'classification', 'coding', 'decoding',
      'direction', 'ranking', 'blood relation', 'syllogism', 'matrix',
      'odd one out', 'missing number', 'figure', 'pattern', 'mirror image',
      'water image', 'cube', 'dice', 'venn diagram', 'clock', 'calendar',
      'arrangement', 'seating', 'puzzle',
    ],
    'English Comprehension': [
      'synonym', 'antonym', 'one word substitution', 'idiom', 'phrase',
      'fill in the blank', 'error spotting', 'sentence correction',
      'active passive', 'direct indirect', 'reading comprehension',
      'passage', 'cloze test', 'spelling', 'vocabulary',
    ],
    'General Awareness': [
      'constitution', 'history', 'geography', 'economy', 'science',
      'current affairs', 'sports', 'award', 'government scheme',
      'international', 'national', 'state', 'culture', 'art',
      'famous personality', 'invention', 'discovery',
    ],
  },
};

// ── Canonical topic taxonomy (subset for classification) ─────
export const CANONICAL_TOPICS: Record<ExamId, Record<string, string[]>> = {
  NEET_UG: {
    'Cell Biology': ['cell', 'organelle', 'mitosis', 'meiosis', 'cell membrane', 'nucleus'],
    'Genetics & Evolution': ['genetics', 'heredity', 'mendel', 'dna', 'rna', 'chromosome', 'mutation', 'evolution'],
    'Human Physiology': ['heart', 'kidney', 'liver', 'lung', 'digestion', 'nervous', 'endocrine', 'blood'],
    'Plant Biology': ['photosynthesis', 'respiration', 'transpiration', 'plant', 'seed', 'flower'],
    'Ecology': ['ecosystem', 'biodiversity', 'population', 'food chain', 'environment'],
    'Organic Chemistry': ['organic', 'benzene', 'aldehyde', 'ketone', 'alcohol', 'acid', 'ester'],
    'Physical Chemistry': ['mole', 'molarity', 'equilibrium', 'thermodynamics', 'electrochemistry'],
    'Inorganic Chemistry': ['periodic table', 'metal', 'non-metal', 'coordination', 'p-block', 's-block', 'd-block'],
    'Mechanics': ['velocity', 'acceleration', 'force', 'momentum', 'work', 'energy', 'power'],
    'Electricity & Magnetism': ['electric field', 'magnetic field', 'capacitor', 'inductor', 'current'],
    'Optics & Waves': ['lens', 'mirror', 'refraction', 'reflection', 'wavelength', 'interference'],
    'Modern Physics': ['photoelectric', 'nuclear', 'radioactive', 'quantum', 'photon'],
  },
  NDA_NA: {
    'Algebra & Functions': ['polynomial', 'quadratic', 'function', 'sequence', 'series', 'logarithm', 'complex number'],
    'Calculus': ['integral', 'derivative', 'differentiat', 'limit', 'continuity'],
    'Statistics & Probability': ['probability', 'statistics', 'mean', 'median', 'variance', 'permutation', 'combination'],
    'Trigonometry': ['sin', 'cos', 'tan', 'trigonometric', 'heights and distances', 'inverse trigonometric'],
    'Geometry': ['circle', 'triangle', 'straight line', 'conic', 'parabola', 'ellipse', 'hyperbola'],
    'Vectors & Matrices': ['vector', 'matrix', 'determinant', 'scalar', 'dot product', 'cross product'],
    'Mechanics': ['velocity', 'acceleration', 'force', 'momentum', 'gravitation'],
    'Electricity & Magnetism': ['electric', 'magnetic', 'capacitor', 'current', 'resistor'],
  },
  UPSC_CSE: {
    'Constitutional Framework': ['constitution', 'fundamental right', 'directive principle', 'amendment'],
    'Parliament & Governance': ['parliament', 'lok sabha', 'rajya sabha', 'president', 'prime minister'],
    'Ancient & Medieval History': ['harappa', 'vedic', 'maurya', 'gupta', 'mughal', 'delhi sultanate'],
    'Modern History': ['british', 'freedom movement', 'gandhi', 'revolt 1857', 'independence'],
    'Indian Economy': ['gdp', 'inflation', 'fiscal', 'monetary', 'budget', 'agriculture'],
    'Physical Geography': ['mountain', 'river', 'ocean', 'climate', 'monsoon', 'soil'],
    'Biodiversity & Environment': ['biodiversity', 'wildlife', 'national park', 'climate change', 'carbon'],
  },
  SSC_CGL: {
    'Number System': ['number system', 'lcm', 'hcf', 'prime', 'square root', 'cube root'],
    'Algebra': ['algebra', 'equation', 'polynomial'],
    'Geometry & Mensuration': ['geometry', 'mensuration', 'area', 'volume', 'triangle', 'circle'],
    'Arithmetic': ['percentage', 'profit', 'loss', 'interest', 'ratio', 'average', 'speed', 'time'],
    'Reasoning: Analogy': ['analogy', 'related', 'same way'],
    'Reasoning: Series': ['series', 'missing', 'next term'],
    'Reasoning: Coding': ['coding', 'decoding', 'code'],
    'Vocabulary': ['synonym', 'antonym', 'spelling', 'vocabulary'],
    'Grammar': ['error', 'correction', 'fill in the blank', 'active passive'],
  },
};

export interface ClassificationResult {
  subject: string;
  topic: string;
  subjectConfidence: number;   // 0–1
  topicConfidence: number;     // 0–1
  isCanonical: boolean;
}

/**
 * Classify subject from question text using canonical keyword taxonomy.
 * Returns the canonical subject name or 'Unclassified'.
 * Never uses fuzzy matching — only keyword presence scoring.
 */
export function classifySubject(
  examId: ExamId,
  questionText: string,
  hint?: string
): { subject: string; confidence: number } {
  const subjects = CANONICAL_SUBJECTS[examId] || [];
  if (subjects.length === 0) return { subject: 'General', confidence: 0.5 };

  const text = (questionText + ' ' + (hint || '')).toLowerCase();
  const kwMap = SUBJECT_KEYWORDS[examId] || {};

  const scores: Record<string, number> = {};
  subjects.forEach(s => { scores[s] = 0; });

  for (const [subject, keywords] of Object.entries(kwMap)) {
    if (!subjects.includes(subject)) continue;
    const matched = keywords.filter(kw => text.includes(kw.toLowerCase()));
    scores[subject] = matched.length;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    // No keyword match — check if hint is a canonical subject
    if (hint) {
      const canon = subjects.find(s => s.toLowerCase() === hint.toLowerCase());
      if (canon) return { subject: canon, confidence: 0.4 };
    }
    return { subject: subjects[0], confidence: 0.2 }; // default to first, low confidence
  }

  const winner = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];

  // Confidence: ratio of winner to total possible keywords
  const totalKw = (kwMap[winner[0]] || []).length || 1;
  const conf = Math.min(0.98, 0.3 + (winner[1] / totalKw) * 0.7);

  return { subject: winner[0], confidence: conf };
}

/**
 * Classify topic from question text within a subject.
 * Returns 'Unclassified' if confidence is low.
 */
export function classifyTopic(
  examId: ExamId,
  subject: string,
  questionText: string
): { topic: string; confidence: number } {
  const topicMap = CANONICAL_TOPICS[examId] || {};
  const text = questionText.toLowerCase();

  const scores: Record<string, number> = {};
  for (const [topic, keywords] of Object.entries(topicMap)) {
    scores[topic] = keywords.filter(kw => text.includes(kw)).length;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return { topic: 'General Concepts', confidence: 0.3 };

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const totalKw = (topicMap[winner[0]] || []).length || 1;
  const conf = Math.min(0.95, 0.3 + (winner[1] / totalKw) * 0.7);

  if (conf < 0.35) return { topic: 'General Concepts', confidence: conf };
  return { topic: winner[0], confidence: conf };
}

/**
 * Detect exam from content when source cannot be trusted.
 * Returns null if ambiguous.
 */
export function detectExamFromContent(questionText: string, options: string[]): ExamId | null {
  const text = (questionText + ' ' + options.join(' ')).toLowerCase();

  // Very specific exam signals
  if (/\bneet\b|\bclass 11\b|\bclass 12\b|\bncert\b/.test(text)) return 'NEET_UG';
  if (/\bnda\b|\bna\s+examination\b/.test(text)) return 'NDA_NA';
  if (/\bupsc\b|\bcivil services\b|\bias\b|\bips\b/.test(text)) return 'UPSC_CSE';
  if (/\bssc\b|\bcgl\b|\bchsl\b|\bmts\b/.test(text)) return 'SSC_CGL';

  return null;
}

/**
 * Detect year from question source or text.
 */
export function detectYear(sourceDoc: string, questionText?: string): number | null {
  const text = (sourceDoc + ' ' + (questionText || '')).toLowerCase();
  const match = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (match) {
    const yr = parseInt(match[1], 10);
    if (yr >= 1950 && yr <= new Date().getFullYear()) return yr;
  }
  return null;
}

/**
 * Determine exam stage from source document name.
 */
export function detectStage(sourceDoc: string, exam: ExamId): 'Prelims' | 'Mains' | 'Tier-1' | 'Tier-2' {
  const s = sourceDoc.toLowerCase();
  if (s.includes('mains')) return 'Mains';
  if (s.includes('tier-2') || s.includes('tier 2') || s.includes('tier2')) return 'Tier-2';
  if (s.includes('tier-1') || s.includes('tier 1') || s.includes('tier1')) return 'Tier-1';
  return 'Prelims';
}
