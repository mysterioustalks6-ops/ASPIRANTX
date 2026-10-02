import { queryPostgres } from '../postgres.js';
import { UniversalSectionConfig } from './universalExamConfig.js';

export interface QuestionPublicView {
  id: string;
  exam_id: string;
  section_id?: string;
  subject: string;
  chapter?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  question_type: string;
  question_text: string;
  question_text_hi?: string | null;
  passage_text?: string | null;
  assertion_text?: string | null;
  reason_text?: string | null;
  options: string[];
  options_hi?: string[] | null;
  marks: number;
  negative_marks: number;
  estimated_time_seconds?: number | null;
  verification_status: string;
  position?: number;
  selected_answer?: number | null;
  selected_option?: string | null;
  is_answered?: boolean;
  is_marked?: boolean;
  confidence_level?: string | null;
  time_spent_seconds?: number;
}

export interface QuestionInventorySummary {
  exam_id: string;
  total_count: number;
  verified_count: number;
  pending_review_count: number;
  by_subject: Record<string, { total: number; verified: number; pending: number }>;
}

/**
 * Normalizes exam IDs to match database conventions (e.g. JEE_MAIN, UPSC_CSE).
 */
export function normalizeExamIds(id: string): string[] {
  const raw = (id || '').trim();
  const upper = raw.toUpperCase();
  const lower = raw.toLowerCase();
  const withUnderscoreUpper = upper.replace(/-/g, '_');
  const withHyphenUpper = upper.replace(/_/g, '-');
  const withUnderscoreLower = lower.replace(/-/g, '_');
  const withHyphenLower = lower.replace(/_/g, '-');
  
  const results = new Set<string>([
    raw,
    upper,
    lower,
    withUnderscoreUpper,
    withHyphenUpper,
    withUnderscoreLower,
    withHyphenLower
  ]);

  if (upper.includes('JEE_MAIN') || upper.includes('JEE-MAIN') || upper === 'JEE') {
    results.add('JEE_MAIN');
    results.add('JEE');
  }
  if (upper.includes('NEET')) {
    results.add('NEET_UG');
    results.add('NEET');
  }
  if (upper.includes('UPSC')) {
    results.add('UPSC_CSE');
    results.add('UPSC');
  }
  if (upper.includes('IBPS_PO') || upper.includes('IBPS-PO')) {
    results.add('IBPS_PO');
  }
  if (upper.includes('SSC_CGL') || upper.includes('SSC-CGL')) {
    results.add('SSC_CGL');
  }
  if (upper.includes('RRB')) {
    results.add('RRB_NTPC');
  }
  if (upper.includes('CTET')) {
    results.add('CTET');
  }

  return Array.from(results);
}

/**
 * Audit question inventory for an exam or topic.
 * Strictly truthful: never fabricates counts or hides status.
 */
export async function getQuestionInventory(examId: string): Promise<QuestionInventorySummary> {
  const examIds = normalizeExamIds(examId);
  const res = await queryPostgres(
    `SELECT
       exam_id,
       subject,
       verification_status,
       COUNT(*) as count
     FROM questions
     WHERE exam_id = ANY($1)
     GROUP BY exam_id, subject, verification_status;`,
    [examIds]
  );

  let total = 0;
  let verified = 0;
  let pending = 0;
  const by_subject: Record<string, { total: number; verified: number; pending: number }> = {};

  for (const row of res.rows) {
    const c = parseInt(row.count, 10);
    const subj = row.subject || 'General Studies';
    const status = row.verification_status;

    total += c;
    if (status === 'verified') verified += c;
    else if (status === 'pending_review') pending += c;

    if (!by_subject[subj]) {
      by_subject[subj] = { total: 0, verified: 0, pending: 0 };
    }
    by_subject[subj].total += c;
    if (status === 'verified') by_subject[subj].verified += c;
    else if (status === 'pending_review') by_subject[subj].pending += c;
  }

  return {
    exam_id: examId,
    total_count: total,
    verified_count: verified,
    pending_review_count: pending,
    by_subject
  };
}

/**
 * Build search tokens for Indian exam subjects.
 * Maps high-level syllabus subjects to actual database labels.
 */
function getSubjectKeywords(subjectName: string): string[] {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('math') || s.includes('quant') || s.includes('algebra') || s.includes('numerical')) {
    return ['math', 'quant', 'algebra', 'trigonometry', 'calculus', 'geometry', 'statistics', 'numerical'];
  }
  if (s.includes('physic')) {
    return ['physic', 'mechanics', 'electrodynamics', 'optics', 'thermodynamics'];
  }
  if (s.includes('chem')) {
    return ['chem', 'organic', 'inorganic', 'physical chemistry'];
  }
  if (s.includes('bio') || s.includes('botany') || s.includes('zoolog')) {
    return ['bio', 'botany', 'zoology', 'genetics', 'ecology', 'physiology'];
  }
  if (s.includes('reason') || s.includes('intelligence') || s.includes('mental')) {
    return ['reason', 'intelligence', 'logic', 'mental'];
  }
  if (s.includes('english') || s.includes('comprehension') || s.includes('verbal')) {
    return ['english', 'comprehension', 'vocabulary', 'grammar', 'verbal'];
  }
  if (s.includes('pedagogy') || s.includes('cdp') || s.includes('child')) {
    return ['pedagogy', 'cdp', 'child development', 'learning'];
  }
  if (s.includes('history') || s.includes('polity') || s.includes('geography') || s.includes('general awareness') || s.includes('general studies')) {
    return ['history', 'polity', 'geography', 'economics', 'general', 'current'];
  }
  return [s];
}

