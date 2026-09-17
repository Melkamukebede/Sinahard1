import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CloudDownload,
  Check,
  Search,
  BookOpen,
  Clock,
  HelpCircle,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GraduationCap,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { Exam, AppUser } from '../types';
import { CURATED_EXAMS_CATALOG } from '../data/curatedCatalog';
import { MathRenderer } from './MathRenderer';
import { useAuth } from '../context/AuthContext';

interface CuratedExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadExam: (catalogExam: Exam) => Promise<void>;
  downloadedCatalogIds: string[];
  user: AppUser | null;
  onOpenSubscriptionModal?: () => void;
  officialExams?: Exam[];
}

export const CuratedExamsModal: React.FC<CuratedExamsModalProps> = ({
  isOpen,
  onClose,
  onDownloadExam,
  downloadedCatalogIds,
  user,
  officialExams,
}) => {
  const { updateStudentGrade } = useAuth();
  
  // Student's active registered grade from profile or local storage (default 12)
  const studentGrade = user?.grade ? String(user.grade) : (localStorage.getItem('student_selected_grade') || '12');
  
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>(studentGrade);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  // Active catalog sources (Live Firestore official exams merged with baseline catalog)
  const catalogExams = useMemo(() => {
    return officialExams && officialExams.length > 0 ? officialExams : CURATED_EXAMS_CATALOG;
  }, [officialExams]);

  // Dynamic filter lists
  const availableGrades = ['All', '12', '11', '10', '9'];

  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    catalogExams.forEach((e) => {
      if (e.subject) subjects.add(e.subject);
    });
    return ['All', ...Array.from(subjects).sort()];
  }, [catalogExams]);

  // Filter curated exams
  const filteredExams = useMemo(() => {
    return catalogExams.filter((exam) => {
      // Grade matching:
      if (selectedGradeFilter !== 'All') {
        const examGradeStr = String(exam.grade || '');
        if (examGradeStr !== selectedGradeFilter) return false;
      }

      // Subject matching:
      if (selectedSubjectFilter !== 'All' && exam.subject !== selectedSubjectFilter) {
        return false;
      }

      // Search query matching:
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exam.title?.toLowerCase().includes(q) || exam.name.toLowerCase().includes(q);
        const matchesSubject = exam.subject.toLowerCase().includes(q);
        const matchesUnit = exam.unit?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesSubject && !matchesUnit) return false;
      }

      return true;
    });
  }, [catalogExams, selectedGradeFilter, selectedSubjectFilter, searchQuery]);

  // Handle grade change and persist to student profile
  const handleGradeFilterClick = (grade: string) => {
    setSelectedGradeFilter(grade);
    if (grade !== 'All') {
      updateStudentGrade(grade);
    }
  };

  const handleDownloadClick = async (exam: Exam) => {
    setDownloadingIds((prev) => ({ ...prev, [exam.id]: true }));
    try {
      await onDownloadExam(exam);
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [exam.id]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <CloudDownload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  Download Official Exams
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Curated Catalog
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Live Firestore Synced
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Verified high-quality curriculum exams ({catalogExams.length} available) with KaTeX math steps and instant real-time synchronization.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grade Matching & Quick Filters Bar */}
        <div className="px-6 py-3.5 bg-zinc-100/60 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800 space-y-3">
          {/* Grade selection row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              <span>Target Grade:</span>
              <div className="flex items-center gap-1.5">
                {availableGrades.map((g) => {
                  const isActive = selectedGradeFilter === g;
                  const isStudentPrimary = studentGrade === g && g !== 'All';
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGradeFilterClick(g)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500'
                      }`}
                    >
                      {g === 'All' ? 'All Grades' : `Grade ${g}`}
                      {isStudentPrimary && (
                        <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded-full bg-emerald-400 text-zinc-950 font-extrabold">
                          You
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Showing <strong className="text-zinc-800 dark:text-zinc-200">{filteredExams.length}</strong> official exams
            </div>
          </div>

          {/* Search + Subject chips */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search subject or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white placeholder:text-zinc-400"
              />
            </div>

            {/* Subject horizontal pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
              {availableSubjects.map((sub) => {
                const isSelected = selectedSubjectFilter === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(sub)}
                    className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                        : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200/50'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Catalog Exams Scrollable List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No official exams found matching this filter
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Try switching grades or selecting "All Subjects".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGradeFilter('All');
                  setSelectedSubjectFilter('All');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const isDownloaded = downloadedCatalogIds.includes(exam.id);
              const isDownloading = Boolean(downloadingIds[exam.id]);
              const isPreviewing = previewExamId === exam.id;

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 hover:border-emerald-500/40 transition-colors shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {exam.subject}
                        </span>
                        {exam.grade && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Grade {exam.grade}
                          </span>
                        )}
                        {exam.difficulty && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {exam.difficulty}
                          </span>
                        )}
                        {exam.isUploadedToCloud && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Official Cloud
                          </span>
                        )}
                        {exam.adminTag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            {exam.adminTag}
                          </span>
                        )}
                        {exam.rating && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 ml-1">
                            <Star className="w-3 h-3 fill-current" />
                            {exam.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-snug">
                        {exam.title}
                      </h3>

                      {/* Curriculum unit details */}
                      {exam.unit && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{exam.unit}</span>
                        </p>
                      )}

                      {/* Meta stats */}
                      <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                          {exam.questions.length} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {exam.timeLimit} Mins
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-zinc-400" />
                          Pass: {exam.passingScore}%
                        </span>
                      </div>
                    </div>

                    {/* Download & Preview Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                      {isDownloaded ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/25">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>In Your Exams</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={() => handleDownloadClick(exam)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-97 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CloudDownload className="w-4 h-4" />
                              <span>Download Exam</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Preview Sample Question button */}
                      <button
                        type="button"
                        onClick={() => setPreviewExamId(isPreviewing ? null : exam.id)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition"
                      >
                        <span>{isPreviewing ? 'Hide sample' : 'Inspect sample Q'}</span>
                        {isPreviewing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Sample Question Preview Drawer */}
                  <AnimatePresence>
                    {isPreviewing && exam.questions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 overflow-hidden"
                      >
                        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          Sample Question Preview (Q1 of {exam.questions.length})
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
                          <MathRenderer text={exam.questions[0].text} className="font-medium text-zinc-900 dark:text-zinc-100" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                            {exam.questions[0].options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                                  optIdx === exam.questions[0].correct
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                }`}
                              >
                                <MathRenderer text={opt} />
                              </div>
                            ))}
                          </div>
                          {exam.questions[0].explanation && (
                            <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                              <strong>Step-by-step: </strong>
                              <MathRenderer text={exam.questions[0].explanation} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-500">
          <span>Downloaded exams remain available offline in your local repository.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-bold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
