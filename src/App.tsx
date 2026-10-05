import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Navbar, PageTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { FilesView } from './components/FilesView';
import { ResultsView } from './components/ResultsView';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { AppDrawer } from './components/AppDrawer';
import { MobileNav } from './components/MobileNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { CURATED_EXAMS_CATALOG } from './data/curatedCatalog';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Play, AlertCircle, Loader2 } from 'lucide-react';
import { extractTargetExamId, resolveExamForPractice } from './services/shareService';
import { addToSharedHistory } from './services/sharedHistoryService';
import {
  Exam,
  ExamResult,
  Question,
  UserSubscription,
} from './types';
import {
  subscribeToExams,
  subscribeToResults,
  saveExamToDb,
  deleteExamFromDb,
  saveResultToDb,
  deleteResultFromDb,
  clearAllResultsFromDb,
  subscribeToUserSubscription,
  subscribeToAllSubscriptions,
  isUserAdmin,
  isUserTeacher,
  isTeacherVerified,
  verifySubscriptionByTxRef,
  INITIAL_SAMPLE_EXAMS,
  saveLocalExams,
} from './services/db';
import { verifyChapaTransaction } from './services/chapa';
import { verifyTelebirrPayment } from './services/telebirr';
import { getUserTierStatus } from './services/subscriptionLimits';
import {
  subscribeToOfficialExams,
  getCachedOfficialExams,
} from './services/officialExams';
import {
  isAppOffline,
  subscribeToNetworkState,
  enforceOfflineExamCreation,
  enforceOfflineExamPractice,
  enforceOfflineQuestionImport,
} from './firebase';
import {
  warmUpAppModules,
  prefetchCreateWizard,
  prefetchPracticeModal,
  prefetchPasteModal,
  prefetchProfessorModal,
  prefetchCuratedModal,
} from './services/prefetch';

// Robust dynamic import with automatic retry on network/chunk hiccups
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      console.warn('Dynamic chunk import error, retrying...', err);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return await factory();
    }
  });
}

// Code-split heavy modals and secondary views with automatic retry for resilience
const CreateExamWizard = lazyWithRetry(() =>
  import('./components/CreateExamWizard').then((m) => ({ default: m.CreateExamWizard }))
);
const PracticeModal = lazyWithRetry(() =>
  import('./components/PracticeModal').then((m) => ({ default: m.PracticeModal }))
);
const PasteJsonModal = lazyWithRetry(() =>
  import('./components/PasteJsonModal').then((m) => ({ default: m.PasteJsonModal }))
);
const ProfessorModal = lazyWithRetry(() =>
  import('./components/ProfessorModal').then((m) => ({ default: m.ProfessorModal }))
);
const NotificationSettingsModal = lazyWithRetry(() =>
  import('./components/NotificationSettingsModal').then((m) => ({ default: m.NotificationSettingsModal }))
);
const ManualView = lazyWithRetry(() =>
  import('./components/ManualView').then((m) => ({ default: m.ManualView }))
);
const SubscriptionModal = lazyWithRetry(() =>
  import('./components/SubscriptionModal').then((m) => ({ default: m.SubscriptionModal || m.default }))
);
const AdminSubscriptionsView = lazyWithRetry(() =>
  import('./components/AdminSubscriptionsView').then((m) => ({ default: m.AdminSubscriptionsView }))
);
const SharedHistoryView = lazyWithRetry(() =>
  import('./components/SharedHistoryView').then((m) => ({ default: m.SharedHistoryView }))
);
const CuratedExamsModal = lazyWithRetry(() =>
  import('./components/CuratedExamsModal').then((m) => ({ default: m.CuratedExamsModal }))
);
const DatabaseUploadModal = lazyWithRetry(() =>
  import('./components/DatabaseUploadModal').then((m) => ({ default: m.DatabaseUploadModal }))
);
const UserRegistrationModal = lazyWithRetry(() =>
  import('./components/UserRegistrationModal').then((m) => ({ default: m.UserRegistrationModal }))
);
import { TeacherPendingVerificationView } from './components/TeacherPendingVerificationView';
import { AppSplashScreen } from './components/AppSplashScreen';