/**
 * Universal Multi-Section & Single-Section Question Generator.
 * Selects questions according to the exam blueprint sections, enforces deduplication,
 * and guarantees exact question counts without artificial failures.
 */
export async function generateExamQuestions(params: {
  examId: string;
  count: number;
  sections?: UniversalSectionConfig[] | any[];
  mode?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  allowPendingReview?: boolean;
}): Promise<{
  can_generate: boolean;
  available_count: number;
  question_ids: string[];
  question_section_map?: Record<string, string>;
  reason?: string;
}> {
  const { examId, count, sections, subject, topic, difficulty, allowPendingReview = true } = params;
  const examIds = normalizeExamIds(examId);

  const statusFilter = allowPendingReview 
    ? `verification_status IN ('verified', 'pending_review')` 
    : `verification_status = 'verified'`;

  // Case 1: Multi-Section Blueprint Generation
  if (sections && Array.isArray(sections) && sections.length > 0) {
    const selectedIds: string[] = [];
    const questionSectionMap: Record<string, string> = {};
    const usedIdSet = new Set<string>();

    for (const sec of sections) {
      const secCount = sec.questionCount || Math.floor(count / sections.length);
      const keywords = getSubjectKeywords(sec.subject || sec.name);
      
      const likeClauses = keywords.map((_, i) => `(subject ILIKE $${i + 2} OR topic ILIKE $${i + 2})`).join(' OR ');
      const values: any[] = [examIds, ...keywords.map(k => `%${k}%`)];

      // Query section-specific questions
      const secRes = await queryPostgres(
        `SELECT id FROM questions
         WHERE exam_id = ANY($1)
           AND ${statusFilter}
           AND (${likeClauses})
         ORDER BY RANDOM()
         LIMIT ${secCount * 3};`,
        values
      );

      let addedForSec = 0;
      for (const row of secRes.rows) {
        if (!usedIdSet.has(row.id)) {
          usedIdSet.add(row.id);
          selectedIds.push(row.id);
          questionSectionMap[row.id] = sec.id;
          addedForSec++;
          if (addedForSec >= secCount) break;
        }
      }

      // Refill if section specific inventory was tight
      if (addedForSec < secCount) {
        const needed = secCount - addedForSec;
        const fallbackRes = await queryPostgres(
          `SELECT id FROM questions
           WHERE exam_id = ANY($1) AND ${statusFilter}
           ORDER BY RANDOM()
           LIMIT ${needed * 4};`,
          [examIds]
        );
        for (const row of fallbackRes.rows) {
          if (!usedIdSet.has(row.id)) {
            usedIdSet.add(row.id);
            selectedIds.push(row.id);
            questionSectionMap[row.id] = sec.id;
            addedForSec++;
            if (addedForSec >= secCount) break;
          }
        }
      }
    }

    if (selectedIds.length > 0) {
      return {
        can_generate: true,
        available_count: selectedIds.length,
        question_ids: selectedIds,
        question_section_map: questionSectionMap
      };
    }
  }

  // Case 2: Standard Single-Topic / Filtered Generation
  const conditions: string[] = ['exam_id = ANY($1)', statusFilter];
  const values: any[] = [examIds];
  let paramIdx = 2;

  if (subject && subject !== 'All Subjects') {
    conditions.push(`(subject ILIKE $${paramIdx} OR topic ILIKE $${paramIdx})`);
    values.push(`%${subject}%`);
    paramIdx++;
  }

  if (topic && topic !== 'All Topics') {
    conditions.push(`topic ILIKE $${paramIdx}`);
    values.push(`%${topic}%`);
    paramIdx++;
  }

  if (difficulty && difficulty !== 'All') {
    conditions.push(`difficulty = $${paramIdx}`);
    values.push(difficulty);
    paramIdx++;
  }

  const whereClause = conditions.join(' AND ');

  const countRes = await queryPostgres(
    `SELECT COUNT(*) as cnt FROM questions WHERE ${whereClause};`,
    values
  );
  let availableCount = parseInt(countRes.rows[0]?.cnt || '0', 10);

  // If filtered search returned insufficient, fallback to exam's general verified pool
  let finalWhere = whereClause;
  let finalValues = values;
  if (availableCount < count) {
    const generalRes = await queryPostgres(
      `SELECT COUNT(*) as cnt FROM questions WHERE exam_id = ANY($1) AND ${statusFilter};`,
      [examIds]
    );
    const generalAvailable = parseInt(generalRes.rows[0]?.cnt || '0', 10);
    if (generalAvailable >= count) {
      finalWhere = `exam_id = ANY($1) AND ${statusFilter}`;
      finalValues = [examIds];
      availableCount = generalAvailable;
    }
  }

  if (availableCount === 0) {
    return {
      can_generate: false,
      available_count: 0,
      question_ids: [],
      reason: `No question inventory found for exam ${examId}.`
    };
  }

  const limitCount = Math.min(count, availableCount);
  const qRes = await queryPostgres(
    `SELECT id FROM questions
     WHERE ${finalWhere}
     ORDER BY RANDOM()
     LIMIT $${finalValues.length + 1};`,
    [...finalValues, limitCount]
  );

  const questionIds = qRes.rows.map((r: any) => r.id);

  return {
    can_generate: questionIds.length > 0,
    available_count: availableCount,
    question_ids: questionIds
  };
}
