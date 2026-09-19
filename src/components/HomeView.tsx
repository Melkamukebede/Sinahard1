import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  HelpCircle,
  Award,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  GraduationCap,
  Crown,
  Play,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { Exam, ExamResult, UserSubscription } from '../types';
import { PageTab } from './Navbar';
import { isUserSubscriptionActive } from '../services/db';
import { UserTierStatus } from '../services/subscriptionLimits';

interface HomeViewProps {
  exams: Exam[];
  results: ExamResult[];
  onNavigate: (tab: PageTab) => void;
  onStartPractice: (exam: Exam) => void;
  onOpenPasteModal: () => void;
  onOpenProfessorModal: () => void;
  onOpenSubscriptionModal?: () => void;
  activeSubscription?: UserSubscription | null;
  userTier?: UserTierStatus;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export const HomeView: React.FC<HomeViewProps> = ({
  exams,
  results,
  onNavigate,
  onStartPractice,
  onOpenSubscriptionModal,
  activeSubscription,
  userTier,
}) => {
  const totalQuestions = exams.reduce((acc, e) => acc + (e.questions?.length || 0), 0);
  const avgScore = results.length
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
    : 0;
  const passedCount = results.filter((r) => r.percentage >= (r.passingScore || 70)).length;
  const recentResults = results.slice(0, 4);
  const isPremiumActive = isUserSubscriptionActive(activeSubscription || null);

  // Overall student progress mastery calculation (0 - 100)
  const overallProgress = results.length
    ? Math.min(100, Math.max(0, avgScore))
    : exams.length > 0
    ? 35
    : 0;

  // Primary Focus Exam
  const focusExam = exams[0] || null;

  // Date calculation
  const now = new Date();
  const dayName = now.toLocaleDateString(undefined, { weekday: 'short' });
  const monthName = now.toLocaleDateString(undefined, { month: 'short' });
  const dayNumber = now.getDate();
  const dateFormatted = `${dayName}, ${monthName} ${dayNumber}`;

  // Circular gauge calculation
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  const bannerTitle = isPremiumActive
    ? 'Premium Student Membership Active'
    : userTier?.isTrial
    ? `3-Day Welcome Trial Active (${userTier.trialDaysRemaining}d remaining)`
    : userTier?.isGuest
    ? 'ExamMaster Guest Mode (20 Qs/Exam)'
    : 'ExamMaster Free Student Tier';

  const bannerDescription = isPremiumActive
    ? `Valid until ${
        activeSubscription?.expiresAt
          ? new Date(activeSubscription.expiresAt).toLocaleDateString()
          : 'Active'
      }. Unlimited questions, exports, and step-by-step LaTeX math reasoning.`
    : userTier?.isTrial
    ? `You have unrestricted trial access to explore creating and importing up to ${userTier.maxQuestionsPerExam} questions.`
    : `Free student plan (Up to 20 questions/exam). Upgrade starting at 19.9 ETB for unlimited exams and step-by-step solutions.`;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-7 pb-20 max-w-5xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER (Atmospheric Title & System Mastery Gauge)
      ───────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="pt-2 px-1 flex items-start justify-between">
        <div className="space-y-0.5">
          <h1 className="text-3xl sm:text-4xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-900 dark:text-white">
            Academic Dashboard
          </h1>
          <p className="text-base sm:text-lg font-normal text-zinc-500 dark:text-zinc-400 tracking-tight">
            {dateFormatted}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* System Circular Mastery Gauge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0c182b] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-xs">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 54 54">
                <circle
                  cx="27"
                  cy="27"
                  r={radius}
                  className="stroke-zinc-200/80 dark:stroke-white/10 fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="27"
                  cy="27"
                  r={radius}
                  className="stroke-zinc-900 dark:stroke-white fill-none transition-all duration-1000 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <span className="text-[11px] font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white leading-none">
                  {overallProgress}%
                </span>
              </div>
            </div>
            <div className="text-left pr-1 hidden sm:block">
              <span className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
                Mastery
              </span>
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                average
              </span>
            </div>
          </div>

