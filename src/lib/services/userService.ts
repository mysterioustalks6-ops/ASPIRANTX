import { apiFetch } from '../apiClient';

export interface UserSubscription {
  isPremium: boolean;
  planId: string;
  expiresAt: string | null;
  activatedAt?: string;
  verificationMethod?: string;
  paymentId?: string | null;
  premiumSource: 'paid' | 'reward' | null;
}

export const userService = {
  /**
   * Fetches user subscription status
   */
  async getSubscription(email?: string): Promise<UserSubscription> {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return apiFetch<UserSubscription>(`/api/user/subscription${q}`, {
      useCache: true,
      cacheTtlMs: 30 * 1000 // 30s cache
    });
  },

  /**
   * Ephemeral user presence heartbeat
   */
  async sendHeartbeat(data: { userId?: string; email?: string; name?: string; exam?: string }): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/user/heartbeat', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Records a study session heartbeat
   */
  async sendStudyHeartbeat(data: { userId: string; sessionId: string; subject?: string; topicId?: string }): Promise<any> {
    return apiFetch('/api/study/heartbeat', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
