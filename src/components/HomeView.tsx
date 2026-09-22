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
  School,
  UserCheck,
  ShieldCheck,
  PlusCircle,
  Compass,
} from 'lucide-react';
import { Exam, ExamResult, UserSubscription, AppUser } from '../types';
import { PageTab } from './Navbar';
import { isUserSubscriptionActive, isUserTeacher } from '../services/db';
import { UserTierStatus } from '../services/subscriptionLimits';
import { SinahardLogo } from './SinahardLogo';

export interface HomeViewProps {
  exams: Exam[];
  results: ExamResult[];
  onNavigate: (tab: PageTab) => void;
  onStartPractice: (exam: Exam) => void;
  onOpenPasteModal: () => void;
  onOpenProfessorModal: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenCuratedModal?: () => void;
  onOpenRegistrationModal?: () => void;
  activeSubscription?: UserSubscription | null;
  userTier?: UserTierStatus;
  user?: AppUser | null;
  isAdmin?: boolean;
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
  onOpenRegistrationModal,
  activeSubscription,
  userTier,
  user,
  isAdmin = false,
}) => {
  const totalQuestions = exams.reduce((acc, e) => acc + (e.questions?.length || 0), 0);
  const avgScore = results.length
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
    : 0;
  const passedCount = results.filter((r) => (r.percentage || 0) >= 70).length;
  const recentResults = results.slice(0, 4);
  const isPremiumActive = isUserSubscriptionActive(activeSubscription || null);
  const isTeacher = Boolean(user && isUserTeacher(user));

  // Focus Exam
  const focusExam = exams[0] || null;

  // Features expanded/collapsed toggle state
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
        // ignore
      }
      return next;
    });
  };

  const now = new Date();
  const dayName = now.toLocaleDateString(undefined, { weekday: 'short' });
  const monthName = now.toLocaleDateString(undefined, { month: 'short' });
  const dayNumber = now.getDate();
  const dateFormatted = `${dayName}, ${monthName} ${dayNumber}`;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8 pb-20 max-w-5xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. ROLE-ADAPTIVE WORKSPACE BANNER
          Tailored to Student, Teacher, or Administrator
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-sm overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Administrator Workspace</span>
                  </>
                ) : isTeacher ? (
                  <>
                    <School className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>School Teacher Studio</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Student Practice Center • Grade {user?.grade || '12'}</span>
                  </>
                )}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{dateFormatted}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white tracking-tight">
              {isAdmin
                ? 'National Curriculum & Cloud Firestore Manager'
                : isTeacher
                ? `Welcome, Teacher ${user?.teacherName || user?.displayName || ''} (${user?.school || 'School Affiliated'})`
                : `Active Practice Portal for Grade ${user?.grade || '12'} Students`}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {isAdmin
                ? 'Curate official university entrance examinations, review Ethiopian Birr subscriptions, and manage Cloud Firestore database records.'
                : isTeacher
                ? `Create and publish curriculum-aligned exams to Cloud Firestore for your students at ${user?.school || 'your school'}. Your students can practice offline or timed.`
                : 'Turn your textbooks and revision notes into active, timed practice tests with instant step-by-step solutions, formula support, and peer sharing.'}
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-subs')}
                  className="px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-black dark:text-white" />
                  <span>Subscriptions</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('create')}
                  className="px-5 py-2.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-white dark:text-zinc-950" />
                  <span>Curate Exam</span>
                </button>
              </>
            ) : isTeacher ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('files')}
                  className="px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-2"
                >
                  <School className="w-4 h-4 text-black dark:text-white" />
                  <span>My School Exams</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('create')}
                  className="px-5 py-2.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-white dark:text-zinc-950" />
                  <span>Create Class Exam</span>
                </button>
              </>
            ) : (
              <>
                {onOpenCuratedModal && (
                  <button
                    type="button"
                    onClick={onOpenCuratedModal}
                    className="px-5 py-2.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <BookOpen className="w-4 h-4 text-white dark:text-zinc-950" />
                    <span>Prepared Curriculum</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('files')}
                  className="px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-4 h-4 text-black dark:text-white" />
                  <span>Exam Repository</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          2. WELCOME & 4 CORE POINTS OF SINAHARD
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-sm overflow-hidden"
      >
        <div className="space-y-6">
          <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <SinahardLogo size="xl" idSuffix="welcome-hero" className="shrink-0" />
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white">
                  <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
                  <span>Welcome to Sinahard Ethiopian Exam System</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-950 dark:text-white leading-tight">
                  Bridging the Gap from Reading to Active Practice
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                  When you upload PDFs, read textbooks, or study notes, passive reading alone isn't enough to build lasting exam confidence. To truly retain knowledge, you require an active testing environment. <strong className="font-semibold text-zinc-950 dark:text-white">Sinahard</strong> provides timed tests, instant evaluation, peer sharing, and pre-prepared curriculum exams.
                </p>
              </div>
            </div>
          </div>

          {/* Collapsible 4 Core Features */}
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
                className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition text-left cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    4 Core Capabilities:
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white">
                    <Play className="w-3 h-3 text-black dark:text-white" /> Active Testing
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white">
                    <GraduationCap className="w-3 h-3 text-black dark:text-white" /> Curated Catalog
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white">
                    <Download className="w-3 h-3 text-black dark:text-white" /> Quick Bulk Import
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white">
                    <Share2 className="w-3 h-3 text-black dark:text-white" /> Offline Sharing
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white group-hover:underline shrink-0">
                  <span>Show Details</span>
                  <ChevronDown className="w-4 h-4 text-black dark:text-white" />
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="expanded-features-grid"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden space-y-4"
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Core Capabilities Architecture
                  </span>
                  <button
                    type="button"
                    onClick={toggleFeatures}
                    className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-bold cursor-pointer"
                  >
                    Hide Details
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Point 1 */}
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <Play className="w-5 h-5 text-black dark:text-white" />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-white">
                        1. Active Testing
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Transition from reading PDF questions to interactive, timed practice that simulates university entrance conditions.
                      </p>
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-black dark:text-white" />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-white">
                        2. Ethiopian Curriculum
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        National prep for Grade 12 (Natural & Social Science) and University Freshman courses with step-by-step math.
                      </p>
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <Download className="w-5 h-5 text-black dark:text-white" />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-white">
                        3. Bulk Import & AI
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Paste question text directly from Telegram, study channels, or AI exports into clean interactive tests.
                      </p>
                    </div>
                  </div>

                  {/* Point 4 */}
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-black dark:text-white" />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-white">
                        4. Peer Sharing & Export
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Export complete tests in formatted plain .txt with one click so study groups can test each other offline.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          3. METRIC CARDS BENTO - ALL BLACK ICONS & GENEROUS PADDING
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-sm"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Modules */}
          <div
            onClick={() => onNavigate('files')}
            className="p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Total Modules
              </span>
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4 text-black dark:text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
              {exams.length}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Curriculum sets</div>
          </div>

          {/* Question Bank */}
          <div
            onClick={() => onNavigate('files')}
            className="p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Question Bank
              </span>
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                <HelpCircle className="w-4 h-4 text-black dark:text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
              {totalQuestions}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">MCQ questions</div>
          </div>

          {/* Avg Score */}
          <div
            onClick={() => onNavigate('results')}
            className="p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Avg Mastery
              </span>
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4 text-black dark:text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
              {avgScore}%
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{passedCount} passed exams</div>
          </div>

          {/* Completed Sessions */}
          <div
            onClick={() => onNavigate('results')}
            className="p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Completed
              </span>
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                <Award className="w-4 h-4 text-black dark:text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
              {results.length}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Recorded sessions</div>
          </div>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT PRACTICE HISTORY
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-zinc-950 dark:text-white">
              Recent Practice History
            </h3>
            <span className="text-xs px-3 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700">
              {results.length} sessions
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('results')}
            className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 text-black dark:text-white" />
          </button>
        </div>

        <div>
          {recentResults.length === 0 ? (
            <div className="text-center py-10 px-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30">
              <AlertCircle className="w-8 h-8 text-black dark:text-white mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                No completed practice sessions yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Choose an exam from the repository or curated catalog to begin practicing.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentResults.map((r, index) => {
                const isPassed = (r.percentage || 0) >= 70;
                return (
                  <div
                    key={index}
                    className="py-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 px-3 rounded-2xl transition"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white truncate">
                        {r.examTitle}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        <span>{new Date(r.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{r.score}/{r.total} correct</span>
                        <span>•</span>
                        <span>{Math.floor((r.timeSpent || 0) / 60)}m {(r.timeSpent || 0) % 60}s</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isPassed
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {r.percentage}% {isPassed ? 'PASS' : 'RETAKE'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          5. ETHIOPIAN BIRR SUBSCRIPTION FOOTER BANNER
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Crown className="w-6 h-6 text-white dark:text-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
                {isPremiumActive ? 'Premium Membership Active' : 'Ethiopian Birr Student Plans'}
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                {isPremiumActive ? 'Active' : 'Telebirr / CBE'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Unlimited practice tests, step-by-step LaTeX formula reasoning, and offline plain-text exam exports.
            </p>
          </div>
        </div>

        {onOpenSubscriptionModal && (
          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            className="px-6 py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0 active:scale-98"
          >
            <Crown className="w-4 h-4 text-white dark:text-zinc-950" />
            <span>{isPremiumActive ? 'Plan Status' : 'Upgrade in ETB'}</span>
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default HomeView;
