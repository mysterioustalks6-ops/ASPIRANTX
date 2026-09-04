import { apiFetch } from '../apiClient';

export interface PaginatedPostsResponse {
  success: boolean;
  posts: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface GetPostsParams {
  page?: number;
  limit?: number;
  groupId?: string;
  search?: string;
  tag?: string;
  filter?: string;
  sort?: string;
}

export const communityService = {
  /**
   * Fetches paginated community posts
   */
  async getPosts(params: GetPostsParams = {}): Promise<PaginatedPostsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.groupId) searchParams.set('groupId', params.groupId);
    if (params.search) searchParams.set('search', params.search);
    if (params.tag) searchParams.set('tag', params.tag);
    if (params.filter) searchParams.set('filter', params.filter);
    if (params.sort) searchParams.set('sort', params.sort);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiFetch<PaginatedPostsResponse>(`/api/community/posts${query}`);
  },

  /**
   * Fetches community groups
   */
  async getGroups(userId?: string): Promise<{ success: boolean; groups: any[] }> {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return apiFetch<{ success: boolean; groups: any[] }>(`/api/community/groups${q}`, {
      useCache: true,
      cacheTtlMs: 2 * 60 * 1000 // 2 minutes
    });
  },

  /**
   * Creates a new post
   */
  async createPost(postData: any): Promise<any> {
    return apiFetch('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }
};
