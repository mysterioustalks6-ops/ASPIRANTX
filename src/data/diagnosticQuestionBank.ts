export interface DiagnosticQuestion {
  id: number;
  exam: string;
  subject: string;
  topic: string;
  question: string;
  answer?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const DIAGNOSTIC_QUESTION_BANK: DiagnosticQuestion[] = [
  // ==========================================
  // 1. NEET_UG
  // ==========================================
  // Physics (5 distinct topics)
  {
    id: 101,
    exam: 'NEET_UG',
    subject: 'Physics',
    topic: 'Mechanics — Work, Energy & Rotational Motion',
    question: 'A solid cylinder of mass M and radius R rolls down an inclined plane of height h without slipping. What is its linear velocity at the bottom?',
    options: ['√(2gh)', '√(4gh / 3)', '√(gh)', '√(3gh / 4)'],
    correctAnswer: 1,
    explanation: 'By conservation of energy: Mgh = (1/2)Mv² + (1/2)Iω². For a solid cylinder I = (1/2)MR² and ω = v/R. Hence Mgh = (3/4)Mv² => v = √(4gh/3).'
  },
  {
    id: 102,
    exam: 'NEET_UG',
    subject: 'Physics',
    topic: 'Ray & Wave Optics — Refraction & Critical Angle',
    question: 'When light travels from an optically denser medium (refractive index μ1) to a rarer medium (μ2), the Critical Angle (ic) satisfies:',
    options: ['sin(ic) = μ1 / μ2', 'sin(ic) = μ2 / μ1', 'cos(ic) = μ2 / μ1', 'tan(ic) = μ1 / μ2'],
    correctAnswer: 1,
    explanation: 'By Snell’s law at critical angle: μ1 · sin(ic) = μ2 · sin(90°) => sin(ic) = μ2 / μ1.'
  },
  {
    id: 103,
    exam: 'NEET_UG',
    subject: 'Physics',
    topic: 'Electrodynamics — Electromagnetic Induction & Lenz Law',
    question: 'A bar magnet is dropped vertically along the axis of a horizontal conducting copper ring. The acceleration of the falling magnet is:',
    options: ['Equal to g', 'Greater than g', 'Less than g', 'Zero'],
    correctAnswer: 2,
    explanation: 'As the magnet falls, changing magnetic flux induces a current in the ring which creates an opposing magnetic field (Lenz’s Law), exerting an upward retarding force. Hence a < g.'
  },
  {
    id: 104,
    exam: 'NEET_UG',
    subject: 'Physics',
    topic: 'Thermodynamics & Kinetic Theory of Gases',
    question: 'For an ideal diatomic gas at room temperature with rigid molecules (no vibrational modes), the ratio of molar heat capacities (γ = Cp / Cv) is:',
    options: ['5/3', '7/5', '4/3', '9/7'],
    correctAnswer: 1,
    explanation: 'A diatomic gas has 5 degrees of freedom (3 translational + 2 rotational). Cv = (5/2)R, Cp = (7/2)R => γ = Cp/Cv = 7/5 = 1.4.'
  },
  {
    id: 105,
    exam: 'NEET_UG',
    subject: 'Physics',
    topic: 'Modern Physics — Photoelectric Effect & Photons',
    question: 'In a photoelectric effect experiment, if the frequency of incident radiation is doubled while keeping intensity constant, the stopping potential will:',
    options: ['Become double', 'Become more than double', 'Become half', 'Remain unchanged'],
    correctAnswer: 1,
    explanation: 'Einstein’s equation: e·Vs = hν - Φ => Vs = (h/e)ν - (Φ/e). When ν doubles: Vs\' = 2(h/e)ν - Φ/e = 2Vs + (Φ/e), which is strictly greater than 2Vs.'
  },

  // Chemistry (5 distinct topics)
  {
    id: 106,
    exam: 'NEET_UG',
    subject: 'Chemistry',
    topic: 'Organic Chemistry — Hydrocarbons & Ozonolysis',
    question: 'Reductive ozonolysis of 2-Methylbut-2-ene followed by treatment with Zn/H2O yields:',
    options: ['Propanone and Ethanal', 'Ethanal and Methanal', 'Butanone and Methanal', 'Propanal and Methanal'],
    correctAnswer: 0,
    explanation: '2-Methylbut-2-ene is (CH3)2C=CH-CH3. Cleaving the double bond oxidatively/reductively yields Propanone ((CH3)2C=O) and Ethanal (CH3-CHO).'
  },
  {
    id: 107,
    exam: 'NEET_UG',
    subject: 'Chemistry',
    topic: 'Chemical Bonding — Hybridization & Molecular Geometry',
    question: 'According to VSEPR theory, the molecular shape and hybridization of the central atom in SF4 are respectively:',
    options: ['Square planar, dsp2', 'See-saw, sp3d', 'Tetrahedral, sp3', 'Trigonal bipyramidal, sp3d'],
    correctAnswer: 1,
    explanation: 'Sulfur has 6 valence electrons; 4 bonding pairs + 1 lone pair = steric number 5 (sp3d hybridization). The lone pair occupies an equatorial position giving a See-saw geometry.'
  },
  {
    id: 108,
    exam: 'NEET_UG',
    subject: 'Chemistry',
    topic: 'Chemical Thermodynamics & Equilibrium',
    question: 'For the exothermic synthesis of ammonia: N2(g) + 3H2(g) ⇌ 2NH3(g) (ΔH < 0), which condition favors maximum yield of NH3 at equilibrium?',
    options: ['High temperature, Low pressure', 'Low temperature, High pressure', 'High temperature, High pressure', 'Low temperature, Low pressure'],
    correctAnswer: 1,
    explanation: 'By Le Chatelier’s principle, lowering temperature favors the exothermic forward reaction, and increasing pressure shifts equilibrium towards fewer moles of gas (4 mol -> 2 mol).'
  },
  {
    id: 109,
    exam: 'NEET_UG',
    subject: 'Chemistry',
    topic: 'Coordination Chemistry & d-Block Elements',
    question: 'Which of the following coordination complexes is diamagnetic and forms a low-spin inner orbital complex?',
    options: ['[Fe(H2O)6]2+', '[Co(NH3)6]3+', '[FeF6]3-', '[NiCl4]2-'],
    correctAnswer: 1,
    explanation: 'In [Co(NH3)6]3+, Co3+ is a d6 ion. NH3 acts as a strong field ligand causing electron pairing (t2g6 eg0), forming a diamagnetic low-spin d2sp3 complex.'
  },
  {
    id: 110,
    exam: 'NEET_UG',
    subject: 'Chemistry',
    topic: 'Electrochemistry & Chemical Kinetics',
    question: 'For a first-order reaction, the time required to complete 99.9% of the reaction (t99.9%) is approximately related to half-life (t1/2) by:',
    options: ['t99.9% = 3 · t1/2', 't99.9% = 10 · t1/2', 't99.9% = 6.64 · t1/2', 't99.9% = 100 · t1/2'],
    correctAnswer: 1,
    explanation: 'k = 0.693/t1/2. For 99.9% completion: t99.9% = (2.303/k) · log10(100/0.1) = (2.303/k) · log10(1000) = (2.303 · 3)/k ≈ 10 · t1/2.'
  },

  // Biology (5 distinct topics)
  {
    id: 111,
    exam: 'NEET_UG',
    subject: 'Biology',
    topic: 'Human Physiology — Digestion & Digestive Enzymes',
    question: 'Which of the following secretions contains bile salts for fat emulsification but NO digestive enzymes?',
    options: ['Gastric juice', 'Pancreatic juice', 'Bile juice', 'Succus entericus'],
    correctAnswer: 2,
    explanation: 'Bile juice secreted by the liver contains bile pigments (bilirubin/biliverdin) and bile salts (sodium taurocholate/glycocholate), but lacks any hydrolytic enzymes.'
  },
  {
    id: 112,
    exam: 'NEET_UG',
    subject: 'Biology',
    topic: 'Genetics & Molecular Biology — Transcription & Genetic Code',
    question: 'During transcription in prokaryotes, which subunit of RNA polymerase is responsible for promoter recognition and initiation specificity?',
    options: ['Alpha (α) subunit', 'Beta (β) subunit', 'Sigma (σ) factor', 'Rho (ρ) factor'],
    correctAnswer: 2,
    explanation: 'The Sigma factor (σ) confers promoter specificity to the RNA polymerase core enzyme for initiation. Rho (ρ) is involved in termination.'
  },
  {
    id: 113,
    exam: 'NEET_UG',
    subject: 'Biology',
    topic: 'Plant Physiology — Photosynthesis & C3/C4 Pathway',
    question: 'The primary CO2 acceptor in C4 plants (such as Maize and Sugarcane) located in mesophyll cells is:',
    options: ['RuBP (Ribulose 1,5-bisphosphate)', 'PEP (Phosphoenolpyruvate)', 'OAA (Oxaloacetic acid)', 'PGA (3-Phosphoglyceric acid)'],
    correctAnswer: 1,
    explanation: 'In C4 plants, PEP (3-carbon molecule) is the primary CO2 acceptor in mesophyll cells catalyzed by PEP carboxylase, forming 4-carbon OAA.'
  },
  {
    id: 114,
    exam: 'NEET_UG',
    subject: 'Biology',
    topic: 'Ecology & Environment — Ecosystem Energetics & Biomagnification',
    question: 'In aquatic food chains, biomagnification of persistent non-biodegradable toxic pollutants (such as DDT and Mercury) is highest in:',
    options: ['Phytoplankton', 'Zooplankton', 'Small fish', 'Top predatory fish-eating birds'],
    correctAnswer: 3,
    explanation: 'Because DDT cannot be metabolized or excreted, its concentration multiplies at each successive trophic level, reaching maximum toxicity in apex consumers (fish-eating birds).'
  },
  {
    id: 115,
    exam: 'NEET_UG',
    subject: 'Biology',
    topic: 'Cell Biology — Cell Cycle & Mitosis/Meiosis',
    question: 'Recombination nodules and crossing over between non-sister chromatids of homologous chromosomes occur during which stage of Prophase I?',
    options: ['Leptotene', 'Zygotene', 'Pachytene', 'Diplotene'],
    correctAnswer: 2,
    explanation: 'Crossing over is mediated by the recombinase enzyme complex during the Pachytene stage of Meiosis I.'
  },

  // ==========================================
  // 2. NDA_NA
  // ==========================================
  // Mathematics (5 distinct topics)
  {
    id: 201,
    exam: 'NDA_NA',
    subject: 'Mathematics',
    topic: 'Calculus — Differentiation & Chain Rule',
    question: 'What is the derivative of sin(x°) with respect to x (where x is in degrees)?',
    options: ['cos(x°)', '(π/180) cos(x°)', '-(π/180) cos(x°)', '180/π cos(x°)'],
    correctAnswer: 1,
    explanation: 'Convert degrees to radians: x° = (π/180)x rad. d/dx [sin(πx/180)] = (π/180) cos(πx/180) = (π/180) cos(x°).'
  },
  {
    id: 202,
    exam: 'NDA_NA',
    subject: 'Mathematics',
    topic: 'Integral Calculus — Definite Integrals & Properties',
    question: 'The value of the definite integral ∫_{-π/2}^{π/2} (x³ + x·cos(x) + sin⁵(x) + 1) dx is equal to:',
    options: ['0', 'π', '2π', '1'],
    correctAnswer: 1,
    explanation: 'The functions x³, x·cos(x), and sin⁵(x) are odd functions whose symmetric integrals from -a to +a evaluate to 0. Thus the integral simplifies to ∫_{-π/2}^{π/2} 1 dx = π.'
  },
  {
    id: 203,
    exam: 'NDA_NA',
    subject: 'Mathematics',
    topic: 'Trigonometry — Heights, Distances & Identities',
    question: 'If tan(A) = 1/2 and tan(B) = 1/3, what is the value of (A + B)?',
    options: ['π/6', 'π/4', 'π/3', 'π/2'],
    correctAnswer: 1,
    explanation: 'tan(A+B) = [tan(A) + tan(B)] / [1 - tan(A)tan(B)] = (1/2 + 1/3) / (1 - 1/6) = (5/6) / (5/6) = 1 => A + B = π/4 (45°).'
  },
  {
    id: 204,
    exam: 'NDA_NA',
    subject: 'Mathematics',
    topic: 'Matrices & Determinants — Properties & Inverses',
    question: 'If A is a square matrix of order 3 × 3 with determinant |A| = 4, then the value of |adj(A)| is:',
    options: ['4', '12', '16', '64'],
    correctAnswer: 2,
    explanation: 'For any n × n square matrix, |adj(A)| = |A|^(n - 1). Here n = 3, so |adj(A)| = 4^(3 - 1) = 4² = 16.'
  },
  {
    id: 205,
    exam: 'NDA_NA',
    subject: 'Mathematics',
    topic: 'Vector Algebra & 3D Geometry',
    question: 'If two unit vectors â and b̂ are inclined at an angle θ, then |â - b̂| is equal to:',
    options: ['2 sin(θ/2)', '2 cos(θ/2)', 'sin(θ)', 'cos(θ)'],
    correctAnswer: 0,
    explanation: '|â - b̂|² = |â|² + |b̂|² - 2(â · b̂) = 1 + 1 - 2 cos(θ) = 2(1 - cos θ) = 4 sin²(θ/2) => |â - b̂| = 2 sin(θ/2).'
  },

  // General Ability (5 distinct topics)
  {
    id: 206,
    exam: 'NDA_NA',
    subject: 'General Ability',
    topic: 'English — Spotting Errors & Prepositions',
    question: 'Identify the segment with an error: "The officer was / senior than / all his colleagues in the regiment."',
    options: ['The officer was', 'senior than', 'all his colleagues', 'in the regiment'],
    correctAnswer: 1,
    explanation: 'Adjectives ending in "-ior" (senior, junior, prior, superior, inferior) take the preposition "to", not "than". Correct phrasing: "senior to".'
  },
  {
    id: 207,
    exam: 'NDA_NA',
    subject: 'General Ability',
    topic: 'History — Indian National Movement',
    question: 'The historic resolution on "Purna Swaraj" (Complete Independence) was passed under the presidency of Jawaharlal Nehru at which Congress session?',
    options: ['Calcutta Session 1928', 'Lahore Session 1929', 'Karachi Session 1931', 'Tripuri Session 1939'],
    correctAnswer: 1,
    explanation: 'In December 1929 at the Lahore Session, the Indian National Congress declared Purna Swaraj as its official goal and hoisted the tricolour on the banks of River Ravi.'
  },
  {
    id: 208,
    exam: 'NDA_NA',
    subject: 'General Ability',
    topic: 'Geography — Earth Atmosphere & Oceanic Currents',
    question: 'In which atmospheric layer do all major weather phenomena (clouds, rainfall, storms) occur?',
    options: ['Stratosphere', 'Troposphere', 'Mesosphere', 'Thermosphere'],
    correctAnswer: 1,
    explanation: 'The Troposphere is the lowest atmospheric layer containing ~75% of atmospheric mass and almost all water vapor, driving all meteorological phenomena.'
  },
  {
    id: 209,
    exam: 'NDA_NA',
    subject: 'General Ability',
    topic: 'Physics — Mechanics & Newton’s Laws',
    question: 'A heavy object and a light object possess equal kinetic energy. Which one has greater linear momentum?',
    options: ['The lighter object', 'The heavier object', 'Both have equal momentum', 'Cannot be determined without velocity'],
    correctAnswer: 1,
    explanation: 'Linear momentum p = √(2m·K). Since Kinetic Energy K is identical for both, momentum p ∝ √m. Hence the heavier body possesses greater momentum.'
  },
  {
    id: 210,
    exam: 'NDA_NA',
    subject: 'General Ability',
    topic: 'Indian Polity & National Defence Framework',
    question: 'Who is the Supreme Commander of the Indian Armed Forces according to Article 53(2) of the Constitution?',
    options: ['Prime Minister of India', 'Chief of Defence Staff (CDS)', 'President of India', 'Union Defence Minister'],
    correctAnswer: 2,
    explanation: 'Under Article 53(2), the Supreme Command of the Defence Forces of the Union is vested in the President of India and the exercise thereof is regulated by law.'
  },

  // ==========================================
  // 3. UPSC_CSE
  // ==========================================
  // Polity & Governance (5 distinct topics)
  {
    id: 301,
    exam: 'UPSC_CSE',
    subject: 'Polity & Governance',
    topic: 'Constitutional Framework — Preamble & Basic Structure',
    question: 'Which landmark Supreme Court judgment established the doctrine that Parliament cannot alter the "Basic Structure" of the Indian Constitution?',
    options: ['Golaknath v. State of Punjab (1967)', 'Kesavananda Bharati v. State of Kerala (1973)', 'Minerva Mills v. Union of India (1980)', 'Maneka Gandhi v. Union of India (1978)'],
    correctAnswer: 1,
    explanation: 'In the 1973 Kesavananda Bharati verdict, a 13-judge constitutional bench ruled that Article 368 does not grant Parliament power to abrogate the Basic Structure of the Constitution.'
  },
  {
    id: 302,
    exam: 'UPSC_CSE',
    subject: 'Polity & Governance',
    topic: 'Fundamental Rights & Judicial Writs',
    question: 'Which writ is issued by the High Court or Supreme Court to quash the order of an inferior court or tribunal that acted without jurisdiction?',
    options: ['Habeas Corpus', 'Mandamus', 'Certiorari', 'Quo-Warranto'],
    correctAnswer: 2,
    explanation: 'The writ of Certiorari is corrective in nature, issued to an inferior judicial or quasi-judicial body to quash orders passed in excess or absence of jurisdiction.'
  },
  {
    id: 303,
    exam: 'UPSC_CSE',
    subject: 'Polity & Governance',
    topic: 'Parliamentary System & Legislative Procedure',
    question: 'Under Article 110, if any question arises whether a Bill is a Money Bill or not, the decision of which authority is final?',
    options: ['President of India', 'Speaker of the Lok Sabha', 'Chairman of the Rajya Sabha', 'Union Finance Minister'],
    correctAnswer: 1,
    explanation: 'Article 110(3) explicitly provides that the decision of the Speaker of the House of the People (Lok Sabha) shall be final regarding certification of a Money Bill.'
  },
  {
    id: 304,
    exam: 'UPSC_CSE',
    subject: 'Polity & Governance',
    topic: 'Federalism & Inter-State Relations',
    question: 'Under Article 263, an Inter-State Council to inquire into and advise upon disputes between States can be established by:',
    options: ['An Act of Parliament', 'Order of the President', 'Resolution of NITI Aayog', 'Supreme Court directive'],
    correctAnswer: 1,
    explanation: 'Article 263 empowers the President of India to establish an Inter-State Council if at any time it appears that public interests would be served.'
  },
  {
    id: 305,
    exam: 'UPSC_CSE',
    subject: 'Polity & Governance',
    topic: 'Constitutional Bodies — Election Commission & CAG',
    question: 'The Comptroller and Auditor General (CAG) of India can be removed from office only on grounds and in the manner prescribed for:',
    options: ['A Judge of the Supreme Court', 'A Governor of a State', 'A Cabinet Secretary', 'Chief Election Commissioner alone'],
    correctAnswer: 0,
    explanation: 'Under Article 148(1), the CAG can be removed from office only in like manner and on like grounds as a Judge of the Supreme Court (proven misbehaviour or incapacity via parliamentary address).'
  },

  // Economy & Development (5 distinct topics)
  {
    id: 306,
    exam: 'UPSC_CSE',
    subject: 'Economy & Development',
    topic: 'Monetary Policy — Liquidity Management & Inflation',
    question: 'When the Reserve Bank of India (RBI) conducts Open Market Sales (sells G-Secs) in the market, its primary objective is to:',
    options: ['Inject rupee liquidity into banks', 'Absorb excess rupee liquidity and curb inflation', 'Depreciate the exchange rate', 'Reduce the statutory CRR requirement'],
    correctAnswer: 1,
    explanation: 'Selling government securities drains liquidity from commercial banks into the RBI vault, contractionary monetary policy intended to curb inflationary pressures.'
  },
  {
    id: 307,
    exam: 'UPSC_CSE',
    subject: 'Economy & Development',
    topic: 'Fiscal Policy — Budget Deficits & Taxation',
    question: 'Effective Revenue Deficit (ERD) excludes which of the following components from the standard Revenue Deficit?',
    options: ['Interest payments on public debt', 'Grants for creation of capital assets to States', 'Subsidies on food and fertilizers', 'Defence operational pensions'],
    correctAnswer: 1,
    explanation: 'Effective Revenue Deficit = Revenue Deficit - Grants for creation of capital assets. It recognizes that grants which create durable physical assets should not count as pure revenue consumption.'
  },
  {
    id: 308,
    exam: 'UPSC_CSE',
    subject: 'Economy & Development',
    topic: 'External Sector — Balance of Payments & Forex',
    question: 'Which of the following items is recorded in the "Capital Account" of India’s Balance of Payments (BoP)?',
    options: ['Software export earnings', 'Foreign Direct Investment (FDI) inflows', 'Workers’ inward remittances from Gulf', 'Interest payments on external commercial borrowings'],
    correctAnswer: 1,
    explanation: 'FDI and FPI inflows alter international financial asset/liability positions and are classified under the Capital Account. Remittances and service exports belong to the Current Account.'
  },
  {
    id: 309,
    exam: 'UPSC_CSE',
    subject: 'Economy & Development',
    topic: 'Agriculture & Food Economics — Minimum Support Price',
    question: 'The Minimum Support Price (MSP) for mandated crops in India is announced based on the recommendations of:',
    options: ['NITI Aayog', 'Commission for Agricultural Costs and Prices (CACP)', 'Food Corporation of India (FCI)', 'NABARD'],
    correctAnswer: 1,
    explanation: 'The CACP is an attached office of the Ministry of Agriculture that calculates cost metrics (A2+FL, C2) and submits annual price policy reports recommending MSPs.'
  },
  {
    id: 310,
    exam: 'UPSC_CSE',
    subject: 'Economy & Development',
    topic: 'National Income Accounting — GDP Deflator & Inflation',
    question: 'How does the GDP Deflator differ conceptually from the Consumer Price Index (CPI)?',
    options: ['GDP deflator includes prices of imported consumer goods', 'GDP deflator measures price changes of all domestically produced goods & services', 'GDP deflator assigns fixed static basket weights', 'CPI excludes consumer food items'],
    correctAnswer: 1,
    explanation: 'GDP Deflator = (Nominal GDP / Real GDP) × 100. It covers all domestically produced output with dynamically changing weights, whereas CPI tracks a fixed consumer consumption basket including imports.'
  },

  // ==========================================
  // 4. SSC_CGL
  // ==========================================
  // Quantitative Aptitude (5 distinct topics)
  {
    id: 401,
    exam: 'SSC_CGL',
    subject: 'Quantitative Aptitude',
    topic: 'Number System — Divisibility & Modular Remainders',
    question: 'What is the remainder when (7^19 + 2) is divided by 6?',
    options: ['1', '2', '3', '0'],
    correctAnswer: 2,
    explanation: 'Since 7 ≡ 1 (mod 6), we have 7^19 ≡ 1^19 = 1 (mod 6). Therefore (7^19 + 2) ≡ (1 + 2) = 3 (mod 6).'
  },
  {
    id: 402,
    exam: 'SSC_CGL',
    subject: 'Quantitative Aptitude',
    topic: 'Profit, Loss & Successive Discounts',
    question: 'A shopkeeper marks an article 40% above cost price and allows a discount of 20% on the marked price. His net profit percentage is:',
    options: ['12%', '15%', '20%', '24%'],
    correctAnswer: 0,
    explanation: 'Let CP = 100. MP = 140. SP after 20% discount = 140 × 0.8 = 112. Profit = 112 - 100 = 12%.'
  },
  {
    id: 403,
    exam: 'SSC_CGL',
    subject: 'Quantitative Aptitude',
    topic: 'Time, Speed & Distance — Relative Velocity of Trains',
    question: 'A train 180 m long running at 54 km/h crosses a man running at 6 km/h in the opposite direction in how many seconds?',
    options: ['9 seconds', '10.8 seconds', '12 seconds', '15 seconds'],
    correctAnswer: 1,
    explanation: 'Relative speed = 54 + 6 = 60 km/h = 60 × (5/18) = 50/3 m/s. Time = Distance / Speed = 180 / (50/3) = (180 × 3) / 50 = 540 / 50 = 10.8 s.'
  },
  {
    id: 404,
    exam: 'SSC_CGL',
    subject: 'Quantitative Aptitude',
    topic: 'Geometry & Mensuration — Circles & Tangent Properties',
    question: 'From an external point P, two tangents PA and PB are drawn to a circle with center O. If ∠APB = 70°, then ∠AOB is equal to:',
    options: ['110°', '120°', '140°', '90°'],
    correctAnswer: 0,
    explanation: 'In quadrilateral OAPB, radius is perpendicular to tangent at point of contact (∠OAP = ∠OBP = 90°). Thus ∠AOB + ∠APB = 180° => ∠AOB = 180° - 70° = 110°.'
  },
  {
    id: 405,
    exam: 'SSC_CGL',
    subject: 'Quantitative Aptitude',
    topic: 'Algebra — Algebraic Identities & Simplification',
    question: 'If x + (1/x) = 4, then the numerical value of x³ + (1/x³) is:',
    options: ['52', '64', '48', '56'],
    correctAnswer: 0,
    explanation: 'Formula: x³ + (1/x³) = [x + (1/x)]³ - 3[x + (1/x)] = 4³ - 3(4) = 64 - 12 = 52.'
  },

  // General Intelligence & Reasoning (5 distinct topics)
  {
    id: 406,
    exam: 'SSC_CGL',
    subject: 'General Intelligence & Reasoning',
    topic: 'Syllogism — Logical Deduction & Quantifiers',
    question: 'Statements: All Mangoes are Fruits. Some Fruits are Sweet. Conclusions: I. Some Mangoes are Sweet. II. All Sweet things are Fruits.',
    options: ['Only conclusion I follows', 'Only conclusion II follows', 'Neither I nor II follows', 'Both I and II follow'],
    correctAnswer: 2,
    explanation: 'The middle term "Fruits" is not distributed in both premises. Hence no definitive universal conclusion between Mangoes and Sweet follows.'
  },
  {
    id: 407,
    exam: 'SSC_CGL',
    subject: 'General Intelligence & Reasoning',
    topic: 'Analogy & Classification — Semantic & Alphanumeric Pairs',
    question: 'Select the related number from the given alternatives: 12 : 140 :: 15 : ?',
    options: ['215', '220', '225', '210'],
    correctAnswer: 0,
    explanation: 'Pattern: n : (n² - 4). For 12: 12² - 4 = 144 - 4 = 140. For 15: 15² - 10 or (n · (n - 1) + 8). Checking n² - n pattern: 12 × 12 - 4 = 140; 15² - 10 = 215.'
  },
  {
    id: 408,
    exam: 'SSC_CGL',
    subject: 'General Intelligence & Reasoning',
    topic: 'Blood Relations — Decoded Family Relations',
    question: 'Pointing to a gentleman, Deepak said, "His only brother is the father of my daughter\'s father." How is the gentleman related to Deepak?',
    options: ['Father', 'Uncle (Paternal)', 'Grandfather', 'Brother'],
    correctAnswer: 1,
    explanation: '"My daughter\'s father" is Deepak himself. "His only brother is the father of Deepak" => The gentleman’s brother is Deepak’s father, making the gentleman Deepak’s Uncle.'
  },
  {
    id: 409,
    exam: 'SSC_CGL',
    subject: 'General Intelligence & Reasoning',
    topic: 'Direction & Distance Sense',
    question: 'A cyclist travels 12 km South, turns right and rides 5 km, then turns right again and rides 12 km. How far and in which direction is he from his starting point?',
    options: ['5 km West', '5 km East', '13 km South-West', '7 km West'],
    correctAnswer: 0,
    explanation: 'Moving 12 km South, then 5 km West (right turn), then 12 km North (right turn) cancels the North-South displacement, leaving him 5 km West of start.'
  },
  {
    id: 410,
    exam: 'SSC_CGL',
    subject: 'General Intelligence & Reasoning',
    topic: 'Coding-Decoding — Alphabet Shift Matrix',
    question: 'In a certain code language, if "STATION" is coded as "URCVKQP", how will "JOURNEY" be coded in that language?',
    options: ['LQWTPGA', 'LQWTOGB', 'LPWTOGA', 'MQWTPGA'],
    correctAnswer: 0,
    explanation: 'Each letter is shifted forward by +2: J->L, O->Q, U->W, R->T, N->P, E->G, Y->A => LQWTPGA.'
  },

  // English Comprehension (5 distinct topics)
  {
    id: 411,
    exam: 'SSC_CGL',
    subject: 'English Comprehension',
    topic: 'Grammar — Subject-Verb Agreement',
    question: 'Identify the grammatically correct sentence:',
    options: [
      'Neither the principal nor the teachers was present at the seminar.',
      'Neither the principal nor the teachers were present at the seminar.',
      'Neither the principal or the teachers were present.',
      'Neither the principal nor the teachers is present.'
    ],
    correctAnswer: 1,
    explanation: 'When subjects are connected by "neither... nor", the verb agrees with the nearest subject. "teachers" is plural, so plural verb "were" is required.'
  },
  {
    id: 412,
    exam: 'SSC_CGL',
    subject: 'English Comprehension',
    topic: 'Active & Passive Voice Transformation',
    question: 'Select the correct passive form: "The chef prepared a delectable five-course meal for the delegates."',
    options: [
      'A delectable five-course meal was prepared by the chef for the delegates.',
      'A delectable five-course meal had been prepared by the chef for the delegates.',
      'A delectable five-course meal is prepared by the chef for the delegates.',
      'A delectable five-course meal was being prepared by the chef.'
    ],
    correctAnswer: 0,
    explanation: 'Past simple active (prepared) converts to past simple passive (was/were + V3: was prepared).'
  },
  {
    id: 413,
    exam: 'SSC_CGL',
    subject: 'English Comprehension',
    topic: 'Idioms & Phrases — Contextual Meaning',
    question: 'What is the true meaning of the idiom "To burn the candle at both ends"?',
    options: [
      'To waste money recklessly on luxuries',
      'To work exhausting hours from early morning till late night',
      'To illuminate a dark room with multiple sources',
      'To cause intentional damage to property'
    ],
    correctAnswer: 1,
    explanation: '"Burning the candle at both ends" means exhausting one\'s energy or health by overworking continuously from morning till late night.'
  },
  {
    id: 414,
    exam: 'SSC_CGL',
    subject: 'English Comprehension',
    topic: 'Vocabulary — One Word Substitution',
    question: 'Choose the one-word substitute for: "A person who is indifferent to both pleasure and pain."',
    options: ['Stoic', 'Epicurean', 'Hedonist', 'Altruist'],
    correctAnswer: 0,
    explanation: 'A Stoic is a person who can endure pain or hardship without showing feelings or complaining.'
  },
  {
    id: 415,
    exam: 'SSC_CGL',
    subject: 'English Comprehension',
    topic: 'Vocabulary & Synonyms / Antonyms',
    question: 'Select the most appropriate SYNONYM of the word: "EPHEMERAL"',
    options: ['Eternal', 'Transient', 'Permanent', 'Enduring'],
    correctAnswer: 1,
    explanation: '"Ephemeral" means lasting for a very short time. "Transient", "fleeting", and "momentary" are exact synonyms.'
  },

  // ==========================================
  // 5. JEE_MAIN (Engineering Entrance)
  // ==========================================
  // Physics (5 distinct topics)
  {
    id: 501,
    exam: 'JEE_MAIN',
    subject: 'Physics',
    topic: 'Rotational Dynamics — Moment of Inertia & Angular Momentum',
    question: 'A disc of mass M and radius R rotates about its central axis with angular velocity ω. If a point mass m is gently placed on the rim, the new angular velocity is:',
    options: ['[M / (M + m)] ω', '[M / (M + 2m)] ω', '[(M + 2m) / M] ω', '[M / (2M + m)] ω'],
    correctAnswer: 1,
    explanation: 'Conserving angular momentum: I1 · ω = I2 · ω\'. I1 = (1/2)MR²; I2 = (1/2)MR² + mR². Thus ω\' = [(1/2)M / ((1/2)M + m)] ω = [M / (M + 2m)] ω.'
  },
  {
    id: 502,
    exam: 'JEE_MAIN',
    subject: 'Physics',
    topic: 'Electrostatics & Capacitance — Dielectric Slabs',
    question: 'A parallel plate capacitor is charged and then disconnected from the battery. When a dielectric slab of constant K is inserted between plates, the stored energy:',
    options: ['Increases by factor K', 'Decreases by factor K', 'Remains unchanged', 'Increases by factor K²'],
    correctAnswer: 1,
    explanation: 'Because battery is disconnected, charge Q remains constant. Capacitance C becomes KC. Energy U = Q² / (2C) becomes Q² / (2KC) = U / K.'
  },
  {
    id: 503,
    exam: 'JEE_MAIN',
    subject: 'Physics',
    topic: 'Wave Optics — Young’s Double Slit & Fringe Shift',
    question: 'In YDSE, if the entire apparatus is immersed in water of refractive index 4/3, the fringe width (β):',
    options: ['Increases by 4/3', 'Decreases by 3/4', 'Decreases to 3/4 of original value', 'Remains identical'],
    correctAnswer: 2,
    explanation: 'Fringe width β = λD / d. In medium, wavelength λ\' = λ / μ = 3/4 λ. Therefore β\' = (3/4) β.'
  },
  {
    id: 504,
    exam: 'JEE_MAIN',
    subject: 'Physics',
    topic: 'Current Electricity — Potentiometer & Kirchhoff’s Laws',
    question: 'In a potentiometer experiment, balance length with a cell in open circuit is 600 cm. When shunted with 10 Ω, balance length becomes 500 cm. Internal resistance (r) is:',
    options: ['1 Ω', '2 Ω', '2.5 Ω', '3 Ω'],
    correctAnswer: 1,
    explanation: 'Internal resistance r = R · (l1 - l2) / l2 = 10 · (600 - 500) / 500 = 10 · (100 / 500) = 2 Ω.'
  },
  {
    id: 505,
    exam: 'JEE_MAIN',
    subject: 'Physics',
    topic: 'Thermodynamics — Carnot Engine Efficiency',
    question: 'A Carnot engine operates between source temperature 127°C and sink temperature 27°C. Its thermal efficiency is:',
    options: ['25%', '33.3%', '50%', '75%'],
    correctAnswer: 0,
    explanation: 'Convert to Kelvin: T1 = 127 + 273 = 400 K; T2 = 27 + 273 = 300 K. Efficiency η = 1 - (T2 / T1) = 1 - (300/400) = 1 - 0.75 = 0.25 = 25%.'
  },

  // Chemistry (5 distinct topics)
  {
    id: 506,
    exam: 'JEE_MAIN',
    subject: 'Chemistry',
    topic: 'Chemical Thermodynamics — Gibbs Free Energy & Spontaneity',
    question: 'A reaction has positive enthalpy change (ΔH > 0) and positive entropy change (ΔS > 0). The reaction will be spontaneous at:',
    options: ['All temperatures', 'Low temperatures only', 'High temperatures only where T > ΔH/ΔS', 'No temperature'],
    correctAnswer: 2,
    explanation: 'ΔG = ΔH - TΔS. For spontaneity, ΔG < 0 => TΔS > ΔH => T > ΔH / ΔS. Hence spontaneous at high temperatures.'
  },
  {
    id: 507,
    exam: 'JEE_MAIN',
    subject: 'Chemistry',
    topic: 'Coordination Chemistry — CFSE & Crystal Field Splitting',
    question: 'What is the crystal field stabilization energy (CFSE) for a d5 high-spin octahedral complex in terms of Δo?',
    options: ['-0.4 Δo', '-2.0 Δo', '0 Δo', '-1.2 Δo'],
    correctAnswer: 2,
    explanation: 'In high-spin d5: configuration is t2g3 eg2. CFSE = [3 × (-0.4) + 2 × (+0.6)] Δo = [-1.2 + 1.2] Δo = 0.'
  },
  {
    id: 508,
    exam: 'JEE_MAIN',
    subject: 'Chemistry',
    topic: 'Organic Reaction Mechanisms — Aldol & Cannizzaro',
    question: 'Which of the following compounds undergoes Cannizzaro reaction when treated with concentrated 50% NaOH?',
    options: ['Ethanal (CH3CHO)', 'Benzaldehyde (C6H5CHO)', 'Propanone (CH3COCH3)', 'Propanal (CH3CH2CHO)'],
    correctAnswer: 1,
    explanation: 'Cannizzaro reaction occurs in aldehydes lacking alpha-hydrogens (such as Benzaldehyde and Formaldehyde) via disproportionation.'
  },
  {
    id: 509,
    exam: 'JEE_MAIN',
    subject: 'Chemistry',
    topic: 'Chemical Kinetics — Arrhenius Equation & Activation Energy',
    question: 'When a catalyst increases the rate of a chemical reaction, it achieves this by:',
    options: ['Increasing enthalpy of reaction (ΔH)', 'Decreasing activation energy (Ea) of the forward and reverse path', 'Shifting equilibrium position towards products', 'Increasing average kinetic energy of molecules'],
    correctAnswer: 1,
    explanation: 'A catalyst provides an alternate pathway with lower activation energy (Ea) for both forward and backward steps, increasing rate constants.'
  },
  {
    id: 510,
    exam: 'JEE_MAIN',
    subject: 'Chemistry',
    topic: 'Periodic Properties — Ionization Enthalpy & Electron Gain',
    question: 'Which element among the following possesses the highest negative electron gain enthalpy in the periodic table?',
    options: ['Fluorine (F)', 'Chlorine (Cl)', 'Bromine (Br)', 'Oxygen (O)'],
    correctAnswer: 1,
    explanation: 'Chlorine has a higher negative electron gain enthalpy than Fluorine because Fluorine’s compact 2p orbital creates significant inter-electronic repulsion.'
  },

  // Mathematics (5 distinct topics)
  {
    id: 511,
    exam: 'JEE_MAIN',
    subject: 'Mathematics',
    topic: 'Definite Integrals — Leibniz Rule & Properties',
    question: 'The value of the definite integral ∫_{0}^{π/2} [sin³(x) / (sin³(x) + cos³(x))] dx is:',
    options: ['π/2', 'π/4', 'π/3', '1'],
    correctAnswer: 1,
    explanation: 'Applying property ∫_0^a f(x)dx = ∫_0^a f(a-x)dx: 2I = ∫_0^{π/2} 1 dx = π/2 => I = π/4.'
  },
  {
    id: 512,
    exam: 'JEE_MAIN',
    subject: 'Mathematics',
    topic: 'Quadratic Equations & Complex Numbers',
    question: 'If 1, ω, ω² are the cube roots of unity, then the value of (1 - ω + ω²)⁵ + (1 + ω - ω²)⁵ is:',
    options: ['32', '-32', '64', '-64'],
    correctAnswer: 1,
    explanation: 'Using 1 + ω + ω² = 0: (1 + ω² - ω)⁵ = (-2ω)⁵ = -32ω⁵ = -32ω². And (1 + ω - ω²)⁵ = (-2ω²)⁵ = -32ω¹⁰ = -32ω. Sum = -32(ω² + ω) = -32(-1) = 32. (Sign test: -32).'
  },
  {
    id: 513,
    exam: 'JEE_MAIN',
    subject: 'Mathematics',
    topic: 'Coordinate Geometry — Conic Sections & Tangents',
    question: 'The equation of the tangent to the parabola y² = 12x which is perpendicular to the line x + 3y - 1 = 0 is:',
    options: ['y = 3x + 1', 'y = 3x + 3', 'y = 3x - 1', '3x - y + 1 = 0'],
    correctAnswer: 0,
    explanation: 'Given line has slope m1 = -1/3. Perpendicular tangent slope m = 3. Parabola y² = 4ax has a = 3. Tangent equation: y = mx + a/m = 3x + 3/3 = 3x + 1.'
  },
  {
    id: 514,
    exam: 'JEE_MAIN',
    subject: 'Mathematics',
    topic: 'Probability & Bayes Theorem',
    question: 'A box contains 4 red and 6 black balls. Two balls are drawn at random without replacement. The probability that both are red is:',
    options: ['2/15', '4/25', '1/3', '2/9'],
    correctAnswer: 0,
    explanation: 'P(R1 and R2) = (4/10) × (3/9) = (2/5) × (1/3) = 2/15.'
  },
  {
    id: 515,
    exam: 'JEE_MAIN',
    subject: 'Mathematics',
    topic: 'Limits, Continuity & Differentiability',
    question: 'Evaluate the limit: lim_{x → 0} [ (tan(x) - sin(x)) / x³ ]',
    options: ['0', '1/2', '1', '2'],
    correctAnswer: 1,
    explanation: 'Rewrite tan(x) - sin(x) = sin(x)[(1 - cos x)/cos x] = sin(x) · 2 sin²(x/2) / cos(x). Dividing by x³ gives (sin x / x) · (1/cos x) · 2 (sin(x/2) / (x/2))² · (1/4) = 1 · 1 · 2 · 1 · 1/4 = 1/2.'
  },

  // ==========================================
  // 6. BANKING_INSURANCE (IBPS PO / SBI PO)
  // ==========================================
  // Quantitative Aptitude (5 distinct topics)
  {
    id: 601,
    exam: 'IBPS_PO',
    subject: 'Quantitative Aptitude',
    topic: 'Arithmetic — Simple & Compound Interest Difference',
    question: 'The difference between Compound Interest and Simple Interest on a certain sum at 10% per annum for 2 years is ₹150. What is the principal sum?',
    options: ['₹12,000', '₹15,000', '₹18,000', '₹20,000'],
    correctAnswer: 1,
    explanation: 'Formula for 2-year difference: D = P(r/100)². 150 = P(10/100)² = P(1/100) => P = 150 × 100 = ₹15,000.'
  },
  {
    id: 602,
    exam: 'IBPS_PO',
    subject: 'Quantitative Aptitude',
    topic: 'Arithmetic — Time & Work / Efficiency',
    question: 'A is twice as efficient as B. If together they can finish a piece of work in 14 days, in how many days can A alone complete the entire work?',
    options: ['21 days', '28 days', '35 days', '42 days'],
    correctAnswer: 0,
    explanation: 'Ratio of efficiency A : B = 2 : 1. Total work = combined rate × time = (2 + 1) × 14 = 42 units. Time for A alone = 42 / 2 = 21 days.'
  },
  {
    id: 603,
    exam: 'IBPS_PO',
    subject: 'Quantitative Aptitude',
    topic: 'Quadratic Equations Comparison',
    question: 'Compare roots: I. x² - 7x + 12 = 0; II. y² - 9y + 20 = 0. Which relation holds?',
    options: ['x > y', 'x < y', 'x ≤ y', 'x = y or Relationship cannot be established'],
    correctAnswer: 2,
    explanation: 'Roots of I: x = 3, 4. Roots of II: y = 4, 5. Comparing: 3 < 4, 3 < 5, 4 = 4, 4 < 5. Therefore x ≤ y.'
  },
  {
    id: 604,
    exam: 'IBPS_PO',
    subject: 'Quantitative Aptitude',
    topic: 'Data Interpretation — Ratio & Percentage Growth',
    question: 'If production in 2023 was 80,000 units and increased by 25% in 2024, what was the total production in 2024?',
    options: ['95,000 units', '1,00,000 units', '1,05,000 units', '1,20,000 units'],
    correctAnswer: 1,
    explanation: 'Production in 2024 = 80,000 × 1.25 = 1,00,000 units.'
  },
  {
    id: 605,
    exam: 'IBPS_PO',
    subject: 'Quantitative Aptitude',
    topic: 'Number Series — Missing Pattern Logic',
    question: 'Find the missing term in the sequence: 4, 11, 30, 67, 128, ?',
    options: ['219', '222', '230', '245'],
    correctAnswer: 0,
    explanation: 'Pattern: n³ + 3. (1³+3=4, 2³+3=11, 3³+3=30, 4³+3=67, 5³+3=128, 6³+3 = 216 + 3 = 219).'
  },

  // Reasoning Ability (5 distinct topics)
  {
    id: 606,
    exam: 'IBPS_PO',
    subject: 'Reasoning Ability',
    topic: 'Syllogism — "Only a few" Concept',
    question: 'Statements: Only a few Pens are Pencils. All Pencils are Erasers. Conclusion: Some Pens are not Pencils.',
    options: ['Conclusion follows', 'Conclusion does not follow', 'Either follows', 'Cannot determine'],
    correctAnswer: 0,
    explanation: '"Only a few A are B" inherently implies two statements simultaneously: "Some A are B" AND "Some A are NOT B". Hence the conclusion strictly follows.'
  },
  {
    id: 607,
    exam: 'IBPS_PO',
    subject: 'Reasoning Ability',
    topic: 'Inequalities — Coded Statements',
    question: 'Statement: P > Q ≥ R = S < T. Conclusions: I. P > S; II. Q < T.',
    options: ['Only conclusion I follows', 'Only conclusion II follows', 'Both I and II follow', 'Neither follows'],
    correctAnswer: 0,
    explanation: 'From P > Q ≥ R = S, we deduce P > S (Conclusion I true). Between Q and T: Q ≥ S < T has opposing signs, so no definite relationship holds.'
  },
  {
    id: 608,
    exam: 'IBPS_PO',
    subject: 'Reasoning Ability',
    topic: 'Seating Arrangement — Circular Table Facing Center',
    question: 'Eight persons A through H sit around a circular table facing center. A sits 3rd to right of B. C sits 2nd to left of A. How many persons sit between B and C when counted from right of B?',
    options: ['0', '1', '2', '3'],
    correctAnswer: 0,
    explanation: 'Positioning: If B is at 1, A is 3rd to right (at 4). C is 2nd to left of A (at 2). C is immediately to the right of B (0 persons in between).'
  },
  {
    id: 609,
    exam: 'IBPS_PO',
    subject: 'Reasoning Ability',
    topic: 'Coding-Decoding — Substitution Logic',
    question: 'In a code, "bank interest high rate" is "la ta ma sa", "high growth economy bank" is "ma pa sa ka". The code for "bank" and "high" are:',
    options: ['"ma" and "sa"', '"la" and "ta"', '"pa" and "ka"', '"ta" and "ma"'],
    correctAnswer: 0,
    explanation: 'Common words in both sentences are "bank" and "high", and common codes are "ma" and "sa".'
  },
  {
    id: 610,
    exam: 'IBPS_PO',
    subject: 'Reasoning Ability',
    topic: 'Blood Relations & Direction Hybrid',
    question: 'K is the sister of M. P is the mother of K. S is the husband of P. How is S related to M?',
    options: ['Brother', 'Father', 'Uncle', 'Son'],
    correctAnswer: 1,
    explanation: 'P is mother of both K and M. S is husband of P => S is the father of M.'
  },

  // Banking & Financial Awareness (5 distinct topics)
  {
    id: 611,
    exam: 'IBPS_PO',
    subject: 'Banking Awareness',
    topic: 'RBI Monetary Instruments & Policy Rates',
    question: 'The rate at which scheduled commercial banks borrow overnight funds from RBI against eligible approved securities is called:',
    options: ['Reverse Repo Rate', 'Marginal Standing Facility (MSF) Rate', 'Bank Rate', 'SDF Rate'],
    correctAnswer: 1,
    explanation: 'Marginal Standing Facility (MSF) is an overnight emergency borrowing window for scheduled banks over and above the regular repo window.'
  },
  {
    id: 612,
    exam: 'IBPS_PO',
    subject: 'Banking Awareness',
    topic: 'Non-Performing Assets & SARFAESI Act',
    question: 'According to RBI prudential norms, an asset becomes a Non-Performing Asset (NPA) when interest/principal remains overdue for more than:',
    options: ['30 days', '60 days', '90 days', '180 days'],
    correctAnswer: 2,
    explanation: 'A loan or advance is classified as an NPA if interest or installment of principal remains overdue for a period exceeding 90 days.'
  },
  {
    id: 613,
    exam: 'IBPS_PO',
    subject: 'Banking Awareness',
    topic: 'Payment Systems — UPI, NEFT & RTGS',
    question: 'Which entity operates and manages the Unified Payments Interface (UPI) infrastructure in India?',
    options: ['Reserve Bank of India (RBI)', 'National Payments Corporation of India (NPCI)', 'State Bank of India (SBI)', 'Indian Banks Association (IBA)'],
    correctAnswer: 1,
    explanation: 'NPCI is the umbrella organization established by RBI and IBA for operating retail payment and settlement systems in India.'
  },
  {
    id: 614,
    exam: 'IBPS_PO',
    subject: 'Banking Awareness',
    topic: 'Priority Sector Lending (PSL) Norms',
    question: 'What is the minimum Priority Sector Lending (PSL) target prescribed by RBI for domestic scheduled commercial banks (% of ANBC)?',
    options: ['25%', '33.33%', '40%', '50%'],
    correctAnswer: 2,
    explanation: 'Domestic commercial banks are mandated to allocate 40% of their Adjusted Net Bank Credit (ANBC) or credit equivalent of off-balance sheet exposure to priority sectors.'
  },
  {
    id: 615,
    exam: 'IBPS_PO',
    subject: 'Banking Awareness',
    topic: 'Financial Inclusion — PMJDY & Microfinance',
    question: 'Under Pradhan Mantri Jan Dhan Yojana (PMJDY), basic savings bank accounts are provided with an overdraft facility up to:',
    options: ['₹5,000', '₹10,000', '₹15,000', '₹20,000'],
    correctAnswer: 1,
    explanation: 'The overdraft limit under PMJDY has been enhanced to ₹10,000 for accounts maintained satisfactorily for 6 months.'
  },

  // ==========================================
  // 7. RRB_NTPC (Railways Examination)
  // ==========================================
  // Mathematics (5 distinct topics)
  {
    id: 701,
    exam: 'RRB_NTPC',
    subject: 'Mathematics',
    topic: 'Number System — LCM & HCF Relations',
    question: 'The HCF and LCM of two numbers are 12 and 336 respectively. If one of the numbers is 84, what is the other number?',
    options: ['48', '56', '64', '72'],
    correctAnswer: 0,
    explanation: 'Formula: Product of two numbers = HCF × LCM. 84 × N = 12 × 336 => N = (12 × 336) / 84 = 336 / 7 = 48.'
  },
  {
    id: 702,
    exam: 'RRB_NTPC',
    subject: 'Mathematics',
    topic: 'Ratio, Proportion & Alligation Mixtures',
    question: 'In what ratio must water be mixed with milk costing ₹60 per litre so that selling the mixture at ₹50 per litre yields no profit no loss?',
    options: ['1 : 5', '1 : 6', '5 : 1', '1 : 4'],
    correctAnswer: 0,
    explanation: 'Cost of water = ₹0, cost of milk = ₹60, mean price = ₹50. Ratio Water : Milk = (60 - 50) : (50 - 0) = 10 : 50 = 1 : 5.'
  },
  {
    id: 703,
    exam: 'RRB_NTPC',
    subject: 'Mathematics',
    topic: 'Time & Distance — Crossing of Platforms by Trains',
    question: 'A 240 m long train traveling at 72 km/h crosses a railway platform in 20 seconds. What is the length of the platform?',
    options: ['160 m', '180 m', '200 m', '240 m'],
    correctAnswer: 0,
    explanation: 'Speed = 72 × (5/18) = 20 m/s. Total distance = speed × time = 20 × 20 = 400 m. Platform length = 400 - 240 = 160 m.'
  },
  {
    id: 704,
    exam: 'RRB_NTPC',
    subject: 'Mathematics',
    topic: 'Mensuration — 2D Geometry & Circles',
    question: 'If the radius of a circle is increased by 20%, by what percentage does its area increase?',
    options: ['20%', '40%', '44%', '48%'],
    correctAnswer: 2,
    explanation: 'Area ∝ r². Net percentage increase = a + b + (ab/100) = 20 + 20 + (20 × 20 / 100) = 40 + 4 = 44%.'
  },
  {
    id: 705,
    exam: 'RRB_NTPC',
    subject: 'Mathematics',
    topic: 'Simple & Compound Interest',
    question: 'A sum of money doubles itself at simple interest in 8 years. What is the rate of interest per annum?',
    options: ['10%', '12.5%', '15%', '16.66%'],
    correctAnswer: 1,
    explanation: 'SI = P. P = (P × R × 8) / 100 => R = 100 / 8 = 12.5% per annum.'
  },

  // General Awareness (5 distinct topics)
  {
    id: 706,
    exam: 'RRB_NTPC',
    subject: 'General Awareness',
    topic: 'Indian Railways — History & Geography',
    question: 'Where is the headquarters of the South Central Railway zone located?',
    options: ['Secunderabad', 'Hubli', 'Chennai', 'Bilaspur'],
    correctAnswer: 0,
    explanation: 'South Central Railway (SCR) headquarters is located at Rail Nilayam in Secunderabad.'
  },
  {
    id: 707,
    exam: 'RRB_NTPC',
    subject: 'General Awareness',
    topic: 'General Science — Physics & SI Units',
    question: 'What is the SI unit of Magnetic Flux?',
    options: ['Tesla', 'Weber', 'Henry', 'Gauss'],
    correctAnswer: 1,
    explanation: 'Weber (Wb) is the SI unit of magnetic flux. Tesla is magnetic flux density, and Henry is inductance.'
  },
  {
    id: 708,
    exam: 'RRB_NTPC',
    subject: 'General Awareness',
    topic: 'General Science — Human Biology & Vitamins',
    question: 'Which vitamin is synthesized in the human body by intestinal symbiotic bacteria and is essential for blood clotting?',
    options: ['Vitamin A', 'Vitamin C', 'Vitamin K', 'Vitamin D'],
    correctAnswer: 2,
    explanation: 'Vitamin K (Phylloquinone/Menaquinone) is produced by gut microflora and is crucial for hepatic synthesis of clotting factors (II, VII, IX, X).'
  },
  {
    id: 709,
    exam: 'RRB_NTPC',
    subject: 'General Awareness',
    topic: 'Modern Indian History — Freedom Struggle',
    question: 'Who founded the Indian National Army (Azad Hind Fauj) initially in 1942 in Tokyo, Japan?',
    options: ['Subhas Chandra Bose', 'Rash Behari Bose', 'Captain Mohan Singh', 'Lala Har Dayal'],
    correctAnswer: 2,
    explanation: 'Captain Mohan Singh first conceived and founded the INA in Malaya/Singapore in 1942, before Netaji Subhas Chandra Bose took supreme command in 1943.'
  },
  {
    id: 710,
    exam: 'RRB_NTPC',
    subject: 'General Awareness',
    topic: 'Indian Constitution & Key Amendments',
    question: 'Which Schedule of the Indian Constitution contains the list of 22 officially recognized languages?',
    options: ['7th Schedule', '8th Schedule', '9th Schedule', '10th Schedule'],
    correctAnswer: 1,
    explanation: 'The 8th Schedule of the Constitution lists the 22 official languages of the Republic of India.'
  },

  // ==========================================
  // 8. CTET (Central Teacher Eligibility Test)
  // ==========================================
  // Child Development & Pedagogy (5 distinct topics)
  {
    id: 801,
    exam: 'CTET',
    subject: 'Child Development & Pedagogy',
    topic: 'Piaget’s Cognitive Theory — Stages of Development',
    question: 'According to Jean Piaget, in which developmental stage does a child acquire "Object Permanence"?',
    options: ['Sensorimotor stage (0–2 years)', 'Pre-operational stage (2–7 years)', 'Concrete operational stage (7–11 years)', 'Formal operational stage (11+ years)'],
    correctAnswer: 0,
    explanation: 'Object permanence (realizing objects exist even when out of sight) develops towards the end of the Sensorimotor stage (around 8–12 months).'
  },
  {
    id: 802,
    exam: 'CTET',
    subject: 'Child Development & Pedagogy',
    topic: 'Vygotsky’s Theory — ZPD & Scaffolding',
    question: 'Lev Vygotsky defined the difference between what a learner can do without help and what they can achieve with guidance as:',
    options: ['Schema equilibrium', 'Zone of Proximal Development (ZPD)', 'Operant conditioning', 'Egocentric accommodation'],
    correctAnswer: 1,
    explanation: 'The Zone of Proximal Development (ZPD) is the range of tasks a child cannot yet master alone but can accomplish with scaffolding from a More Knowledgeable Other (MKO).'
  },
  {
    id: 803,
    exam: 'CTET',
    subject: 'Child Development & Pedagogy',
    topic: 'Inclusive Education — Learning Disabilities',
    question: 'A primary student consistently confuses letters "b" and "d", or reads "saw" as "was". This is primarily indicative of:',
    options: ['Dyscalculia', 'Dysgraphia', 'Dyslexia', 'ADHD'],
    correctAnswer: 2,
    explanation: 'Dyslexia is a specific learning disorder characterized by difficulties with accurate word recognition, reading fluency, and decoding reversals.'
  },
  {
    id: 804,
    exam: 'CTET',
    subject: 'Child Development & Pedagogy',
    topic: 'Kohlberg’s Moral Development Theory',
    question: 'A child believes: "I should obey the rules to avoid punishment from my parents." This child is at which Kohlberg stage?',
    options: ['Pre-conventional Level — Punishment & Obedience Orientation', 'Conventional Level — Good Boy/Nice Girl', 'Post-conventional Level — Social Contract', 'Universal Ethical Principle'],
    correctAnswer: 0,
    explanation: 'Stage 1 of the Pre-conventional level is characterized by obedience driven strictly by fear of punishment and physical consequences.'
  },
  {
    id: 805,
    exam: 'CTET',
    subject: 'Child Development & Pedagogy',
    topic: 'Assessment & Evaluation — CCE & Formative Tools',
    question: 'Which of the following is the primary purpose of Formative Assessment in teaching-learning?',
    options: ['Assigning end-term final grades and ranks', 'Providing diagnostic feedback to improve learning during instruction', 'Screening students for selective stream grouping', 'Standardizing national competitive percentiles'],
    correctAnswer: 1,
    explanation: 'Formative Assessment is "assessment for learning", providing continuous feedback to both students and teachers to modify instructional strategies.'
  },

  // EVS & Mathematics Pedagogy (5 distinct topics)
  {
    id: 806,
    exam: 'CTET',
    subject: 'EVS & Math Pedagogy',
    topic: 'EVS Integrated Themes — Family, Food, Shelter & Travel',
    question: 'Which of the following is NOT one of the six broad themes identified in the NCERT EVS syllabus for primary classes?',
    options: ['Family and Friends', 'Things We Make and Do', 'Atomic Structure and Electricity', 'Water and Travel'],
    correctAnswer: 2,
    explanation: 'The 6 NCERT EVS themes are: Family & Friends, Food, Shelter, Water, Travel, and Things We Make and Do.'
  },
  {
    id: 807,
    exam: 'CTET',
    subject: 'EVS & Math Pedagogy',
    topic: 'Experiential Learning & Field Observation',
    question: 'Why is organizing a visit to a botanical garden or zoo considered essential for primary EVS learners?',
    options: ['It gives teachers leisure free time', 'It bridges the gap between classroom book knowledge and real-world environment', 'It fulfills administrative inspection targets', 'It tests rote memorization of scientific names'],
    correctAnswer: 1,
    explanation: 'Experiential field visits connect textbook concepts with real-world observations, enhancing active inquiry and sensory engagement.'
  },
  {
    id: 808,
    exam: 'CTET',
    subject: 'EVS & Math Pedagogy',
    topic: 'Mathematics Pedagogy — Concrete to Abstract',
    question: 'Which teaching tool is most effective for teaching place value, addition, and grouping concepts to grade 2 students?',
    options: ['Dienes Blocks (Base-10 blocks) or Abacus', 'Graph paper', 'Geo-board', 'Protractor'],
    correctAnswer: 0,
    explanation: 'Dienes blocks (units, rods, flats) and abacuses provide physical tactile representation of ones, tens, and hundreds.'
  },
  {
    id: 809,
    exam: 'CTET',
    subject: 'EVS & Math Pedagogy',
    topic: 'Language & Concept Acquisition in Math',
    question: 'When a teacher uses storytelling and contextual word problems before introducing mathematical equations, she is applying:',
    options: ['Inductive pedagogical approach (Concrete to Abstract)', 'Deductive rule-first method', 'Rote drill memorization', 'Behaviorist conditioning'],
    correctAnswer: 0,
    explanation: 'Inductive teaching begins with familiar real-life examples and stories before generalizing into formal symbolic math rules.'
  },
  {
    id: 810,
    exam: 'CTET',
    subject: 'EVS & Math Pedagogy',
    topic: 'Remedial Education & Error Analysis',
    question: 'When analyzing student errors in decimal subtraction, the teacher should treat mistakes as:',
    options: ['A sign of low IQ requiring punishment', 'Windows into the student’s thinking and conceptual understanding', 'Carelessness to be ignored', 'Reasons to reduce homework marks'],
    correctAnswer: 1,
    explanation: 'Errors are constructive diagnostic indicators revealing how children construct mathematical schemas, guiding targeted remedial support.'
  },

  // ==========================================
  // 9. STATE_PSC (UPPSC / BPSC / WBCS / State Civils)
  // ==========================================
  // General Studies (5 distinct topics)
  {
    id: 901,
    exam: 'UPPSC_PCS',
    subject: 'General Studies',
    topic: 'State History & Heritage — Ancient & Freedom Movements',
    question: 'The historic Kakori Train Action (1925) organized by Hindustan Republican Association (HRA) occurred near which city?',
    options: ['Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj'],
    correctAnswer: 0,
    explanation: 'The Kakori Action took place on 9 August 1925 near Kakori railway station near Lucknow under the leadership of Ram Prasad Bismil, Ashfaqulla Khan, and Chandrashekhar Azad.'
  },
  {
    id: 902,
    exam: 'UPPSC_PCS',
    subject: 'General Studies',
    topic: 'Panchayati Raj & Local Self Government',
    question: 'Which Constitutional Amendment Act granted constitutional status to Urban Local Bodies (Municipalities)?',
    options: ['72nd Amendment Act', '73rd Amendment Act', '74th Amendment Act', '76th Amendment Act'],
    correctAnswer: 2,
    explanation: 'The 74th Constitutional Amendment Act, 1992 added Part IX-A and Twelfth Schedule providing constitutional framework for Nagar Palikas/Municipalities.'
  },
  {
    id: 903,
    exam: 'UPPSC_PCS',
    subject: 'General Studies',
    topic: 'Physical & Economic Geography of States',
    question: 'Which is the longest canal system in Uttar Pradesh supplying irrigation across vast agricultural districts?',
    options: ['Upper Ganges Canal', 'Sharda Canal', 'Agra Canal', 'Ken-Betwa Link'],
    correctAnswer: 1,
    explanation: 'The Sharda Canal system, originating from the Sharda River at Banbasa, is the longest canal network in Uttar Pradesh.'
  },
  {
    id: 904,
    exam: 'UPPSC_PCS',
    subject: 'General Studies',
    topic: 'Environment, Ecology & Ramsar Wetlands',
    question: 'The Sur Sarovar (Keetham Lake) Ramsar wetland site is located in which district of Uttar Pradesh?',
    options: ['Agra', 'Mathura', 'Unnao', 'Gorakhpur'],
    correctAnswer: 0,
    explanation: 'Sur Sarovar (Keetham Lake), declared a Ramsar wetland site of international importance in 2020, is situated in Agra district.'
  },
  {
    id: 905,
    exam: 'UPPSC_PCS',
    subject: 'General Studies',
    topic: 'Indian Polity & Constitutional Writs',
    question: 'Under Article 226, the power of a State High Court to issue writs is wider than Supreme Court’s Article 32 because:',
    options: ['High Courts can issue writs for legal rights other than Fundamental Rights', 'High Courts have unlimited territorial jurisdiction', 'Supreme Court cannot issue Mandamus', 'High Courts are sovereign tribunals'],
    correctAnswer: 0,
    explanation: 'Under Article 32, Supreme Court issues writs ONLY for enforcement of Fundamental Rights, whereas High Courts under Article 226 can issue writs for Fundamental Rights AND any other legal rights.'
  }
];
