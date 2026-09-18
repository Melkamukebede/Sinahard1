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
  Calendar,
  CheckCircle2,
  Layers,
  Crown,
  Sparkles,
  Zap,
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
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export const HomeView: React.FC<HomeViewProps> = ({
  exams,
  results,
  onNavigate,
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
    ? `You have unrestricted trial access to explore creating and importing up to ${userTier.maxQuestionsPerExam} questions. Upgrade before trial ends to maintain unlimited access.`
    : userTier?.isGuest
    ? `Practicing in local guest mode (up to 20 questions/exam). Sign in with Google to unlock a 3-Day Welcome Trial (50 questions) and cloud sync, or upgrade to Premium starting at 19.9 ETB.`
    : `Free student plan (Up to 20 questions/exam). Upgrade starting at 19.9 ETB for unlimited exams, bulk file imports, and solutions.`;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-14"
    >
      {/* Material Design 3 Hero Surface */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-500/10 via-zinc-50 to-blue-500/5 dark:from-emerald-950/30 dark:via-[#091322] dark:to-blue-950/20 border border-emerald-500/20 dark:border-white/10 p-6 md:p-8 shadow-sm"
      >
        {/* Ambient decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Academic Exam Hub</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold font-['Syne',sans-serif] tracking-tight text-zinc-900 dark:text-white">
            Academic Dashboard
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xl">
            Monitor your exam performance metrics, manage your curriculum repository, and prepare with step-by-step mathematical reasoning.
          </p>

          {/* Quick Status Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>{exams.length} Active Modules</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>{passedCount} Passed Certifications</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Material Design 3 Elevated Metric Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Exams Card */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('files')}
          className="group relative p-5 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-blue-500/40 dark:hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Exams
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
            {exams.length}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
            <span>Repository modules</span>
          </div>
        </motion.div>

        {/* Questions Count Card */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('files')}
          className="group relative p-5 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Questions
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
            {totalQuestions}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
            <span>MCQ item bank</span>
          </div>
        </motion.div>

        {/* Average Score Card */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('results')}
          className="group relative p-5 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Average Score
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Syne',sans-serif] text-emerald-600 dark:text-emerald-400">
            {avgScore}%
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
            <span>{passedCount} passed sessions</span>
          </div>
        </motion.div>

        {/* Completed Attempts Card */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('results')}
          className="group relative p-5 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-purple-500/40 dark:hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Attempts
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
            {results.length}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
            <span>Recorded history</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Material Design 3 Recent Practice Activity */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-[28px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-['Syne',sans-serif] font-bold text-base text-zinc-900 dark:text-white">
              Recent Practice Records
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
              {results.length} Total
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('results')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentResults.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[20px] bg-zinc-50/50 dark:bg-zinc-900/30">
            <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              No completed practice sessions yet
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Select an exam from your library to start your first timed practice session.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('files')}
              className="mt-3.5 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Browse Exams</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {recentResults.map((r, index) => {
              const isPassed = r.percentage >= (r.passingScore || 70);
              return (
                <div
                  key={index}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-3 rounded-2xl transition"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                      {r.examTitle}
                    </h3>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>{new Date(r.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{r.score}/{r.total} correct</span>
                      <span>•</span>
                      <span>{Math.floor((r.timeSpent || 0) / 60)}m {(r.timeSpent || 0) % 60}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs sm:text-sm font-extrabold font-['Syne',sans-serif] px-3 py-1 rounded-full ${
                        isPassed
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
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
      </motion.div>

      {/* Interactive Guide & Calm Learning Banner */}
      <motion.div
        variants={itemVariants}
        className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                Interactive Student & Teacher Manual
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Calm & Clear
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Step-by-step guides for grade registration, official exam downloads, KaTeX mathematical notation, and AI prompt engineering.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('manual')}
          className="self-start sm:self-auto px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-emerald-600/20 shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Open Interactive Guide</span>
        </button>
      </motion.div>

      {/* Ethiopian Birr Premium Membership Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden p-5 sm:p-6 rounded-[28px] bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 dark:border-amber-500/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <Crown className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                {bannerTitle}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {isPremiumActive ? 'Active' : userTier?.isTrial ? 'Trial' : 'Free'}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
              {bannerDescription}
            </p>
          </div>
        </div>

        {onOpenSubscriptionModal && (
          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="self-start sm:self-auto px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20 shrink-0"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>{isPremiumActive ? 'View Plan Details' : 'Upgrade in ETB'}</span>
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

