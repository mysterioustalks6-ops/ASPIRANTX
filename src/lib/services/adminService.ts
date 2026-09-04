import { apiFetch } from '../apiClient';

export interface AdminUsersResponse {
  success: boolean;
  users: any[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const adminService = {
  /**
   * Fetches paginated admin users
   */
  async getUsers(params: GetAdminUsersParams = {}): Promise<AdminUsersResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);
    if (params.status) searchParams.set('status', params.status);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiFetch<AdminUsersResponse>(`/api/admin/users${query}`);
  },

  /**
   * Activates user subscription
   */
  async activateSubscription(data: { email: string; planId: string }): Promise<any> {
    return apiFetch('/api/admin/subscriptions/activate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
