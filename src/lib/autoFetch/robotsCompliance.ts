// ============================================================================
// ROBOTS.TXT COMPLIANCE MODULE
// Fetches, parses, caches, and verifies robots.txt permissions per domain
// ============================================================================

import type { RobotsRule } from './types.js';

const ROBOTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const robotsCache = new Map<string, RobotsRule>();

export const BOT_USER_AGENT = 'AspirantX-AcademicBot/1.0 (+https://aspirantx.com/bot; academic-audit@aspirantx.com)';

/**
 * Fetches and parses robots.txt for the given domain.
 * If robots.txt returns 404 or fails, defaults to permitting crawling with default etiquette.
 */
export async function fetchAndParseRobots(domain: string): Promise<RobotsRule> {
  const cached = robotsCache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < ROBOTS_CACHE_TTL_MS) {
    return cached;
  }

  const rule: RobotsRule = {
    domain,
    disallowedPaths: [],
    allowedPaths: [],
    crawlDelaySeconds: 2,
    fetchedAt: Date.now(),
  };

  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': BOT_USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n').map((l) => l.trim());

      let isTargetAgent = false;
      for (const rawLine of lines) {
        // Strip comments
        const line = rawLine.split('#')[0].trim();
        if (!line) continue;

        const lower = line.toLowerCase();
        if (lower.startsWith('user-agent:')) {
          const agent = lower.replace('user-agent:', '').trim();
          isTargetAgent = agent === '*' || agent.includes('aspirantx') || agent.includes('academicbot');
        } else if (isTargetAgent) {
          if (lower.startsWith('disallow:')) {
            const pathVal = line.substring(line.indexOf(':') + 1).trim();
            if (pathVal) rule.disallowedPaths.push(pathVal);
          } else if (lower.startsWith('allow:')) {
            const pathVal = line.substring(line.indexOf(':') + 1).trim();
            if (pathVal) rule.allowedPaths.push(pathVal);
          } else if (lower.startsWith('crawl-delay:')) {
            const delay = parseFloat(line.substring(line.indexOf(':') + 1).trim());
            if (!isNaN(delay)) rule.crawlDelaySeconds = Math.max(delay, 2);
          }
        }
      }
    }
  } catch (err: any) {
    // If domain has no robots.txt or fails, rule remains default polite
  }

  robotsCache.set(domain, rule);
  return rule;
}

/**
 * Checks whether a URL is permitted to be fetched under robots.txt rules.
 */
export async function isUrlPermittedByRobots(urlStr: string): Promise<{ permitted: boolean; reason?: string }> {
  try {
    const parsed = new URL(urlStr);
    const domain = parsed.hostname;
    const path = parsed.pathname || '/';

    const rule = await fetchAndParseRobots(domain);

    // Explicit allow overrides disallow
    for (const allowed of rule.allowedPaths) {
      if (path.startsWith(allowed)) {
        return { permitted: true };
      }
    }

    // Check disallows
    for (const disallowed of rule.disallowedPaths) {
      if (disallowed === '/' || path.startsWith(disallowed)) {
        return {
          permitted: false,
          reason: `Path '${path}' is disallowed by https://${domain}/robots.txt (Disallow: ${disallowed})`,
        };
      }
    }

    return { permitted: true };
  } catch (err: any) {
    return { permitted: false, reason: `Invalid URL: ${err.message}` };
  }
}
