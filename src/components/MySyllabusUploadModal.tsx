import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Trash2, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Table, 
  HelpCircle,
  RefreshCw,
  Sliders,
  Check,
  Wand2,
  FileSpreadsheet,
  Link,
  RotateCcw
} from 'lucide-react';
import { 
  PersonalSyllabusNode, 
  getPersonalSyllabusNodes, 
  savePersonalSubjectSyllabus, 
  removePersonalSubject, 
  parseCsvSyllabus,
  splitCsvLine,
  CsvColumnMapping
} from '../lib/personalSyllabus';
import { extractSpreadsheetId, getGoogleSheetCsvUrl } from '../utils/googleSheets';

interface MySyllabusUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: string;
  userId?: string;
  onSyllabusUpdated?: () => void;
}

export type ColumnRole = 'subject' | 'chapter' | 'topic' | 'subtopic' | 'stage' | 'weightage' | 'tags' | 'ignore';

export const MySyllabusUploadModal: React.FC<MySyllabusUploadModalProps> = ({
  isOpen,
  onClose,
  exam,
  userId,
  onSyllabusUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [subjectName, setSubjectName] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<PersonalSyllabusNode[]>([]);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [otherSubjectsFound, setOtherSubjectsFound] = useState<string[]>([]);
  const [existingSubjects, setExistingSubjects] = useState<string[]>([]);
  const [userNodes, setUserNodes] = useState<PersonalSyllabusNode[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Parse Mode: AI Auto-Organize (Default) vs Manual Column Mapping (Fallback)
  const [parseMode, setParseMode] = useState<'ai' | 'manual'>('ai');
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);
  const [aiSuccess, setAiSuccess] = useState<boolean>(false);

  // Column Mapping States (Manual Mode)
  const [hasHeaderRow, setHasHeaderRow] = useState<boolean>(true);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [sampleRowValues, setSampleRowValues] = useState<string[]>([]);
  const [columnRoles, setColumnRoles] = useState<ColumnRole[]>([]);
  const [mappingConfirmed, setMappingConfirmed] = useState<boolean>(false);

  // Load existing personal subjects
  const loadPersonalData = async () => {
    const nodes = await getPersonalSyllabusNodes(userId, exam);
    setUserNodes(nodes);
    const subjects = Array.from(new Set(nodes.map((n) => n.subject).filter(Boolean)));
    setExistingSubjects(subjects);
  };

  useEffect(() => {
    if (isOpen) {
      loadPersonalData();
      setStatusMessage(null);
    }
  }, [isOpen, exam, userId]);

  // Helper to detect columns and pre-fill best-guess roles for manual mode
  const analyzeColumnsAndPrefill = (text: string, isHeader: boolean) => {
    if (!text.trim()) {
      setRawHeaders([]);
      setSampleRowValues([]);
      setColumnRoles([]);
      setParsedPreview([]);
      setMappingConfirmed(false);
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/^\s*(?:[-*•●▪‣◦]+|\d+[.)])\s+/, '').trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setRawHeaders([]);
      setSampleRowValues([]);
      setColumnRoles([]);
      setParsedPreview([]);
      setMappingConfirmed(false);
      return;
    }

    const line0Cols = splitCsvLine(lines[0]);
    const line1Cols = lines.length > 1 ? splitCsvLine(lines[1]) : line0Cols;
    const colCount = Math.max(line0Cols.length, line1Cols.length);

    const detectedHeaders: string[] = [];
    const samples: string[] = [];
    const roles: ColumnRole[] = [];

    for (let i = 0; i < colCount; i++) {
      const headerStr = line0Cols[i] || `Column ${i + 1}`;
      detectedHeaders.push(isHeader ? headerStr : `Column ${i + 1}`);
      samples.push(isHeader ? (line1Cols[i] || '') : (line0Cols[i] || ''));

      const lower = (line0Cols[i] || '').toLowerCase().trim();

      if (lower.includes('subject')) {
        roles.push('subject');
      } else if (lower.includes('chapter')) {
        roles.push('chapter');
      } else if (lower.includes('subtopic') || lower.includes('sub-topic') || lower.includes('micro')) {
        roles.push('subtopic');
      } else if (lower.includes('topic')) {
        roles.push('topic');
      } else if (lower.includes('stage') || lower.includes('tier') || lower.includes('level')) {
        roles.push('stage');
      } else if (lower.includes('weightage') || lower.includes('marks') || lower.includes('priority')) {
        roles.push('weightage');
      } else if (lower.includes('tag')) {
        roles.push('tags');
      } else {
        if (!isHeader || !(['subject', 'chapter', 'topic', 'subtopic'].some((k) => lower.includes(k)))) {
          if (colCount === 1) {
            roles.push(i === 0 ? 'subtopic' : 'ignore');
          } else if (colCount === 2) {
            roles.push(i === 0 ? 'chapter' : i === 1 ? 'subtopic' : 'ignore');
          } else if (colCount === 3) {
            roles.push(i === 0 ? 'subject' : i === 1 ? 'chapter' : i === 2 ? 'subtopic' : 'ignore');
          } else if (colCount === 4) {
            roles.push(i === 0 ? 'subject' : i === 1 ? 'chapter' : i === 2 ? 'topic' : i === 3 ? 'subtopic' : 'ignore');
          } else {
            roles.push('ignore');
          }
        } else {
          roles.push('ignore');
        }
      }
    }

    setRawHeaders(detectedHeaders);
    setSampleRowValues(samples);
    setColumnRoles(roles);
    setMappingConfirmed(false);
    setParsedPreview([]);
  };

  // Re-analyze columns in manual mode when pastedText or hasHeaderRow changes
  useEffect(() => {
    if (parseMode === 'manual') {
      analyzeColumnsAndPrefill(pastedText, hasHeaderRow);
    }
  }, [pastedText, hasHeaderRow, parseMode]);

  // Construct current CsvColumnMapping object from state
  const getCurrentMapping = (): CsvColumnMapping => {
    return {
      subjectIdx: columnRoles.indexOf('subject') >= 0 ? columnRoles.indexOf('subject') : null,
      chapterIdx: columnRoles.indexOf('chapter') >= 0 ? columnRoles.indexOf('chapter') : null,
      topicIdx: columnRoles.indexOf('topic') >= 0 ? columnRoles.indexOf('topic') : null,
      subtopicIdx: columnRoles.indexOf('subtopic') >= 0 ? columnRoles.indexOf('subtopic') : null,
      stageIdx: columnRoles.indexOf('stage') >= 0 ? columnRoles.indexOf('stage') : null,
      weightageIdx: columnRoles.indexOf('weightage') >= 0 ? columnRoles.indexOf('weightage') : null,
      tagsIdx: columnRoles.indexOf('tags') >= 0 ? columnRoles.indexOf('tags') : null,
      hasHeaderRow,
    };
  };

  const runParserWithMapping = (text: string, currentSubject: string, mapping: CsvColumnMapping) => {
    if (!text.trim()) {
      setParsedPreview([]);
      setSkippedCount(0);
      setOtherSubjectsFound([]);
      return;
    }

    const { nodes, skippedOtherSubjectRows, otherSubjectsFound: foundSubs } = parseCsvSyllabus(
      text,
      exam,
      currentSubject,
      mapping
    );

    setParsedPreview(nodes);
    setSkippedCount(skippedOtherSubjectRows);
    setOtherSubjectsFound(foundSubs);

    if (!currentSubject && foundSubs.length > 0) {
      setSubjectName(foundSubs[0]);
    }
  };

  // AI Auto-Organize Handler (Default / Primary Path)
  const handleAiAutoOrganize = async (overrideContent?: string) => {
    let textToProcess = (overrideContent !== undefined ? overrideContent : pastedText).trim();
    if (!textToProcess) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste syllabus text or a public Google Sheets link first.',
      });
      return;
    }

    setIsAiParsing(true);
    setStatusMessage(null);

    let rawTextToSend = textToProcess;
    let isSheet = false;

    // Check if input is a Google Sheets URL or ID
    const sheetId = extractSpreadsheetId(textToProcess);
    if (sheetId) {
      isSheet = true;
      try {
        const csvUrl = getGoogleSheetCsvUrl(sheetId);
        const sheetRes = await fetch(csvUrl);
        if (sheetRes.ok) {
          const csvText = await sheetRes.text();
          if (csvText && csvText.trim().length > 0) {
            rawTextToSend = csvText;
          }
        } else {
          throw new Error('Google Sheet is private or inaccessible');
        }
      } catch (sheetErr: any) {
        console.warn('Google Sheet fetch warning:', sheetErr);
        setParseMode('manual');
        setAiSuccess(false);
        analyzeColumnsAndPrefill(textToProcess, hasHeaderRow);
        setStatusMessage({
          type: 'error',
          text: "Couldn't auto-detect structure — please map columns manually. (Make sure Google Sheet is shared as 'Anyone with the link can view').",
        });
        setIsAiParsing(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/syllabus/ai-organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawTextToSend,
          defaultExam: exam,
          defaultSubject: subjectName.trim() || 'Custom Subject',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.nodes) && data.nodes.length > 0) {
        setParsedPreview(data.nodes);
        setOtherSubjectsFound(data.subjectsFound || []);
        if (!subjectName.trim() && data.subjectsFound && data.subjectsFound.length > 0) {
          setSubjectName(data.subjectsFound[0]);
        }
        setAiSuccess(true);
        setParseMode('ai');
        setStatusMessage({
          type: 'success',
          text: `✨ AI auto-organized ${data.nodes.length} syllabus topics${isSheet ? ' directly from your Google Sheet' : ''}!`,
        });
      } else {
        // Fallback to manual column mapping UI as requested
        setParseMode('manual');
        setAiSuccess(false);
        analyzeColumnsAndPrefill(rawTextToSend, hasHeaderRow);
        setStatusMessage({
          type: 'error',
          text: data.error || "Couldn't auto-detect structure — please map columns manually.",
        });
      }
    } catch (err: any) {
      console.error('AI Auto-Organize error:', err);
      setParseMode('manual');
      setAiSuccess(false);
      analyzeColumnsAndPrefill(rawTextToSend, hasHeaderRow);
      setStatusMessage({
        type: 'error',
        text: "Couldn't auto-detect structure — please map columns manually.",
      });
    } finally {
      setIsAiParsing(false);
    }
  };

  // Update parser when subjectName changes in manual mode
  useEffect(() => {
    if (parseMode === 'manual' && mappingConfirmed && pastedText.trim()) {
      runParserWithMapping(pastedText, subjectName, getCurrentMapping());
    }
  }, [subjectName, mappingConfirmed, parseMode]);

  const isValidMapping = columnRoles.includes('chapter') || columnRoles.includes('topic') || columnRoles.includes('subtopic');

  const handleConfirmMapping = () => {
    if (!isValidMapping) return;
    setMappingConfirmed(true);
    runParserWithMapping(pastedText, subjectName, getCurrentMapping());
  };

  const handleRoleChange = (index: number, newRole: ColumnRole) => {
    const updated = [...columnRoles];
    updated[index] = newRole;
    setColumnRoles(updated);

    if (mappingConfirmed) {
      const mapping: CsvColumnMapping = {
        subjectIdx: updated.indexOf('subject') >= 0 ? updated.indexOf('subject') : null,
        chapterIdx: updated.indexOf('chapter') >= 0 ? updated.indexOf('chapter') : null,
        topicIdx: updated.indexOf('topic') >= 0 ? updated.indexOf('topic') : null,
        subtopicIdx: updated.indexOf('subtopic') >= 0 ? updated.indexOf('subtopic') : null,
        stageIdx: updated.indexOf('stage') >= 0 ? updated.indexOf('stage') : null,
        weightageIdx: updated.indexOf('weightage') >= 0 ? updated.indexOf('weightage') : null,
        tagsIdx: updated.indexOf('tags') >= 0 ? updated.indexOf('tags') : null,
        hasHeaderRow,
      };
      runParserWithMapping(pastedText, subjectName, mapping);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        if (!subjectName) {
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setSubjectName(fileNameWithoutExt);
        }

        if (parseMode === 'ai') {
          handleAiAutoOrganize(content);
        } else {
          analyzeColumnsAndPrefill(content, hasHeaderRow);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleInsertSampleSheets = () => {
    const sampleLink = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
    setPastedText(sampleLink);
    setSubjectName('UPSC General Studies');
    setParseMode('ai');
    handleAiAutoOrganize(sampleLink);
  };

  const handleInsertSampleRawText = () => {
    const sampleRaw = `Indian Polity & Governance:
- Preamble & Constitutional Foundations (Articles 1-4) [Prelims, High Weightage]
- Fundamental Rights & Duties (Article 14-35) [Prelims & Mains, High Weightage]
- Directive Principles of State Policy (DPSP) [Mains, Medium Weightage]
- President, Vice President & Prime Minister Powers [Prelims, High Weightage]
- Parliament, Lok Sabha, Rajya Sabha & Legislative Procedures [Mains, High Weightage]
- Supreme Court & High Courts Jurisdictions [Prelims & Mains, Medium Weightage]`;
    setPastedText(sampleRaw);
    setSubjectName('Indian Polity');
    setParseMode('ai');
    handleAiAutoOrganize(sampleRaw);
  };

  const handleInsertSampleCsv = () => {
    const sampleCsv = `Subject,Chapter,Topic,Subtopic,Stage,Weightage
Indian Polity,Constitutional Framework,Preamble,Key Words,Prelims,High
Indian Polity,Constitutional Framework,Fundamental Rights,Article 14-18,Prelims & Mains,High
Indian Polity,Executive,President,Electoral College,Prelims,Medium
Indian Polity,Judiciary,Supreme Court,Writs Jurisdiction,Both,High`;
    setPastedText(sampleCsv);
    setSubjectName('Indian Polity');
    setParseMode('manual');
    setAiSuccess(false);
    analyzeColumnsAndPrefill(sampleCsv, true);
  };

  const handleSaveSyllabus = async () => {
    if (parsedPreview.length === 0) {
      setStatusMessage({ type: 'error', text: 'No syllabus rows detected. Please upload a CSV file or paste syllabus text.' });
      return;
    }

    const distinctSavedSubjects = Array.from(
      new Set(parsedPreview.map((n) => n.subject).filter(Boolean))
    );
    const fallbackSubject = subjectName.trim() || distinctSavedSubjects[0] || 'Custom Subject';

    if (!subjectName.trim() && distinctSavedSubjects.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a subject name (e.g., "Indian Polity", "Physics").' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await savePersonalSubjectSyllabus(userId, exam, fallbackSubject, parsedPreview);

      if (distinctSavedSubjects.length > 1) {
        setStatusMessage({
          type: 'success',
          text: `Saved ${parsedPreview.length} topics across ${distinctSavedSubjects.length} subjects (${distinctSavedSubjects.join(', ')}) successfully!`,
        });
      } else {
        const singleSubject = distinctSavedSubjects[0] || fallbackSubject;
        setStatusMessage({ type: 'success', text: `Saved syllabus for "${singleSubject}" successfully!` });
      }
      
      // Reset form
      setSubjectName('');
      setPastedText('');
      setParsedPreview([]);
      setSkippedCount(0);
      setOtherSubjectsFound([]);
      setMappingConfirmed(false);
      setColumnRoles([]);
      setRawHeaders([]);
      setSampleRowValues([]);
      setAiSuccess(false);
      
      await loadPersonalData();
      if (onSyllabusUpdated) onSyllabusUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save syllabus.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (subj: string) => {
    if (!confirm(`Are you sure you want to delete all custom syllabus topics for "${subj}"?`)) return;

    try {
      await removePersonalSubject(userId, exam, subj);
      setStatusMessage({ type: 'success', text: `Deleted syllabus for "${subj}".` });
      await loadPersonalData();
      if (onSyllabusUpdated) onSyllabusUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to delete subject.' });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  My Syllabus Builder
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {exam}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Import from Google Sheets, CSV, or plain text with AI Auto-Organize & Manual Column Mapping.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
            <button
              onClick={() => {
                setActiveTab('upload');
                setStatusMessage(null);
              }}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add / Upload Subject
            </button>

            <button
              onClick={() => {
                setActiveTab('manage');
                setStatusMessage(null);
              }}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'manage'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4" />
              Manage Uploaded ({existingSubjects.length})
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Status Alert Banner */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span className="leading-relaxed">{statusMessage.text}</span>
              </div>
            )}

            {activeTab === 'upload' ? (
              <div className="space-y-4">
                {/* Mode Selector Toggle */}
                <div className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setParseMode('ai');
                      setStatusMessage(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      parseMode === 'ai'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>✨ Auto-organize with AI (Default)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setParseMode('manual');
                      analyzeColumnsAndPrefill(pastedText, hasHeaderRow);
                      setStatusMessage(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      parseMode === 'manual'
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>🛠️ Manual column mapping</span>
                  </button>
                </div>

                {/* AI MODE SECTION */}
                {parseMode === 'ai' && (
                  <div className="space-y-4">
                    {/* Subject Name Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Subject Name <span className="text-slate-500 font-normal">(Optional - AI auto-detects if blank)</span>
                      </label>
                      <input
                        type="text"
                        placeholder='e.g., "Indian Polity", "Economics", "General Science"'
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Unified Textarea for Google Sheets URL, CSV, or plain text */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Link className="w-3.5 h-3.5 text-purple-400" />
                          Paste anything — a Google Sheet link, CSV, or plain list
                        </label>
                      </div>
                      <textarea
                        rows={5}
                        placeholder={`Paste a Google Sheet link:\nhttps://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing\n\nOR paste CSV data or unformatted plain list...`}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-purple-500 resize-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-purple-400 shrink-0" />
                        Google Sheet must be shared as <strong className="text-slate-300 font-semibold">"Anyone with the link can view"</strong>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleInsertSampleSheets}
                          className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-purple-300 rounded-lg border border-purple-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          Test Google Sheets Link
                        </button>
                        <button
                          type="button"
                          onClick={handleInsertSampleRawText}
                          className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          Test Plain List
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isAiParsing || !pastedText.trim()}
                        onClick={() => handleAiAutoOrganize()}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        {isAiParsing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                            Reading your syllabus with AI...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 text-amber-300" />
                            ✨ Auto-organize with AI
                          </>
                        )}
                      </button>
                    </div>

                    {/* AI Structured Preview Table */}
                    {aiSuccess && parsedPreview.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ✨ AI Structured
                            </span>
                            Preview ({parsedPreview.length} items)
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setParseMode('manual');
                              analyzeColumnsAndPrefill(pastedText, hasHeaderRow);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 underline font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Sliders className="w-3 h-3" />
                            Switch to Manual Column Mapping
                          </button>
                        </div>

                        <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/50">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                              <tr>
                                <th className="px-3 py-2">Subject</th>
                                <th className="px-3 py-2">Chapter</th>
                                <th className="px-3 py-2">Topic</th>
                                <th className="px-3 py-2">Subtopic</th>
                                <th className="px-3 py-2">Stage</th>
                                <th className="px-3 py-2">Weightage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                              {parsedPreview.map((node, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="px-3 py-2 font-semibold text-purple-300 truncate max-w-[100px]">
                                    {node.subject}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-slate-200 truncate max-w-[120px]">
                                    {node.chapter}
                                  </td>
                                  <td className="px-3 py-2 text-slate-300 truncate max-w-[120px]">
                                    {node.topic}
                                  </td>
                                  <td className="px-3 py-2 text-slate-400 truncate max-w-[150px]">
                                    {node.subtopic}
                                  </td>
                                  <td className="px-3 py-2 text-slate-400">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                                      {node.stage || 'Prelims'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      node.weightage === 'High'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : node.weightage === 'Medium'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {node.weightage || 'Medium'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MANUAL COLUMN MAPPING MODE SECTION */}
                {parseMode === 'manual' && (
                  <div className="space-y-4">
                    {/* Subject Name Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Subject Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder='e.g., "Indian Polity", "General Science", "Physics"'
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Upload or Sample Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-200">
                          <Upload className="w-4 h-4 text-purple-400" />
                          Upload CSV / Text File
                        </div>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer"
                        />
                      </div>

                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-200 mb-0.5">Need sample CSV?</div>
                          <div className="text-xs text-slate-400">Insert sample structured CSV rows.</div>
                        </div>
                        <button
                          type="button"
                          onClick={handleInsertSampleCsv}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Insert Sample CSV
                        </button>
                      </div>
                    </div>

                    {/* Textarea for CSV Content */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Paste CSV / Tabular Text Content
                        </label>
                      </div>
                      <textarea
                        rows={4}
                        placeholder={`Subject,Chapter,Topic,Subtopic,Stage,Weightage\nIndian Polity,Fundamental Rights,Articles,Right to Equality,Prelims,High`}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>

                    {/* Column Mapping Step */}
                    {pastedText.trim().length > 0 && columnRoles.length > 0 && (
                      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-purple-400" />
                              Map Your Columns
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Step 1 of 2
                              </span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Assign each column to its corresponding syllabus field:
                            </p>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
                            <input
                              type="checkbox"
                              checked={hasHeaderRow}
                              onChange={(e) => setHasHeaderRow(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500"
                            />
                            <span>First row contains headers</span>
                          </label>
                        </div>

                        {/* Column dropdown mapping cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                          {columnRoles.map((role, idx) => {
                            const headerName = rawHeaders[idx] || `Column ${idx + 1}`;
                            const sampleVal = sampleRowValues[idx] || '';

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border transition-all ${
                                  role === 'ignore'
                                    ? 'bg-slate-900/40 border-slate-800/80'
                                    : 'bg-slate-900 border-purple-500/30 shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                                    {headerName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Col {idx + 1}
                                  </span>
                                </div>

                                {sampleVal && (
                                  <div className="text-[11px] text-slate-400 truncate font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800/60 mb-2">
                                    <span className="text-slate-500">Sample:</span> "{sampleVal}"
                                  </div>
                                )}

                                <select
                                  value={role}
                                  onChange={(e) => handleRoleChange(idx, e.target.value as ColumnRole)}
                                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
                                >
                                  <option value="ignore">❌ Ignore this column</option>
                                  <option value="subject">📚 Subject Name</option>
                                  <option value="chapter">📖 Chapter / Module</option>
                                  <option value="topic">📌 Topic</option>
                                  <option value="subtopic">📄 Subtopic / Detail</option>
                                  <option value="stage">🎯 Stage (Prelims/Mains)</option>
                                  <option value="weightage">⚖️ Weightage (High/Med/Low)</option>
                                  <option value="tags">🏷️ Tags</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>

                        {/* Validation & Continue Button */}
                        {!isValidMapping && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>Please map at least one column to Chapter, Topic, or Subtopic to continue.</span>
                          </div>
                        )}

                        {!mappingConfirmed ? (
                          <button
                            type="button"
                            disabled={!isValidMapping}
                            onClick={handleConfirmMapping}
                            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Confirm Mapping & Preview Table
                          </button>
                        ) : (
                          <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg text-emerald-300">
                            <span className="flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Column mapping confirmed
                            </span>
                            <button
                              type="button"
                              onClick={() => setMappingConfirmed(false)}
                              className="text-purple-400 hover:underline font-semibold text-xs cursor-pointer"
                            >
                              Re-adjust mapping
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Preview Table */}
                    {mappingConfirmed && parsedPreview.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Preview ({parsedPreview.length} items parsed)
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/50">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-900/80 text-slate-400 sticky top-0 border-b border-slate-800">
                              <tr>
                                <th className="px-3 py-2 font-medium">Subject</th>
                                <th className="px-3 py-2 font-medium">Chapter</th>
                                <th className="px-3 py-2 font-medium">Subtopic / Topic</th>
                                <th className="px-3 py-2 font-medium">Stage</th>
                                <th className="px-3 py-2 font-medium">Weightage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {parsedPreview.slice(0, 15).map((node, i) => (
                                <tr key={i} className="hover:bg-slate-900/40">
                                  <td className="px-3 py-1.5 text-purple-300 font-medium">{node.subject}</td>
                                  <td className="px-3 py-1.5 text-slate-200 font-medium">{node.chapter}</td>
                                  <td className="px-3 py-1.5 text-slate-300">{node.subtopic || node.topic}</td>
                                  <td className="px-3 py-1.5 text-slate-400">{node.stage || 'Prelims'}</td>
                                  <td className="px-3 py-1.5 text-slate-400">{node.weightage || 'Medium'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {parsedPreview.length > 15 && (
                            <div className="p-2 text-center text-xs text-slate-500 border-t border-slate-800">
                              + {parsedPreview.length - 15} more rows
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info notice for multiple subjects detected in file */}
                {otherSubjectsFound.length > 1 && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      ✅ Imported {parsedPreview.length} topics across {otherSubjectsFound.length} subjects: {otherSubjectsFound.join(', ')}.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Manage Existing Personal Subjects */
              <div className="space-y-3">
                {existingSubjects.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm font-medium">No custom syllabus subjects uploaded yet for {exam}.</p>
                    <p className="text-xs">Switch to the "Add / Upload Subject" tab to upload your first custom syllabus.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    {existingSubjects.map((subj) => {
                      const subjNodes = userNodes.filter((n) => n.subject === subj);
                      return (
                        <div key={subj} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                          <div>
                            <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                              {subj}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                                {subjNodes.length} topics
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Replaces official {subj} topics in {exam} syllabus tracker.
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSubject(subj)}
                            className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Subject
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Saved locally & synced to cloud
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              {activeTab === 'upload' && (
                <button
                  type="button"
                  disabled={
                    isSaving || 
                    parsedPreview.length === 0 || 
                    (parseMode === 'manual' && !mappingConfirmed)
                  }
                  onClick={handleSaveSyllabus}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save My Syllabus
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
