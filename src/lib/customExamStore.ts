import { ExamOption, EXAM_LIST } from './examList';
import { ExamConfig } from './examRegistry';

export interface CustomSyllabusNode {
  id: string;
  exam: string;
  stage: string;
  paper: string;
  subject: string;
  chapter: string;
  topic: string;
  subtopic: string;
  weightage?: number;
  importance?: 'High' | 'Medium' | 'Low';
  status?: 'pending' | 'completed' | 'in_progress';
}

export interface CustomExamConfig {
  id: string;
  label: string;
  category: string;
  targetYear: number;
  subjects: string[];
  syllabus: CustomSyllabusNode[];
  createdAt: string;
  createdByEmail?: string;
}

const STORAGE_KEY = 'aspirantx_custom_exams_v2';

/**
 * Gets all user-created custom exams from LocalStorage
 */
export function getCustomExamsFromStorage(): CustomExamConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading custom exams from storage:', e);
    return [];
  }
}

/**
 * Saves or updates a custom exam in LocalStorage and syncs to backend server
 */
export async function saveCustomExam(exam: CustomExamConfig): Promise<CustomExamConfig[]> {
  const existing = getCustomExamsFromStorage();
  const index = existing.findIndex((e) => e.id === exam.id);

  let updated: CustomExamConfig[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = exam;
  } else {
    updated = [...existing, exam];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Sync to Express backend API
  try {
    const token = localStorage.getItem('aspirantx_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch('/api/academic/custom-exams', {
      method: 'POST',
      headers,
      body: JSON.stringify({ exam }),
    }).catch(() => null);
  } catch (err) {
    console.warn('Could not sync custom exam to server:', err);
  }

  return updated;
}

/**
 * Deletes a custom exam by ID
 */
export function deleteCustomExam(examId: string): CustomExamConfig[] {
  const existing = getCustomExamsFromStorage();
  const updated = existing.filter((e) => e.id !== examId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Returns merged exam list (Default EXAM_LIST + User Custom Exams)
 */
export function getCombinedExamList(): ExamOption[] {
  const customExams = getCustomExamsFromStorage();
  const customOptions: ExamOption[] = customExams.map((ce) => ({
    id: ce.id,
    label: `✨ ${ce.label} (Custom Exam)`,
  }));

  // Return custom options first, then standard options
  return [...customOptions, ...EXAM_LIST];
}

/**
 * Gets dynamic ExamConfig for a custom exam if one exists
 */
export function getCustomExamConfig(examId: string): ExamConfig | null {
  const customExams = getCustomExamsFromStorage();
  const match = customExams.find(
    (e) => e.id === examId || e.id.toLowerCase() === (examId || '').toLowerCase()
  );

  if (!match) return null;

  // Build syllabusTree mapping from custom syllabus nodes
  const syllabusTree: Record<string, { topics: string[] }> = {};

  match.subjects.forEach((subj) => {
    const subjNodes = match.syllabus.filter((n) => n.subject.toLowerCase() === subj.toLowerCase());
    const topics = Array.from(new Set(subjNodes.map((n) => n.topic || n.chapter || 'Core Concepts')));
    syllabusTree[subj] = {
      topics: topics.length > 0 ? topics : ['Core Concepts', 'Important Practice'],
    };
  });

  return {
    examId: match.id,
    displayName: match.label,
    category: match.category as any,
    stages: ['Main Stage'],
    papers: ['General Paper'],
    subjects: match.subjects.length > 0 ? match.subjects : ['General Knowledge', 'Aptitude'],
    syllabusTree,
    aliasMap: {},
    defaultSubject: match.subjects[0] || 'General Knowledge',
    languages: ['English', 'Hindi'],
    difficultyLevels: ['Easy', 'Medium', 'Hard'],
    questionTypes: ['MCQ'],
  };
}
