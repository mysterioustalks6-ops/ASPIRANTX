import { supabase, isSupabaseConfigured } from './supabase';

export interface PersonalSyllabusNode {
  id: string;
  exam: string;
  subject: string;
  chapter?: string;
  topic?: string;
  subtopic?: string;
  stage?: string;
  weightage?: string;
  tags?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

const getStorageKey = (userId?: string) => `aspirantx_personal_syllabus_v1_${userId || 'guest'}`;

/**
 * Loads student's personal syllabus nodes from Supabase (with LocalStorage cache fallback)
 */
export async function getPersonalSyllabusNodes(
  userId?: string,
  exam?: string
): Promise<PersonalSyllabusNode[]> {
  // If Supabase is configured and user is logged in, try loading from Supabase first
  if (isSupabaseConfigured && userId) {
    try {
      let query = supabase.from('personal_syllabus_nodes').select('*').eq('user_id', userId);
      if (exam) {
        query = query.eq('exam', exam);
      }
      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        const nodes: PersonalSyllabusNode[] = data.map((row: any) => ({
          id: row.id,
          exam: row.exam,
          subject: row.subject,
          chapter: row.chapter || '',
          topic: row.topic || '',
          subtopic: row.subtopic || '',
          stage: row.stage || '',
          weightage: row.weightage || '',
          tags: row.tags || '',
          user_id: row.user_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        // Write result to LocalStorage cache
        try {
          const key = getStorageKey(userId);
          const existingRaw = localStorage.getItem(key);
          let allCached: PersonalSyllabusNode[] = [];
          if (existingRaw) {
            const parsed = JSON.parse(existingRaw);
            if (Array.isArray(parsed)) allCached = parsed;
          }

          let updatedCached: PersonalSyllabusNode[];
          if (exam) {
            updatedCached = allCached.filter((n) => n.exam !== exam).concat(nodes);
          } else {
            updatedCached = nodes;
          }
          localStorage.setItem(key, JSON.stringify(updatedCached));
        } catch (cacheErr) {
          console.warn('Failed to update local syllabus cache:', cacheErr);
        }

        return nodes;
      }
    } catch (err) {
      console.warn('Supabase fetch personal syllabus error, falling back to localStorage:', err);
    }
  }

  // LocalStorage Fallback (Offline / Guest / Error mode)
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return exam ? parsed.filter((n: PersonalSyllabusNode) => n.exam === exam) : parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing personal syllabus from localStorage:', e);
  }

  return [];
}

/**
 * Saves or updates a student's personal subject syllabus locally and syncs to Supabase
 */
export async function savePersonalSubjectSyllabus(
  userId: string | undefined,
  exam: string,
  subject: string,
  nodes: PersonalSyllabusNode[]
): Promise<PersonalSyllabusNode[]> {
  const cleanedSubject = (subject || 'General Subject').trim();
  const cleanedExam = (exam || 'UPSC_CSE').trim();

  const preparedNodes: PersonalSyllabusNode[] = [];
  nodes.forEach((node, idx) => {
    if (node.subject && node.subject.trim() && node.subject.trim().toLowerCase() !== cleanedSubject.toLowerCase()) {
      console.warn(`Skipping node with subject "${node.subject}" because it does not match target subject "${cleanedSubject}"`);
      return;
    }
    preparedNodes.push({
      ...node,
      id: node.id || `pers_node_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      exam: cleanedExam,
      subject: cleanedSubject,
    });
  });

  // 1. Always save locally first for instant offline responsiveness
  const key = getStorageKey(userId);
  let currentAll: PersonalSyllabusNode[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) currentAll = parsed;
    }
  } catch (e) {}

  const filtered = currentAll.filter(
    (n) => !(n.exam === cleanedExam && n.subject.toLowerCase() === cleanedSubject.toLowerCase())
  );
  const updatedAll = [...filtered, ...preparedNodes];
  localStorage.setItem(key, JSON.stringify(updatedAll));

  // Dispatch custom event to notify listeners across the app
  window.dispatchEvent(new CustomEvent('aspirantx_personal_syllabus_updated'));

  // 2. Fire-and-forget sync to Supabase if logged in
  if (isSupabaseConfigured && userId) {
    (async () => {
      // Delete existing rows for (user_id, exam, subject)
      await supabase
        .from('personal_syllabus_nodes')
        .delete()
        .eq('user_id', userId)
        .eq('exam', cleanedExam)
        .ilike('subject', cleanedSubject);

      if (preparedNodes.length > 0) {
        const rowsToInsert = preparedNodes.map((n) => ({
          id: n.id,
          user_id: userId,
          exam: n.exam,
          subject: n.subject,
          chapter: n.chapter || '',
          topic: n.topic || '',
          subtopic: n.subtopic || '',
          stage: n.stage || 'Prelims',
          weightage: n.weightage || 'Medium',
          tags: n.tags || '',
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('personal_syllabus_nodes').upsert(rowsToInsert);
      }
    })().catch((err) => console.warn('Background Supabase personal syllabus sync warning:', err));
  }

  return preparedNodes;
}

/**
 * Deletes a student's personal subject syllabus from LocalStorage and Supabase
 */
export async function removePersonalSubject(
  userId: string | undefined,
  exam: string,
  subject: string
): Promise<PersonalSyllabusNode[]> {
  const cleanedSubject = (subject || '').trim();
  const cleanedExam = (exam || '').trim();

  // 1. Update LocalStorage immediately
  const key = getStorageKey(userId);
  let currentAll: PersonalSyllabusNode[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) currentAll = parsed;
    }
  } catch (e) {}

  const remainingAll = currentAll.filter(
    (n) => !(n.exam === cleanedExam && n.subject.toLowerCase() === cleanedSubject.toLowerCase())
  );
  localStorage.setItem(key, JSON.stringify(remainingAll));

  // Dispatch event
  window.dispatchEvent(new CustomEvent('aspirantx_personal_syllabus_updated'));

  // 2. Sync deletion to Supabase
  if (isSupabaseConfigured && userId) {
    (async () => {
      await supabase
        .from('personal_syllabus_nodes')
        .delete()
        .eq('user_id', userId)
        .eq('exam', cleanedExam)
        .ilike('subject', cleanedSubject);
    })().catch((err) => console.warn('Supabase personal syllabus removal warning:', err));
  }

  return remainingAll.filter((n) => n.exam === cleanedExam);
}

/**
 * Returns list of distinct subject names for the user's custom syllabus
 */
export async function getPersonalSubjects(userId?: string, exam?: string): Promise<string[]> {
  const nodes = await getPersonalSyllabusNodes(userId, exam);
  const subjectsSet = new Set<string>();
  nodes.forEach((n) => {
    if (n.subject) subjectsSet.add(n.subject);
  });
  return Array.from(subjectsSet);
}

/**
 * Helper to parse CSV content or pasted plain text lines into PersonalSyllabusNode[]
 */
export function parseCsvSyllabus(
  csvContent: string,
  defaultExam: string,
  defaultSubject?: string
): { nodes: PersonalSyllabusNode[]; skippedOtherSubjectRows: number; otherSubjectsFound: string[] } {
  if (!csvContent || typeof csvContent !== 'string') {
    return { nodes: [], skippedOtherSubjectRows: 0, otherSubjectsFound: [] };
  }

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { nodes: [], skippedOtherSubjectRows: 0, otherSubjectsFound: [] };
  }

  const nodes: PersonalSyllabusNode[] = [];
  let skippedOtherSubjectRows = 0;
  const otherSubjectsSet = new Set<string>();

  const targetSubject = defaultSubject ? defaultSubject.trim() : '';
  let detectedSubject = targetSubject || 'Custom Subject';

  // Helper to split CSV line respecting quotes or fallback to tabs / semicolons
  const splitLine = (line: string): string[] => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    }
    // Standard CSV split
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const firstLineCols = splitLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader =
    firstLineCols.includes('subject') ||
    firstLineCols.includes('chapter') ||
    firstLineCols.includes('topic') ||
    firstLineCols.includes('subtopic');

  let subjectIdx = -1;
  let chapterIdx = -1;
  let topicIdx = -1;
  let subtopicIdx = -1;
  let stageIdx = -1;
  let weightageIdx = -1;
  let tagsIdx = -1;

  if (hasHeader) {
    firstLineCols.forEach((col, idx) => {
      if (col.includes('subject')) subjectIdx = idx;
      else if (col.includes('chapter')) chapterIdx = idx;
      else if (col.includes('topic') && !col.includes('sub')) topicIdx = idx;
      else if (col.includes('subtopic') || col.includes('sub-topic') || col.includes('micro')) subtopicIdx = idx;
      else if (col.includes('stage') || col.includes('tier') || col.includes('level')) stageIdx = idx;
      else if (col.includes('weightage') || col.includes('marks') || col.includes('priority')) weightageIdx = idx;
      else if (col.includes('tag')) tagsIdx = idx;
    });
  }

  const startLineIdx = hasHeader ? 1 : 0;

  for (let i = startLineIdx; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    let rowSubject = detectedSubject;
    let rowChapter = '';
    let rowTopic = '';
    let rowSubtopic = '';
    let rowStage = 'Prelims';
    let rowWeightage = 'Medium';
    let rowTags = '';

    if (hasHeader) {
      const csvRowSubject = (subjectIdx >= 0 && cols[subjectIdx]) ? cols[subjectIdx].trim() : '';

      // If CSV has a Subject column and targetSubject is specified by caller
      if (subjectIdx >= 0 && csvRowSubject && targetSubject) {
        if (csvRowSubject.toLowerCase() !== targetSubject.toLowerCase()) {
          skippedOtherSubjectRows++;
          otherSubjectsSet.add(csvRowSubject);
          continue; // Skip rows belonging to other subjects!
        }
      }

      if (csvRowSubject) rowSubject = csvRowSubject;
      if (chapterIdx >= 0 && cols[chapterIdx]) rowChapter = cols[chapterIdx];
      if (topicIdx >= 0 && cols[topicIdx]) rowTopic = cols[topicIdx];
      if (subtopicIdx >= 0 && cols[subtopicIdx]) rowSubtopic = cols[subtopicIdx];
      if (stageIdx >= 0 && cols[stageIdx]) rowStage = cols[stageIdx];
      if (weightageIdx >= 0 && cols[weightageIdx]) rowWeightage = cols[weightageIdx];
      if (tagsIdx >= 0 && cols[tagsIdx]) rowTags = cols[tagsIdx];
    } else {
      // Positional heuristic
      if (cols.length === 1) {
        rowChapter = 'General Chapter';
        rowSubtopic = cols[0];
      } else if (cols.length === 2) {
        rowChapter = cols[0];
        rowSubtopic = cols[1];
      } else if (cols.length === 3) {
        rowSubject = cols[0];
        rowChapter = cols[1];
        rowSubtopic = cols[2];
      } else {
        rowSubject = cols[0] || detectedSubject;
        rowChapter = cols[1] || '';
        rowTopic = cols[2] || '';
        rowSubtopic = cols[3] || '';
        if (cols[4]) rowStage = cols[4];
        if (cols[5]) rowWeightage = cols[5];
        if (cols[6]) rowTags = cols[6];
      }

      // Check positional subject if targetSubject is specified
      if (rowSubject && targetSubject && rowSubject.toLowerCase() !== targetSubject.toLowerCase()) {
        skippedOtherSubjectRows++;
        otherSubjectsSet.add(rowSubject);
        continue;
      }
    }

    if (!rowChapter) rowChapter = rowTopic || 'General Chapter';
    if (!rowSubtopic) rowSubtopic = rowTopic || rowChapter;

    nodes.push({
      id: `pers_node_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      exam: defaultExam,
      subject: targetSubject || rowSubject || 'Custom Subject',
      chapter: rowChapter,
      topic: rowTopic || rowChapter,
      subtopic: rowSubtopic,
      stage: rowStage,
      weightage: rowWeightage,
      tags: rowTags,
    });
  }

  return {
    nodes,
    skippedOtherSubjectRows,
    otherSubjectsFound: Array.from(otherSubjectsSet),
  };
}
