import { CbtTest, CommunityGroup, CommunityPost, AppNotification } from '../types';

export const INITIAL_CBT_TESTS: CbtTest[] = [
  {
    id: 'upsc_cbt_mock_01',
    title: 'UPSC CSE Prelims All India Grand Mock Test 2026 (GS Paper 1)',
    exam: 'UPSC_CSE',
    durationMinutes: 120,
    totalMarks: 200,
    sections: [
      { name: 'General Studies Paper 1', durationMinutes: 120, totalQuestions: 5 }
    ],
    markingScheme: { correct: 2.0, incorrect: 0.66 },
    questions: [
      {
        id: 'q_cbt_1',
        type: 'mcq',
        section: 'General Studies Paper 1',
        questionText: 'With reference to the Constitution of India, consider the following statements regarding the Preamble:\n1. The Preamble is a part of the Constitution and can be amended under Article 368.\n2. The Preamble is a source of power to the legislature and also a prohibition upon the powers of the legislature.\n3. In the Kesavananda Bharati case (1973), the Supreme Court held that the Preamble is an integral part of the Constitution.\n\nWhich of the statements given above are correct?',
        options: [
          '1 and 2 only',
          '1 and 3 only',
          '2 and 3 only',
          '1, 2 and 3'
        ],
        correctOption: 1,
        language: 'English',
        subject: 'Indian Polity & Governance',
        topic: 'Preamble & Fundamental Rights',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Statement 1 is correct: Preamble is amendable under Art 368 without altering basic structure. Statement 2 is INCORRECT: Preamble is NEITHER a source of power nor a limitation on power. Statement 3 is correct: Kesavananda Bharati case affirmed Preamble as part of Constitution.'
      },
      {
        id: 'q_cbt_2',
        type: 'passage',
        section: 'General Studies Paper 1',
        passageText: 'PASSAGE: The Monetary Policy Committee (MPC) constituted under Section 45ZB of the Reserve Bank of India Act, 1934 determines the policy repo rate required to achieve the inflation target. The framework aims at maintaining price stability while keeping in mind the objective of growth.',
        questionText: 'Based on the passage and macroeconomic principles, consider the following statements regarding the Monetary Policy Committee (MPC):\n1. The MPC consists of six members, including three from RBI and three appointed by the Central Government.\n2. The Governor of the RBI acts as the ex-officio Chairperson of the MPC and possesses a casting vote in case of a tie.\n\nWhich of the above statements is/are correct?',
        options: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2'
        ],
        correctOption: 2,
        language: 'English',
        subject: 'Indian Economy',
        topic: 'Monetary Policy & RBI',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both 1 and 2 are correct. MPC has 6 members and RBI Governor has casting vote.'
      },
      {
        id: 'q_cbt_3',
        type: 'assertion_reason',
        section: 'General Studies Paper 1',
        assertionText: 'Assertion (A): The Western Ghats in India are recognized as one of the world\'s eight "hottest hotspots" of biological diversity.',
        reasonText: 'Reason (R): The Western Ghats display exceptional levels of species endemism due to geographical isolation and microclimatic variations.',
        questionText: 'Select the correct answer using the options given below:',
        options: [
          'Both (A) and (R) are true, and (R) is the correct explanation of (A).',
          'Both (A) and (R) are true, but (R) is NOT the correct explanation of (A).',
          '(A) is true, but (R) is false.',
          '(A) is false, but (R) is true.'
        ],
        correctOption: 0,
        language: 'English',
        subject: 'Environment & Ecology',
        topic: 'Biodiversity Hotspots',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both Assertion and Reason are true and Reason correctly explains why Western Ghats is a biodiversity hotspot.'
      },
      {
        id: 'q_cbt_4',
        type: 'mcq',
        section: 'General Studies Paper 1',
        questionText: 'Consider the following statements regarding the Indian Ocean Dipole (IOD):\n1. A positive IOD characteristically brings cooler ocean waters in the eastern Indian Ocean and warmer waters in the western Indian Ocean.\n2. A positive IOD is generally associated with good rainfall over the Indian subcontinent during the monsoon season.\n\nWhich of the statements given above is/are correct?',
        options: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2'
        ],
        correctOption: 2,
        language: 'English',
        subject: 'Geography',
        topic: 'Monsoon & Climate Dynamics',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Both statements are correct. Positive IOD favors Indian Summer Monsoon.'
      },
      {
        id: 'q_cbt_5',
        type: 'paragraph',
        section: 'General Studies Paper 1',
        questionText: 'The ancient Harappan Civilization possessed advanced urban planning. Which among the following sites is famous for its unique water harvesting and reservoir system surrounded by stone masonry fortifications?',
        options: [
          'Lothal',
          'Dholavira',
          'Kalibangan',
          'Rakhigarhi'
        ],
        correctOption: 1,
        language: 'English',
        subject: 'History',
        topic: 'Indus Valley Civilization',
        marks: 2.0,
        negativeMarks: 0.66,
        explanation: 'Dholavira in Rann of Kutch, Gujarat is world-famous for its elaborate water management system with rock-cut reservoirs.'
      }
    ]
  },
  {
    id: 'ssc_cgl_cbt_mock_01',
    title: 'SSC CGL Tier-1 All India Speed Test Series 2026',
    exam: 'SSC_CGL',
    durationMinutes: 60,
    totalMarks: 200,
    sections: [
      { name: 'General Intelligence & Reasoning', durationMinutes: 15, totalQuestions: 2 },
      { name: 'General Awareness', durationMinutes: 15, totalQuestions: 2 },
      { name: 'Quantitative Aptitude', durationMinutes: 15, totalQuestions: 2 }
    ],
    markingScheme: { correct: 2.0, incorrect: 0.5 },
    questions: [
      {
        id: 'q_ssc_1',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'Select the missing number in the following series:\n12, 23, 45, 89, 177, ?',
        options: ['353', '355', '351', '349'],
        correctOption: 0,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Number Series',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Pattern: (12 * 2) - 1 = 23; (23 * 2) - 1 = 45; (45 * 2) - 1 = 89; (89 * 2) - 1 = 177; (177 * 2) - 1 = 353.'
      },
      {
        id: 'q_ssc_2',
        type: 'mcq',
        section: 'General Intelligence & Reasoning',
        questionText: 'If "POLITY" is coded as "QNKNUX", how is "RIGHTS" coded in that language?',
        options: ['SJHITR', 'SHFISR', 'SHGIST', 'SJGIUR'],
        correctOption: 3,
        language: 'English',
        subject: 'Reasoning',
        topic: 'Coding Decoding',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Pattern alternates +1, -1, +1, -1 for adjacent letters.'
      },
      {
        id: 'q_ssc_3',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Who among the following was the founder of the Brahmo Samaj in 1828?',
        options: ['Swami Dayananda Saraswati', 'Raja Ram Mohan Roy', 'Ishwar Chandra Vidyasagar', 'Swami Vivekananda'],
        correctOption: 1,
        language: 'English',
        subject: 'History',
        topic: 'Socio-Religious Movements',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Raja Ram Mohan Roy founded Brahmo Sabha in 1828, later renamed Brahmo Samaj.'
      },
      {
        id: 'q_ssc_4',
        type: 'mcq',
        section: 'General Awareness',
        questionText: 'Which organ in the human body produces bile juice stored in the gallbladder?',
        options: ['Pancreas', 'Liver', 'Kidney', 'Stomach'],
        correctOption: 1,
        language: 'English',
        subject: 'General Science',
        topic: 'Human Anatomy',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Bile is synthesized by the liver and stored in the gallbladder.'
      },
      {
        id: 'q_ssc_5',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'A train 240 m long passes a telegraph post in 12 seconds. What is the speed of the train in km/h?',
        options: ['72 km/h', '60 km/h', '80 km/h', '54 km/h'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Speed, Time & Distance',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Speed = Distance / Time = 240 / 12 = 20 m/s. Convert to km/h: 20 * (18/5) = 72 km/h.'
      },
      {
        id: 'q_ssc_6',
        type: 'numerical',
        section: 'Quantitative Aptitude',
        questionText: 'If the simple interest on a sum of money at 8% per annum for 3 years is Rs. 1,200, find the principal sum.',
        options: ['Rs. 5,000', 'Rs. 4,500', 'Rs. 6,000', 'Rs. 5,500'],
        correctOption: 0,
        language: 'English',
        subject: 'Quantitative Aptitude',
        topic: 'Simple Interest',
        marks: 2.0,
        negativeMarks: 0.5,
        explanation: 'Principal P = (SI * 100) / (R * T) = (1200 * 100) / (8 * 3) = 120000 / 24 = Rs. 5,000.'
      }
    ]
  },
  {
    id: 'neet_ug_cbt_mock_01',
    title: 'NEET UG 2026 National Grand Diagnostic Mock Test (PCB Full Syllabus)',
    exam: 'NEET_UG',
    durationMinutes: 200,
    totalMarks: 720,
    sections: [
      { name: 'Physics', durationMinutes: 50, totalQuestions: 3 },
      { name: 'Chemistry', durationMinutes: 50, totalQuestions: 3 },
      { name: 'Biology (Botany & Zoology)', durationMinutes: 100, totalQuestions: 4 }
    ],
    markingScheme: { correct: 4.0, incorrect: 1.0 },
    questions: [
      {
        id: 'q_neet_1',
        type: 'mcq',
        section: 'Physics',
        questionText: 'A particle starts from the origin at t = 0 with an initial velocity of 5i m/s and moves in the x-y plane with a constant acceleration of (3i + 2j) m/s². At the instant its x-coordinate is 84 m, what is the y-coordinate of the particle?',
        options: ['36 m', '24 m', '48 m', '16 m'],
        correctOption: 0,
        language: 'English',
        subject: 'Physics',
        topic: 'Motion in a Plane',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Along x-axis: x = ux*t + 0.5*ax*t² => 84 = 5t + 1.5t² => t = 6 s. Along y-axis: y = uy*t + 0.5*ay*t² = 0 + 0.5*(2)*(6)² = 36 m.'
      },
      {
        id: 'q_neet_2',
        type: 'mcq',
        section: 'Physics',
        questionText: 'In a Young\'s double slit experiment, if the separation between the slits is halved and the distance between the slits and screen is doubled, what happens to the fringe width β?',
        options: ['Remains unchanged', 'Becomes four times', 'Becomes half', 'Becomes two times'],
        correctOption: 1,
        language: 'English',
        subject: 'Physics',
        topic: 'Wave Optics',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Fringe width β = λD/d. New β\' = λ(2D)/(d/2) = 4(λD/d) = 4β.'
      },
      {
        id: 'q_neet_3',
        type: 'mcq',
        section: 'Physics',
        questionText: 'An ideal gas undergoes an isothermal expansion from volume V1 to V2. The work done by the gas is given by:',
        options: ['nRT ln(V2/V1)', 'nRT (V2 - V1)', 'Zero', 'nCv(T2 - T1)'],
        correctOption: 0,
        language: 'English',
        subject: 'Physics',
        topic: 'Thermodynamics',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'For an isothermal process, W = ∫P dV = nRT ln(V2/V1).'
      },
      {
        id: 'q_neet_4',
        type: 'mcq',
        section: 'Chemistry',
        questionText: 'Which among the following species has the highest dipole moment?',
        options: ['NH3', 'NF3', 'BF3', 'CCl4'],
        correctOption: 0,
        language: 'English',
        subject: 'Chemistry',
        topic: 'Chemical Bonding',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'In NH3, the orbital dipole due to the lone pair is in the same direction as the N-H bond dipoles, resulting in a large net dipole moment.'
      },
      {
        id: 'q_neet_5',
        type: 'mcq',
        section: 'Chemistry',
        questionText: 'The oxidation state of chromium in potassium dichromate (K2Cr2O7) is:',
        options: ['+4', '+6', '+3', '+7'],
        correctOption: 1,
        language: 'English',
        subject: 'Chemistry',
        topic: 'Redox Reactions',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: '2(+1) + 2(x) + 7(-2) = 0 => 2 + 2x - 14 = 0 => 2x = 12 => x = +6.'
      },
      {
        id: 'q_neet_6',
        type: 'mcq',
        section: 'Chemistry',
        questionText: 'Which of the following organic compounds will give a positive Iodoform test upon warming with I2 and NaOH?',
        options: ['Methanol', 'Ethanol', 'Benzophenone', 'Diethylether'],
        correctOption: 1,
        language: 'English',
        subject: 'Chemistry',
        topic: 'Alcohols, Phenols & Ethers',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'Ethanol has CH3CH(OH)- group which oxidizes to ethanal CH3CHO containing the requisite methyl ketone moiety for positive iodoform test.'
      },
      {
        id: 'q_neet_7',
        type: 'mcq',
        section: 'Biology (Botany & Zoology)',
        questionText: 'During cellular respiration, which step produces the maximum number of ATP molecules via oxidative phosphorylation?',
        options: ['Glycolysis', 'Krebs Cycle (TCA cycle)', 'Electron Transport System (ETS)', 'Fermentation'],
        correctOption: 2,
        language: 'English',
        subject: 'Biology',
        topic: 'Respiration in Plants',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'The mitochondrial Electron Transport Chain and ATP synthase generate the bulk of cellular ATP (~28-32 ATP) via oxidative phosphorylation.'
      },
      {
        id: 'q_neet_8',
        type: 'mcq',
        section: 'Biology (Botany & Zoology)',
        questionText: 'Identify the hormone responsible for the maintenance of the corpus luteum and secretion of progesterone during early pregnancy:',
        options: ['hCG (Human Chorionic Gonadotropin)', 'Oxytocin', 'Prolactin', 'Relaxin'],
        correctOption: 0,
        language: 'English',
        subject: 'Biology',
        topic: 'Human Reproduction',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'hCG produced by the syncytiotrophoblast maintains the corpus luteum to prevent menstruation in early pregnancy.'
      },
      {
        id: 'q_neet_9',
        type: 'mcq',
        section: 'Biology (Botany & Zoology)',
        questionText: 'Which of the following restriction enzymes produces blunt ends during DNA cleavage?',
        options: ['EcoRI', 'HindIII', 'SmaI', 'BamHI'],
        correctOption: 2,
        language: 'English',
        subject: 'Biology',
        topic: 'Biotechnology: Principles and Processes',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'SmaI cuts straight down the center of CCC/GGG sequence producing blunt ends.'
      },
      {
        id: 'q_neet_10',
        type: 'mcq',
        section: 'Biology (Botany & Zoology)',
        questionText: 'According to Mendel\'s Law of Independent Assortment, the phenotypic ratio in a typical dihybrid cross in F2 generation is:',
        options: ['9:3:3:1', '3:1', '1:2:1', '9:7'],
        correctOption: 0,
        language: 'English',
        subject: 'Biology',
        topic: 'Principles of Inheritance and Variation',
        marks: 4.0,
        negativeMarks: 1.0,
        explanation: 'The standard Mendelian dihybrid F2 phenotypic ratio is 9:3:3:1.'
      }
    ]
  },
  {
    id: 'nda_na_cbt_mock_01',
    title: 'NDA & NA National Defence Academy All India Grand Mock Test 2026',
    exam: 'NDA_NA',
    durationMinutes: 150,
    totalMarks: 300,
    sections: [
      { name: 'Mathematics', durationMinutes: 90, totalQuestions: 3 },
      { name: 'General Ability Test (GAT)', durationMinutes: 60, totalQuestions: 3 }
    ],
    markingScheme: { correct: 2.5, incorrect: 0.83 },
    questions: [
      {
        id: 'q_nda_1',
        type: 'mcq',
        section: 'Mathematics',
        questionText: 'If the roots of the quadratic equation x² - 2kx + (k² - 1) = 0 lie between -2 and 4, find the range of real values of k:',
        options: ['-1 < k < 3', '-2 < k < 4', '0 < k < 2', '-3 < k < 1'],
        correctOption: 0,
        language: 'English',
        subject: 'Mathematics',
        topic: 'Quadratic Equations',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'Roots are x = k ± 1. For roots to lie between -2 and 4: k + 1 < 4 => k < 3 and k - 1 > -2 => k > -1 => -1 < k < 3.'
      },
      {
        id: 'q_nda_2',
        type: 'mcq',
        section: 'Mathematics',
        questionText: 'Find the derivative of f(x) = sin²(3x) with respect to x:',
        options: ['3 sin(6x)', '6 sin(3x)', '6 cos(3x)', 'sin(6x)'],
        correctOption: 0,
        language: 'English',
        subject: 'Mathematics',
        topic: 'Calculus & Derivatives',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'df/dx = 2 sin(3x) * cos(3x) * 3 = 3 * (2 sin 3x cos 3x) = 3 sin(6x).'
      },
      {
        id: 'q_nda_3',
        type: 'mcq',
        section: 'Mathematics',
        questionText: 'What is the sum of the first 20 terms of an arithmetic progression (AP) whose first term is 5 and common difference is 4?',
        options: ['860', '820', '900', '780'],
        correctOption: 0,
        language: 'English',
        subject: 'Mathematics',
        topic: 'Sequences and Series',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'S20 = (20/2) * [2(5) + (20 - 1)*4] = 10 * [10 + 76] = 10 * 86 = 860.'
      },
      {
        id: 'q_nda_4',
        type: 'mcq',
        section: 'General Ability Test (GAT)',
        questionText: 'Choose the antonym of the word "OBSTINATE":',
        options: ['Flexible', 'Stubborn', 'Rigid', 'Resolute'],
        correctOption: 0,
        language: 'English',
        subject: 'English',
        topic: 'Vocabulary & Antonyms',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'Obstinate means stubborn or unyielding; its direct antonym is Flexible.'
      },
      {
        id: 'q_nda_5',
        type: 'mcq',
        section: 'General Ability Test (GAT)',
        questionText: 'Who was the Commander-in-Chief of the Indian National Army (INA) formed during World War II?',
        options: ['Netaji Subhash Chandra Bose', 'Rash Behari Bose', 'Captain Mohan Singh', 'Bhagat Singh'],
        correctOption: 0,
        language: 'English',
        subject: 'History',
        topic: 'Modern Indian History',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'Netaji Subhash Chandra Bose reorganized and led the Azad Hind Fauj (INA).'
      },
      {
        id: 'q_nda_6',
        type: 'mcq',
        section: 'General Ability Test (GAT)',
        questionText: 'The sound waves in air are characterized as:',
        options: ['Longitudinal waves', 'Transverse waves', 'Electromagnetic waves', 'Polarized waves'],
        correctOption: 0,
        language: 'English',
        subject: 'General Science',
        topic: 'Physics - Waves & Sound',
        marks: 2.5,
        negativeMarks: 0.83,
        explanation: 'Sound waves in gases and air travel through compressions and rarefactions as longitudinal waves.'
      }
    ]
  }
];

