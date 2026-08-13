// ============================================================
// MATH AUTO-REPAIR ENGINE
// Only applies transformations with high confidence.
// Ambiguous cases are flagged for review, never guessed.
// ============================================================

export interface MathRepairResult {
  text: string;
  changed: boolean;
  confidence: number;   // 0–1
  flags: string[];
}

/** Superscript unicode map */
const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '⁺', 'n': 'ⁿ', 'x': 'ˣ',
};

/** Subscript unicode map */
const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};

function toSup(s: string): string {
  return s.split('').map(c => SUP[c] || c).join('');
}

function toSub(s: string): string {
  return s.split('').map(c => SUB[c] || c).join('');
}

/**
 * Repair mathematical notation extracted by PyMuPDF.
 * Only applies DETERMINISTIC, HIGH-CONFIDENCE transforms.
 * Any ambiguous case returns the original text + a flag.
 */
export function repairMathText(text: string): MathRepairResult {
  let s = String(text || '');
  let changed = false;
  const flags: string[] = [];
  let confidence = 1.0;

  // ── Rule 1: Same-letter repeated with digit ──────────────
  // "x x2" → "x²"  (PyMuPDF superscript extraction artifact)
  // Only when: letter SPACE same-letter digit(s)
  // High confidence — pattern is unambiguous
  s = s.replace(/\b([a-zA-Z])\s+\1(\d{1,2})\b/g, (_m, l, d) => {
    changed = true;
    return l + toSup(d);
  });

  // ── Rule 2: Variable + standalone ² ³ ─────────────────────
  // "x 2" adjacent to operator context → "x²"
  // Only when: letter SPACE digit AND digit is followed by operator/space
  // e.g., "x 2 + x" → "x² + x"
  // But NOT "sin 2x" (trig function — don't convert)
  const TRIG = /\b(sin|cos|tan|sec|cosec|cot|log|ln|exp)\s*/;
  s = s.replace(/(?<![a-zA-Z]{2,})([a-zA-Z])\s+(2|3)\b(?!\s*[a-zA-Z])/g, (_m, l, d, offset) => {
    const before = s.slice(Math.max(0, offset - 4), offset);
    if (TRIG.test(before)) return _m; // don't touch trig functions
    changed = true;
    return l + toSup(d);
  });

  // ── Rule 3: Chemical formulas ─────────────────────────────
  // "H 2 O" → "H₂O", "CO 2" → "CO₂"
  // Pattern: Element letter(s) SPACE digit SPACE Element
  const ELEMENTS = 'H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Fe|Cu|Zn|Ag|Au|Hg|Pb|N|Ca|Mg|Na|K|Cl|Br|I';
  const elemRe = new RegExp(`\\b(${ELEMENTS})\\s+(\\d+)(?:\\s+(${ELEMENTS}))?\\b`, 'g');
  s = s.replace(elemRe, (_m, el1, num, el2) => {
    changed = true;
    return el1 + toSub(num) + (el2 || '');
  });

  // ── Rule 4: Scientific notation ───────────────────────────
  // "10 -2" → "10⁻²", "10 -3" → "10⁻³"
  // Only when: digit(s) SPACE hyphen SPACE digit(s)
  s = s.replace(/\b(\d+)\s+-\s*(\d+)\b/g, (_m, base, exp) => {
    // Only for powers of 10 pattern
    if (base === '10') {
      changed = true;
      return base + toSup('-' + exp);
    }
    return _m;
  });

  // ── Rule 5: Subscript variables ──────────────────────────
  // "x 1" "x 2" as subscripts (when clearly a sequence)
  // "a 1 + a 2 + ... + a n" → "a₁ + a₂ + ... + aₙ"
  // High confidence when pattern repeats in sequence
  const subSeqRe = /\b([a-zA-Z])\s+(\d)\b(?=.*\1\s+\d)/g;
  const subMatches = [...s.matchAll(/\b([a-zA-Z])\s+(\d)\b/g)];
  const subLetters = subMatches.map(m => m[1]);
  // Only apply if same letter appears as subscript sequence 3+ times
  const subCounts: Record<string, number> = {};
  subLetters.forEach(l => { subCounts[l] = (subCounts[l] || 0) + 1; });
  Object.entries(subCounts).forEach(([letter, count]) => {
    if (count >= 3) {
      const re = new RegExp(`\\b${letter}\\s+(\\d)\\b`, 'g');
      const prev = s;
      s = s.replace(re, (_m, digit) => {
        changed = true;
        return letter + toSub(digit);
      });
      if (s !== prev) confidence = Math.min(confidence, 0.85);
    }
  });

  // ── Rule 6: Greek symbols (word → unicode) ────────────────
  // Only standalone words that are clearly Greek in context
  const GREEK: Record<string, string> = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
    'epsilon': 'ε', 'theta': 'θ', 'lambda': 'λ', 'mu': 'μ',
    'pi': 'π', 'sigma': 'σ', 'phi': 'φ', 'omega': 'ω',
    'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
    'Theta': 'Θ', 'Lambda': 'Λ', 'Pi': 'Π', 'Sigma': 'Σ',
    'Omega': 'Ω',
  };
  // Only replace when surrounded by math operators or spaces
  Object.entries(GREEK).forEach(([word, sym]) => {
    const re = new RegExp(`(?<=\\s|\\(|=)${word}(?=\\s|\\)|,|=|\\+|\\-|\\*|/|$)`, 'g');
    const prev = s;
    s = s.replace(re, sym);
    if (s !== prev) changed = true;
  });

  // ── Rule 7: Degree symbol ─────────────────────────────────
  // "30 o" → "30°", "45 °" already correct
  s = s.replace(/(\d+)\s+[oO](?=\s|$|,|\))/g, (_m, n) => {
    changed = true;
    return n + '°';
  });

  // ── Rule 8: Normalize whitespace within math expressions ──
  // Multiple spaces between operators
  s = s.replace(/\s{2,}/g, ' ').trim();

  // ── Detect remaining issues (flag, don't fix) ────────────
  // Empty parens (argument was lost in extraction)
  if (/\(\s*\)/.test(s)) {
    flags.push('empty-parens');
    confidence = Math.min(confidence, 0.6);
  }
  // log with empty arg
  if (/\b(log|ln)\s*\(\s*\)/.test(s)) {
    flags.push('empty-log-parens');
    confidence = Math.min(confidence, 0.5);
  }
  // Operator run — multiple operators bunched together
  if (/[+\-=]{3,}/.test(s)) {
    flags.push('operator-run');
    confidence = Math.min(confidence, 0.55);
  }
  // Still has "letter space letter+digit" (PyMuPDF artifact remaining)
  if (/[a-zA-Z]\s+[a-zA-Z]\d/.test(s)) {
    flags.push('split-math-tokens');
    confidence = Math.min(confidence, 0.65);
  }
  // Replacement char
  if (/\uFFFD/.test(s)) {
    flags.push('replacement-char');
    confidence = Math.min(confidence, 0.3);
  }

  return { text: s, changed, confidence, flags };
}

