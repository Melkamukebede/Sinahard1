import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CloudDownload,
  Search,
  BookOpen,
  Clock,
  HelpCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  Edit3,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
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
  const { updateStudentGrade, openRegistrationModal } = useAuth();
  
  // Student's active registered grade from profile or local storage (default 12)
  const registeredGrade = user?.grade ? String(user.grade) : (localStorage.getItem('student_selected_grade') || '12');
  const registeredStream = user?.stream || (localStorage.getItem('student_selected_stream') as any) || 'Natural Science';
  const isRegistered = Boolean(user?.isRegistered || localStorage.getItem('student_is_registered') === 'true');

  // "only display exams based on grades registered by user"
  const [onlyShowRegisteredGrade, setOnlyShowRegisteredGrade] = useState<boolean>(true);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>(registeredGrade);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  // Sync selectedGradeFilter when user's registered grade changes
  useEffect(() => {
    setSelectedGradeFilter(registeredGrade);
  }, [registeredGrade]);

  // Active catalog sources (Live Firestore official exams merged with baseline catalog)
  const catalogExams = useMemo(() => {
    return officialExams && officialExams.length > 0 ? officialExams : CURATED_EXAMS_CATALOG;
  }, [officialExams]);

  // Dynamic filter lists
  const availableGrades = ['All', 'Freshman', 'Senior University', '12', '11', '10', '9'];

  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    catalogExams.forEach((e) => {
      if (e.subject) subjects.add(e.subject);
    });
    return ['All', ...Array.from(subjects).sort()];
  }, [catalogExams]);

  // Filter curated exams strictly based on registered grade
  const filteredExams = useMemo(() => {
    return catalogExams.filter((exam) => {
      const examGradeStr = String(exam.grade || '');

      // Strict registered grade filtering as requested
      if (onlyShowRegisteredGrade) {
        if (examGradeStr !== registeredGrade && examGradeStr !== 'All') {
          return false;
        }
      } else if (selectedGradeFilter !== 'All') {
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
        const matchesTopic = exam.topic?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesSubject && !matchesTopic) return false;
      }

      return true;
    });
  }, [catalogExams, onlyShowRegisteredGrade, registeredGrade, selectedGradeFilter, selectedSubjectFilter, searchQuery]);

  // Check if an exam matches student's stream
  const doesExamMatchStream = (subject: string) => {
    const s = subject.toLowerCase();
    if (registeredStream === 'Natural Science') {
      return s.includes('math') || s.includes('physic') || s.includes('chem') || s.includes('biol') || s.includes('english') || s.includes('aptitude') || s.includes('ict');
    }
    if (registeredStream === 'Social Science') {
      return s.includes('econ') || s.includes('geog') || s.includes('histor') || s.includes('math') || s.includes('english') || s.includes('aptitude') || s.includes('civic');
    }
    return true;
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-4xl bg-black text-white border border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-700" />

        {/* Header */}
        <div className="px-6 py-4 sm:py-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-xs border-2 border-black">
              <CloudDownload className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-['Outfit',sans-serif] text-white tracking-tight">
                  Download Official Exams
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-700">
                  {catalogExams.length} Available
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-black border border-black shadow-2xs">
                  <RefreshCw className="w-3 h-3 text-black stroke-[2.5] animate-spin" />
                  <span>Live Cloud Sync</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verified curriculum exams with KaTeX math steps and instant local save.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer border border-black"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-black stroke-[2.5]" />
          </button>
        </div>

        {/* Student Registered Grade Banner & Control */}
        <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shrink-0 border border-black shadow-xs">
              <GraduationCap className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white flex-wrap">
                <span>Active Target:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-black font-bold text-[11px] shadow-xs">
                  {registeredGrade === 'Freshman' ? 'Univ Freshman' : `Grade ${registeredGrade}`}
                </span>
                <span className="text-[11px] font-medium text-zinc-400">
                  • {registeredStream} {user?.region ? `(${user.region})` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Registered grade strict filter toggle */}
            <button
              type="button"
              onClick={() => setOnlyShowRegisteredGrade(!onlyShowRegisteredGrade)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs border ${
                onlyShowRegisteredGrade
                  ? 'bg-white text-black border-black shadow-xs'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span>{onlyShowRegisteredGrade ? `Grade ${registeredGrade} Only` : 'All Grades View'}</span>
            </button>

            {/* Change Grade / Register Button */}
            <button
              type="button"
              onClick={openRegistrationModal}
              className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              </span>
              <span>{isRegistered ? 'Edit Grade' : 'Register'}</span>
            </button>
          </div>
        </div>

        {/* Grade Matching & Quick Filters Bar */}
        <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800 space-y-2.5">
          {/* Grade selection row when not restricted to single grade */}
          {!onlyShowRegisteredGrade && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <span className="p-1 rounded bg-white text-black flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                </span>
                <span>Grade:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableGrades.map((g) => {
                    const isActive = selectedGradeFilter === g;
                    const isStudentPrimary = registeredGrade === g && g !== 'All';
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGradeFilterClick(g)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isActive
                            ? 'bg-white text-black border-black shadow-xs'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-white'
                        }`}
                      >
                        {g === 'All' ? 'All Grades' : g === 'Freshman' ? 'Freshman' : g === 'Senior University' ? 'Univ Senior' : `Grade ${g}`}
                        {isStudentPrimary && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded-full bg-black text-white font-extrabold border border-zinc-600">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 font-medium">
                <strong className="text-white">{filteredExams.length}</strong> official exams
              </div>
            </div>
          )}

          {/* Search + Subject chips */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <span className="p-0.5 rounded bg-white text-black absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              </span>
              <input
                type="text"
                placeholder="Search subject, unit, exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-700 focus:outline-none focus:border-white text-white placeholder:text-zinc-500 font-medium"
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
                    className={`whitespace-nowrap px-2.5 py-1 text-[11px] rounded-lg transition cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-black font-bold border-black shadow-xs'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 font-medium'
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-black">
          {filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto mb-3 border border-black">
                <BookOpen className="w-6 h-6 text-black stroke-[2.5]" />
              </div>
              <p className="text-sm font-bold text-white">
                No exams found for Grade {registeredGrade}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Explore all grades or update your student grade profile.
              </p>
              <div className="mt-3.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyShowRegisteredGrade(false)}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer border border-zinc-700"
                >
                  All Grades
                </button>
                <button
                  type="button"
                  onClick={openRegistrationModal}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-white text-black hover:bg-zinc-100 cursor-pointer shadow-xs border border-black"
                >
                  Change Grade
                </button>
              </div>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const isDownloaded = downloadedCatalogIds.includes(exam.id);
              const isDownloading = Boolean(downloadingIds[exam.id]);
              const isPreviewing = previewExamId === exam.id;
              const matchesStream = doesExamMatchStream(exam.subject);

              return (
                <div
                  key={exam.id}
                  className="rounded-[22px] border border-zinc-800 bg-zinc-950 p-4 sm:p-5 hover:border-zinc-600 transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-black border border-black">
                          {exam.subject}
                        </span>
                        {exam.grade && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-700">
                            {exam.grade === 'Senior University' ? 'Univ Senior' : exam.grade === 'Freshman' ? 'Freshman' : `Grade ${exam.grade}`}
                          </span>
                        )}
                        {matchesStream && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-700">
                            {registeredStream}
                          </span>
                        )}
                        {exam.difficulty && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-700">
                            {exam.difficulty}
                          </span>
                        )}
                        {exam.isUploadedToCloud && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-black border border-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                            Official Cloud
                          </span>
                        )}
                        {exam.adminTag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-700">
                            {exam.adminTag}
                          </span>
                        )}
                        {exam.rating && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-white ml-1">
                            <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                              <Star className="w-2.5 h-2.5 text-black stroke-[2.5] fill-black" />
                            </span>
                            {exam.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                        {exam.title}
                      </h3>

                      {/* Topic */}
                      {(exam.topic || (exam.metadata && (exam.metadata as any).topic)) && (
                        <p className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                          <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                            <Layers className="w-3 h-3 text-black stroke-[2.5] shrink-0" />
                          </span>
                          <span>{exam.topic || (exam.metadata && (exam.metadata as any).topic)}</span>
                        </p>
                      )}

                      {/* Meta stats */}
                      <div className="flex items-center gap-4 text-xs text-zinc-400 pt-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                            <HelpCircle className="w-3 h-3 text-black stroke-[2.5]" />
                          </span>
                          {exam.questions.length} Questions
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                            <Clock className="w-3 h-3 text-black stroke-[2.5]" />
                          </span>
                          {exam.timeLimit} Mins
                        </span>
                        {exam.stream && (
                          <span className="flex items-center gap-1.5">
                            <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                              <Layers className="w-3 h-3 text-black stroke-[2.5]" />
                            </span>
                            {exam.stream}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Download & Preview Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800 shrink-0">
                      {isDownloaded ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-bold border border-zinc-700 shadow-2xs">
                          <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                          </span>
                          <span>In Your Exams</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={() => handleDownloadClick(exam)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-100 text-xs font-extrabold shadow-[0_3px_0_#000000] border-2 border-black transition cursor-pointer active:scale-98 disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-4 h-4 text-black animate-spin stroke-[2.5]" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CloudDownload className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                              <span>Download Exam</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Preview Sample Question button */}
                      <button
                        type="button"
                        onClick={() => setPreviewExamId(isPreviewing ? null : exam.id)}
                        className="text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                      >
                        <span>{isPreviewing ? 'Hide Sample' : 'Sample Q'}</span>
                        <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                          {isPreviewing ? <ChevronUp className="w-3 h-3 text-black stroke-[2.5]" /> : <ChevronDown className="w-3 h-3 text-black stroke-[2.5]" />}
                        </span>
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
                        className="mt-3 pt-3 border-t border-zinc-800 space-y-2 overflow-hidden"
                      >
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-black stroke-[2.5]" />
                          </span>
                          Sample Preview (Q1 of {exam.questions.length})
                        </div>
                        <div className="p-3 rounded-xl bg-black border border-zinc-800 text-xs">
                          <MathRenderer text={exam.questions[0].text} className="font-semibold text-white" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                            {exam.questions[0].options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium ${
                                  optIdx === exam.questions[0].correct
                                    ? 'bg-white text-black border-black font-bold'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                                }`}
                              >
                                <MathRenderer text={opt} />
                              </div>
                            ))}
                          </div>
                          {exam.questions[0].explanation && (
                            <div className="mt-2 text-[11px] text-zinc-400 italic">
                              <strong className="text-white">Step-by-step: </strong>
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
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-black flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium">Offline ready. Saved exams sync to your local repository.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-100 font-bold transition cursor-pointer border border-black shadow-[0_2px_0_#000000]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

