import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Layers,
  Sparkles,
  Lock,
  GraduationCap,
  BookOpen,
  Binary,
  FileCheck2,
  Calendar,
  LogIn,
  Clock,
  Target,
  Compass,
  FileText,
} from 'lucide-react';
import { Exam, AppUser } from '../types';
import {
  uploadExamToFirestore,
  canUserUploadToFirestore,
  inferGrade,
  inferStream,
} from '../services/databaseUpload';
import { ADMIN_EMAIL } from '../services/db';
import { useAuth } from '../context/AuthContext';

interface DatabaseUploadModalProps {
  exam: Exam | null;
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (exam: Exam, engine: 'firestore') => void;
}

const ACADEMIC_GRADE_OPTIONS = [
  { id: 'Senior University', label: 'University Senior', subtitle: 'Undergrad Exit & Advanced Degree Exam Prep' },
  { id: 'Freshman', label: 'University Freshman', subtitle: 'Higher Education Remedial & Degree Core' },
  { id: '12', label: 'Grade 12', subtitle: 'National University Entrance Examination (NEAEA / MoE)' },
  { id: '11', label: 'Grade 11', subtitle: 'Senior Secondary Preparatory Curriculum' },
  { id: '10', label: 'Grade 10', subtitle: 'Secondary General Education' },
  { id: '9', label: 'Grade 9', subtitle: 'Secondary Foundation Curriculum' },
  { id: '8', label: 'Grade 8', subtitle: 'Regional Ministry Level Examination' },
  { id: '7', label: 'Grade 7', subtitle: 'Middle School Curriculum' },
  { id: 'All', label: 'All Grades / General', subtitle: 'Open access for all academic stages' },
  { id: 'custom', label: 'Custom Academic Level', subtitle: 'Specify custom grade or faculty department' },
];

const STREAM_OPTIONS = [
  { id: 'Natural Science', label: 'Natural Science', subtitle: 'Physics, Chemistry, Biology, Advanced Math, Tech Drawing' },
  { id: 'Social Science', label: 'Social Science', subtitle: 'Economics, Geography, History, General Business' },
  { id: 'General', label: 'General Curriculum', subtitle: 'Common core foundation (Grades 9 & 10)' },
  { id: 'Higher Education', label: 'Higher Education / Remedial', subtitle: 'University Freshman STEM & Humanities Courses' },
  { id: 'All', label: 'All Streams', subtitle: 'Universal accessibility across all academic tracks' },
];