// Instant Skeleton UI for CreateExamWizard while dynamic module is hydrating
const CreateExamSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="h-28 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800" />
      <div className="h-28 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800" />
    </div>
    <div className="h-64 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      <span className="text-xs font-medium text-zinc-500">Preparing Create Exam Studio...</span>
    </div>
  </div>
);

// Instant Modal Backdrop and Shell for PracticeModal respecting current light/dark theme
const PracticeModalLoadingFallback: React.FC<{ examName?: string }> = ({ examName }) => (
  <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
    <div className="bg-white dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center text-zinc-900 dark:text-white">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-[#0f1d33] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center mb-4 text-zinc-900 dark:text-white shadow-xs">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500 dark:text-emerald-400" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
        Launching Practice Session
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-3 font-medium">
        {examName || 'Loading questions...'}
      </p>
      <div className="w-full bg-zinc-100 dark:bg-[#0f1d33] h-1.5 rounded-full overflow-hidden">
        <div className="bg-zinc-900 dark:bg-white h-full w-2/3 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

function MainApp() {
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const handleSplashComplete = useCallback(() => {
    setShowSplashScreen(false);
  }, []);
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    signOut,
    isRegistrationModalOpen,
    openRegistrationModal,
    closeRegistrationModal,
    refreshUserProfile,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<PageTab>('home');
  const [exams, setExams] = useState<Exam[]>(INITIAL_SAMPLE_EXAMS);
  const [officialExams, setOfficialExams] = useState<Exam[]>(getCachedOfficialExams());
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<UserSubscription[]>([]);

  // User freemium / trial status computation (Option 3: 5-Day Trial then 20 manual / 15 import limit)
  const userCreatedAt = user?.metadata?.creationTime;
  const userTier = getUserTierStatus(user, activeSubscription, userCreatedAt);
  const isAdmin = Boolean(user && !user.isAnonymous && user.uid !== 'guest' && isUserAdmin(user));
  const isTeacher = Boolean(user && isUserTeacher(user));
  const isVerifiedTeacher = Boolean(user && isTeacherVerified(user));
  // CRITICAL: Teacher is only unverified if auth is finished loading, user is logged in, and they are genuinely unverified
  const isUnverifiedTeacher = Boolean(!authLoading && user && user.role === 'teacher' && !isVerifiedTeacher && !isAdmin);

  // If teacher, disallow results tab or payment modals
  useEffect(() => {
    if (isTeacher && activeTab === 'results') {
      setActiveTab('home');
    }
  }, [isTeacher, activeTab]);

  // Active exam for practice / editing
  const [activePracticeExam, setActivePracticeExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [createExamInitialMode, setCreateExamInitialMode] = useState<'select' | 'manual' | 'paste'>('select');

  // Network and Firebase offline tracking
  const [isOffline, setIsOffline] = useState<boolean>(() => isAppOffline());
  useEffect(() => {
    return subscribeToNetworkState((offline) => {
      setIsOffline(offline);
    });
  }, []);

  // Warm up dynamic chunks in the background so clicks to Create, Practice, and modals are 0ms instant
  useEffect(() => {
    warmUpAppModules();
  }, []);

  // Modals
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCuratedModalOpen, setIsCuratedModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [examForDatabaseUpload, setExamForDatabaseUpload] = useState<Exam | null>(null);

  // Delete confirmations
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct Practice Mode launch states for shared links (?id=... or ?examId=...)
  const [isOpeningPracticeLink, setIsOpeningPracticeLink] = useState<boolean>(() => {
    return !!extractTargetExamId();
  });
  const [practiceLinkStatus, setPracticeLinkStatus] = useState<string>('Preparing Practice Mode...');
  const [practiceLinkError, setPracticeLinkError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Listen for LaTeX copy events across mobile and desktop
  useEffect(() => {
    const handleLatexCopied = (e: Event) => {
      const custom = e as CustomEvent<{ text: string; format: string }>;
      if (custom.detail?.text) {
        const text = custom.detail.text.trim();
        const preview = text.length > 36 ? text.slice(0, 33) + '...' : text;
        showToast(`📋 Copied LaTeX: ${preview}`);
      }
    };
    window.addEventListener('latex-copied', handleLatexCopied);
    return () => window.removeEventListener('latex-copied', handleLatexCopied);
  }, []);

  const handleOpenQuestionTextEditor = () => {
    setIsProfessorModalOpen(false);
    setIsPasteModalOpen(false);
    setIsDrawerOpen(false);
    setEditingExam(null);
    setCreateExamInitialMode('paste');
    setActiveTab('create');
  };

  const handleExportAllData = () => {
    try {
      const data = {
        version: '2.1',
        exportedAt: new Date().toISOString(),
        exams,
        results,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sinahard-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data backup downloaded successfully!');
    } catch {
      showToast('Failed to export backup data.');
    }
  };

  const handleResetDefaultExams = async () => {
    try {
      saveLocalExams(INITIAL_SAMPLE_EXAMS);
      setExams(INITIAL_SAMPLE_EXAMS);
      showToast('Sample curriculum exams restored!');
    } catch {
      showToast('Failed to restore sample exams.');
    }
  };

  // Real-time synchronization for exams
  useEffect(() => {
    const unsubExams = subscribeToExams(user, (updatedExams) => {
      setExams(updatedExams);
    });
    return () => unsubExams();
  }, [user]);

  // Real-time synchronization for Official / Curated Curriculum Exams
  useEffect(() => {
    const unsubOfficial = subscribeToOfficialExams((updatedOfficial) => {
      setOfficialExams(updatedOfficial);
    });
    return () => unsubOfficial();
  }, []);

  // Real-time synchronization for results
  useEffect(() => {
    const unsubResults = subscribeToResults(user, (updatedResults) => {
      setResults(updatedResults);
    });
    return () => unsubResults();
  }, [user]);

  // Real-time synchronization for current student subscription
  useEffect(() => {
    const unsubSub = subscribeToUserSubscription(user, (sub) => {
      setActiveSubscription(sub);
    });
    return () => unsubSub();
  }, [user]);

  // Real-time synchronization for admin subscriptions panel
  useEffect(() => {
    if (isUserAdmin(user)) {
      const unsubAll = subscribeToAllSubscriptions(user, (all) => {
        setAllSubscriptions(all);
      });
      return () => unsubAll();
    }
  }, [user]);

  // Handle return redirect from Chapa hosted checkout (?chapa_verify=TX_REF)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('chapa_verify');
    if (txRef) {
      verifyChapaTransaction(txRef).then(async (res) => {
        if (res.verified) {
          const activated = await verifySubscriptionByTxRef(txRef, user || null);
          if (activated) {
            setActiveSubscription(activated);
          }
          setIsSubscriptionModalOpen(false);
          showToast('Payment successfully verified with Chapa! Premium membership active.');
        } else {
          showToast(
            res.message ||
              `Payment status: ${res.data?.status || 'pending'}. Complete payment on Chapa to activate.`
          );
        }
      });
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Handle return redirect from Telebirr developer checkout (?telebirr_verify=TRADE_NO)
    const telebirrTradeNo = params.get('telebirr_verify');
    if (telebirrTradeNo) {
      verifyTelebirrPayment(telebirrTradeNo).then(async (res) => {
        if (res.verified) {
          const activated = await verifySubscriptionByTxRef(telebirrTradeNo, user || null);
          if (activated) {
            setActiveSubscription(activated);
          }
          setIsSubscriptionModalOpen(false);
          showToast('🎉 Telebirr payment successfully verified! Premium membership active.');
        } else {
          showToast(res.message || 'Telebirr payment is pending or incomplete.');
        }
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  // Handle shared exam links: directly launch into Practice Mode immediately (?id=... or ?examId=... or path)
  useEffect(() => {
    const targetId = extractTargetExamId();
    if (!targetId) {
      setIsOpeningPracticeLink(false);
      return;
    }

    let isMounted = true;
    setIsOpeningPracticeLink(true);
    setPracticeLinkStatus(`Loading exam "${targetId}" for practice...`);
    setPracticeLinkError(null);

    resolveExamForPractice(targetId, {
      currentExams: exams,
      onStatus: (status) => {
        if (isMounted) setPracticeLinkStatus(status);
      },
    })
      .then(async (resolvedExam) => {
        if (!isMounted) return;
        if (resolvedExam && resolvedExam.questions && resolvedExam.questions.length > 0) {
          // Save exam to user's local database so they keep it permanently
          try {
            await saveExamToDb(resolvedExam, user);
          } catch {
            // Ignore storage errors
          }

          // Add to Shared History
          addToSharedHistory(resolvedExam, 'accessed_by_me');

          // Directly launch in Practice Mode
          setActivePracticeExam(resolvedExam);
          setIsOpeningPracticeLink(false);
          showToast(`🎯 Practice Mode: "${resolvedExam.name}"`);

          // Clean URL state without browser reload
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          setIsOpeningPracticeLink(false);
          setPracticeLinkError(
            `Exam "${targetId}" was not found in the cloud library. The author may need to open the exam and tap Share to complete the cloud sync.`
          );
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not launch direct practice mode for exam:', err);
        setIsOpeningPracticeLink(false);
        const errorText = err instanceof Error ? err.message : String(err);
        if (errorText.includes('offline') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
          setPracticeLinkError(
            'Unable to load shared exam because you appear to be offline. Please check your internet connection and try again.'
          );
        } else {
          setPracticeLinkError(
            `Exam "${targetId}" could not be found in the cloud library. Please ensure the author uploaded the exam via the Share menu.`
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to popstate/hashchange so clicking or navigating to a shared exam link inside the app also triggers Practice Mode
  useEffect(() => {
    const handleUrlChange = () => {
      const targetId = extractTargetExamId();
      if (targetId && !activePracticeExam) {
        setIsOpeningPracticeLink(true);
        setPracticeLinkStatus(`Opening exam "${targetId}" in Practice Mode...`);
        resolveExamForPractice(targetId, { currentExams: exams })
          .then(async (resolved) => {
            if (resolved && resolved.questions && resolved.questions.length > 0) {
              try {
                await saveExamToDb(resolved, user);
              } catch {
                // Ignore storage errors
              }
              addToSharedHistory(resolved, 'accessed_by_me');
              setActivePracticeExam(resolved);
              setIsOpeningPracticeLink(false);
              showToast(`🎯 Practice Mode: "${resolved.name}"`);
              window.history.replaceState({}, '', window.location.pathname);
            }
          })
          .catch(() => setIsOpeningPracticeLink(false));
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [exams, user, activePracticeExam]);

  // Actions
  const handleStartPractice = (exam: Exam) => {
    // Enforce Free/Guest limits when offline
    const result = enforceOfflineExamPractice(exam, user, activeSubscription);
    if (result.wasCapped && result.notice) {
      showToast(result.notice);
    }
    setActivePracticeExam(result.practiceExam);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setCreateExamInitialMode('manual');
    setActiveTab('create');
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    const id = examToDelete;
    // Optimistic UI update instantly
    setExams((prev) => prev.filter((e) => e.id !== id));
    setExamToDelete(null);
    try {
      await deleteExamFromDb(id, user);
      showToast('Exam removed from library');
    } catch {
      showToast('Failed to delete exam');
    }
  };

  const handleSaveExam = async (exam: Exam) => {
    // Strictly enforce Free/Guest limit (20 questions) if offline to prevent unauthorized excess usage
    const enforcement = enforceOfflineExamCreation(exam, user, userTier);
    const examToSave = enforcement.clampedExam;

    if (enforcement.wasClamped && enforcement.warning) {
      showToast(enforcement.warning);
    }

    // Optimistic UI update instantly
    setExams((prev) => {
      const idx = prev.findIndex((e) => e.id === examToSave.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = examToSave;
        return next;
      }
      return [examToSave, ...prev];
    });
    setEditingExam(null);
    setActiveTab('files');

    try {
      await saveExamToDb(examToSave, user);
      showToast(enforcement.wasClamped ? 'Exam saved (capped to 20 questions offline)' : 'Exam saved to your library!');
    } catch {
      showToast('Failed to save exam');
    }
  };

  const handleAddQuestionsFromPaste = async (newQuestions: Question[]) => {
    // Enforce offline Free/Guest import limits if network unavailable
    const enforcement = enforceOfflineQuestionImport(newQuestions, user, userTier.isPremium);
    const questionsToAdd = enforcement.allowedQuestions;

    if (enforcement.wasCapped && enforcement.message) {
      showToast(enforcement.message);
    } else if (!userTier.isPremium && questionsToAdd.length > userTier.maxImportQuestions) {
      showToast(
        `Imported first ${userTier.maxImportQuestions} questions (${
          userTier.isTrial ? '5-Day Trial' : 'Free'
        } limit). Upgrade to Premium for unlimited imports.`
      );
    }

    if (activeTab === 'create' && editingExam) {
      // Add questions to the currently editing exam
      const updated = {
        ...editingExam,
        questions: [...editingExam.questions, ...questionsToAdd],
      };
      setEditingExam(updated);
      showToast(`Added ${questionsToAdd.length} questions to draft.`);
    } else {
      // Create a brand new exam draft with these questions
      const newDraft: Exam = {
        id: 'exam_' + Date.now(),
        name: 'Imported Exam (' + new Date().toLocaleDateString() + ')',
        title: 'Imported Exam',
        subject: 'General',
        timeLimit: 25,
        questions: questionsToAdd,
        createdAt: new Date().toISOString(),
      };
      setExams((prev) => [newDraft, ...prev]);
      await saveExamToDb(newDraft, user);
      showToast(`Imported ${questionsToAdd.length} questions into new exam!`);
      setEditingExam(newDraft);
      setActiveTab('create');
    }
  };

  const handleSubmitResult = async (result: ExamResult) => {
    const resWithId: ExamResult = {
      ...result,
      id: result.id || 'res_' + Date.now(),
      userId: user ? user.uid : 'guest',
    };
    // Optimistic UI update instantly
    setResults((prev) => [resWithId, ...prev]);
    setActivePracticeExam(null);
    setActiveTab('results');
    showToast(`Exam completed! Score: ${result.percentage}%`);

    try {
      await saveResultToDb(resWithId, user);
    } catch {
      showToast('Failed to save result record');
    }
  };

  const handleDeleteResult = async (resultId: string | number) => {
    // Optimistic UI update instantly
    setResults((prev) => prev.filter((r) => String(r.id) !== String(resultId)));
    try {
      await deleteResultFromDb(resultId, user);
      showToast('Result removed from history');
    } catch {
      showToast('Failed to remove result');
    }
  };

  const handleClearAllResults = async () => {
    // Optimistic UI update instantly
    setResults([]);
    try {
      await clearAllResultsFromDb(user);
      showToast('Practice history cleared');
    } catch {
      showToast('Failed to clear history');
    }
  };

  const handleDownloadCuratedExam = async (catalogExam: Exam) => {
    const newDownloadedExam: Exam = {
      ...catalogExam,
      id: `downloaded_${catalogExam.id}`,
      catalogId: catalogExam.id,
      name: catalogExam.name || catalogExam.title || 'Official Curriculum Exam',
      title: catalogExam.title || catalogExam.name,
      sourceType: 'curated_catalog',
      isDownloaded: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveExamToDb(newDownloadedExam, user);
    showToast(`Exam "${catalogExam.title || catalogExam.name}" downloaded to your repository!`);
  };

  const downloadedCatalogIds = exams
    .filter((e) => e.isDownloaded || e.sourceType === 'curated_catalog')
    .map((e) => e.catalogId || e.id);

  return (
    <>
      {showSplashScreen && (
        <AppSplashScreen onComplete={handleSplashComplete} />
      )}

      {isUnverifiedTeacher && user ? (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#070e1a] text-zinc-950 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
          <Suspense fallback={null}>
            <TeacherPendingVerificationView
              user={user}
              onSignOut={signOut}
              onOpenRegistrationModal={openRegistrationModal}
              onRefreshStatus={refreshUserProfile}
            />
            <UserRegistrationModal
              isOpen={isRegistrationModalOpen}
              onClose={closeRegistrationModal}
              onSuccess={() => {
                showToast('Profile updated successfully!');
              }}
            />
          </Suspense>
          {toastMessage && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold font-['Syne',sans-serif] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
              {toastMessage}
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors font-['Plus_Jakarta_Sans',sans-serif] selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950 relative">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'create') {
            setEditingExam(null);
            setCreateExamInitialMode('select');
          }
          setActiveTab(tab);
        }}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenSubscriptionModal={isTeacher ? undefined : () => setIsSubscriptionModalOpen(true)}
        activeSubscription={activeSubscription}
      />

    {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 md:pb-8">
        <PWAInstallBanner />
        {activeTab === 'home' && (
          <HomeView
            exams={exams}
            results={results}
            onNavigate={(tab) => {
              if (tab !== 'create') {
                setEditingExam(null);
                setCreateExamInitialMode('select');
              }
              setActiveTab(tab);
            }}
            onStartPractice={handleStartPractice}
            onOpenPasteModal={handleOpenQuestionTextEditor}
            onOpenProfessorModal={() => setIsProfessorModalOpen(true)}
            onOpenSubscriptionModal={isTeacher ? undefined : () => setIsSubscriptionModalOpen(true)}
            onOpenCuratedModal={() => setIsCuratedModalOpen(true)}
            onOpenRegistrationModal={openRegistrationModal}
            onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
            activeSubscription={activeSubscription}
            userTier={userTier}
            user={user}
            isAdmin={isAdmin}
            onOpenDatabaseUpload={(isAdmin || isTeacher) ? (exam) => setExamForDatabaseUpload(exam) : undefined}
            onEditExam={handleEditExam}
            onDeleteExam={(id) => setExamToDelete(id)}
          />
        )}

        {activeTab === 'files' && (
          <FilesView
            exams={exams}
            onStartPractice={handleStartPractice}
            onEditExam={handleEditExam}
            onDeleteExam={(id) => setExamToDelete(id)}
            onCreateNew={() => {
              setEditingExam(null);
              setCreateExamInitialMode('select');
              setActiveTab('create');
            }}
            onOpenCuratedCatalogModal={() => setIsCuratedModalOpen(true)}
            onOpenDatabaseUpload={(isAdmin || isTeacher) ? (exam) => setExamForDatabaseUpload(exam) : undefined}
            isAdmin={isAdmin}
            user={user}
          />
        )}

        {activeTab === 'results' && !isTeacher && (
          <ResultsView
            results={results}
            onDeleteResult={handleDeleteResult}
            onClearAllResults={handleClearAllResults}
            onNavigateToFiles={() => setActiveTab('files')}
          />
        )}

        {activeTab === 'create' && (
          <Suspense fallback={<CreateExamSkeleton />}>
            <CreateExamWizard
              key={editingExam ? `edit_${editingExam.id}` : `new_${createExamInitialMode}`}
              initialExam={editingExam}
              initialMode={editingExam ? 'manual' : createExamInitialMode}
              onSaveExam={handleSaveExam}
              onCancel={() => {
                setEditingExam(null);
                setCreateExamInitialMode('select');
                setActiveTab('files');
              }}
              onOpenPasteModal={() => setIsPasteModalOpen(true)}
              onOpenProfessorModal={() => setIsProfessorModalOpen(true)}
              userTier={userTier}
              onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              onOpenDatabaseUpload={(isAdmin || Boolean(user && isUserTeacher(user))) ? (exam) => setExamForDatabaseUpload(exam) : undefined}
              isAdmin={isAdmin}
              user={user}
            />
          </Suspense>
        )}

        {activeTab === 'manual' && (
          <Suspense fallback={null}>
            <ManualView
              onNavigate={(tab) => {
                if (tab !== 'create') {
                  setEditingExam(null);
                  setCreateExamInitialMode('select');
                }
                setActiveTab(tab);
              }}
              onOpenProfessorModal={() => setIsProfessorModalOpen(true)}
              onOpenPasteModal={handleOpenQuestionTextEditor}
              onOpenRegistrationModal={openRegistrationModal}
              onOpenCuratedModal={() => setIsCuratedModalOpen(true)}
              onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
              isAdmin={isAdmin}
              user={user}
            />
          </Suspense>
        )}

        {activeTab === 'admin-subs' && (
          <Suspense fallback={null}>
            <AdminSubscriptionsView
              user={user}
              subscriptions={allSubscriptions}
              onClose={() => setActiveTab('home')}
            />
          </Suspense>
        )}

        {activeTab === 'shared-history' && (
          <Suspense fallback={null}>
            <SharedHistoryView
              exams={exams}
              onStartPractice={handleStartPractice}
              onNavigateToFiles={() => setActiveTab('files')}
            />
          </Suspense>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'create') {
            setEditingExam(null);
            setCreateExamInitialMode('select');
          }
          setActiveTab(tab);
        }}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        examsCount={exams.length}
      />

      {/* Utilities & Secondary Features Side Drawer */}
      <AppDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        onNavigateToManual={() => {
          if (activeTab !== 'create') {
            setEditingExam(null);
            setCreateExamInitialMode('select');
          }
          setActiveTab('manual');
        }}
        onNavigateToAdminSubs={() => {
          if (activeTab !== 'create') {
            setEditingExam(null);
            setCreateExamInitialMode('select');
          }
          setActiveTab('admin-subs');
        }}
        onNavigateToSharedHistory={() => {
          if (activeTab !== 'create') {
            setEditingExam(null);
            setCreateExamInitialMode('select');
          }
          setActiveTab('shared-history');
        }}
        onOpenDatabaseUpload={
          (isAdmin || Boolean(user && isUserTeacher(user)))
            ? () => {
                if (exams.length > 0) {
                  setExamForDatabaseUpload(exams[0]);
                } else {
                  showToast('Please create or download an exam first to upload questions.');
                }
              }
            : undefined
        }
        onExportAllData={handleExportAllData}
        onResetDefaultExams={handleResetDefaultExams}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        activeSubscription={activeSubscription}
      />

      {/* Lazy Modals wrapped in Suspense */}
      <Suspense fallback={null}>
        {/* Practice Modal */}
        {activePracticeExam && (
          <Suspense fallback={<PracticeModalLoadingFallback examName={activePracticeExam.name} />}>
            <PracticeModal
              exam={activePracticeExam}
              isOpen={activePracticeExam !== null}
              onClose={() => setActivePracticeExam(null)}
              onSubmitResult={handleSubmitResult}
            />
          </Suspense>
        )}

        {/* Paste JSON / Plain Text Modal */}
        {isPasteModalOpen && (
          <PasteJsonModal
            isOpen={isPasteModalOpen}
            onClose={() => setIsPasteModalOpen(false)}
            onAddQuestions={handleAddQuestionsFromPaste}
            userTier={userTier}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          />
        )}

        {/* Exam Professor Modal */}
        {isProfessorModalOpen && (
          <ProfessorModal
            isOpen={isProfessorModalOpen}
            onClose={() => setIsProfessorModalOpen(false)}
            onGoToQuestionTextEditor={handleOpenQuestionTextEditor}
            onGoToPaste={handleOpenQuestionTextEditor}
          />
        )}

        {/* Push & Study Notification Settings Modal */}
        {isNotificationsModalOpen && (
          <NotificationSettingsModal
            isOpen={isNotificationsModalOpen}
            onClose={() => setIsNotificationsModalOpen(false)}
          />
        )}

        {/* Curated Official Exams Download Modal */}
        {isCuratedModalOpen && (
          <CuratedExamsModal
            isOpen={isCuratedModalOpen}
            onClose={() => setIsCuratedModalOpen(false)}
            onDownloadExam={handleDownloadCuratedExam}
            downloadedCatalogIds={downloadedCatalogIds}
            user={user}
            officialExams={officialExams}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            onStartPractice={handleStartPractice}
          />
        )}

        {/* Ethiopian Birr Student Subscription & Chapa Checkout Modal */}
        {isSubscriptionModalOpen && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            user={user}
            activeSubscription={activeSubscription}
            onSignInRequired={() => {
              setIsSubscriptionModalOpen(false);
              signInWithGoogle();
            }}
            onOpenSignIn={() => {
              setIsSubscriptionModalOpen(false);
              signInWithGoogle();
            }}
          />
        )}

        {/* Database Storage Upload Modal (Cloud Firestore - Admin & Teacher privileged) */}
        {examForDatabaseUpload && (
          <DatabaseUploadModal
            isOpen={examForDatabaseUpload !== null}
            exam={examForDatabaseUpload}
            user={user}
            onClose={() => setExamForDatabaseUpload(null)}
            onOpenRegistrationModal={openRegistrationModal}
            onUploadComplete={(updatedExam) => {
              setExams((prev) =>
                prev.map((e) => (e.id === updatedExam.id ? { ...e, ...updatedExam } : e))
              );
              showToast(`Questions successfully synced to Cloud Firestore repository!`);
            }}
          />
        )}

        {/* User Profile Registration Modal */}
        <UserRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={closeRegistrationModal}
          onSuccess={(registeredProfile) => {
            if (registeredProfile.role === 'teacher') {
              showToast(`Registered successfully as Teacher for ${registeredProfile.school || 'your school'}!`);
            } else {
              showToast(`Registered successfully as Grade ${registeredProfile.grade || '12'} student!`);
            }
          }}
        />
      </Suspense>

      {/* Delete Exam Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={examToDelete !== null}
        title="Delete Exam?"
        message="This exam and all associated questions will be permanently removed from your library. This action cannot be undone."
        confirmText="Delete Exam"
        isDestructive
        onConfirm={handleDeleteExam}
        onCancel={() => setExamToDelete(null)}
      />

      {/* Direct Practice Mode Launching Overlay for Shared Links */}
      {(isOpeningPracticeLink || practiceLinkError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 p-6 shadow-2xl text-center flex flex-col items-center space-y-4">
            {practiceLinkError ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white font-['Syne',sans-serif]">
                    Exam Unavailable
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {practiceLinkError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPracticeLinkError(null);
                    setIsOpeningPracticeLink(false);
                    window.history.replaceState({}, '', window.location.pathname);
                  }}
                  className="w-full py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold transition cursor-pointer hover:opacity-90"
                >
                  Return to Library
                </button>
              </>
            ) : (
              <>
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-900 dark:border-white border-t-transparent animate-spin" />
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-xs">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white font-['Syne',sans-serif]">
                    Launching Practice Mode
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {practiceLinkStatus}
                  </p>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-950 dark:bg-white rounded-full animate-pulse w-3/4 mx-auto" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold font-['Syne',sans-serif] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
    )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
