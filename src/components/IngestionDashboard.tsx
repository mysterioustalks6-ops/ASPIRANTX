import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileText, FileImage, File, CheckCircle2, AlertTriangle,
  XCircle, Clock, Zap, RefreshCw, Eye, ThumbsUp, ThumbsDown,
  BarChart3, BookOpen, Sparkles, ChevronDown, ChevronUp, X,
  AlertCircle, Info
} from 'lucide-react';

interface IngestionResult {
  jobId: string;
  fileName?: string;
  extractionMethod?: string;
  pageCount?: number;
  textLength?: number;
  detected: number;
  autoRepaired?: number;
  published: number;
  sentToReview: number;
  rejected: number;
  duplicatesRemoved: number;
  averageQualityScore: number;
  errors: string[];
}

interface ReviewItem {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number | null;
  subject: string;
  topic: string;
  qualityScore: number;
  qualityFlags: string[];
}

interface IngestionDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userToken: string;
  activeExam: string;
}

type IngestionMode = 'file' | 'text' | 'json';
type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const EXAM_OPTIONS = [
  { value: 'UPSC_CSE', label: 'UPSC CSE' },
  { value: 'NDA_NA', label: 'NDA & NA' },
  { value: 'NEET_UG', label: 'NEET UG' },
  { value: 'SSC_CGL', label: 'SSC CGL' },
];

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp';

const QUALITY_COLOR = (score: number) => {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#f59e0b';
  return '#ef4444';
};