export const DatabaseUploadModal: React.FC<DatabaseUploadModalProps> = ({
  exam,
  user,
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const { signInWithGoogle, isSigningIn, popupBlocked } = useAuth();

  // Form states initialized dynamically based on exam prop
  const [selectedGrade, setSelectedGrade] = useState<string>('12');
  const [customGradeText, setCustomGradeText] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('Natural Science');
  const [topic, setTopic] = useState<string>('');
  const [adminTag, setAdminTag] = useState<string>('Official Curriculum Exam');
  const [curatorName, setCuratorName] = useState<string>('Ministry of Education (MoE)');
  const [timeLimit, setTimeLimit] = useState<number>(20);
  const [targetExamYear, setTargetExamYear] = useState<string>('2026 (2018 E.C.)');

  // Upload toggles
  const [uploadIndividualQuestions, setUploadIndividualQuestions] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [asOfficialExam, setAsOfficialExam] = useState<boolean>(true);

  // Status & loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [progressStatusText, setProgressStatusText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever active exam changes
  useEffect(() => {
    if (!exam) return;

    // Detect grade from exam or infer intelligently
    const detectedGrade = exam.grade ? String(exam.grade) : inferGrade(`${exam.name} ${exam.title || ''}`);
    const isKnownGrade = ACADEMIC_GRADE_OPTIONS.some((g) => g.id === detectedGrade);

    if (isKnownGrade) {
      setSelectedGrade(detectedGrade);
      setCustomGradeText('');
    } else if (detectedGrade) {
      setSelectedGrade('custom');
      setCustomGradeText(detectedGrade);
    } else {
      setSelectedGrade('12');
      setCustomGradeText('');
    }

    // Detect stream
    const detectedStream = (exam as any).stream || inferStream(exam.subject, `${exam.name} ${exam.title || ''}`, detectedGrade);
    setSelectedStream(detectedStream);

    // Metadata defaults
    setTopic(exam.topic || (exam.name.includes(':') ? exam.name.split(':')[1].trim() : ''));
    setTimeLimit(Number(exam.timeLimit) || 20);
    setTargetExamYear((exam as any).targetExamYear || '2026 (2018 E.C.)');

    setCuratorName(
      exam.curator ||
      (detectedGrade === 'Freshman'
        ? 'University Higher Education Mathematics Board'
        : 'Ministry of Education (MoE) Specialist Team')
    );

    setAdminTag(
      exam.adminTag ||
      (detectedGrade === 'Freshman'
        ? 'University Freshman Curriculum'
        : `Grade ${detectedGrade} National Curriculum Exam`)
    );

    // Reset status indicators
    setStatusMessage(null);
    setErrorMessage(null);
    setUploadProgress(0);
  }, [exam, isOpen]);

  // Adjust suggested stream when grade changes
  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    if (newGrade === 'Freshman') {
      setSelectedStream('Higher Education');
      if (!adminTag || adminTag.includes('Grade')) {
        setAdminTag('University Freshman Curriculum');
      }
      if (!curatorName || curatorName.includes('Ministry')) {
        setCuratorName('University Higher Education Mathematics Board');
      }
    } else if (newGrade === '9' || newGrade === '10') {
      setSelectedStream('General');
      if (adminTag.includes('Freshman')) {
        setAdminTag(`Grade ${newGrade} Curriculum Exam`);
      }
    } else if (newGrade === '11' || newGrade === '12') {
      if (selectedStream === 'General' || selectedStream === 'Higher Education') {
        setSelectedStream('Natural Science');
      }
      if (adminTag.includes('Freshman')) {
        setAdminTag(`Grade ${newGrade} National Exam`);
      }
    }
  };

  // Diagnostic audit for exam questions
  const diagnostics = useMemo(() => {
    if (!exam || !exam.questions) {
      return { total: 0, hasMath: false, mathCount: 0, withExplanation: 0, isValid: false, issues: ['No questions found'] };
    }

    const total = exam.questions.length;
    let mathCount = 0;
    let withExplanation = 0;
    const issues: string[] = [];

    exam.questions.forEach((q, idx) => {
      if (!q.text?.trim()) {
        issues.push(`Question #${idx + 1} has empty text`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        issues.push(`Question #${idx + 1} has insufficient options (at least 2 required)`);
      }
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
        issues.push(`Question #${idx + 1} correct answer index is invalid`);
      }
      if (q.explanation && q.explanation.trim().length > 0) {
        withExplanation++;
      }
      // Check for LaTeX / math expressions
      const mathRegex = /\$|\\frac|\\lim|\\int|\\sum|\\sqrt|\^|_|\\cdot|\\alpha|\\beta|\\theta|\\pi|\\times|\\pm|\\le|\\ge|\\ne|\\subset|\\in/;
      const combinedText = `${q.text} ${q.options?.join(' ') || ''}`;
      if (mathRegex.test(combinedText)) {
        mathCount++;
      }
    });

    return {
      total,
      hasMath: mathCount > 0,
      mathCount,
      withExplanation,
      isValid: issues.length === 0,
      issues,
    };
  }, [exam]);

  if (!isOpen || !exam) return null;

  const isAdmin = canUserUploadToFirestore(user);
  const userEmail = user?.email || 'Not logged in';
  const effectiveGrade = selectedGrade === 'custom' ? (customGradeText.trim() || 'General') : selectedGrade;

  const handleUploadToFirestore = async () => {
    if (!isAdmin) {
      setErrorMessage(`Access Denied: You must be logged in as ${ADMIN_EMAIL} to upload to Firestore.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setUploadProgress(10);
    setProgressStatusText('Initializing connection to Cloud Firestore...');

    try {
      const result = await uploadExamToFirestore(exam, user, {
        uploadIndividualQuestions,
        isPublic,
        asOfficialExam,
        grade: effectiveGrade,
        topic: topic.trim() || undefined,
        stream: selectedStream,
        adminTag: adminTag.trim() || (effectiveGrade === 'Freshman' ? 'University Freshman Curriculum' : `Grade ${effectiveGrade} Exam`),
        curator: curatorName.trim(),
        timeLimit,
        targetExamYear,
        onProgress: (percent, text) => {
          setUploadProgress(percent);
          setProgressStatusText(text);
        },
      });

      setStatusMessage(result.message);
      if (onUploadComplete) {
        onUploadComplete(
          {
            ...exam,
            isUploadedToCloud: true,
            cloudStorageEngine: 'firestore',
            cloudUploadedAt: new Date().toISOString(),
            grade: effectiveGrade,
            topic: topic.trim() || undefined,
            stream: selectedStream,
            curator: curatorName.trim(),
            timeLimit,
            sourceType: asOfficialExam ? 'curated_catalog' : exam.sourceType,
          } as Exam,
          'firestore'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/65 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white/95 dark:bg-[#0c182b] border border-white/80 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl my-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-white/60 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-white/80 dark:border-white/10 text-zinc-900 dark:text-white flex items-center justify-center shadow-2xs">
                <CloudUpload className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                    Upload to Cloud Firestore
                  </h3>
                  {isAdmin ? (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-zinc-900 dark:text-white" />
                      Verified Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-rose-500" />
                      Admin Protected
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Firebase Native Document Storage & Central Question Bank
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Non-Admin Alert & One-Click Sign-In */}
            {!isAdmin && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Administrator Authentication Required</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                  Only the verified administrator (<span className="font-mono font-bold">{ADMIN_EMAIL}</span>) can upload questions to Cloud Firestore collections (<span className="font-mono">/exams</span> and <span className="font-mono">/questions</span>).
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-rose-500/20">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Current account: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{userEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    disabled={isSigningIn}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isSigningIn ? 'Signing In...' : 'Sign In with Google as Admin'}</span>
                  </button>
                </div>
                {popupBlocked && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    Google sign-in popup was blocked by your browser. Please allow popups for this site.
                  </p>
                )}
              </div>
            )}

            {/* Exam Diagnostic Summary Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Exam Target
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {effectiveGrade === 'Freshman' ? 'University Freshman' : `Grade ${effectiveGrade}`}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                    {exam.name}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                  {exam.subject}
                </span>
              </div>

              {/* Metrics audit bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/80 text-xs">
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">Questions</span>
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5" />
                    {diagnostics.total} items
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">Formula Engine</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
                    <Binary className="w-3.5 h-3.5 text-blue-500" />
                    {diagnostics.hasMath ? `${diagnostics.mathCount} with LaTeX` : 'Plain Text'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">Pedagogy</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-500" />
                    {diagnostics.withExplanation}/{diagnostics.total} Explained
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[10px] block">Sync State</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
                    <Cloud className="w-3.5 h-3.5 text-cyan-500" />
                    {exam.isUploadedToCloud ? 'Synced' : 'Local Draft'}
                  </span>
                </div>
              </div>

              {/* Diagnostic warnings if any */}
              {!diagnostics.isValid && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Validation issue detected: {diagnostics.issues[0]}</span>
                </div>
              )}
            </div>

            {/* Firestore Destination Infrastructure Info */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-amber-500" />
                  Target Firestore Collections
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-200">
                  Batch limit: 400 docs/commit
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Stores complete metadata in <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">/exams/{exam.id}</span> and batch-commits all {exam.questions.length} normalized questions into <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">/questions</span> with strict security rules and zero-latency local catalog cache synchronization.
              </p>
            </div>

            {/* Upload & Academic Configurations */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  Academic Level & Curriculum Configuration
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-white/10">
                  Live Catalog Sync
                </span>
              </div>

              {/* 1. Academic Grade Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Academic Grade / Educational Stage
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  {ACADEMIC_GRADE_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label} — {g.subtitle}
                    </option>
                  ))}
                </select>

                {selectedGrade === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customGradeText}
                      onChange={(e) => setCustomGradeText(e.target.value)}
                      placeholder="Enter custom academic level (e.g. Higher Education Remedial, TVET Level 4)"
                      className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* 2. Stream & Topic Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    Academic Stream / Track
                  </label>
                  <select
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white cursor-pointer"
                  >
                    {STREAM_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    Topic / Core Subject Area
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Classical Mechanics / Differential Calculus"
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 3. Session Year, Duration & Curator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Math.max(1, Number(e.target.value) || 20))}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    Target Exam Session
                  </label>
                  <input
                    type="text"
                    value={targetExamYear}
                    onChange={(e) => setTargetExamYear(e.target.value)}
                    placeholder="2026 (2018 E.C.)"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    Curator / Authority
                  </label>
                  <input
                    type="text"
                    value={curatorName}
                    onChange={(e) => setCuratorName(e.target.value)}
                    placeholder="e.g. Ministry of Education (MoE)"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 5. Curriculum / Verification Tag */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Public Curriculum / Verification Tag
                </label>
                <input
                  type="text"
                  value={adminTag}
                  onChange={(e) => setAdminTag(e.target.value)}
                  placeholder="e.g. Grade 12 National Exam 2026, MoE Official"
                  className="w-full text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-1">
                {/* Instant Official Exams Catalog Sync */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition">
                  <input
                    type="checkbox"
                    checked={asOfficialExam}
                    onChange={(e) => setAsOfficialExam(e.target.checked)}
                    className="mt-0.5 rounded text-zinc-900 focus:ring-zinc-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      Publish to Official Exams Catalog
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black">
                        LIVE
                      </span>
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px] block mt-0.5">
                      Synchronizes instantly to the student Official Exams directory tailored by registered grade (e.g., {effectiveGrade === 'Freshman' ? 'University Freshman' : `Grade ${effectiveGrade}`}).
                    </span>
                  </div>
                </label>

                {/* Individual question storage */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-amber-500/40 transition">
                  <input
                    type="checkbox"
                    checked={uploadIndividualQuestions}
                    onChange={(e) => setUploadIndividualQuestions(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white block">
                      Sync to Global Modular Question Bank (/questions)
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Batch commits all questions so students and teachers can query modular questions by grade, stream, and topic.
                    </span>
                  </div>
                </label>

                {/* Public Availability */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-amber-500/40 transition">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white block">
                      Make Publicly Available to All Students
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Registered students matching this grade limitation can immediately access, practice, and review this exam.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isLoading && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    {progressStatusText || 'Uploading to Cloud Firestore...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {statusMessage && (
              <div className="p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs flex items-start gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-white dark:text-zinc-950 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{statusMessage}</p>
                  <p className="text-[11px] text-zinc-300 dark:text-zinc-600">
                    Exam ID: <span className="font-mono font-bold">{exam.id}</span> • Grade Level: <span className="font-bold">{effectiveGrade === 'Freshman' ? 'University Freshman' : effectiveGrade === 'Senior University' ? 'University Senior' : `Grade ${effectiveGrade}`}</span> • Stream: <span className="font-bold">{selectedStream}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-white/60 dark:border-white/10 bg-white/80 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs"
            >
              {statusMessage ? 'Done' : 'Cancel'}
            </button>

            {isAdmin ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleUploadToFirestore}
                className="px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition active:scale-98"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Upload to Cloud Firestore</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={isSigningIn}
                className="px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSigningIn ? 'Signing In...' : 'Sign In as Admin to Upload'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
