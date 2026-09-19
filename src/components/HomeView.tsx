import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  RotateCcw,
  Share2,
  FileText,
  Sparkles,
  Download,
  ChevronDown,
} from 'lucide-react';
import { Exam, ExamResult, UserSubscription } from '../types';
import { PageTab } from './Navbar';
import { isUserSubscriptionActive } from '../services/db';
import { UserTierStatus } from '../services/subscriptionLimits';
import { SinahardLogo } from './SinahardLogo';

interface HomeViewProps {
  exams: Exam[];
  results: ExamResult[];
  onNavigate: (tab: PageTab) => void;
  onStartPractice: (exam: Exam) => void;
  onOpenPasteModal: () => void;
  onOpenProfessorModal: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenCuratedModal?: () => void;
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
  onOpenCuratedModal,
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

  // Four Core Features expanded/collapsed toggle state (collapsed by default at first)
  const [isFeaturesExpanded, setIsFeaturesExpanded] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sinahard_welcome_features_expanded');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleFeatures = () => {
    setIsFeaturesExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sinahard_welcome_features_expanded', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Date calculation
  const now = new Date();
  const dayName = now.toLocaleDateString(undefined, { weekday: 'short' });
  const monthName = now.toLocaleDateString(undefined, { month: 'short' });
  const dayNumber = now.getDate();
  const dateFormatted = `${dayName}, ${monthName} ${dayNumber}`;

  const bannerTitle = isPremiumActive
    ? 'Premium Student Membership Active'
    : userTier?.isTrial
    ? `3-Day Welcome Trial Active (${userTier.trialDaysRemaining}d remaining)`
    : userTier?.isGuest
    ? 'Sinahard Guest Mode (20 Qs/Exam)'
    : 'Sinahard Free Student Tier';

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
          WELCOME & 4 CORE POINTS OF SINAHARD
          Bridges passive reading (PDFs / books) to interactive practice
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-[32px] sm:rounded-[38px] bg-white/70 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/70 dark:border-white/10 p-5 sm:p-8 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-zinc-400/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Welcome Header with Sinahard Advanced Emblem */}
          <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
              <SinahardLogo size="xl" idSuffix="welcome-hero" className="shrink-0" />
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  <span>Welcome to Sinahard</span>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">{dateFormatted}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-900 dark:text-white leading-tight">
                  Bridging the Gap from Reading to Active Practice
                </h2>
                <p className="text-xs sm:text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                  When you upload PDFs, read textbooks, or study notes, passive reading alone isn't enough to build lasting exam confidence. To truly retain knowledge, you require an active, interactive testing environment. <strong className="font-semibold text-zinc-900 dark:text-white">Sinahard</strong> fills that critical gap with timed tests, instant evaluation, peer sharing, bulk imports, and pre-prepared curriculum exams.
                </p>
              </div>
            </div>
          </div>

          {/* Collapsed Compact State or Expanded Full Grid */}
          <AnimatePresence initial={false} mode="wait">
            {!isFeaturesExpanded ? (
              <motion.button
                key="collapsed-features-bar"
                type="button"
                onClick={toggleFeatures}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="w-full p-3 sm:p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition text-left cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    4 Core Features:
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    <Play className="w-3 h-3 text-zinc-500" /> Active Testing
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    <GraduationCap className="w-3 h-3 text-zinc-500" /> Curated Catalog
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    <Download className="w-3 h-3 text-zinc-500" /> Instant Conversion
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    <Share2 className="w-3 h-3 text-zinc-500" /> Peer Sharing
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white shrink-0">
                  <span>Expand Details</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="expanded-features-grid"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden space-y-2.5"
              >
                {/* Header row inside expanded view with collapse button */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    4 Core Features Overview
                  </span>
                  <button
                    type="button"
                    onClick={toggleFeatures}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer"
                  >
                    <span>Collapse Details</span>
                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                {/* Four Core Points Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-0.5">
                  {/* Core Point 1: Interactive Practice Area */}
                  <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-2xs border border-white/80 dark:border-white/10">
                        <Play className="w-4 h-4 fill-current text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                        1. Interactive Practice Area
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Turn passive reading of books and PDFs into active recall exams with realistic timers, instant scoring, and step-by-step mathematical explanations.
                      </p>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                        Active Testing
                      </span>
                    </div>
                  </div>

                  {/* Core Point 2: Pre-Prepared Official Exams */}
                  <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-2xs border border-white/80 dark:border-white/10">
                        <GraduationCap className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                        2. Pre-Prepared Exams
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Practice directly with official past national exams and curated entrance question banks tailored to your registered grade and stream.
                      </p>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                        Curated Catalog
                      </span>
                    </div>
                  </div>

                  {/* Core Point 3: Import & Convert Any Exam */}
                  <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-2xs border border-white/80 dark:border-white/10">
                        <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                        3. Bulk Import & AI
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Bulk import questions downloaded from Telegram channels, study groups, or paste AI-generated questions formatted with our template.
                      </p>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                        Instant Conversion
                      </span>
                    </div>
                  </div>

                  {/* Core Point 4: Share with Peers */}
                  <div className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-2xs border border-white/80 dark:border-white/10">
                        <Share2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                        4. Peer Sharing & Export
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Export exams in plain .txt format with one click so you and your study partners can exchange questions and test each other offline.
                      </p>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                        Offline Collaboration
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