          {/* Quick Repository Action Button */}
          <button
            type="button"
            onClick={() => onNavigate('files')}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#0c182b] backdrop-blur-xl border border-white/80 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#0f1d33] transition cursor-pointer shadow-xs active:scale-98"
            title="Browse all exams"
          >
            <SlidersHorizontal className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: TRANSLUCENT CONTAINER (Outer Shell with Ambient Glow)
          LAYER 2: PORCELAIN FOCUS HERO CARD (Elevated Card)
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-4 sm:p-7 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {focusExam ? (
            <div className="rounded-[26px] sm:rounded-[28px] bg-white dark:bg-[#0c182b] p-6 sm:p-8 shadow-xs border border-white/80 dark:border-white/10">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
                  Recommended Focus Exam
                </span>
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-900 dark:text-white leading-tight mb-2.5">
                {focusExam.title || focusExam.name}
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl mb-6 font-normal">
                {focusExam.description ||
                  'Review formulas, solve curriculum questions, and master step-by-step LaTeX explanations.'}
              </p>

              {/* Bottom Button Row */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => onStartPractice(focusExam)}
                  className="px-7 py-3 rounded-full bg-zinc-950 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition active:scale-98 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Exam</span>
                  <span className="opacity-70 font-normal">
                    {focusExam.timeLimit ? `${focusExam.timeLimit} mins` : '30 mins'}
                  </span>
                </button>

                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>{focusExam.timeLimit || 30}m</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>{focusExam.questions?.length || 0} Questions</span>
                  </span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('files')}
                    className="text-zinc-900 dark:text-white hover:underline font-semibold cursor-pointer"
                  >
                    Change exam
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] bg-white dark:bg-[#0c182b] p-8 text-center border border-white/80 dark:border-white/10 shadow-xs">
              <BookOpen className="w-10 h-10 text-zinc-400 mx-auto mb-2 opacity-50" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                No Exams in Repository
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Create a new practice exam with AI assistance or import questions to begin your daily focus session.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('create')}
                className="mt-4 px-6 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs transition cursor-pointer shadow-xs active:scale-98"
              >
                + Create Practice Exam
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1 CONTAINER: METRIC CARDS BENTO
          Every icon follows unified system color (zinc / neutral)
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-4 sm:p-6 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 relative z-10">
          {/* Total Modules */}
          <div
            onClick={() => onNavigate('files')}
            className="p-5 rounded-[24px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Total Modules
              </span>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              </div>
            </div>
            <div className="text-2xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
              {exams.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Curriculum sets</div>
          </div>

          {/* Question Bank */}
          <div
            onClick={() => onNavigate('files')}
            className="p-5 rounded-[24px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Question Bank
              </span>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              </div>
            </div>
            <div className="text-2xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
              {totalQuestions}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">MCQ questions</div>
          </div>

          {/* Avg Score */}
          <div
            onClick={() => onNavigate('results')}
            className="p-5 rounded-[24px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Avg Mastery
              </span>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              </div>
            </div>
            <div className="text-2xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
              {avgScore}%
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">{passedCount} passed exams</div>
          </div>

          {/* Completed Sessions */}
          <div
            onClick={() => onNavigate('results')}
            className="p-5 rounded-[24px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Completed
              </span>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              </div>
            </div>
            <div className="text-2xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
              {results.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Recorded sessions</div>
          </div>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1 CONTAINER: RECENT PRACTICE HISTORY
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-5 sm:p-7 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="font-['Outfit',sans-serif] font-bold text-base text-zinc-900 dark:text-white">
              Recent Practice History
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold border border-zinc-200 dark:border-zinc-700">
              {results.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('results')}
            className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        <div className="relative z-10">
          {recentResults.length === 0 ? (
            <div className="text-center py-8 px-4 border border-zinc-200/80 dark:border-zinc-800 rounded-[22px] bg-white/60 dark:bg-[#0c182b]">
              <AlertCircle className="w-7 h-7 text-zinc-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                No completed practice sessions yet
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Start practicing from your library to record score history.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {recentResults.map((r, index) => {
                const isPassed = r.percentage >= (r.passingScore || 70);
                return (
                  <div
                    key={index}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/60 dark:hover:bg-white/[0.02] px-3 rounded-2xl transition"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                        {r.examTitle}
                      </h3>
                      <div className="flex items-center gap-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span>{new Date(r.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{r.score}/{r.total} correct</span>
                        <span>•</span>
                        <span>{Math.floor((r.timeSpent || 0) / 60)}m {(r.timeSpent || 0) % 60}s</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {r.percentage}% {isPassed ? 'PASS' : 'RETAKE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1 CONTAINER: ETHIOPIAN BIRR MEMBERSHIP BANNER
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-5 sm:p-7 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Crown className="w-5 h-5 text-white dark:text-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                {bannerTitle}
              </h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {isPremiumActive ? 'Active' : userTier?.isTrial ? 'Trial' : 'Free'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {bannerDescription}
            </p>
          </div>
        </div>

        {onOpenSubscriptionModal && (
          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="relative z-10 self-start sm:self-auto px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0 active:scale-98"
          >
            <Crown className="w-3.5 h-3.5 text-white dark:text-zinc-950" />
            <span>{isPremiumActive ? 'Plan Details' : 'Upgrade in ETB'}</span>
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};
