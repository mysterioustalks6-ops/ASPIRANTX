import { SyllabusTopic, SubTopic } from '../types';

export interface ParseResult {
  success: boolean;
  topics: SyllabusTopic[];
  totalSubtopics: number;
  message: string;
  rawCsv?: string;
}

/**
 * Extracts a Google Spreadsheet ID from various Google Sheet URL formats.
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If user pasted raw ID
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex pattern for Google Sheets URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Constructs the public CSV download URL for a given Google Sheet ID.
 */
export function getGoogleSheetCsvUrl(urlOrId: string, sheetName?: string): string {
  const sheetId = extractSpreadsheetId(urlOrId);
  if (!sheetId) {
    // If it already looks like a direct CSV URL
    if (urlOrId.includes('.csv') || urlOrId.includes('output=csv') || urlOrId.includes('out:csv')) {
      return urlOrId.trim();
    }
    throw new Error('Invalid Google Spreadsheet URL or ID provided.');
  }

  const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${sheetParam}`;
}

/**
 * Parses raw CSV content into array of rows (handling quoted commas).
 */
export function parseCsvRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentCell.trim().replace(/^["']|["']$/g, ''));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim().replace(/^["']|["']$/g, ''));
    rows.push(row);
  }

  return rows;
}

/**
 * Imports syllabus data from a public Google Sheet URL or direct CSV.
 */
export async function fetchAndParseGoogleSheet(urlOrId: string): Promise<ParseResult> {
  try {
    const csvUrl = getGoogleSheetCsvUrl(urlOrId);
    
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet (HTTP ${response.status}). Make sure the spreadsheet is shared as 'Anyone with the link can view'.`);
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Spreadsheet returned empty content.');
    }

    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      throw new Error('Spreadsheet must contain a header row and at least 1 data row.');
    }

    // Header mapping
    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const topicIdx = headers.findIndex((h) => h.includes('topic') && !h.includes('sub'));
    const subtopicIdx = headers.findIndex((h) => h.includes('subtopic') || h.includes('sub-topic') || h.includes('module'));
    const categoryIdx = headers.findIndex((h) => h.includes('cat') || h.includes('subject') || h.includes('paper'));
    const stageIdx = headers.findIndex((h) => h.includes('stage') || h.includes('tier') || h.includes('level'));
    const weightageIdx = headers.findIndex((h) => h.includes('weight') || h.includes('prior'));
    const hoursIdx = headers.findIndex((h) => h.includes('hour') || h.includes('est') || h.includes('time'));

    const topicsMap = new Map<string, SyllabusTopic>();
    let totalSubtopicsCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const topicTitle = (topicIdx !== -1 && row[topicIdx]) ? row[topicIdx] : (row[0] || `Topic ${i}`);
      const subtopicTitle = (subtopicIdx !== -1 && row[subtopicIdx]) ? row[subtopicIdx] : (row[1] || `Subtopic ${i}`);
      const category = (categoryIdx !== -1 && row[categoryIdx]) ? row[categoryIdx] : 'General';
      const rawStage = (stageIdx !== -1 && row[stageIdx]) ? row[stageIdx].trim() : 'Prelims';
      const rawWeight = (weightageIdx !== -1 && row[weightageIdx]) ? row[weightageIdx].trim() : 'High';
      const rawHours = (hoursIdx !== -1 && row[hoursIdx]) ? parseFloat(row[hoursIdx]) : 2.5;

      const stage: 'Prelims' | 'Mains' | 'Tier-1' | 'Tier-2' = 
        rawStage.toLowerCase().includes('mains') ? 'Mains' :
        rawStage.toLowerCase().includes('tier-2') || rawStage.toLowerCase().includes('tier 2') ? 'Tier-2' :
        rawStage.toLowerCase().includes('tier-1') || rawStage.toLowerCase().includes('tier 1') ? 'Tier-1' : 'Prelims';

      const weightage: 'High' | 'Medium' | 'Low' = 
        rawWeight.toLowerCase().includes('low') ? 'Low' :
        rawWeight.toLowerCase().includes('med') ? 'Medium' : 'High';

      const estHours = isNaN(rawHours) || rawHours <= 0 ? 2.5 : rawHours;

      const topicKey = topicTitle.toLowerCase().trim();

      if (!topicsMap.has(topicKey)) {
        topicsMap.set(topicKey, {
          id: `imp-top-${i}`,
          title: topicTitle,
          category,
          stage,
          completed: false,
          subtopicsCount: 0,
          completedSubtopics: 0,
          weightage,
          notes: `Imported via Google Spreadsheet API`,
          subtopics: [],
        });
      }

      const existingTopic = topicsMap.get(topicKey)!;
      const subtopicId = `imp-sub-${i}-${existingTopic.subtopics!.length + 1}`;

      const sub: SubTopic = {
        id: subtopicId,
        topicId: existingTopic.id,
        title: subtopicTitle,
        completed: false,
        estimatedHours: estHours,
        weightage,
      };

      existingTopic.subtopics!.push(sub);
      existingTopic.subtopicsCount = existingTopic.subtopics!.length;
      totalSubtopicsCount++;
    }

    const importedTopics = Array.from(topicsMap.values());

    return {
      success: true,
      topics: importedTopics,
      totalSubtopics: totalSubtopicsCount,
      message: `Successfully imported ${importedTopics.length} Topics and ${totalSubtopicsCount} Sub-topics!`,
      rawCsv: csvText,
    };
  } catch (err: any) {
    return {
      success: false,
      topics: [],
      totalSubtopics: 0,
      message: err?.message || 'Failed to parse Google Spreadsheet.',
    };
  }
}

/**
 * Sample CSV format string for demonstration or manual paste
 */
export const SAMPLE_GOOGLE_SHEET_CSV = `Topic,Subtopic,Category,Stage,Weightage,Hours
Indian Polity,Fundamental Rights Art 12-18,GS Paper 2,Prelims,High,2.5
Indian Polity,Directive Principles of State Policy,GS Paper 2,Prelims,High,2.5
Indian Polity,President & Union Executive,GS Paper 2,Prelims,High,2.5
Indian Polity,Supreme Court & Judicial Review,GS Paper 2,Prelims,High,2.5
Modern History,Revolt of 1857 Causes & Impact,GS Paper 1,Prelims,High,2.5
Modern History,Non-Cooperation & Civil Disobedience,GS Paper 1,Prelims,High,2.5
Macro Economics,Monetary Policy & RBI Repo Rates,GS Paper 3,Prelims,High,2.5
Macro Economics,Union Budget & Fiscal Deficit,GS Paper 3,Prelims,High,2.5
Environment,Ramsar Wetlands & IUCN Species,GS Paper 3,Prelims,High,2.5
Environment,COP28 Climate Summit Agreements,GS Paper 3,Prelims,High,2.5`;
