import React, { useState } from 'react';
import {
  BarChart3,
  Award,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Trash2,
  BookOpen,
  Target,
  TrendingUp,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { ExamResult } from '../types';
import { MathRenderer } from './MathRenderer';
import { ConfirmationDialog } from './ConfirmationDialog';

interface ResultsViewProps {
  results: ExamResult[];
  onClearAllResults: () => void;
  onDeleteResult: (idOrIndex: string | number) => void;
  onNavigateToFiles: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  onClearAllResults,
  onDeleteResult,
  onNavigateToFiles,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<string | number | null>(null);

  const totalExams = results.length;
  const avgScore = totalExams
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalExams)
    : 0;

  const bestScore = totalExams
    ? Math.max(...results.map((r) => r.percentage || 0))
    : 0;

  const passCount = results.filter(
    (r) => (r.percentage || 0) >= 70
  ).length;

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: TRANSLUCENT CONTAINER (Header & Overview Cards)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-5 sm:p-7 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] space-y-5 overflow-hidden">
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shadow-xs border border-white/80 dark:border-white/10">
              <BarChart3 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-900 dark:text-white">
                  Performance History
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                  {totalExams} attempts
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Track your testing progress, review mistakes, and verify answers
              </p>
            </div>
          </div>

          {totalExams > 0 && (
            <button
              type="button"
              onClick={() => setShowClearAllConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/80 dark:border-white/10 bg-white dark:bg-[#0c182b] text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-xs font-semibold transition cursor-pointer shadow-xs active:scale-98"
              title="Clear all history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {totalExams === 0 ? (
          <div className="relative z-10 text-center py-12 px-4 rounded-[26px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs">
            <Award className="w-10 h-10 text-zinc-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No exam results recorded</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Complete a practice test to record scores and review step-by-step solutions.
            </p>
            <button
              type="button"
              onClick={onNavigateToFiles}
              className="mt-4 px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Browse Exams
            </button>
          </div>
        ) : (
          /* LAYER 2: METRIC CARDS (Elevated Porcelain Cards with System Icons) */
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Target className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <div className="text-xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  {totalExams}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Attempts
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <div className="text-xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  {avgScore}%
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Average Score
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Award className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <div className="text-xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  {bestScore}%
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Top Score
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <div className="text-xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  {passCount} / {totalExams}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Passed Tests
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1 CONTAINER: DETAILED RESULTS LIST
      ───────────────────────────────────────────────────────────── */}
      {totalExams > 0 && (
        <div className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-5 sm:p-7 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] space-y-3 overflow-hidden">
          {/* Subtle Atmospheric Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-1 mb-2">
            Exam Attempts & Solutions
          </div>

          <div className="space-y-3">
            {results.map((result, idx) => {
              const isPassed = (result.percentage || 0) >= 70;
              const isExpanded = expandedIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-[24px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs overflow-hidden transition-all"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Percentage Badge */}
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-['Outfit',sans-serif] font-bold text-sm shrink-0 border ${
                        isPassed
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      }`}>
                        <span>{result.percentage}%</span>
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-sm sm:text-base font-['Outfit',sans-serif] text-zinc-900 dark:text-white truncate">
                            {result.examTitle}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            )}
                            {isPassed ? 'Passed' : 'Retake Recommended'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {new Date(result.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {formatTime(result.timeSpent || 0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-zinc-400" />
                            <strong className="text-zinc-800 dark:text-zinc-200">{result.score}</strong> / {result.total} correct
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: System capsule buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => toggleExpand(idx)}
                        className="px-4 py-1.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide' : 'Review'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setResultToDelete(result.id || idx)}
                        className="p-2 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Delete Result"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Question Review Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2.5">
                      {result.answers?.map((ans, aIdx) => (
                        <div
                          key={aIdx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                                ans.isCorrect
                                  ? 'bg-emerald-500 text-zinc-950'
                                  : 'bg-rose-500 text-white'
                              }`}
                            >
                              {ans.isCorrect ? '✓' : '✕'}
                            </div>

                            <div className="flex-1 text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                              <MathRenderer content={ans.text} />
                            </div>
                          </div>

                          <div className="pl-7 space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 font-medium">Your answer:</span>
                              <span
                                className={`font-semibold ${
                                  ans.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                                }`}
                              >
                                <MathRenderer content={ans.userAnswer} inline />
                              </span>
                            </div>

                            {!ans.isCorrect && (
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-400 font-medium">Correct answer:</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  <MathRenderer content={ans.correctAnswer} inline />
                                </span>
                              </div>
                            )}

                            {ans.explanation && (
                              <div className="mt-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300">
                                <div className="font-semibold text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                                  <Lightbulb className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Step-by-step Solution:</span>
                                </div>
                                <MathRenderer content={ans.explanation} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear All Confirmation */}
      <ConfirmationDialog
        isOpen={showClearAllConfirm}
        title="Clear All History?"
        message="This action will permanently delete all completed exam records."
        confirmText="Clear History"
        isDestructive
        onConfirm={() => {
          onClearAllResults();
          setShowClearAllConfirm(false);
        }}
        onCancel={() => setShowClearAllConfirm(false)}
      />

      {/* Delete Single Result Confirmation */}
      <ConfirmationDialog
        isOpen={resultToDelete !== null}
        title="Delete Result?"
        message="Remove this test attempt?"
        confirmText="Delete"
        isDestructive
        onConfirm={() => {
          if (resultToDelete !== null) {
            onDeleteResult(resultToDelete);
            setResultToDelete(null);
          }
        }}
        onCancel={() => setResultToDelete(null)}
      />
    </div>
  );
};
