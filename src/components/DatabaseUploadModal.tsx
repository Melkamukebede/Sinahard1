import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Layers,
  Sparkles,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { Exam, AppUser } from '../types';
import {
  uploadExamToFirestore,
  canUserUploadToFirestore,
} from '../services/databaseUpload';
import { ADMIN_EMAIL } from '../services/db';

interface DatabaseUploadModalProps {
  exam: Exam | null;
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (exam: Exam, engine: 'firestore') => void;
}

export const DatabaseUploadModal: React.FC<DatabaseUploadModalProps> = ({
  exam,
  user,
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [uploadIndividualQuestions, setUploadIndividualQuestions] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [asOfficialExam, setAsOfficialExam] = useState<boolean>(true);
  const [selectedGrade, setSelectedGrade] = useState<string>(
    exam?.grade ? String(exam.grade) : '12'
  );
  const [unitName, setUnitName] = useState<string>(exam?.unit || '');
  const [adminTag, setAdminTag] = useState<string>('Official Curriculum Exam');

  // Status & loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [progressStatusText, setProgressStatusText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !exam) return null;

  const isAdmin = canUserUploadToFirestore(user);
  const userEmail = user?.email || 'Not logged in';

  const handleUploadToFirestore = async () => {
    if (!isAdmin) {
      setErrorMessage(`Access Denied: You must be logged in as ${ADMIN_EMAIL} to upload to Firestore.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setUploadProgress(10);
    setProgressStatusText('Connecting to Cloud Firestore...');

    try {
      const result = await uploadExamToFirestore(exam, user, {
        uploadIndividualQuestions,
        isPublic,
        asOfficialExam,
        grade: selectedGrade,
        unit: unitName.trim() || exam.unit,
        adminTag: adminTag.trim() || 'Official Curriculum Exam',
        onProgress: (percent, text) => {
          setUploadProgress(percent);
          setProgressStatusText(text);
        },
      });

      setStatusMessage(result.message);
      if (onUploadComplete) {
        onUploadComplete(
          {
            ...exam,
            isUploadedToCloud: true,
            cloudStorageEngine: 'firestore',
            cloudUploadedAt: new Date().toISOString(),
            grade: selectedGrade,
            unit: unitName.trim() || exam.unit,
            sourceType: asOfficialExam ? 'curated_catalog' : exam.sourceType,
          },
          'firestore'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-white dark:bg-[#0b1320] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 font-['DM_Sans',sans-serif]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white font-['Syne',sans-serif]">
                    Upload to Cloud Firestore
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Firebase Native Document Storage & Question Bank
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Non-Admin Guard */}
            {!isAdmin ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Lock className="w-4 h-4 text-rose-500" />
                  <span>Admin Privileges Required</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                  Only the verified administrator (<span className="font-mono font-bold">{ADMIN_EMAIL}</span>) can upload questions to Cloud Firestore.
                </p>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                  Current user: <span className="font-semibold">{userEmail}</span>
                </div>
              </div>
            ) : null}

            {/* Exam Summary Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Selected Exam
                  </span>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                    {exam.name}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {exam.subject}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-400 text-[10px] block">Questions</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {exam.questions.length} items
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block">Time & Score</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {exam.timeLimit}m • Pass {exam.passingScore}%
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block">Current Status</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {exam.isUploadedToCloud ? 'Already Synced' : 'Local Only'}
                  </span>
                </div>
              </div>
            </div>

            {/* Firestore Destination Info */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Cloud className="w-4 h-4 text-amber-500" />
                <span>Target Firestore Collections</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                This uploads the complete exam structure into <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">/exams/{exam.id}</span> and batch-commits all {exam.questions.length} individual questions into <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">/questions</span> with security rules enforcement.
              </p>
            </div>

            {/* Upload Options */}
            {isAdmin && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Upload & Official Sync Configurations
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    ⚡ Instant Sync Enabled
                  </span>
                </div>

                {/* Instant Official Exams Catalog Sync */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 cursor-pointer hover:border-emerald-500/50 transition">
                  <input
                    type="checkbox"
                    checked={asOfficialExam}
                    onChange={(e) => setAsOfficialExam(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white block flex items-center gap-1.5">
                      Publish to Official Exams Catalog
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-black">LIVE</span>
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Instantly syncs this exam and all questions into the Download Official Exams directory so students can access and download it immediately.
                    </span>
                  </div>
                </label>

                {/* Grade and Unit specification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Academic Grade
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                    >
                      <option value="12">Grade 12 (National Exam)</option>
                      <option value="11">Grade 11</option>
                      <option value="10">Grade 10</option>
                      <option value="9">Grade 9</option>
                      <option value="All">All Grades / General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Curriculum Unit / Chapter
                    </label>
                    <input
                      type="text"
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="e.g. Unit 3: Differential Calculus"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                    >
                    </input>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-amber-500/40 transition">
                  <input
                    type="checkbox"
                    checked={uploadIndividualQuestions}
                    onChange={(e) => setUploadIndividualQuestions(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white block">
                      Sync to Global Question Bank (/questions)
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Optimized parallel batch commits for modular question queries and individual practice.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-amber-500/40 transition">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white block">
                      Make Publicly Available to All Students
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Students can immediately see, download, and practice this exam from the cloud repository.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Curriculum / Verification Tag
                  </label>
                  <input
                    type="text"
                    value={adminTag}
                    onChange={(e) => setAdminTag(e.target.value)}
                    placeholder="e.g. Grade 12 National Exam 2026, MoE Official"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isLoading && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    {progressStatusText || 'Uploading to Firestore...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {statusMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{statusMessage}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-1">
                    Exam ID: <span className="font-mono">{exam.id}</span> • Collection: <span className="font-mono">/exams</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              {statusMessage ? 'Done' : 'Cancel'}
            </button>

            {isAdmin && (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleUploadToFirestore}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Upload to Cloud Firestore</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