export const IngestionDashboard: React.FC<IngestionDashboardProps> = ({
  isOpen, onClose, userToken, activeExam,
}) => {
  const [mode, setMode] = useState<IngestionMode>('file');
  const [selectedExam, setSelectedExam] = useState(activeExam || 'UPSC_CSE');
  const [hintSubject, setHintSubject] = useState('');
  const [sourceDocument, setSourceDocument] = useState('');
  const [sourceYear, setSourceYear] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const headers = { Authorization: `Bearer ${userToken}` };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!sourceDocument) setSourceDocument(file.name.replace(/\.[^.]+$/, ''));
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const getFileIcon = (file: File | null) => {
    if (!file) return <Upload size={28} />;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={28} className="text-red-400" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <FileImage size={28} className="text-blue-400" />;
    return <File size={28} className="text-slate-400" />;
  };

  const runFileUpload = async () => {
    if (!selectedFile) return;
    setUploadState('uploading');
    setError(null);
    const form = new FormData();
    form.append('file', selectedFile);
    form.append('exam', selectedExam);
    form.append('sourceDocument', sourceDocument);
    form.append('hintSubject', hintSubject);
    form.append('sourceYear', sourceYear);
    try {
      const r = await fetch('/api/ingestion/file', { method: 'POST', headers: { Authorization: `Bearer ${userToken}` }, body: form });
      setUploadState('processing');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.details || 'Upload failed');
      setResult(d);
      setUploadState('done');
    } catch (e: any) {
      setError(e.message);
      setUploadState('error');
    }
  };

  const runTextIngest = async () => {
    if (!pastedText.trim()) return;
    setUploadState('processing');
    setError(null);
    try {
      const r = await fetch('/api/ingestion/text', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText, exam: selectedExam, sourceDocument, hintSubject }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
      setUploadState('done');
    } catch (e: any) {
      setError(e.message);
      setUploadState('error');
    }
  };

  const runJsonIngest = async () => {
    let records;
    try { records = JSON.parse(jsonText); } catch { setError('Invalid JSON'); return; }
    if (!Array.isArray(records)) { setError('JSON must be an array of question objects'); return; }
    setUploadState('processing');
    setError(null);
    try {
      const r = await fetch('/api/ingestion/json', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, exam: selectedExam, sourceDocument }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
      setUploadState('done');
    } catch (e: any) {
      setError(e.message);
      setUploadState('error');
    }
  };

  const loadReview = async () => {
    try {
      const r = await fetch(`/api/ingestion/review?exam=${selectedExam}`, { headers });
      const d = await r.json();
      setReviewItems(d.items || []);
      setShowReview(true);
    } catch {}
  };

  const approveItem = async (id: string, correctOption?: number) => {
    await fetch(`/api/ingestion/approve/${id}`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctOption }),
    });
    setReviewItems(prev => prev.filter(q => q.id !== id));
  };

  const rejectItem = async (id: string) => {
    await fetch(`/api/ingestion/reject/${id}`, { method: 'POST', headers });
    setReviewItems(prev => prev.filter(q => q.id !== id));
  };

  const runRevalidate = async () => {
    setUploadState('processing');
    try {
      const r = await fetch('/api/ingestion/revalidate', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam: selectedExam }),
      });
      const d = await r.json();
      setResult({ jobId: 'revalidate', detected: d.checked, published: d.checked - d.rejected, sentToReview: 0, rejected: d.rejected, duplicatesRemoved: 0, averageQualityScore: 0, errors: [] });
      setUploadState('done');
    } catch (e: any) { setError(e.message); setUploadState('error'); }
  };

  const reset = () => { setUploadState('idle'); setResult(null); setError(null); setSelectedFile(null); };

  return (
    <div className="ingestion-overlay">
      <motion.div
        className="ingestion-modal"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="ingestion-header">
          <div className="ingestion-header-left">
            <div className="ingestion-icon-wrap">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="ingestion-title">Question Ingestion</h2>
              <p className="ingestion-subtitle">Universal auto-repair pipeline</p>
            </div>
          </div>
          <button className="ingestion-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ingestion-body">
          {/* Config row */}
          <div className="ingestion-config-row">
            <div className="ingestion-field">
              <label>Target Exam</label>
              <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                {EXAM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="ingestion-field">
              <label>Source Document Name</label>
              <input value={sourceDocument} onChange={e => setSourceDocument(e.target.value)} placeholder="e.g. SSC CGL 2023 Tier-1" />
            </div>
            <div className="ingestion-field">
              <label>Subject Hint (optional)</label>
              <input value={hintSubject} onChange={e => setHintSubject(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="ingestion-field">
              <label>Year (optional)</label>
              <input value={sourceYear} onChange={e => setSourceYear(e.target.value)} placeholder="2023" />
            </div>
          </div>

          {/* Mode tabs */}
          <div className="ingestion-tabs">
            {(['file', 'text', 'json'] as IngestionMode[]).map(m => (
              <button key={m} className={`ingestion-tab${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
                {m === 'file' ? <><Upload size={14} /> File</> : m === 'text' ? <><FileText size={14} /> Paste Text</> : <><File size={14} /> JSON</>}
              </button>
            ))}
          </div>

          {/* Upload area */}
          <AnimatePresence mode="wait">
            {uploadState === 'idle' || uploadState === 'error' ? (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {mode === 'file' && (
                  <div
                    className={`ingestion-dropzone${dragOver ? ' dragover' : ''}${selectedFile ? ' has-file' : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                    {getFileIcon(selectedFile)}
                    {selectedFile
                      ? <><p className="ingestion-filename">{selectedFile.name}</p><p className="ingestion-filesize">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p></>
                      : <><p className="ingestion-drop-label">Drop your file here or click to browse</p><p className="ingestion-drop-sub">PDF, DOCX, TXT, JPG, PNG — up to 50MB</p></>
                    }
                  </div>
                )}

                {mode === 'text' && (
                  <textarea
                    className="ingestion-textarea"
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder={`Paste question text here. For example:
1. What is the capital of India?
A. Mumbai
B. New Delhi
C. Kolkata
D. Chennai
Answer: B

2. The Constitution of India was adopted on:
A. 15th August 1947
B. 26th January 1950
C. 26th November 1949
D. 2nd October 1951
Answer: C`}
                  />
                )}

                {mode === 'json' && (
                  <textarea
                    className="ingestion-textarea"
                    value={jsonText}
                    onChange={e => setJsonText(e.target.value)}
                    placeholder={`Paste JSON array of questions:
[
  {
    "questionText": "What is Newton's first law?",
    "options": ["Law of Inertia", "Law of Acceleration", "Law of Reaction", "Law of Gravitation"],
    "correctOption": 0,
    "year": 2022,
    "subject": "Physics"
  }
]`}
                  />
                )}

                {error && (
                  <div className="ingestion-error">
                    <XCircle size={14} />{error}
                  </div>
                )}

                <div className="ingestion-action-row">
                  <button
                    className="ingestion-submit"
                    onClick={mode === 'file' ? runFileUpload : mode === 'text' ? runTextIngest : runJsonIngest}
                    disabled={mode === 'file' ? !selectedFile : mode === 'text' ? !pastedText.trim() : !jsonText.trim()}
                  >
                    <Zap size={15} />
                    {mode === 'file' ? 'Process File' : 'Process Questions'}
                  </button>

                  <button className="ingestion-secondary" onClick={loadReview}>
                    <Eye size={14} /> Review Queue
                  </button>

                  <button className="ingestion-secondary" onClick={runRevalidate}>
                    <RefreshCw size={14} /> Re-validate All
                  </button>
                </div>
              </motion.div>
            ) : uploadState === 'uploading' || uploadState === 'processing' ? (
              <motion.div key="processing" className="ingestion-processing"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="ingestion-spinner" />
                <p className="ingestion-processing-label">
                  {uploadState === 'uploading' ? 'Uploading file...' : 'Processing pipeline...'}
                </p>
                <p className="ingestion-processing-sub">
                  Extract → Repair → Score → Deduplicate → Publish
                </p>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Result card */}
                <div className="ingestion-result-card">
                  <div className="ingestion-result-header">
                    <CheckCircle2 size={22} className="text-green-400" />
                    <div>
                      <p className="ingestion-result-title">Ingestion Complete</p>
                      <p className="ingestion-result-doc">{sourceDocument || result.fileName || 'Source'}</p>
                    </div>
                    {result.averageQualityScore > 0 && (
                      <div className="ingestion-quality-badge" style={{ background: QUALITY_COLOR(result.averageQualityScore) + '22', color: QUALITY_COLOR(result.averageQualityScore) }}>
                        <BarChart3 size={12} />Avg {result.averageQualityScore}
                      </div>
                    )}
                  </div>

                  <div className="ingestion-stats-grid">
                    <div className="ingestion-stat">
                      <span className="ingestion-stat-num">{result.detected}</span>
                      <span className="ingestion-stat-label">Detected</span>
                    </div>
                    <div className="ingestion-stat success">
                      <span className="ingestion-stat-num">{result.published}</span>
                      <span className="ingestion-stat-label">Published</span>
                    </div>
                    <div className="ingestion-stat warn">
                      <span className="ingestion-stat-num">{result.autoRepaired ?? 0}</span>
                      <span className="ingestion-stat-label">Auto-repaired</span>
                    </div>
                    <div className="ingestion-stat review">
                      <span className="ingestion-stat-num">{result.sentToReview}</span>
                      <span className="ingestion-stat-label">In Review</span>
                    </div>
                    <div className="ingestion-stat muted">
                      <span className="ingestion-stat-num">{result.duplicatesRemoved}</span>
                      <span className="ingestion-stat-label">Duplicates</span>
                    </div>
                    <div className="ingestion-stat danger">
                      <span className="ingestion-stat-num">{result.rejected}</span>
                      <span className="ingestion-stat-label">Rejected</span>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="ingestion-result-errors">
                      {result.errors.map((e, i) => <p key={i}><AlertCircle size={12} /> {e}</p>)}
                    </div>
                  )}

                  {result.extractionMethod && (
                    <div className="ingestion-extraction-info">
                      <Info size={11} />
                      Extracted via <strong>{result.extractionMethod}</strong>
                      {result.pageCount ? ` · ${result.pageCount} pages` : ''}
                      {result.textLength ? ` · ${(result.textLength / 1000).toFixed(1)}k chars` : ''}
                    </div>
                  )}
                </div>

                <div className="ingestion-action-row">
                  <button className="ingestion-submit" onClick={reset}>
                    <Upload size={14} /> Ingest Another
                  </button>
                  {result.sentToReview > 0 && (
                    <button className="ingestion-secondary" onClick={loadReview}>
                      <Eye size={14} /> Review {result.sentToReview} Items
                    </button>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Review Queue */}
          <AnimatePresence>
            {showReview && reviewItems.length > 0 && (
              <motion.div className="ingestion-review-section"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="ingestion-review-header">
                  <h3><Clock size={14} /> Review Queue ({reviewItems.length})</h3>
                  <button onClick={() => setShowReview(false)}><ChevronUp size={14} /></button>
                </div>
                {reviewItems.map(item => (
                  <ReviewCard key={item.id} item={item} onApprove={approveItem} onReject={rejectItem} />
                ))}
              </motion.div>
            )}
            {showReview && reviewItems.length === 0 && (
              <motion.div className="ingestion-review-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckCircle2 size={20} className="text-green-400" />
                <p>Review queue is empty</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        .ingestion-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .ingestion-modal {
          background: linear-gradient(135deg, #0f1629 0%, #1a1f3a 50%, #0f1629 100%);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 20px; width: 100%; max-width: 820px;
          max-height: 92vh; overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1);
        }
        .ingestion-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .ingestion-header-left { display: flex; align-items: center; gap: 0.75rem; }
        .ingestion-icon-wrap {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .ingestion-title { font-size: 1.05rem; font-weight: 700; color: #e2e8f0; margin: 0; }
        .ingestion-subtitle { font-size: 0.75rem; color: #64748b; margin: 0; }
        .ingestion-close {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; width: 32px; height: 32px; color: #94a3b8;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ingestion-close:hover { background: rgba(239,68,68,0.2); color: #f87171; }
        .ingestion-body { padding: 1.25rem 1.5rem 1.5rem; }
        .ingestion-config-row { display: grid; grid-template-columns: 1fr 1.5fr 1fr 0.7fr; gap: 0.75rem; margin-bottom: 1rem; }
        .ingestion-field label { display: block; font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem; }
        .ingestion-field input, .ingestion-field select {
          width: 100%; padding: 0.5rem 0.65rem; font-size: 0.82rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; color: #e2e8f0; outline: none; transition: border-color 0.2s;
        }
        .ingestion-field input:focus, .ingestion-field select:focus { border-color: rgba(99,102,241,0.5); }
        .ingestion-field select option { background: #1a1f3a; }
        .ingestion-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .ingestion-tab {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94a3b8; cursor: pointer;
          transition: all 0.2s;
        }
        .ingestion-tab.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent; color: white;
        }
        .ingestion-dropzone {
          border: 2px dashed rgba(99,102,241,0.3); border-radius: 14px;
          padding: 2.5rem 1rem; cursor: pointer; text-align: center;
          transition: all 0.25s; background: rgba(99,102,241,0.04);
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        }
        .ingestion-dropzone.dragover { border-color: #6366f1; background: rgba(99,102,241,0.12); }
        .ingestion-dropzone.has-file { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.06); }
        .ingestion-dropzone:hover { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.08); }
        .ingestion-filename { font-weight: 600; color: #e2e8f0; font-size: 0.9rem; margin: 0; }
        .ingestion-filesize { color: #64748b; font-size: 0.75rem; margin: 0; }
        .ingestion-drop-label { color: #94a3b8; font-size: 0.88rem; margin: 0; }
        .ingestion-drop-sub { color: #475569; font-size: 0.75rem; margin: 0; }
        .ingestion-textarea {
          width: 100%; height: 220px; padding: 0.85rem 1rem; font-size: 0.8rem;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #e2e8f0; resize: vertical; outline: none;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .ingestion-textarea:focus { border-color: rgba(99,102,241,0.4); }
        .ingestion-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px; padding: 0.6rem 0.85rem; margin-top: 0.75rem;
          font-size: 0.8rem; color: #f87171;
        }
        .ingestion-action-row { display: flex; gap: 0.75rem; margin-top: 1rem; align-items: center; }
        .ingestion-submit {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1.25rem; border-radius: 9px; font-size: 0.85rem; font-weight: 600;
          background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
          border: none; cursor: pointer; transition: all 0.2s;
        }
        .ingestion-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .ingestion-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        .ingestion-secondary {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1rem; border-radius: 9px; font-size: 0.82rem;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          color: #94a3b8; cursor: pointer; transition: all 0.2s;
        }
        .ingestion-secondary:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
        .ingestion-processing {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1rem; padding: 3rem 1rem;
        }
        .ingestion-spinner {
          width: 44px; height: 44px; border-radius: 50%;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ingestion-processing-label { color: #e2e8f0; font-size: 0.95rem; font-weight: 600; margin: 0; }
        .ingestion-processing-sub { color: #64748b; font-size: 0.78rem; margin: 0; }
        .ingestion-result-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px; padding: 1.15rem 1.25rem; margin-bottom: 1rem;
        }
        .ingestion-result-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
        .ingestion-result-title { font-weight: 700; color: #e2e8f0; font-size: 0.95rem; margin: 0; }
        .ingestion-result-doc { font-size: 0.75rem; color: #64748b; margin: 0; }
        .ingestion-quality-badge {
          margin-left: auto; display: flex; align-items: center; gap: 0.3rem;
          padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;
        }
        .ingestion-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.6rem; }
        .ingestion-stat {
          background: rgba(255,255,255,0.04); border-radius: 10px;
          padding: 0.65rem; text-align: center;
        }
        .ingestion-stat.success .ingestion-stat-num { color: #22c55e; }
        .ingestion-stat.warn .ingestion-stat-num { color: #f59e0b; }
        .ingestion-stat.review .ingestion-stat-num { color: #6366f1; }
        .ingestion-stat.danger .ingestion-stat-num { color: #ef4444; }
        .ingestion-stat-num { display: block; font-size: 1.4rem; font-weight: 800; color: #e2e8f0; }
        .ingestion-stat-label { font-size: 0.68rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        .ingestion-result-errors {
          margin-top: 0.75rem; background: rgba(239,68,68,0.08); border-radius: 8px;
          padding: 0.6rem 0.85rem;
        }
        .ingestion-result-errors p { display: flex; align-items: center; gap: 0.4rem; font-size: 0.76rem; color: #f87171; margin: 0.2rem 0; }
        .ingestion-extraction-info {
          display: flex; align-items: center; gap: 0.4rem; margin-top: 0.75rem;
          font-size: 0.73rem; color: #475569;
        }
        .ingestion-review-section {
          margin-top: 1.25rem; border: 1px solid rgba(99,102,241,0.2);
          border-radius: 12px; overflow: hidden;
        }
        .ingestion-review-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(99,102,241,0.08);
        }
        .ingestion-review-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #a5b4fc; margin: 0; }
        .ingestion-review-header button { background: none; border: none; color: #64748b; cursor: pointer; }
        .ingestion-review-empty { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 1.5rem; color: #64748b; font-size: 0.85rem; }
        @media (max-width: 640px) {
          .ingestion-config-row { grid-template-columns: 1fr 1fr; }
          .ingestion-stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
};

// ── Review Card component ─────────────────────────────────
const ReviewCard: React.FC<{
  item: ReviewItem;
  onApprove: (id: string, correctOption?: number) => void;
  onReject: (id: string) => void;
}> = ({ item, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const [chosen, setChosen] = useState<number | undefined>(item.correctOption ?? undefined);

  return (
    <div className="review-card">
      <div className="review-card-top" onClick={() => setExpanded(e => !e)}>
        <div className="review-meta">
          <span className="review-subject">{item.subject}</span>
          <span className="review-score" style={{ color: QUALITY_COLOR(item.qualityScore) }}>
            Score: {item.qualityScore}
          </span>
          {item.qualityFlags.length > 0 && (
            <span className="review-flags">{item.qualityFlags.slice(0, 2).join(', ')}</span>
          )}
        </div>
        <p className="review-question">{item.questionText.slice(0, 120)}{item.questionText.length > 120 ? '…' : ''}</p>
        <button className="review-expand">{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</button>
      </div>

      {expanded && (
        <motion.div className="review-expanded" initial={{ height: 0 }} animate={{ height: 'auto' }}>
          <p className="review-full-q">{item.questionText}</p>
          <div className="review-options">
            {item.options.map((opt, i) => (
              <button
                key={i}
                className={`review-opt${chosen === i ? ' chosen' : ''}`}
                onClick={() => setChosen(i)}
              >
                <span className="review-opt-label">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
          <div className="review-actions">
            <button className="review-approve" onClick={() => onApprove(item.id, chosen)}>
              <ThumbsUp size={13} /> Approve
            </button>
            <button className="review-reject" onClick={() => onReject(item.id)}>
              <ThumbsDown size={13} /> Reject
            </button>
          </div>
        </motion.div>
      )}

      <style>{`
        .review-card { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .review-card:last-child { border-bottom: none; }
        .review-card-top { padding: 0.85rem 1rem; cursor: pointer; position: relative; }
        .review-meta { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem; }
        .review-subject { font-size: 0.7rem; font-weight: 600; padding: 0.18rem 0.5rem; border-radius: 4px; background: rgba(99,102,241,0.15); color: #a5b4fc; }
        .review-score { font-size: 0.72rem; font-weight: 700; }
        .review-flags { font-size: 0.68rem; color: #f59e0b; }
        .review-question { font-size: 0.82rem; color: #cbd5e1; margin: 0; line-height: 1.5; padding-right: 1.5rem; }
        .review-expand { position: absolute; top: 0.85rem; right: 1rem; background: none; border: none; color: #64748b; cursor: pointer; }
        .review-expanded { padding: 0 1rem 1rem; overflow: hidden; }
        .review-full-q { font-size: 0.85rem; color: #e2e8f0; line-height: 1.6; margin-bottom: 0.75rem; }
        .review-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-bottom: 0.75rem; }
        .review-opt {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.78rem; text-align: left;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: #94a3b8; cursor: pointer; transition: all 0.15s;
        }
        .review-opt.chosen { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #e2e8f0; }
        .review-opt-label { font-weight: 700; color: #6366f1; min-width: 14px; }
        .review-actions { display: flex; gap: 0.5rem; }
        .review-approve {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.45rem 0.85rem; border-radius: 7px; font-size: 0.78rem; font-weight: 600;
          background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3);
          color: #4ade80; cursor: pointer; transition: all 0.15s;
        }
        .review-approve:hover { background: rgba(34,197,94,0.25); }
        .review-reject {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.45rem 0.85rem; border-radius: 7px; font-size: 0.78rem; font-weight: 600;
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25);
          color: #f87171; cursor: pointer; transition: all 0.15s;
        }
        .review-reject:hover { background: rgba(239,68,68,0.22); }
      `}</style>
    </div>
  );
};

export default IngestionDashboard;
