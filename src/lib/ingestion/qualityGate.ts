// ============================================================
// QUALITY GATE — 0–100 Scoring
// ============================================================

import type { RepairedQuestion, QualityBreakdown, QualityStatus } from './types.js';

/**
 * Critical failures — any one of these means the question
 * must NEVER be published to students.
 */
function detectCriticalFailures(q: Partial<RepairedQuestion>): string[] {
  const failures: string[] = [];

  // No question text
  if (!q.questionText || q.questionText.trim().length < 10) {
    failures.push('MISSING_QUESTION_TEXT');
  }

  // Fewer than 4 options (for MCQ)
  if (!q.options || q.options.length < 4) {
    failures.push('FEWER_THAN_4_OPTIONS');
  }

  // Unreadable text (replacement chars, extreme shortness)
  if (q.questionText && /\uFFFD/.test(q.questionText)) {
    failures.push('REPLACEMENT_CHAR_IN_QUESTION');
  }

  // Options contain replacement chars
  if (q.options && q.options.some(o => /\uFFFD/.test(o))) {
    failures.push('REPLACEMENT_CHAR_IN_OPTIONS');
  }

  // All options are identical
  if (q.options && q.options.length >= 2) {
    const unique = new Set(q.options.map(o => o.trim().toLowerCase()));
    if (unique.size === 1) failures.push('ALL_OPTIONS_IDENTICAL');
  }

  // Any option is empty
  if (q.options && q.options.some(o => !o || o.trim().length === 0)) {
    failures.push('EMPTY_OPTION');
  }

  // Source document title in question text
  if (q.questionText) {
    const contamPatterns = [
      /SSC\s+(CGL|MTS|CHSL)\s+\d{4}/i,
      /Previous\s+Year\s+Question\s+Paper/i,
      /Official\s+Solved/i,
      /Answer\s+Key\s+\d{4}/i,
    ];
    if (contamPatterns.some(p => p.test(q.questionText!))) {
      failures.push('SOURCE_DOC_CONTAMINATION');
    }
  }

  return failures;
}

/**
 * Compute a 0–100 quality score.
 */
export function computeQualityScore(q: Partial<RepairedQuestion>): QualityBreakdown {
  const criticalFailures = detectCriticalFailures(q);

  // ── Readability (0–20) ─────────────────────────────────────
  let readability = 20;
  const text = String(q.questionText || '');
  if (text.length < 20) readability -= 10;
  else if (text.length < 50) readability -= 5;
  if ((q.qualityFlags || []).includes('split-math-tokens')) readability -= 8;
  if ((q.qualityFlags || []).includes('operator-run')) readability -= 5;
  if ((q.qualityFlags || []).includes('replacement-char')) readability -= 15;
  if ((q.qualityFlags || []).includes('empty-parens')) readability -= 4;
  if ((q.qualityFlags || []).includes('empty-log-parens')) readability -= 3;
  readability = Math.max(0, readability);

  // ── Option Completeness (0–20) ─────────────────────────────
  let optionCompleteness = 0;
  const opts = q.options || [];
  if (opts.length >= 4) optionCompleteness = 20;
  else if (opts.length === 3) optionCompleteness = 12;
  else if (opts.length === 2) optionCompleteness = 5;
  // Deduct for empty/short options
  opts.forEach(o => {
    if (!o || o.trim().length < 1) optionCompleteness -= 5;
    else if (o.trim().length < 3) optionCompleteness -= 2;
  });
  // Deduct for option bleed
  if ((q.qualityFlags || []).some(f => f.includes('bleed'))) optionCompleteness -= 5;
  optionCompleteness = Math.max(0, Math.min(20, optionCompleteness));

  // ── Answer Validity (0–20) ─────────────────────────────────
  let answerValidity = 0;
  if (q.answerVerified && q.correctOption !== null && q.correctOption !== undefined &&
      q.correctOption >= 0 && q.correctOption <= 3) {
    answerValidity = 20;
  } else if (!q.answerVerified && q.correctOption === null) {
    answerValidity = 8;  // Honest unverified is better than fake
  } else if ((q.qualityFlags || []).includes('ssc-answer-unverified')) {
    answerValidity = 5;  // Known unverified
  }
  // Suspicious: correctOption=0 across batch (but can't detect here — handled at batch level)

  // ── Subject Confidence (0–15) ──────────────────────────────
  const subjectConf = q.qualityBreakdown?.subjectConfidence ?? 0.5;
  const subjectScore = Math.round(subjectConf * 15);

  // ── Topic Confidence (0–10) ────────────────────────────────
  const topicConf = q.qualityBreakdown?.topicConfidence ?? 0.3;
  const topicScore = Math.round(topicConf * 10);

  // ── Math Repair Confidence (0–10) ─────────────────────────
  let mathScore = 10;
  if ((q.qualityFlags || []).includes('split-math-tokens')) mathScore -= 5;
  if ((q.qualityFlags || []).includes('empty-log-parens')) mathScore -= 4;
  if ((q.qualityFlags || []).includes('empty-parens')) mathScore -= 3;
  if ((q.qualityFlags || []).includes('operator-run')) mathScore -= 4;
  if (q.mathRepaired) mathScore = Math.max(mathScore, 6); // repair attempted
  mathScore = Math.max(0, mathScore);

  // ── Question Boundary Confidence (0–5) ────────────────────
  const boundaryConf = q.qualityBreakdown?.boundaryConfidence ?? 0.9;
  const boundaryScore = Math.round(boundaryConf * 5);

  const totalScore = readability + optionCompleteness + answerValidity +
                     subjectScore + topicScore + mathScore + boundaryScore;

  const warnings: string[] = [];
  if (readability < 10) warnings.push('Low readability score');
  if (answerValidity < 10) warnings.push('Answer unverified or invalid');
  if (subjectScore < 8) warnings.push('Subject classification uncertain');

  return {
    readability,
    optionCompleteness,
    answerValidity,
    subjectConfidence: subjectScore,
    topicConfidence: topicScore,
    mathRepairConfidence: mathScore,
    boundaryConfidence: boundaryScore,
    totalScore,
    criticalFailures,
    warnings,
  };
}

/**
 * Map quality score to status.
 * Score thresholds:
 *   >= 90 → auto_publish
 *   75–89 → needs_repair (attempt 2nd pass)
 *   < 75  → review
 *   critical failure → corrupted
 */
export function scoreToStatus(breakdown: QualityBreakdown): QualityStatus {
  if (breakdown.criticalFailures.length > 0) return 'corrupted';
  if (breakdown.totalScore >= 90) return 'auto_publish';
  if (breakdown.totalScore >= 75) return 'needs_repair';
  return 'review';
}

/**
 * Validate a complete question before insertion.
 * Returns list of validation errors (empty = valid).
 */
export function validateForInsertion(q: RepairedQuestion): string[] {
  const errors: string[] = [];

  if (!q.questionText || q.questionText.trim().length < 10)
    errors.push('Question text too short');

  if (!q.options || q.options.length < 4)
    errors.push('Fewer than 4 options');

  if (q.options.some(o => !o || o.trim().length === 0))
    errors.push('One or more empty options');

  if (q.answerVerified && (q.correctOption === null || q.correctOption < 0 || q.correctOption > 3))
    errors.push('Invalid correctOption value');

  if (!q.exam) errors.push('Missing exam');
  if (!q.subject) errors.push('Missing subject');
  if (!q.year && q.year !== null) errors.push('Invalid year');

  if (q.qualityStatus === 'corrupted') errors.push('Quality status: corrupted');
  if (q.qualityScore < 60) errors.push('Quality score below minimum threshold');

  return errors;
}
