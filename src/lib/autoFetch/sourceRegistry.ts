// ============================================================================
// EXAM SOURCE REGISTRY & COPYRIGHT FILTER
// Resolves legitimate official conducting body sources & rejects paid/coaching sources
// ============================================================================

import { EXAM_LIST } from '../examList.js';
import type { ExamTarget } from './types.js';

// Canonical Alias Mappings to prevent storing duplicate content under different exam codes
export const EXAM_ALIAS_MAP: Record<string, string> = {
  STAFF_SELECTION_COMMISSIO: 'SSC_CGL',
  CENTRAL_ARMED_POLICE_FORC: 'UPSC_CAPF',
  COMBINED_DEFENCE_SERVICES: 'CDS',
  NATIONAL_DEFENCE_ACADEMY_: 'NDA_NA',
  CENTRAL_TEACHER_ELIGIBILI: 'CTET',
  UGC_NATIONAL_ELIGIBILITY_: 'UGC_NET',
  IAS: 'UPSC_CSE',
  WB_ANM_GNM: 'ANM_GNM',
  JENPAUH_JENPAS_UG: 'JENPAS_UG',
  WEST_BENGAL_JOINT_ENTRANC: 'WBJEE',
};

// 50+ Configured Official Conducting Body Registry
export const OFFICIAL_EXAM_REGISTRY: Record<string, Partial<ExamTarget>> = {
  UPSC_CSE: {
    conductingBody: 'Union Public Service Commission',
    officialDomain: 'upsc.gov.in',
    officialSyllabusUrls: [
      'https://upsc.gov.in/examinations/revised-syllabus-scheme',
      'https://upsc.gov.in/examinations/civil-services-preliminary-examination',
    ],
    officialPyqUrls: [
      'https://upsc.gov.in/examinations/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://dopt.gov.in/civil-services-examination-rules',
      'https://en.wikipedia.org/wiki/Civil_Services_Examination',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  NDA_NA: {
    conductingBody: 'Union Public Service Commission',
    officialDomain: 'upsc.gov.in',
    officialSyllabusUrls: [
      'https://upsc.gov.in/examinations/national-defence-academy-and-naval-academy-examination',
    ],
    officialPyqUrls: [
      'https://upsc.gov.in/examinations/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/National_Defence_Academy_(India)',
    ],
    examType: 'combo',
    stages: ['Mathematics', 'GAT'],
  },
  CDS: {
    conductingBody: 'Union Public Service Commission',
    officialDomain: 'upsc.gov.in',
    officialSyllabusUrls: [
      'https://upsc.gov.in/examinations/combined-defence-services-examination',
    ],
    officialPyqUrls: [
      'https://upsc.gov.in/examinations/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Combined_Defence_Services_Examination',
    ],
    examType: 'combo',
    stages: ['English', 'GK', 'Elementary Maths'],
  },
  UPSC_CAPF: {
    conductingBody: 'Union Public Service Commission',
    officialDomain: 'upsc.gov.in',
    officialSyllabusUrls: [
      'https://upsc.gov.in/examinations/central-armed-police-forces-ac-examination',
    ],
    officialPyqUrls: [
      'https://upsc.gov.in/examinations/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Central_Armed_Police_Forces',
    ],
    examType: 'combo',
    stages: ['Paper 1 (MCQ)', 'Paper 2 (Descriptive)'],
  },
  SSC_CGL: {
    conductingBody: 'Staff Selection Commission',
    officialDomain: 'ssc.gov.in',
    officialSyllabusUrls: [
      'https://ssc.gov.in/candidate-corner/syllabus',
    ],
    officialPyqUrls: [
      'https://ssc.gov.in/candidate-corner/tentative-answer-keys',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Staff_Selection_Commission_-_Combined_Graduate_Level_Examination',
    ],
    examType: 'objective',
    stages: ['Tier 1', 'Tier 2'],
  },
  SSC_CHSL: {
    conductingBody: 'Staff Selection Commission',
    officialDomain: 'ssc.gov.in',
    officialSyllabusUrls: [
      'https://ssc.gov.in/candidate-corner/syllabus',
    ],
    officialPyqUrls: [
      'https://ssc.gov.in/candidate-corner/tentative-answer-keys',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Staff_Selection_Commission',
    ],
    examType: 'objective',
    stages: ['Tier 1', 'Tier 2'],
  },
  SSC_MTS: {
    conductingBody: 'Staff Selection Commission',
    officialDomain: 'ssc.gov.in',
    officialSyllabusUrls: [
      'https://ssc.gov.in/candidate-corner/syllabus',
    ],
    officialPyqUrls: [
      'https://ssc.gov.in/candidate-corner/tentative-answer-keys',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Staff_Selection_Commission',
    ],
    examType: 'objective',
    stages: ['Session 1', 'Session 2'],
  },
  SSC_GD: {
    conductingBody: 'Staff Selection Commission',
    officialDomain: 'ssc.gov.in',
    officialSyllabusUrls: [
      'https://ssc.gov.in/candidate-corner/syllabus',
    ],
    officialPyqUrls: [
      'https://ssc.gov.in/candidate-corner/tentative-answer-keys',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/SSC_GD_Constable_Exam',
    ],
    examType: 'objective',
    stages: ['CBE'],
  },
  RRB_NTPC: {
    conductingBody: 'Railway Recruitment Control Board',
    officialDomain: 'rrbcdg.gov.in',
    officialSyllabusUrls: [
      'https://www.rrbcdg.gov.in/notifications.php',
    ],
    officialPyqUrls: [
      'https://www.rrbcdg.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Railway_Recruitment_Control_Board',
    ],
    examType: 'objective',
    stages: ['CBT 1', 'CBT 2'],
  },
  RRB_JE: {
    conductingBody: 'Railway Recruitment Control Board',
    officialDomain: 'rrbcdg.gov.in',
    officialSyllabusUrls: [
      'https://www.rrbcdg.gov.in/notifications.php',
    ],
    officialPyqUrls: [
      'https://www.rrbcdg.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Railway_Recruitment_Control_Board',
    ],
    examType: 'objective',
    stages: ['CBT 1', 'CBT 2'],
  },
  GROUP_D: {
    conductingBody: 'Railway Recruitment Cells',
    officialDomain: 'rrbcdg.gov.in',
    officialSyllabusUrls: [
      'https://www.rrbcdg.gov.in/',
    ],
    officialPyqUrls: [
      'https://www.rrbcdg.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Indian_Railways',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  RAILWAY_PROTECTION_FORCE_: {
    conductingBody: 'Ministry of Railways',
    officialDomain: 'rpf.indianrailways.gov.in',
    officialSyllabusUrls: [
      'https://rpf.indianrailways.gov.in/',
    ],
    officialPyqUrls: [
      'https://rpf.indianrailways.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Railway_Protection_Force',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  IBPS_PO: {
    conductingBody: 'Institute of Banking Personnel Selection',
    officialDomain: 'ibps.in',
    officialSyllabusUrls: [
      'https://www.ibps.in/crp-po-mt/',
    ],
    officialPyqUrls: [
      'https://www.ibps.in/crp-po-mt/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Institute_of_Banking_Personnel_Selection',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  IBPS_CLERK: {
    conductingBody: 'Institute of Banking Personnel Selection',
    officialDomain: 'ibps.in',
    officialSyllabusUrls: [
      'https://www.ibps.in/crp-clerical-cadre/',
    ],
    officialPyqUrls: [
      'https://www.ibps.in/crp-clerical-cadre/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Institute_of_Banking_Personnel_Selection',
    ],
    examType: 'objective',
    stages: ['Prelims', 'Mains'],
  },
  SBI_PO: {
    conductingBody: 'State Bank of India',
    officialDomain: 'sbi.co.in',
    officialSyllabusUrls: [
      'https://sbi.co.in/web/careers/current-openings',
    ],
    officialPyqUrls: [
      'https://sbi.co.in/web/careers/current-openings',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/State_Bank_of_India',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  NEET_UG: {
    conductingBody: 'National Testing Agency',
    officialDomain: 'exams.nta.ac.in',
    officialSyllabusUrls: [
      'https://exams.nta.ac.in/NEET/syllabus',
      'https://www.nmc.org.in/neet/neet-ug',
    ],
    officialPyqUrls: [
      'https://nta.ac.in/Downloads',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/National_Eligibility_cum_Entrance_Test_(Undergraduate)',
    ],
    examType: 'objective',
    stages: ['Single Stage'],
  },
  UGC_NET: {
    conductingBody: 'National Testing Agency',
    officialDomain: 'ugcnet.nta.ac.in',
    officialSyllabusUrls: [
      'https://ugcnet.nta.ac.in/',
      'https://www.ugcnetonline.in/syllabus-new.php',
    ],
    officialPyqUrls: [
      'https://nta.ac.in/Downloads',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/UGC_NET',
    ],
    examType: 'objective',
    stages: ['Paper 1', 'Paper 2'],
  },
  CSIR_NATIONAL_ELIGIBILITY: {
    conductingBody: 'National Testing Agency',
    officialDomain: 'csirnet.nta.ac.in',
    officialSyllabusUrls: [
      'https://csirnet.nta.ac.in/',
      'https://csirhrdg.res.in/Home/Index/1/Default/1446/60',
    ],
    officialPyqUrls: [
      'https://csirhrdg.res.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/CSIR_UGC_NET',
    ],
    examType: 'objective',
    stages: ['Part A', 'Part B', 'Part C'],
  },
  CTET: {
    conductingBody: 'Central Board of Secondary Education',
    officialDomain: 'ctet.nic.in',
    officialSyllabusUrls: [
      'https://ctet.nic.in/information-bulletin/',
    ],
    officialPyqUrls: [
      'https://ctet.nic.in/previous-year-question-paper/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Central_Teacher_Eligibility_Test',
    ],
    examType: 'objective',
    stages: ['Paper 1', 'Paper 2'],
  },
  UPPSC_PCS: {
    conductingBody: 'Uttar Pradesh Public Service Commission',
    officialDomain: 'uppsc.up.nic.in',
    officialSyllabusUrls: [
      'https://uppsc.up.nic.in/Candidate_Corner/Syllabus.aspx',
    ],
    officialPyqUrls: [
      'https://uppsc.up.nic.in/Candidate_Corner/PreviousQuestionPapers.aspx',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Uttar_Pradesh_Public_Service_Commission',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  BPSC_PCS: {
    conductingBody: 'Bihar Public Service Commission',
    officialDomain: 'bpsc.bih.nic.in',
    officialSyllabusUrls: [
      'https://bpsc.bih.nic.in/Syllabus.htm',
    ],
    officialPyqUrls: [
      'https://bpsc.bih.nic.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Bihar_Public_Service_Commission',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  WBCS: {
    conductingBody: 'West Bengal Public Service Commission',
    officialDomain: 'wbpsc.gov.in',
    officialSyllabusUrls: [
      'https://wbpsc.gov.in/syllabus.jsp',
    ],
    officialPyqUrls: [
      'https://wbpsc.gov.in/previous_question.jsp',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/West_Bengal_Civil_Service',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  UPSSSC_PET: {
    conductingBody: 'Uttar Pradesh Subordinate Services Selection Commission',
    officialDomain: 'upsssc.gov.in',
    officialSyllabusUrls: [
      'https://upsssc.gov.in/AllNotification.aspx',
    ],
    officialPyqUrls: [
      'https://upsssc.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Uttar_Pradesh_Subordinate_Services_Selection_Commission',
    ],
    examType: 'objective',
    stages: ['Single Stage'],
  },
  UP_POLICE_CONSTABLE: {
    conductingBody: 'UP Police Recruitment and Promotion Board',
    officialDomain: 'uppbpb.gov.in',
    officialSyllabusUrls: [
      'http://uppbpb.gov.in/',
    ],
    officialPyqUrls: [
      'http://uppbpb.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Uttar_Pradesh_Police',
    ],
    examType: 'objective',
    stages: ['Written Exam'],
  },
  UP_POLICE_SI: {
    conductingBody: 'UP Police Recruitment and Promotion Board',
    officialDomain: 'uppbpb.gov.in',
    officialSyllabusUrls: [
      'http://uppbpb.gov.in/',
    ],
    officialPyqUrls: [
      'http://uppbpb.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Uttar_Pradesh_Police',
    ],
    examType: 'objective',
    stages: ['Online Written Exam'],
  },
  BIHAR_POLICE_CONSTABLE: {
    conductingBody: 'Central Selection Board of Constable Bihar',
    officialDomain: 'csbc.bih.nic.in',
    officialSyllabusUrls: [
      'https://csbc.bih.nic.in/',
    ],
    officialPyqUrls: [
      'https://csbc.bih.nic.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Bihar_Police',
    ],
    examType: 'objective',
    stages: ['Written Exam'],
  },
  BIHAR_POLICE_SI: {
    conductingBody: 'Bihar Police Subordinate Services Commission',
    officialDomain: 'bpssc.bih.nic.in',
    officialSyllabusUrls: [
      'https://bpssc.bih.nic.in/',
    ],
    officialPyqUrls: [
      'https://bpssc.bih.nic.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Bihar_Police',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  WBP_CONSTABLE: {
    conductingBody: 'West Bengal Police Recruitment Board',
    officialDomain: 'prb.wb.gov.in',
    officialSyllabusUrls: [
      'https://prb.wb.gov.in/',
    ],
    officialPyqUrls: [
      'https://prb.wb.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/West_Bengal_Police',
    ],
    examType: 'combo',
    stages: ['Preliminary', 'Final Written'],
  },
  KP_CONSTABLE: {
    conductingBody: 'West Bengal Police Recruitment Board',
    officialDomain: 'prb.wb.gov.in',
    officialSyllabusUrls: [
      'https://prb.wb.gov.in/',
    ],
    officialPyqUrls: [
      'https://prb.wb.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Kolkata_Police',
    ],
    examType: 'combo',
    stages: ['Preliminary', 'Final Written'],
  },
  MP_POLICE_CONSTABLE: {
    conductingBody: 'Madhya Pradesh Employees Selection Board',
    officialDomain: 'esb.mp.gov.in',
    officialSyllabusUrls: [
      'https://esb.mp.gov.in/Rulebooks.html',
    ],
    officialPyqUrls: [
      'https://esb.mp.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Madhya_Pradesh_Police',
    ],
    examType: 'objective',
    stages: ['Stage 1 CBT'],
  },
  RAJASTHAN_POLICE_CONSTABLE: {
    conductingBody: 'Rajasthan Police',
    officialDomain: 'police.rajasthan.gov.in',
    officialSyllabusUrls: [
      'https://police.rajasthan.gov.in/Recruitment.aspx',
    ],
    officialPyqUrls: [
      'https://police.rajasthan.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Rajasthan_Police',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  CHHATTISGARH_PUBLIC_SERVI: {
    conductingBody: 'Chhattisgarh Public Service Commission',
    officialDomain: 'psc.cg.gov.in',
    officialSyllabusUrls: [
      'https://psc.cg.gov.in/Syllabus.htm',
    ],
    officialPyqUrls: [
      'https://psc.cg.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Chhattisgarh_Public_Service_Commission',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  ASSAM_PUBLIC_SERVICE_COMM: {
    conductingBody: 'Assam Public Service Commission',
    officialDomain: 'apsc.nic.in',
    officialSyllabusUrls: [
      'https://apsc.nic.in/syllabus.asp',
    ],
    officialPyqUrls: [
      'https://apsc.nic.in/previous_question_papers.asp',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Assam_Public_Service_Commission',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  RAJASTHAN_PUBLIC_SERVICE_: {
    conductingBody: 'Rajasthan Public Service Commission',
    officialDomain: 'rpsc.rajasthan.gov.in',
    officialSyllabusUrls: [
      'https://rpsc.rajasthan.gov.in/syllabus',
    ],
    officialPyqUrls: [
      'https://rpsc.rajasthan.gov.in/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Rajasthan_Public_Service_Commission',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  COMMON_UNIVERSITY_ENTRANC: {
    conductingBody: 'National Testing Agency',
    officialDomain: 'cuetug.nta.ac.in',
    officialSyllabusUrls: [
      'https://cuetug.nta.ac.in/syllabus.html',
    ],
    officialPyqUrls: [
      'https://nta.ac.in/Downloads',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Common_University_Entrance_Test',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  COMMON_ADMISSION_TEST: {
    conductingBody: 'Indian Institutes of Management',
    officialDomain: 'iimcat.ac.in',
    officialSyllabusUrls: [
      'https://iimcat.ac.in/',
    ],
    officialPyqUrls: [
      'https://iimcat.ac.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Common_Admission_Test',
    ],
    examType: 'objective',
    stages: ['Single Stage'],
  },
  COMMON_LAW_ADMISSION_TEST: {
    conductingBody: 'Consortium of National Law Universities',
    officialDomain: 'consortiumofnlus.ac.in',
    officialSyllabusUrls: [
      'https://consortiumofnlus.ac.in/clat-2025/syllabus.html',
    ],
    officialPyqUrls: [
      'https://consortiumofnlus.ac.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Common_Law_Admission_Test',
    ],
    examType: 'objective',
    stages: ['Single Stage'],
  },
  GRADUATE_APTITUDE_TEST_IN: {
    conductingBody: 'Indian Institute of Science / IITs',
    officialDomain: 'gate2025.iitr.ac.in',
    officialSyllabusUrls: [
      'https://gate2025.iitr.ac.in/syllabus.html',
    ],
    officialPyqUrls: [
      'https://gate2025.iitr.ac.in/old-question-papers.html',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Graduate_Aptitude_Test_in_Engineering',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  ALL_INDIA_BAR_EXAMINATION: {
    conductingBody: 'Bar Council of India',
    officialDomain: 'allindiabarexamination.com',
    officialSyllabusUrls: [
      'https://allindiabarexamination.com/syllabus.html',
    ],
    officialPyqUrls: [
      'https://allindiabarexamination.com/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/All_India_Bar_Examination',
    ],
    examType: 'objective',
    stages: ['Single Stage'],
  },
  AIR_FORCE_COMMON_ADMISSIO: {
    conductingBody: 'Indian Air Force',
    officialDomain: 'afcat.cdac.in',
    officialSyllabusUrls: [
      'https://afcat.cdac.in/AFCAT/syllabus.html',
    ],
    officialPyqUrls: [
      'https://afcat.cdac.in/AFCAT/samplePapers.html',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Air_Force_Common_Admission_Test',
    ],
    examType: 'objective',
    stages: ['Online Test'],
  },
  COMBINED_MEDICAL_SERVICES: {
    conductingBody: 'Union Public Service Commission',
    officialDomain: 'upsc.gov.in',
    officialSyllabusUrls: [
      'https://upsc.gov.in/examinations/combined-medical-services-examination',
    ],
    officialPyqUrls: [
      'https://upsc.gov.in/examinations/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Combined_Medical_Services_Examination',
    ],
    examType: 'combo',
    stages: ['Computer Based Exam'],
  },
  ENGINEERING_SERVICES_EXAM: {
    conductingBody: 'Union Public Service Commission',
    officialDomain: 'upsc.gov.in',
    officialSyllabusUrls: [
      'https://upsc.gov.in/examinations/engineering-services-examination',
    ],
    officialPyqUrls: [
      'https://upsc.gov.in/examinations/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Engineering_Services_Examination',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  INDIAN_FOREST_SERVICE_EXA: {
    conductingBody: 'Union Public Service Commission',
    officialDomain: 'upsc.gov.in',
    officialSyllabusUrls: [
      'https://upsc.gov.in/examinations/indian-forest-service-examination',
    ],
    officialPyqUrls: [
      'https://upsc.gov.in/examinations/previous-question-papers',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Indian_Forest_Service',
    ],
    examType: 'combo',
    stages: ['Prelims', 'Mains'],
  },
  UTTAR_PRADESH_TEACHER_ELI: {
    conductingBody: 'Uttar Pradesh Basic Education Board',
    officialDomain: 'updeled.gov.in',
    officialSyllabusUrls: [
      'https://updeled.gov.in/',
    ],
    officialPyqUrls: [
      'https://updeled.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Uttar_Pradesh_Teacher_Eligibility_Test',
    ],
    examType: 'objective',
    stages: ['Paper 1', 'Paper 2'],
  },
  BIHAR_BED: {
    conductingBody: 'Lalit Narayan Mithila University',
    officialDomain: 'biharcetbed-lnmu.in',
    officialSyllabusUrls: [
      'https://biharcetbed-lnmu.in/',
    ],
    officialPyqUrls: [
      'https://biharcetbed-lnmu.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Bachelor_of_Education',
    ],
    examType: 'objective',
    stages: ['CET'],
  },
  RAJASTHAN_ELIGIBILITY_EXA: {
    conductingBody: 'Board of Secondary Education Rajasthan',
    officialDomain: 'rajeduboard.rajasthan.gov.in',
    officialSyllabusUrls: [
      'https://rajeduboard.rajasthan.gov.in/',
    ],
    officialPyqUrls: [
      'https://rajeduboard.rajasthan.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Board_of_Secondary_Education,_Rajasthan',
    ],
    examType: 'objective',
    stages: ['Level 1', 'Level 2'],
  },
  MP_CPCT: {
    conductingBody: 'Madhya Pradesh Agency for Promotion of Information Technology',
    officialDomain: 'cpct.mp.gov.in',
    officialSyllabusUrls: [
      'https://cpct.mp.gov.in/Syllabus.html',
    ],
    officialPyqUrls: [
      'https://cpct.mp.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Madhya_Pradesh',
    ],
    examType: 'objective',
    stages: ['CBT + Typing'],
  },
  JEECUP: {
    conductingBody: 'Joint Entrance Examination Council Uttar Pradesh',
    officialDomain: 'jeecup.admissions.nic.in',
    officialSyllabusUrls: [
      'https://jeecup.admissions.nic.in/',
    ],
    officialPyqUrls: [
      'https://jeecup.admissions.nic.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Polytechnic_(India)',
    ],
    examType: 'objective',
    stages: ['Entrance Test'],
  },
  BIHAR_DELED: {
    conductingBody: 'Bihar School Examination Board',
    officialDomain: 'secondary.biharboardonline.com',
    officialSyllabusUrls: [
      'https://secondary.biharboardonline.com/',
    ],
    officialPyqUrls: [
      'https://secondary.biharboardonline.com/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Bihar_School_Examination_Board',
    ],
    examType: 'objective',
    stages: ['Entrance Test'],
  },
  MAHARASHTRA_COMMON_ENTRAN: {
    conductingBody: 'State Common Entrance Test Cell Maharashtra',
    officialDomain: 'cetcell.mahacet.org',
    officialSyllabusUrls: [
      'https://cetcell.mahacet.org/',
    ],
    officialPyqUrls: [
      'https://cetcell.mahacet.org/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Maharashtra_Common_Entrance_Test',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  KARNATAKA_COMMON_ENTRANCE: {
    conductingBody: 'Karnataka Examinations Authority',
    officialDomain: 'kea.kar.nic.in',
    officialSyllabusUrls: [
      'https://cetonline.karnataka.gov.in/kea/',
    ],
    officialPyqUrls: [
      'https://cetonline.karnataka.gov.in/kea/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Karnataka_Common_Entrance_Test',
    ],
    examType: 'objective',
    stages: ['KCET'],
  },
  TELANGANA_ENGINEERING_AGR: {
    conductingBody: 'Jawaharlal Nehru Technological University Hyderabad',
    officialDomain: 'eapcet.tsche.ac.in',
    officialSyllabusUrls: [
      'https://eapcet.tsche.ac.in/TSEAPCET/EAPCET_Syllabus.aspx',
    ],
    officialPyqUrls: [
      'https://eapcet.tsche.ac.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/TS_EAMCET',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  ANDHRA_PRADESH_AGRICULTUR: {
    conductingBody: 'Jawaharlal Nehru Technological University Kakinada',
    officialDomain: 'cets.apsche.ap.gov.in',
    officialSyllabusUrls: [
      'https://cets.apsche.ap.gov.in/EAPCET/Eapcet/EAPCET_Syllabus.aspx',
    ],
    officialPyqUrls: [
      'https://cets.apsche.ap.gov.in/EAPCET/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/AP_EAMCET',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  IMU_CET: {
    conductingBody: 'Indian Maritime University',
    officialDomain: 'imu.edu.in',
    officialSyllabusUrls: [
      'https://www.imu.edu.in/imunew/admissions',
    ],
    officialPyqUrls: [
      'https://www.imu.edu.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/Indian_Maritime_University',
    ],
    examType: 'objective',
    stages: ['CBT'],
  },
  JENPAS_UG: {
    conductingBody: 'West Bengal Joint Entrance Examinations Board',
    officialDomain: 'wbjeeb.nic.in',
    officialSyllabusUrls: [
      'https://wbjeeb.nic.in/jenpas-ug/',
    ],
    officialPyqUrls: [
      'https://wbjeeb.nic.in/jenpas-ug/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/West_Bengal_Joint_Entrance_Examinations_Board',
    ],
    examType: 'objective',
    stages: ['Paper 1', 'Paper 2'],
  },
  ANM_GNM: {
    conductingBody: 'West Bengal Joint Entrance Examinations Board',
    officialDomain: 'wbjeeb.nic.in',
    officialSyllabusUrls: [
      'https://wbjeeb.nic.in/anm-gnm/',
    ],
    officialPyqUrls: [
      'https://wbjeeb.nic.in/anm-gnm/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/West_Bengal_Joint_Entrance_Examinations_Board',
    ],
    examType: 'objective',
    stages: ['Single Stage'],
  },
  WBPSC_FOOD_SI: {
    conductingBody: 'West Bengal Public Service Commission',
    officialDomain: 'wbpsc.gov.in',
    officialSyllabusUrls: [
      'https://wbpsc.gov.in/',
    ],
    officialPyqUrls: [
      'https://wbpsc.gov.in/',
    ],
    fallbackSyllabusUrls: [
      'https://en.wikipedia.org/wiki/West_Bengal_Civil_Service',
    ],
    examType: 'objective',
    stages: ['Written Test'],
  },
};

/**
 * Resolves the canonical ID for any exam (handling aliases).
 */
export function getCanonicalExamId(examId: string): string {
  return EXAM_ALIAS_MAP[examId] || examId;
}

/**
 * Returns complete ExamTarget for any exam ID in EXAM_LIST or registry.
 */
export function getExamTarget(examId: string): ExamTarget {
  const canonicalId = getCanonicalExamId(examId);
  const found = EXAM_LIST.find((e) => e.id === examId || e.id === canonicalId);
  const known = OFFICIAL_EXAM_REGISTRY[canonicalId] || OFFICIAL_EXAM_REGISTRY[examId] || {};

  return {
    id: canonicalId,
    name: found?.label || canonicalId,
    category: (known as any).category || 'GENERAL_COMPETITIVE',
    conductingBody: known.conductingBody || 'Government Conducting Body',
    officialDomain: known.officialDomain || 'gov.in',
    officialSyllabusUrls: known.officialSyllabusUrls || [],
    officialPyqUrls: known.officialPyqUrls || [],
    fallbackSyllabusUrls: known.fallbackSyllabusUrls || [],
    openQuestionBankUrls: known.openQuestionBankUrls || [],
    examType: known.examType || 'objective',
    stages: known.stages || ['Stage 1'],
  };
}

/**
 * Returns all configured exam targets in the application (50+ exams).
 */
export function getAllExamTargets(): ExamTarget[] {
  const registeredIds = Object.keys(OFFICIAL_EXAM_REGISTRY);
  const seen = new Set<string>();
  const targets: ExamTarget[] = [];

  for (const id of registeredIds) {
    const canonical = getCanonicalExamId(id);
    if (!seen.has(canonical)) {
      seen.add(canonical);
      targets.push(getExamTarget(canonical));
    }
  }

  return targets;
}

/**
 * Known commercial coaching institutes and paid test platforms whose content MUST NOT be fetched or stored
 */
const BANNED_COPYRIGHT_DOMAINS = [
  'byjus.com',
  'unacademy.com',
  'testbook.com',
  'pw.live',
  'physicswallah.in',
  'allen.in',
  'vedantu.com',
  'careerlauncher.com',
  'adda247.com',
  'oliveboard.in',
  'gradeup.co',
  'nextias.com',
  'visionias.in',
  'drishtiias.com',
  'insightsonindia.com',
  'iasbaba.com',
  'shiksha.com',
  'collegedunia.com',
  'jagranjosh.com',
  'embibe.com',
];

const COPYRIGHT_PAGE_PHRASES = [
  'all rights reserved. no part of this publication',
  'unauthorized reproduction is strictly prohibited',
  'proprietary test series',
  'paid question bank',
  'subscribed users only',
  'buy course',
  'enroll now to access',
  'premium mock test',
  'copyrighted material',
];

/**
 * Hard constraint check: verifies if a URL or its text content indicates copyrighted/paid material.
 */
export function isCopyrightedOrPaidSource(urlStr: string, textSnippet = ''): { rejected: boolean; reason?: string } {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();

    for (const banned of BANNED_COPYRIGHT_DOMAINS) {
      if (host.includes(banned)) {
        return {
          rejected: true,
          reason: `Rejected commercial coaching domain (${banned}). Only official conducting body sources are permitted.`,
        };
      }
    }

    if (textSnippet) {
      const lowerText = textSnippet.toLowerCase();
      for (const phrase of COPYRIGHT_PAGE_PHRASES) {
        if (lowerText.includes(phrase)) {
          return {
            rejected: true,
            reason: `Detected paid/copyrighted test marker: "${phrase}". Rejected per academic open-access policy.`,
          };
        }
      }
    }

    return { rejected: false };
  } catch (err: any) {
    return { rejected: true, reason: `Invalid source URL: ${err.message}` };
  }
}
