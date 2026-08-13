// ============================================================
// DEDUPLICATOR
// Exact duplicate detection via MD5 hash.
// Near-duplicate detection via normalized text similarity.
// ============================================================

import crypto from 'crypto';

/**
 * Create a canonical content hash for a question.
 * Normalizes text before hashing to catch minor whitespace differences.
 */
export function computeContentHash(questionText: string, options: string[]): string {
  const normalizedQ = questionText
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

  const normalizedOpts = [...options]
    .map(o => String(o || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim())
    .sort()   // sort so option order doesn't affect hash
    .join('|');

  return crypto
    .createHash('md5')
    .update(normalizedQ + '||' + normalizedOpts)
    .digest('hex');
}

/**
 * Compute normalized text similarity between two strings.
 * Returns 0–1 (1 = identical).
 * Uses token-level Jaccard similarity for speed.
 */
export function computeTextSimilarity(a: string, b: string): number {
  const tokenize = (s: string) => new Set(
    s.toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2)
  );

  const setA = tokenize(a);
  const setB = tokenize(b);

  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter(t => setB.has(t)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  duplicateType: 'exact' | 'near' | 'none';
  duplicateOf?: string;   // ID of the existing duplicate
  similarity?: number;    // 0–1 for near duplicates
}

/**
 * Check if a question is a duplicate against an existing hash store.
 * hashStore: Map<contentHash, questionId>
 * textStore: Map<questionId, questionText> (for near-dup check)
 */
export function checkDuplicate(
  questionText: string,
  options: string[],
  hashStore: Map<string, string>,   // hash → questionId
  textStore?: Map<string, string>,  // questionId → questionText
): DeduplicationResult {
  const hash = computeContentHash(questionText, options);

  // Exact duplicate check
  if (hashStore.has(hash)) {
    return {
      isDuplicate: true,
      duplicateType: 'exact',
      duplicateOf: hashStore.get(hash),
      similarity: 1.0,
    };
  }

  // Near-duplicate check (only when textStore provided)
  // Compare against a sample — not full DB scan for performance
  if (textStore) {
    const NEAR_DUP_THRESHOLD = 0.88;
    let maxSim = 0;
    let nearDupId: string | undefined;

    // Only check last N records for performance
    const entries = [...textStore.entries()].slice(-500);
    for (const [id, existingText] of entries) {
      const sim = computeTextSimilarity(questionText, existingText);
      if (sim > maxSim) {
        maxSim = sim;
        nearDupId = id;
      }
      if (maxSim >= NEAR_DUP_THRESHOLD) break;
    }

    if (maxSim >= NEAR_DUP_THRESHOLD) {
      return {
        isDuplicate: true,
        duplicateType: 'near',
        duplicateOf: nearDupId,
        similarity: maxSim,
      };
    }
  }

  return { isDuplicate: false, duplicateType: 'none' };
}

/**
 * Build a hash store from an existing question array.
 * Returns: hashStore and textStore.
 */
export function buildDedupStores(existingQuestions: Array<{ id: string; questionText: string; options: string[] }>): {
  hashStore: Map<string, string>;
  textStore: Map<string, string>;
} {
  const hashStore = new Map<string, string>();
  const textStore = new Map<string, string>();

  for (const q of existingQuestions) {
    const hash = computeContentHash(q.questionText || '', q.options || []);
    hashStore.set(hash, q.id);
    textStore.set(q.id, q.questionText || '');
  }

  return { hashStore, textStore };
}
