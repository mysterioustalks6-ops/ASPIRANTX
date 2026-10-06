/**
 * Centralized High-Performance Avatar Storage & Resolution Engine
 * Ensures custom photos, uploaded avatars, and curated presets never reset on refresh or reload.
 */

export const DEFAULT_AVATAR_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%230284c7'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>A</text></svg>";

/**
 * Checks whether an avatar URL is an external unconfigured placeholder, data fallback, or empty
 */
export function isDefaultPlaceholderAvatar(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '') return true;
  return trimmed.includes('placeholder') || trimmed.startsWith('data:image/svg+xml');
}

/**
 * Retrieves the stored avatar for a user across all possible client cache keys
 */
export function getStoredUserAvatar(userId?: string | null, email?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Check user-specific ID key
    if (userId && userId.trim() !== '') {
      const v = localStorage.getItem(`aspirantx_avatar_${userId.trim()}`);
      if (v && v.trim()) return v.trim();
    }

    // 2. Check email-specific key
    if (email && email.trim() !== '') {
      const v = localStorage.getItem(`aspirantx_avatar_${email.trim().toLowerCase()}`);
      if (v && v.trim()) return v.trim();
    }

    // 3. Check active device global custom avatar
    const globalAv = localStorage.getItem('aspirantx_custom_avatar');
    if (globalAv && globalAv.trim()) return globalAv.trim();

    // 4. Check cached profile blob if available
    if (userId) {
      const cacheRaw = localStorage.getItem(`aspirantx_profile_cache_${userId}`);
      if (cacheRaw) {
        try {
          const parsed = JSON.parse(cacheRaw);
          if (parsed?.avatar_url && !isDefaultPlaceholderAvatar(parsed.avatar_url)) {
            return parsed.avatar_url;
          }
        } catch (_) {}
      }

      const v3Raw = localStorage.getItem(`aspirantx_user_profile_v3_${userId}`);
      if (v3Raw) {
        try {
          const parsed = JSON.parse(v3Raw);
          if (parsed?.avatar_url && !isDefaultPlaceholderAvatar(parsed.avatar_url)) {
            return parsed.avatar_url;
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Persists an avatar across all local cache keys and dispatches update event
 */
export function storeUserAvatar(avatarUrl: string, userId?: string | null, email?: string | null): void {
  if (typeof window === 'undefined' || !avatarUrl || !avatarUrl.trim()) return;
  const cleanUrl = avatarUrl.trim();

  try {
    // Always persist to global custom avatar key (device level)
    localStorage.setItem('aspirantx_custom_avatar', cleanUrl);

    // Persist to user-id specific key
    if (userId && userId.trim() !== '') {
      const uid = userId.trim();
      localStorage.setItem(`aspirantx_avatar_${uid}`, cleanUrl);

      // Also update profile cache
      const cacheKey = `aspirantx_profile_cache_${uid}`;
      const cacheRaw = localStorage.getItem(cacheKey);
      if (cacheRaw) {
        try {
          const parsed = JSON.parse(cacheRaw);
          localStorage.setItem(cacheKey, JSON.stringify({ ...parsed, avatar_url: cleanUrl, updatedAt: new Date().toISOString() }));
        } catch (_) {}
      }

      // Also update v3 user profile cache
      const v3Key = `aspirantx_user_profile_v3_${uid}`;
      const v3Raw = localStorage.getItem(v3Key);
      if (v3Raw) {
        try {
          const parsed = JSON.parse(v3Raw);
          localStorage.setItem(v3Key, JSON.stringify({ ...parsed, avatar_url: cleanUrl }));
        } catch (_) {}
      }
    }

    // Persist to email-specific key
    if (email && email.trim() !== '') {
      localStorage.setItem(`aspirantx_avatar_${email.trim().toLowerCase()}`, cleanUrl);
    }

    // Broadcast across windows / tabs / components
    try {
      window.dispatchEvent(new CustomEvent('aspirantx_avatar_updated', {
        detail: { avatarUrl: cleanUrl, userId, email }
      }));
    } catch (_) {}
  } catch (err) {
    console.warn('[avatarStorage] storeUserAvatar warning:', err);
  }
}

/**
 * High-fidelity avatar resolver.
 * Evaluates custom uploaded photos, non-default curated presets, and persistent local storage
 * before ever reverting to placeholder fallbacks.
 */
export function resolveUserAvatar(
  currentAvatar?: string | null,
  userId?: string | null,
  email?: string | null
): string {
  // If currentAvatar is a genuine custom upload or non-default avatar, prioritize it
  if (currentAvatar && currentAvatar.trim()) {
    const trimmed = currentAvatar.trim();
    if (trimmed.startsWith('data:image/') || !isDefaultPlaceholderAvatar(trimmed)) {
      return trimmed;
    }
  }

  // Look in persisted local caches
  const stored = getStoredUserAvatar(userId, email);
  if (stored) {
    return stored;
  }

  // Fallback to currentAvatar if non-empty or default fallback
  return (currentAvatar && currentAvatar.trim()) || DEFAULT_AVATAR_FALLBACK;
}

/**
 * Background auto-sync of avatar to server API (Neon PostgreSQL)
 */
export function syncAvatarToServer(avatarUrl: string, email?: string | null, userId?: string | null): void {
  if (typeof window === 'undefined' || !avatarUrl || !avatarUrl.trim()) return;
  const cleanUrl = avatarUrl.trim();

  try {
    const token = localStorage.getItem('aspirantx_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = {
      avatar_url: cleanUrl,
      email: email || undefined,
      userId: userId || undefined,
    };

    fetch('/api/user/avatar', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }).catch(() => {});

    if (email) {
      fetch('/api/user/update-profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch (_) {}
}
