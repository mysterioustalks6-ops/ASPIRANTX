import { ExamConfig } from './examRegistry';

const CIVIL_TREE = {
  'Civil Engineering': {
    topics: [
      'Building Materials & Construction (Bricks, Stones, Cement, Timber)',
      'Concrete Technology & Mix Design (IS 456)',
      'Surveying & Levelling (Compass, Theodolite, Tacheometry, Total Station)',
      'Mechanics & Strength of Materials (SFD, BMD, Stresses, Deflections)',
      'Design of Reinforced Concrete Structures (LSM, Beams, Slabs, Columns)',
      'Design of Steel Structures (Connections, Tension, Compression Members, IS 800)',
      'Soil Mechanics & Foundation Engineering (Index Properties, Shear Strength, Earth Pressure)',
      'Fluid Mechanics & Hydraulics (Hydrostatics, Bernoulli, Pipe Flow, Open Channel)',
      'Environmental Engineering (Water Treatment, Sewerage, BOD/COD)',
      'Highway & Transportation Engineering (Geometric Design, Pavement Design)',
      'Irrigation Engineering & Hydrology (Duty-Delta, Canal Design, Flood Routing)',
      'Estimating, Costing & Valuation (Rate Analysis, Detailed Estimates)'
    ]
  },
  'General Intelligence & Reasoning': {
    topics: [
      'Analogies & Classification',
      'Series Completion & Coding-Decoding',
      'Blood Relations & Direction Sense',
      'Syllogisms & Venn Diagrams',
      'Non-Verbal Reasoning & Spatial Orientation'
    ]
  },
  'General Awareness': {
    topics: [
      'General Science (Physics, Chemistry, Biology)',
      'Indian Polity & Constitution',
      'Modern History & National Movement',
      'Indian Geography & Natural Resources',
      'Economy, Current Affairs & Engineering Aptitude'
    ]
  }
};

const ELECTRICAL_TREE = {
  'Electrical Engineering': {
    topics: [
      'Basic Electrical Engineering & Network Theorems',
      'AC Fundamentals & 3-Phase Systems',
      'DC Machines (Generators & Motors)',
      'Transformers (1-Phase & 3-Phase, Efficiency, OC/SC Tests)',
      'Induction Motors & Synchronous Alternators',
      'Power Transmission & Distribution (Parameters, Insulators, Corona)',
      'Switchgear & Protection (Faults, Relays, Circuit Breakers)',
      'Electrical Measurements & Instrumentation (PMMC, MI, Bridges)',
      'Control Systems Fundamentals (Transfer Function, Stability)',
      'Analog & Digital Electronics (Diodes, Transistors, Op-Amps, Gates)'
    ]
  },
  'General Intelligence & Reasoning': {
    topics: [
      'Analogies & Classification',
      'Series Completion & Coding-Decoding',
      'Blood Relations & Direction Sense',
      'Syllogisms & Venn Diagrams',
      'Non-Verbal Reasoning & Spatial Orientation'
    ]
  },
  'General Awareness': {
    topics: [
      'General Science (Physics, Chemistry, Biology)',
      'Indian Polity & Constitution',
      'Modern History & National Movement',
      'Indian Geography & Natural Resources',
      'Economy, Current Affairs & Engineering Aptitude'
    ]
  }
};

const MECHANICAL_TREE = {
  'Mechanical Engineering': {
    topics: [
      'Engineering Thermodynamics (Laws, Entropy, Availability)',
      'IC Engines & Air Standard Cycles (Otto, Diesel, Dual)',
      'Fluid Mechanics & Hydraulic Machines (Pelton, Francis, Pumps)',
      'Strength of Materials & Machine Design (Theories of Failure, Shafts)',
      'Theory of Machines & Vibrations (Mechanisms, Gear Trains, Governors)',
      'Manufacturing Engineering (Casting, Welding, Forming, Machining)',
      'Heat and Mass Transfer (Conduction, Convection, Radiation, Heat Exchangers)',
      'Refrigeration & Air Conditioning (VCR Cycle, Psychrometry)',
      'Industrial Engineering & Production Planning'
    ]
  },
  'General Intelligence & Reasoning': {
    topics: [
      'Analogies & Classification',
      'Series Completion & Coding-Decoding',
      'Blood Relations & Direction Sense',
      'Syllogisms & Venn Diagrams',
      'Non-Verbal Reasoning & Spatial Orientation'
    ]
  },
  'General Awareness': {
    topics: [
      'General Science (Physics, Chemistry, Biology)',
      'Indian Polity & Constitution',
      'Modern History & National Movement',
      'Indian Geography & Natural Resources',
      'Economy, Current Affairs & Engineering Aptitude'
    ]
  }
};

