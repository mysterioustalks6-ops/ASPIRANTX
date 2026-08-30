import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BulkImportResult } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { 
  FileSpreadsheet, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Download, 
  FileText,
  RotateCcw,
  Zap
} from 'lucide-react';

interface AcademicBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessImport?: () => void;
}

export const AcademicBulkImportModal: React.FC<AcademicBulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccessImport,
}) => {
  const [importType, setImportType] = useState<'pyqs' | 'syllabus' | 'questions'>('syllabus');
  const [syllabusMode, setSyllabusMode] = useState<'smart' | 'strict'>('smart');
  const [selectedExam, setSelectedExam] = useState<string>('UPSC_CSE');
  const [rawInputText, setRawInputText] = useState<string>(
    `# Polity & Governance\n## Fundamental Rights\n- Article 14 - Right to Equality (High)\n- Article 19 - Freedom of Speech & Expression (imp)\n## Directive Principles\n- Article 40 - Village Panchayats\n- Article 44 - Uniform Civil Code (High)`
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<BulkImportResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Simple CSV to JSON converter helper
  const parseCsvToJson = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, index) => {
        obj[h] = values[index] || '';
      });
      rows.push(obj);
    }

    return rows;
  };

  const handlePreview = async () => {
    if (!rawInputText.trim()) {
      setStatusMessage('Please provide input data to preview.');
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const isSmartSyllabus = importType === 'syllabus' && syllabusMode === 'smart';
    let payload: any = { type: importType, mode: 'preview' };

    if (isSmartSyllabus) {
      payload.rawText = rawInputText;
      payload.exam = selectedExam;
    } else {
      let rows: any[] = [];
      try {
        if (rawInputText.trim().startsWith('[')) {
          rows = JSON.parse(rawInputText);
        } else {
          rows = parseCsvToJson(rawInputText);
        }
      } catch (e) {
        setLoading(false);
        setStatusMessage('Invalid CSV or JSON format. Please verify column headers.');
        return;
      }
      payload.rows = rows;
    }

    try {
      const res = await fetch('/api/academic/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setPreviewResult(data);
      } else {
        setStatusMessage(data.error || 'Preview failed');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error processing preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!rawInputText.trim()) return;

    setLoading(true);
    const isSmartSyllabus = importType === 'syllabus' && syllabusMode === 'smart';
    let payload: any = { type: importType, mode: 'execute' };

    if (isSmartSyllabus) {
      payload.rawText = rawInputText;
      payload.exam = selectedExam;
    } else {
      let rows: any[] = [];
      try {
        if (rawInputText.trim().startsWith('[')) {
          rows = JSON.parse(rawInputText);
        } else {
          rows = parseCsvToJson(rawInputText);
        }
      } catch (e) {
        setLoading(false);
        return;
      }
      payload.rows = rows;
    }

    try {
      const res = await fetch('/api/academic/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setPreviewResult(data);
        setStatusMessage(`Successfully imported ${data.inserted} records!`);
        if (onSuccessImport) onSuccessImport();
      }
    } catch (e) {
      setStatusMessage('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const sampleTemplates: Record<string, string> = {
    pyqs: `Question,Year,Exam,Stage,Paper,Subject,Topic,A,B,C,D,correctOption,explanation,difficulty\n"Which right was called heart and soul of Constitution?",1995,UPSC_CSE,Prelims,"GS Paper 1","Indian Polity","Fundamental Rights","Freedom of Religion","Property","Equality","Constitutional Remedies",3,"Article 32 is the heart and soul.",Easy`,
    syllabus_smart: `# Polity & Governance\n## Fundamental Rights\n- Article 14 - Right to Equality (High)\n- Article 19 - Freedom of Speech & Expression (imp)\n## Directive Principles\n- Article 40 - Village Panchayats\n- Article 44 - Uniform Civil Code (High)`,
    syllabus_strict: `Title,Exam,Paper,Subject,Chapter,Topic,stage,weightage,estimatedHours\n"Article 14 - Right to Equality",UPSC_CSE,"GS Paper 2","Polity & Governance","Constitutional Framework","Fundamental Rights",Prelims,High,2.5`,
    questions: `questionText,type,subject,topic,difficulty,status\n"Explain Federalism in India",mains_descriptive,"Polity","Federal System",Hard,published`,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-[#0a0a0e] border border-white/10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Enterprise Bulk CSV / Excel Import Engine</h3>
              <p className="text-xs text-slate-400">Parse, validate schema & detect duplicate records before importing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          {(['pyqs', 'syllabus', 'questions'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setImportType(t);
                if (t === 'syllabus') {
                  setRawInputText(sampleTemplates.syllabus_smart);
                } else {
                  setRawInputText(sampleTemplates[t]);
                }
                setPreviewResult(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                importType === t
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Syllabus Mode Toggle */}
        {importType === 'syllabus' && (
          <div className="space-y-3">
            <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  setSyllabusMode('smart');
                  setRawInputText(sampleTemplates.syllabus_smart);
                  setPreviewResult(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  syllabusMode === 'smart'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Smart Paste (Any Format)
              </button>
              <button
                onClick={() => {
                  setSyllabusMode('strict');
                  setRawInputText(sampleTemplates.syllabus_strict);
                  setPreviewResult(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  syllabusMode === 'strict'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Strict CSV/JSON
              </button>
            </div>

            {syllabusMode === 'smart' && (
              <div className="flex items-center justify-between bg-black/40 px-3 py-2.5 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-slate-300">Target Exam:</span>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="bg-black/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                >
                  {EXAM_LIST.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Template hint */}
        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between">
          <span>
            {importType === 'syllabus' && syllabusMode === 'smart'
              ? 'Paste any raw syllabus text, outlines, or copied PDF text.'
              : `Sample template pre-loaded for ${importType.toUpperCase()}.`}
          </span>
          <button
            onClick={() => {
              if (importType === 'syllabus') {
                setRawInputText(syllabusMode === 'smart' ? sampleTemplates.syllabus_smart : sampleTemplates.syllabus_strict);
              } else {
                setRawInputText(sampleTemplates[importType]);
              }
            }}
            className="text-[11px] underline text-cyan-300 font-bold"
          >
            Load Sample Template
          </button>
        </div>

        {/* Data Input Textarea */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300">
            {importType === 'syllabus' && syllabusMode === 'smart' ? 'Raw Syllabus Text Stream' : 'CSV or JSON Data Stream'}
          </label>
          <textarea
            rows={6}
            value={rawInputText}
            onChange={(e) => setRawInputText(e.target.value)}
            placeholder={
              importType === 'syllabus' && syllabusMode === 'smart'
                ? "Paste any syllabus text — bullet points, numbered lists, a plain paragraph, or headings copied from a PDF. We'll organize it automatically."
                : 'Paste CSV rows or JSON array...'
            }
            className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
          />
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-cyan-300">
            {statusMessage}
          </div>
        )}

        {/* Preview Results Summary Box */}
        {previewResult && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 text-xs">
            <h4 className="font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Import Preview Validation
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-[10px] text-slate-400 block">Total Rows</span>
                <span className="font-extrabold text-white">{previewResult.totalRows}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-300">
                <span className="text-[10px] block">Valid Ready</span>
                <span className="font-extrabold">{previewResult.inserted}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300">
                <span className="text-[10px] block">Duplicates</span>
                <span className="font-extrabold">{previewResult.duplicates}</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-300">
                <span className="text-[10px] block">Failed</span>
                <span className="font-extrabold">{previewResult.failed}</span>
              </div>
            </div>

            {/* Detected Hierarchy Tree Preview */}
            {previewResult.detectedHierarchy && previewResult.detectedHierarchy.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="font-bold text-cyan-300 text-[11px] block">Detected Syllabus Hierarchy Tree Preview:</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {previewResult.detectedHierarchy.map((subNode: any, sIdx: number) => (
                    <div key={sIdx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                      <div className="text-[11px] font-black text-cyan-300 uppercase tracking-wide">
                        Subject: {subNode.subject}
                      </div>
                      <div className="space-y-1 pl-2 border-l border-white/10">
                        {subNode.chapters?.map((chap: any, cIdx: number) => (
                          <div key={cIdx} className="space-y-1">
                            <div className="text-[11px] font-bold text-slate-200">
                              📁 Chapter: {chap.chapter}
                            </div>
                            <div className="space-y-1 pl-2">
                              {chap.topics?.map((top: any, tIdx: number) => (
                                <div key={tIdx} className="flex items-center justify-between text-[11px] text-slate-300 bg-black/40 p-1.5 rounded-lg border border-white/5">
                                  <span>• {top.title}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                    top.weightage === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                    top.weightage === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  }`}>
                                    {top.weightage}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
          >
            {loading ? 'Validating...' : 'Preview Validation'}
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={loading || !previewResult || previewResult.inserted === 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 font-extrabold text-xs text-white shadow-lg disabled:opacity-50"
          >
            Execute Safe Import ({previewResult?.inserted || 0})
          </button>
        </div>
      </div>
    </div>
  );
};
