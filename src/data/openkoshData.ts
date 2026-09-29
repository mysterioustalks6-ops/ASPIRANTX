import openkoshExamsJson from './openkoshExams.json';
import openkoshDetailedJson from './openkoshDetailedSyllabus.json';
import { SyllabusTopic, SubTopic, SyllabusHierarchyNode } from '../types';

export interface OpenKoshExamSummary {
  title: string;
  fullName: string;
  location: string;
  category: string;
  description: string;
  searchTerms: string;
  link: string;
  tags: string[];
  examId: string;
}

export interface OpenKoshBook {
  subject: string;
  book: string;
  author: string;
}

export interface OpenKoshTopicItem {
  id: string;
  name: string;
}

export interface OpenKoshSubjectGroup {
  title: string;
  marks?: string;
  questions?: string;
  topics: OpenKoshTopicItem[];
}

export interface OpenKoshSection {
  title: string;
  description?: string;
  subjects: OpenKoshSubjectGroup[];
}

export interface OpenKoshDetailedExam {
  examId: string;
  slug: string;
  title: string;
  fullName: string;
  location: string;
  category: string;
  conductedBy: string;
  eligibility: string;
  ageLimit: string;
  pattern: string;
  overview: string;
  difficulty: string;
  totalTopicsCount: number;
  books: OpenKoshBook[];
  sections: OpenKoshSection[];
}

// Slug to canonical Exam ID map
export const OPENKOSH_SLUG_MAP: Record<string, string> = {
  'upsc-cse': 'UPSC_CSE',
  'ssc-cgl': 'SSC_CGL',
  'chsl': 'SSC_CHSL',
  'mts': 'SSC_MTS',
  'gd-constable': 'SSC_GD',
  'capf': 'UPSC_CAPF',
  'uppsc': 'UPPSC_PCS',
  'wbcs': 'WBCS',
  'bpsc': 'BPSC_PCS',
  'rrb-ntpc': 'RRB_NTPC',
  'rrb-je': 'RRB_JE',
  'ibps-po': 'IBPS_PO',
  'sbi-po': 'SBI_PO',
  'ibps-clerk': 'IBPS_CLERK',
  'nda': 'NDA_NA',
  'cds': 'CDS',
  'ctet': 'CTET',
  'ugc-net': 'UGC_NET',
  'jenpas-ug': 'JENPAS_UG',
  'jepbn': 'JEPBN',
  'anm-gnm': 'ANM_GNM',
  'smfwbee': 'SMFWBEE',
  'wbpsc-food-si': 'WBPSC_FOOD_SI',
  'jelet': 'JELET',
  'jexpo-voclet': 'JEXPO_VOCLET',
  'up-cnet': 'UP_CNET',
  'upget': 'UP_GET',
  'jeecup': 'JEECUP',
  'upsssc-xray-technician': 'UPSSSC_XRAY_TECHNICIAN',
  'upsssc-lab-technician': 'UPSSSC_LAB_TECHNICIAN',
  'bihar-dcece-pm': 'BIHAR_DCECE_PM',
  'bihar-bcece': 'BIHAR_BCECE',
  'mp-pat': 'MP_PAT',
  'mp-pnst': 'MP_PNST',
  'ruhs-bsc-nursing': 'RUHS_BSC_NURSING',
  'rajasthan-jet': 'RAJASTHAN_JET',
  'up-police-constable': 'UP_POLICE_CONSTABLE',
  'up-police-si': 'UP_POLICE_SI',
  'bihar-police-constable': 'BIHAR_POLICE_CONSTABLE',
  'bihar-police-si': 'BIHAR_POLICE_SI',
  'wbp-constable': 'WBP_CONSTABLE',
  'kp-constable': 'KP_CONSTABLE',
  'mp-police-constable': 'MP_POLICE_CONSTABLE',
  'rajasthan-police-constable': 'RAJASTHAN_POLICE_CONSTABLE',
  'imu-cet': 'IMU_CET'
};

