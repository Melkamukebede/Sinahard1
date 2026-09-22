import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
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
  Code2,
  Check,
  Zap,
  SlidersHorizontal,
  Copy,
  School,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { Exam, AppUser, ExamCategory } from '../types';
import {
  uploadExamToFirestore,
  canUserUploadToFirestore,
  inferGrade,
  inferStream,
} from '../services/databaseUpload';
import { ADMIN_EMAIL, isUserAdmin, isUserTeacher } from '../services/db';
import { useAuth } from '../context/AuthContext';

export interface DatabaseUploadModalProps {
  exam: Exam | null;
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (exam: Exam, engine: 'firestore') => void;
  onOpenRegistrationModal?: () => void;
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
  onOpenRegistrationModal,
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

    // Topic extraction
    const existingTopic = exam.topic || exam.metadata?.topic || '';
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
        ? 'University Higher Education Board'
        : 'Ministry of Education (MoE)')
    );

    setAdminTag(
      exam.adminTag ||
      (detectedGrade === 'Freshman'
        ? 'University Freshman Curriculum'
        : `Grade ${detectedGrade} National Curriculum Exam`)
    );

    // Category initialization based on role
    if (isUserTeacher(user) && !isUserAdmin(user)) {
      setUploadCategory('created');
    } else if (exam.category) {
      setUploadCategory(exam.category);
    } else {
      setUploadCategory('official');
    }

    setSchoolName(user?.school || user?.schoolName || (exam as any).school || 'Bole Secondary School');
    setTeacherName(user?.teacherName || user?.displayName || (exam as any).teacherName || 'Instructor');

    // Reset status indicators
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
        setCuratorName('University Higher Education Board');
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
      const text = `${q.question} ${q.options?.join(' ') || ''}`;
      if (text.includes('$') || text.includes('\\') || text.includes('^') || text.includes('_')) {
        mathCount++;
      }
      if (q.explanation && q.explanation.trim().length > 5) {
        withExplanation++;
      }
      if (!q.options || q.options.length < 2) {
        issues.push(`Question #${idx + 1} has insufficient options.`);
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

  const effectiveGrade = selectedGrade === 'custom' ? customGradeText.trim() || '12' : selectedGrade;

  // Real-time Preview Document Payload for Cloud Firestore
  const previewPayload = useMemo(() => {
    if (!exam) return null;
    const isTeacherExam = uploadCategory === 'created';

    return {
      id: exam.id,
      name: exam.name,
      title: exam.name,
      subject: exam.subject,
      grade: effectiveGrade,
      stream: selectedStream,
      topic: topic.trim() || undefined,
      category: uploadCategory,
      createdType: isTeacherExam ? 'teacher' : undefined,
      school: isTeacherExam ? schoolName.trim() : undefined,
      teacherName: isTeacherExam ? teacherName.trim() : undefined,
      examYear: !isTeacherExam ? targetExamYear.trim() : undefined,
      timeLimit,
      totalQuestions: exam.questions?.length || 0,
      curator: curatorName.trim(),
      adminTag: adminTag.trim(),
      metadata: {
        academicStage: effectiveGrade === 'Freshman' ? 'Higher Education' : `Grade ${effectiveGrade}`,
        examCategory: uploadCategory,
        schoolAffiliation: isTeacherExam ? schoolName.trim() : 'National Public Access',
        subject: exam.subject,
        stream: selectedStream,
        hasFormulas: diagnostics.hasMath,
        explanationsCount: diagnostics.withExplanation,
        version: '2.0.0',
        platform: 'Sinahard Ethiopian Exam System',
      },
      isPublic,
      sourceType: !isTeacherExam ? 'curated_catalog' : exam.sourceType || 'user_created',
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
    diagnostics,
    curatorName,
    adminTag,
  ]);

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
  const userEmail = user?.email || 'Guest / Local Student';

  const handleCopyPayload = () => {
    if (!previewPayload) return;
    navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleUploadToFirestore = async () => {
    if (!canUpload) {
      setErrorMessage(
        `Access Notice: Only Verified Teachers and Administrators (${ADMIN_EMAIL}) publish to Cloud Firestore. Student practice quizzes remain safely local on your device.`
      );
      return;
    }

    if (uploadCategory === 'official' && !userIsAdmin) {
      setErrorMessage(
        `Only the Administrator (${ADMIN_EMAIL}) can publish to the Official National Catalog. As a teacher, please select 'School Teacher Exam'.`
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
    setProgressStatusText('Connecting to Cloud Firestore database...');

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
          },
          'firestore'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload exam to Cloud Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl bg-white dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 rounded-[32px] sm:rounded-[36px] shadow-2xl overflow-hidden text-zinc-900 dark:text-white my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header - Generous Padding, Black Icons */}
          <div className="p-6 sm:p-7 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/60 dark:bg-white/[0.02]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-black dark:text-white flex items-center justify-center shrink-0 shadow-xs">
                <Database className="w-6 h-6 text-black dark:text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white font-['Outfit',sans-serif] tracking-tight">
                    Upload to Cloud Firestore
                  </h3>

                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Firestore Live Database
                  </span>

                  {userIsAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-white dark:text-zinc-950" />
                      Admin Verified
                    </span>
                  ) : userIsTeacher ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      <UserCheck className="w-3.5 h-3.5 text-black dark:text-white" />
                      School Teacher
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shrink-0">
                      <Lock className="w-3 h-3 text-black dark:text-white" />
                      Teacher & Admin Space
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                  Structured Exam Catalog • Direct School Linking • /questions Subcollection
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0 ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>

          {/* Sub-header Tabs with Ample Padding */}
          <div className="px-6 sm:px-7 py-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-[#0c182b] text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('configure')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'configure'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-inherit" />
                <span>Curriculum & School Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('schema_preview')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'schema_preview'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                }`}
              >
                <Code2 className="w-4 h-4 text-inherit" />
                <span>Inspect Firestore Payload</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Doc Est:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-white">
                ~{estimatedPayloadSizeKB} KB
              </span>
            </div>
          </div>

          {/* Main Scrollable Content Area with Generous Spacing */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Student Role Notice - Direct Role Switcher */}
            {!canUpload && (
              <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                  <Lock className="w-4 h-4 text-black dark:text-white shrink-0" />
                  <span>Student Drafts are Local-First</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Student-authored practice tests remain securely stored on your local browser for instant offline practice and free plain-text exports. If you are an educator or administrator uploading exams for your school or students, please register or sign in as a <strong>Teacher</strong> or <strong>Admin</strong>.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    Logged in as: <span className="font-bold text-zinc-800 dark:text-zinc-200">{userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenRegistrationModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenRegistrationModal();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold text-xs cursor-pointer transition"
                      >
                        <UserPlus className="w-4 h-4 text-black dark:text-white" />
                        <span>Switch Role in App</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => signInWithGoogle()}
                      disabled={isSigningIn}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 transition active:scale-98"
                    >
                      <LogIn className="w-4 h-4 text-white dark:text-zinc-950" />
                      <span>{isSigningIn ? 'Signing In...' : 'Sign In with Google'}</span>
                    </button>
                  </div>
                </div>
                {popupBlocked && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    Popup was blocked. Please allow browser popups for Google sign-in.
                  </p>
                )}
              </div>
            )}

            {userIsTeacher && !userIsAdmin && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 flex items-start gap-3 text-xs leading-relaxed">
                <UserCheck className="w-5 h-5 text-black dark:text-white shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-sm block text-zinc-900 dark:text-white">
                    School Teacher Publishing Mode Active
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    This exam will be uploaded to Cloud Firestore and tagged for <strong>{schoolName || 'Your School'}</strong>. Registered students at your school will automatically find it in their School Teacher Library.
                  </p>
                </div>
              </div>
            )}

            {/* Diagnostic Card with Black Icons and Generous Inner Spacing */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-black dark:text-white" />
                      Target Exam
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {effectiveGrade === 'Freshman' ? 'University Freshman' : `Grade ${effectiveGrade}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {selectedStream}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white truncate">
                    {exam.name}
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shrink-0 border border-zinc-200 dark:border-zinc-700">
                  {exam.subject}
                </span>
              </div>

              {/* Metrics audit bar - All Black Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] block font-medium">Questions</span>
                  <span className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 mt-1 text-sm">
                    <Layers className="w-4 h-4 text-black dark:text-white" />
                    {diagnostics.total} items
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] block font-medium">Math Engine</span>
                  <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-1 text-sm">
                    <Binary className="w-4 h-4 text-black dark:text-white" />
                    {diagnostics.hasMath ? `${diagnostics.mathCount} LaTeX` : 'Plain Text'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] block font-medium">Step Explanations</span>
                  <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-1 text-sm">
                    <FileCheck2 className="w-4 h-4 text-black dark:text-white" />
                    {diagnostics.withExplanation}/{diagnostics.total}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] block font-medium">Database Target</span>
                  <span className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 mt-1 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                    Firestore
                  </span>
                </div>
              </div>
            </div>

            {/* TAB 1: CURRICULUM CONFIGURATION */}
            {activeTab === 'configure' && (
              <div className="space-y-6">
                {/* Repository Category Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-black dark:text-white" />
                      <span>Exam Target Category</span>
                    </label>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Two-tier repository routing
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Official Curriculum Exam */}
                    <button
                      type="button"
                      onClick={() => {
                        if (userIsAdmin) {
                          setUploadCategory('official');
                        }
                      }}
                      disabled={!userIsAdmin}
                      className={`p-4 sm:p-5 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                        uploadCategory === 'official'
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-md'
                          : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400'
                      } ${!userIsAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-inherit" />
                            Official Curriculum Exam
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/80 text-inherit border border-current">
                            Admin Curated
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${uploadCategory === 'official' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          Public national exam (MoE / NEAEA) visible to all students across Ethiopia.
                        </p>
                      </div>
                      {!userIsAdmin && (
                        <div className="text-[10px] font-semibold text-zinc-400">
                          Requires Admin Authentication
                        </div>
                      )}
                    </button>

                    {/* School Teacher Exam */}
                    <button
                      type="button"
                      onClick={() => setUploadCategory('created')}
                      className={`p-4 sm:p-5 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                        uploadCategory === 'created'
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-md'
                          : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-sm flex items-center gap-2">
                            <School className="w-4 h-4 text-inherit" />
                            School Teacher Exam
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/80 text-inherit border border-current">
                            Teacher Created
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${uploadCategory === 'created' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          Scoped to your school and grade. Students registered under your school can access and practice it.
                        </p>
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {userIsTeacher ? 'Authorized for School Teachers' : 'Requires Teacher Profile'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* School Details (for School Teacher Exams) */}
                {uploadCategory === 'created' && (
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <School className="w-4 h-4 text-black dark:text-white" />
                      <span>School & Teacher Attribution</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          School Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g., Bole Secondary School, Hawassa High School"
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Teacher / Department Name
                        </label>
                        <input
                          type="text"
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="e.g., Mr. Kebede / Physics Dept"
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Academic Grade and Stream Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-black dark:text-white" />
                      <span>Academic Grade Level</span>
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => handleGradeChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {ACADEMIC_GRADE_OPTIONS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-black dark:text-white" />
                      <span>Academic Stream</span>
                    </label>
                    <select
                      value={selectedStream}
                      onChange={(e) => setSelectedStream(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {STREAM_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Exam Session Year and Topic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-black dark:text-white" />
                      <span>Exam Session Year</span>
                    </label>
                    <input
                      type="text"
                      value={targetExamYear}
                      onChange={(e) => setTargetExamYear(e.target.value)}
                      placeholder="e.g. 2026 (2018 E.C.)"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-black dark:text-white" />
                      <span>Standard Time Limit (Minutes)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {TIME_PRESETS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTimeLimit(t)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            timeLimit === t
                              ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white'
                              : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                          }`}
                        >
                          {t}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SCHEMA PREVIEW */}
            {activeTab === 'schema_preview' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-black dark:text-white" />
                      <span>Firestore Collection: /exams/{exam.id}</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Standard JSON document stored with nested metadata and clean schema keys.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-black dark:text-white" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 border border-zinc-800 leading-relaxed shadow-inner">
                  <pre>{JSON.stringify(previewPayload, null, 2)}</pre>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                    <span>Metadata object separates administrative and classification tags cleanly.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                    <span>Eliminated deprecated keys and normalized LaTeX formula strings.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress indicator */}
            {isLoading && (
              <div className="space-y-3 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-black dark:text-white" />
                    {progressStatusText || 'Uploading to Cloud Firestore...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-950 dark:bg-white rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Errors */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success */}
            {statusMessage && (
              <div className="p-5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs flex items-start gap-3 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">{statusMessage}</p>
                  <p className="text-zinc-300 dark:text-zinc-600">
                    Exam ID: <span className="font-mono font-bold">{exam.id}</span> • Category: <span className="font-bold">{uploadCategory === 'official' ? 'Official Curriculum' : `School Teacher (${schoolName})`}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions - 2:1 horizontal:vertical padding */}
          <div className="p-6 sm:p-7 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              {statusMessage ? 'Done' : 'Cancel'}
            </button>

            {canUpload ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleUploadToFirestore}
                className="px-7 py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition active:scale-98 hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white dark:text-zinc-950" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4 text-white dark:text-zinc-950" />
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
                className="px-7 py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition active:scale-98"
              >
                <LogIn className="w-4 h-4 text-white dark:text-zinc-950" />
                <span>{isSigningIn ? 'Signing In...' : 'Sign In as Teacher/Admin'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DatabaseUploadModal;
