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
        topics: [
          'General Concepts',
          'Constitutional Framework & Development',
          'Fundamental Rights',
          'Directive Principles Of State Policy',
          'Fundamental Duties',
          'Parliament & State Legislatures',
          'Union & State Executive',
          'Judiciary',
          'Constitutional & Statutory Bodies',
          'Federalism & Centre–State Relations',
          'Local Government & Panchayati Raj',
          'Elections & Electoral Reforms',
          'Social Justice & Vulnerable Sections',
          'Emergency Provisions',
          'Public Finance & Finance Commission',
          'Governance – Advisory/Executive Councils & Committees'
        ],
      },
      'History of India': {
        topics: ['General Concepts', 'Ancient History & Indus Valley', 'Vedic Period & Buddhism/Jainism', 'Medieval Empires & Sultanate', 'Modern India & Freedom Movement', 'Art, Architecture & Culture'],
      },
      'Economy': {
        topics: ['General Concepts', 'Indian Economy & National Income', 'Banking & Monetary Policy', 'Fiscal Policy & Budgeting', 'Financial Markets & Inflation', 'External Sector & Foreign Trade'],
      },
      'Geography': {
        topics: ['General Concepts', 'Physical Geography & Geomorphology', 'Climatology & Oceanography', 'Indian Physical & Human Geography', 'World Physical Geography'],
      },
      'Environment & Ecology': {
        topics: ['General Concepts', 'Ecosystems & Biodiversity', 'Climate Change & Global Warming', 'Environmental Laws & Conventions', 'Pollution & Conservation Efforts'],
      },
      'Science & Technology': {
        topics: ['General Concepts', 'Space Technology & ISRO', 'Defense & Nuclear Tech', 'Biotechnology & Genetics', 'IT, AI & Quantum Tech', 'General Science'],
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
    subjects: ['General Intelligence & Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'],
    syllabusTree: {
      'Quantitative Aptitude': {
        topics: ['Number Systems, HCF & LCM', 'Percentage, Profit & Loss', 'Simple & Compound Interest', 'Ratio & Proportion', 'Time & Work, Pipes & Cisterns', 'Speed, Distance & Time', 'Algebra & Linear Equations', 'Trigonometry: Heights & Distances', 'Geometry: Triangles, Circles, Congruence', 'Mensuration 2D & 3D', 'Data Interpretation (Bar, Pie, Table)', 'Statistics: Mean, Median, Mode'],
      },
      'General Intelligence & Reasoning': {
        topics: ['Analogy (Verbal & Non-Verbal)', 'Classification & Odd One Out', 'Coding-Decoding (Letter & Number)', 'Series Completion (Number & Alphabet)', 'Syllogisms & Venn Diagrams', 'Blood Relations & Family Tree', 'Direction Sense Test', 'Matrix & Word Formation', 'Paper Folding & Cutting', 'Cube & Dice Problems', 'Missing Number & Figure Completion', 'Statement & Assumptions/Conclusions'],
      },
      'General Awareness': {
        topics: ['Ancient & Medieval Indian History', 'Modern History & Freedom Struggle', 'Indian Geography (Physical & Human)', 'Indian Polity & Constitution', 'Indian Economy & Budget', 'General Science (Physics, Chemistry, Biology)', 'Computer Fundamentals & IT', 'Awards, Books & Authors', 'Sports & Games', 'Current National & International Affairs', 'Important Days & Events', 'Static GK (Capitals, Currencies, HQ)'],
      },
      'English Comprehension': {
        topics: ['Spotting Errors & Grammar Rules', 'Fill in the Blanks (Vocabulary)', 'Synonyms & Antonyms', 'One Word Substitution', 'Idioms & Phrases', 'Spelling Correction', 'Sentence Improvement & Rearrangement', 'Active & Passive Voice', 'Direct & Indirect Speech', 'Cloze Test', 'Reading Comprehension Passages', 'Para Jumbles (Sentence Ordering)'],
      }
    },
    aliasMap: { 'quant': 'Quantitative Aptitude', 'math': 'Quantitative Aptitude', 'reasoning': 'General Intelligence & Reasoning', 'english': 'English Comprehension', 'gk': 'General Awareness' },
    defaultSubject: 'Quantitative Aptitude',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ']
  },

  SSC_CHSL: {
    examId: 'SSC_CHSL',
    displayName: 'SSC Combined Higher Secondary Level (10+2)',
    category: 'SSC_BANKING',
    stages: ['Tier 1', 'Tier 2'],
    papers: ['Paper 1 (Tier 1)', 'Paper 2 (Skill Test / DEO)'],
    subjects: ['General Intelligence & Reasoning', 'General Awareness', 'Quantitative Aptitude (Basic)', 'English Language'],
    syllabusTree: {
      'Quantitative Aptitude (Basic)': {
        topics: ['Number Systems & Simplification', 'Percentage & Average', 'Ratio, Proportion & Partnership', 'Time & Work / Speed & Distance', 'Simple Interest & Profit-Loss', 'Algebra Basics & Linear Equations', 'Basic Geometry & Mensuration', 'Data Interpretation (Tables, Charts)'],
      },
      'General Intelligence & Reasoning': {
        topics: ['Semantic Analogy & Classification', 'Symbolic Operations', 'Trends & Figural Series', 'Space Visualization', 'Venn Diagrams', 'Drawing Inferences', 'Punched Hole / Pattern Folding', 'Embedded Figures', 'Critical Thinking & Emotional Intelligence'],
      },
      'General Awareness': {
        topics: ['History of India (Ancient to Modern)', 'Indian Geography & Environment', 'Indian Polity & Constitution Basics', 'Indian Economy & Financial GK', 'Biology, Physics, Chemistry Basics', 'Computer Literacy & IT Basics', 'Current Affairs & Static GK'],
      },
      'English Language': {
        topics: ['Error Spotting & Sentence Correction', 'Fill in the Blanks', 'Synonyms, Antonyms & Spellings', 'One Word Substitution & Idioms', 'Comprehension Passage', 'Active/Passive & Direct/Indirect Speech'],
      }
    },
    aliasMap: { 'chsl': 'Quantitative Aptitude (Basic)', 'reasoning': 'General Intelligence & Reasoning', 'english': 'English Language', 'gk': 'General Awareness' },
    defaultSubject: 'Quantitative Aptitude (Basic)',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ', 'Descriptive Paper']
  },

  SSC_MTS: {
    examId: 'SSC_MTS',
    displayName: 'SSC Multi-Tasking Staff (MTS & Havaldar)',
    category: 'SSC_BANKING',
    stages: ['Paper 1', 'Paper 2'],
    papers: ['Session 1 (Numerical & Reasoning)', 'Session 2 (General Awareness & English)'],
    subjects: ['Numerical & Mathematical Ability', 'Reasoning Ability & Problem Solving', 'General Awareness', 'English Language & Comprehension'],
    syllabusTree: {
      'Numerical & Mathematical Ability': {
        topics: ['Whole Numbers, Fractions & Decimals', 'Number Relationships & HCF/LCM', 'Basic Arithmetic Operations', 'Percentage, Average & Ratio', 'Simple Geometry & Mensuration', 'Time, Distance, Work Basics'],
      },
      'Reasoning Ability & Problem Solving': {
        topics: ['Spatial & Visual Orientation', 'Basic Number Series', 'Coding & Decoding Basics', 'Similarities & Differences', 'Observation & Relationship Concepts', 'Judgment & Decision Making Basics'],
      },
      'General Awareness': {
        topics: ['India & Its Neighboring Countries', 'Sports, Culture & Festivals', 'History & Geography (School Level)', 'General Polity & Indian Constitution', 'Scientific Observations (Everyday Science)', 'Static GK: Awards, Books, Currencies'],
      },
      'English Language & Comprehension': {
        topics: ['Basic Grammar & Parts of Speech', 'Vocabulary: Synonyms & Antonyms', 'Fill in the Blanks (Simple)', 'Short Reading Comprehension'],
      }
    },
    aliasMap: { 'mts': 'Numerical & Mathematical Ability', 'havaldar': 'General Awareness' },
    defaultSubject: 'Numerical & Mathematical Ability',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium'],
    questionTypes: ['Objective MCQ', 'Short Answer']
  },

  JEE_MAIN: {
    examId: 'JEE_MAIN',
    displayName: 'JEE Main (Joint Entrance Examination)',
    category: 'ENGINEERING',
    stages: ['Session 1', 'Session 2'],
    papers: ['Paper 1 (B.Tech)', 'Paper 2A (B.Arch)', 'Paper 2B (B.Planning)'],
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    syllabusTree: {
      'Physics': {
        topics: ['Units, Dimensions & Measurement', 'Kinematics (1D, 2D & Projectile)', 'Laws of Motion & Friction', 'Work, Energy & Power', 'Rotational Motion & Moment of Inertia', 'Gravitation', 'Properties of Solids & Fluids', 'Oscillations & Simple Harmonic Motion', 'Waves & Sound', 'Heat & Thermodynamics', 'Kinetic Theory of Gases', 'Electrostatics & Gauss Law', 'Current Electricity & Circuits', 'Magnetic Effects of Current', 'Electromagnetic Induction & AC', 'Electromagnetic Waves', 'Ray Optics & Optical Instruments', 'Wave Optics', 'Dual Nature of Radiation & Matter', 'Atomic Physics (Bohr Model)', 'Nuclei & Radioactivity', 'Semiconductors & Electronic Devices'],
      },
      'Chemistry': {
        topics: ['Basic Concepts of Chemistry (Mole Concept)', 'Atomic Structure & Periodic Table', 'Chemical Bonding & Molecular Structure', 'States of Matter (Gases, Liquids, Solids)', 'Thermodynamics & Chemical Equilibrium', 'Ionic Equilibrium (pH, Buffer, Solubility)', 'Redox Reactions & Electrochemistry', 'Chemical Kinetics & Surface Chemistry', 's-Block Elements (Alkali & Alkaline)', 'p-Block Elements (Groups 13-18)', 'd & f Block Elements & Coordination Compounds', 'Haloalkanes & Haloarenes', 'Alcohols, Phenols & Ethers', 'Aldehydes, Ketones & Carboxylic Acids', 'Amines & Diazonium Salts', 'Biomolecules: Carbohydrates, Proteins, Vitamins', 'Polymers & Chemistry in Everyday Life'],
      },
      'Mathematics': {
        topics: ['Sets, Relations & Functions', 'Complex Numbers & Quadratic Equations', 'Matrices & Determinants', 'Permutations & Combinations', 'Binomial Theorem & Mathematical Induction', 'Sequences & Series (AP, GP, HP)', 'Straight Lines & Pair of Lines', 'Circles & Conic Sections (Parabola, Ellipse, Hyperbola)', 'Three Dimensional Geometry', 'Vectors & Scalar Triple Product', 'Limits, Continuity & Differentiability', 'Differentiation & Applications of Derivatives', 'Integration & Definite Integrals', 'Differential Equations', 'Trigonometry & Inverse Trigonometry', 'Probability & Statistics', 'Mathematical Reasoning'],
      }
    },
    aliasMap: { 'physics': 'Physics', 'chemistry': 'Chemistry', 'math': 'Mathematics', 'maths': 'Mathematics', 'calculus': 'Mathematics' },
    defaultSubject: 'Mathematics',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ (4 Options)', 'Numerical Value Answer']
  },

  JEE_ADVANCED: {
    examId: 'JEE_ADVANCED',
    displayName: 'JEE Advanced (IIT Entrance)',
    category: 'ENGINEERING',
    stages: ['Paper 1', 'Paper 2'],
    papers: ['Paper 1 (3 Hours)', 'Paper 2 (3 Hours)'],
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    syllabusTree: {
      'Physics': {
        topics: ['General Physics & Measurement', 'Mechanics: Kinematics, NLM, Work-Energy', 'Systems of Particles & Rigid Body Dynamics', 'Gravitation & Properties of Matter', 'Thermal Physics & Thermodynamics', 'Electricity & Magnetism (Advanced)', 'Electromagnetic Induction & Waves', 'Optics: Geometric & Physical', 'Modern Physics: Dual Nature, Atoms & Nuclei', 'Semiconductors & Communication Systems'],
      },
      'Chemistry': {
        topics: ['General Topics & Mole Concept', 'States of Matter & Atomic Structure', 'Chemical Bonding & Equilibrium', 'Electrochemistry & Chemical Kinetics', 'Solid State & Solutions', 'Inorganic Chemistry: Periodic Table & Extraction', 'Transition Elements & Coordination Chemistry', 'Organic Chemistry: GOC & Reaction Mechanisms', 'Hydrocarbons & Functional Group Reactions', 'Biomolecules, Polymers & Practical Chemistry'],
      },
      'Mathematics': {
        topics: ['Algebra: Complex Numbers, P&C, Binomial', 'Matrices, Determinants & Quadratic Equations', 'Probability & Statistics', 'Trigonometry (Functions, Equations, Properties)', 'Analytical Geometry: Conics & 3D Geometry', 'Differential Calculus (Limits to Applications)', 'Integral Calculus (Definite, Area, Diff Equations)', 'Vectors & Mathematical Induction'],
      }
    },
    aliasMap: { 'physics': 'Physics', 'chemistry': 'Chemistry', 'math': 'Mathematics', 'maths': 'Mathematics' },
    defaultSubject: 'Mathematics',
    languages: ['English'],
    difficultyLevels: ['Medium', 'Hard', 'Very Hard'],
    questionTypes: ['MCQ Single', 'MCQ Multiple Correct', 'Integer Type', 'Matching List']
  },

  IBPS_PO: {
    examId: 'IBPS_PO',
    displayName: 'IBPS PO (Probationary Officer)',
    category: 'SSC_BANKING',
    stages: ['Prelims', 'Mains', 'Interview'],
    papers: ['Prelims Paper', 'Mains Paper', 'Descriptive Paper'],
    subjects: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General/Economy/Banking Awareness', 'Computer Knowledge'],
    syllabusTree: {
      'Quantitative Aptitude': {
        topics: ['Number Series (Missing & Wrong Term)', 'Data Interpretation (Table, Bar, Pie, Line)', 'Quadratic Equations', 'Simplification & Approximation', 'Percentage, Profit & Loss', 'Simple & Compound Interest', 'Ratio, Partnership & Mixture/Alligation', 'Time & Work / Pipe & Cisterns', 'Speed, Distance & Boats/Trains', 'Probability & Permutation Combination', 'Caselet & Data Sufficiency'],
      },
      'Reasoning Ability': {
        topics: ['Puzzles & Seating Arrangement (Linear, Circular, Box)', 'Syllogisms (Old & New Pattern)', 'Inequalities (Direct & Coded)', 'Coding-Decoding (New Pattern)', 'Blood Relations & Direction Sense', 'Input-Output Machines', 'Order & Ranking', 'Data Sufficiency (Reasoning)', 'Critical Reasoning (Assumptions, Conclusions)', 'Alphanumeric Series & Miscellaneous'],
      },
      'English Language': {
        topics: ['Reading Comprehension (Story-based & Economy)', 'Error Spotting (4-5 Types)', 'Fill in the Blanks (Single & Double)', 'Cloze Test (Traditional & New Pattern)', 'Para Jumbles & Sentence Connectors', 'Column-Based Sentence Completion', 'Vocabulary: Word Replacement & Usage', 'Sentence Improvement & Completion'],
      },
      'General/Economy/Banking Awareness': {
        topics: ['Banking Awareness (RBI, SEBI, NABARD, Schemes)', 'Financial Awareness (Budget, Monetary Policy, Rates)', 'Current Affairs (Last 6 Months)', 'Static GK (Headquarters, MD/CEOs, Trophies)', 'Indian Economy & Five Year Plans', 'Government Schemes & Initiatives'],
      },
      'Computer Knowledge': {
        topics: ['Computer Fundamentals & History', 'MS Office (Word, Excel, PowerPoint)', 'Internet, Email & Networking', 'Operating Systems (Windows Basics)', 'Database Basics & Programming Concepts', 'Keyboard Shortcuts & Number Systems'],
      }
    },
    aliasMap: { 'quant': 'Quantitative Aptitude', 'di': 'Quantitative Aptitude', 'reasoning': 'Reasoning Ability', 'english': 'English Language', 'banking': 'General/Economy/Banking Awareness', 'computer': 'Computer Knowledge' },
    defaultSubject: 'Quantitative Aptitude',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ', 'Descriptive Letter/Essay']
  },

  SBI_PO: {
    examId: 'SBI_PO',
    displayName: 'SBI PO (State Bank of India - Probationary Officer)',
    category: 'SSC_BANKING',
    stages: ['Prelims', 'Mains', 'GD + Interview'],
    papers: ['Prelims Paper', 'Mains Paper', 'Descriptive Test'],
    subjects: ['Quantitative Aptitude', 'Reasoning & Computer Aptitude', 'Data Analysis & Interpretation', 'General/Economy/Banking Awareness', 'English Language'],
    syllabusTree: {
      'Quantitative Aptitude': {
        topics: ['Number Series (Missing & Wrong)', 'Quadratic Equations', 'Data Interpretation (Multiple Sets)', 'Arithmetic: Percentage, SI/CI, Ratio, TW, TSD', 'Approximation & Simplification', 'Data Sufficiency', 'Probability & Permutation-Combination'],
      },
      'Reasoning & Computer Aptitude': {
        topics: ['Complex Puzzles (Floor, Box, Month, Blood Relation)', 'Seating Arrangements (Linear, Circular, Square)', 'Syllogisms & Inequalities', 'Input-Output & Coding-Decoding', 'Critical Reasoning (Course of Action, Inference)', 'Machine Input & Alpha-Numeric Series', 'Computer Aptitude (Logic Gates, Number System)', 'Flowchart & Algorithm Basics'],
      },
      'Data Analysis & Interpretation': {
        topics: ['Tabulation & Missing Data', 'Bar Graph, Line Graph & Pie Chart', 'Caselets (Paragraph-based DI)', 'Mixed Graphs & Radar Charts', 'Quantity Comparison Problems', 'Percentage-based Advanced DI'],
      },
      'General/Economy/Banking Awareness': {
        topics: ['Banking History & Structure (RBI Acts)', 'Monetary Tools: Repo, CRR, SLR, MSF', 'Government Banking Schemes', 'Financial Markets: Equity, Debt, Forex', 'Indian Economy Indicators (GDP, IIP, WPI)', 'International Organizations (IMF, WB, ADB)', 'Recent Banking Mergers & Acquisitions', 'Current Affairs (6 months)'],
      },
      'English Language': {
        topics: ['RC Passages (Economy, Social Issues, Science)', 'Error Detection (Multi-Sentence)', 'Fillers (Double & Multiple)', 'Cloze Test (New Pattern: Phrase-Based)', 'Para Jumbles & Connectors', 'Sentence Completion & Improvement', 'Vocabulary in Context'],
      }
    },
    aliasMap: { 'quant': 'Quantitative Aptitude', 'di': 'Data Analysis & Interpretation', 'reasoning': 'Reasoning & Computer Aptitude', 'english': 'English Language', 'banking': 'General/Economy/Banking Awareness' },
    defaultSubject: 'Quantitative Aptitude',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Medium', 'Hard'],
    questionTypes: ['Objective MCQ', 'Descriptive']
  },

  RRB_NTPC: {
    examId: 'RRB_NTPC',
    displayName: 'RRB NTPC (Non-Technical Popular Categories)',
    category: 'SSC_BANKING',
    stages: ['CBT 1 (Stage 1)', 'CBT 2 (Stage 2)', 'Typing / Skill Test'],
    papers: ['CBT Stage 1', 'CBT Stage 2'],
    subjects: ['Mathematics', 'General Intelligence & Reasoning', 'General Awareness & Current Affairs'],
    syllabusTree: {
      'Mathematics': {
        topics: ['Number Systems, Decimals & Fractions', 'LCM, HCF & Simplification', 'Ratio, Proportion & Percentages', 'Average & Mensuration', 'Time & Work, Pipe & Cisterns', 'Time, Speed & Distance, Boats & Trains', 'Simple & Compound Interest', 'Profit, Loss & Discount', 'Elementary Algebra & Geometry', 'Trigonometry & Statistics Basics'],
      },
      'General Intelligence & Reasoning': {
        topics: ['Analogies (Verbal & Figural)', 'Alphabetical & Number Series', 'Coding & Decoding', 'Mathematical Operations & Puzzles', 'Syllogisms & Venn Diagrams', 'Jumbling (Sentence Rearrangement)', 'Data Sufficiency', 'Conclusions & Decision Making', 'Relationships (Blood Relations, Directions)', 'Statement-Arguments & Course of Action'],
      },
      'General Awareness & Current Affairs': {
        topics: ['Current Affairs (Last 12 Months)', 'Games & Sports', 'Art & Culture of India', 'Indian Literature, Monuments & Landmarks', 'General Science (Physics, Chemistry, Life Sci)', 'Indian History (Ancient, Medieval, Modern)', 'Indian Polity & Governance', 'Indian Economy & Agriculture', 'Geography of India & World', 'Computer & Technology Basics', 'Important Government Schemes', 'Indian Railways: History, Types & GK'],
      }
    },
    aliasMap: { 'math': 'Mathematics', 'reasoning': 'General Intelligence & Reasoning', 'gk': 'General Awareness & Current Affairs', 'current affairs': 'General Awareness & Current Affairs' },
    defaultSubject: 'Mathematics',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ']
  },

  CDS: {
    examId: 'CDS',
    displayName: 'CDS (Combined Defence Services)',
    category: 'DEFENCE',
    stages: ['Written Exam', 'SSB Interview'],
    papers: ['English', 'General Knowledge', 'Elementary Mathematics (IMA/INA/AFA only)'],
    subjects: ['English', 'General Knowledge', 'Elementary Mathematics'],
    syllabusTree: {
      'English': {
        topics: ['Spotting Errors', 'Sentence Improvement', 'Fill in the Blanks (Grammar-based)', 'Synonyms & Antonyms', 'Ordering of Words in Sentence', 'Comprehension Passages', 'Selecting Words (Cloze Test)', 'Ordering of Sentences in Passage'],
      },
      'General Knowledge': {
        topics: ['Current Events: National & International', 'Indian History (Ancient, Medieval, Freedom Struggle)', 'World History (Key Events & Discoveries)', 'Physical, Social & Economic Geography', 'Indian Polity: Constitution & Governance', 'Indian Economy: Planning, Development, Trade', 'General Science: Physics, Chemistry, Biology Basics', 'Defence: Indian Armed Forces, Ranks, Awards', 'Environment & Ecology', 'Important Books, Authors & Personalities'],
      },
      'Elementary Mathematics': {
        topics: ['Arithmetic: Number Theory, HCF, LCM', 'Unitary Method, Time & Work, Speed', 'Percentage, Simple & Compound Interest', 'Ratio & Proportion, Profit & Loss', 'Algebra: Polynomials, Linear Equations', 'Geometry: Lines, Angles, Triangles, Circles', 'Mensuration: Area & Volume', 'Statistics: Mean, Median, Mode', 'Trigonometry: Ratios, Identities, Heights & Distances'],
      }
    },
    aliasMap: { 'english': 'English', 'gk': 'General Knowledge', 'math': 'Elementary Mathematics', 'maths': 'Elementary Mathematics' },
    defaultSubject: 'General Knowledge',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ']
  },

  AFCAT: {
    examId: 'AFCAT',
    displayName: 'AFCAT (Air Force Common Admission Test)',
    category: 'DEFENCE',
    stages: ['AFCAT Written', 'AFSB Interview'],
    papers: ['AFCAT Paper', 'EKT Paper (Technical Branch Only)'],
    subjects: ['General Awareness', 'Verbal Ability in English', 'Numerical Ability', 'Reasoning & Military Aptitude'],
    syllabusTree: {
      'General Awareness': {
        topics: ['History: Ancient, Medieval & Modern India', 'Geography: Physical & Human', 'Polity: Indian Constitution & Governance', 'Economy: Basics & Indian Economy', 'Defence & Indian Air Force History', 'Science & Technology: Space, Defence Tech', 'Sports, Books, Awards & Famous Personalities', 'Current Affairs (Last 12 Months)'],
      },
      'Verbal Ability in English': {
        topics: ['Comprehension Passages', 'Error Detection & Correction', 'Fill in the Blanks', 'Synonyms, Antonyms & Analogies', 'Cloze Test', 'Sentence Completion & Rearrangement', 'One Word Substitution & Idioms'],
      },
      'Numerical Ability': {
        topics: ['Decimal & Fraction', 'Simple Interest, CI & Percentage', 'Profit, Loss & Discount', 'Average, Ratio & Proportion', 'Time, Work & Distance', 'Basic Algebra & Geometry', 'Simplification & Approximation'],
      },
      'Reasoning & Military Aptitude': {
        topics: ['Verbal Skills & Spatial Ability', 'Figure Classification & Dot Situation', 'Pattern Completion & Hidden Figures', 'Distance & Direction Sense Test', 'Coding & Decoding', 'Numerical Reasoning & Series', 'Logical Sequences & Problem Solving'],
      }
    },
    aliasMap: { 'english': 'Verbal Ability in English', 'math': 'Numerical Ability', 'reasoning': 'Reasoning & Military Aptitude', 'gk': 'General Awareness', 'defence': 'General Awareness' },
    defaultSubject: 'General Awareness',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ']
  },

  UPPSC_PCS: {
    examId: 'UPPSC_PCS',
    displayName: 'UPPSC PCS (UP Provincial Civil Services)',
    category: 'CIVIL_SERVICES',
    stages: ['Prelims', 'Mains', 'Interview'],
    papers: ['General Studies Paper 1 (Prelims)', 'General Studies Paper 2 (CSAT)', 'Mains GS Papers 1-4', 'Optional Subject Paper'],
    subjects: ['General Studies', 'CSAT (Aptitude)', 'History & Culture', 'Indian Polity', 'Indian Economy', 'Science & Technology', 'Environment & Ecology', 'UP Special GK'],
    syllabusTree: {
      'General Studies': {
        topics: ['Indian National Movement & History', 'Indian Polity & Constitution', 'Indian Economy: Planning & Development', 'General Science & Technology', 'Indian & World Geography', 'Environment & Ecology', 'Current Events: National & International', 'UP General Knowledge (Special Section)'],
      },
      'UP Special GK': {
        topics: ['UP History: Ancient, Medieval & Modern', 'UP Geography: Rivers, Districts, Climate', 'UP Economy: Agriculture, Industry, Budget', 'UP Culture: Art, Dances, Fairs & Festivals', 'UP Polity: State Govt, Legislature, Judiciary', 'UP Government Schemes & Initiatives', 'Famous Personalities from UP', 'UP Literature (Hindi/Urdu Sahitya)'],
      },
      'CSAT (Aptitude)': {
        topics: ['Comprehension (Hindi & English Passages)', 'Interpersonal Skills & Communication', 'Logical Reasoning & Analytical Ability', 'Decision Making & Problem Solving', 'General Mental Ability', 'Basic Numeracy (Class 10 Level)', 'Data Interpretation (Graphs, Charts, Tables)'],
      },
      'Indian Polity': {
        topics: ['Constitution: Making & Features', 'Fundamental Rights, DPSP & FD', 'Union Legislature: Parliament & Laws', 'Union Executive: President, PM, Cabinet', 'Judiciary: SC, HC & Tribunals', 'Federalism & State Relations', 'Local Governance: PRIs & ULBs', 'Constitutional & Statutory Bodies'],
      }
    },
    aliasMap: { 'up gk': 'UP Special GK', 'polity': 'Indian Polity', 'csat': 'CSAT (Aptitude)', 'gs': 'General Studies' },
    defaultSubject: 'General Studies',
    languages: ['Hindi', 'English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ (Prelims)', 'Descriptive (Mains)']
  },

  BPSC: {
    examId: 'BPSC',
    displayName: 'BPSC (Bihar Public Service Commission)',
    category: 'CIVIL_SERVICES',
    stages: ['Prelims', 'Mains', 'Interview'],
    papers: ['General Studies (Prelims)', 'GS Paper 1 (Mains)', 'GS Paper 2 (Mains)', 'GS Paper 3 (Mains)', 'Optional Paper', 'Hindi Paper'],
    subjects: ['General Studies', 'Bihar Special GK', 'Indian Polity', 'Indian Economy', 'History', 'Geography', 'Science & Technology'],
    syllabusTree: {
      'General Studies': {
        topics: ['Indian National Movement & Bihar Freedom Fighters', 'General Science & Technology', 'Indian & World Geography', 'Indian Polity & Governance', 'Indian Economy & Bihar Economy', 'Current Events: Bihar, National & International', 'Statistical Analysis & Data Interpretation'],
      },
      'Bihar Special GK': {
        topics: ['Bihar History: Ancient (Magadha, Pataliputra, Mauryan)', 'Bihar History: Medieval (Mughals & Regional Kingdoms)', 'Bihar Modern History & Freedom Struggle', 'Bihar Geography: Rivers (Ganga, Kosi, Gandak), Districts', 'Bihar Economy: Agriculture, Industries, Budget', 'Bihar Culture: Chhath Puja, Madhubani Art, Bhojpuri', 'Bihar Polity: State Government & Chief Ministers', 'Bihar Government Schemes (7 Nischay, Har Ghar Bijli)'],
      },
      'History': {
        topics: ['Indus Valley & Vedic Civilization', 'Mahajanapadas & Mauryan Empire (Ashoka)', 'Gupta Empire & Post-Gupta Period', 'Medieval India: Delhi Sultanate & Mughals', 'British East India Company & Colonial Rule', 'Revolt of 1857 & Later Movements', 'Gandhian Era & Independence', 'Art & Architecture of India'],
      },
      'Indian Economy': {
        topics: ['Planning Commission to NITI Aayog', 'Agriculture: Green Revolution & Reforms', 'Industrial Policy & Make in India', 'Banking & Financial Sector Reforms', 'Poverty, Unemployment & Human Development', 'External Sector & Trade Policy', 'Bihar Economy: Agriculture, MSME, Exports'],
      }
    },
    aliasMap: { 'bihar gk': 'Bihar Special GK', 'history': 'History', 'gs': 'General Studies', 'economy': 'Indian Economy' },
    defaultSubject: 'General Studies',
    languages: ['Hindi', 'English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ (Prelims)', 'Descriptive (Mains)']
  },

  CTET: {
    examId: 'CTET',
    displayName: 'CTET (Central Teacher Eligibility Test)',
    category: 'TEACHING',
    stages: ['Paper 1 (Classes 1-5)', 'Paper 2 (Classes 6-8)'],
    papers: ['Paper 1 (Primary Level)', 'Paper 2 (Elementary Level)'],
    subjects: ['Child Development & Pedagogy', 'Language 1 (Hindi)', 'Language 2 (English)', 'Mathematics & Science (Paper 2)', 'Social Studies / Social Science (Paper 2)', 'Environmental Studies (Paper 1)'],
    syllabusTree: {
      'Child Development & Pedagogy': {
        topics: ['Child Development: Growth & Stages (Piaget, Vygotsky, Kohlberg)', 'Concept of Inclusive Education', 'Learning & Pedagogy: Theories & Methods', 'Learning Difficulties: Dyslexia, ADHD', 'Assessment & Evaluation Methods', 'Language & Thought in Children', 'Socialization Process & Gender as Social Construct', 'Intelligence & Creativity in Education'],
      },
      'Language 1 (Hindi)': {
        topics: ['Hindi Grammar: Sandhi, Samas, Karak, Kriya', 'Comprehension: Prose & Poetry', 'Pedagogy of Language Teaching (Hindi)', 'Language Learning & Language Acquisition', 'Errors & Their Analysis in Hindi', 'Teaching-Learning Materials in Hindi'],
      },
      'Language 2 (English)': {
        topics: ['Reading Comprehension (Unseen Passages)', 'English Grammar: Tenses, Articles, Prepositions', 'Vocabulary: Synonyms, Antonyms, Phrases', 'Pedagogy of English Language Teaching', 'Language Skills: LSRW (Listening, Speaking, Reading, Writing)', 'Principles of Teaching English'],
      },
      'Mathematics & Science (Paper 2)': {
        topics: ['Number System & Basic Operations', 'Fractions, Decimals & Rational Numbers', 'Algebra: Equations & Polynomials', 'Geometry: Shapes, Lines, Triangles', 'Mensuration & Data Handling', 'Food, Materials & Living World (Science)', 'Moving Things, People & Ideas (Physics)', 'How Things Work (Chemistry & Electricity)', 'Natural Resources & Environment (Science)', 'Pedagogical Issues in Math & Science Teaching'],
      },
      'Social Studies / Social Science (Paper 2)': {
        topics: ['History: From Earliest Societies to Modern India', 'Geography: Environment, Resources & Development', 'Political Science: Democracy, Government, Rights', 'Economics: Markets, Livelihoods & Inequality', 'Pedagogical Issues in Social Science Teaching', 'Diversity, Discrimination & Social Justice'],
      },
      'Environmental Studies (Paper 1)': {
        topics: ['Family & Friends: Relationships & Work', 'Food, Shelter & Water', 'Travel & Things We Make & Do', 'EVS Concepts: Plants, Animals, Nature', 'Pedagogy of EVS (Activity-Based Learning)', 'Discussion, Experimentation & Scope of EVS'],
      }
    },
    aliasMap: { 'cdp': 'Child Development & Pedagogy', 'pedagogy': 'Child Development & Pedagogy', 'hindi': 'Language 1 (Hindi)', 'english': 'Language 2 (English)', 'math': 'Mathematics & Science (Paper 2)', 'evs': 'Environmental Studies (Paper 1)', 'sst': 'Social Studies / Social Science (Paper 2)' },
    defaultSubject: 'Child Development & Pedagogy',
    languages: ['Hindi', 'English'],
    difficultyLevels: ['Easy', 'Medium'],
    questionTypes: ['Objective MCQ']
  },

  UGC_NET: {
    examId: 'UGC_NET',
    displayName: 'UGC NET (National Eligibility Test for Lectureship / JRF)',
    category: 'TEACHING',
    stages: ['Paper 1', 'Paper 2'],
    papers: ['Paper 1 (General Paper)', 'Paper 2 (Subject-Specific)'],
    subjects: ['Teaching Aptitude', 'Research Aptitude', 'Reading Comprehension', 'Communication', 'Reasoning (Including Mathematical)', 'Logical Reasoning', 'Data Interpretation', 'Information & Communication Technology', 'People, Development & Environment', 'Higher Education System'],
    syllabusTree: {
      'Teaching Aptitude': {
        topics: ['Nature, Objectives, Characteristics & Basic Requirements of Teaching', 'Learner\'s Characteristics: Age, Gender, Socio-Economic Background', 'Teaching Methods & Approaches (Learner-Centered, Activity-Based)', 'Teaching Support Systems: AV Aids & Educational Technology', 'Evaluation Systems: Assessment for Learning', 'Qualities of Good Teacher'],
      },
      'Research Aptitude': {
        topics: ['Research Meaning, Characteristics, Types & Ethics', 'Positivism vs Post-Positivism Research Paradigms', 'Research Methods: Survey, Historical, Case Study', 'Steps of Research: Problem Identification to Report Writing', 'Thesis & Article Writing Format (APA, MLA)', 'Data Collection: Tools, Techniques & Validation', 'Sampling Methods & Population Definition'],
      },
      'Logical Reasoning': {
        topics: ['Deductive & Inductive Reasoning', 'Syllogisms & Analogical Reasoning', 'Venn Diagrams & Logical Connectives', 'Indian Logical Tradition (Nyaya)', 'Argument Structure: Fallacies & Validity', 'Abductive Reasoning & Hypothesis Testing'],
      },
      'Data Interpretation': {
        topics: ['Sources, Acquisition & Data Classification', 'Quantitative & Qualitative Data Analysis', 'Graphical Representation (Bar, Pie, Line, Table)', 'Data & Governance in Higher Education', 'Measures of Central Tendency & Dispersion', 'Correlation & Regression Basics'],
      },
      'Information & Communication Technology': {
        topics: ['ICT Meaning, Types, Advantages & Limitations', 'Digital Learning & E-Learning Platforms', 'Computer Basics: Hardware, Software, Input/Output', 'Internet & Web Resources for Research', 'Cyber Ethics & Digital Literacy', 'Communication Technologies & MOOCs'],
      },
      'Higher Education System': {
        topics: ['Institutions of Higher Learning & Education in India', 'Formal, Non-Formal & Distance Education', 'Professional/Technical & Skill-Based Education', 'Value Education & Environmental Education', 'Policies, Governance & Administration in HE', 'NEP 2020: Key Provisions & Impact', 'Regulatory Bodies: UGC, NAAC, AICTE, NCTE'],
      }
    },
    aliasMap: { 'teaching': 'Teaching Aptitude', 'research': 'Research Aptitude', 'reasoning': 'Logical Reasoning', 'ict': 'Information & Communication Technology', 'higher education': 'Higher Education System', 'di': 'Data Interpretation' },
    defaultSubject: 'Teaching Aptitude',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Medium', 'Hard'],
    questionTypes: ['Objective MCQ']
  },

  GATE_CS: {
    examId: 'GATE_CS',
    displayName: 'GATE Computer Science & IT',
    category: 'ENGINEERING',
    stages: ['Single Exam'],
    papers: ['CS/IT Paper'],
    subjects: ['Engineering Mathematics', 'Digital Logic', 'Computer Organization & Architecture', 'Programming & Data Structures', 'Algorithms', 'Theory of Computation', 'Compiler Design', 'Operating Systems', 'Databases', 'Computer Networks', 'General Aptitude'],
    syllabusTree: {
      'Engineering Mathematics': {
        topics: ['Discrete Mathematics: Sets, Relations, Functions', 'Propositional & First Order Logic', 'Groups, Partial Orders & Lattices', 'Graph Theory: Trees, Connectivity, Coloring', 'Linear Algebra: Matrices, Eigenvalues', 'Probability, Conditional Probability & Distributions', 'Statistics: Mean, Variance, Standard Distributions', 'Calculus: Limits, Differentiation, Integration'],
      },
      'Programming & Data Structures': {
        topics: ['Programming in C (Pointers, Recursion, Structures)', 'Arrays, Linked Lists, Stacks & Queues', 'Trees: BST, AVL, Heaps, B-Trees', 'Graphs: BFS, DFS, Shortest Path', 'Hashing & Collision Resolution', 'Sorting & Searching Algorithms', 'Abstract Data Types & Complexity'],
      },
      'Algorithms': {
        topics: ['Asymptotic Notation: Big O, Omega, Theta', 'Divide & Conquer (Merge Sort, Quick Sort)', 'Greedy Algorithms (Activity Selection, Huffman)', 'Dynamic Programming (LCS, Knapsack, Matrix Chain)', 'Graph Algorithms: Dijkstra, Bellman-Ford, Floyd-Warshall', 'Minimum Spanning Trees: Prim & Kruskal', 'NP-Hard & NP-Complete: P vs NP, Reductions'],
      },
      'Operating Systems': {
        topics: ['Processes & Threads: States & Scheduling', 'CPU Scheduling: FCFS, SJF, Round Robin, Priority', 'Process Synchronization: Mutex, Semaphores, Monitors', 'Deadlock: Detection, Prevention, Avoidance (Banker)', 'Memory Management: Paging, Segmentation', 'Virtual Memory: Page Replacement Algorithms', 'File Systems: Allocation, Directory Structure', 'I/O Systems & Disk Scheduling'],
      },
      'Databases': {
        topics: ['ER Model: Entities, Relationships & Mapping', 'Relational Model: Keys, Integrity Constraints', 'SQL: DDL, DML, DCL, TCL, Joins & Subqueries', 'Normalization: 1NF, 2NF, 3NF, BCNF', 'Transaction Management: ACID Properties', 'Concurrency Control: Locking, Timestamp', 'Indexing: B+ Trees, Hashing', 'Query Processing & Optimization Basics'],
      },
      'Computer Networks': {
        topics: ['OSI & TCP/IP Models (Layer Wise Functions)', 'Physical Layer: Encoding, Modulation, Bandwidth', 'Data Link Layer: Framing, Error Control, MAC', 'Network Layer: IP Addressing, Subnetting, Routing Protocols', 'Transport Layer: TCP vs UDP, Flow & Error Control', 'Application Layer: HTTP, DNS, SMTP, FTP', 'Network Security: Encryption, Firewalls, SSL/TLS'],
      },
      'Theory of Computation': {
        topics: ['Regular Languages & Finite Automata (DFA, NFA)', 'Regular Expressions & Pumping Lemma', 'Context-Free Grammars & Pushdown Automata', 'Context-Free Languages & Parsing', 'Turing Machines & Variants', 'Decidability & Halting Problem', 'Complexity Classes: P, NP, NP-Complete'],
      },
      'General Aptitude': {
        topics: ['Verbal Ability: Grammar, Sentence Completion', 'Critical Reasoning & Analytical Skills', 'Numerical Ability: Arithmetic, Algebra, Geometry', 'Data Interpretation & Logical Puzzles'],
      }
    },
    aliasMap: { 'math': 'Engineering Mathematics', 'ds': 'Programming & Data Structures', 'algo': 'Algorithms', 'os': 'Operating Systems', 'dbms': 'Databases', 'cn': 'Computer Networks', 'toc': 'Theory of Computation', 'aptitude': 'General Aptitude' },
    defaultSubject: 'Programming & Data Structures',
    languages: ['English'],
    difficultyLevels: ['Medium', 'Hard', 'Very Hard'],
    questionTypes: ['MCQ', 'Multiple Select Question (MSQ)', 'Numerical Answer Type (NAT)']
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GATE — Graduate Aptitude Test in Engineering (All 29 Branches)
  // Stage 1 = General Aptitude + Engineering Mathematics (Common to all)
  // Stage 2 = Core Subject Paper (Branch Specific)
  // ─────────────────────────────────────────────────────────────────────────────

  GATE_CSE: {
    examId: 'GATE_CSE',
    displayName: 'GATE Computer Science & Information Technology (CS)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core CS Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core CS/IT Subject Paper'],
    subjects: [
      'General Aptitude',
      'Engineering Mathematics',
      'Digital Logic',
      'Computer Organization & Architecture',
      'Programming & Data Structures',
      'Algorithms',
      'Theory of Computation',
      'Compiler Design',
      'Operating Systems',
      'Databases',
      'Computer Networks',
      'Web Technologies'
    ],
    syllabusTree: {
      'General Aptitude': {
        topics: ['Verbal Aptitude: English Grammar, Word Groups, Instructions, Critical Reasoning', 'Quantitative Aptitude: Basic Mathematics, Data Interpretation', 'Analytical Aptitude: Logic, Analogies, Numerical Relations', 'Spatial Aptitude: Transformation, Mirror Images, Patterns']
      },
      'Engineering Mathematics': {
        topics: ['Discrete Mathematics: Propositional Logic, Sets, Functions, Relations, Graphs', 'Linear Algebra: Matrices, Determinants, Eigenvalues, Systems of Equations', 'Calculus: Limits, Continuity, Differentiation, Integration, Maxima-Minima', 'Probability & Statistics: Random Variables, Distributions, Bayes Theorem', 'Graph Theory: Trees, Connectivity, Planarity, Colorings', 'Combinatorics: Permutation, Combination, Counting Principles']
      },
      'Digital Logic': {
        topics: ['Boolean Algebra & Minimization (K-Map, Quine-McCluskey)', 'Logic Gates, Combinational Circuits (Adder, MUX, Decoder)', 'Sequential Circuits: Flip Flops, Counters, Shift Registers', 'Number Systems: Binary, Octal, Hex, BCD, Conversions', 'A/D & D/A Conversion Basics']
      },
      'Computer Organization & Architecture': {
        topics: ['Machine Instructions & Addressing Modes', 'CPU Design: ALU, Control Unit, Datapath', 'Instruction Level Parallelism: Pipelining, Hazards', 'Memory Hierarchy: Cache (Direct, Set-Associative, Fully-Assoc), Virtual Memory', 'I/O Interface: Interrupts, DMA, Polling', 'Secondary Storage: Disk Organization, RAID']
      },
      'Programming & Data Structures': {
        topics: ['C Programming: Pointers, Structures, Recursion, File I/O', 'Arrays, Linked Lists (Singly, Doubly, Circular)', 'Stacks, Queues, Priority Queues (Heap)', 'Trees: BST, AVL, Red-Black, B-Trees, Tries', 'Hashing: Hash Tables, Collision Resolution', 'Graphs: Representation (Adjacency Matrix/List)', 'String Processing']
      },
      'Algorithms': {
        topics: ['Asymptotic Analysis: Big-O, Omega, Theta', 'Recurrences: Master Theorem', 'Sorting: Merge, Quick, Heap, Counting, Radix', 'Searching: Binary Search, BFS, DFS', 'Greedy Algorithms: Kruskal, Prim, Dijkstra, Huffman', 'Dynamic Programming: LCS, LIS, Knapsack, Matrix Chain', 'Divide & Conquer', 'NP-Completeness: Reductions, P vs NP']
      },
      'Theory of Computation': {
        topics: ['Regular Languages: DFA, NFA, ε-NFA, Regular Expressions, Pumping Lemma', 'Context-Free Languages: CFG, PDA, Pumping Lemma for CFL', 'Pushdown Automata', 'Turing Machines: Variants, Decidability', 'Undecidability: Halting Problem, Rice\'s Theorem', 'Complexity Classes: P, NP, NP-Hard, NP-Complete']
      },
      'Compiler Design': {
        topics: ['Lexical Analysis: Regular Expressions, LEX', 'Syntax Analysis: Parsing (Top-Down, Bottom-Up), LL(1), LR(0), SLR, LALR, CLR', 'Syntax-Directed Translation, Parse Trees, ASTs', 'Semantic Analysis: Type Checking, Symbol Tables', 'Intermediate Code Generation: Three-Address Code, TAC', 'Code Optimization: Local, Global, Loop Optimizations', 'Code Generation & Register Allocation']
      },
      'Operating Systems': {
        topics: ['Processes: States, PCB, Context Switching', 'Threads & Concurrency: Mutex, Semaphore, Monitors', 'CPU Scheduling: FCFS, SJF, Priority, Round Robin, Multilevel', 'Deadlocks: Detection, Prevention, Avoidance (Banker\'s Algorithm)', 'Memory Management: Paging, Segmentation, Page Replacement (LRU, FIFO, OPT)', 'Virtual Memory: Thrashing, Working Set', 'File Systems: FAT, Inodes, Journaling', 'I/O Management & Disk Scheduling']
      },
      'Databases': {
        topics: ['ER Model: Entities, Relationships, Attributes, Keys', 'Relational Model: Keys, Functional Dependencies', 'Normalization: 1NF, 2NF, 3NF, BCNF, 4NF, 5NF', 'SQL: DDL, DML, DCL, Joins, Aggregation, Subqueries, Views', 'Relational Algebra & Calculus', 'Transactions: ACID, Concurrency Control (2PL, Timestamp), Recovery', 'Indexing: B+ Trees, Hashing, Clustered/Unclustered']
      },
      'Computer Networks': {
        topics: ['OSI Model: Layers & Protocols', 'Data Link Layer: Framing, Error Detection (CRC), MAC Protocols, CSMA/CD, CSMA/CA', 'Network Layer: IPv4/IPv6 Addressing, Subnetting, CIDR, Routing (OSPF, BGP, RIP)', 'Transport Layer: TCP vs UDP, Flow Control, Congestion Control, TCP Three-Way Handshake', 'Application Layer: HTTP, DNS, SMTP, FTP, SNMP', 'Network Security: Basics of Cryptography, SSL/TLS, Firewalls', 'Wireless Networks: IEEE 802.11']
      }
    },
    aliasMap: { 'CS': 'GATE_CSE', 'IT': 'GATE_CSE', 'Computer Science': 'GATE_CSE' },
    defaultSubject: 'Core CS/IT Subject Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'Multiple Select Question (MSQ)', 'Numerical Answer Type (NAT)']
  },

  GATE_ECE: {
    examId: 'GATE_ECE',
    displayName: 'GATE Electronics & Communication Engineering (EC)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core EC Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core EC Subject Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Networks & Signals', 'Electronic Devices', 'Analog Circuits', 'Digital Circuits', 'Control Systems', 'Communications', 'Electromagnetics'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Vector Analysis', 'Complex Analysis', 'Numerical Methods', 'Probability & Statistics'] },
      'Networks & Signals': {
        topics: ['KVL, KCL, Mesh, Nodal Analysis', 'Network Theorems: Thevenin, Norton, Superposition, Maximum Power Transfer', 'Transient & Steady-State Response: RC, RL, RLC Circuits', 'Two-Port Networks: Z, Y, H, ABCD Parameters', 'Continuous & Discrete-Time Signals: Fourier Series, Fourier Transform, Laplace, Z-Transform', 'Convolution, Sampling Theorem, Aliasing', 'LTI Systems: Causality, Stability, Impulse Response']
      },
      'Electronic Devices': {
        topics: ['Semiconductor Physics: Energy Bands, Carriers, Doping', 'p-n Junction Diode: I-V Characteristics, Zener, LED, Photodiode, Solar Cell', 'BJT: Modes (Active, Saturation, Cutoff), Small Signal Models', 'MOSFET: Enhancement & Depletion, Small Signal Model, CMOS', 'JFET Characteristics', 'Basics of Heterostructures & Quantum Confinement']
      },
      'Analog Circuits': {
        topics: ['Diode Circuits: Rectifiers (Half, Full-Wave), Clippers, Clampers', 'BJT & MOSFET Amplifiers: Biasing, Small-Signal Analysis, Gain, Bandwidth', 'Feedback Amplifiers: Types, Effects on Gain, Bandwidth, Impedance', 'Operational Amplifiers: Ideal & Non-Ideal, Applications (Integrator, Differentiator, Comparator)', 'Oscillators: Barkhausen Criterion, LC, RC (Wien Bridge, Phase-Shift)', 'Filters: Active (Butterworth, Chebyshev)', 'Function Generators & Voltage Regulators']
      },
      'Digital Circuits': {
        topics: ['Boolean Algebra, K-Map Minimization', 'Combinational: Adder, MUX, DEMUX, Encoder, Decoder, Priority Encoder', 'Sequential: SR, JK, T, D Flip Flops; Counters; Shift Registers', 'A/D & D/A Converters: DAC (Weighted, R-2R), ADC (Successive Approximation, Flash)', 'Memories: RAM (SRAM, DRAM), ROM, EEPROM, Flash', 'Logic Families: TTL, CMOS — Speed, Power Trade-offs']
      },
      'Control Systems': {
        topics: ['Transfer Function, Block Diagram Reduction, Signal Flow Graph (Mason\'s Rule)', 'Time Domain Analysis: First-Order & Second-Order Systems, Transient Response, Steady-State Error', 'Frequency Domain Analysis: Bode Plot, Nyquist Plot, Gain/Phase Margins', 'Stability: Routh-Hurwitz Criterion, Root Locus', 'Compensators: Lead, Lag, Lead-Lag; PID Controller', 'State-Space Representation: Controllability, Observability']
      },
      'Communications': {
        topics: ['Random Processes: Auto-Correlation, PSD, Ergodicity', 'Analog Modulation: AM (DSB-SC, SSB, VSB), FM, PM — BW & Power', 'Demodulation Techniques & Superheterodyne Receiver', 'Digital Modulation: ASK, FSK, PSK, QPSK, QAM', 'Pulse Modulation: PAM, PCM, DPCM, Delta Modulation', 'Information Theory: Entropy, Channel Capacity (Shannon\'s Theorem), Source Coding', 'Error Control Coding: Hamming, Cyclic, Convolutional Codes', 'Spread Spectrum & Multiple Access: TDMA, FDMA, CDMA, OFDM']
      },
      'Electromagnetics': {
        topics: ['Maxwell\'s Equations (Integral & Differential Forms)', 'Electrostatics: Coulomb\'s Law, Gauss Law, Electric Potential, Boundary Conditions', 'Magnetostatics: Biot-Savart, Ampere\'s Law, Faraday\'s Law', 'Plane Waves: Propagation, Polarization, Reflection, Refraction, Poynting Vector', 'Transmission Lines: Characteristic Impedance, Standing Waves, Smith Chart', 'Waveguides: TE, TM Modes, Cutoff Frequency', 'Antennas: Dipole, Radiation Pattern, Gain, Directivity, Effective Aperture']
      }
    },
    aliasMap: { 'EC': 'GATE_ECE', 'Electronics': 'GATE_ECE' },
    defaultSubject: 'Core EC Subject Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_EE: {
    examId: 'GATE_EE',
    displayName: 'GATE Electrical Engineering (EE)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core EE Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core EE Subject Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Electric Circuits', 'Electromagnetic Fields', 'Signals & Systems', 'Electrical Machines', 'Power Systems', 'Control Systems', 'Electrical & Electronic Measurements', 'Analog Electronics', 'Digital Electronics', 'Power Electronics'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Numerical Methods', 'Probability & Statistics', 'Transform Theory'] },
      'Electric Circuits': {
        topics: ['KVL, KCL, Network Analysis: Mesh, Nodal', 'Network Theorems: Thevenin, Norton, Superposition, Reciprocity', 'Transient & Steady-State AC Analysis', 'Resonance: Series & Parallel, Q-Factor', 'Three-Phase Circuits: Star-Delta, Power Measurement', 'Two-Port Networks', 'Graph Theory applied to Networks']
      },
      'Electromagnetic Fields': {
        topics: ['Coulomb\'s Law, Gauss\'s Law, Electric Field & Potential', 'Poisson\'s & Laplace\'s Equations', 'Biot-Savart & Ampere\'s Laws, Magnetic Flux Density', 'Faraday\'s Law, Maxwell\'s Equations', 'Boundary Conditions for Fields', 'Inductance & Capacitance of Transmission Lines', 'Plane Waves in Lossless & Lossy Media']
      },
      'Signals & Systems': {
        topics: ['LTI Systems: Properties, Impulse Response, Convolution', 'Fourier Series & Fourier Transform', 'Laplace Transform & Z-Transform', 'Sampling Theorem & Signal Reconstruction', 'Frequency Domain Analysis, Filters']
      },
      'Electrical Machines': {
        topics: ['Transformers: Equivalent Circuit, Efficiency, Regulation, Testing (OC, SC)', 'DC Machines: Separately Excited, Shunt, Series, Compound — Characteristics, Starting, Speed Control', 'Three-Phase Induction Motors: Equivalent Circuit, Torque-Speed Characteristics, Starting Methods', 'Single-Phase Induction Motors: Types & Applications', 'Synchronous Machines: EMF Equation, Armature Reaction, Phasor Diagram, Parallel Operation', 'Stepper & Servo Motors: Principle & Applications']
      },
      'Power Systems': {
        topics: ['Power Generation: Thermal, Hydro, Nuclear, Renewable Basics', 'Transmission Lines: ABCD Parameters, Surge Impedance Loading, Line Models (Short, Medium, Long)', 'Per-Unit System & Power System Matrices', 'Load Flow: Gauss-Seidel, Newton-Raphson Methods', 'Fault Analysis: Symmetrical & Unsymmetrical (SLG, LL, DLG) Faults, Sequence Networks', 'Circuit Breakers, Relays & Protection Systems', 'Power System Stability: Equal Area Criterion, Swing Equation', 'HVDC & FACTS Basics']
      },
      'Control Systems': {
        topics: ['Transfer Functions, Block Diagrams, Signal Flow Graphs', 'Time Response Analysis: Transient, Steady-State, Error Constants', 'Stability: Routh-Hurwitz, Root Locus', 'Frequency Response: Bode Plot, Nyquist Plot, Gain & Phase Margins', 'PID Controllers & Compensators', 'State-Space: Controllability, Observability, State Feedback']
      },
      'Electrical & Electronic Measurements': {
        topics: ['Errors in Measurement: Systematic, Random, Gross Errors', 'Bridges: Wheatstone, Maxwell, Hay, Schering Bridge', 'PMMC, Moving-Iron & Electrodynamometer Instruments', 'Potentiometers, CROs (Cathode Ray Oscilloscope)', 'Transducers: Strain Gauge, LVDT, Thermocouple, RTD', 'Q-Meter, Power Factor Meter', 'Digital Instruments: DVM, DSO']
      },
      'Analog Electronics': {
        topics: ['Diode Circuits, BJT & FET Biasing', 'Small Signal Amplifiers (CE, CB, CC Configurations)', 'Operational Amplifiers: Applications (Inverting, Non-Inverting, Integrator, Comparator)', 'Feedback & Oscillators', 'Wave Shaping Circuits']
      },
      'Digital Electronics': {
        topics: ['Number Systems & Boolean Algebra', 'Combinational Circuits & Minimization', 'Sequential Circuits: Flip-Flops, Counters, Registers', 'ADC, DAC Converters', 'Microprocessor Basics']
      },
      'Power Electronics': {
        topics: ['Power Semiconductor Devices: SCR, TRIAC, MOSFET, IGBT — Characteristics, Gate Drive', 'AC-DC Converters: Uncontrolled (Rectifiers), Controlled (Thyristor Converters)', 'DC-DC Converters: Buck, Boost, Buck-Boost, Cuk', 'DC-AC Inverters: Single-Phase & Three-Phase; PWM Techniques', 'AC-AC Converters: Cycloconverters, AC Voltage Controllers', 'Motor Drives: DC & AC Drive Systems']
      }
    },
    aliasMap: { 'EE': 'GATE_EE', 'Electrical': 'GATE_EE' },
    defaultSubject: 'Core EE Subject Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_ME: {
    examId: 'GATE_ME',
    displayName: 'GATE Mechanical Engineering (ME)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core ME Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core ME Subject Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Applied Mechanics & Design', 'Fluid Mechanics & Thermal Sciences', 'Materials, Manufacturing & Industrial Engineering'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Probability & Statistics', 'Numerical Methods'] },
      'Applied Mechanics & Design': {
        topics: ['Engineering Mechanics: Free Body Diagrams, Equilibrium, Trusses, Virtual Work, Friction', 'Mechanics of Materials: Stress, Strain, Mohr\'s Circle, Shear Force & BM Diagrams, Deflection of Beams, Columns (Euler)', 'Theory of Machines: Kinematics of Mechanisms, Velocity & Acceleration Diagrams, Governors, Gyroscopes', 'Vibrations: Free & Forced Vibrations, Resonance, Damping, Critical Speed of Shafts', 'Machine Design: Static & Fatigue Failure, Theories of Failure, Design of Shafts, Keys, Couplings, Gears, Bearings, Bolts & Welded Joints', 'Flywheels & Balancing of Rotating & Reciprocating Masses']
      },
      'Fluid Mechanics & Thermal Sciences': {
        topics: ['Fluid Properties: Viscosity, Surface Tension, Capillarity', 'Fluid Statics: Pressure Measurement, Buoyancy, Forces on Submerged Surfaces', 'Fluid Dynamics: Continuity, Euler\'s & Bernoulli\'s Equations, Flow Measurement (Venturimeter, Orifice Meter)', 'Viscous Flow: Reynolds Number, Laminar & Turbulent, Boundary Layer Theory (Blasius Solution)', 'Pipe Flow: Major & Minor Losses, Hardy-Cross Method', 'Turbomachinery: Centrifugal Pumps (Cavitation, Specific Speed), Pelton, Francis & Kaplan Turbines', 'Thermodynamics: Zeroth, First, Second Laws; Enthalpy, Entropy; Reversibility; Exergy', 'Power Cycles: Rankine (Steam), Brayton (Gas Turbine), Otto, Diesel, Dual Cycles', 'Refrigeration: Vapour Compression, COP; Psychrometrics', 'Heat Transfer: Conduction (Fourier Law, Fins), Convection (Natural & Forced — Nu, Re, Pr), Radiation (Stefan-Boltzmann, View Factors), Heat Exchangers (LMTD, NTU Methods)']
      },
      'Materials, Manufacturing & Industrial Engineering': {
        topics: ['Engineering Materials: Crystal Structure, Defects, Phase Diagrams (Fe-C), Heat Treatment (Annealing, Hardening, Tempering)', 'Metal Casting: Sand Casting, Investment Casting, Die Casting, Solidification', 'Forming: Forging, Rolling, Extrusion, Drawing, Sheet Metal (Blanking, Bending)', 'Joining: Welding (Arc, MIG, TIG, Resistance), Brazing, Soldering — Defects & Inspection', 'Machining: Turning, Drilling, Milling, Grinding; Merchant\'s Circle, Tool Life (Taylor\'s Equation)', 'Non-Traditional: EDM, ECM, USM, LBM', 'Metrology: Limits, Fits, Tolerances, Gauges, Surface Finish', 'Computer Integrated Manufacturing: NC/CNC, Group Technology, FMS, Robotics', 'Production Planning: Forecasting, MRP, ERP', 'Operations Research: Linear Programming (Simplex), Transportation, PERT/CPM, Inventory (EOQ)']
      }
    },
    aliasMap: { 'ME': 'GATE_ME', 'Mechanical': 'GATE_ME' },
    defaultSubject: 'Core ME Subject Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_CE: {
    examId: 'GATE_CE',
    displayName: 'GATE Civil Engineering (CE)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core CE Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core CE Subject Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Structural Engineering', 'Geotechnical Engineering', 'Water Resources Engineering', 'Environmental Engineering', 'Transportation Engineering', 'Geomatics Engineering'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Ordinary Differential Equations', 'Partial Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Structural Engineering': {
        topics: ['Engineering Mechanics: Statics, Dynamics, Virtual Work', 'Solid Mechanics: Stress-Strain, Mohr\'s Circle, Torsion, Bending, Shear', 'Structural Analysis: Determinacy, Trusses, Beams, Arches, Cables, Influence Lines, Matrix Methods', 'RCC Design: IS 456, Working Stress & Limit State Design, Beams, Columns, Slabs, Footings', 'Steel Design: IS 800, Tension/Compression Members, Beams, Beam-Columns, Connections', 'Pre-stressed Concrete: Pre-tensioning, Post-tensioning, Losses', 'Construction Materials & Management']
      },
      'Geotechnical Engineering': {
        topics: ['Soil Classification: Grain Size, Atterberg Limits, IS Classification System', 'Soil Properties: Permeability (Darcy\'s Law), Compaction (Proctor Test)', 'Seepage: Flow Nets, Phreatic Line', 'Consolidation & Settlement: Terzaghi\'s Theory, Primary, Secondary', 'Shear Strength: Mohr-Coulomb, Lab Tests (Triaxial, Direct Shear)', 'Earth Pressure: Rankine & Coulomb Theories, Retaining Walls', 'Bearing Capacity: Terzaghi, Hansen, Meyerhof Theories; Pile Foundations', 'Slope Stability: Bishop, Swedish Circle']
      },
      'Water Resources Engineering': {
        topics: ['Fluid Mechanics: Properties, Statics, Kinematics, Dynamics, Bernoulli', 'Open Channel Flow: Manning\'s Equation, Critical Flow, Hydraulic Jump', 'Pipe Flow: Darcy-Weisbach, Minor Losses, Pipe Networks', 'Hydrology: Precipitation, Runoff, Unit Hydrograph, Flood Frequency, Groundwater', 'Irrigation Engineering: Water Requirements, Canal Design, Weirs, Dams, Spillways']
      },
      'Environmental Engineering': {
        topics: ['Water Supply: Quality Parameters, Treatment (Coagulation, Flocculation, Sedimentation, Filtration, Disinfection), Distribution System Design', 'Wastewater: Collection Systems, Characteristics (BOD, COD), Treatment (Primary, Secondary, Tertiary)', 'Solid Waste Management: Types, Collection, Disposal (Sanitary Landfill, Composting, Incineration)', 'Air Pollution: Sources, Standards, Control (ESP, Bag Filter, Scrubbers)', 'Noise Pollution & Environmental Impact Assessment']
      },
      'Transportation Engineering': {
        topics: ['Highway Engineering: Geometric Design, Sight Distance, Horizontal & Vertical Curves, IRC Standards', 'Pavement Design: Flexible (CBR Method), Rigid Pavement, Overlay Design', 'Traffic Engineering: Speed-Flow-Density, Signalization, Level of Service', 'Railway Engineering: Track Components, Gauges, Curves, Creep', 'Airport & Harbour Engineering: Runway Design, Docks & Harbours Basics']
      },
      'Geomatics Engineering': {
        topics: ['Surveying: Chain, Compass, Plane Table, Theodolite, Levelling', 'Error Theory & Adjustment of Observations', 'Remote Sensing & GIS: Satellite Imagery, GPS Basics, GIS Applications']
      }
    },
    aliasMap: { 'CE': 'GATE_CE', 'Civil': 'GATE_CE' },
    defaultSubject: 'Core CE Subject Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_CH: {
    examId: 'GATE_CH',
    displayName: 'GATE Chemical Engineering (CH)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core CH Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Chemical Engineering Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Process Calculations', 'Thermodynamics', 'Chemical Reaction Engineering', 'Fluid Mechanics', 'Heat Transfer', 'Mass Transfer', 'Instrumentation & Process Control', 'Plant Design & Economics', 'Chemical Technology'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Probability & Statistics', 'Numerical Methods'] },
      'Process Calculations': { topics: ['Material & Energy Balances: Steady-State & Unsteady-State; Recycle, Bypass, Purge', 'Degree of Freedom Analysis', 'Combustion Calculations', 'Psychrometrics & Humidity'] },
      'Thermodynamics': { topics: ['First & Second Laws; PvT Relationships, Equations of State (van der Waals, Peng-Robinson)', 'Properties of Pure Substances; Mixtures; Fugacity & Activity Coefficients', 'Phase Equilibria: VLE, LLE, VLLE — Raoult\'s & Henry\'s Laws; Margules, van Laar, Wilson Equations', 'Chemical Reaction Equilibria: Gibbs Free Energy, Equilibrium Constant', 'Refrigeration & Heat Pump Cycles'] },
      'Chemical Reaction Engineering': { topics: ['Kinetics: Rate Laws, Arrhenius Equation, Complex Reactions', 'Ideal Reactors: CSTR, PFR, Batch — Design Equations', 'Non-Ideal Flow: RTD, Compartment Models, Dispersion Model', 'Heterogeneous Catalysis: External & Internal Diffusion, Effectiveness Factor', 'Non-Isothermal Reactor Design: Heat Effects, Multiple Steady States, Stability'] },
      'Fluid Mechanics': { topics: ['Fluid Statics & Manometry', 'Continuity, Bernoulli & Momentum Equations', 'Flow in Pipes: Hagen-Poiseuille, Darcy-Weisbach, Moody Chart, Minor Losses', 'Pumps & Compressors: Centrifugal Pump, NPSH; Compressor Types', 'Flow Measurement: Orifice, Venturimeter, Rotameter', 'Non-Newtonian Fluids: Power Law, Bingham Plastic', 'Packed Beds & Fluidization: Ergun Equation, Minimum Fluidization Velocity'] },
      'Heat Transfer': { topics: ['Conduction: Fourier\'s Law, 1D Steady-State, Fins, Transient (Lumped, Heisler Charts)', 'Convection: Natural & Forced; Dimensional Analysis; Dittus-Boelter; Log Mean Temperature Difference', 'Radiation: Stefan-Boltzmann, View Factors, Kirchhoff\'s Law', 'Heat Exchangers: LMTD & NTU-Effectiveness Methods, Fouling', 'Evaporation: Single & Multiple Effect Evaporators'] },
      'Mass Transfer': { topics: ['Diffusion: Fick\'s Law, Molecular Diffusion in Gases & Liquids', 'Mass Transfer Coefficients: Film Theory, Penetration Theory, Surface Renewal', 'Gas Absorption: Absorption Factor, Operating Lines, Kremers-Brown Equations', 'Distillation: Flash Vaporization, McCabe-Thiele, Ponchon-Savarit, Azeotropes', 'Liquid-Liquid Extraction: Distribution Coefficient, Kremser Equation', 'Leaching, Crystallization, Drying & Humidification', 'Membrane Separations: Reverse Osmosis, Ultrafiltration, Dialysis'] },
      'Instrumentation & Process Control': { topics: ['Measurement of Process Variables: Temperature, Pressure, Flow, Level', 'Control Loop Elements: Transducers, Transmitters, Controllers, Control Valves', 'PID Control: Tuning Methods (Ziegler-Nichols)', 'Block Diagram Algebra, Transfer Functions', 'Frequency Response Analysis: Bode Plot, Nyquist Stability', 'Cascade, Feed-Forward, Ratio Control'] },
      'Plant Design & Economics': { topics: ['Process Flow Diagrams (PFD) & P&ID', 'Equipment Sizing: Heat Exchangers, Distillation Columns, Reactors, Vessels', 'Cost Estimation: Fixed Capital, Working Capital, Profitability Analysis (NPV, IRR)', 'Safety & Hazard Analysis: HAZOP, FTA'] },
      'Chemical Technology': { topics: ['Inorganic Chemicals: Sulfuric Acid (Contact Process), Soda Ash (Solvay Process), Ammonia (Haber Process), Nitric Acid', 'Organic Chemicals: Ethylene, Propylene, Vinyl Chloride, Polyethylene, PVC Production', 'Petroleum Refining: Distillation, Cracking, Reforming, Hydrotreatment', 'Biochemical Technology: Fermentation, Bioreactors, Downstream Processing', 'Polymer Technology: Types, Polymerization Processes, Properties'] }
    },
    aliasMap: { 'CH': 'GATE_CH', 'Chemical': 'GATE_CH' },
    defaultSubject: 'Core Chemical Engineering Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_IN: {
    examId: 'GATE_IN',
    displayName: 'GATE Instrumentation Engineering (IN)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core IN Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core IN Subject Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Electrical Circuits', 'Signals & Systems', 'Control Systems', 'Analog Electronics', 'Digital Electronics', 'Measurements', 'Sensors & Transducers', 'Communications & Industrial Instrumentation'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Probability & Statistics', 'Numerical Methods'] },
      'Electrical Circuits': { topics: ['KVL, KCL, Mesh, Nodal Analysis', 'Thevenin, Norton, Superposition, Maximum Power Transfer', 'AC Analysis, Phasors, Resonance', 'Two-Port Networks', 'Transient Analysis'] },
      'Signals & Systems': { topics: ['LTI Systems, Convolution', 'Fourier, Laplace & Z-Transform', 'Sampling & Reconstruction', 'Filtering'] },
      'Control Systems': { topics: ['Transfer Functions, Block Diagrams, Signal Flow Graphs', 'Time Domain Analysis: Step, Ramp, Impulse Response', 'Stability: Routh, Root Locus', 'Frequency Response: Bode, Nyquist, Gain-Phase Margins', 'PID Controllers, Compensators', 'State-Space Analysis'] },
      'Analog Electronics': { topics: ['Op-Amp Applications: Instrumentation Amplifier, Precision Rectifier, V-to-I Converter', 'Comparators, Schmitt Trigger, Log & Antilog Amplifiers', 'Oscillators: RC Phase Shift, Wien Bridge, Colpitts', 'Power Supplies: Linear & Switching Regulators', 'Signal Conditioning Circuits'] },
      'Digital Electronics': { topics: ['Boolean Algebra, Combinational Circuits', 'Flip-Flops, Counters, Registers, Finite State Machines', 'ADC & DAC: Types, Resolution, Accuracy', 'Microcontrollers & Embedded Systems Basics', 'Digital Communication Interfaces: I2C, SPI, UART'] },
      'Measurements': { topics: ['Static & Dynamic Characteristics of Instruments', 'Error Analysis: Accuracy, Precision, Sensitivity, Resolution', 'Bridges: Wheatstone, Maxwell, Hay, Schering — AC & DC', 'Oscilloscopes: Analog & Digital; Signal Analyzers', 'Power & Energy Measurement', 'Q-Meter, LCR Meter'] },
      'Sensors & Transducers': { topics: ['Resistive: Strain Gauges, RTDs, Potentiometers', 'Capacitive & Inductive: LVDT, Capacitive Displacement', 'Optical: Photodiodes, Phototransistors, Fiber Optic Sensors', 'Thermal: Thermocouples, Thermistors (NTC/PTC)', 'Pressure: Piezoresistive, Piezoelectric, Capacitive Pressure Sensors', 'Flow: Ultrasonic, Magnetic, Coriolis', 'Level Sensing: Ultrasonic, Radar, Float', 'Smart Sensors & MEMS'] },
      'Communications & Industrial Instrumentation': { topics: ['Basics of Communication: AM, FM, Digital Modulation', 'Multiplexing: TDM, FDM', 'Industrial Protocols: 4-20mA, HART, Foundation Fieldbus, PROFIBUS, OPC', 'SCADA & DCS: Architecture, PLC Programming (Ladder Logic)', 'Telemetry & Distributed Control', 'Safety Instrumented Systems (SIS), SIL'] }
    },
    aliasMap: { 'IN': 'GATE_IN', 'Instrumentation': 'GATE_IN' },
    defaultSubject: 'Core IN Subject Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_BT: {
    examId: 'GATE_BT',
    displayName: 'GATE Biotechnology (BT)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core BT Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Biotechnology Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Microbiology', 'Biochemistry', 'Molecular Biology & Genetics', 'Cell Biology', 'Bioprocess Engineering', 'Plant & Animal Biotechnology', 'Immunology', 'Recombinant DNA Technology & Bioinformatics'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Microbiology': { topics: ['Historical Milestones in Microbiology', 'Prokaryotic & Eukaryotic Cell Structure', 'Bacteria: Morphology, Gram Staining, Growth Kinetics, Sterilization', 'Viruses: Structure, Replication, Bacteriophages', 'Fungi, Algae & Protozoa: Characteristics & Applications', 'Microbial Metabolism: Aerobic & Anaerobic Pathways', 'Industrial Microbiology'] },
      'Biochemistry': { topics: ['Biomolecules: Amino Acids, Proteins, Carbohydrates, Lipids, Nucleic Acids', 'Enzyme Kinetics: Michaelis-Menten, Lineweaver-Burk, Inhibition Types', 'Metabolism: Glycolysis, Krebs Cycle, Electron Transport Chain, Oxidative Phosphorylation', 'Gluconeogenesis, Fatty Acid Synthesis & β-Oxidation', 'Amino Acid Catabolism & Urea Cycle'] },
      'Molecular Biology & Genetics': { topics: ['DNA Structure & Replication (Prokaryotic & Eukaryotic)', 'Transcription: RNA Types, Promoters, Termination, Post-Transcriptional Processing', 'Translation: Genetic Code, Ribosomes, Initiation-Elongation-Termination, Post-Translational Modifications', 'Gene Expression: Operon Model (Lac, Trp), Eukaryotic Gene Regulation', 'Mutation: Types, Mutagens, DNA Repair Mechanisms', 'Mendelian Genetics, Linkage, Crossing Over, Recombination', 'Population Genetics: Hardy-Weinberg Equilibrium'] },
      'Cell Biology': { topics: ['Cell Organelles: Structure & Functions', 'Cell Cycle: G1, S, G2, M Phases; Checkpoints; Cyclins & CDKs', 'Cell Signaling: Receptor Types, Second Messengers (cAMP, IP3, DAG)', 'Apoptosis: Intrinsic & Extrinsic Pathways', 'Cytoskeleton: Actin, Tubulin, Intermediate Filaments', 'Cell Adhesion & Extracellular Matrix'] },
      'Bioprocess Engineering': { topics: ['Bioreactor Types: Batch, Fed-Batch, Continuous (CSTR, Plug Flow)', 'Sterilization: Thermal (D-value, Z-value), Filter Sterilization', 'Downstream Processing: Centrifugation, Filtration, Chromatography (Ion Exchange, Affinity, Size Exclusion)', 'Mass Transfer in Bioreactors: kLa, Oxygen Transfer Rate', 'Scale-Up Principles', 'Immobilization Techniques: Entrapment, Crosslinking'] },
      'Plant & Animal Biotechnology': { topics: ['Plant Tissue Culture: Callus, Somatic Embryogenesis, Organogenesis, Protoplast Fusion', 'Transgenic Plants: Agrobacterium-mediated, Biolistics, Selectable Markers', 'Bt Crops, Herbicide-Tolerant Crops', 'Animal Cell Culture: Primary, Secondary, Continuous Cell Lines; Bioreactors for Mammalian Cells', 'Hybridoma Technology & Monoclonal Antibodies', 'Cloning & Transgenics in Animals: Nuclear Transfer, Knockout Models'] },
      'Immunology': { topics: ['Innate & Adaptive Immunity', 'Antigens & Antibodies: Structure, Classes (IgG, IgM, IgA, IgE, IgD), Generation of Diversity', 'MHC: Class I & II, Antigen Presentation', 'T & B Cell Activation, Tolerance, Memory', 'Complement System: Classical & Alternative Pathways', 'Hypersensitivity Reactions: Type I-IV', 'Vaccines: Types, Adjuvants, Production'] },
      'Recombinant DNA Technology & Bioinformatics': { topics: ['Restriction Enzymes, Ligases, Polymerases, Reverse Transcriptase', 'Cloning Vectors: Plasmids, Phages (λ, M13), Cosmids, BAC, YAC', 'PCR: Standard, RT-PCR, qPCR, Digital PCR, Nested PCR', 'DNA Sequencing: Sanger, Next-Generation Sequencing (NGS)', 'CRISPR-Cas9: Mechanism, Guide RNA, Applications', 'Gene Libraries: cDNA & Genomic Libraries, Screening Methods', 'Bioinformatics: BLAST, Sequence Alignment, Databases (NCBI, UniProt, PDB), Phylogenetic Analysis'] }
    },
    aliasMap: { 'BT': 'GATE_BT', 'Biotech': 'GATE_BT' },
    defaultSubject: 'Core Biotechnology Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_AE: {
    examId: 'GATE_AE',
    displayName: 'GATE Aerospace Engineering (AE)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core AE Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Aerospace Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Flight Mechanics', 'Aerodynamics', 'Structures', 'Space Dynamics', 'Propulsion'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Flight Mechanics': { topics: ['Basics of Atmosphere: ISA, Pressure Altitude, Density Altitude', 'Classification of Aircrafts & Static Stability: Longitudinal, Directional, Lateral', 'Dynamic Stability & Control', 'Aircraft Performance: Lift, Drag, Power, Level Flight, Climbing, Gliding, Range, Endurance, V-n Diagrams'] },
      'Aerodynamics': { topics: ['Basic Fluid Mechanics: Conservation Equations (Continuity, Momentum, Energy)', 'Potential Flow: Uniform Flow, Source, Sink, Doublet, Vortex, Flow over Cylinder, Kutta-Joukowski', 'Thin Airfoil Theory, Lifting Line Theory', 'Boundary Layer Theory: Laminar, Turbulent, Separation', 'Compressible Flow: Isentropic, Normal Shock, Oblique Shock, Expansion Waves (Prandtl-Meyer)', 'Transonic & Supersonic Flow Characteristics'] },
      'Structures': { topics: ['Stress & Strain, Mohr\'s Circle, Principal Stresses', 'Thin-Walled Pressure Vessels', 'Bending & Shear of Beams, Torsion', 'Columns & Buckling: Euler\'s Formula', 'Vibration of Beams: Natural Frequencies', 'Aeroelasticity: Divergence, Flutter, Control Reversal', 'Fatigue & Fracture Mechanics'] },
      'Space Dynamics': { topics: ['Central Force Motion, Kepler\'s Laws, Orbital Mechanics', 'Orbit Maneuvers: Hohmann Transfer, Plane Changes', 'Re-entry & Attitude Dynamics Basics'] },
      'Propulsion': { topics: ['Thermodynamics of Jet Propulsion: Ideal Turbojet, Turbofan, Turboprop Cycles', 'Reciprocating Engines: Fundamentals & Performance', 'Rocket Propulsion: Chemical Rockets (Solid, Liquid, Hybrid), Thrust Equation, Specific Impulse, Staging', 'Combustion Chambers & Nozzles: De Laval, Supersonic Nozzles', 'Turbomachinery: Compressors & Turbines — Performance Maps'] }
    },
    aliasMap: { 'AE': 'GATE_AE', 'Aerospace': 'GATE_AE' },
    defaultSubject: 'Core Aerospace Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_PI: {
    examId: 'GATE_PI',
    displayName: 'GATE Production & Industrial Engineering (PI)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core PI Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core PI Subject Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Engineering Materials', 'Applied Mechanics', 'Manufacturing', 'Quality & Reliability', 'Industrial Engineering', 'Operations Research'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Engineering Materials': { topics: ['Crystal Structure & Defects', 'Iron-Carbon Phase Diagram, TTT & CCT Diagrams', 'Heat Treatment: Annealing, Normalizing, Hardening, Tempering, Carburizing', 'Mechanical Properties: Tensile, Fatigue, Creep, Hardness', 'Non-Ferrous Alloys, Polymers, Ceramics, Composites'] },
      'Applied Mechanics': { topics: ['Free Body Diagrams, Equilibrium, Friction', 'Stress-Strain, Mohr\'s Circle, Shear Force & Bending Moment', 'Deflection of Beams, Torsion of Shafts', 'Theories of Failure: Maximum Shear Stress, von Mises'] },
      'Manufacturing': { topics: ['Casting: Sand Casting, Die Casting, Investment Casting, Centrifugal Casting — Defects & Inspection', 'Metal Forming: Rolling, Forging, Extrusion, Drawing, Sheet Metal (Blanking, Bending, Deep Drawing)', 'Welding: Arc (SMAW, GMAW, GTAW), Resistance, Laser; Defects & Inspection', 'Machining: Turning, Milling, Drilling, Grinding; Merchant\'s Circle, Tool Life (Taylor Equation); Surface Finish', 'Non-Traditional: EDM, ECM, USM, LBM, WJM', 'Powder Metallurgy, Rapid Prototyping (Additive Manufacturing)', 'Metrology: Tolerances, Gauge Design, CMM', 'CNC: Programming, Interpolation, Part Programs'] },
      'Quality & Reliability': { topics: ['SPC: Control Charts (X-bar, R, p, c, u), Process Capability Indices (Cp, Cpk)', 'Acceptance Sampling: OC Curve, AQL, LTPD', 'TQM, Six Sigma, Lean Manufacturing, DMAIC', 'Reliability: MTTF, MTBF, Failure Rate (Bathtub Curve), Series/Parallel Systems', 'FMEA, Taguchi Methods, DOE (Factorial Design)'] },
      'Industrial Engineering': { topics: ['Work Study: Method Study, Time Study (Stopwatch), Work Sampling, MTM', 'Ergonomics: Workplace Design, Human Factors, Display & Controls', 'Plant Layout: Types (Process, Product, Fixed Position), Cellular Manufacturing', 'Material Handling & Facility Location', 'Production Planning & Control: Forecasting, Aggregate Planning, MRP, ERP, JIT, Kanban', 'Project Management: CPM/PERT, Crashing, Resource Leveling', 'Supply Chain Management: Logistics, VMI'] },
      'Operations Research': { topics: ['Linear Programming: Graphical, Simplex Method, Duality, Sensitivity Analysis', 'Integer Programming, Goal Programming', 'Transportation & Assignment Problems', 'Network Models: Shortest Path, Minimum Spanning Tree, Max Flow', 'Queuing Theory: M/M/1, M/M/s Models', 'Inventory Management: EOQ, POQ, Price Break Models, Safety Stock', 'Decision Analysis: Decision Trees, Simulation (Monte Carlo)'] }
    },
    aliasMap: { 'PI': 'GATE_PI', 'Production': 'GATE_PI' },
    defaultSubject: 'Core PI Subject Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_MA: {
    examId: 'GATE_MA',
    displayName: 'GATE Mathematics (MA)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA)', 'Stage 2 (Core Mathematics Paper)'],
    papers: ['General Aptitude', 'Core Mathematics Paper'],
    subjects: ['General Aptitude', 'Calculus', 'Linear Algebra', 'Real Analysis', 'Complex Analysis', 'Algebra', 'Functional Analysis', 'Numerical Analysis', 'Ordinary Differential Equations', 'Partial Differential Equations', 'Topology', 'Probability & Statistics', 'Linear Programming'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Calculus': { topics: ['Sequences & Series of Real Numbers: Convergence, Absolute Convergence', 'Functions of Two Variables: Limit, Continuity, Partial Derivatives, Total Differential', 'Multiple Integrals: Double, Triple, Change of Variables', 'Vector Calculus: Gradient, Divergence, Curl; Green\'s, Stokes\', Gauss\' Theorems', 'Line & Surface Integrals'] },
      'Linear Algebra': { topics: ['Finite-Dimensional Vector Spaces over Real & Complex Fields', 'Linear Transformations, Rank-Nullity Theorem, Matrix Representation', 'Eigenvalues & Eigenvectors, Cayley-Hamilton Theorem', 'Inner Product Spaces: Gram-Schmidt, Orthonormal Bases', 'Bilinear Forms, Quadratic Forms, Symmetric & Skew-Symmetric Matrices', 'Jordan Canonical Form'] },
      'Real Analysis': { topics: ['Real Number System: Archimedean Property, Completeness', 'Sequences & Series: Cauchy Criterion, Tests for Convergence', 'Functions of Real Variable: Continuity, Uniform Continuity, Differentiability', 'Riemann Integration: Definition, Properties, Fundamental Theorem of Calculus', 'Sequences & Series of Functions: Uniform Convergence, Term-by-Term Integration & Differentiation', 'Metric Spaces: Open & Closed Sets, Compactness, Connectedness'] },
      'Complex Analysis': { topics: ['Analytic Functions: Cauchy-Riemann Equations, Harmonic Functions', 'Complex Integration: Cauchy\'s Integral Theorem & Formula', 'Taylor & Laurent Series, Singularities & Residues', 'Residue Theorem & Applications: Contour Integration', 'Möbius Transformations, Argument Principle'] },
      'Algebra': { topics: ['Groups: Subgroups, Normal Subgroups, Quotient Groups, Isomorphism Theorems, Sylow Theorems', 'Rings: Ideals, Quotient Rings, Integral Domains, UFD, PID, Euclidean Domain', 'Polynomial Rings, Gauss Lemma, Irreducibility', 'Fields: Field Extensions, Algebraic Extensions, Finite Fields', 'Galois Theory Basics'] },
      'Functional Analysis': { topics: ['Normed Linear Spaces, Banach Spaces', 'Bounded Linear Operators, Dual Spaces', 'Hahn-Banach Theorem, Open Mapping Theorem, Closed Graph Theorem', 'Hilbert Spaces: Inner Product, Projection Theorem, Riesz Representation'] },
      'Numerical Analysis': { topics: ['Floating-Point Representation & Errors', 'Root Finding: Bisection, Newton-Raphson, Fixed-Point Iteration', 'Interpolation: Lagrange, Newton\'s Divided Difference, Splines', 'Numerical Integration: Trapezoidal, Simpson\'s Rules, Gaussian Quadrature', 'Numerical ODE: Euler, Runge-Kutta (RK4), Predictor-Corrector Methods', 'Numerical Linear Algebra: Gaussian Elimination, LU, Cholesky, Iterative Methods (Jacobi, Gauss-Seidel)'] },
      'Ordinary Differential Equations': { topics: ['First-Order ODEs: Separable, Exact, Integrating Factor', 'Higher-Order Linear ODEs with Constant Coefficients', 'Method of Undetermined Coefficients & Variation of Parameters', 'Systems of ODEs, Phase Plane Analysis', 'Boundary Value Problems: Sturm-Liouville Theory', 'Power Series Solutions (Frobenius Method)', 'Laplace Transforms & Applications'] },
      'Partial Differential Equations': { topics: ['Classification: Elliptic, Parabolic, Hyperbolic', 'Method of Characteristics', 'Separation of Variables', 'Wave Equation, Heat Equation, Laplace\'s Equation', 'Fourier Series & Fourier Transform Methods', 'Green\'s Functions'] },
      'Topology': { topics: ['Topological Spaces: Open Sets, Basis, Sub-basis', 'Continuous Functions, Homeomorphisms', 'Compactness: Heine-Borel, Tychonoff\'s Theorem', 'Connectedness, Path-Connectedness', 'Metric Topology', 'Separation Axioms: T0, T1, T2 (Hausdorff), T3, T4'] },
      'Probability & Statistics': { topics: ['Probability Spaces, Conditional Probability, Bayes\' Theorem', 'Random Variables: Discrete & Continuous; CDF, PDF', 'Standard Distributions: Binomial, Poisson, Normal, Exponential, Uniform, Gamma, Beta', 'Expectation, Variance, Moments, MGF & Characteristic Functions', 'Joint Distributions, Marginal & Conditional Distributions, Independence', 'Convergence Concepts: WLLN, CLT', 'Point Estimation: MLE, Method of Moments, UMVUE, Cramer-Rao Bound', 'Hypothesis Testing: Neyman-Pearson Lemma, UMP Test, Likelihood Ratio Test', 'Regression & Correlation, Analysis of Variance'] },
      'Linear Programming': { topics: ['Formulation & Graphical Method', 'Simplex Method: Big-M, Two-Phase', 'Duality Theory: Dual Simplex Method', 'Sensitivity Analysis', 'Transportation & Assignment Problems', 'Integer Programming: Branch & Bound, Cutting Planes'] }
    },
    aliasMap: { 'MA': 'GATE_MA', 'Mathematics': 'GATE_MA' },
    defaultSubject: 'Core Mathematics Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_PH: {
    examId: 'GATE_PH',
    displayName: 'GATE Physics (PH)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA)', 'Stage 2 (Core Physics Paper)'],
    papers: ['General Aptitude', 'Core Physics Paper'],
    subjects: ['General Aptitude', 'Mathematical Physics', 'Classical Mechanics', 'Electromagnetic Theory', 'Quantum Mechanics', 'Thermodynamics & Statistical Physics', 'Atomic & Molecular Physics', 'Solid State Physics', 'Nuclear & Particle Physics', 'Electronics'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Mathematical Physics': { topics: ['Linear Algebra: Vectors, Matrices, Eigenvalues', 'Complex Analysis: Analytic Functions, Cauchy\'s Theorem, Residues, Contour Integration', 'Differential Equations: ODEs, PDEs (Heat, Wave, Laplace)', 'Special Functions: Legendre, Bessel, Hermite, Laguerre Polynomials', 'Fourier & Laplace Transforms', 'Green\'s Functions', 'Group Theory: Discrete & Continuous Groups, Representations'] },
      'Classical Mechanics': { topics: ['Lagrangian & Hamiltonian Formulations, Hamilton\'s Principle', 'Equations of Motion: Euler-Lagrange, Hamilton\'s Equations', 'Central Force Problem, Kepler\'s Problem', 'Rigid Body Dynamics: Euler Angles, Moments of Inertia', 'Small Oscillations & Normal Modes', 'Special Theory of Relativity: Lorentz Transformation, Relativistic Kinematics & Dynamics', 'Non-Inertial Frames: Coriolis & Centrifugal Forces'] },
      'Electromagnetic Theory': { topics: ['Electrostatics: Gauss\'s Law, Laplace & Poisson Equations, Multipoles', 'Magnetostatics: Biot-Savart, Ampere\'s Law, Vector Potential', 'Faraday\'s Law, Maxwell\'s Equations (Full Set)', 'Electromagnetic Waves: Propagation, Polarization, Reflection, Refraction', 'Waveguides & Transmission Lines', 'Radiation: Lienard-Wiechert Potentials, Electric & Magnetic Dipole Radiation', 'Relativistic Electrodynamics'] },
      'Quantum Mechanics': { topics: ['Wave-Particle Duality, Uncertainty Principle, de Broglie Wavelength', 'Schrödinger Equation: Time-Dependent & Time-Independent', 'Solutions: Infinite/Finite Square Well, Harmonic Oscillator, Hydrogen Atom', 'Operators: Hermitian, Commutators, Dirac Notation (Bra-Ket)', 'Angular Momentum: Orbital & Spin, Clebsch-Gordan Coefficients', 'Perturbation Theory: Time-Independent (First & Second Order), Degenerate', 'Time-Dependent Perturbation Theory: Fermi\'s Golden Rule, Selection Rules', 'Identical Particles: Bosons & Fermions, Symmetrization Principle', 'Relativistic Quantum Mechanics: Klein-Gordon, Dirac Equation'] },
      'Thermodynamics & Statistical Physics': { topics: ['Laws of Thermodynamics, Thermodynamic Potentials', 'Maxwell Relations, Legendre Transformations', 'Phase Transitions: First & Second Order, Clausius-Clapeyron Equation', 'Classical Statistics: Microcanonical, Canonical, Grand-Canonical Ensembles', 'Ideal Gas, Equipartition Theorem, Virial Expansion', 'Quantum Statistics: Fermi-Dirac, Bose-Einstein Distributions', 'Applications: Free Electron Model, Black-Body Radiation (Planck), Bose-Einstein Condensation'] },
      'Atomic & Molecular Physics': { topics: ['Hydrogen Atom: Fine Structure (Spin-Orbit Coupling), Hyperfine Structure, Zeeman & Stark Effects', 'Multi-Electron Atoms: LS & jj Coupling, Hund\'s Rules', 'Spectroscopy: Rotational (Microwave), Vibrational (IR), Electronic (UV-Vis) Spectra', 'Raman Spectroscopy, Selection Rules', 'Lasers: Einstein\'s A & B Coefficients, Population Inversion, Laser Principles'] },
      'Solid State Physics': { topics: ['Crystal Structure: Bravais Lattices, Miller Indices, X-ray Diffraction (Bragg\'s Law)', 'Lattice Vibrations: Phonons, Einstein & Debye Models of Specific Heat', 'Free Electron Theory: Fermi Energy, Density of States, Electronic Heat Capacity', 'Band Theory: Bloch\'s Theorem, Kronig-Penney Model, Energy Bands', 'Semiconductors: Intrinsic & Extrinsic, p-n Junction, Hall Effect', 'Superconductivity: Meissner Effect, Type I & II, London Equations, BCS Theory Basics', 'Magnetism: Dia, Para, Ferro-, Antiferro-, Ferrimagnetism; Weiss Theory, Spin Waves'] },
      'Nuclear & Particle Physics': { topics: ['Nuclear Properties: Size, Shape, Binding Energy, Semi-Empirical Mass Formula', 'Nuclear Forces: Yukawa Potential, Meson Exchange', 'Radioactive Decay: α, β, γ Decay; Law of Radioactive Decay', 'Nuclear Reactions: Q-value, Cross Section, Fission, Fusion, Nuclear Reactors Basics', 'Particle Physics: Standard Model Overview, Quarks, Leptons, Gauge Bosons', 'Conservation Laws: Baryon Number, Lepton Number, Strangeness, Isospin', 'Detectors: Ionization Chamber, Geiger-Müller Counter, Scintillators, Bubble Chamber'] },
      'Electronics': { topics: ['Diodes: Rectifiers, Zener Regulator', 'BJT & FET Amplifiers', 'Op-Amps: Inverting, Non-Inverting, Differentiator, Integrator', 'Feedback & Oscillators', 'Digital Electronics: Logic Gates, Boolean Algebra, Flip-Flops, ADC/DAC', 'Microprocessors Basics'] }
    },
    aliasMap: { 'PH': 'GATE_PH', 'Physics': 'GATE_PH' },
    defaultSubject: 'Core Physics Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_CY: {
    examId: 'GATE_CY',
    displayName: 'GATE Chemistry (CY)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA)', 'Stage 2 (Core Chemistry Paper)'],
    papers: ['General Aptitude', 'Core Chemistry Paper'],
    subjects: ['General Aptitude', 'Physical Chemistry', 'Inorganic Chemistry', 'Organic Chemistry'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Physical Chemistry': {
        topics: ['Atomic Structure: Schrödinger Equation, Hydrogen Atom Wavefunctions, Radial & Angular Distribution', 'Chemical Bonding: Valence Bond, MO Theory, VSEPR, Symmetry & Group Theory', 'Spectroscopy: Microwave (Rotational), IR (Vibrational), Raman, UV-Vis, NMR, ESR, Mass Spectrometry', 'Statistical Thermodynamics: Partition Functions, Boltzmann, Bose-Einstein, Fermi-Dirac Statistics', 'Chemical Thermodynamics: Laws, Free Energy, Chemical Potential, Phase Equilibria (Clausius-Clapeyron)', 'Chemical Kinetics: Rate Laws, Complex Reactions, Reaction Mechanisms, Transition State Theory, Unimolecular Reactions (RRKM)', 'Electrochemistry: Electrolytes, Activity, EMF, Nernst Equation, Electrode Potentials, Galvanic Cells', 'Surface Chemistry: Adsorption (Langmuir, Freundlich), Catalysis, Colloids, Micelles']
      },
      'Inorganic Chemistry': {
        topics: ['Periodic Table: Trends in Properties, Effective Nuclear Charge', 'Chemical Bonding: Ionic, Covalent, Metallic, Hydrogen Bonding; Lattice Energy (Born-Haber Cycle)', 'Main Group Elements: Chemistry of s, p-Block; Hydrides, Halides, Oxides, Oxyacids; Noble Gases', 'Transition Metals: d-Block; Electronic Configuration, Oxidation States, Magnetic Properties; d-d Transitions', 'Coordination Compounds: Nomenclature, Isomerism, Bonding Theories (VBT, CFT, MOT)', 'Organometallic Chemistry: 18-Electron Rule, Metal Carbonyls, Sandwich Compounds, Catalysis (Ziegler-Natta, Wacker)', 'Bioinorganic Chemistry: Role of Metal Ions in Biology (Hemoglobin, Vitamin B12, Nitrogenase)', 'Nuclear Chemistry: Radioactive Decay, Nuclear Reactions, Isotopes & Applications', 'Analytical Chemistry: Gravimetry, Titrimetry, Chromatography (TLC, GC, HPLC), Spectrophotometry']
      },
      'Organic Chemistry': {
        topics: ['Reaction Mechanisms: Arrow Pushing, Nucleophilic & Electrophilic Substitution, Addition, Elimination', 'Stereochemistry: Configuration (R/S, E/Z), Stereoisomers, Chirality, Diastereomers, Conformational Analysis', 'Aromaticity: Hückel Rule, Benzenoid & Non-Benzenoid, Aromatic Reactivity (EAS, NAS)', 'Functional Group Chemistry: Alcohols, Ethers, Epoxides, Aldehydes, Ketones, Carboxylic Acids & Derivatives, Amines', 'Named Reactions: Aldol, Claisen, Diels-Alder, Wittig, Mannich, Robinson Annulation, Grignard, etc.', 'Pericyclic Reactions: Cycloadditions, Electrocyclic, Sigmatropic Rearrangements; Woodward-Hoffmann Rules', 'Carbohydrates: Monosaccharides, Disaccharides, Polysaccharides; Reactions', 'Amino Acids, Peptides & Proteins: Structure & Synthesis', 'Heterocyclic Chemistry: Pyridine, Pyrrole, Furan, Thiophene, Imidazole, Indole; Nucleosides & Nucleotides', 'Organometallic Chemistry (Organic Perspective): Grignard, Organocopper, Olefin Metathesis', 'Photochemistry: Excited States, Norrish Type I & II, Photocycloaddition']
      }
    },
    aliasMap: { 'CY': 'GATE_CY', 'Chemistry': 'GATE_CY' },
    defaultSubject: 'Core Chemistry Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_AG: {
    examId: 'GATE_AG',
    displayName: 'GATE Agricultural Engineering (AG)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core AG Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Agricultural Engineering Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Farm Machinery', 'Farm Power', 'Soil & Water Conservation', 'Irrigation & Drainage', 'Agricultural Processing & Food Engineering', 'Agricultural Structures & Environmental Control', 'Computer & Information Technology in Agriculture'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Farm Machinery': { topics: ['Tractor Systems: Engine, Power Transmission, Hydraulics, PTO', 'Soil Tillage: Plow, Disk, Rotary Tiller — Design & Performance', 'Seeding & Planting Machinery: Seed Drills, Planters — Seed Rate, Metering', 'Crop Harvesting: Combine Harvesters, Threshers — Working Principle & Design', 'Irrigation Machinery: Pumps, Sprinklers, Drip Systems'] },
      'Farm Power': { topics: ['IC Engines: Working Principles, Thermodynamic Cycles (Otto, Diesel), Performance Parameters', 'Fuels & Combustion: Properties of Diesel, Petrol, Bio-fuels', 'Electrical Power in Agriculture: Single-Phase & Three-Phase Motors, Electric Fencing', 'Solar & Wind Energy in Agriculture', 'Biogas: Production, Plants, Utilization'] },
      'Soil & Water Conservation': { topics: ['Soil Erosion: Types, Factors, USLE/RUSLE Equation', 'Soil Conservation Practices: Contour Farming, Strip Cropping, Terracing', 'Watershed Management: Hydrology, SCS Curve Number Method, Runoff Estimation', 'Check Dams, Farm Ponds, Gully Control Structures', 'Rainwater Harvesting Techniques'] },
      'Irrigation & Drainage': { topics: ['Water Requirements of Crops: Evapotranspiration (Penman-Monteith)', 'Soil-Water-Plant Relationships: Wilting Point, Field Capacity, Available Water', 'Irrigation Methods: Surface (Border, Basin, Furrow), Sprinkler, Drip — Design & Efficiency', 'Canal Design: Lacey\'s & Kennedy\'s Theory', 'Groundwater: Aquifer Types, Darcy\'s Law, Well Hydraulics (Dupuit\'s Formula)', 'Drainage: Surface & Sub-surface Drainage — Hooghoudt\'s Equation'] },
      'Agricultural Processing & Food Engineering': { topics: ['Pre & Post-Harvest Operations: Harvesting, Threshing, Cleaning, Grading', 'Drying: Psychrometrics, Thin-Layer Drying Models, Types of Dryers (Tray, Fluidized Bed, Spray)', 'Storage: Hermetic, Silo, Cold Storage — Principles & Design', 'Milling of Grains: Wheat Flour Milling, Rice Milling — Flow Charts', 'Oil Extraction: Expeller & Solvent Extraction', 'Food Preservation: Canning, Irradiation, MAP, Freeze Drying', 'Refrigeration & Cold Chain: Vapour Compression Cycle, Cold Storage Design'] },
      'Agricultural Structures & Environmental Control': { topics: ['Farmstead Planning & Layout', 'Livestock Housing: Thermal Comfort, Ventilation Requirements', 'Greenhouse Technology: Types, Covering Materials, Climate Control, CEA', 'Controlled Atmosphere Storage', 'Biogas Plant Design', 'Waste Management: Composting, Manure Management'] }
    },
    aliasMap: { 'AG': 'GATE_AG', 'Agricultural': 'GATE_AG' },
    defaultSubject: 'Core Agricultural Engineering Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_MN: {
    examId: 'GATE_MN',
    displayName: 'GATE Mining Engineering (MN)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core MN Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Mining Engineering Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Geology', 'Mine Development & Surveying', 'Geomechanics & Ground Control', 'Mining Methods & Machinery', 'Mine Environment & Ventilation', 'Mine Safety & Legislation', 'Mineral Economics'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Geology': { topics: ['Mineralogy: Physical & Optical Properties, Identification', 'Rock Types: Igneous, Sedimentary, Metamorphic — Formation & Properties', 'Structural Geology: Folds, Faults, Joints, Unconformities', 'Stratigraphy: Indian Stratigraphic Column, Geological Time Scale', 'Economic Geology: Coal, Metallic & Non-Metallic Minerals — Genesis & Occurrence'] },
      'Mine Development & Surveying': { topics: ['Prospecting & Exploration: Geophysical & Geochemical Methods, Drilling', 'Development & Preparation: Shafts, Adits, Drifts, Raises', 'Mine Surveying: Compass, Theodolite, EDM; Mine Plans & Sections; GPS in Mining', 'Rock Mechanics Applications: Stress Distribution, Pillar Design'] },
      'Mining Methods & Machinery': { topics: ['Surface Mining: Open Pit, Quarrying, Opencast; Stripping Ratios, Bench Design', 'Underground Mining: Room & Pillar, Longwall, Sub-Level Caving, Block Caving, Cut & Fill', 'Drilling & Blasting: Types of Drills, Explosive Properties, Blast Design, Delay Blasting', 'Excavation Machinery: Shovels, Draglines, Scrapers, Continuous Miners, Tunnel Boring Machines', 'Loading & Transport: LHD, Dumpers, Conveyors, Rail Haulage, Shaft Hoisting', 'Mineral Processing Basics: Crushing, Grinding, Classification, Gravity Separation, Flotation'] },
      'Mine Environment & Ventilation': { topics: ['Mine Gases: Properties, Detection, Control (Methane, CO, CO2, H2S)', 'Mine Ventilation: Natural, Mechanical — Fans, Airways, Pressure Surveys', 'Dust Control: Sampling Methods, TLV, Water Infusion, Scrubbers', 'Mine Lighting & Noise Control', 'Mine Climate: Heat Sources, Psychrometrics, Refrigeration in Deep Mines', 'Mine Drainage: Pumps, Dewatering Systems'] },
      'Mine Safety & Legislation': { topics: ['Mine Disasters: Historical & Preventive Measures', 'Accident Analysis: Fault Tree, Event Tree', 'Indian Mining Legislation: Mines Act 1952, Metalliferous Mines Regulations, Coal Mines Regulations', 'DGMS Circulars & Mandatory Safety Standards', 'Emergency Preparedness & Mine Rescue'] },
      'Mineral Economics': { topics: ['Mineral Resources Classification (McKelvey Box)', 'Project Appraisal: NPV, IRR, Payback Period', 'Break-Even Analysis, Sensitivity Analysis', 'Environmental Impact Assessment in Mining', 'Sustainable Mining Practices'] }
    },
    aliasMap: { 'MN': 'GATE_MN', 'Mining': 'GATE_MN' },
    defaultSubject: 'Core Mining Engineering Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_MT: {
    examId: 'GATE_MT',
    displayName: 'GATE Metallurgical Engineering (MT)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core MT Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Metallurgical Engineering Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Thermodynamics & Rate Processes', 'Extractive Metallurgy', 'Physical Metallurgy', 'Mechanical Metallurgy', 'Manufacturing Processes'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Thermodynamics & Rate Processes': { topics: ['Laws of Thermodynamics applied to Metallurgical Systems', 'Solution Thermodynamics: Activity, Free Energy of Mixing, Raoultian & Henrian Standards', 'Phase Equilibria: Gibbs Phase Rule, Unary, Binary & Ternary Diagrams', 'Chemical Kinetics: Rate Laws, Activation Energy, Diffusion — Fick\'s Laws', 'Mass Transfer: Convection, Interphase Mass Transfer', 'Heat Transfer: Conduction, Convection, Radiation in Metallurgical Processes', 'Fluid Flow: Navier-Stokes, Reynolds Number, Flow in Metallurgical Systems'] },
      'Extractive Metallurgy': { topics: ['Iron & Steel Making: Blast Furnace, DRI (Midrex, HYL), BOF, Electric Arc Furnace, Secondary Steelmaking (Ladle Metallurgy, RH Degassing)', 'Non-Ferrous Extraction: Copper (Pyrometallurgy, Hydrometallurgy — SX-EW), Aluminium (Bayer Process, Hall-Héroult Cell), Zinc, Lead', 'Ore Beneficiation: Crushing, Grinding, Gravity, Flotation, Magnetic Separation', 'Hydrometallurgy: Leaching (Percolation, Agitation), SX, Electrowinning', 'Pyrometallurgy: Roasting, Smelting, Converting, Refining, Slag Chemistry', 'Environmental Issues in Metallurgical Industries'] },
      'Physical Metallurgy': { topics: ['Crystal Structures: FCC, BCC, HCP; X-ray Diffraction', 'Defects: Point, Line (Dislocations), Planar, Volume', 'Phase Transformations: Nucleation (Classical Theory), Growth, TTT & CCT Diagrams', 'Heat Treatment of Steels: Annealing, Normalizing, Quenching, Tempering, Case Hardening', 'Diffusion: Kirkendall Effect, Darken Equation', 'Precipitation Hardening (Age Hardening): Al-Cu System', 'Recrystallization, Grain Growth, Recovery', 'Magnetic & Electrical Properties', 'Superconductivity & Shape Memory Alloys Basics'] },
      'Mechanical Metallurgy': { topics: ['Stress-Strain: Elastic, Plastic; True Stress-Strain Curves', 'Yield Criteria: von Mises & Tresca', 'Strengthening Mechanisms: Work Hardening, Solid Solution, Precipitation, Grain Boundary', 'Fracture: Ductile & Brittle; Griffith Theory, Fracture Toughness (KIC)', 'Fatigue: S-N Curves, Miner\'s Rule, Paris Law', 'Creep: Mechanisms, Activation Energy, Larson-Miller Parameter', 'Testing Methods: Tensile, Impact (Charpy/Izod), Hardness (Rockwell, Vickers, Brinell), Fatigue, Creep'] },
      'Manufacturing Processes': { topics: ['Casting: Sand, Die, Investment, Continuous Casting — Solidification, Defects', 'Metal Forming: Rolling, Forging, Extrusion, Drawing, Sheet Metal', 'Welding Metallurgy: HAZ, Weld Microstructure, Defects & Inspection', 'Powder Metallurgy: Powder Production, Compaction, Sintering', 'Surface Engineering: Electroplating, PVD, CVD, Thermal Spray, Nitriding'] }
    },
    aliasMap: { 'MT': 'GATE_MT', 'Metallurgy': 'GATE_MT' },
    defaultSubject: 'Core Metallurgical Engineering Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_PE: {
    examId: 'GATE_PE',
    displayName: 'GATE Petroleum Engineering (PE)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core PE Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Petroleum Engineering Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Petroleum Exploration', 'Oil & Gas Well Drilling', 'Reservoir Engineering', 'Petroleum Production', 'Offshore Drilling & Production', 'Enhanced Oil Recovery', 'Petroleum Refining', 'Health, Safety & Environment'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Petroleum Exploration': { topics: ['Geological Basics: Stratigraphy, Structural Geology, Trap Types (Anticlines, Faults, Stratigraphic)', 'Geophysical Methods: Seismic Surveys (2D & 3D), Gravity, Magnetic Methods', 'Well Logging: SP, Resistivity, Porosity (Neutron, Density), Gamma Ray, Sonic Logs', 'Petroleum Geochemistry: Source Rocks, Kerogen, Maturation, Migration'] },
      'Oil & Gas Well Drilling': { topics: ['Drilling Systems: Rotary, Top Drive, Directional Drilling, MWD/LWD', 'Drill Bit Types: Tricone, PDC — Selection & Performance', 'Drilling Fluids: Functions, Types (WBM, OBM, SBM), Properties, Environmental Considerations', 'Well Control: Kick Detection, Blow-Out Prevention (BOP Stack), Well Kill Methods', 'Casing Design: Collapse, Burst, Tension Loads; Cementing Operations', 'Horizontal & Extended Reach Drilling, Wellbore Stability'] },
      'Reservoir Engineering': { topics: ['Reservoir Rock Properties: Porosity, Permeability (Darcy\'s Law), Capillary Pressure, Wettability', 'Reservoir Fluid Properties: PVT Analysis, Oil, Gas & Water Properties', 'Material Balance Equation: Havlena-Odeh Method; Aquifer Models (Fetkovitch)', 'Well Test Analysis: Pressure Buildup (Horner Plot), Drawdown Analysis, Skin Factor', 'Flow in Porous Media: Darcy\'s, Buckley-Leverett, Mobility Ratio', 'Decline Curve Analysis: Exponential, Hyperbolic, Harmonic'] },
      'Petroleum Production': { topics: ['Inflow Performance Relationship (IPR): Vogel, Fetkovitch Models', 'Tubing Performance, Nodal Analysis', 'Artificial Lift: Beam Pumping (Sucker Rod), Gas Lift, ESP, PCP', 'Surface Facilities: Separators (3-Phase), Gas Processing, Metering', 'Gas Production: Well Deliverability, Wellbore Loading, Liquid Unloading', 'Sand Control: Screens, Gravel Packing, Frac-Pack'] },
      'Offshore Drilling & Production': { topics: ['Offshore Platforms: Fixed, Compliant, Floating (FPSO, Spar, TLP)', 'Subsea Production Systems', 'Riser Systems, Christmas Tree Configurations', 'Offshore Well Control Considerations'] },
      'Enhanced Oil Recovery': { topics: ['Primary, Secondary & Tertiary Recovery', 'Water Flooding: Mobility Ratio, Sweep Efficiency, Pattern Selection', 'Chemical EOR: Surfactant, Polymer, Alkaline-Surfactant-Polymer Flooding', 'Miscible EOR: CO2 Injection, Hydrocarbon Miscible Flooding', 'Thermal EOR: Steam Injection (Cyclic, SAGD, Steam Drive), In-Situ Combustion', 'Microbial EOR'] },
      'Petroleum Refining': { topics: ['Crude Oil Distillation: Atmospheric & Vacuum Distillation', 'Cracking: Catalytic Cracking (FCC), Hydrocracking', 'Reforming, Alkylation, Isomerization', 'Treating: Desulfurization (HDS), Desalting', 'Product Specifications: Petrol, Diesel, Jet Fuel, LPG'] },
      'Health, Safety & Environment': { topics: ['HAZOP Analysis, HAZID, Fault Tree Analysis', 'Risk Assessment & Management', 'Environmental Regulations for Petroleum Industry', 'Spill Contingency Planning', 'Occupational Health in Petroleum Operations'] }
    },
    aliasMap: { 'PE': 'GATE_PE', 'Petroleum': 'GATE_PE' },
    defaultSubject: 'Core Petroleum Engineering Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_ST: {
    examId: 'GATE_ST',
    displayName: 'GATE Statistics (ST)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA)', 'Stage 2 (Core Statistics Paper)'],
    papers: ['General Aptitude', 'Core Statistics Paper'],
    subjects: ['General Aptitude', 'Probability', 'Stochastic Processes', 'Statistical Inference', 'Regression Analysis', 'Multivariate Analysis', 'Design of Experiments', 'Statistical Quality Control', 'Linear Programming'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Probability': { topics: ['Axiomatic Probability, Conditional Probability, Independence', 'Random Variables: Discrete (Bernoulli, Binomial, Poisson, Geometric, Negative Binomial) & Continuous (Uniform, Normal, Exponential, Gamma, Beta, Cauchy, t, F, Chi-squared)', 'Moments, MGF, Characteristic Functions', 'Joint Distributions, Marginal & Conditional Distributions', 'Inequalities: Markov, Chebyshev, Jensen', 'Modes of Convergence: WLLN, SLLN, CLT, Delta Method'] },
      'Stochastic Processes': { topics: ['Markov Chains: Discrete-Time, Classification of States, Stationary Distribution', 'Poisson Process: Properties, Compound, Conditional', 'Continuous-Time Markov Chains: Birth-Death Process', 'Renewal Theory: Renewal Reward Theorem', 'Brownian Motion: Properties, Reflection Principle'] },
      'Statistical Inference': { topics: ['Sufficiency, Completeness, Exponential Family of Distributions', 'Point Estimation: MLE, Method of Moments, UMVUE, Rao-Blackwell & Lehmann-Scheffé Theorems', 'Information Theory: Cramér-Rao Lower Bound, Fisher Information', 'Interval Estimation: Confidence Intervals for Normal, Binomial, Poisson, Large Samples', 'Hypothesis Testing: Neyman-Pearson Lemma, MP Test, UMP Test, Likelihood Ratio Test', 'Non-Parametric Tests: Sign Test, Wilcoxon Signed Rank, Mann-Whitney, Kolmogorov-Smirnov', 'Sequential Analysis: SPRT, Wald\'s Equation'] },
      'Regression Analysis': { topics: ['Simple Linear Regression: Estimation (OLS), Properties, ANOVA for Regression', 'Multiple Linear Regression: Matrix Form, Multicollinearity, Variable Selection (AIC, BIC)', 'Residual Analysis: Leverage, Influence, Cook\'s D', 'Logistic Regression', 'Ridge & Lasso Regression'] },
      'Multivariate Analysis': { topics: ['Multivariate Normal Distribution: Properties, Marginal & Conditional', 'Tests on Mean Vector: Hotelling\'s T2', 'MANOVA', 'Principal Component Analysis (PCA)', 'Factor Analysis', 'Discriminant Analysis', 'Cluster Analysis'] },
      'Design of Experiments': { topics: ['Principles: Replication, Randomization, Local Control', 'CRD, RBD, Latin Square Design', 'Factorial Experiments: 2k Designs, Confounding, Fractional Factorial', 'Response Surface Methodology: CCD, Box-Behnken', 'Balanced Incomplete Block Designs (BIBD)'] },
      'Statistical Quality Control': { topics: ['Control Charts: X-bar, R, s, p, np, c, u Charts; OC Curves; ARL', 'Acceptance Sampling: Single, Double, Sequential Sampling Plans; AQL, LTPD', 'Process Capability: Cp, Cpk, Cpm', 'Reliability: Failure Time Distributions, Hazard Rate, Censored Data, Kaplan-Meier', 'Six Sigma Basics'] },
      'Linear Programming': { topics: ['Formulation, Graphical Method', 'Simplex Method, Big-M, Two-Phase', 'Duality, Complementary Slackness', 'Sensitivity Analysis', 'Transportation & Assignment Problems', 'Game Theory Basics'] }
    },
    aliasMap: { 'ST': 'GATE_ST', 'Statistics': 'GATE_ST' },
    defaultSubject: 'Core Statistics Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_XE: {
    examId: 'GATE_XE',
    displayName: 'GATE Engineering Sciences (XE)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths + Section A)', 'Stage 2 (Any 2 Optional Sections)'],
    papers: ['General Aptitude', 'Engineering Mathematics (Compulsory)', 'Section A: Engineering Mathematics (Compulsory)', 'Section B: Fluid Mechanics', 'Section C: Materials Science', 'Section D: Solid Mechanics', 'Section E: Thermodynamics', 'Section F: Polymer Science & Engineering', 'Section G: Food Technology', 'Section H: Atmospheric & Oceanic Sciences'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Fluid Mechanics', 'Materials Science', 'Solid Mechanics', 'Thermodynamics', 'Polymer Science', 'Food Technology'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra, Calculus, Vector Calculus, Complex Variables, ODEs, PDEs, Probability & Statistics, Numerical Methods'] },
      'Fluid Mechanics': { topics: ['Fluid Properties & Statics', 'Kinematics: Continuity, Stream Function, Potential Flow', 'Dynamics: Bernoulli, Momentum Equation', 'Viscous Flow: Navier-Stokes, Pipe Flow (Hagen-Poiseuille, Moody Chart)', 'Boundary Layer Theory', 'Compressible Flow: Isentropic, Normal Shock', 'Turbomachinery Basics'] },
      'Materials Science': { topics: ['Crystal Structure & Defects: Bravais Lattices, Miller Indices, X-ray Diffraction', 'Phase Diagrams: Unary, Binary (Fe-C System), Lever Rule', 'Phase Transformations: Nucleation, TTT & CCT Diagrams', 'Mechanical Properties: Tensile, Hardness, Fracture, Fatigue, Creep', 'Electronic Properties: Energy Bands, Semiconductors, Superconductors', 'Magnetic & Optical Properties', 'Ceramics & Glasses; Polymers; Composites'] },
      'Solid Mechanics': { topics: ['Stress-Strain: Generalized Hooke\'s Law, Principal Stresses, Mohr\'s Circle', 'Bending, Shear, Torsion of Beams', 'Deflection of Beams: Double Integration, Castigliano\'s Theorem', 'Columns: Euler\'s Formula, Effective Length', 'Energy Methods: Strain Energy, Virtual Work', 'Failure Theories: von Mises, Tresca, Maximum Principal Stress'] },
      'Thermodynamics': { topics: ['First & Second Laws, Thermodynamic Potentials, Maxwell Relations', 'Properties of Pure Substances, Ideal Gases, Mixture of Gases', 'Power Cycles: Rankine, Brayton, Otto, Diesel', 'Refrigeration Cycles: Vapour Compression, Absorption', 'Psychrometrics, Heat & Mass Transfer Basics'] }
    },
    aliasMap: { 'XE': 'GATE_XE', 'Engineering Sciences': 'GATE_XE' },
    defaultSubject: 'Engineering Mathematics',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_XL: {
    examId: 'GATE_XL',
    displayName: 'GATE Life Sciences (XL)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Section H Chemistry)', 'Stage 2 (Any 2 Optional Life Science Sections)'],
    papers: ['General Aptitude', 'Section H: Chemistry (Compulsory)', 'Section I: Biochemistry', 'Section J: Botany', 'Section K: Microbiology', 'Section L: Zoology', 'Section M: Food Technology'],
    subjects: ['General Aptitude', 'Chemistry', 'Biochemistry', 'Botany', 'Microbiology', 'Zoology', 'Food Technology'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Chemistry': { topics: ['Atomic Structure & Periodic Table', 'Chemical Bonding: Ionic, Covalent, Metallic; VBT, MO Theory', 'Thermodynamics: Laws, Free Energy, Equilibrium', 'Chemical Kinetics: Rate Laws, Activation Energy', 'Organic Reaction Mechanisms: SN1, SN2, E1, E2, Addition, Substitution', 'Stereochemistry: Chirality, R/S, E/Z Configuration', 'Spectroscopy Basics: IR, UV-Vis, NMR Identification'] },
      'Biochemistry': { topics: ['Biomolecules: Amino Acids, Proteins (Structure, Folding), Carbohydrates, Lipids, Nucleic Acids', 'Enzyme Kinetics: Michaelis-Menten, Inhibition, Allosteric Regulation', 'Metabolism: Glycolysis, Krebs Cycle, ETC & Oxidative Phosphorylation, Gluconeogenesis, Fatty Acid Synthesis & β-Oxidation, Amino Acid Catabolism', 'DNA Replication, Repair, Transcription, Translation', 'Signal Transduction: Receptors, Second Messengers'] },
      'Botany': { topics: ['Plant Systematics & Taxonomy: Families (Fabaceae, Asteraceae, etc.)', 'Plant Anatomy: Root, Stem, Leaf — Primary & Secondary Growth', 'Plant Physiology: Photosynthesis (Light & Dark Reactions), Respiration, Transpiration, Water Relations, Mineral Nutrition, Phytohormones', 'Plant Reproduction: Alternation of Generations, Flower Structure, Pollination, Fertilization', 'Plant Pathology: Major Diseases & Causative Organisms'] },
      'Microbiology': { topics: ['Microbial Diversity: Bacteria, Archaea, Fungi, Viruses — Classification & Characteristics', 'Microbial Physiology: Growth, Nutrition, Metabolism', 'Microbial Genetics: Transformation, Transduction, Conjugation, Plasmids, Phages', 'Sterilization & Disinfection Methods', 'Industrial Microbiology: Fermentation Products', 'Medical Microbiology Basics: Pathogenesis, Vaccines'] },
      'Zoology': { topics: ['Animal Kingdom Classification: Major Phyla (Porifera to Chordata)', 'Comparative Anatomy: Digestive, Circulatory, Respiratory, Excretory, Nervous, Reproductive Systems', 'Animal Physiology: Endocrinology, Nerve Impulse, Muscle Contraction', 'Developmental Biology: Gametogenesis, Fertilization, Cleavage, Gastrulation, Organogenesis', 'Evolution: Darwin\'s Theory, Natural Selection, Speciation', 'Ecology: Population Dynamics, Community Ecology, Ecosystem'] },
      'Food Technology': { topics: ['Food Chemistry: Water Activity, Carbohydrates, Lipids, Proteins, Pigments, Flavors', 'Food Processing: Preservation Methods, Thermal Processing (F-value, D-value), Freezing, Drying', 'Food Microbiology: Spoilage, Fermented Foods, Pathogens, Food Safety (HACCP)', 'Food Quality & Sensory Evaluation', 'Food Packaging: Materials, Types, Modified Atmosphere Packaging (MAP)', 'Food Regulations & Standards: FSSAI, Codex Alimentarius'] }
    },
    aliasMap: { 'XL': 'GATE_XL', 'Life Sciences': 'GATE_XL' },
    defaultSubject: 'Chemistry',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_EY: {
    examId: 'GATE_EY',
    displayName: 'GATE Ecology & Evolution (EY)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA)', 'Stage 2 (Core EY Paper)'],
    papers: ['General Aptitude', 'Core Ecology & Evolution Paper'],
    subjects: ['General Aptitude', 'Ecology', 'Evolution', 'Mathematics & Quantitative Ecology', 'Behavioural Ecology', 'Applied Ecology & Conservation'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Ecology': { topics: ['Levels of Ecological Organization: Individual, Population, Community, Ecosystem, Biome, Biosphere', 'Population Ecology: Growth Models (Exponential, Logistic), Life Tables, Population Regulation', 'Species Interactions: Competition (Lotka-Volterra), Predation, Mutualism, Parasitism, Commensalism', 'Community Ecology: Species Diversity (Indices), Succession, Stability, Trophic Structure', 'Ecosystem Ecology: Energy Flow, Nutrient Cycling (C, N, P, S Cycles), Primary Productivity', 'Biodiversity: Concepts, Measurement, Hotspots, Threats'] },
      'Evolution': { topics: ['Darwin\'s Theory of Natural Selection & Adaptations', 'Evidence for Evolution: Fossils, Comparative Anatomy, Molecular', 'Mechanisms of Evolution: Mutation, Gene Flow, Genetic Drift, Natural Selection', 'Population Genetics: Hardy-Weinberg Equilibrium, Allele Frequency Changes', 'Speciation: Allopatric, Sympatric, Reproductive Isolation Mechanisms', 'Molecular Evolution: Molecular Clocks, Phylogenetics, Parsimony, Maximum Likelihood', 'Coevolution: Prey-Predator, Host-Parasite, Mutualistic Systems'] },
      'Mathematics & Quantitative Ecology': { topics: ['Basic Statistics: Descriptive Stats, Probability Distributions, Hypothesis Testing', 'Linear Regression & Correlation', 'Analysis of Variance (ANOVA)', 'Population Models: Matrix Models, Age-Structured Populations (Leslie Matrix)', 'Spatial Analysis: GIS Basics, Landscape Ecology Metrics', 'Scientific Methods: Experimental Design, Sampling Methods'] },
      'Behavioural Ecology': { topics: ['Natural Selection & Behaviour, Inclusive Fitness & Kin Selection', 'Foraging Theory: Optimal Foraging, Patch Use (Marginal Value Theorem)', 'Mating Systems: Monogamy, Polygamy; Sexual Selection, Mate Choice', 'Communication & Signaling: Visual, Acoustic, Chemical Signals', 'Social Behaviour: Altruism, Cooperation, Eusociality, Game Theory'] },
      'Applied Ecology & Conservation': { topics: ['Conservation Biology: Principles, Extinction Risk Factors, Minimum Viable Population', 'Protected Areas: Design Principles (SLOSS Debate), Buffer Zones, Corridors', 'Wildlife Management: Monitoring, Census Methods, Habitat Management', 'Invasive Species: Impacts, Control Strategies', 'Restoration Ecology: Principles, Case Studies', 'Climate Change & Biodiversity: Impacts, Mitigation'] }
    },
    aliasMap: { 'EY': 'GATE_EY', 'Ecology': 'GATE_EY' },
    defaultSubject: 'Core Ecology & Evolution Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_GG: {
    examId: 'GATE_GG',
    displayName: 'GATE Geology & Geophysics (GG)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Common Section)', 'Stage 2 (Part A: Geology / Part B: Geophysics)'],
    papers: ['General Aptitude', 'Common Section', 'Part A: Geology', 'Part B: Geophysics'],
    subjects: ['General Aptitude', 'Mineralogy', 'Petrology', 'Structural Geology', 'Stratigraphy', 'Paleontology', 'Geomorphology', 'Economic Geology', 'Seismology', 'Gravity & Magnetic Methods', 'Well Logging'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Mineralogy': { topics: ['Crystal Systems, Crystallography, Physical Properties of Minerals', 'Silicate Structures, Classification of Rock-Forming Minerals', 'Optical Mineralogy: Properties in Plane & Cross-Polarized Light, Interference Figures'] },
      'Petrology': { topics: ['Igneous Rocks: Classification, Textures, Magma Composition, Bowen\'s Reaction Series, Magmatic Differentiation', 'Sedimentary Rocks: Classification, Texture, Structure, Diagenesis, Provenance', 'Metamorphic Rocks: Classification, Texture, Metamorphic Grade, Facies, P-T-t Paths'] },
      'Structural Geology': { topics: ['Stress & Strain: Ellipsoids, Finite vs. Infinitesimal Strain', 'Folds: Geometry, Classification, Mechanisms, Fold Interference', 'Faults: Classification, Geometry, Fault Rocks (Mylonite, Cataclasis)', 'Joints & Fractures, Fabrics & Foliations', 'Stereographic Projection Applications'] },
      'Stratigraphy': { topics: ['Stratigraphic Principles: Steno\'s Laws, Walther\'s Law', 'Stratigraphic Nomenclature & Codes', 'Indian Stratigraphy: Major Rock Groups (Archaean to Quaternary)', 'Sequence Stratigraphy: Systems Tracts, Sea Level Changes', 'Chemostratigraphy & Biostratigraphy'] },
      'Economic Geology': { topics: ['Ore Deposit Types: Magmatic, Hydrothermal, Sedimentary, Supergene', 'Important Minerals & Deposits in India: Iron, Copper, Manganese, Bauxite, Chromite, Coal', 'Mineral Exploration Techniques', 'Petroleum Geology: Source, Reservoir, Cap Rock, Trap Types'] },
      'Seismology & Geophysics': { topics: ['Seismic Waves: P, S, Surface Waves — Velocity, Propagation', 'Seismic Refraction & Reflection Methods', 'Earthquake Seismology: Richter & Moment Magnitude, Focal Mechanism', 'Gravity Method: Bouguer Anomaly, Regional-Residual Separation, Gravity Interpretation', 'Magnetic Method: Geomagnetic Field, Susceptibility, Interpretation', 'Electrical Methods: Resistivity (VES, Profiling), IP Method, SP Method', 'Electromagnetic Methods: TEM, FEM', 'Well Logging: Resistivity, SP, Neutron, Density, Sonic Logs — Interpretation'] }
    },
    aliasMap: { 'GG': 'GATE_GG', 'Geology': 'GATE_GG' },
    defaultSubject: 'Part A: Geology',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_AR: {
    examId: 'GATE_AR',
    displayName: 'GATE Architecture & Planning (AR)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA)', 'Stage 2 (Core Architecture & Planning Paper)'],
    papers: ['General Aptitude', 'Core Architecture & Planning Paper'],
    subjects: ['General Aptitude', 'Architecture & Design', 'Building Materials & Construction', 'Structural Systems', 'Building Services', 'Planning & Housing', 'History & Contemporary Architecture'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Architecture & Design': { topics: ['Design Principles: Scale, Proportion, Rhythm, Hierarchy, Contrast, Balance', 'Spatial Concepts: Space, Form, Light, Structure; Interior-Exterior Relations', 'Architectural Graphics: Orthographic Projections, Isometric, Perspective Drawing', 'Building Typologies: Residential, Commercial, Institutional, Industrial', 'Universal Design & Accessibility (NBC Guidelines)', 'Green Building Design: GRIHA, LEED Principles; Passive Design Strategies (Solar, Wind, Natural Ventilation)'] },
      'Building Materials & Construction': { topics: ['Traditional Materials: Brick, Stone, Timber, Lime, Bamboo', 'Modern Materials: Concrete (Types, Mix Design), Steel, Glass (Float, Tempered, Laminated), Aluminum', 'Plastics, Composites, Smart Materials', 'Construction Technology: Formwork, Scaffolding, Earthwork', 'Masonry: Bonding Patterns, Arches, Vaults, Domes', 'Building Envelope: Walls, Roof Systems (RCC, Steel, Space Frame), Waterproofing'] },
      'Structural Systems': { topics: ['Loads: Dead, Live, Wind, Seismic; Load Path Concepts', 'Structural Systems: Post & Beam, Wall-Slab, Frame, Truss, Shell, Folded Plate', 'Fundamentals of RCC Design: Beams, Columns, Slabs, Footings', 'Steel Structures: Types, Connections', 'Pre-stressed Concrete Basics', 'Earthquake-Resistant Design Principles (IS 1893)'] },
      'Building Services': { topics: ['HVAC: Load Calculation Basics, Psychrometrics, Types of HVAC Systems', 'Plumbing: Water Supply (Overhead, Hydro-pneumatic), Drainage & Sanitation Systems', 'Electrical Systems: LT, HT, Earthing, Emergency Lighting, Solar PV', 'Acoustics: Room Acoustics, Reverberation Time (Sabine\'s Formula), Sound Insulation', 'Fire Protection: Active (Sprinklers, Detection) & Passive (Compartmentalization) Systems', 'Lifts, Escalators & Ramps: Design Criteria'] },
      'Planning & Housing': { topics: ['Town Planning Principles: Zoning, Land Use Planning, Master Plans, Development Plans', 'Housing: Types, Standards (Density, FAR, Coverage), EWS, LIG, MIG Housing Concepts', 'Urban Design Elements: Streets, Public Spaces, Urban Blocks, Frontages', 'Infrastructure: Roads, Water Supply, Sewerage, Solid Waste Management', 'Smart Cities Mission & AMRUT', 'Regional Planning, New Town Planning Concepts'] },
      'History & Contemporary Architecture': { topics: ['Ancient Indian Architecture: Vedic, Indus Valley, Buddhist (Stupa, Vihara, Chaitya), Hindu Temple Architecture (Nagara, Dravida, Vesara)', 'Mughal & Indo-Islamic Architecture: Mosques, Tombs, Forts', 'Colonial Architecture in India: Indo-Saracenic, Art Deco', 'Western Architectural History: Greek, Roman, Gothic, Renaissance, Baroque', 'Modern Architecture: Arts & Crafts, Art Nouveau, Bauhaus, International Style, Brutalism, Post-Modernism, Deconstructivism', 'Indian Architects: Laurie Baker, B.V. Doshi, Charles Correa, Raj Rewal; Global: Le Corbusier, Mies van der Rohe, Tadao Ando, Zaha Hadid'] }
    },
    aliasMap: { 'AR': 'GATE_AR', 'Architecture': 'GATE_AR' },
    defaultSubject: 'Core Architecture & Planning Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_ES: {
    examId: 'GATE_ES',
    displayName: 'GATE Environmental Science & Engineering (ES)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core ES Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Environmental Science & Engineering Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Environmental Chemistry', 'Environmental Microbiology', 'Water Resources & Treatment', 'Wastewater Treatment', 'Air Pollution', 'Solid Waste Management', 'Noise Pollution', 'Environmental Impact Assessment', 'Global Environmental Issues'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Environmental Chemistry': { topics: ['Atmospheric Chemistry: Composition, Photochemical Smog, Ozone Layer', 'Aquatic Chemistry: pH, Alkalinity, DO, BOD, COD, Hardness, Water Quality Standards', 'Soil Chemistry: Soil Composition, CEC, Soil Pollution, Remediation', 'Chemical Equilibria in Environmental Systems: Acid-Base, Precipitation-Dissolution, Complexation, Redox', 'Fate & Transport of Pollutants: Adsorption, Volatilization, Biodegradation'] },
      'Water Resources & Treatment': { topics: ['Hydrology: Hydrological Cycle, Precipitation, Infiltration, Runoff, Evapotranspiration, Unit Hydrograph', 'Groundwater: Aquifer Types, Darcy\'s Law, Well Hydraulics', 'Water Quality Standards: Drinking Water (BIS, WHO)', 'Water Treatment: Coagulation-Flocculation (Jar Test), Sedimentation, Filtration (Slow/Rapid Sand), Disinfection (Cl2, UV, Ozone)', 'Water Distribution: Pipe Networks, Hazen-Williams, Hardy-Cross', 'Desalination: RO, Electrodialysis'] },
      'Wastewater Treatment': { topics: ['Sewage Collection: Types of Sewers, Design of Sewerage System', 'Primary Treatment: Screening, Grit Removal, Primary Clarifier', 'Secondary Treatment: ASP (Activated Sludge Process — CSTR, Plug Flow), Trickling Filters, Rotating Biological Contactors, SBR, MBR', 'Sludge Treatment: Thickening, Digestion (Anaerobic — Biogas), Dewatering (Belt Press, Centrifuge)', 'Tertiary Treatment: Nutrient Removal (N, P), Disinfection, Reuse', 'Industrial Effluent Treatment: Specific Industries (Pharmaceutical, Textile, Tannery)'] },
      'Air Pollution': { topics: ['Sources: Point, Line, Area Sources; Emission Inventories', 'Pollutants: SPM, PM2.5, PM10, SO2, NOx, CO, VOC, Ozone, Lead', 'Dispersion Modeling: Gaussian Plume Model, Pasquill Stability Classes, Mixing Height', 'Control Technologies: ESP, Fabric Filters, Wet Scrubbers, Cyclones; SCR, SNCR for NOx; FGD for SO2', 'Indoor Air Pollution: Sources, Sick Building Syndrome, Radon', 'National Ambient Air Quality Standards (NAAQS)'] },
      'Solid Waste Management': { topics: ['Characterization: Municipal Solid Waste Composition, Proximate & Ultimate Analysis', 'Collection & Transportation: Routing, Transfer Stations', 'Processing: Composting (Aerobic — Windrow, In-vessel), Anaerobic Digestion (Biogas), Vermicomposting', 'Thermal Treatment: Incineration (Combustion Parameters, Emissions), Pyrolysis, Gasification', 'Landfilling: Sanitary Landfill Design (Liner System, Leachate Collection, LFG Recovery)', 'Hazardous Waste: Classification, Characterization, Incineration, Secure Landfill'] },
      'Global Environmental Issues': { topics: ['Climate Change: IPCC Reports, GHGs, Global Warming Potential, Carbon Footprint', 'International Agreements: Kyoto Protocol, Paris Agreement, Montreal Protocol, Basel, Stockholm, Rotterdam Conventions', 'Renewable Energy: Solar, Wind, Biomass, Geothermal — Potential & Challenges', 'Environmental Laws in India: EPA 1986, Water Act 1974, Air Act 1981, Forest Acts, EIA Notification 2006', 'Sustainable Development: Goals (SDGs), Green Economy, Circular Economy'] }
    },
    aliasMap: { 'ES': 'GATE_ES', 'Environmental': 'GATE_ES' },
    defaultSubject: 'Core Environmental Science & Engineering Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_NM: {
    examId: 'GATE_NM',
    displayName: 'GATE Naval Architecture & Marine Engineering (NM)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core NM Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Naval Architecture Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Ship Geometry & Hydrostatics', 'Ship Stability', 'Resistance & Propulsion', 'Marine Structures', 'Ship Manoeuvring', 'Marine Machinery & Systems'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Ship Geometry & Hydrostatics': { topics: ['Form Coefficients: Block, Prismatic, Waterplane Area, Midship Coefficients', 'Displacement & Buoyancy: Archimedes Principle, Bonjean Curves', 'Hydrostatic Particulars: KB, BM, GM, Metacentre, KG', 'Trim & Load Line Calculations'] },
      'Ship Stability': { topics: ['Initial Stability: GM, GZ Calculation, Metacentric Height', 'Large Angle Stability: Righting Levers, Static & Dynamic Stability', 'Free Surface Effect, Flooding, Damage Stability', 'IMO Stability Criteria'] },
      'Resistance & Propulsion': { topics: ['Ship Resistance: Components (Frictional, Wave-Making, Appendage), Froude Number, Scaling Laws (Froude\'s Law)', 'Propeller Theory: Momentum Theory, Blade Element Theory, Propeller Cavitation', 'Propulsive Efficiency: Hull, Propeller, Transmission Efficiencies', 'Sea Trials & Sea State Corrections'] },
      'Marine Structures': { topics: ['Ship Construction: Transverse & Longitudinal Framing, Structural Components', 'Loads on Ship Structure: Still Water, Wave Bending Moments', 'Stress & Deflection Analysis', 'Fatigue & Fracture of Marine Structures', 'Classification Rules: Lloyd\'s, Bureau Veritas Basics'] },
      'Marine Machinery & Systems': { topics: ['Marine Diesel Engines: 2-Stroke & 4-Stroke, Fuel Systems', 'Marine Propulsion Systems: Direct Drive, Geared, Diesel-Electric, LNG Propulsion', 'Auxiliary Machinery: Pumps, Compressors, Heat Exchangers', 'Ship Systems: Bilge, Ballast, Fire Fighting, Refrigeration, HVAC', 'MARPOL Regulations & Environmental Compliance'] }
    },
    aliasMap: { 'NM': 'GATE_NM', 'Naval Architecture': 'GATE_NM' },
    defaultSubject: 'Core Naval Architecture Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_TF: {
    examId: 'GATE_TF',
    displayName: 'GATE Textile Engineering & Fibre Science (TF)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Engg. Maths)', 'Stage 2 (Core TF Paper)'],
    papers: ['General Aptitude', 'Engineering Mathematics', 'Core Textile Engineering Paper'],
    subjects: ['General Aptitude', 'Engineering Mathematics', 'Textile Fibres', 'Yarn Manufacture', 'Fabric Manufacture', 'Textile Chemical Processing', 'Textile Testing & Quality Control', 'Process Control & Industrial Engineering'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Engineering Mathematics': { topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods'] },
      'Textile Fibres': { topics: ['Natural Fibres: Cotton (Classification, Grading), Wool (Wool Type, Fiber Properties), Silk (Production, Sericulture), Jute, Flax, Hemp', 'Man-Made Fibres: Viscose Rayon (Lyocell, Modal), Polyester (PET), Nylon (PA 6, PA 6.6), Acrylic, Polypropylene, Aramid, Carbon Fiber', 'Fibre Properties: Tenacity, Elongation, Crimp, Moisture Regain, Thermal Properties, Electrical Resistivity', 'Fibre Characterization: Microscopy, FTIR, DSC', 'Technical Textiles: Medical, Geotextiles, Agrotextiles'] },
      'Yarn Manufacture': { topics: ['Opening & Cleaning: Blow Room Machines, Hopper Feeder, Beater Types', 'Carding: Flat Card, Roller & Clearer Card — Fibre Individualization, Parallelization', 'Combing: Lap Preparation, Comber, Combing Efficiency, Noil %', 'Drawing: Drafting, Doubling, Sliver Formation; Draw Frame Passage', 'Roving: Speed Frame, Flyer Draft, Twist', 'Ring Spinning: Drafting Zone, Twisting, Winding, Yarn Parameters — Count, Twist, Strength', 'Open-End Spinning: Rotor, Air-Jet (Murata, Rieter), Friction (Dref) Spinning', 'Filament Yarn Processing: Extrusion, Drawing, Texturing (False-Twist, Air-Jet)'] },
      'Fabric Manufacture': { topics: ['Winding: Precision, Drum (Random), Package Building, Winding Tension', 'Warping: Direct (Beam), Sectional (Drum) Warping — Yarn Spacing, Tension', 'Sizing: Size Materials (Starch, CMC, PVA, Acrylic), Sizing Recipe, Penetration vs Encapsulation', 'Weaving Loom: Components (Shedding, Picking, Beating, Let-Off & Take-Up), Types of Sheds, Shuttle & Shuttleless Looms (Rapier, Air-Jet, Water-Jet, Projectile)', 'Woven Fabric Structures: Plain, Twill, Satin, Dobby, Jacquard; Derivatives', 'Knitting: Weft (Single Jersey, Rib, Interlock, Purl) & Warp Knitting (Tricot, Raschel)', 'Non-Woven Fabrics: Dry, Wet-Lay, Spun-Bond, Melt-Blown; Bonding Methods'] },
      'Textile Chemical Processing': { topics: ['Pre-Treatment: Singeing, Desizing, Scouring, Bleaching (H2O2, Sodium Hypochlorite, Sodium Chlorite), Mercerization', 'Dyeing: Dyestuff Classification (Reactive, Vat, Disperse, Direct, Acid, Basic, Sulphur), Dyeing Machines (Jigger, Pad, Jet, HTHP Dyeing), Dyeing Mechanism & Thermodynamics', 'Printing: Styles (Direct, Discharge, Resist, Pigment), Methods (Flat Screen, Rotary Screen, Inkjet, Digital Printing)', 'Finishing: Mechanical (Calendering, Raising, Shearing, Sanforizing) & Chemical (Softening, Stiffening, Water Repellency, Flame Retardancy, Anti-Microbial, Wrinkle Resistance)', 'Effluent Treatment for Textile Industry'] },
      'Textile Testing & Quality Control': { topics: ['Fibre Testing: Length, Fineness, Strength (HVI, AFIS)', 'Yarn Testing: Count, Twist, Strength (Lea, Single), Elongation, Irregularity (Evenness Tester — Uster)', 'Fabric Testing: Tensile, Tear, Bursting Strength; Pilling, Abrasion; Air Permeability, Water Vapor Permeability', 'Colour Fastness Testing: Washing, Rubbing, Light (ISO Standards)', 'Statistical Quality Control: Control Charts, Sampling Plans, Cp, Cpk', 'Barcoding & Traceability in Textile Manufacturing'] }
    },
    aliasMap: { 'TF': 'GATE_TF', 'Textile': 'GATE_TF' },
    defaultSubject: 'Core Textile Engineering Paper',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
  },

  GATE_XH: {
    examId: 'GATE_XH',
    displayName: 'GATE Humanities & Social Sciences (XH)',
    category: 'ENGINEERING',
    stages: ['Stage 1 (GA + Section B1: Reasoning & Comprehension)', 'Stage 2 (One of: Economics / English / Linguistics / Philosophy / Psychology / Sociology)'],
    papers: ['General Aptitude', 'Section B1: Reasoning & Comprehension (Compulsory)', 'Section C1: Economics', 'Section C2: English', 'Section C3: Linguistics', 'Section C4: Philosophy', 'Section C5: Psychology', 'Section C6: Sociology'],
    subjects: ['General Aptitude', 'Reasoning & Comprehension', 'Economics', 'English', 'Linguistics', 'Philosophy', 'Psychology', 'Sociology'],
    syllabusTree: {
      'General Aptitude': { topics: ['Verbal Aptitude', 'Quantitative Aptitude', 'Analytical Aptitude', 'Spatial Aptitude'] },
      'Reasoning & Comprehension': { topics: ['Reading Comprehension: Inference, Main Idea, Vocabulary in Context', 'Verbal Reasoning: Analogies, Critical Reasoning, Argument Analysis', 'Basic Quantitative Aptitude: Arithmetic, Data Interpretation', 'Research Methodology: Hypothesis, Experimental Design, Sampling'] },
      'Economics': { topics: ['Microeconomics: Demand-Supply, Elasticity, Consumer Theory, Producer Theory, Market Structures', 'Macroeconomics: National Income, GDP, Fiscal Policy, Monetary Policy, Open Economy Macro', 'Statistics & Econometrics: Regression (OLS), Time Series, Panel Data, Instrumental Variables', 'Indian Economy: Planning, Reforms, Agriculture, Industry, Poverty, Development'] },
      'English': { topics: ['Literary Criticism: Ancient to Contemporary (Aristotle to Postmodern)', 'Indian Writing in English: Major Authors & Works', 'British Literature: Chaucer to Modernism & Postmodernism', 'American Literature: Major Movements & Authors', 'Linguistics Applied to Literature: Stylistics, Discourse Analysis'] },
      'Psychology': { topics: ['Biological Basis of Behavior: Nervous System, Sensation & Perception', 'Developmental Psychology: Piaget, Vygotsky, Erikson — Life-Span Development', 'Personality: Theories (Freud, Maslow, Rogers, Big Five), Assessment', 'Abnormal Psychology: Classification (DSM-5), Major Disorders & Treatment', 'Social Psychology: Attitudes, Prejudice, Group Dynamics, Influence', 'Cognitive Psychology: Memory, Learning, Thinking, Problem Solving', 'Research Methods: Experimental Design, Statistics (ANOVA, Regression)'] },
      'Sociology': { topics: ['Sociological Theory: Marx, Weber, Durkheim, Parsons, Giddens, Merton', 'Social Stratification: Class, Caste, Gender, Race — Perspectives & Intersectionality', 'Social Institutions: Family, Religion, Education, Economy, Politics', 'Social Change: Modernization, Globalization, Social Movements', 'Indian Society: Colonial Impact, Caste System, Tribal Communities, Minorities', 'Research Methods: Qualitative & Quantitative, Surveys, Ethnography, Content Analysis'] }
    },
    aliasMap: { 'XH': 'GATE_XH', 'Humanities': 'GATE_XH' },
    defaultSubject: 'Reasoning & Comprehension',
    languages: ['English'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ', 'MSQ', 'NAT']
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
