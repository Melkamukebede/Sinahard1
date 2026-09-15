import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  Play,
  Edit,
  Trash2,
  FileCode,
  Clock,
  HelpCircle,
  Award,
  Filter,
  Calculator,
  BookMarked,
  ArrowUpDown,
  RotateCcw,
  Download,
  FileDown,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { Exam } from '../types';

interface FilesViewProps {
  exams: Exam[];
  onStartPractice: (exam: Exam) => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onViewJson: (exam: Exam) => void;
  onCreateNew?: () => void;
}

type DurationFilter = 'all' | 'quick' | 'medium' | 'long';
type SortOption = 'newest' | 'questions' | 'duration' | 'name';

export const FilesView: React.FC<FilesViewProps> = ({
  exams,
  onStartPractice,
  onEditExam,
  onDeleteExam,
  onViewJson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Dynamically extract subjects and counts from exams
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

  // Dynamically extract difficulty options and counts
  const difficultyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    exams.forEach((e) => {
      const diff = e.difficulty || 'Medium';
      counts[diff] = (counts[diff] || 0) + 1;
    });
    return counts;
  }, [exams]);

  // Subject types counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { calculation: 0, theory: 0 };
    exams.forEach((e) => {
      const t = e.subjectType === 'calculation' ? 'calculation' : 'theory';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [exams]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim() !== '') count++;
    if (selectedSubject !== 'All') count++;
    if (selectedDifficulty !== 'All') count++;
    if (selectedType !== 'All') count++;
    if (durationFilter !== 'all') count++;
    return count;
  }, [searchTerm, selectedSubject, selectedDifficulty, selectedType, durationFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSubject('All');
    setSelectedDifficulty('All');
    setSelectedType('All');
    setDurationFilter('all');
  };

  // Export individual exam as cleanly formatted .txt file
  const handleExportTxt = (exam: Exam, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const lines: string[] = [];
      lines.push('================================================================');
      lines.push(`EXAM: ${exam.name}`);
      lines.push(`Subject: ${exam.subject || 'General'}`);
      lines.push(`Difficulty: ${exam.difficulty || 'Medium'}`);
      lines.push(`Subject Type: ${exam.subjectType === 'calculation' ? 'Math / Calculations' : 'Theory & Concepts'}`);
      lines.push(`Time Limit: ${exam.timeLimit || 20} minutes`);
      lines.push(`Passing Score: ${exam.passingScore || 70}%`);
      lines.push(`Total Questions: ${exam.questions?.length || 0}`);
      if (exam.description) {
        lines.push(`Description: ${exam.description}`);
      }
      lines.push(`Generated: ${new Date().toLocaleString()}`);
      lines.push('================================================================\n');

      (exam.questions || []).forEach((q, idx) => {
        lines.push(`${idx + 1}. ${q.text}`);
        (q.options || []).forEach((opt, optIdx) => {
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
      const matchSearch =
        searchTerm === '' ||
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.subject && exam.subject.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSubject =
        selectedSubject === 'All' ||
        (exam.subject || 'General').toLowerCase() === selectedSubject.toLowerCase();

      const matchDifficulty =
        selectedDifficulty === 'All' || exam.difficulty === selectedDifficulty;

      const matchType =
        selectedType === 'All' ||
        (selectedType === 'calculation' && exam.subjectType === 'calculation') ||
        (selectedType === 'theory' && exam.subjectType !== 'calculation');

      const matchDuration =
        durationFilter === 'all' ||
        (durationFilter === 'quick' && exam.timeLimit <= 15) ||
        (durationFilter === 'medium' && exam.timeLimit > 15 && exam.timeLimit <= 30) ||
        (durationFilter === 'long' && exam.timeLimit > 30);

      return matchSearch && matchSubject && matchDifficulty && matchType && matchDuration;
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
  }, [exams, searchTerm, selectedSubject, selectedDifficulty, selectedType, durationFilter, sortBy]);

  return (
    <div className="space-y-5 pb-14">
      {/* Toast feedback */}
      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-xl flex items-center gap-2 border border-white/20"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{copiedNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Exams Repository
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                {filteredExams.length} of {exams.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Filtered academic modules and question collections
            </p>
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 self-start sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-500 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0c1626] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="newest">Newest First</option>
            <option value="questions">Most Questions</option>
            <option value="duration">Longest Duration</option>
            <option value="name">Title (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Material Design 3 Dropdown Filter Panel */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-3.5">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="fileSearchInput"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exams by title, keywords, or topics..."
            className="w-full pl-10 pr-14 py-2.5 text-xs sm:text-sm rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
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

        {/* Material Design 3 Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* 1. Subject Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-500" />
              <span>Subject</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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

          {/* 2. Difficulty Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-blue-500" />
              <span>Difficulty</span>
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="All">All Difficulties</option>
              {['Easy', 'Medium', 'Hard'].map((diff) => (
                <option key={diff} value={diff}>
                  {diff} ({difficultyCounts[diff] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Type Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Calculator className="w-3 h-3 text-purple-500" />
              <span>Content Type</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="All">All Question Types</option>
              <option value="calculation">Formulas / Calculations ({typeCounts.calculation || 0})</option>
              <option value="theory">Concepts / Theory ({typeCounts.theory || 0})</option>
            </select>
          </div>

          {/* 4. Duration Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Duration</span>
            </label>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">All Durations</option>
              <option value="quick">Quick (≤ 15 mins)</option>
              <option value="medium">Standard (15 - 30 mins)</option>
              <option value="long">Extended (&gt; 30 mins)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Quick Reset */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Active filters applied ({activeFiltersCount})
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Exam Grid with Advanced Motion Layout */}
      {filteredExams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-4 bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 rounded-[24px]"
        >
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No matching exams found</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Try adjusting your search criteria or reset active dropdown filters.
          </p>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3.5 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredExams.map((exam) => {
              const isCalculation = exam.subjectType === 'calculation';
              const diffColor =
                exam.difficulty === 'Easy'
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                  : exam.difficulty === 'Medium'
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30'
                  : 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30';

              return (
                <motion.div
                  layout
                  key={exam.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group flex flex-col justify-between p-5 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all shadow-xs hover:shadow-md"
                >
                  <div>
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {exam.subject || 'General'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${diffColor}`}>
                          {exam.difficulty}
                        </span>
                        {isCalculation ? (
                          <span
                            title="Formulas & Calculations"
                            className="p-1 rounded-md bg-blue-500/10 text-blue-500"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span
                            title="Conceptual Reasoning"
                            className="p-1 rounded-md bg-purple-500/10 text-purple-500"
                          >
                            <BookMarked className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm sm:text-base font-['Syne',sans-serif] text-zinc-900 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors line-clamp-2 leading-snug">
                      {exam.name}
                    </h3>

                    {/* Metadata Chips */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 py-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                        {exam.questions.length} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {exam.timeLimit}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-zinc-400" />
                        {exam.passingScore}% pass
                      </span>
                    </div>
                  </div>

                  {/* Card Action Toolbar */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-1">
                      {/* Edit Exam */}
                      <button
                        type="button"
                        onClick={() => onEditExam(exam)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Edit Exam in Wizard"
                        aria-label="Edit Exam"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Export as .txt file (Requested feature) */}
                      <button
                        type="button"
                        onClick={(e) => handleExportTxt(exam, e)}
                        className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
                        title="Export as .txt file"
                        aria-label="Export as text file"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Raw JSON */}
                      <button
                        type="button"
                        onClick={() => onViewJson(exam)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="View Raw JSON"
                        aria-label="View JSON"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Exam */}
                      <button
                        type="button"
                        onClick={() => onDeleteExam(exam.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Delete Exam"
                        aria-label="Delete Exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Start Practice Action */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => onStartPractice(exam)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs transition cursor-pointer shadow-xs"
                      title="Start Timed Practice"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Practice</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

