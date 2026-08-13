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
  RefreshCw
} from 'lucide-react';
import { 
  PersonalSyllabusNode, 
  getPersonalSyllabusNodes, 
  savePersonalSubjectSyllabus, 
  removePersonalSubject, 
  parseCsvSyllabus 
} from '../lib/personalSyllabus';

interface MySyllabusUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: string;
  userId?: string;
  onSyllabusUpdated?: () => void;
}

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

  // Handle parsing when pastedText or subjectName changes
  useEffect(() => {
    if (pastedText.trim()) {
      const { nodes, skippedOtherSubjectRows, otherSubjectsFound } = parseCsvSyllabus(
        pastedText,
        exam,
        subjectName.trim() || 'Custom Subject'
      );
      setParsedPreview(nodes);
      setSkippedCount(skippedOtherSubjectRows);
      setOtherSubjectsFound(otherSubjectsFound);
    } else {
      setParsedPreview([]);
      setSkippedCount(0);
      setOtherSubjectsFound([]);
    }
  }, [pastedText, subjectName, exam]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        if (!subjectName) {
          // Infer subject name from file name
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setSubjectName(fileNameWithoutExt);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSyllabus = async () => {
    if (!subjectName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a subject name (e.g., "Indian Polity", "Physics").' });
      return;
    }

    if (parsedPreview.length === 0) {
      setStatusMessage({ type: 'error', text: 'No syllabus rows detected. Please upload a CSV file or paste syllabus text.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await savePersonalSubjectSyllabus(userId, exam, subjectName.trim(), parsedPreview);
      setStatusMessage({ type: 'success', text: `Saved syllabus for "${subjectName.trim()}" successfully!` });
      
      // Reset form
      setSubjectName('');
      setPastedText('');
      setParsedPreview([]);
      setSkippedCount(0);
      setOtherSubjectsFound([]);
      
      await loadPersonalData();
      if (onSyllabusUpdated) onSyllabusUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save syllabus.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (subjectToDelete: string) => {
    if (!confirm(`Are you sure you want to delete your custom syllabus for "${subjectToDelete}"?`)) return;

    try {
      await removePersonalSubject(userId, exam, subjectToDelete);
      setStatusMessage({ type: 'success', text: `Removed "${subjectToDelete}" syllabus.` });
      await loadPersonalData();
      if (onSyllabusUpdated) onSyllabusUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to delete subject.' });
    }
  };

  const handleInsertSample = () => {
    setSubjectName('Indian Polity');
    setPastedText(
      `Chapter,Topic,Subtopic,Stage,Weightage\n` +
      `Preamble & Constitution,Salient Features,Preamble Values,Prelims,High\n` +
      `Preamble & Constitution,Amendments,Basic Structure Doctrine,Prelims,High\n` +
      `Fundamental Rights,Article 14-18,Right to Equality,Prelims,High\n` +
      `Fundamental Rights,Article 19-22,Right to Freedom,Prelims,High\n` +
      `Directive Principles,DPSP Classification,Socialistic & Gandhian Principles,Mains,Medium`
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  My Custom Syllabus
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                    {exam}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Upload or paste your own subject syllabus. Overrides global default subject rows for you.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add / Upload Subject
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manage'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4" />
              My Custom Subjects ({existingSubjects.length})
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl border text-sm flex items-start gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {activeTab === 'upload' ? (
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
                  <p className="text-[11px] text-slate-400 mt-1">
                    If this subject matches a global subject name (e.g. "Polity"), your custom syllabus will replace it for your account.
                  </p>
                </div>

                {/* Upload or Paste Choice */}
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
                      <div className="text-sm font-medium text-slate-200 mb-0.5">Need a sample format?</div>
                      <div className="text-xs text-slate-400">Insert sample CSV data to test.</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleInsertSample}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Insert Sample
                    </button>
                  </div>
                </div>

                {/* Textarea for CSV / Text Content */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Paste Syllabus Text / CSV Content
                    </label>

                  </div>
                  <textarea
                    rows={6}
                    placeholder={`Chapter,Topic,Subtopic,Stage,Weightage\nFundamental Rights,Articles,Right to Equality,Prelims,High\nDirective Principles,Articles,DPSP Classification,Mains,Medium`}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Parsed Preview Table */}
                {parsedPreview.length > 0 && (
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
                            <th className="px-3 py-2 font-medium">Chapter</th>
                            <th className="px-3 py-2 font-medium">Subtopic / Topic</th>
                            <th className="px-3 py-2 font-medium">Stage</th>
                            <th className="px-3 py-2 font-medium">Weightage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {parsedPreview.slice(0, 15).map((node, i) => (
                            <tr key={i} className="hover:bg-slate-900/40">
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

                {/* Warning notice for skipped rows from other subjects */}
                {skippedCount > 0 && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      ⚠️ {skippedCount} row{skippedCount > 1 ? 's' : ''} skipped — {skippedCount === 1 ? 'it belongs' : 'they belong'} to other subjects in this file ({otherSubjectsFound.join(', ')}). Change "Subject Name" above to import those separately.
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
                            className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5"
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
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Close
              </button>
              {activeTab === 'upload' && (
                <button
                  type="button"
                  disabled={isSaving || parsedPreview.length === 0}
                  onClick={handleSaveSyllabus}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
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
