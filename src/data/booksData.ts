import { ResourceBook } from '../types';

export const COMPREHENSIVE_BOOKS_DATABASE: ResourceBook[] = [
  // --- INDIAN POLITY & GOVERNANCE ---
  {
    id: 'b_laxmikanth',
    title: 'Indian Polity for Civil Services & State Examinations',
    author: 'M. Laxmikanth',
    category: 'Standard Book',
    subject: 'Indian Polity & Governance',
    exam: 'UPSC_CSE',
    mappedTopics: ['Constitutional Framework', 'System of Government', 'Central Government', 'State Government', 'Constitutional Bodies'],
    description: 'The definitive bible for UPSC CSE Polity covering Articles 1-395, amendments, Supreme Court landmark cases, and statutory bodies.',
    coverColor: 'bg-indigo-900',
    edition: '7th Edition (Latest)',
    importance: 'Essential'
  },
  {
    id: 'b_dd_basu',
    title: 'Introduction to the Constitution of India',
    author: 'Dr. Durga Das Basu',
    category: 'Reference Manual',
    subject: 'Indian Polity & Governance',
    exam: 'UPSC_CSE',
    mappedTopics: ['Constitutional Framework', 'Judiciary & Judicial Review', 'Federal Structure'],
    description: 'In-depth legal commentary ideal for GS Paper 2 Mains descriptive answers and legal philosophy of basic structure.',
    coverColor: 'bg-blue-900',
    edition: '26th Edition',
    importance: 'Recommended'
  },
  {
    id: 'b_ncert_polity_11',
    title: 'Class 11 NCERT: Indian Constitution at Work',
    author: 'NCERT',
    category: 'NCERT',
    subject: 'Indian Polity & Governance',
    exam: 'UPSC_CSE',
    mappedTopics: ['Preamble & Fundamental Rights', 'Elections and Representation', 'Executive and Legislature'],
    description: 'Foundational textbook building conceptual clarity on rights, federal balance, and parliamentary procedures.',
    coverColor: 'bg-emerald-900',
    edition: 'Latest Edition',
    importance: 'Essential'
  },

  // --- HISTORY & ART & CULTURE ---
  {
    id: 'b_spectrum_history',
    title: 'A Brief History of Modern India',
    author: 'Rajiv Ahir (Spectrum)',
    category: 'Standard Book',
    subject: 'Modern Indian History',
    exam: 'UPSC_CSE',
    mappedTopics: ['Freedom Struggle', 'Revolt of 1857', 'Gandhian Era', 'Governor Generals Timeline'],
    description: 'Concise timeline-oriented manual summarizing 18th century decline of Mughals through 1947 Independence Act.',
    coverColor: 'bg-amber-900',
    edition: '2025 Revised Edition',
    importance: 'Essential'
  },
  {
    id: 'b_nitin_singhania',
    title: 'Indian Art and Culture',
    author: 'Nitin Singhania',
    category: 'Standard Book',
    subject: 'Art & Culture',
    exam: 'UPSC_CSE',
    mappedTopics: ['Architecture & Sculpture', 'Classical Dances & Music', 'UNESCO World Heritage Sites'],
    description: 'Exhaustive visual encyclopedia on Indian architecture, paintings, performing arts, coinages, and UNESCO heritage.',
    coverColor: 'bg-rose-900',
    edition: '4th Edition',
    importance: 'Essential'
  },
  {
    id: 'b_rs_sharma',
    title: 'Class 11 NCERT: Ancient India',
    author: 'R.S. Sharma',
    category: 'NCERT',
    subject: 'Ancient History',
    exam: 'UPSC_CSE',
    mappedTopics: ['Indus Valley Civilization', 'Vedic Age', 'Buddhism & Jainism', 'Mauryan Empire'],
    description: 'Classic text covering stone age to post-Gupta era with emphasis on socio-economic transitions.',
    coverColor: 'bg-stone-800',
    edition: 'Old NCERT Text',
    importance: 'Essential'
  },

  // --- GEOGRAPHY ---
  {
    id: 'b_gc_leong',
    title: 'Certificate Physical and Human Geography',
    author: 'G.C. Leong',
    category: 'Standard Book',
    subject: 'Geography',
    exam: 'UPSC_CSE',
    mappedTopics: ['Geomorphology', 'Climatology', 'Oceanography', 'Biomes & Weathering'],
    description: 'Must-read for global physical geography, landforms, weather patterns, and climatic zones.',
    coverColor: 'bg-teal-900',
    edition: '3rd Edition',
    importance: 'Essential'
  },
  {
    id: 'b_ncert_geo_11',
    title: 'Class 11 NCERT: Fundamentals of Physical Geography',
    author: 'NCERT',
    category: 'NCERT',
    subject: 'Geography',
    exam: 'UPSC_CSE',
    mappedTopics: ['Interior of the Earth', 'Plate Tectonics', 'Atmospheric Circulation'],
    description: 'Core baseline for physical geography fundamentals and Earth system sciences.',
    coverColor: 'bg-cyan-900',
    edition: 'Latest Edition',
    importance: 'Essential'
  },

  // --- ECONOMY ---
  {
    id: 'b_ramesh_singh',
    title: 'Indian Economy for Civil Services',
    author: 'Ramesh Singh',
    category: 'Standard Book',
    subject: 'Indian Economy',
    exam: 'UPSC_CSE',
    mappedTopics: ['National Income Accounting', 'Monetary Policy', 'Fiscal Policy & Union Budget', 'Banking & NPA'],
    description: 'Comprehensive analysis of macroeconomic indicators, banking reforms, inflation metrics, and budget terms.',
    coverColor: 'bg-yellow-900',
    edition: '16th Edition',
    importance: 'Essential'
  },
  {
    id: 'b_eco_survey',
    title: 'Economic Survey 2024-25 & Union Budget Highlights',
    author: 'Ministry of Finance, Govt of India',
    category: 'Government Report',
    subject: 'Indian Economy',
    exam: 'UPSC_CSE',
    mappedTopics: ['Macroeconomic Framework', 'Capital Expenditure', 'Inflation & Growth Projections'],
    description: 'Official flagship document outlining annual economic performance, sectoral trends, and fiscal projections.',
    coverColor: 'bg-purple-900',
    edition: 'Annual 2024-25',
    importance: 'Essential'
  },

  // --- ENVIRONMENT & ECOLOGY ---
  {
    id: 'b_shankar_ias',
    title: 'Environment & Ecology Manual',
    author: 'Shankar IAS Academy',
    category: 'Standard Book',
    subject: 'Environment & Ecology',
    exam: 'UPSC_CSE',
    mappedTopics: ['Ecosystem Functions', 'Biodiversity Hotspots', 'Protected Area Network', 'Climate Change Summits'],
    description: 'Top-rated compilation on IUCN red data species, Ramsar sites, environmental laws, and international conventions.',
    coverColor: 'bg-emerald-950',
    edition: '10th Edition',
    importance: 'Essential'
  },

  // --- ETHICS (GS PAPER 4) ---
  {
    id: 'b_lexicon_ethics',
    title: 'Lexicon for Ethics, Integrity & Aptitude',
    author: 'Chronicle Publications',
    category: 'Standard Book',
    subject: 'Ethics, Integrity & Aptitude',
    exam: 'UPSC_CSE',
    mappedTopics: ['Ethics & Human Interface', 'Emotional Intelligence', 'Probity in Governance', 'Case Studies'],
    description: 'Dictionary and guide defining core administrative terms, moral thinkers, and case study resolution frameworks.',
    coverColor: 'bg-slate-800',
    edition: 'Latest Edition',
    importance: 'Essential'
  },
  {
    id: 'b_2nd_arc',
    title: '2nd Administrative Reforms Commission (ARC) Report: Ethics in Governance',
    author: 'Government of India',
    category: 'Government Report',
    subject: 'Ethics, Integrity & Aptitude',
    exam: 'UPSC_CSE',
    mappedTopics: ['Probity in Governance', 'Code of Conduct', 'Anti-Corruption Framework'],
    description: 'Official recommendation report for integrity, RTI, citizen charters, and whistleblower protection.',
    coverColor: 'bg-red-950',
    edition: '4th Report',
    importance: 'Recommended'
  },

  // --- QUANTITATIVE APTITUDE & REASONING (SSC / BANKING / RAILWAYS) ---
  {
    id: 'b_rs_aggarwal_quant',
    title: 'Quantitative Aptitude for Competitive Examinations',
    author: 'Dr. R.S. Aggarwal',
    category: 'Standard Book',
    subject: 'Mathematics & Quantitative Aptitude',
    exam: 'SSC_CGL',
    mappedTopics: ['Number System', 'Arithmetic Ability', 'Geometry & Mensuration', 'Trigonometry'],
    description: 'Extensive problem bank with shortcuts, formula sheets, and solved tier-1 and tier-2 practice sets.',
    coverColor: 'bg-amber-950',
    edition: '2025 Revised Edition',
    importance: 'Essential'
  },
  {
    id: 'b_rs_aggarwal_reasoning',
    title: 'A Modern Approach to Verbal & Non-Verbal Reasoning',
    author: 'Dr. R.S. Aggarwal',
    category: 'Standard Book',
    subject: 'General Intelligence & Reasoning',
    exam: 'SSC_CGL',
    mappedTopics: ['Analogy & Classification', 'Syllogisms', 'Puzzles & Seating Arrangement', 'Blood Relations'],
    description: 'Master manual for non-verbal series, pattern recognition, matrix logic, and critical statement analysis.',
    coverColor: 'bg-indigo-950',
    edition: 'Latest Edition',
    importance: 'Essential'
  }
];
