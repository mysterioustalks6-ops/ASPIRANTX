import { apiFetch } from '../apiClient';

export interface SyllabusStats {
  success: boolean;
  exam: string;
  total: number;
  completed: number;
  percentage: number;
  subjects: Array<{
    subject: string;
    total: number;
    completed: number;
    percentage: number;
  }>;
}

export const academicService = {
  /**
   * Fetches lightweight syllabus completion statistics without downloading full node trees
   */
  async getSyllabusStats(exam: string): Promise<SyllabusStats> {
    return apiFetch<SyllabusStats>(`/api/academic/syllabus/stats?exam=${encodeURIComponent(exam)}`, {
      useCache: true,
      cacheTtlMs: 2 * 60 * 1000 // 2 minutes
    });
  },

  /**
   * Fetches syllabus subjects list with caching
   */
  async getSyllabusSubjects(exam: string): Promise<{ success: boolean; subjects: string[] }> {
    return apiFetch<{ success: boolean; subjects: string[] }>(`/api/academic/syllabus/subjects?exam=${encodeURIComponent(exam)}`, {
      useCache: true,
      cacheTtlMs: 10 * 60 * 1000 // 10 minutes
    });
  },

  /**
   * Fetches syllabus topics with caching
   */
  async getSyllabusTopics(exam: string, subject?: string): Promise<{ success: boolean; topics: string[] }> {
    const params = new URLSearchParams({ exam });
    if (subject) params.set('subject', subject);
    return apiFetch<{ success: boolean; topics: string[] }>(`/api/academic/syllabus/topics?${params.toString()}`, {
      useCache: true,
      cacheTtlMs: 10 * 60 * 1000 // 10 minutes
    });
  },

  /**
   * Fetches CBT test attempt history for user
   */
  async getCbtHistory(userId: string, exam?: string): Promise<{ success: boolean; history: any[] }> {
    const params = new URLSearchParams({ userId });
    if (exam) params.set('exam', exam);
    return apiFetch<{ success: boolean; history: any[] }>(`/api/academic/cbt/history?${params.toString()}`);
  },

  /**
   * Submits CBT test result for evaluation
   */
  async submitCbtResult(payload: any): Promise<any> {
    return apiFetch('/api/academic/cbt/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Fetches question bank statistics
   */
  async getCbtBankStats(exam?: string): Promise<any> {
    const q = exam ? `?exam=${encodeURIComponent(exam)}` : '';
    return apiFetch(`/api/academic/cbt/bank-stats${q}`, {
      useCache: true,
      cacheTtlMs: 5 * 60 * 1000
    });
  }
};