const COMBINED_AE_JE_TREE = {
  'Civil Engineering': CIVIL_TREE['Civil Engineering'],
  'Electrical Engineering': ELECTRICAL_TREE['Electrical Engineering'],
  'Mechanical Engineering': MECHANICAL_TREE['Mechanical Engineering'],
  'General Intelligence & Reasoning': CIVIL_TREE['General Intelligence & Reasoning'],
  'General Awareness': CIVIL_TREE['General Awareness'],
  'State Specific GK & Engineering Aptitude': {
    topics: [
      'State Geography, River Basins & Irrigation Projects',
      'State Infrastructure, Power Plants & Industrial Development',
      'State History, Culture & Administration',
      'State Public Works Norms & Disaster Management'
    ]
  }
};

function createAeJeConfig(
  examId: string,
  displayName: string,
  branch: 'CIVIL' | 'ELECTRICAL' | 'MECHANICAL' | 'ALL',
  isState: boolean = true,
  stateName: string = ''
): ExamConfig {
  const tree = branch === 'CIVIL' ? CIVIL_TREE :
               branch === 'ELECTRICAL' ? ELECTRICAL_TREE :
               branch === 'MECHANICAL' ? MECHANICAL_TREE : COMBINED_AE_JE_TREE;
  
  const subjects = Object.keys(tree);

  return {
    examId,
    displayName,
    category: isState ? 'STATE_EXAMS' : 'ENGINEERING',
    stages: ['Tier 1 / Paper 1 (CBT)', 'Tier 2 / Paper 2 (Technical)', 'Document Verification & Interview'],
    papers: ['Paper 1 (General & Technical Screening)', 'Paper 2 (Core Engineering Branch CBT)'],
    subjects,
    syllabusTree: tree,
    aliasMap: {
      'civil': 'Civil Engineering',
      'electrical': 'Electrical Engineering',
      'mechanical': 'Mechanical Engineering',
      'reasoning': 'General Intelligence & Reasoning',
      'ga': 'General Awareness',
      'state gk': 'State Specific GK & Engineering Aptitude'
    },
    defaultSubject: branch === 'CIVIL' ? 'Civil Engineering' :
                    branch === 'ELECTRICAL' ? 'Electrical Engineering' :
                    branch === 'MECHANICAL' ? 'Mechanical Engineering' : 'Civil Engineering',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['Objective MCQ', 'Numerical Value MCQ', 'Assertion-Reasoning', 'Technical Diagram Interpretation']
  };
}

