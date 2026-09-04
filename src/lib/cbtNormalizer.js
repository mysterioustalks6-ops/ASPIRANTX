/**
 * Pure JavaScript Normalizers for CBT Questions and Tests
 * Shared between frontend components, background tasks, and verification suites.
 */

/**
 * Universal Question Normalizer
 * Enforces canonical 4 options, numeric correctOption (0-3), and positive marks / negative marks.
 */
export function normalizeCbtQuestion(raw, index) {
  const id = String(raw?.id || `q_${index + 1}`);
  const questionText = String(raw?.questionText || raw?.question || `Question ${index + 1}`);

  // Options normalization
  let rawOptions = raw?.options;
  let options = [];
  if (Array.isArray(rawOptions)) {
    options = rawOptions.map((opt) => {
      if (typeof opt === 'string') return opt;
      if (typeof opt === 'object' && opt !== null) {
        return String(opt.text || opt.label || opt.value || JSON.stringify(opt));
      }
      return String(opt ?? '');
    });
  } else if (typeof rawOptions === 'object' && rawOptions !== null) {
    options = Object.values(rawOptions).map(v => String(v));
  }
  if (options.length < 2) {
    options = ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  // Correct Option normalization (convert string labels, IDs, letters, or numbers to 0-3 index)
  let correctOption = 0;
  if (typeof raw?.correctOption === 'number' && Number.isFinite(raw.correctOption)) {
    correctOption = Math.max(0, Math.min(options.length - 1, Math.floor(raw.correctOption)));
  } else if (typeof raw?.correctOption === 'string') {
    const s = raw.correctOption.trim();
    const parsed = parseInt(s, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < options.length) {
      correctOption = parsed;
    } else if (/^[A-D]$/i.test(s)) {
      correctOption = s.toUpperCase().charCodeAt(0) - 65;
    } else {
      const idx = options.findIndex(o => o.toLowerCase() === s.toLowerCase());
      if (idx !== -1) correctOption = idx;
    }
  } else if (raw?.correctOptionId) {
    const match = String(raw.correctOptionId).match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed >= 0 && parsed < options.length) correctOption = parsed;
    }
  }

  const marks = Math.max(0.5, Math.abs(Number(raw?.marks) || 2));
  const negativeMarks = Math.abs(Number(raw?.negativeMarks) || 0.66);

  return {
    id,
    type: raw?.type || 'mcq',
    language: raw?.language === 'Hindi' ? 'Hindi' : 'English',
    questionText,
    passageText: raw?.passageText || undefined,
    assertionText: raw?.assertionText || undefined,
    reasonText: raw?.reasonText || undefined,
    options,
    correctOption,
    explanation: String(raw?.explanation || 'Refer to syllabus and standard textbooks for detailed breakdown.'),
    subject: String(raw?.subject || 'General'),
    topic: String(raw?.topic || 'General Practice'),
    section: String(raw?.section || raw?.subject || 'General'),
    marks,
    negativeMarks
  };
}

/**
 * Universal Test Normalizer
 * Enforces canonical CbtTest schema with non-empty sections and positive marking scheme.
 */
export function normalizeCbtTest(raw, fallbackExam = 'upsc_prelims') {
  const id = String(raw?.id || `test_${Date.now()}`);
  const title = String(raw?.title || 'Practice Examination');
  const exam = String(raw?.exam || fallbackExam);
  const durationMinutes = Math.max(1, Number(raw?.durationMinutes) || 30);
  const rawQuestions = Array.isArray(raw?.questions) ? raw.questions : [];
  const questions = rawQuestions.map((q, i) => normalizeCbtQuestion(q, i));

  // Determine sections
  let sections = [];
  if (Array.isArray(raw?.sections) && raw.sections.length > 0) {
    sections = raw.sections.map((s) => ({
      name: String(s?.name || 'General'),
      durationMinutes: s?.durationMinutes ? Number(s.durationMinutes) : undefined,
      totalQuestions: Number(s?.totalQuestions) || questions.filter(q => (q.section || q.subject) === s?.name).length
    }));
  } else {
    // Group dynamically from questions
    const distinctSections = Array.from(new Set(questions.map(q => q.section || q.subject || 'General')));
    sections = distinctSections.map(secName => ({
      name: secName,
      totalQuestions: questions.filter(q => (q.section || q.subject) === secName).length
    }));
  }
  if (sections.length === 0) {
    sections = [{ name: 'General', totalQuestions: questions.length }];
  }

  const markingScheme = {
    correct: Math.max(0.5, Math.abs(Number(raw?.markingScheme?.correct) || 2)),
    incorrect: Math.abs(Number(raw?.markingScheme?.incorrect) || 0.66),
    unattempted: 0
  };

  const totalMarks = Math.max(
    1,
    Number(raw?.totalMarks) || questions.reduce((acc, q) => acc + q.marks, 0) || (questions.length * markingScheme.correct)
  );

  return {
    id,
    title,
    exam,
    durationMinutes,
    totalMarks,
    questions,
    sections,
    markingScheme,
    difficulty: raw?.difficulty || 'Medium',
    isCustom: Boolean(raw?.isCustom)
  };
}