export const INITIAL_COMMUNITY_GROUPS: CommunityGroup[] = [
  {
    id: 'grp_upsc_general',
    name: 'UPSC CSE 2026 Rankers Hub',
    description: 'Official community for UPSC Prelims & Mains strategy, PYQ discussions, and answer writing evaluation.',
    category: 'public',
    exam: 'UPSC_CSE',
    memberCount: 14820,
    isJoined: true,
    isPinned: true,
    icon: 'ShieldCheck'
  },
  {
    id: 'grp_polity_masters',
    name: 'Polity & Governance Special Circle',
    description: 'Focused discussions on Laxmikanth, Supreme Court landmark judgements, and Article breakdowns.',
    category: 'subject',
    exam: 'UPSC_CSE',
    memberCount: 8930,
    isJoined: true,
    isPinned: false,
    icon: 'BookOpen'
  },
  {
    id: 'grp_ssc_tier1',
    name: 'SSC CGL 2026 Speed & Accuracy Warriors',
    description: 'Daily Quant shortcuts, Reasoning puzzles, and English grammar quiz challenges.',
    category: 'public',
    exam: 'SSC_CGL',
    memberCount: 12450,
    isJoined: false,
    isPinned: false,
    icon: 'Zap'
  },
  {
    id: 'grp_mains_answer_peer',
    name: 'Mains GS Answer Writing Peer Review Group',
    description: 'Daily 2 GS questions posted at 9 AM. Submit handwritten answers & peer review fellow aspirants.',
    category: 'mentor',
    exam: 'UPSC_CSE',
    memberCount: 4210,
    isJoined: true,
    isPinned: true,
    icon: 'FileText'
  }
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post_101',
    groupId: 'grp_upsc_general',
    groupName: 'UPSC CSE 2026 Rankers Hub',
    authorId: 'usr_mentor_01',
    authorName: 'Dr. Vivek Sharma (Ex-IAS Mentor)',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    authorRole: 'Chief Mentor',
    title: 'How to master Article 32 vs Article 226 Writs for Prelims & Mains 2026',
    content: 'Aspirants often confuse Habeas Corpus and Quo-Warranto scope under Article 226 vs Article 32.\n\nKey Takeaways:\n1. Supreme Court can issue writs ONLY for Fundamental Rights (Art 32).\n2. High Courts can issue writs for FRs AND "any other purpose" (Art 226) - making HC writ jurisdiction broader in scope!\n3. Article 32 itself is a Fundamental Right, while Article 226 is discretionary.\n\nReview the attached summary notes PDF below for complete tabular comparison.',
    tags: ['Polity', 'Prelims2026', 'Writs', 'Article32'],
    createdAt: '2 hours ago',
    likesCount: 342,
    repliesCount: 48,
    isLiked: true,
    isBookmarked: true,
    isPinned: true,
    attachments: [
      {
        name: 'Article_32_vs_226_Writ_Jurisdiction_Notes.pdf',
        type: 'pdf',
        url: '#',
        size: '1.2 MB'
      }
    ],
    poll: {
      question: 'Under which Article can a writ be issued for non-fundamental legal rights?',
      options: [
        { id: 'opt_1', text: 'Article 32 only', votes: 12 },
        { id: 'opt_2', text: 'Article 226 only', votes: 184 },
        { id: 'opt_3', text: 'Both Article 32 & 226', votes: 45 },
        { id: 'opt_4', text: 'Article 142 only', votes: 8 }
      ],
      totalVotes: 249,
      userVotedOptionId: 'opt_2'
    }
  },
  {
    id: 'post_102',
    groupId: 'grp_mains_answer_peer',
    groupName: 'Mains GS Answer Writing Peer Review Group',
    authorId: 'usr_topper_23',
    authorName: 'Priya Verma (AIR 48 Aspirant)',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    authorRole: 'Top Contributor',
    title: 'Daily Mains Challenge: "Cooperative Federalism vs Competitive Federalism in India"',
    content: 'Question: "Examine how fiscal devolution via the Finance Commission has shifted the Indian federal dynamic from cooperative federalism towards competitive federalism." (15 Marks, 250 Words)\n\nPlease review my intro & structure diagram below! Open to critical feedback on keywords & way forward.',
    tags: ['GS2', 'Federalism', 'FinanceCommission', 'MainsAnswer'],
    createdAt: '5 hours ago',
    likesCount: 128,
    repliesCount: 19,
    isLiked: false,
    isBookmarked: false,
    isPinned: false
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    userId: 'user_default',
    title: 'Daily Study Target Alert 🎯',
    message: 'You have completed 6.5 hours out of your 10.0 hours study target today! 3.5 hours remaining.',
    type: 'study_reminder',
    read: false,
    createdAt: '10 minutes ago'
  },
  {
    id: 'notif_2',
    userId: 'user_default',
    title: 'New CBT All India Mock Test Released!',
    message: 'UPSC CSE All India Grand Mock Test 2026 (GS Paper 1) is live now. Attempt now to benchmark your national rank.',
    type: 'mock_test',
    read: false,
    createdAt: '1 hour ago',
    actionUrl: 'cbt'
  },
  {
    id: 'notif_3',
    userId: 'user_default',
    title: 'AI Predictor Revision Milestone',
    message: 'Based on your recent study pace, you are 2 days ahead of your syllabus schedule for UPSC 2026!',
    type: 'ai_suggestion',
    read: true,
    createdAt: '1 day ago'
  }
];
