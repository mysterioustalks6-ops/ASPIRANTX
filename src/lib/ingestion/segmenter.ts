// ============================================================
// QUESTION SEGMENTER
// Splits raw extracted text into individual questions.
// Enforces strict QUESTION_BOUNDARY_CHECK.
// ============================================================

export interface SegmentedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  rawAnswer?: string;
  boundaryConfidence: number;  // 0–1
  segmentationWarnings: string[];
}

/**
 * Normalize extracted text before segmentation.
 * Collapses excessive whitespace, fixes common OCR artifacts.
 */
export function normalizeExtractedText(text: string): string {
  let s = String(text || '');

  // Fix: "India  s Constitution" → "India's Constitution"
  s = s.replace(/([a-zA-Z])\s{2,}s\b/g, "$1's");

  // Fix: multiple spaces inside words → single space
  s = s.replace(/([a-zA-Z])\s{2,}([a-zA-Z])/g, '$1 $2');

  // Fix: multiple spaces → single space (within line)
  s = s.replace(/[ \t]{2,}/g, ' ');

  // Fix: repeated newlines → max 2
  s = s.replace(/\n{3,}/g, '\n\n');

  // Fix: stray replacement characters
  s = s.replace(/\uFFFD/g, '');

  // Fix: trailing/leading whitespace per line
  s = s.split('\n').map(l => l.trim()).join('\n');

  // Fix: remove pure page-number lines (standalone 1–4 digit numbers)
  s = s.replace(/^\d{1,4}$/gm, '');

  return s.trim();
}

// ── Question number patterns ──────────────────────────────
// Matches: "Q1", "1.", "Q.1", "01.", "1)", "Question 1", "(1)"
const Q_NUM_PATTERNS = [
  /^Q\.?\s*(\d{1,3})[\.\):\s]/i,
  /^(\d{1,3})\.\s+/,
  /^(\d{1,3})\)\s+/,
  /^(\d{2})\.\s+/,
  /^Question\s+(\d{1,3})[\.\):\s]/i,
  /^\((\d{1,3})\)\s+/,
];

// ── Option patterns ──────────────────────────────────────
// Matches: "A.", "(A)", "A)", "a.", "(a)", "1.", "1)"
const OPT_PATTERNS = [
  /^\(?([A-Da-d])\)?[\.\):\s]\s*/,
  /^\(?([1-4])\)?[\.\):\s]\s*/,
];

