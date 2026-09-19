import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  EyeOff,
  Pause,
  Play,
  X,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exam, ExamAnswerRecord, ExamResult } from '../types';
import { MathRenderer } from './MathRenderer';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useNotifications } from '../context/NotificationContext';

interface PracticeModalProps {
  exam: Exam | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitResult: (result: ExamResult) => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSubmitResult,
}) => {
  const { notifyExamCompleted } = useNotifications();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Initialize practice session
  useEffect(() => {
    if (isOpen && exam) {
      setCurrentIndex(0);
      setUserAnswers(new Array(exam.questions.length).fill(null));
      setTimeLeft(exam.timeLimit * 60);
      setIsPaused(false);
      setIsRevealed(false);
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
      // If pressing Space and not focused on an input/button
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'BUTTON') {
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

  const handleSelectOption = (optionIndex: number) => {
    if (isPaused) return;
    const updated = [...userAnswers];
    updated[currentIndex] = optionIndex;
    setUserAnswers(updated);
  };

  const currentQuestion = exam ? exam.questions[currentIndex] : null;

  const handleNext = () => {
    if (!exam) return;
    setIsRevealed(false);
    if (currentIndex < exam.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handlePrev = () => {
    setIsRevealed(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

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

    // Trigger celebration confetti if passed
    if (percentage >= (exam.passingScore || 70)) {
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

    // Push notification trigger
    notifyExamCompleted(exam.name, correctCount, totalQuestions, percentage);

    const result: ExamResult = {
      examId: exam.id,
      examTitle: exam.name,
      date: new Date().toISOString(),
      score: correctCount,
      total: totalQuestions,
      percentage,
      passingScore: exam.passingScore || 70,
      timeSpent: Math.max(timeSpent, 0),
      subjectType: exam.subjectType,
      answers: answerRecords,
    };

    setShowSubmitConfirm(false);
    onClose();
    onSubmitResult(result);
  }, [exam, userAnswers, timeLeft, notifyExamCompleted, onClose, onSubmitResult]);

  const handleAutoSubmit = useCallback(() => {
    handleFinalSubmit();
  }, [handleFinalSubmit]);

  if (!isOpen || !exam || !currentQuestion) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = userAnswers.filter((a) => a !== null).length;
  const progressPct = ((currentIndex + 1) / exam.questions.length) * 100;
  const isLastQuestion = currentIndex === exam.questions.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-4xl h-[94vh] max-h-[850px] bg-white/95 dark:bg-[#0c182b] border border-white/80 dark:border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-white backdrop-blur-2xl">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between gap-4 bg-white/60 dark:bg-white/[0.02] backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-['Outfit',sans-serif] font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                {exam.name}
              </h2>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-3">
              {/* Interactive Timer Button */}
              <button
                type="button"
                onClick={togglePause}
                title="Click or press Space to pause/resume"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border select-none shadow-xs ${
                  isPaused
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 animate-pulse'
                    : timeLeft <= 60
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 border-white/60 dark:border-white/10'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-amber-600" />
                    <span>PAUSED</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>{formatTimer(timeLeft)}</span>
                    <Pause className="w-3 h-3 opacity-60 ml-0.5" />
                  </>
                )}
              </button>

              {/* Close / Exit Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800/60">
            <div
              className="h-full bg-zinc-900 dark:bg-white transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Subheader Tracker */}
          <div className="px-6 py-2.5 bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/10 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Question {currentIndex + 1} of {exam.questions.length}
            </span>
            <span>
              Answered: <strong className="text-zinc-900 dark:text-white">{answeredCount}</strong> / {exam.questions.length}
            </span>
          </div>

          {/* Main Question & Options Area */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            {isPaused ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-700">
                  <Pause className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Practice Paused
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-6">
                  The exam timer is stopped. Questions are blurred to maintain testing integrity.
                </p>
                <button
                  type="button"
                  onClick={togglePause}
                  className="px-6 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-98 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume Exam
                </button>
                <span className="text-xs text-zinc-400 mt-2">or press Space key</span>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-5">
                {/* Question Text Porcelain Card */}
                <div className="p-6 rounded-[24px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>Question {currentIndex + 1}</span>
                  </div>
                  <div className="text-base sm:text-lg font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    <MathRenderer content={currentQuestion.text} />
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQuestion.options.map((optionText, optIndex) => {
                    const isSelected = userAnswers[currentIndex] === optIndex;
                    const letter = String.fromCharCode(65 + optIndex);

                    return (
                      <div
                        key={optIndex}
                        onClick={() => handleSelectOption(optIndex)}
                        className={`flex items-center gap-3.5 p-4 rounded-[20px] border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                            : 'bg-white dark:bg-[#0c182b] border-white/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white shadow-2xs'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="flex-1 text-sm sm:text-base leading-relaxed font-normal">
                          <MathRenderer content={optionText} inline />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Answer Reveal Panel (Study Mode) */}
                {isRevealed && (
                  <div className="p-5 rounded-[22px] bg-emerald-500/10 border border-emerald-500/20 text-zinc-900 dark:text-white space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Correct Answer: {String.fromCharCode(65 + currentQuestion.correct)}. {currentQuestion.options[currentQuestion.correct]}
                      </span>
                    </div>
                    {currentQuestion.explanation && (
                      <div className="pt-2 border-t border-emerald-500/20 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs uppercase mb-1">
                          Step-by-step Solution:
                        </div>
                        <MathRenderer content={currentQuestion.explanation} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-md flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="px-4 py-2 rounded-full border border-white/60 dark:border-white/10 bg-white/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRevealed(!isRevealed)}
                className="px-4 py-2 rounded-full border border-white/60 dark:border-white/10 bg-white/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-white transition cursor-pointer shadow-xs"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    Hide Answer
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    Reveal Answer
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
              >
                {isLastQuestion ? (
                  <>
                    <span>Finish</span>
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
