// ============================================================================
// POLITE HTTP FETCHER
// Enforces 2-5s per-domain delays, academic User-Agent, and zero aggressive retries
// ============================================================================

import { BOT_USER_AGENT } from './robotsCompliance.js';
import type { FetchResult, DomainRateTracker } from './types.js';

const domainTrackers = new Map<string, DomainRateTracker>();
const DEFAULT_MIN_DELAY_MS = 2500; // 2.5 seconds minimum between requests to the same domain

export function getDomainStats(): Record<string, { requests: number; minDelayEnforcedMs: number }> {
  const result: Record<string, { requests: number; minDelayEnforcedMs: number }> = {};
  for (const [domain, tracker] of domainTrackers.entries()) {
    result[domain] = {
      requests: tracker.totalRequests,
      minDelayEnforcedMs: DEFAULT_MIN_DELAY_MS,
    };
  }
  return result;
}

/**
 * Ensures at least minDelayMs has elapsed since the last request to the same domain.
 */
async function enforceDomainPoliteness(domain: string, minDelayMs = DEFAULT_MIN_DELAY_MS): Promise<void> {
  let tracker = domainTrackers.get(domain);
  if (!tracker) {
    tracker = {
      hostname: domain,
      lastRequestTimeMs: 0,
      totalRequests: 0,
      blockedCount: 0,
    };
    domainTrackers.set(domain, tracker);
  }

  const now = Date.now();
  const elapsed = now - tracker.lastRequestTimeMs;
  if (elapsed < minDelayMs) {
    const sleepMs = minDelayMs - elapsed;
    await new Promise((resolve) => setTimeout(resolve, sleepMs));
  }

  tracker.lastRequestTimeMs = Date.now();
  tracker.totalRequests += 1;
}

/**
 * Fetches content politely from a public URL.
 * Handles HTML text or PDF binary buffers.
 * Halts and records if 429 or 403 is received.
 */
export async function politeFetch(urlStr: string, minDelayMs = DEFAULT_MIN_DELAY_MS): Promise<FetchResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch (err: any) {
    return {
      url: urlStr,
      contentType: 'unknown',
      statusCode: 400,
      error: `Invalid URL format: ${err.message}`,
    };
  }

  const domain = parsedUrl.hostname;
  const tracker = domainTrackers.get(domain) || {
    hostname: domain,
    lastRequestTimeMs: 0,
    totalRequests: 0,
    blockedCount: 0,
  };
  domainTrackers.set(domain, tracker);

  // If this domain already blocked us with 429/403, do not hammer it
  if (tracker.blockedCount > 0) {
    return {
      url: urlStr,
      contentType: 'unknown',
      statusCode: 429,
      isBlockedOrRateLimited: true,
      error: `Domain ${domain} previously returned 429/403. Skipping per polite crawling rules.`,
    };
  }

  // Enforce polite delay
  await enforceDomainPoliteness(domain, minDelayMs);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s max timeout

  try {
    const response = await fetch(urlStr, {
      method: 'GET',
      headers: {
        'User-Agent': BOT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/pdf,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const status = response.status;

    // Detect rate limit or access block
    if (status === 429 || status === 403) {
      tracker.blockedCount += 1;
      return {
        url: urlStr,
        contentType: 'unknown',
        statusCode: status,
        isBlockedOrRateLimited: true,
        error: `Received HTTP ${status} from ${domain}. Halting requests to this domain.`,
      };
    }

    if (!response.ok) {
      return {
        url: urlStr,
        contentType: 'unknown',
        statusCode: status,
        error: `HTTP error: ${status} ${response.statusText}`,
      };
    }

    const rawContentType = response.headers.get('content-type') || '';
    const isPdf = rawContentType.toLowerCase().includes('application/pdf') || urlStr.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const arrayBuffer = await response.arrayBuffer();
      return {
        url: urlStr,
        contentType: 'pdf',
        buffer: Buffer.from(arrayBuffer),
        statusCode: status,
      };
    } else {
      const text = await response.text();
      return {
        url: urlStr,
        contentType: 'html',
        text,
        statusCode: status,
      };
    }
  } catch (err: any) {
    clearTimeout(timeout);
    return {
      url: urlStr,
      contentType: 'unknown',
      statusCode: 500,
      error: `Fetch failed: ${err.message}`,
    };
  }
}
