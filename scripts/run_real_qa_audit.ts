import fs from 'fs';
import { OFFICIAL_EXAM_REGISTRY, EXAM_ALIAS_MAP } from '../src/lib/autoFetch/sourceRegistry.js';

interface ExamContentRecord {
  exam_id: string;
  type: 'syllabus' | 'pyq' | 'question_bank';
  source_url: string;
  source_type?: string;
  fetched_at: string;
  status: string;
  confidence_score: number;
  needs_human_review: boolean;
  review_reason?: string;
  sections?: Array<{
    title: string;
    topics: string[];
    exam_stage?: string;
  }>;
  questions?: Array<{
    id?: string;
    question: string;
    options?: string[];
    correct_answer?: string | number;
    explanation?: string;
    year?: number | string;
    stage?: string;
    topic?: string;
  }>;
}

const rawData = fs.readFileSync('data/exam_content.json', 'utf8');
const store: Record<string, ExamContentRecord> = JSON.parse(rawData);

console.log(`\n================================================================================`);
console.log(`🔍 EXAM DATA AUTO-FETCH: COMPREHENSIVE QA AUDIT OF STORED RECORDS`);
console.log(`================================================================================`);
console.log(`Total Stored Cache Keys: ${Object.keys(store).length}\n`);

// QA Metric Counters
const metrics = {
  totalRecordsScanned: 0,
  fallbackRecords: 0,
  officialRecords: 0,
  checks: {
    brokenGarbledText: { passed: 0, failed: 0, failures: [] as any[] },
    answerOptionMismatch: { passed: 0, failed: 0, failures: [] as any[] },
    blankYearStage: { passed: 0, failed: 0, failures: [] as any[] },
    examIdConsistency: { passed: 0, failed: 0, failures: [] as any[] },
    topicNamingConsistency: { passed: 0, failed: 0, failures: [] as any[] },
  }
};

const garbledPatterns = [
  /<[^>]+>/i,                    // HTML tags
  /\{\{[^}]+\}\}/i,              // wikitext templates or Angular interpolations
  /\{\|[\s\S]*?\|\}/,            // wikitext tables
  /Jump to content|Personal tools|Donate|Create account|Log in/i, // Wiki navigation
  /Translate|HIGHCONT_HM|Setting_HM|FONT_HM/i, // Portal UI keys
  /\\"[,\}:]|fgcolor|logo_caption/i, // wikitext json leak
  /^\s*[0-9\.\-\*#]+\s*$/        // lone numbers/bullets
];

