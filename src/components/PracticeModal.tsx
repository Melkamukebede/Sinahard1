import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  EyeOff,
  Pause,
  Play,
  X,
  Square,
  LayoutList,
  Check,
  Minimize2,
  Maximize2,
  CloudOff,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exam, ExamAnswerRecord, ExamResult, Question } from '../types';
import { MathRenderer } from './MathRenderer';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useNotifications } from '../context/NotificationContext';
import { isAppOffline } from '../firebase';
import { copyLatexToClipboard } from '../services/latexClipboardService';

interface PracticeModalProps {
  exam: Exam | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitResult: (result: ExamResult) => void;
}

type PracticeViewMode = '1-to-1' | '6-to-1';

export const PracticeModal: React.FC<PracticeModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSubmitResult,
}) => {
  const { notifyExamCompleted } = useNotifications();

  // Mode: '1-to-1' (single focus) vs '6-to-1' (6 questions vertically per page)
  const [viewMode, setViewMode] = useState<PracticeViewMode>('1-to-1');

  // Density: 'full' (all headers & ribbons) vs 'minimalist' (hides non-essential headers for LaTeX math space)
  const [densityMode, setDensityMode] = useState<'full' | 'minimalist'>('full');

  // Navigation indices
  const [currentIndex, setCurrentIndex] = useState(0); // for 1-to-1 mode
  const [batchPage, setBatchPage] = useState(0); // for 6-to-1 mode (0-indexed)

  // Answers & revealed explanations per-question
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [everRevealedQuestions, setEverRevealedQuestions] = useState<Record<number, boolean>>({});

  // Timer & Pause State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Submit confirmation dialog
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Copied question state
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);

  const handleCopyQuestion = async (question: Question, idx: number) => {
    let fullText = `Question ${idx + 1}:\n${question.text}\n\n`;
    if (question.options && question.options.length > 0) {
      question.options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        fullText += `${letter}) ${opt}\n`;
      });
    }
    const success = await copyLatexToClipboard(fullText, 'raw');
    if (success) {
      setCopiedQuestionIdx(idx);
      setTimeout(() => setCopiedQuestionIdx(null), 2000);
    }
  };

  // Scroll ref to top of question container when page/question changes
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const BATCH_SIZE = 6;

  // Initialize practice session
  useEffect(() => {
    if (isOpen && exam) {
      setCurrentIndex(0);
      setBatchPage(0);
      setUserAnswers(new Array(exam.questions.length).fill(null));
      setRevealedQuestions({});
      setEverRevealedQuestions({});
      setTimeLeft(exam.timeLimit * 60);
      setIsPaused(false);
      setShowSubmitConfirm(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, exam]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, timeLeft]);

  // Keyboard shortcut: Space toggles pause
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  /**
   * Question choice rule:
   * Choices are strictly restricted from being clicked/selected if:
   * 1. The user has already selected an option for this question.
   * 2. The user has clicked the explanation button for this question.
   */
  const isQuestionDisabled = useCallback(
    (qIndex: number) => {
      const isAnswered = userAnswers[qIndex] !== null && userAnswers[qIndex] !== undefined;
      const hasClickedExplanation = !!everRevealedQuestions[qIndex] || !!revealedQuestions[qIndex];
      return isAnswered || hasClickedExplanation;
    },
    [userAnswers, revealedQuestions, everRevealedQuestions]
  );

  const handleSelectOption = (qIndex: number, optionIndex: number) => {
    if (isPaused) return;

    // Disabled once chosen or once explanation is clicked
    if (isQuestionDisabled(qIndex)) {
      return;
    }

    const updated = [...userAnswers];
    updated[qIndex] = optionIndex;
    setUserAnswers(updated);
  };

  // Toggle explanation for a specific question (permanently restricts option selecting)
  const handleToggleExplanation = (qIndex: number) => {
    if (isPaused) return;

    setEverRevealedQuestions((prev) => ({
      ...prev,
      [qIndex]: true,
    }));

    setRevealedQuestions((prev) => ({
      ...prev,
      [qIndex]: !prev[qIndex],
    }));
  };

  // 1-to-1 mode navigation
  const handleNext1to1 = () => {
    if (!exam) return;
    if (currentIndex < exam.questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handlePrev1to1 = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  // 6-to-1 mode navigation
  const totalBatchPages = exam ? Math.ceil(exam.questions.length / BATCH_SIZE) : 0;

  const handleNextBatch = () => {
    if (!exam) return;
    if (batchPage < totalBatchPages - 1) {
      setBatchPage((prev) => prev + 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handlePrevBatch = () => {
    if (batchPage > 0) {
      setBatchPage((prev) => prev - 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  // Jump to specific question from navigator strip
  const handleJumpToQuestion = (targetIdx: number) => {
    if (isPaused) return;
    if (viewMode === '1-to-1') {
      setCurrentIndex(targetIdx);
    } else {
      const targetBatch = Math.floor(targetIdx / BATCH_SIZE);
      setBatchPage(targetBatch);
      setTimeout(() => {
        const el = document.getElementById(`practice-question-${targetIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
    if (scrollContainerRef.current && viewMode === '1-to-1') {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Final submission and grading
  const handleFinalSubmit = useCallback(() => {
    if (!exam) return;

    let correctCount = 0;
    const answerRecords: ExamAnswerRecord[] = exam.questions.map((q, i) => {
      const selectedIndex = userAnswers[i];
      const isCorrect = selectedIndex === q.correct;
      if (isCorrect) correctCount++;

      return {
        text: q.text,
        userAnswer:
          selectedIndex !== null && selectedIndex !== undefined
            ? `${String.fromCharCode(65 + selectedIndex)}. ${q.options[selectedIndex]}`
            : 'Not Answered',
        correctAnswer: `${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = exam.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const timeSpent = exam.timeLimit * 60 - timeLeft;

    // Trigger celebration confetti if passed (>= 70%)
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    // Push notification
    notifyExamCompleted(exam.name, correctCount, totalQuestions, percentage);

    const result: ExamResult = {
      examId: exam.id,
      examTitle: exam.name,
      date: new Date().toISOString(),
      score: correctCount,
      total: totalQuestions,
      percentage,
      timeSpent: Math.max(timeSpent, 0),
      answers: answerRecords,
    };

    setShowSubmitConfirm(false);
    onClose();
    onSubmitResult(result);
  }, [exam, userAnswers, timeLeft, notifyExamCompleted, onClose, onSubmitResult]);

  const handleAutoSubmit = useCallback(() => {
    handleFinalSubmit();
  }, [handleFinalSubmit]);

  if (!isOpen || !exam) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = userAnswers.filter((a) => a !== null).length;
  const progressPct = ((answeredCount) / exam.questions.length) * 100;

  // Batch slicing for 6-to-1 mode
  const batchStartIdx = batchPage * BATCH_SIZE;
  const batchEndIdx = Math.min(batchStartIdx + BATCH_SIZE, exam.questions.length);
  const currentBatchQuestions = exam.questions.slice(batchStartIdx, batchEndIdx);

  // Helper component to render a single Question Card (used in both 1-to-1 and 6-to-1)
  const renderQuestionCard = (q: Question, qIndex: number) => {
    const isAnswered = userAnswers[qIndex] !== null && userAnswers[qIndex] !== undefined;
    const isExplRevealed = !!revealedQuestions[qIndex];
    const isDisabled = isAnswered || isExplRevealed;
    const selectedOpt = userAnswers[qIndex];

    return (
      <div
        key={q.id || qIndex}
        id={`practice-question-${qIndex}`}
        className="p-5 sm:p-6 rounded-[28px] bg-[#0c182b] border border-white/10 shadow-lg space-y-4 transition-all text-white"
      >
        {/* Card Header: Question Number */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#0f1d33] text-white font-bold text-xs flex items-center justify-center border border-white/10">
              {qIndex + 1}
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-zinc-400">
              Question {qIndex + 1} of {exam.questions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopyQuestion(q, qIndex)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0f1d33] hover:bg-[#132238] text-zinc-300 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Copy question and formulas as clean LaTeX"
            aria-label="Copy question"
          >
            {copiedQuestionIdx === qIndex ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Question</span>
              </>
            )}
          </button>
        </div>

        {/* Question Statement */}
        <div className="text-base sm:text-lg font-medium text-white leading-relaxed pt-1">
          <MathRenderer content={q.text} />
        </div>

        {/* Options List */}
        <div className="space-y-2.5 pt-1">
          {q.options.map((optText, optIdx) => {
            const isSelected = selectedOpt === optIdx;
            const letter = String.fromCharCode(65 + optIdx);
            const isCorrectOption = q.correct === optIdx;

            // Visual Styling based on selection and explanation state using signature App Dark Palette
            let optionCardClasses = '';
            if (isExplRevealed) {
              if (isCorrectOption) {
                optionCardClasses = 'bg-emerald-500/15 border-emerald-500 text-white shadow-xs font-medium';
              } else if (isSelected && !isCorrectOption) {
                optionCardClasses = 'bg-rose-500/15 border-rose-500 text-white shadow-xs';
              } else {
                optionCardClasses = 'bg-[#091322]/40 border-white/5 opacity-50 text-zinc-400';
              }
            } else if (isSelected) {
              optionCardClasses = 'bg-white text-zinc-950 border-white shadow-md font-bold';
            } else {
              optionCardClasses = isDisabled
                ? 'bg-[#091322]/40 border-white/5 text-zinc-500 opacity-60 cursor-not-allowed'
                : 'bg-[#0f1d33] border-white/10 text-zinc-200 hover:bg-[#132238] hover:text-white cursor-pointer shadow-2xs';
            }

            return (
              <div
                key={optIdx}
                onClick={() => {
                  if (!isDisabled) {
                    handleSelectOption(qIndex, optIdx);
                  }
                }}
                className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-[20px] border transition-all select-none ${
                  isDisabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-[0.995]'
                } ${optionCardClasses}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isExplRevealed && isCorrectOption
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isExplRevealed && isSelected && !isCorrectOption
                      ? 'bg-rose-500 text-white shadow-xs'
                      : isSelected
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-[#0c182b] text-zinc-300 border border-white/10'
                  }`}
                >
                  {letter}
                </div>
                <div className="flex-1 text-sm sm:text-base leading-relaxed font-normal">
                  <MathRenderer content={optText} inline />
                </div>
                {/* Visual Icon Check / Indicator */}
                {isExplRevealed && isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isExplRevealed && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Question Actions: Explanation Button at the bottom of every question */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => handleToggleExplanation(qIndex)}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer transition border shadow-2xs active:scale-98 ${
              isExplRevealed
                ? 'bg-[#162742] text-white border-white/20'
                : 'bg-[#0f1d33] text-zinc-300 border-white/10 hover:bg-[#132238] hover:text-white'
            }`}
          >
            {isExplRevealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-white" />
                <span>Hide Explanation</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>View Explanation</span>
              </>
            )}
          </button>
        </div>

        {/* Correct Answer Shower & Step-by-Step Explanation Banner */}
        {isExplRevealed && (
          <div className="p-4 sm:p-5 rounded-[24px] bg-[#070e1a] border border-emerald-500/30 text-white space-y-3 animate-in fade-in duration-200">
            {/* Banner Header: Correct Answer Shower */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {String.fromCharCode(65 + q.correct)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                    Correct Answer
                  </span>
                  <div className="text-sm sm:text-base font-bold text-white">
                    Option {String.fromCharCode(65 + q.correct)}: <MathRenderer content={q.options[q.correct]} inline />
                  </div>
                </div>
              </div>

              {/* Status Comparison Badge */}
              <div className="shrink-0">
                {selectedOpt === q.correct ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0f1d33] text-white border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Your Choice: Correct ✓
                  </span>
                ) : selectedOpt !== null && selectedOpt !== undefined ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Your Choice: Option {String.fromCharCode(65 + selectedOpt)} (Incorrect)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    No answer selected
                  </span>
                )}
              </div>
            </div>

            {/* Step-by-Step Solution & LaTeX formulas */}
            {q.explanation && (
              <div className="pt-1 text-xs sm:text-sm text-zinc-200 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <span>Step-by-step Solution:</span>
                </div>
                <div className="leading-relaxed">
                  <MathRenderer content={q.explanation} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-4xl h-[94vh] max-h-[880px] bg-[#070e1a] border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden text-white backdrop-blur-2xl">
          {/* Header Bar using App Color Design */}
          <div className="px-5 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#0c182b]/95 backdrop-blur-md flex-wrap text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <h2 className="font-['Outfit',sans-serif] font-bold text-sm sm:text-base text-white truncate">
                {exam.name}
              </h2>
              {Boolean(isAppOffline() || exam.metadata?.offlineCapped) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1 shrink-0" title="Offline Free/Guest 20-question cap active">
                  <CloudOff className="w-2.5 h-2.5" />
                  <span>Offline (Max 20)</span>
                </span>
              )}
            </div>

            {/* Center Controls: Mode Toggle (1 to 1 vs 6 to 1) & Compact Mode Toggle */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center p-1 rounded-full bg-[#091322] border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('1-to-1');
                    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-full font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === '1-to-1'
                      ? 'bg-white text-zinc-950 font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Single question focus mode"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>1 to 1<span className="hidden sm:inline"> Mode</span></span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('6-to-1');
                    setBatchPage(Math.floor(currentIndex / BATCH_SIZE));
                    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-full font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === '6-to-1'
                      ? 'bg-white text-zinc-950 font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="6 questions per page vertically"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>6 to 1<span className="hidden sm:inline"> Mode</span></span>
                </button>
              </div>

              {/* Compact Mode Toggle (Full View vs Minimalist View) */}
              <button
                type="button"
                onClick={() => setDensityMode((prev) => (prev === 'full' ? 'minimalist' : 'full'))}
                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border shadow-2xs active:scale-95 ${
                  densityMode === 'minimalist'
                    ? 'bg-white text-zinc-950 font-bold border-white shadow-xs'
                    : 'bg-[#0f1d33] text-zinc-300 border-white/10 hover:bg-[#132238] hover:text-white'
                }`}
                title={
                  densityMode === 'minimalist'
                    ? 'Switch to Full View (show tracking headers and jump ribbon)'
                    : 'Switch to Minimalist View (hide non-essential headers for maximum LaTeX math workspace)'
                }
              >
                {densityMode === 'minimalist' ? (
                  <>
                    <Maximize2 className="w-3 h-3 text-zinc-800" />
                    <span className="font-bold">Minimalist</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-900 text-white font-mono">
                      Q{currentIndex + 1}/{exam.questions.length}
                    </span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3 h-3 text-zinc-400" />
                    <span>Full View</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Controls: Timer & Close */}
            <div className="flex items-center gap-2.5">
              {/* Interactive Timer Button */}
              <button
                type="button"
                onClick={togglePause}
                title="Click or press Space to pause/resume"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border select-none shadow-xs ${
                  isPaused
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse'
                    : timeLeft <= 60
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-[#0f1d33] text-zinc-200 border-white/10 hover:bg-[#132238] hover:text-white'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                    <span>PAUSED</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{formatTimer(timeLeft)}</span>
                    <Pause className="w-3 h-3 opacity-60 ml-0.5" />
                  </>
                )}
              </button>

              {/* Close / Exit Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-[#0f1d33] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-[#0f1d33]">
            <div
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Subheader Tracker & Question Navigation Ribbon (Hidden in Minimalist View to maximize workspace) */}
          {densityMode === 'full' && (
            <>
              <div className="px-5 sm:px-6 py-2 bg-[#0c182b]/90 border-b border-white/10 flex items-center justify-between gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-2 truncate">
                  {viewMode === '1-to-1' ? (
                    <span className="font-semibold text-zinc-200">
                      Question {currentIndex + 1} of {exam.questions.length}
                    </span>
                  ) : (
                    <span className="font-semibold text-zinc-200">
                      Batch {batchPage + 1} of {totalBatchPages} (Questions {batchStartIdx + 1}–{batchEndIdx})
                    </span>
                  )}
                </div>

                {/* Answered Counter */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs">
                    Answered: <strong className="text-white">{answeredCount}</strong> / {exam.questions.length}
                  </span>
                </div>
              </div>

              {/* Quick Question Jump Ribbon (Scrollable pills) */}
              <div className="px-5 sm:px-6 py-1.5 bg-[#070e1a]/90 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1 shrink-0">
                  Jump:
                </span>
                {exam.questions.map((_, idx) => {
                  const isAns = userAnswers[idx] !== null && userAnswers[idx] !== undefined;
                  const isExpl = !!revealedQuestions[idx];
                  const isCurrent = viewMode === '1-to-1' ? currentIndex === idx : idx >= batchStartIdx && idx < batchEndIdx;

                  let pillClass = '';
                  if (isCurrent) {
                    pillClass = 'ring-2 ring-white font-bold bg-white text-zinc-950';
                  } else if (isAns) {
                    pillClass = 'bg-[#162742] text-white border border-white/20 font-semibold';
                  } else if (isExpl) {
                    pillClass = 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
                  } else {
                    pillClass = 'bg-[#0f1d33] text-zinc-300 border border-white/10 hover:bg-[#132238]';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center shrink-0 cursor-pointer transition ${pillClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Main Questions View Area (Supports Blur when Time is Paused) */}
          <div className="flex-1 relative overflow-hidden flex flex-col bg-[#070e1a]">
            {/* Scrollable Questions Container */}
            <div
              ref={scrollContainerRef}
              className={`flex-1 overflow-y-auto ${densityMode === 'minimalist' ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} transition-all duration-300 ${
                isPaused ? 'filter blur-md md:blur-lg select-none pointer-events-none opacity-40' : ''
              }`}
            >
              <div className="max-w-3xl mx-auto space-y-6">
                {viewMode === '1-to-1' ? (
                  // 1-to-1 Mode: Single Question
                  renderQuestionCard(exam.questions[currentIndex], currentIndex)
                ) : (
                  // 6-to-1 Mode: 6 Questions vertically
                  currentBatchQuestions.map((q, i) => {
                    const actualIdx = batchStartIdx + i;
                    return renderQuestionCard(q, actualIdx);
                  })
                )}
              </div>
            </div>

            {/* Anti-Peek Paused Overlay (Active only when paused) */}
            {isPaused && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-6 animate-in fade-in duration-200">
                <div className="max-w-md w-full p-8 rounded-[28px] bg-[#070e1a]/95 border border-white/10 shadow-2xl text-center backdrop-blur-xl text-white">
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                    <Pause className="w-8 h-8 fill-current" />
                  </div>
                  <h3 className="text-xl font-bold font-['Outfit',sans-serif] text-white">
                    Exam Paused
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1.5 mb-6 leading-relaxed">
                    Questions, equations, and answers are blurred to preserve testing integrity while the clock is stopped.
                  </p>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-full py-3 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition hover:bg-zinc-100"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume Exam</span>
                  </button>
                  <p className="text-[11px] text-zinc-500 mt-2.5">or press Spacebar to resume</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Controls */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-white/10 bg-[#0c182b]/95 backdrop-blur-md flex items-center justify-between gap-2 text-white">
            {viewMode === '1-to-1' ? (
              // 1-to-1 Mode Footer
              <>
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={handlePrev1to1}
                  className="px-4 py-2 rounded-full border border-white/10 bg-[#0f1d33] text-zinc-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-[#132238] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNext1to1}
                    className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98 hover:bg-zinc-100"
                  >
                    {currentIndex === exam.questions.length - 1 ? (
                      <>
                        <span>Finish Exam</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // 6-to-1 Mode Footer (Batch pagination)
              <>
                <button
                  type="button"
                  disabled={batchPage === 0}
                  onClick={handlePrevBatch}
                  className="px-4 py-2 rounded-full border border-white/10 bg-[#0f1d33] text-zinc-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-[#132238] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev<span className="hidden sm:inline">ious 6 Questions</span></span>
                </button>

                <div className="hidden sm:flex items-center text-xs text-zinc-400">
                  Page {batchPage + 1} of {totalBatchPages}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNextBatch}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98 hover:bg-zinc-100"
                  >
                    {batchPage === totalBatchPages - 1 ? (
                      <>
                        <span>Finish<span className="hidden sm:inline"> Exam</span></span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Next<span className="hidden sm:inline"> 6 Questions</span></span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation before submit */}
      <ConfirmationDialog
        isOpen={showSubmitConfirm}
        title="Submit Practice Exam?"
        message={`You have answered ${answeredCount} of ${exam.questions.length} questions. Are you ready to submit and calculate your final score?`}
        confirmText="Submit Exam"
        cancelText="Review Questions"
        onConfirm={handleFinalSubmit}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </>
  );
};
