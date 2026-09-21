import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  Play,
  Edit,
  Trash2,
  Clock,
  HelpCircle,
  ArrowUpDown,
  RotateCcw,
  FileDown,
  CheckCircle,
  Layers,
  CloudDownload,
  CloudUpload,
  GraduationCap,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Tag,
  Share2,
  Filter,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Exam, AppUser } from '../types';
import { ShareExamModal } from './ShareExamModal';

interface FilesViewProps {
  exams: Exam[];
  onStartPractice: (exam: Exam) => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onCreateNew?: () => void;
  onOpenCuratedCatalogModal?: () => void;
  onOpenDatabaseUpload?: (exam: Exam) => void;
  isAdmin?: boolean;
  user?: AppUser | null;
}

type SortOption = 'newest' | 'questions' | 'duration' | 'name';
type SourceFilter = 'all' | 'user_created' | 'downloaded';

export const FilesView: React.FC<FilesViewProps> = ({
  exams,
  onStartPractice,
  onEditExam,
  onDeleteExam,
  onOpenCuratedCatalogModal,
  onOpenDatabaseUpload,
  isAdmin = false,
  user,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [examToShare, setExamToShare] = useState<Exam | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);

  // Track which exams are expanded to show details
  const [expandedExamIds, setExpandedExamIds] = useState<Record<string, boolean>>({});

  const toggleExpandExam = (examId: string) => {
    setExpandedExamIds((prev) => {
      const isCurrentlyOpen = Boolean(prev[examId]);
      // When expanding one subject, close others so other cards on left/right aren't expanded with it
      return isCurrentlyOpen ? {} : { [examId]: true };
    });
  };

  // Helper to extract clean grade label from an exam
  const getExamGrade = (exam: Exam): string => {
    if (exam.grade !== undefined && exam.grade !== null && String(exam.grade).trim() !== '') {
      const g = String(exam.grade).trim();
      return g.toLowerCase().startsWith('grade') ? g : `Grade ${g}`;
    }
    const match = exam.name.match(/grade\s*(\d{1,2})/i) || exam.name.match(/g(\d{1,2})/i);
    if (match) return `Grade ${match[1]}`;
    if (/freshman|university|college/i.test(exam.name)) return 'Freshman';
    return 'General';
  };

  // Helper to extract primary topic or unit
  const getExamTopic = (exam: Exam): string => {
    if (exam.unit && exam.unit.trim()) return exam.unit.trim();
    if (exam.description && exam.description.trim()) return exam.description.trim();
    return 'Core Curriculum';
  };

  // Counts by source
  const userCreatedCount = useMemo(
    () => exams.filter((e) => !(e.isDownloaded || e.sourceType === 'curated_catalog')).length,
    [exams]
  );
  const downloadedCount = useMemo(
    () => exams.filter((e) => e.isDownloaded || e.sourceType === 'curated_catalog').length,
    [exams]
  );

  // Dynamically extract grades and counts
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    exams.forEach((e) => {
      const g = getExamGrade(e);
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [exams]);

  const dynamicGrades = useMemo(() => {
    const keys = Object.keys(gradeCounts).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a.localeCompare(b);
    });
    return ['All', ...keys];
  }, [gradeCounts]);

  // Dynamically extract subjects and counts
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    exams.forEach((e) => {
      const subj = e.subject?.trim() || 'General';
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return counts;
  }, [exams]);

  const dynamicSubjects = useMemo(() => {
    return ['All', ...Object.keys(subjectCounts).sort()];
  }, [subjectCounts]);

  // Dynamically extract topics/units and counts
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    exams.forEach((e) => {
      const topic = getExamTopic(e);
      counts[topic] = (counts[topic] || 0) + 1;
    });
    return counts;
  }, [exams]);

  const dynamicTopics = useMemo(() => {
    return ['All', ...Object.keys(topicCounts).sort()];
  }, [topicCounts]);

  // Active filters count (grade, subject, topic, search)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGrade !== 'All') count++;
    if (selectedSubject !== 'All') count++;
    if (selectedTopic !== 'All') count++;
    if (sourceFilter !== 'all') count++;
    if (searchTerm.trim() !== '') count++;
    return count;
  }, [selectedGrade, selectedSubject, selectedTopic, sourceFilter, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGrade('All');
    setSelectedSubject('All');
    setSelectedTopic('All');
    setSourceFilter('all');
  };

  // Export as .txt
  const handleExportTxt = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const lines: string[] = [];
      lines.push('================================================================');
      lines.push('FORMAT SPECIFICATION:');
      lines.push(`Grade: ${getExamGrade(exam)}`);
      lines.push(`Subject: ${exam.subject || 'General'}`);
      lines.push(`Topic: ${getExamTopic(exam)}`);
      lines.push(`Time Limit: ${exam.timeLimit || 20} minutes`);
      lines.push('================================================================\n');

      exam.questions.forEach((q, idx) => {
        lines.push(`${idx + 1}. ${q.text}`);
        q.options.forEach((opt, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          lines.push(`   ${letter}) ${opt}`);
        });
        const correctIndex = typeof q.correct === 'number' ? q.correct : 0;
        const correctLetter = String.fromCharCode(65 + correctIndex);
        lines.push(`   Answer: ${correctLetter}`);
        if (q.explanation && q.explanation.trim()) {
          lines.push(`   Explanation: ${q.explanation.trim()}`);
        }
        lines.push('');
      });

      const textData = lines.join('\n');
      const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeFilename = (exam.name || 'exam')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_');
      link.download = `${safeFilename}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCopiedNotification(`Exported "${exam.name}" as .txt`);
      setTimeout(() => setCopiedNotification(null), 3000);
    } catch {
      setCopiedNotification('Failed to export text file');
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  // Filtered & Sorted exams
  const filteredExams = useMemo(() => {
    const list = exams.filter((exam) => {
      const examGrade = getExamGrade(exam);
      const examSubject = exam.subject?.trim() || 'General';
      const examTopic = getExamTopic(exam);

      const matchSearch =
        searchTerm === '' ||
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        examSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        examGrade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        examTopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.questions.some((q) => q.text.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchGrade =
        selectedGrade === 'All' || examGrade.toLowerCase() === selectedGrade.toLowerCase();

      const matchSubject =
        selectedSubject === 'All' || examSubject.toLowerCase() === selectedSubject.toLowerCase();

      const matchTopic =
        selectedTopic === 'All' ||
        examTopic.toLowerCase().includes(selectedTopic.toLowerCase()) ||
        (exam.unit && exam.unit.toLowerCase().includes(selectedTopic.toLowerCase()));

      const isCurated = Boolean(exam.isDownloaded || exam.sourceType === 'curated_catalog');
      const matchSource =
        sourceFilter === 'all' ||
        (sourceFilter === 'downloaded' && isCurated) ||
        (sourceFilter === 'user_created' && !isCurated);

      return matchSearch && matchGrade && matchSubject && matchTopic && matchSource;
    });

    return list.sort((a, b) => {
      if (sortBy === 'questions') {
        return (b.questions?.length || 0) - (a.questions?.length || 0);
      }
      if (sortBy === 'duration') {
        return (b.timeLimit || 0) - (a.timeLimit || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // 'newest' default
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [exams, searchTerm, selectedGrade, selectedSubject, selectedTopic, sourceFilter, sortBy]);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Toast feedback */}
      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xl flex items-center gap-2 border border-white/20"
          >
            <CheckCircle className="w-4 h-4 text-zinc-950 dark:text-white" />
            <span>{copiedNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: TRANSLUCENT CONTAINER (Header & Filter Actions)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-5 sm:p-7 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] space-y-5 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-zinc-400/5 dark:bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-zinc-500/5 dark:bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs border border-white/80 dark:border-white/10">
              <BookOpen className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-900 dark:text-white">
                  Exams Repository
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                  {filteredExams.length} of {exams.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Explore, preview questions, and practice official curriculum exams
              </p>
            </div>
          </div>

          {/* Action Controls & Sort */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onOpenCuratedCatalogModal && (
              <button
                type="button"
                onClick={onOpenCuratedCatalogModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs transition cursor-pointer shadow-xs active:scale-98"
                title={user?.grade ? `Download exams filtered for Grade ${user.grade}` : 'Browse official curriculum exams'}
              >
                <CloudDownload className="w-3.5 h-3.5" />
                <span>Download Exams {user?.grade ? `(G${user.grade})` : ''}</span>
              </button>
            )}

            {isAdmin && onOpenDatabaseUpload && exams.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenDatabaseUpload(exams[0])}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 border border-white/80 dark:border-white/10 font-semibold text-xs cursor-pointer transition shadow-xs active:scale-98"
                title="Upload questions to Cloud Firestore"
              >
                <CloudUpload className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>Upload</span>
              </button>
            )}

            {/* Sort selector */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#0c182b] px-3 py-1.5 rounded-full border border-white/80 dark:border-white/10 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="questions">Most Questions</option>
                <option value="duration">Longest Duration</option>
                <option value="name">Title (A - Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Source Tabs */}
        <div className="relative z-10 flex items-center gap-2 p-1 rounded-full bg-white/70 dark:bg-zinc-900/60 border border-white/80 dark:border-white/10 w-full sm:w-fit overflow-x-auto">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-98 ${
              sourceFilter === 'all'
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>All Exams</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/60 dark:bg-zinc-800 font-semibold">
              {exams.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSourceFilter('downloaded')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-98 ${
              sourceFilter === 'downloaded'
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CloudDownload className="w-3.5 h-3.5 text-zinc-500" />
            <span>Official Curriculum</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/60 dark:bg-zinc-800 font-semibold">
              {downloadedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSourceFilter('user_created')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-98 ${
              sourceFilter === 'user_created'
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span>User Created</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/60 dark:bg-zinc-800 font-semibold">
              {userCreatedCount}
            </span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────
            LAYER 2: FILTER PANEL (Collapsible & Expandable)
        ───────────────────────────────────────────────────────── */}
        <div className="relative z-10 p-3.5 sm:p-5 rounded-[26px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs space-y-3">
          {/* Search Input Bar & Filter Toggle Row */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="fileSearchInput"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, subject, grade, topic, or question keywords..."
                className="w-full pl-10 pr-14 py-2.5 text-xs sm:text-sm rounded-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Toggle & Active Filter Chips Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  id="toggle-filters-btn"
                  onClick={() => setIsFiltersExpanded((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border active:scale-95 ${
                    isFiltersExpanded || activeFiltersCount > 0
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title={isFiltersExpanded ? 'Collapse grade, subject & topic filters' : 'Expand grade, subject & topic filters'}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isFiltersExpanded ? 'Hide Filters' : 'Filter Options'}</span>
                  {activeFiltersCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isFiltersExpanded || activeFiltersCount > 0
                          ? 'bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-950'
                          : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                  {isFiltersExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Active Filter Chips (visible even when collapsed for instant context) */}
                {selectedGrade !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700">
                    <GraduationCap className="w-3 h-3 text-zinc-500" />
                    <span>{selectedGrade}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGrade('All')}
                      className="hover:text-rose-500 ml-0.5 cursor-pointer"
                      title="Remove grade filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedSubject !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700">
                    <BookOpen className="w-3 h-3 text-zinc-500" />
                    <span>{selectedSubject}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubject('All')}
                      className="hover:text-rose-500 ml-0.5 cursor-pointer"
                      title="Remove subject filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedTopic !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700">
                    <Bookmark className="w-3 h-3 text-zinc-500" />
                    <span className="max-w-[120px] truncate">{selectedTopic}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTopic('All')}
                      className="hover:text-rose-500 ml-0.5 cursor-pointer"
                      title="Remove topic filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition ml-auto"
                >
                  <RotateCcw className="w-3 h-3 text-zinc-500" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

          {/* Expandable Filter Details (Grade, Subject, Topic & Subject Pills) */}
          <AnimatePresence>
            {isFiltersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80"
              >
                {/* Strict 3 Filters: Grade, Subject, Topic */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Grade Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Grade</span>
                    </label>
                    <select
                      id="filterGradeSelect"
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer focus:outline-none"
                    >
                      <option value="All">All Grades ({exams.length})</option>
                      {dynamicGrades
                        .filter((g) => g !== 'All')
                        .map((grade) => (
                          <option key={grade} value={grade}>
                            {grade} ({gradeCounts[grade] || 0})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* 2. Subject Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Subject</span>
                    </label>
                    <select
                      id="filterSubjectSelect"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer focus:outline-none"
                    >
                      <option value="All">All Subjects ({exams.length})</option>
                      {dynamicSubjects
                        .filter((s) => s !== 'All')
                        .map((subj) => (
                          <option key={subj} value={subj}>
                            {subj} ({subjectCounts[subj] || 0})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* 3. Topic / Unit Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Topic</span>
                    </label>
                    <select
                      id="filterTopicSelect"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer focus:outline-none truncate"
                    >
                      <option value="All">All Topics ({exams.length})</option>
                      {dynamicTopics
                        .filter((t) => t !== 'All')
                        .map((topic) => (
                          <option key={topic} value={topic}>
                            {topic.length > 50 ? `${topic.substring(0, 50)}...` : topic} ({topicCounts[topic] || 0})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Quick Subject Access & Push in Every Subject (if Admin) */}
                {dynamicSubjects.length > 1 && (
                  <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Subjects ({dynamicSubjects.filter((s) => s !== 'All').length})</span>
                      </span>
                      {isAdmin && (
                        <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                          <CloudUpload className="w-3 h-3 text-zinc-900 dark:text-white" />
                          <span>Admin: Push exams per subject</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {dynamicSubjects.map((subj) => {
                        const isSelected = selectedSubject.toLowerCase() === subj.toLowerCase();
                        const count = subj === 'All' ? exams.length : (subjectCounts[subj] || 0);
                        const subjectExam = subj === 'All'
                          ? exams[0]
                          : exams.find((e) => (e.subject || 'General').toLowerCase() === subj.toLowerCase());

                        return (
                          <div
                            key={subj}
                            className={`inline-flex items-center rounded-full text-xs transition border overflow-hidden ${
                              isSelected
                                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                                : 'bg-zinc-50 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedSubject(subj)}
                              className="px-3 py-1 font-semibold flex items-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <span>{subj}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isSelected
                                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}
                              >
                                {count}
                              </span>
                            </button>

                            {/* Admin Push button in every subject */}
                            {isAdmin && onOpenDatabaseUpload && subj !== 'All' && subjectExam && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenDatabaseUpload(subjectExam);
                                }}
                                className={`px-2 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition border-l active:scale-95 ${
                                  isSelected
                                    ? 'border-zinc-800 dark:border-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900'
                                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white'
                                }`}
                                title={`Push ${subj} exam to Cloud Firestore`}
                              >
                                <CloudUpload className="w-3 h-3" />
                                <span>Push</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter Summary & Close Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Filters applied: Grade ({selectedGrade}), Subject ({selectedSubject}), Topic ({selectedTopic !== 'All' ? 'Custom' : 'All'})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFiltersExpanded(false)}
                    className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition py-0.5 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronUp className="w-3 h-3" />
                    <span>Collapse Filters</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1 CONTAINER: EXAMS REPOSITORY GRID
          With Expandable Questions (showing question number, time, LaTeX text, choices & solutions)
      ───────────────────────────────────────────────────────────── */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-[32px] bg-white/40 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-xs">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No matching exams found</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Try adjusting your Grade, Subject, or Topic filter criteria.
          </p>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3.5 px-5 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          <AnimatePresence mode="popLayout">
            {filteredExams.map((exam) => {
              const isCurated = Boolean(exam.isDownloaded || exam.sourceType === 'curated_catalog');
              const gradeLabel = getExamGrade(exam);
              const topicLabel = getExamTopic(exam);
              const isExpanded = Boolean(expandedExamIds[exam.id]);
              const questionCount = exam.questions?.length || 0;
              const avgSecondsPerQ = questionCount > 0 ? Math.max(1, Math.round((exam.timeLimit * 60) / questionCount)) : 60;

              return (
                <motion.div
                  layout="position"
                  key={exam.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`group rounded-[24px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 transition-all shadow-xs hover:shadow-md ${
                    isExpanded ? 'ring-1 ring-zinc-900/15 dark:ring-white/15' : ''
                  }`}
                >
                  {!isExpanded ? (
                    /* ─────────────────────────────────────────────────────────────
                       COLLAPSED VIEW: GRADE, SUBJECT, TOPIC, WITH PRACTICE & EXPAND
                    ───────────────────────────────────────────────────────────── */
                    <div
                      onClick={() => toggleExpandExam(exam.id)}
                      className="p-4 flex flex-col gap-2.5 cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition select-none rounded-[24px]"
                    >
                      {/* Top Row: Grade, Subject, and Actions (Practice + Expand) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Grade Badge */}
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                            <GraduationCap className="w-3 h-3" />
                            <span>{gradeLabel}</span>
                          </span>

                          {/* Subject Badge */}
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {exam.subject || 'General'}
                          </span>

                          {/* Admin Push Button on Subject Badge */}
                          {isAdmin && onOpenDatabaseUpload && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDatabaseUpload(exam);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition cursor-pointer shadow-2xs active:scale-95"
                              title={`Push ${exam.subject || 'exam'} to Cloud Firestore`}
                            >
                              <CloudUpload className="w-2.5 h-2.5" />
                              <span>Push</span>
                            </button>
                          )}

                          {isCurated && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                              title="Official Curriculum Exam"
                            >
                              <CloudDownload className="w-2.5 h-2.5" />
                              <span>Official</span>
                            </span>
                          )}
                        </div>

                        {/* Collapsed Actions: Practice, Push (Admin), and Expand */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartPractice(exam);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 active:scale-98 transition cursor-pointer shadow-2xs"
                            title="Start Practice"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Practice</span>
                          </button>

                          {isAdmin && onOpenDatabaseUpload && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDatabaseUpload(exam);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 transition cursor-pointer active:scale-98"
                              title={`Push ${exam.subject || 'exam'} to Cloud Firestore`}
                            >
                              <CloudUpload className="w-3 h-3" />
                              <span>Push</span>
                            </button>
                          )}

                          <button
                            type="button"
                            id={`share-exam-btn-${exam.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExamToShare(exam);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 transition cursor-pointer active:scale-95 shadow-2xs touch-manipulation"
                            title="Share exam deep link & specification"
                          >
                            <Share2 className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                            <span className="hidden sm:inline">Share</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandExam(exam.id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                            title="Expand details"
                          >
                            <span>Expand</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Topic Pill */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="font-medium truncate" title={topicLabel}>
                          <strong className="text-zinc-700 dark:text-zinc-300">Topic:</strong> {topicLabel}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* ─────────────────────────────────────────────────────────────
                       EXPANDED VIEW: GRADE, SUBJECT, TOPIC, TITLE,
                       TOTAL QUE, TIME, AND 3 SMALL ACTION BUTTONS
                    ───────────────────────────────────────────────────────────── */
                    <div className="p-4 sm:p-5 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Header: Grade, Subject, Official Badge & Collapse Button */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                              <GraduationCap className="w-3 h-3" />
                              <span>{gradeLabel}</span>
                            </span>

                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {exam.subject || 'General'}
                            </span>

                            {isCurated ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                title="Official Curriculum Exam"
                              >
                                <CloudDownload className="w-2.5 h-2.5" />
                                <span>Official</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                <Layers className="w-2.5 h-2.5 text-zinc-500" />
                                <span>User Created</span>
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExpandExam(exam.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 transition cursor-pointer shadow-2xs hover:opacity-90 active:scale-98"
                            title="Collapse"
                          >
                            <span>Collapse</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title & Topic */}
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm sm:text-base font-['Outfit',sans-serif] text-zinc-900 dark:text-white leading-snug">
                            {exam.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="font-medium truncate" title={topicLabel}>
                              <strong className="text-zinc-700 dark:text-zinc-300">Topic:</strong> {topicLabel}
                            </span>
                          </div>
                        </div>

                        {/* Concise Metrics: Total que & Time */}
                        <div className="flex items-center gap-3 text-xs py-1.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 font-medium">
                            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="text-zinc-500 dark:text-zinc-400">Total que:</span>
                            <span className="text-zinc-900 dark:text-white font-semibold">{questionCount}</span>
                          </div>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="text-zinc-500 dark:text-zinc-400">Time:</span>
                            <span className="text-zinc-900 dark:text-white font-semibold">{exam.timeLimit} mins</span>
                          </div>
                        </div>

                        {/* Action Buttons: [Practice] [Push (Admin)] [Share] [Edit or Export] [Delete] */}
                        <div className={`grid ${isAdmin && onOpenDatabaseUpload ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} gap-2 pt-0.5`}>
                          {/* Button 1: Practice */}
                          <button
                            type="button"
                            onClick={() => onStartPractice(exam)}
                            className="py-1.5 px-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 transition hover:opacity-90 active:scale-98 cursor-pointer shadow-xs"
                            title="Start Timed Practice"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Practice</span>
                          </button>

                          {/* Button Admin: Push to Cloud */}
                          {isAdmin && onOpenDatabaseUpload && (
                            <button
                              type="button"
                              onClick={() => onOpenDatabaseUpload(exam)}
                              className="py-1.5 px-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1 transition hover:opacity-90 active:scale-98 cursor-pointer shadow-xs border border-zinc-900 dark:border-white"
                              title={`Push ${exam.subject || 'exam'} to Cloud Firestore`}
                            >
                              <CloudUpload className="w-3 h-3" />
                              <span>Push</span>
                            </button>
                          )}

                          {/* Button Share: Specification & Deep Link */}
                          <button
                            type="button"
                            id={`share-exam-expanded-btn-${exam.id}`}
                            onClick={() => setExamToShare(exam)}
                            className="py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer border border-zinc-200/80 dark:border-zinc-700 active:scale-98 touch-manipulation"
                            title="Share Exam Specification & Deep Link"
                          >
                            <Share2 className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                            <span>Share</span>
                          </button>

                          {/* Button 2: Edit or Export */}
                          {!isCurated ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditExam(exam)}
                                className="flex-1 py-1.5 px-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-xs flex items-center justify-center gap-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer border border-zinc-200/80 dark:border-zinc-700 active:scale-98"
                                title="Edit Exam in Wizard"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleExportTxt(exam, e)}
                                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer border border-zinc-200/80 dark:border-zinc-700 active:scale-98"
                                title="Export TXT"
                              >
                                <FileDown className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleExportTxt(exam, e)}
                              className="py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer border border-zinc-200/80 dark:border-zinc-700 active:scale-98"
                              title="Export as text file"
                            >
                              <FileDown className="w-3 h-3" />
                              <span>Export</span>
                            </button>
                          )}

                          {/* Button 3: Delete */}
                          <button
                            type="button"
                            onClick={() => onDeleteExam(exam.id)}
                            className="py-1.5 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center justify-center gap-1 transition hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/30 active:scale-98 cursor-pointer"
                            title={isCurated ? 'Remove from downloaded exams' : 'Delete Exam'}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Share Exam Modal */}
      <ShareExamModal
        isOpen={examToShare !== null}
        exam={examToShare}
        onClose={() => setExamToShare(null)}
        onStartPractice={(ex) => {
          setExamToShare(null);
          onStartPractice(ex);
        }}
      />
    </div>
  );
};
