export interface HeartState {
  hearts: number; // 0 to 5
  maxHearts: number;
  lastLostTimestamp: number;
}

const HEARTS_STORAGE_KEY = (userId: string) => `aspirantx_duo_hearts_${userId || 'guest'}`;
const REGEN_TIME_MS = 30 * 60 * 1000; // 1 heart regenerates every 30 mins

/**
 * Loads current candidate hearts from persistent storage with automatic time-based regeneration.
 */
export function getCandidateHearts(userId: string): HeartState {
  try {
    const raw = localStorage.getItem(HEARTS_STORAGE_KEY(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.hearts === 'number') {
        let currentHearts = parsed.hearts;
        const now = Date.now();
        const elapsed = now - (parsed.lastLostTimestamp || now);
        
        // Calculate regenerated hearts
        if (currentHearts < 5 && elapsed > REGEN_TIME_MS) {
          const regeneratedCount = Math.floor(elapsed / REGEN_TIME_MS);
          currentHearts = Math.min(5, currentHearts + regeneratedCount);
          const remainingTime = elapsed % REGEN_TIME_MS;
          const updated: HeartState = {
            hearts: currentHearts,
            maxHearts: 5,
            lastLostTimestamp: now - remainingTime,
          };
          localStorage.setItem(HEARTS_STORAGE_KEY(userId), JSON.stringify(updated));
          return updated;
        }

        return {
          hearts: currentHearts,
          maxHearts: 5,
          lastLostTimestamp: parsed.lastLostTimestamp || now,
        };
      }
    }
  } catch {}

  const initial: HeartState = {
    hearts: 5,
    maxHearts: 5,
    lastLostTimestamp: Date.now(),
  };
  try {
    localStorage.setItem(HEARTS_STORAGE_KEY(userId), JSON.stringify(initial));
  } catch {}
  return initial;
}

/**
 * Deducts 1 heart on a wrong answer. Returns updated heart count.
 */
export function deductHeart(userId: string): number {
  const current = getCandidateHearts(userId);
  const nextHearts = Math.max(0, current.hearts - 1);
  const updated: HeartState = {
    hearts: nextHearts,
    maxHearts: 5,
    lastLostTimestamp: Date.now(),
  };
  try {
    localStorage.setItem(HEARTS_STORAGE_KEY(userId), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('aspirantx_hearts_updated', { detail: updated }));
  } catch {}
  return nextHearts;
}

/**
 * Refills hearts back to 5 (e.g. through coin redemption or practice drills).
 */
export function refillHearts(userId: string): HeartState {
  const updated: HeartState = {
    hearts: 5,
    maxHearts: 5,
    lastLostTimestamp: Date.now(),
  };
  try {
    localStorage.setItem(HEARTS_STORAGE_KEY(userId), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('aspirantx_hearts_updated', { detail: updated }));
  } catch {}
  return updated;
}
