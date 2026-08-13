// ============================================================
// FILE EXTRACTOR — SERVER-SIDE ONLY
// Handles PDF (native + scanned fallback), DOCX, TXT, Image
// Uses @google/genai for OCR when API key is available.
// ============================================================

import fs from 'fs';
import path from 'path';
import type { IngestionSourceType } from './types.js';

// Dynamic imports to avoid bundler issues
async function getPdfParse() {
  try {
    const mod = await import('pdf-parse');
    return (mod as any).default || mod;
  } catch {
    return null;
  }
}

async function getMammoth() {
  try {
    // @ts-ignore
    const mod = await import('mammoth');
    return mod.default || mod;
  } catch {
    return null;
  }
}

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  method: IngestionSourceType;
  ocrConfidence?: number;
  error?: string;
}

/**
 * Extract text from a PDF file.
 * Strategy: native extraction first, then OCR fallback via Gemini.
 */
async function extractPdf(
  filePath: string,
  geminiApiKey?: string
): Promise<ExtractionResult> {
  const pdfParse = await getPdfParse();
  if (!pdfParse) {
    return {
      text: '',
      method: 'pdf_native',
      error: 'pdf-parse not installed. Run: npm install pdf-parse',
    };
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    const text = data.text || '';
    const pageCount = data.numpages || 1;

    // Quality check: if extraction is poor (too little text per page),
    // try Gemini OCR fallback
    const avgCharsPerPage = text.length / pageCount;
    const isLikelyScanned = avgCharsPerPage < 50;

    if (isLikelyScanned && geminiApiKey) {
      // Try Gemini Vision OCR
      try {
        const ocrResult = await extractWithGeminiOCR(filePath, geminiApiKey, 'pdf');
        if (ocrResult.text.length > text.length * 1.5) {
          return { ...ocrResult, pageCount };
        }
      } catch (_e) {
        // Fall through to native result
      }
    }

    return {
      text,
      pageCount,
      method: isLikelyScanned ? 'pdf_scanned' : 'pdf_native',
      ocrConfidence: isLikelyScanned ? 0.6 : 0.95,
    };
  } catch (err: any) {
    return {
      text: '',
      method: 'pdf_native',
      error: `PDF extraction failed: ${err.message}`,
    };
  }
}

/**
 * Extract text from a DOCX file.
 */
async function extractDocx(filePath: string): Promise<ExtractionResult> {
  const mammoth = await getMammoth();
  if (!mammoth) {
    return {
      text: '',
      method: 'docx',
      error: 'mammoth not installed. Run: npm install mammoth',
    };
  }

  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return {
      text: result.value || '',
      method: 'docx',
      ocrConfidence: 0.98,
    };
  } catch (err: any) {
    return {
      text: '',
      method: 'docx',
      error: `DOCX extraction failed: ${err.message}`,
    };
  }
}

/**
 * Extract text from a plain text file.
 */
function extractTxt(filePath: string): ExtractionResult {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return { text, method: 'txt', ocrConfidence: 1.0 };
  } catch (err: any) {
    return { text: '', method: 'txt', error: err.message };
  }
}

/**
 * Use Gemini Vision API for OCR on scanned PDFs or images.
 * Requires GEMINI_API_KEY in environment.
 */
async function extractWithGeminiOCR(
  filePath: string,
  apiKey: string,
  fileType: 'pdf' | 'image'
): Promise<ExtractionResult> {
  const { GoogleGenAI } = await import('@google/genai');
  const genai = new GoogleGenAI({ apiKey });

  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');

  const mimeType = fileType === 'pdf' ? 'application/pdf' : detectImageMime(filePath);

  const prompt = `You are an expert OCR system for Indian competitive exam question papers.

Extract ALL text from this document exactly as it appears. Preserve:
- Question numbers (Q1, 1., Q.1, etc.)
- Option labels (A, B, C, D or a, b, c, d or 1, 2, 3, 4)
- Mathematical expressions (write them clearly using ^ for superscript, _ for subscript)
- Chemical formulas (H2O → H₂O)
- Special symbols (>, <, =, +, -, ×, ÷, %, °, π, etc.)

Format each question as:
Q[number]. [question text]
A. [option A]
B. [option B]
C. [option C]
D. [option D]
Answer: [letter]

Do NOT skip any question. Do NOT add commentary. Just extract the text faithfully.`;

  try {
    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      text,
      method: fileType === 'pdf' ? 'pdf_scanned' : 'image',
      ocrConfidence: 0.9,
    };
  } catch (err: any) {
    return {
      text: '',
      method: fileType === 'pdf' ? 'pdf_scanned' : 'image',
      error: `Gemini OCR failed: ${err.message}`,
    };
  }
}

function detectImageMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/png';
}

/**
 * Main file extraction dispatcher.
 */
export async function extractFromFile(
  filePath: string,
  geminiApiKey?: string
): Promise<ExtractionResult> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return extractPdf(filePath, geminiApiKey);

    case '.docx':
    case '.doc':
      return extractDocx(filePath);

    case '.txt':
    case '.md':
      return extractTxt(filePath);

    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.webp':
      if (geminiApiKey) {
        return extractWithGeminiOCR(filePath, geminiApiKey, 'image');
      }
      return {
        text: '',
        method: 'image',
        error: 'Image OCR requires GEMINI_API_KEY. Add it to your .env file.',
      };

    default:
      return {
        text: '',
        method: 'txt',
        error: `Unsupported file type: ${ext}. Supported: .pdf, .docx, .txt, .jpg, .png`,
      };
  }
}

/**
 * Detect source type from file extension.
 */
export function detectSourceType(filePath: string): IngestionSourceType {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'pdf_native'; // will auto-detect scanned
  if (ext === '.docx' || ext === '.doc') return 'docx';
  if (ext === '.txt' || ext === '.md') return 'txt';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  return 'txt';
}
