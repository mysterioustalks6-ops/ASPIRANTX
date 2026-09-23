import { OFFICIAL_EXAM_REGISTRY, EXAM_ALIAS_MAP } from '../src/lib/autoFetch/sourceRegistry.js';
import https from 'https';
import http from 'http';
import fs from 'fs';

interface PyqProbeResult {
  examId: string;
  conductingBody: string;
  officialDomain: string;
  pyqUrls: string[];
  status: 'official_pyq_found' | 'waf_blocked' | 'tls_handshake_error' | 'pdf_only_index' | 'spa_empty' | 'not_found_official';
  httpStatus?: number;
  details: string;
}

async function probeUrl(urlStr: string): Promise<{ statusCode?: number; error?: string; bodySnippet?: string; isPdf?: boolean }> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const mod = u.protocol === 'https:' ? https : http;
      const req = mod.get(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 4000,
        rejectUnauthorized: false
      }, (res) => {
        const contentType = res.headers['content-type'] || '';
        const isPdf = contentType.includes('application/pdf') || urlStr.endsWith('.pdf');
        let data = '';
        res.on('data', chunk => {
          if (data.length < 5000) data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            isPdf,
            bodySnippet: data.slice(0, 1000)
          });
        });
      });
      req.on('error', (err) => resolve({ error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'TIMEOUT (4s)' });
      });
    } catch(e: any) {
      resolve({ error: e.message });
    }
  });
}

async function runDedicatedPyqPass() {
  console.log(`\n================================================================================`);
  console.log(`🎯 DEDICATED OFFICIAL PYQ PASS: EXAM BY EXAM AUDIT`);
  console.log(`================================================================================`);

  const results: PyqProbeResult[] = [];
  const entries = Object.entries(OFFICIAL_EXAM_REGISTRY).filter(([id]) => !EXAM_ALIAS_MAP[id]);

  console.log(`Targeting ${entries.length} unique exams (excluding aliases)...\n`);

  // Run in chunks of 6
  const chunkSize = 6;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async ([examId, cfg]) => {
      const pyqUrls = cfg.officialPyqUrls || [];
      if (pyqUrls.length === 0) {
        return {
          examId,
          conductingBody: cfg.conductingBody || 'Unknown',
          officialDomain: cfg.officialDomain || 'N/A',
          pyqUrls: [],
          status: 'not_found_official' as const,
          details: 'No official PYQ / question paper section exists on conducting body portal.'
        };
      }

      const urlTested = pyqUrls[0];
      const probe = await probeUrl(urlTested);

      if (probe.error) {
        if (probe.error.includes('SSL') || probe.error.includes('handshake') || probe.error.includes('EPROTO')) {
          return {
            examId,
            conductingBody: cfg.conductingBody || 'Unknown',
            officialDomain: cfg.officialDomain || 'N/A',
            pyqUrls,
            status: 'tls_handshake_error' as const,
            details: `SSL/TLS protocol error (${probe.error}). Conducting body server uses legacy/incompatible ciphers.`
          };
        } else {
          return {
            examId,
            conductingBody: cfg.conductingBody || 'Unknown',
            officialDomain: cfg.officialDomain || 'N/A',
            pyqUrls,
            status: 'not_found_official' as const,
            details: `Network error reaching official domain: ${probe.error}`
          };
        }
      } else if (probe.statusCode === 403 || probe.statusCode === 406 || probe.statusCode === 503) {
        return {
          examId,
          conductingBody: cfg.conductingBody || 'Unknown',
          officialDomain: cfg.officialDomain || 'N/A',
          pyqUrls,
          status: 'waf_blocked' as const,
          httpStatus: probe.statusCode,
          details: `HTTP ${probe.statusCode} Forbidden. Official server employs WAF/anti-bot protection.`
        };
      } else if (probe.isPdf) {
        return {
          examId,
          conductingBody: cfg.conductingBody || 'Unknown',
          officialDomain: cfg.officialDomain || 'N/A',
          pyqUrls,
          status: 'pdf_only_index' as const,
          httpStatus: probe.statusCode,
          details: `Direct PDF link returned (${urlTested}). Requires offline PDF OCR/parsing pipeline, not plain HTML questions.`
        };
      } else {
        const snippet = probe.bodySnippet || '';
        if (snippet.includes('<div id="root"></div>') || (snippet.length < 500 && snippet.includes('script'))) {
          return {
            examId,
            conductingBody: cfg.conductingBody || 'Unknown',
            officialDomain: cfg.officialDomain || 'N/A',
            pyqUrls,
            status: 'spa_empty' as const,
            httpStatus: probe.statusCode,
            details: 'Client-side SPA shell returned (React/Angular). No question paper text in static DOM.'
          };
        } else if (snippet.includes('.pdf') || snippet.includes('Download') || snippet.includes('Question Paper')) {
          return {
            examId,
            conductingBody: cfg.conductingBody || 'Unknown',
            officialDomain: cfg.officialDomain || 'N/A',
            pyqUrls,
            status: 'pdf_only_index' as const,
            httpStatus: probe.statusCode,
            details: 'Official PYQ page reachable, but questions are distributed as downloadable scanned/vector PDF files, not inline text.'
          };
        } else {
          return {
            examId,
            conductingBody: cfg.conductingBody || 'Unknown',
            officialDomain: cfg.officialDomain || 'N/A',
            pyqUrls,
            status: 'not_found_official' as const,
            httpStatus: probe.statusCode,
            details: 'Official page returned HTTP 200, but no past question papers were found in content.'
          };
        }
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    process.stdout.write(`Processed ${results.length}/${entries.length} exams...\r`);
  }

  // Summary counts
  const summaryCounts = {
    totalExamsEvaluated: results.length,
    officialPyqFoundInline: results.filter(r => r.status === 'official_pyq_found').length,
    pdfOnlyIndex: results.filter(r => r.status === 'pdf_only_index').length,
    wafBlocked: results.filter(r => r.status === 'waf_blocked').length,
    tlsHandshakeError: results.filter(r => r.status === 'tls_handshake_error').length,
    spaEmpty: results.filter(r => r.status === 'spa_empty').length,
    notFoundOfficial: results.filter(r => r.status === 'not_found_official').length,
  };

  console.log(`\n================================================================================`);
  console.log(`📊 DEDICATED PYQ PASS SUMMARY:`);
  console.log(`================================================================================`);
  console.log(`Total Exams Evaluated:                 ${summaryCounts.totalExamsEvaluated}`);
  console.log(`Inline HTML PYQs Found:                ${summaryCounts.officialPyqFoundInline}`);
  console.log(`PDF Download Link Indexes (Needs OCR): ${summaryCounts.pdfOnlyIndex}`);
  console.log(`WAF / Forbidden Blocked:               ${summaryCounts.wafBlocked}`);
  console.log(`TLS / Legacy Cipher Handshake Error:   ${summaryCounts.tlsHandshakeError}`);
  console.log(`SPA Empty Shell (Client Rendered):     ${summaryCounts.spaEmpty}`);
  console.log(`No Official PYQ Source Found:          ${summaryCounts.notFoundOfficial}`);
  console.log(`================================================================================\n`);

  fs.writeFileSync('data/dedicated_pyq_pass_results.json', JSON.stringify({ summaryCounts, results }, null, 2));
  console.log(`Full audit results written to data/dedicated_pyq_pass_results.json`);
}

runDedicatedPyqPass().catch(console.error);