export const AE_JE_CONFIGS: Record<string, ExamConfig> = {
  // SSC JE Central
  SSC_JE: createAeJeConfig('SSC_JE', 'SSC Junior Engineer (Civil/Electrical/Mechanical)', 'ALL', false),
  SSC_JE_CIVIL: createAeJeConfig('SSC_JE_CIVIL', 'SSC JE Civil Engineering', 'CIVIL', false),
  SSC_JE_ELECTRICAL: createAeJeConfig('SSC_JE_ELECTRICAL', 'SSC JE Electrical Engineering', 'ELECTRICAL', false),
  SSC_JE_MECHANICAL: createAeJeConfig('SSC_JE_MECHANICAL', 'SSC JE Mechanical Engineering', 'MECHANICAL', false),

  // State AE & JE Exams
  UPPSC_AE: createAeJeConfig('UPPSC_AE', 'UPPSC Assistant Engineer (Combined State Engineering Services)', 'ALL', true, 'Uttar Pradesh'),
  UPSSSC_JE: createAeJeConfig('UPSSSC_JE', 'UPSSSC Junior Engineer Combined Competitive', 'ALL', true, 'Uttar Pradesh'),
  UPPCL_AE_JE: createAeJeConfig('UPPCL_AE_JE', 'UPPCL Assistant Engineer & Junior Engineer', 'ALL', true, 'Uttar Pradesh'),
  
  BPSC_AE: createAeJeConfig('BPSC_AE', 'BPSC Assistant Engineer (Civil/Mech/Elec)', 'ALL', true, 'Bihar'),
  BTSC_JE: createAeJeConfig('BTSC_JE', 'BTSC Junior Engineer (Bihar Technical Services)', 'ALL', true, 'Bihar'),
  BSPHCL_AE_JE: createAeJeConfig('BSPHCL_AE_JE', 'BSPHCL Assistant Engineer & Junior Engineer', 'ALL', true, 'Bihar'),

  MPPSC_AE: createAeJeConfig('MPPSC_AE', 'MPPSC State Engineering Services (Assistant Engineer)', 'ALL', true, 'Madhya Pradesh'),
  MP_SUB_ENGINEER: createAeJeConfig('MP_SUB_ENGINEER', 'MPESB Sub Engineer (Vyapam JE)', 'ALL', true, 'Madhya Pradesh'),

  RPSC_AEN: createAeJeConfig('RPSC_AEN', 'RPSC Assistant Engineer (Civil/Elec/Mech/Agri)', 'ALL', true, 'Rajasthan'),
  RSMSSB_JE: createAeJeConfig('RSMSSB_JE', 'RSMSSB Junior Engineer (Rajasthan Staff Selection)', 'ALL', true, 'Rajasthan'),

  UKPSC_AE: createAeJeConfig('UKPSC_AE', 'UKPSC Combined State Engineering (Assistant Engineer)', 'ALL', true, 'Uttarakhand'),
  UKPSC_JE: createAeJeConfig('UKPSC_JE', 'UKPSC Combined State Junior Engineer', 'ALL', true, 'Uttarakhand'),

  MPSC_MES_AE: createAeJeConfig('MPSC_MES_AE', 'MPSC Maharashtra Engineering Services (AE)', 'ALL', true, 'Maharashtra'),
  BMC_MAHA_JE: createAeJeConfig('BMC_MAHA_JE', 'BMC / WRD / PWD Maharashtra Junior Engineer', 'ALL', true, 'Maharashtra'),
  MAHATRANSCO_AE_JE: createAeJeConfig('MAHATRANSCO_AE_JE', 'MahaTransco & MahaGenco AE / JE Examination', 'ALL', true, 'Maharashtra'),

  WBPSC_AE: createAeJeConfig('WBPSC_AE', 'WBPSC Assistant Engineer (Civil/Mechanical/Electrical)', 'ALL', true, 'West Bengal'),
  WBPSC_JE: createAeJeConfig('WBPSC_JE', 'WBPSC Junior Engineer (West Bengal PSC)', 'ALL', true, 'West Bengal'),

  HPSC_AE: createAeJeConfig('HPSC_AE', 'HPSC Assistant Engineer (Haryana PSC)', 'ALL', true, 'Haryana'),
  HSSC_JE: createAeJeConfig('HSSC_JE', 'HSSC Junior Engineer (Haryana Staff Selection)', 'ALL', true, 'Haryana'),

  PPSC_AE: createAeJeConfig('PPSC_AE', 'PPSC Assistant Engineer (Punjab PSC)', 'ALL', true, 'Punjab'),
  PSPCL_JE: createAeJeConfig('PSPCL_JE', 'PSPCL Junior Engineer (Punjab Power)', 'ALL', true, 'Punjab'),

  JPSC_AE: createAeJeConfig('JPSC_AE', 'JPSC Combined Assistant Engineer Examination', 'ALL', true, 'Jharkhand'),
  JSSC_JE: createAeJeConfig('JSSC_JE', 'JSSC Junior Engineer (JDLCCE)', 'ALL', true, 'Jharkhand'),

  OPSC_AEE: createAeJeConfig('OPSC_AEE', 'OPSC Assistant Executive Engineer (Odisha PSC)', 'ALL', true, 'Odisha'),
  OSSSC_JE: createAeJeConfig('OSSSC_JE', 'OSSSC Junior Engineer Examination', 'ALL', true, 'Odisha'),

  GPSC_AE: createAeJeConfig('GPSC_AE', 'GPSC Assistant Engineer (Gujarat PSC)', 'ALL', true, 'Gujarat'),
  GSECL_GETCO_JE: createAeJeConfig('GSECL_GETCO_JE', 'GSECL & GETCO Junior Engineer Vidyut Sahayak', 'ALL', true, 'Gujarat'),

  CGPSC_AE: createAeJeConfig('CGPSC_AE', 'CGPSC State Engineering Services (Assistant Engineer)', 'ALL', true, 'Chhattisgarh'),
  CG_VYAPAM_JE: createAeJeConfig('CG_VYAPAM_JE', 'CG Vyapam Sub Engineer (Junior Engineer)', 'ALL', true, 'Chhattisgarh'),

  APPSC_AEE: createAeJeConfig('APPSC_AEE', 'APPSC Assistant Executive Engineer & AE', 'ALL', true, 'Andhra Pradesh'),
  TSPSC_AEE: createAeJeConfig('TSPSC_AEE', 'TSPSC Assistant Executive Engineer & AE', 'ALL', true, 'Telangana'),

  KPSC_AE_JE: createAeJeConfig('KPSC_AE_JE', 'KPSC Assistant Engineer & Junior Engineer (PWD/WRD)', 'ALL', true, 'Karnataka'),
  TNPSC_CESE_AE: createAeJeConfig('TNPSC_CESE_AE', 'TNPSC Combined Engineering Services Examination (AE)', 'ALL', true, 'Tamil Nadu'),
  KERALA_PSC_AE: createAeJeConfig('KERALA_PSC_AE', 'Kerala PSC Assistant Engineer (Civil/Elec/Mech)', 'ALL', true, 'Kerala'),

  DSSSB_AE_JE: createAeJeConfig('DSSSB_AE_JE', 'DSSSB Assistant Engineer & Junior Engineer', 'ALL', true, 'Delhi'),
  DDA_JE: createAeJeConfig('DDA_JE', 'DDA Junior Engineer (Delhi Development Authority)', 'ALL', true, 'Delhi')
};