/**
 * Repair all options in a question.
 */
export function repairOptions(options: string[]): { options: string[]; changed: boolean; flags: string[] } {
  let changed = false;
  const allFlags: string[] = [];

  const repaired = options.map(opt => {
    const { text, changed: c, flags } = repairMathText(String(opt || ''));
    if (c) changed = true;
    allFlags.push(...flags);
    return text;
  });

  return { options: repaired, changed, flags: [...new Set(allFlags)] };
}

/**
 * Detect if text is a source document title/header that contaminated question text.
 * Returns true if the text looks like a PDF header/watermark.
 */
export function isSourceContamination(text: string): boolean {
  const t = String(text || '');
  return (
    /SSC\s+(CGL|MTS|CHSL|GD|CPO|JE)\s+\d{4}/i.test(t) ||
    /Previous\s+Year\s+Question\s+Paper/i.test(t) ||
    /Official\s+Solved\s+Paper/i.test(t) ||
    /Answer\s+Key/i.test(t) ||
    /UPSSSC\s+PET/i.test(t) ||
    /NDA\s+&\s+NA\s+\(\d{4}\)/i.test(t) ||
    /UPSC\s+Civil\s+Services/i.test(t)
  );
}

/**
 * Strip source document contamination from question text.
 * Returns cleaned text.
 */
export function stripSourceContamination(text: string): { text: string; stripped: boolean } {
  let s = String(text || '');
  let stripped = false;

  const endingPatterns = [
    /\s+in\s+(SSC|UPSSSC|NDA|NEET|UPSC|Railway|RRB|IBPS|SBI)[^?]{5,}(\?)?$/i,
    /\s+(SSC|UPSSSC)\s+(CGL|MTS|CHSL|GD|CPO|JE)\s+\d{4}[^?]{5,}(\?)?$/i,
    /\s+Previous\s+Year[^?]{10,}(\?)?$/i,
    /\s+Official\s+Solved[^?]{10,}(\?)?$/i,
    /\s+Answer\s+Key[^?]{10,}(\?)?$/i,
    /\s+Question\s+Paper[^?]{10,}(\?)?$/i,
    /\s+-\s+\d{4}[^?]{20,}(\?)?$/i,
  ];

  for (const p of endingPatterns) {
    const m = s.match(p);
    if (m && m.index !== undefined) {
      s = (s.slice(0, m.index) + (m[2] || m[1] ? '?' : '')).trim();
      stripped = true;
      break;
    }
  }

  return { text: s, stripped };
}