for (const [key, record] of Object.entries(store)) {
  metrics.totalRecordsScanned++;
  const isFallback = record.source_url?.includes('wikipedia.org') || 
                     record.review_reason?.includes('heuristic') ||
                     record.confidence_score < 0.8;
  
  if (isFallback) metrics.fallbackRecords++;
  else metrics.officialRecords++;

  const examId = record.exam_id;

  // -------------------------------------------------------------
  // CHECK 1: Broken / Garbled Text Scan
  // -------------------------------------------------------------
  let hasGarbled = false;
  const garbledSamples: string[] = [];

  // Check sections & topics
  if (record.sections) {
    for (const sec of record.sections) {
      for (const pat of garbledPatterns) {
        if (pat.test(sec.title)) {
          hasGarbled = true;
          garbledSamples.push(`Section title: "${sec.title.slice(0, 60)}" matches ${pat}`);
          break;
        }
      }
      for (const t of (sec.topics || [])) {
        for (const pat of garbledPatterns) {
          if (pat.test(t)) {
            hasGarbled = true;
            if (garbledSamples.length < 3) {
              garbledSamples.push(`Topic: "${t.slice(0, 60)}" matches ${pat}`);
            }
            break;
          }
        }
      }
    }
  }

  // Check questions
  if (record.questions) {
    for (const q of record.questions) {
      for (const pat of garbledPatterns) {
        if (pat.test(q.question)) {
          hasGarbled = true;
          garbledSamples.push(`Question: "${q.question.slice(0, 60)}" matches ${pat}`);
          break;
        }
      }
    }
  }

  if (hasGarbled) {
    metrics.checks.brokenGarbledText.failed++;
    metrics.checks.brokenGarbledText.failures.push({
      key,
      examId,
      samples: garbledSamples.slice(0, 2)
    });
  } else {
    metrics.checks.brokenGarbledText.passed++;
  }

  // -------------------------------------------------------------
  // CHECK 2: Answer-Key / Option Mismatch Scan (Questions only)
  // -------------------------------------------------------------
  if (record.type === 'pyq' || record.type === 'question_bank') {
    const questions = record.questions || [];
    if (questions.length === 0) {
      // Empty question bucket flagged under Check 3 or reported separately
      metrics.checks.answerOptionMismatch.passed++;
    } else {
      let qFailed = false;
      const qFailures: string[] = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.options || q.options.length < 2) {
          qFailed = true;
          qFailures.push(`Q[${i}]: Insufficient options (<2)`);
        } else if (q.correct_answer === undefined || q.correct_answer === null) {
          qFailed = true;
          qFailures.push(`Q[${i}]: Missing correct_answer`);
        }
      }
      if (qFailed) {
        metrics.checks.answerOptionMismatch.failed++;
        metrics.checks.answerOptionMismatch.failures.push({ key, examId, qFailures: qFailures.slice(0, 3) });
      } else {
        metrics.checks.answerOptionMismatch.passed++;
      }
    }
  } else {
    // Does not apply to syllabus records
    metrics.checks.answerOptionMismatch.passed++;
  }

  // -------------------------------------------------------------
  // CHECK 3: Blank Year / Stage Scan
  // -------------------------------------------------------------
  if (record.type === 'pyq') {
    const questions = record.questions || [];
    let blankFound = false;
    const blankSamples: string[] = [];
    if (questions.length === 0) {
      blankFound = true;
      blankSamples.push('PYQ record has 0 questions (cannot verify year/stage)');
    } else {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.year || q.year === 'N/A' || q.year === '') {
          blankFound = true;
          blankSamples.push(`Q[${i}]: Missing year`);
        }
        if (!q.stage || q.stage === 'N/A' || q.stage === '') {
          blankFound = true;
          blankSamples.push(`Q[${i}]: Missing stage`);
        }
        if (blankSamples.length >= 2) break;
      }
    }
    if (blankFound) {
      metrics.checks.blankYearStage.failed++;
      metrics.checks.blankYearStage.failures.push({ key, examId, blankSamples });
    } else {
      metrics.checks.blankYearStage.passed++;
    }
  } else if (record.type === 'syllabus') {
    // Check if sections have blank stages
    const sections = record.sections || [];
    let blankSecStage = false;
    for (const sec of sections) {
      if (!sec.exam_stage || sec.exam_stage.trim() === '') {
        blankSecStage = true;
        break;
      }
    }
    if (blankSecStage) {
      metrics.checks.blankYearStage.failed++;
      metrics.checks.blankYearStage.failures.push({ key, examId, reason: 'Syllabus has sections with blank exam_stage' });
    } else {
      metrics.checks.blankYearStage.passed++;
    }
  }

  // -------------------------------------------------------------
  // CHECK 4: Exam ID Consistency Scan
  // -------------------------------------------------------------
  const [keyExamId] = key.split('::');
  const isRegistered = !!OFFICIAL_EXAM_REGISTRY[examId] || !!OFFICIAL_EXAM_REGISTRY[keyExamId];
  if (!examId || examId !== keyExamId || !isRegistered) {
    metrics.checks.examIdConsistency.failed++;
    metrics.checks.examIdConsistency.failures.push({
      key,
      recordExamId: examId,
      keyExamId,
      isRegistered
    });
  } else {
    metrics.checks.examIdConsistency.passed++;
  }

  // -------------------------------------------------------------
  // CHECK 5: Topic / Subtopic Naming Consistency Scan
  // -------------------------------------------------------------
  let namingIssue = false;
  const namingSamples: string[] = [];

  if (record.sections) {
    if (record.sections.length === 0) {
      namingIssue = true;
      namingSamples.push('Zero sections present');
    }
    for (const sec of record.sections) {
      if (!sec.title || sec.title.trim().length < 2) {
        namingIssue = true;
        namingSamples.push(`Section title too short: "${sec.title}"`);
      }
      if (sec.title.toLowerCase().includes('error page') || sec.title.toLowerCase().includes('session expired')) {
        namingIssue = true;
        namingSamples.push(`Section title is an error page: "${sec.title}"`);
      }
      if (!sec.topics || sec.topics.length === 0) {
        namingIssue = true;
        namingSamples.push(`Section "${sec.title}" has 0 topics`);
      }
      for (const t of (sec.topics || [])) {
        if (t.trim().length <= 1) {
          namingIssue = true;
          namingSamples.push(`Topic string too short: "${t}"`);
          break;
        }
        if (t.length > 500) {
          namingIssue = true;
          namingSamples.push(`Topic string is paragraph prose (${t.length} chars)`);
          break;
        }
      }
      if (namingSamples.length >= 2) break;
    }
  }

  if (namingIssue) {
    metrics.checks.topicNamingConsistency.failed++;
    metrics.checks.topicNamingConsistency.failures.push({ key, examId, namingSamples });
  } else {
    metrics.checks.topicNamingConsistency.passed++;
  }
}

