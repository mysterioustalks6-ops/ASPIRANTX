import { getPersonalSyllabusNodes, PersonalSyllabusNode, savePersonalSubjectSyllabus, saveAllPersonalSyllabusNodes, removePersonalSubject } from './personalSyllabus';
import { egressOptimizedFetch } from './egressOptimizer';

export interface OfficialSyllabusNode {
  id: string;
  exam: string;
  paper?: string;
  stage?: string;
  subject: string;
  chapter?: string;
  topic?: string;
  subtopic?: string;
  title?: string;
  weightage?: string;
  estimatedHours?: number;
}

export interface SyllabusTimeSummary {
  [nodeIdOrKey: string]: number; // total seconds studied
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('aspirantx_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches official syllabus hierarchy nodes for an exam (Zero-Egress Cached)
 */
export async function fetchOfficialSyllabus(exam: string): Promise<OfficialSyllabusNode[]> {
  return egressOptimizedFetch(
    `official_syllabus_${exam}`,
    async () => {
      try {
        const res = await fetch(`/api/academic/syllabus?exam=${encodeURIComponent(exam)}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.syllabus)) {
            return data.syllabus;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch official syllabus from API:', err);
      }
      return [];
    },
    24 * 60 * 60 * 1000 // 24 hours client-cache: syllabus rarely changes during day
  );
}

/**
 * Fetches personal syllabus nodes for a user and exam (Zero-Egress Cached)
 */
export async function fetchPersonalSyllabus(userId?: string, exam?: string): Promise<PersonalSyllabusNode[]> {
  const effectiveUser = userId || 'guest';
  return egressOptimizedFetch(
    `personal_syllabus_${effectiveUser}_${exam || 'all'}`,
    async () => {
      try {
        const url = `/api/personal-syllabus?userId=${encodeURIComponent(effectiveUser)}${exam ? `&exam=${encodeURIComponent(exam)}` : ''}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.syllabus)) {
            return data.syllabus;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch personal syllabus from API:', err);
      }
      return getPersonalSyllabusNodes(effectiveUser, exam);
    },
    10 * 60 * 1000 // 10 minutes cache
  );
}

/**
 * Imports items from official syllabus to personal syllabus
 */
export async function importFromOfficial(
  userId: string,
  exam: string,
  items: Array<{ subject: string; topic?: string; subtopic?: string; officialNodeId: string; stage?: string; weightage?: string }>
): Promise<{ imported: string[]; alreadyImported: string[] }> {
  try {
    const res = await fetch('/api/syllabus/import-from-official', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, exam, items }),
    });
    if (res.ok) {
      const data = await res.json();
      window.dispatchEvent(new CustomEvent('aspirantx_personal_syllabus_updated'));
      return {
        imported: data.imported || [],
        alreadyImported: data.alreadyImported || [],
      };
    }
  } catch (err) {
    console.warn('Failed to import from official syllabus via API:', err);
  }
  return { imported: [], alreadyImported: [] };
}

/**
 * Logs study time for a syllabus node / topic
 */
export async function logStudyTime(payload: {
  userId?: string;
  nodeId?: string;
  nodeSource?: 'official' | 'personal';
  subject?: string;
  topic?: string;
  subtopic?: string;
  secondsLogged: number;
  sessionId?: string;
}): Promise<{ success: boolean; totalTimeForNode?: number }> {
  const sessionId = payload.sessionId || `session_${Date.now()}`;
  try {
    const res = await fetch(`/api/user/study-sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        completedDuration: payload.secondsLogged,
        duration: Math.round(payload.secondsLogged / 60) || 1,
        nodeId: payload.nodeId,
        nodeSource: payload.nodeSource || 'official',
        subject: payload.subject,
        topic: payload.topic,
        subtopic: payload.subtopic,
        secondsLogged: payload.secondsLogged,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      window.dispatchEvent(
        new CustomEvent('aspirantx_syllabus_time_updated', {
          detail: {
            nodeId: payload.nodeId,
            nodeSource: payload.nodeSource,
            secondsLogged: payload.secondsLogged,
            subject: payload.subject,
            topic: payload.topic,
            subtopic: payload.subtopic,
          },
        })
      );
      return {
        success: true,
        totalTimeForNode: data.syllabusTimeLogged?.totalTimeForNode,
      };
    }
  } catch (err) {
    console.warn('Failed to log study time:', err);
  }
  return { success: false };
}

/**
 * Fetches time summary grouped by nodeId/subtopic
 */
export async function fetchSyllabusTimeSummary(
  userId?: string,
  nodeSource?: 'official' | 'personal'
): Promise<SyllabusTimeSummary> {
  try {
    const url = `/api/syllabus/time-summary?userId=${encodeURIComponent(userId || 'guest')}${nodeSource ? `&nodeSource=${nodeSource}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data && data.summary) {
        return data.summary;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch time summary:', err);
  }
  return {};
}

export { getPersonalSyllabusNodes, savePersonalSubjectSyllabus, saveAllPersonalSyllabusNodes, removePersonalSubject };
