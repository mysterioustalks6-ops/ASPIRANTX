// ============================================================================
// TEXT EXTRACTOR MODULE
// Cleans raw HTML and extracts text from official PDF documents
// ============================================================================

import type { FetchResult } from './types.js';

async function getPdfParse() {
  try {
    const mod = await import('pdf-parse');
    return (mod as any).default || mod;
  } catch {
    return null;
  }
}

/**
 * Strips script tags, style tags, comments, and boilerplate HTML from web pages.
 */
export function cleanHtmlToText(rawHtml: string): string {
  if (!rawHtml) return '';

  let text = rawHtml;
  // Remove script and style elements
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  text = text.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, ' ');
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');

  // Replace block element tags with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n');
  text = text.replace(/<(br|hr)\s*\/?>/gi, '\n');

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Normalize excessive whitespace while preserving paragraph lines
  text = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return text;
}

/**
 * Extracts raw textual content from either HTML or PDF fetch results.
 */
export async function extractTextContent(result: FetchResult): Promise<{
  text: string;
  pageCount?: number;
  isScannedPdf?: boolean;
  error?: string;
}> {
  if (result.contentType === 'pdf') {
    if (!result.buffer) {
      return { text: '', error: 'PDF buffer was empty.' };
    }

    try {
      const mod = await import('pdf-parse');
      let text = '';
      let pageCount = 1;

      if (typeof mod.PDFParse === 'function') {
        const parser = new mod.PDFParse(new Uint8Array(result.buffer));
        const res = await parser.getText();
        text = res?.text || '';
        pageCount = res?.total || res?.pages?.length || 1;
      } else if (typeof (mod as any).default === 'function') {
        const data = await (mod as any).default(result.buffer);
        text = data.text || '';
        pageCount = data.numpages || 1;
      } else {
        return { text: '', error: 'Unsupported pdf-parse export.' };
      }

      // Scanned PDF detection heuristic: less than 60 characters per page indicates scanned image
      const charsPerPage = text.trim().length / pageCount;
      const isScannedPdf = charsPerPage < 60;

      return {
        text: text.trim(),
        pageCount,
        isScannedPdf,
      };
    } catch (err: any) {
      return { text: '', error: `PDF parsing failed: ${err.message}` };
    }
  }

  // HTML content
  const cleaned = cleanHtmlToText(result.text || '');

  // Detect WAF or firewall block pages returning HTTP 200
  const lowerCleaned = cleaned.toLowerCase();
  const wafPhrases = [
    'the requested url was rejected',
    'access denied',
    'please verify you are a human',
    'cloudflare ray id',
    'akamai global host',
    'shieldsquare captcha',
    'your support id is',
    'security check to access',
  ];

  for (const phrase of wafPhrases) {
    if (lowerCleaned.includes(phrase)) {
      return { text: '', error: `Page returned firewall rejection marker: "${phrase}".` };
    }
  }

  return { text: cleaned };
}