console.log(`================================================================================`);
console.log(`📊 AUDIT RESULTS SUMMARY:`);
console.log(`================================================================================`);
console.log(`Total Records Scanned:  ${metrics.totalRecordsScanned}`);
console.log(`Fallback Records:       ${metrics.fallbackRecords}`);
console.log(`Official Records:       ${metrics.officialRecords}`);
console.log(`--------------------------------------------------------------------------------`);
console.log(`1. Broken/Garbled Text Scan:`);
console.log(`   - PASSED: ${metrics.checks.brokenGarbledText.passed}`);
console.log(`   - FAILED: ${metrics.checks.brokenGarbledText.failed}`);
console.log(`   - Failure Rate: ${((metrics.checks.brokenGarbledText.failed / metrics.totalRecordsScanned) * 100).toFixed(1)}%`);
console.log(`   - Sample Failures (first 3):`, JSON.stringify(metrics.checks.brokenGarbledText.failures.slice(0, 3), null, 2));

console.log(`\n2. Answer-Key / Option Mismatch Scan:`);
console.log(`   - PASSED: ${metrics.checks.answerOptionMismatch.passed}`);
console.log(`   - FAILED: ${metrics.checks.answerOptionMismatch.failed}`);

console.log(`\n3. Blank Year / Stage Scan:`);
console.log(`   - PASSED: ${metrics.checks.blankYearStage.passed}`);
console.log(`   - FAILED: ${metrics.checks.blankYearStage.failed}`);
console.log(`   - Sample Failures (first 3):`, JSON.stringify(metrics.checks.blankYearStage.failures.slice(0, 3), null, 2));

console.log(`\n4. Exam ID Consistency Scan:`);
console.log(`   - PASSED: ${metrics.checks.examIdConsistency.passed}`);
console.log(`   - FAILED: ${metrics.checks.examIdConsistency.failed}`);

console.log(`\n5. Topic / Subtopic Naming Consistency Scan:`);
console.log(`   - PASSED: ${metrics.checks.topicNamingConsistency.passed}`);
console.log(`   - FAILED: ${metrics.checks.topicNamingConsistency.failed}`);
console.log(`   - Failure Rate: ${((metrics.checks.topicNamingConsistency.failed / metrics.totalRecordsScanned) * 100).toFixed(1)}%`);
console.log(`   - Sample Failures (first 3):`, JSON.stringify(metrics.checks.topicNamingConsistency.failures.slice(0, 3), null, 2));
console.log(`================================================================================\n`);