function detectQuestionStart(line: string): number | null {
  for (const p of Q_NUM_PATTERNS) {
    const m = line.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function detectOptionLabel(line: string): string | null {
  for (const p of OPT_PATTERNS) {
    const m = line.match(p);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

function isOptionLine(line: string): boolean {
  return detectOptionLabel(line) !== null;
}

function stripOptionPrefix(line: string): string {
  for (const p of OPT_PATTERNS) {
    const m = line.match(p);
    if (m) return line.slice(m[0].length).trim();
  }
  return line.trim();
}

/** Validate that a segmented question has proper boundaries */
function validateBoundary(q: SegmentedQuestion): void {
  // Check if any option contains next-question text
  q.options.forEach((opt, idx) => {
    for (const p of Q_NUM_PATTERNS) {
      const inner = opt.split('\n');
      for (let i = 1; i < inner.length; i++) {
        if (p.test(inner[i])) {
          q.segmentationWarnings.push(`option-${idx}-bleed: next question detected in option text`);
          // Trim the option at the bleeding point
          q.options[idx] = inner.slice(0, i).join('\n').trim();
          q.boundaryConfidence = Math.min(q.boundaryConfidence, 0.7);
        }
      }
    }
  });

  // Check option is not empty after trim
  q.options = q.options.map(o => String(o || '').trim()).filter(o => o.length > 0);
}

/**
 * Main segmentation function.
 * Takes normalized text, returns array of segmented questions.
 */
export function segmentQuestions(text: string): SegmentedQuestion[] {
  const normalized = normalizeExtractedText(text);
  const lines = normalized.split('\n');

  const questions: SegmentedQuestion[] = [];
  let current: SegmentedQuestion | null = null;
  let currentOptLabel: string | null = null;
  let lastOptIdx = -1;

  const finalizeQuestion = () => {
    if (current) {
      validateBoundary(current);
      if (current.questionText.trim().length > 10) {
        questions.push(current);
      }
      current = null;
      currentOptLabel = null;
      lastOptIdx = -1;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect question start
    const qNum = detectQuestionStart(trimmed);
    if (qNum !== null) {
      finalizeQuestion();
      current = {
        questionNumber: qNum,
        questionText: trimmed.replace(Q_NUM_PATTERNS[0], '').replace(Q_NUM_PATTERNS[1], '').replace(Q_NUM_PATTERNS[2], '').trim(),
        options: [],
        boundaryConfidence: 0.9,
        segmentationWarnings: [],
      };
      // Remove question number prefix properly
      for (const p of Q_NUM_PATTERNS) {
        const m = trimmed.match(p);
        if (m) {
          current.questionText = trimmed.slice(m[0].length).trim();
          break;
        }
      }
      currentOptLabel = null;
      lastOptIdx = -1;
      continue;
    }

    if (!current) continue;

    // Detect option line
    const optLabel = detectOptionLabel(trimmed);
    if (optLabel && ['A', 'B', 'C', 'D', '1', '2', '3', '4'].includes(optLabel)) {
      const optText = stripOptionPrefix(trimmed);
      const optIdx = ['A', '1'].includes(optLabel) ? 0 :
                     ['B', '2'].includes(optLabel) ? 1 :
                     ['C', '3'].includes(optLabel) ? 2 : 3;

      // Validate option ordering — should be sequential
      if (lastOptIdx !== -1 && optIdx !== lastOptIdx + 1) {
        current.segmentationWarnings.push(`option-order-gap: expected opt ${lastOptIdx + 1} got ${optIdx}`);
        current.boundaryConfidence = Math.min(current.boundaryConfidence, 0.75);
      }

      current.options[optIdx] = optText;
      currentOptLabel = optLabel;
      lastOptIdx = optIdx;
      continue;
    }

    // Answer line detection ("Answer: C", "Ans. B", "Correct: 2")
    const ansMatch = trimmed.match(/^(?:Ans(?:wer)?|Correct(?:\s+Answer)?)\s*[:\.\)]\s*([A-D1-4])/i);
    if (ansMatch) {
      current.rawAnswer = ansMatch[1];
      continue;
    }

    // Otherwise: continuation of current context (question text or last option)
    if (currentOptLabel !== null && lastOptIdx >= 0) {
      // Append to last option
      current.options[lastOptIdx] = (current.options[lastOptIdx] || '') + ' ' + trimmed;
    } else {
      // Append to question text
      current.questionText = (current.questionText + ' ' + trimmed).trim();
    }
  }

  finalizeQuestion();
  return questions;
}

/**
 * Segment plain text that contains numbered MCQs.
 * Also handles unlabelled question blocks.
 */
export function segmentPastedText(text: string): SegmentedQuestion[] {
  // Try standard numbered segmentation first
  const standard = segmentQuestions(text);
  if (standard.length > 0) return standard;

  // Fallback: treat the whole thing as one question
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const opts: string[] = [];
    const qLines: string[] = [];
    lines.forEach(l => {
      if (isOptionLine(l)) opts.push(stripOptionPrefix(l));
      else qLines.push(l);
    });
    if (qLines.length > 0) {
      return [{
        questionNumber: 1,
        questionText: qLines.join(' '),
        options: opts,
        boundaryConfidence: 0.6,
        segmentationWarnings: ['single-block-fallback'],
      }];
    }
  }

  return [];
}
