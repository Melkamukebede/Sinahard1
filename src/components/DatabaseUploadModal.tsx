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
  Compass,
  FileText,
  Database,
  Flame,
  Code2,
  Check,
  Zap,
  SlidersHorizontal,
  Copy,
  FileSpreadsheet,
  School,
  UserCheck,
  Building2,
} from 'lucide-react';
import { Exam, AppUser, ExamCategory, CreatedExamType } from '../types';
import {
  uploadExamToFirestore,
  canUserUploadToFirestore,
  inferGrade,
  inferStream,
} from '../services/databaseUpload';
import { ADMIN_EMAIL, isUserAdmin, isUserTeacher } from '../services/db';
import { useAuth } from '../context/AuthContext';

interface DatabaseUploadModalProps {
  exam: Exam | null;
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (exam: Exam, engine: 'firestore') => void;
}

const ACADEMIC_GRADE_OPTIONS = [
  { id: '12', label: 'Grade 12', subtitle: 'National University Entrance Examination (NEAEA / MoE)' },
  { id: 'Freshman', label: 'University Freshman', subtitle: 'Higher Education Remedial & Degree Core' },
  { id: '11', label: 'Grade 11', subtitle: 'Senior Secondary Preparatory Curriculum' },
  { id: '10', label: 'Grade 10', subtitle: 'Secondary General Education' },
  { id: '9', label: 'Grade 9', subtitle: 'Secondary Foundation Curriculum' },
  { id: 'Senior University', label: 'University Senior', subtitle: 'Undergrad Exit & Advanced Degree Exam Prep' },
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

const TIME_PRESETS = [15, 20, 30, 45, 60, 90];

export const DatabaseUploadModal: React.FC<DatabaseUploadModalProps> = ({
  exam,
  user,
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const { signInWithGoogle, isSigningIn, popupBlocked } = useAuth();

  // Active view tab: 'configure' or 'schema_preview'
  const [activeTab, setActiveTab] = useState<'configure' | 'schema_preview'>('configure');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Two-tier Exam category: 'official' (admin-curated) vs 'created' (teacher-created)
  const [uploadCategory, setUploadCategory] = useState<ExamCategory>('official');
  const [schoolName, setSchoolName] = useState<string>('Bole Secondary School');
  const [teacherName, setTeacherName] = useState<string>('Instructor');

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
    } else {
      setSelectedGrade('custom');
      setCustomGradeText(detectedGrade);
    }

    // Infer stream
    const inferred = inferStream(exam.subject, `${exam.name} ${exam.title || ''}`, detectedGrade);
    setSelectedStream((exam as any).stream || inferred);

    // Topic extraction (prioritize clean topic, fallback to name parsing)
    const existingTopic = exam.topic || (exam.metadata?.topic) || '';
    if (existingTopic) {
      setTopic(existingTopic);
    } else if (exam.name.includes(':')) {
      setTopic(exam.name.split(':')[1].trim());
    } else {
      setTopic('');
    }

    // Time limit & exam session year
    setTimeLimit(exam.timeLimit || 20);
    setTargetExamYear((exam as any).targetExamYear || exam.metadata?.targetExamYear || '2026 (2018 E.C.)');

    // Curator & tags
    setCuratorName(
      exam.curator ||
      (detectedGrade === 'Freshman'
        ? 'University Higher Education Mathematics Board'
        : 'Ministry of Education (MoE)')
    );

    setAdminTag(
      exam.adminTag ||
      (detectedGrade === 'Freshman'
        ? 'University Freshman Curriculum'
        : `Grade ${detectedGrade} National Curriculum Exam`)
    );

    // Category initialization
    if (isUserTeacher(user) && !isUserAdmin(user)) {
      setUploadCategory('created');
    } else if (exam.category) {
      setUploadCategory(exam.category);
    } else {
      setUploadCategory('official');
    }

    setSchoolName(user?.school || (exam as any).school || 'Bole Secondary School');
    setTeacherName(user?.teacherName || user?.displayName || (exam as any).teacherName || 'Instructor');

    // Reset status indicators & tab
    setStatusMessage(null);
    setErrorMessage(null);
    setUploadProgress(0);
    setActiveTab('configure');
  }, [exam, isOpen, user]);

  // Adjust suggested stream and curator when grade changes
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

  const effectiveGrade = selectedGrade === 'custom' ? (customGradeText.trim() || 'General') : selectedGrade;

  // Optimized Firestore Payload Preview Generator
  const previewPayload = useMemo(() => {
    if (!exam) return null;
    const examId = exam.id || 'exam_' + Date.now();
    const title = (exam.title || exam.name || 'Official Curriculum Exam').trim();
    const isTeacherExam = uploadCategory === 'created';

    const sanitizedQuestions = (exam.questions || []).map((q, idx) => ({
      id: q.id || `q_${examId}_${idx + 1}`,
      text: q.text,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation || undefined,
    }));

    const metadata = {
      subject: (exam.subject || 'General').trim(),
      grade: effectiveGrade,
      stream: selectedStream,
      topic: topic.trim() || undefined,
      timeLimit: Number(timeLimit) || 20,
      targetExamYear: targetExamYear.trim() || '2026 (2018 E.C.)',
      description: exam.description?.trim() || undefined,
    };

    return {
      id: examId,
      catalogId: exam.catalogId || examId,
      title,
      category: uploadCategory,
      createdType: isTeacherExam ? 'teacher' : undefined,
      school: isTeacherExam ? schoolName.trim() : undefined,
      teacherName: isTeacherExam ? teacherName.trim() : undefined,
      examYear: !isTeacherExam ? targetExamYear.trim() : undefined,
      metadata,
      questionsCount: sanitizedQuestions.length,
      sampleQuestion: sanitizedQuestions[0] || null,
      isPublic,
      sourceType: !isTeacherExam ? 'curated_catalog' : (exam.sourceType || 'user_created'),
    };
  }, [
    exam,
    uploadCategory,
    schoolName,
    teacherName,
    effectiveGrade,
    selectedStream,
    topic,
    timeLimit,
    targetExamYear,
    isPublic,
  ]);

  // Estimated JSON document payload size
  const estimatedPayloadSizeKB = useMemo(() => {
    if (!previewPayload) return '0.0';
    try {
      const bytes = new Blob([JSON.stringify(previewPayload)]).size;
      return (bytes / 1024).toFixed(1);
    } catch {
      return '1.2';
    }
  }, [previewPayload]);

  if (!isOpen || !exam) return null;

  const userIsAdmin = isUserAdmin(user);
  const userIsTeacher = isUserTeacher(user);
  const canUpload = canUserUploadToFirestore(user);
  const userEmail = user?.email || 'Not logged in';

  const handleCopyPayload = () => {
    if (!previewPayload) return;
    navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleUploadToFirestore = async () => {
    if (!canUpload) {
      setErrorMessage(
        `Access Denied: Only Verified Teachers and Administrators (${ADMIN_EMAIL}) can publish to Cloud Firestore. Student study drafts remain local.`
      );
      return;
    }

    if (uploadCategory === 'official' && !userIsAdmin) {
      setErrorMessage(
        `Access Denied: Only the Administrator (${ADMIN_EMAIL}) can publish to the Official Exam Catalog. As a teacher, please select 'School Teacher Exam'.`
      );
      return;
    }

    if (uploadCategory === 'created' && !schoolName.trim()) {
      setErrorMessage('School name is required for school teacher exams.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setUploadProgress(10);
    setProgressStatusText('Initializing connection to Cloud Firestore...');

    try {
      const isOfficial = uploadCategory === 'official';
      const result = await uploadExamToFirestore(exam, user, {
        category: uploadCategory,
        createdType: isOfficial ? undefined : 'teacher',
        school: isOfficial ? undefined : schoolName.trim(),
        teacherName: isOfficial ? undefined : teacherName.trim(),
        examYear: isOfficial ? targetExamYear.trim() : undefined,
        uploadIndividualQuestions,
        isPublic,
        asOfficialExam: isOfficial,
        grade: effectiveGrade,
        topic: topic.trim() || undefined,
        stream: selectedStream,
        adminTag:
          adminTag.trim() ||
          (effectiveGrade === 'Freshman'
            ? 'University Freshman Curriculum'
            : `Grade ${effectiveGrade} Exam`),
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
            category: uploadCategory,
            createdType: isOfficial ? undefined : 'teacher',
            school: isOfficial ? undefined : schoolName.trim(),
            teacherName: isOfficial ? undefined : teacherName.trim(),
            examYear: isOfficial ? targetExamYear.trim() : undefined,
            isUploadedToCloud: true,
            cloudStorageEngine: 'firestore',
            cloudUploadedAt: new Date().toISOString(),
            grade: effectiveGrade,
            topic: topic.trim() || undefined,
            stream: selectedStream,
            curator: curatorName.trim(),
            timeLimit,
            sourceType: isOfficial ? 'curated_catalog' : exam.sourceType,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 14 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl bg-[#f8fafc] dark:bg-[#0c182b] border border-slate-200/90 dark:border-white/10 rounded-[28px] sm:rounded-[32px] shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 backdrop-blur-2xl my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/70 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3 min-w-0">
              {/* App Brand Icon Badge */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-600/20 dark:from-amber-400/20 dark:to-orange-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-5 h-5 fill-amber-500/20" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-['Outfit',sans-serif] truncate">
                    Upload to Cloud Firestore
                  </h3>

                  {/* Firebase Live Status Pill */}
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Firestore (default)
                  </span>

                  {userIsAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      Admin Verified
                    </span>
                  ) : userIsTeacher ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      <UserCheck className="w-3 h-3 text-emerald-500" />
                      Verified Teacher
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                      <Lock className="w-3 h-3 text-amber-500" />
                      Teacher / Admin Access
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Optimized Document Storage • Nested Metadata • Batch /questions Bank
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer shrink-0 ml-2"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-header Tabs: Configuration vs Schema Inspection */}
          <div className="px-5 sm:px-6 pt-2 pb-1 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-slate-100/60 dark:bg-slate-900/30 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('configure')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  activeTab === 'configure'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-white/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                <span>Curriculum & Metadata</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('schema_preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  activeTab === 'schema_preview'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-white/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Inspect Firestore Schema</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  Optimized
                </span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Doc Est:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                ~{estimatedPayloadSizeKB} KB
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Role-based Authorization Banner */}
            {!canUpload ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Teacher or Administrator Authentication Required</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Student Study Drafts</strong> are preserved strictly offline on your local device for privacy, instant practice, and free .txt export. To publish exams to Cloud Firestore for your school students or curriculum catalog, please sign in with a <strong>Verified Teacher</strong> or <strong>Administrator</strong> account.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-amber-500/20">
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Current user: <span className="font-semibold text-slate-800 dark:text-slate-200">{userEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    disabled={isSigningIn}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 transition active:scale-98 shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isSigningIn ? 'Signing In...' : 'Sign In as Teacher/Admin'}</span>
                  </button>
                </div>
                {popupBlocked && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    Google sign-in popup was blocked by your browser. Please allow popups for this site.
                  </p>
                )}
              </div>
            ) : userIsTeacher && !userIsAdmin ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Verified Teacher Publishing Mode</span>
                  <span className="text-slate-600 dark:text-slate-300 block">
                    Your exam will sync to Cloud Firestore under <strong>School: {schoolName || 'Your School'}</strong>. Registered students at your school will access this exam directly.
                  </span>
                </div>
              </div>
            ) : null}

            {/* Exam Diagnostic & Optimization Summary Card */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Target Exam
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                      {effectiveGrade === 'Freshman' ? 'University Freshman' : `Grade ${effectiveGrade}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {selectedStream}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {exam.name}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200/60 dark:border-slate-700">
                  {exam.subject}
                </span>
              </div>

              {/* Metrics audit bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-medium">Questions</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    {diagnostics.total} items
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-medium">Formula Engine</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Binary className="w-3.5 h-3.5 text-blue-500" />
                    {diagnostics.hasMath ? `${diagnostics.mathCount} with LaTeX` : 'Plain Text'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-medium">Pedagogy</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-500" />
                    {diagnostics.withExplanation}/{diagnostics.total} Explained
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-medium">Schema Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Optimized
                  </span>
                </div>
              </div>

              {/* Validation alert if any */}
              {!diagnostics.isValid && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Validation check: {diagnostics.issues[0]}</span>
                </div>
              )}
            </div>

            {/* TAB 1: CURRICULUM CONFIGURATION */}
            {activeTab === 'configure' && (
              <div className="space-y-4">
                {/* Repository Category Selection (Official vs School Teacher) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-500" />
                      <span>Exam Repository Category</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Select catalog destination
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Official Curriculum Exam */}
                    <button
                      type="button"
                      onClick={() => {
                        if (userIsAdmin) {
                          setUploadCategory('official');
                          setAsOfficialExam(true);
                        }
                      }}
                      disabled={!userIsAdmin}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                        uploadCategory === 'official'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm ring-2 ring-amber-500/30'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      } ${!userIsAdmin ? 'opacity-55 cursor-not-allowed' : ''}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-400 dark:text-amber-500 shrink-0" />
                            Official Curriculum Exam
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 dark:text-amber-600 border border-amber-500/30">
                            Admin Curated
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed ${
                            uploadCategory === 'official'
                              ? 'text-slate-300 dark:text-slate-600'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          National Exam (NEAEA / MoE). Cloud-synced for all students nationwide.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono opacity-80 pt-1.5 border-t border-white/10 dark:border-slate-200 flex items-center justify-between">
                        <span>Main Keys:</span>
                        <span className="font-semibold">examYear, subject, grade, stream</span>
                      </div>
                    </button>

                    {/* 2. School Teacher Exam */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadCategory('created');
                        setAsOfficialExam(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                        uploadCategory === 'created'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm ring-2 ring-emerald-500/30'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            <School className="w-4 h-4 text-emerald-400 dark:text-emerald-500 shrink-0" />
                            School Teacher Exam
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 dark:text-emerald-600 border border-emerald-500/30">
                            Teacher Created
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed ${
                            uploadCategory === 'created'
                              ? 'text-slate-300 dark:text-slate-600'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Cloud-synced specifically for registered students at your school with paid access.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono opacity-80 pt-1.5 border-t border-white/10 dark:border-slate-200 flex items-center justify-between">
                        <span>Main Keys:</span>
                        <span className="font-semibold">school, teacherName, grade, subject, topic</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields: Teacher & School Metadata (When School Teacher Exam is selected) */}
                {uploadCategory === 'created' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>School & Teacher Affiliation (Access Keys)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                          School Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g. Bole Secondary School, St. Joseph School"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Teacher / Instructor Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="e.g. Teacher Melkamu, Mr. Bekele"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Firestore Optimization Mapping Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Firebase Cloud Storage Mapping
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold">
                      Collection: /exams
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Writes optimized metadata to <span className="font-mono font-bold text-slate-900 dark:text-white">/exams/{exam.id}</span> with structured metadata. Student exam attempts remain isolated in <span className="font-mono font-bold text-slate-900 dark:text-white">/user_attempts</span>.
                  </p>
                </div>

                {/* 1. Academic Grade Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Academic Grade / Educational Stage</span>
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-medium cursor-pointer"
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
                        placeholder="Enter custom academic level (e.g. TVET Level 4, Engineering Remedial)"
                        className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Stream & Topic Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-blue-500" />
                      Academic Stream / Track
                    </label>
                    <select
                      value={selectedStream}
                      onChange={(e) => setSelectedStream(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white cursor-pointer"
                    >
                      {STREAM_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      Topic / Core Subject Area
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Calculus & Integrals, Electromagnetism"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 3. Duration Presets & Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Time Limit (Minutes)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {timeLimit} min session
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTimeLimit(preset)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          timeLimit === preset
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {preset} min
                      </button>
                    ))}
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Math.max(1, Number(e.target.value) || 20))}
                      className="w-20 text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-center font-bold"
                    />
                  </div>
                </div>

                {/* 4. Session Year & Curator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Target Exam Session
                    </label>
                    <input
                      type="text"
                      value={targetExamYear}
                      onChange={(e) => setTargetExamYear(e.target.value)}
                      placeholder="2026 (2018 E.C.)"
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-purple-500" />
                      Curator / Authority
                    </label>
                    <input
                      type="text"
                      value={curatorName}
                      onChange={(e) => setCuratorName(e.target.value)}
                      placeholder="e.g. Ministry of Education (MoE)"
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2.5 pt-1">
                  {/* Instant Official Exams Catalog Sync */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={asOfficialExam}
                      onChange={(e) => setAsOfficialExam(e.target.checked)}
                      className="mt-0.5 rounded text-slate-900 focus:ring-slate-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Publish to Official Exams Catalog
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-black">
                          LIVE
                        </span>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                        Synchronizes instantly to the student Official Exams directory tailored by grade ({effectiveGrade === 'Freshman' ? 'University Freshman' : `Grade ${effectiveGrade}`}).
                      </span>
                    </div>
                  </label>

                  {/* Individual question storage in /questions */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-amber-500/40 transition">
                    <input
                      type="checkbox"
                      checked={uploadIndividualQuestions}
                      onChange={(e) => setUploadIndividualQuestions(e.target.checked)}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Sync to Global Modular Question Bank (/questions)
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Parallel batch-commits {exam.questions.length} normalized question documents for granular queries.
                      </span>
                    </div>
                  </label>

                  {/* Public Availability */}
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-amber-500/40 transition">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Make Publicly Accessible to Registered Students
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Students in this academic stage can immediately access, practice, and review this curriculum.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: SCHEMA & PAYLOAD INSPECTION */}
            {activeTab === 'schema_preview' && previewPayload && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Optimized Cloud Firestore Document Payload</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Destination: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">/exams/{previewPayload.id}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                {/* JSON Code Viewer */}
                <div className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 leading-relaxed shadow-inner">
                  <pre>{JSON.stringify(previewPayload, null, 2)}</pre>
                </div>

                {/* Optimization Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Nested <strong>metadata</strong> object prevents redundant top-level clutter.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Eliminated deprecated <strong>unit</strong> keys across all schemas.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isLoading && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    {progressStatusText || 'Uploading to Cloud Firestore...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
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
              <div className="p-4 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs flex items-start gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{statusMessage}</p>
                  <p className="text-[11px] text-slate-300 dark:text-slate-600">
                    Exam ID: <span className="font-mono font-bold">{exam.id}</span> • Grade Level: <span className="font-bold">{effectiveGrade === 'Freshman' ? 'University Freshman' : `Grade ${effectiveGrade}`}</span> • Stream: <span className="font-bold">{selectedStream}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-4 border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
            >
              {statusMessage ? 'Done' : 'Cancel'}
            </button>

            {canUpload ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleUploadToFirestore}
                className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition active:scale-98 hover:opacity-95"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>
                      {uploadCategory === 'created'
                        ? 'Publish School Teacher Exam'
                        : 'Upload to Cloud Firestore'}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={isSigningIn}
                className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition active:scale-98 hover:opacity-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSigningIn ? 'Signing In...' : 'Sign In as Teacher/Admin'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
