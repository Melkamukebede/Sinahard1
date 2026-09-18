import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Code2,
  Clock,
  Sparkles,
  Keyboard,
  Cloud,
  FileCode,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
  Play,
  ArrowRight,
  Calculator,
  Laptop,
  Flame,
  ChevronDown,
  ChevronUp,
  Search,
  UserCheck,
  GraduationCap,
  Compass,
  Layers,
  BarChart3,
  ShieldCheck,
  Bell,
  CreditCard,
  ExternalLink,
  PlusCircle,
  Eye,
  FileCheck2,
  Shuffle,
  Binary,
  CheckSquare,
  Bookmark,
  Sparkle,
  Type,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { AppUser } from '../types';

interface ManualViewProps {
  onNavigate: (tab: 'home' | 'files' | 'results' | 'create') => void;
  onOpenProfessorModal: () => void;
  onOpenPasteModal: () => void;
  onOpenRegistrationModal?: () => void;
  onOpenCuratedModal?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenNotificationsModal?: () => void;
  isAdmin?: boolean;
  user?: AppUser | null;
}

interface ManualSection {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

export const ManualView: React.FC<ManualViewProps> = ({
  onNavigate,
  onOpenProfessorModal,
  onOpenPasteModal,
  onOpenRegistrationModal,
  onOpenCuratedModal,
  onOpenSubscriptionModal,
  onOpenNotificationsModal,
  isAdmin,
  user,
}) => {
  // Search and filter query
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Track open state of each expandable chapter
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'onboarding': true,
    'curated': false,
    'player': false,
    'analytics': false,
    'builder': false,
    'firestore': false,
    'subscriptions': false,
  });

  // Live KaTeX formula playground state
  const [liveLatexInput, setLiveLatexInput] = useState<string>(
    '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
  );
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Quick interactive prompt simulator
  const [samplePromptSubject, setSamplePromptSubject] = useState<'Freshman Mathematics' | 'Grade 12 Physics' | 'Grade 12 Biology'>('Freshman Mathematics');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    setExpandedSections({
      'onboarding': true,
      'curated': true,
      'player': true,
      'analytics': true,
      'builder': true,
      'firestore': true,
      'subscriptions': true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      'onboarding': false,
      'curated': false,
      'player': false,
      'analytics': false,
      'builder': false,
      'firestore': false,
      'subscriptions': false,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(text);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const mathSnippets = [
    { label: 'Quadratic Formula', code: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { label: 'Limit at Infinity', code: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1' },
    { label: 'Definite Integral', code: '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)' },
    { label: 'Summation Series', code: '\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}' },
    { label: 'Calculus Derivative', code: '\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}, \\quad x > 0' },
    { label: 'Kinematics Equation', code: 'v^2 = v_0^2 + 2a\\Delta x' },
    { label: 'Matrix 2x2', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Greek Symbols', code: '\\alpha, \\beta, \\theta, \\lambda, \\pi, \\Delta, \\sigma' },
  ];

  const samplePrompts = {
    'Freshman Mathematics': `Please generate 10 rigorous Ethiopian University Freshman Mathematics questions for remedial and degree core curriculum covering Calculus Limits, Continuity, and Derivatives.

Formatting requirements:
1. Each question must include 4 multiple-choice options (A, B, C, D) and specify the correct answer index.
2. Format all mathematical equations in LaTeX using \\( ... \\) for inline and \\[ ... \\] for display math.
3. Include step-by-step explanations verifying the analytical proof.
4. Output as valid JSON array or structured plain text with an asterisk (*) marking the correct option.`,
    'Grade 12 Physics': `Please generate 10 Ethiopian Grade 12 National University Entrance Examination Physics questions covering Electromagnetic Induction and Rotational Dynamics.

Formatting requirements:
1. Four options (A, B, C, D) per question with realistic distractors.
2. Full SI units and formula derivations using KaTeX \\( ... \\).
3. Include complete pedagogical explanations for students.
4. Formatted for direct copy-paste into ExamMaster Pro.`,
    'Grade 12 Biology': `Please generate 10 Ethiopian Grade 12 National Examination Biology questions covering Genetics, Molecular Biology, and Cellular Respiration.

Formatting requirements:
1. Four clear choices per item with one definitively correct answer marked with *.
2. Include explanations referencing the Ethiopian Ministry of Education curriculum.`,
  };

  const sectionsData: ManualSection[] = [
    {
      id: 'onboarding',
      number: '01',
      title: 'Academic Onboarding & Grade Calibration',
      subtitle: 'Set up your student profile, academic grade (Freshman or Grades 9–12), and curriculum stream',
      badge: 'Getting Started',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: UserCheck,
      tags: ['registration', 'profile', 'freshman', 'grade', 'stream', 'google', 'login', 'onboarding'],
    },
    {
      id: 'curated',
      number: '02',
      title: 'Curated & Official National Exams Catalog',
      subtitle: 'Browse, filter by registered grade, and download verified national exams for offline study',
      badge: 'Catalog & Offline',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      icon: BookOpen,
      tags: ['curated', 'official', 'moe', 'download', 'offline', 'catalog', 'library', 'freshman'],
    },
    {
      id: 'player',
      number: '03',
      title: 'The Interactive Testing Engine & Study Controls',
      subtitle: 'Timer management, anti-cheat blur, keyboard shortcuts, and live study mode answer reveals',
      badge: 'Exam Controls',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: Clock,
      tags: ['timer', 'player', 'shortcuts', 'keyboard', 'pause', 'reveal', 'study mode', 'anti-cheat', 'practice'],
    },
    {
      id: 'analytics',
      number: '04',
      title: 'Post-Exam Analytics & Pedagogical Solution Review',
      subtitle: 'Detailed scorecard analysis, passing score evaluation, and full mathematical solution derivations',
      badge: 'Review & Analytics',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      icon: BarChart3,
      tags: ['results', 'score', 'percentage', 'solutions', 'review', 'explanation', 'progress'],
    },
    {
      id: 'builder',
      number: '05',
      title: 'Creating Custom Tests & Professor AI Prompt Architect',
      subtitle: 'Three ways to create exams, LaTeX math formula sandbox, and automated prompt engineering',
      badge: 'Creation & LaTeX',
      badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
      icon: Sparkles,
      tags: ['create', 'wizard', 'latex', 'katex', 'formulas', 'math', 'ai', 'professor', 'gemini', 'chatgpt', 'paste', 'json'],
    },
    {
      id: 'firestore',
      number: '06',
      title: 'Cloud Firestore Synchronization & Question Bank',
      subtitle: 'Central normalized storage (/exams and /questions) with parallel 400-doc batch commits and live sync',
      badge: 'Cloud Architecture',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      icon: Cloud,
      tags: ['firestore', 'firebase', 'cloud', 'database', 'questions', 'batch', 'admin', 'sync'],
    },
    {
      id: 'subscriptions',
      number: '07',
      title: 'Study Notifications & Ethiopian Birr Subscriptions',
      subtitle: 'Daily study schedules, automated Telebirr/Chapa checkout, and manual CBE / BoA transfers',
      badge: 'Payments & Schedules',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      icon: CreditCard,
      tags: ['subscription', 'telebirr', 'chapa', 'cbe', 'abyssinia', 'birr', 'notifications', 'reminders'],
    },
  ];

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sectionsData;
    const q = searchQuery.toLowerCase().trim();
    return sectionsData.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.subtitle.toLowerCase().includes(q) ||
        sec.tags.some((t) => t.includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] text-zinc-900 dark:text-zinc-100">
      {/* Calm, Soothing Hero Banner */}
      <div className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-all">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Interactive Knowledge Base & User Guide</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 text-xs border border-zinc-200 dark:border-zinc-700">
              <Type className="w-3 h-3 text-emerald-500" />
              <span>Calm Font Active • Plus Jakarta Sans & Outfit</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-['Outfit',sans-serif] text-zinc-900 dark:text-white tracking-tight leading-tight">
              ExamMaster Pro Interactive Manual
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed max-w-3xl">
              A comprehensive, chapter-by-chapter interactive walkthrough designed to take you from initial student registration to complete examination mastery, KaTeX mathematical notation, and AI-powered test authoring.
            </p>
          </div>

          {/* Search Bar & Expand/Collapse Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guide by keyword (e.g. Freshman, LaTeX, Timer, Telebirr, Shortcuts)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700/80 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expand All</span>
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Container */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const isExpanded = !!expandedSections[section.id];
          const IconComponent = section.icon;

          return (
            <div
              key={section.id}
              className="rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
            >
              {/* Expandable Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-5 flex items-start sm:items-center justify-between gap-4 text-left hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-zinc-400 dark:text-zinc-500">
                        {section.number}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                        {section.title}
                      </h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${section.badgeColor}`}
                      >
                        {section.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Accordion Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="border-t border-zinc-200/80 dark:border-zinc-800/80 px-6 py-6"
                  >
                    {/* CHAPTER 1: ONBOARDING */}
                    {section.id === 'onboarding' && (
                      <div className="space-y-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                          ExamMaster Pro personalizes tests and catalog offerings using your registered academic grade and stream profile. Calibrating your grade guarantees you only see curriculum papers relevant to your level.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-xs">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">1</span>
                              <span>Google Account Sign-In</span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              One-click authentication via Firebase Auth links your test history, completed papers, and custom creations securely to the cloud.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-xs">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">2</span>
                              <span>Grade Calibration</span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Choose between <strong>University Freshman</strong> (Remedial & 1st Year Degree), <strong>Grade 12</strong> (National Entrance Exam), or Grades 9–11.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-xs">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">3</span>
                              <span>Academic Stream Track</span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Specifying <strong>Natural Science</strong>, <strong>Social Science</strong>, or <strong>Higher Education</strong> automatically filters corresponding subjects.
                            </p>
                          </div>
                        </div>

                        {/* Interactive Grade & Stream Matrix Table */}
                        <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              Academic Grade Matrix & Curricular Scope
                            </h4>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              Current User: {user?.grade ? `Registered as ${user.grade}` : 'Guest Student'}
                            </span>
                          </div>

                          <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-emerald-500/20 text-[11px] font-bold text-zinc-500">
                                  <th className="py-2 pr-4">Academic Level</th>
                                  <th className="py-2 pr-4">Targeted Stream</th>
                                  <th className="py-2 pr-4">Core Exam Subjects</th>
                                  <th className="py-2">Curriculum Standards</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-500/10 text-zinc-700 dark:text-zinc-300">
                                <tr>
                                  <td className="py-2.5 font-bold text-emerald-600 dark:text-emerald-400">University Freshman</td>
                                  <td>Higher Education Remedial</td>
                                  <td>Applied Math, Pre-Engineering Physics, Chemistry, English</td>
                                  <td>Higher Education Board & University Syllabus</td>
                                </tr>
                                <tr>
                                  <td className="py-2.5 font-bold text-zinc-900 dark:text-white">Grade 12</td>
                                  <td>Natural & Social Science</td>
                                  <td>Mathematics, Physics, Chemistry, Biology, Economics, History</td>
                                  <td>National University Entrance Exam (NEAEA / MoE)</td>
                                </tr>
                                <tr>
                                  <td className="py-2.5 font-bold text-zinc-900 dark:text-white">Grades 9 & 10</td>
                                  <td>General Foundation</td>
                                  <td>General Science, Algebra, Social Studies, English</td>
                                  <td>Ethiopian Secondary Education Foundation</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {onOpenRegistrationModal && (
                          <div className="pt-1 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={onOpenRegistrationModal}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>Configure or Update Student Profile</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CHAPTER 2: CURATED & OFFICIAL EXAMS */}
                    {section.id === 'curated' && (
                      <div className="space-y-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                          ExamMaster Pro features a curated catalog of verified Ethiopian national exams. The catalog utilizes intelligent grade-matching so University Freshman students automatically see freshman papers, while Grade 12 students see national entrance papers.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              Official Curriculum Badges
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Every paper displays its institutional curator tag (e.g. <em>Ministry of Education (MoE) Specialist Team</em> or <em>University Higher Education Mathematics Board</em>) guaranteeing academic fidelity.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <Laptop className="w-4 h-4 text-blue-500" />
                              Zero-Latency Offline Caching
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              When you click <strong>Download</strong> on an official exam, all questions, math formulas, and solutions are saved locally to your device storage. You can practice without an active internet connection.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2 text-xs">
                          <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Compass className="w-4 h-4 text-blue-500" />
                            How to View Exams from Other Grades:
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400">
                            By default, the catalog filters to your registered grade to keep study sessions focused. To browse other academic levels (for example, reviewing Grade 12 concepts as a Freshman), simply tap <strong>All Grades</strong> in the catalog filter bar.
                          </p>
                        </div>

                        {onOpenCuratedModal && (
                          <div className="pt-1 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={onOpenCuratedModal}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>Open Official Exams Catalog</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CHAPTER 3: THE TESTING ENGINE & CONTROLS */}
                    {section.id === 'player' && (
                      <div className="space-y-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                          The test player simulates real exam conditions with strict timing controls while providing dedicated study features for guided revision.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <Flame className="w-4 h-4 text-amber-500" />
                              Anti-Cheat Timer & Blur
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Pressing <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Space</kbd> or clicking the timer badge pauses the exam and blurs questions to prevent off-screen lookup.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <Eye className="w-4 h-4 text-emerald-500" />
                              Study Mode Answer Reveal
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Stuck on an equation? Tap <strong>Reveal Answer</strong> during practice to view the correct choice and analytical explanation without forfeiting the test.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <Layers className="w-4 h-4 text-purple-500" />
                              Question Drawer Navigator
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Open the question grid to see green badges for answered items, gray for skipped, and yellow tags for items flagged for review.
                            </p>
                          </div>
                        </div>

                        {/* Keyboard Shortcuts Table */}
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                            <Keyboard className="w-4 h-4 text-blue-500" />
                            Calm & High-Efficiency Keyboard Shortcuts
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                              <span className="text-zinc-600 dark:text-zinc-400">Pause / Resume Exam</span>
                              <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Space</kbd>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                              <span className="text-zinc-600 dark:text-zinc-400">Select Option A, B, C, D</span>
                              <div className="flex gap-1 font-mono text-[11px]">
                                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">A</kbd>
                                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">B</kbd>
                                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">C</kbd>
                                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">D</kbd>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                              <span className="text-zinc-600 dark:text-zinc-400">Previous / Next Question</span>
                              <div className="flex gap-1 font-mono text-[11px]">
                                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">←</kbd>
                                <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">→</kbd>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                              <span className="text-zinc-600 dark:text-zinc-400">Dismiss Modal / Drawer</span>
                              <kbd className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px] font-bold">Escape</kbd>
                            </div>
                          </div>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => onNavigate('files')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Launch an Exam to Test Controls</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CHAPTER 4: ANALYTICS & REVIEW */}
                    {section.id === 'analytics' && (
                      <div className="space-y-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                          Submitting an exam immediately opens the post-exam review suite, displaying score breakdowns, passing score thresholds (e.g. 70%), and full pedagogical explanations.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                            <span className="text-zinc-400 text-[11px] block">1. Scorecard Metric</span>
                            <div className="font-bold text-sm text-zinc-900 dark:text-white">
                              Total Score & Percentage
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Compares your score against the national or institutional passing threshold (e.g. 70%).
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                            <span className="text-zinc-400 text-[11px] block">2. Solution Breakdown</span>
                            <div className="font-bold text-sm text-zinc-900 dark:text-white">
                              Mathematical Derivations
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Every option is color-coded: green for correct, red for incorrect picks, with complete step-by-step proofs.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                            <span className="text-zinc-400 text-[11px] block">3. Historical Progress</span>
                            <div className="font-bold text-sm text-zinc-900 dark:text-white">
                              Results History Tab
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Review previous attempts to analyze time spent per question and subject strength trends.
                            </p>
                          </div>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => onNavigate('results')}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>View Your Historical Results</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CHAPTER 5: CREATING CUSTOM TESTS & LATEX SANDBOX */}
                    {section.id === 'builder' && (
                      <div className="space-y-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                          ExamMaster Pro offers three distinct methods to author or import exam questions, complete with a built-in KaTeX formula engine and automated AI Prompt Generator.
                        </p>

                        {/* 3 Creation Methods */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <PlusCircle className="w-4 h-4 text-emerald-500" />
                              1. Manual Step-by-Step Wizard
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Configure exam title, time limit, grade level, and add questions one-by-one with real-time LaTeX previews.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <FileCode className="w-4 h-4 text-purple-500" />
                              2. Bulk Text / JSON Importer
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Paste an entire exam paper at once using formatted plain text (with an asterisk <code className="text-emerald-500">*</code> on correct answers) or standard JSON.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              3. AI Prompt Architect
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Generate calibrated prompts for Google Gemini or ChatGPT to create complete curriculum papers that paste cleanly into the app.
                            </p>
                          </div>
                        </div>

                        {/* Interactive KaTeX Formula Sandbox */}
                        <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/25 space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                              <Calculator className="w-4 h-4" />
                              Interactive Live LaTeX Formula Playground
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Type code below or click any snippet to test rendering
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                LaTeX Expression (Raw Code):
                              </label>
                              <textarea
                                rows={3}
                                value={liveLatexInput}
                                onChange={(e) => setLiveLatexInput(e.target.value)}
                                className="w-full p-3 font-mono text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 resize-none"
                                placeholder="Type LaTeX formula..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                Live KaTeX Mathematical Output:
                              </label>
                              <div className="min-h-[78px] p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm text-zinc-900 dark:text-white overflow-x-auto">
                                <MathRenderer content={`\\[ ${liveLatexInput} \\]`} />
                              </div>
                            </div>
                          </div>

                          {/* Quick Snippets */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-zinc-500 block">
                              Click any snippet to copy & insert into the live playground:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {mathSnippets.map((item) => (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() => {
                                    setLiveLatexInput(item.code);
                                    handleCopy(item.code);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/50 text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                                >
                                  {copiedSnippet === item.code ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-zinc-400" />
                                  )}
                                  <span>{item.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Interactive AI Prompt Simulator */}
                        <div className="p-5 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/25 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                              <Sparkles className="w-4 h-4" />
                              Interactive AI Prompt Generator Simulator
                            </div>
                            <div className="flex items-center gap-1">
                              {(['Freshman Mathematics', 'Grade 12 Physics', 'Grade 12 Biology'] as const).map((subj) => (
                                <button
                                  key={subj}
                                  type="button"
                                  onClick={() => setSamplePromptSubject(subj)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                    samplePromptSubject === subj
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                  }`}
                                >
                                  {subj}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative">
                            <pre className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 font-mono text-[11px] text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap leading-relaxed">
                              {samplePrompts[samplePromptSubject]}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(samplePrompts[samplePromptSubject]);
                                setCopiedPrompt(true);
                                setTimeout(() => setCopiedPrompt(false), 2000);
                              }}
                              className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
                            >
                              {copiedPrompt ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                  <span>Copy Prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => onNavigate('create')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Open Exam Creation Wizard</span>
                          </button>
                          <button
                            type="button"
                            onClick={onOpenPasteModal}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                          >
                            <FileCode className="w-4 h-4" />
                            <span>Open Bulk Paste Importer</span>
                          </button>
                          <button
                            type="button"
                            onClick={onOpenProfessorModal}
                            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>Launch Professor AI Architect</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CHAPTER 6: CLOUD FIRESTORE ARCHITECTURE */}
                    {section.id === 'firestore' && (
                      <div className="space-y-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                          ExamMaster Pro connects directly to Firebase Cloud Firestore for durable, serverless storage of questions and examinations. The architecture separates complete exams from individual question records to support fast querying and modular practice.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2 font-mono">
                              <Layers className="w-4 h-4 text-amber-500" />
                              /exams/{'{examId}'}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Stores top-level metadata: title, academic grade (<code className="font-bold">Freshman</code>, <code className="font-bold">12</code>), stream, time limit, passing score, curator tag, and embedded question array.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2 font-mono">
                              <Binary className="w-4 h-4 text-blue-500" />
                              /questions/{'{questionId}'}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Normalized individual question documents indexed by subject, grade level, topic unit, and formula type for modular queries and targeted practice.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                          <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            Batch Commitment & Pre-Upload Diagnostics:
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400">
                            The upload engine automatically partitions large exam papers into batches of up to 400 documents to respect Firestore atomic batch limits. Before saving, an automated audit verifies that all options are populated, correct answer indices are in range, and equations are rendered cleanly.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CHAPTER 7: NOTIFICATIONS & PAYMENTS */}
                    {section.id === 'subscriptions' && (
                      <div className="space-y-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                          ExamMaster Pro includes scheduled study reminders and flexible subscription tiers payable through popular Ethiopian digital payment channels.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <Bell className="w-4 h-4 text-emerald-500" />
                              Study Reminders & Notifications
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Configure daily or weekly study alerts tailored to your exam prep schedule (e.g. 7:00 PM evening calculus review). Alerts run locally in the browser even when closed.
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-amber-500" />
                              Ethiopian Birr Payment Methods
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Support for <strong>Telebirr</strong> (direct gateway & <code className="font-mono font-bold">*127#</code> transfer), <strong>Chapa</strong>, <strong>Commercial Bank of Ethiopia (CBE)</strong>, and <strong>Bank of Abyssinia (BoA)</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {onOpenSubscriptionModal && (
                            <button
                              type="button"
                              onClick={onOpenSubscriptionModal}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>View Subscription Plans</span>
                            </button>
                          )}
                          {onOpenNotificationsModal && (
                            <button
                              type="button"
                              onClick={onOpenNotificationsModal}
                              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                            >
                              <Bell className="w-4 h-4 text-emerald-400" />
                              <span>Configure Study Reminders</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom Helpful Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
            Ready to begin your study session?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Select an official curriculum paper or generate your own customized test paper now.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Create Exam
          </button>
          <button
            type="button"
            onClick={() => onNavigate('files')}
            className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Browse Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