// All 45 Exams List with normalized examId
export const OPENKOSH_EXAMS: OpenKoshExamSummary[] = (openkoshExamsJson as any[]).map((exam) => {
  const slug = (exam.link || '').replace(/\/syllabus\//g, '').replace(/\//g, '');
  const examId = OPENKOSH_SLUG_MAP[slug] || exam.title.toUpperCase().replace(/[-\s]/g, '_');
  return {
    ...exam,
    examId
  };
});

// All 45 Detailed Syllabuses
export const OPENKOSH_DETAILED_SYLLABUS: Record<string, OpenKoshDetailedExam> = openkoshDetailedJson as any;

/**
 * Normalizes input exam ID to OpenKosh canonical examId
 */
export function normalizeToOpenKoshId(rawExamId: string): string {
  if (!rawExamId) return 'UPSC_CSE';
  const clean = rawExamId.trim();

  // Direct match
  if (OPENKOSH_DETAILED_SYLLABUS[clean]) return clean;

  const lower = clean.toLowerCase().replace(/[\s\-_]/g, '');

  for (const key of Object.keys(OPENKOSH_DETAILED_SYLLABUS)) {
    if (key.toLowerCase().replace(/[\s\-_]/g, '') === lower) {
      return key;
    }
  }

  // Check slugs
  for (const [slug, id] of Object.entries(OPENKOSH_SLUG_MAP)) {
    if (slug.replace(/-/g, '') === lower || id.toLowerCase().replace(/[\s\-_]/g, '') === lower) {
      return id;
    }
  }

  // Partial match
  const found = OPENKOSH_EXAMS.find(e => 
    e.title.toLowerCase().replace(/[\s\-_]/g, '') === lower ||
    lower.includes(e.examId.toLowerCase().replace(/[\s\-_]/g, '')) ||
    e.examId.toLowerCase().replace(/[\s\-_]/g, '').includes(lower)
  );
  if (found) return found.examId;

  return clean;
}

/**
 * Get detailed syllabus & exam metadata by examId
 */
export function getOpenKoshDetailed(examId: string): OpenKoshDetailedExam | undefined {
  const normId = normalizeToOpenKoshId(examId);
  return OPENKOSH_DETAILED_SYLLABUS[normId] || Object.values(OPENKOSH_DETAILED_SYLLABUS).find(
    e => e.examId === normId || e.slug === examId.toLowerCase().replace(/_/g, '-')
  );
}

/**
 * Converts OpenKosh detailed syllabus into SyllabusTopic[] for SyllabusTracker
 */
export function convertOpenKoshToTopics(
  examId: string, 
  completedSet: Set<string> = new Set()
): SyllabusTopic[] {
  const exam = getOpenKoshDetailed(examId);
  if (!exam || !Array.isArray(exam.sections) || exam.sections.length === 0) {
    return [];
  }

  const topics: SyllabusTopic[] = [];

  exam.sections.forEach((section, sIdx) => {
    const stageName = section.title.includes('Mains') || section.title.includes('Tier-2') 
      ? 'Mains' 
      : 'Prelims';

    section.subjects.forEach((subj, subIdx) => {
      const topicId = `ok_${exam.examId}_${sIdx}_${subIdx}`;
      const subtopics: SubTopic[] = (subj.topics || []).map((t, tIdx) => {
        const subId = t.id || `${topicId}_sub_${tIdx}`;
        const isDone = completedSet.has(subId);
        return {
          id: subId,
          topicId: topicId,
          title: t.name,
          completed: isDone,
          estimatedHours: 2.5,
          weightage: 'High',
          notes: `${subj.title} - ${section.title}`,
          origin_official_id: subId,
          time_studied_seconds: 0
        };
      });

      const completedCount = subtopics.filter(s => s.completed).length;

      topics.push({
        id: topicId,
        exam: exam.examId,
        title: subj.title,
        category: subj.title,
        stage: stageName as any,
        completed: subtopics.length > 0 && completedCount === subtopics.length,
        subtopicsCount: subtopics.length,
        completedSubtopics: completedCount,
        weightage: 'High',
        notes: `${subj.marks ? subj.marks + ' | ' : ''}${subj.questions ? subj.questions + ' | ' : ''}${section.title}`,
        subtopics: subtopics
      });
    });
  });

  return topics;
}

/**
 * Converts OpenKosh data to flat SyllabusHierarchyNode[]
 */
export function convertOpenKoshToSyllabusNodes(examId: string): SyllabusHierarchyNode[] {
  const exam = getOpenKoshDetailed(examId);
  if (!exam || !Array.isArray(exam.sections)) return [];

  const nodes: SyllabusHierarchyNode[] = [];

  exam.sections.forEach((section, sIdx) => {
    section.subjects.forEach((subj, subIdx) => {
      (subj.topics || []).forEach((t, tIdx) => {
        const id = t.id || `${exam.examId}_${sIdx}_${subIdx}_${tIdx}`;
        nodes.push({
          id,
          exam: exam.examId,
          paper: section.title,
          subject: subj.title,
          chapter: subj.title,
          topic: t.name,
          subtopic: t.name,
          title: t.name,
          stage: section.title.includes('Mains') ? 'Mains' : 'Prelims',
          weightage: 'High',
          estimatedHours: 2.5,
          completed: false,
          description: `${subj.marks ? subj.marks + ' | ' : ''}${subj.questions ? subj.questions + ' questions | ' : ''}${section.description || ''}`,
          difficulty: exam.difficulty === 'High' ? 'Hard' : exam.difficulty === 'Low' ? 'Easy' : 'Medium',
          recommendedBooks: (exam.books || []).map(b => `${b.book} (${b.author})`),
          pyqCount: 10
        });
      });
    });
  });

  return nodes;
}

/**
 * Get related exams for discovery/continuation
 */
export function getRelatedExams(examId: string, limit = 3): OpenKoshExamSummary[] {
  const current = getOpenKoshDetailed(examId);
  if (!current) return OPENKOSH_EXAMS.slice(0, limit);

  const related = OPENKOSH_EXAMS.filter(e => 
    e.examId !== current.examId && (e.category === current.category || e.location === current.location)
  );

  if (related.length >= limit) {
    return related.slice(0, limit);
  }

  // Fill with popular national exams
  const remaining = OPENKOSH_EXAMS.filter(e => e.examId !== current.examId && !related.includes(e));
  return [...related, ...remaining].slice(0, limit);
}
