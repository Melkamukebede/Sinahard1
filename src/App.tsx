import React, { useState, useEffect, Suspense } from 'react';
import { Navbar, PageTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { FilesView } from './components/FilesView';
import { ResultsView } from './components/ResultsView';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { AppDrawer } from './components/AppDrawer';
import { MobileNav } from './components/MobileNav';
import { CURATED_EXAMS_CATALOG } from './data/curatedCatalog';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Play, AlertCircle, Loader2 } from 'lucide-react';
import { extractTargetExamId, resolveExamForPractice } from './services/shareService';
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

// Code-split heavy modals and secondary views for fast initial load
const CreateExamWizard = React.lazy(() =>
  import('./components/CreateExamWizard').then((m) => ({ default: m.CreateExamWizard }))
);
const PracticeModal = React.lazy(() =>
  import('./components/PracticeModal').then((m) => ({ default: m.PracticeModal }))
);
const PasteJsonModal = React.lazy(() =>
  import('./components/PasteJsonModal').then((m) => ({ default: m.PasteJsonModal }))
);
const ProfessorModal = React.lazy(() =>
  import('./components/ProfessorModal').then((m) => ({ default: m.ProfessorModal }))
);
const NotificationSettingsModal = React.lazy(() =>
  import('./components/NotificationSettingsModal').then((m) => ({ default: m.NotificationSettingsModal }))
);
const ManualView = React.lazy(() =>
  import('./components/ManualView').then((m) => ({ default: m.ManualView }))
);
const SubscriptionModal = React.lazy(() =>
  import('./components/SubscriptionModal').then((m) => ({ default: m.SubscriptionModal }))
);
const AdminSubscriptionsView = React.lazy(() =>
  import('./components/AdminSubscriptionsView').then((m) => ({ default: m.AdminSubscriptionsView }))
);
const CuratedExamsModal = React.lazy(() =>
  import('./components/CuratedExamsModal').then((m) => ({ default: m.CuratedExamsModal }))
);
const DatabaseUploadModal = React.lazy(() =>
  import('./components/DatabaseUploadModal').then((m) => ({ default: m.DatabaseUploadModal }))
);
const UserRegistrationModal = React.lazy(() =>
  import('./components/UserRegistrationModal').then((m) => ({ default: m.UserRegistrationModal }))
);
import { TeacherPendingVerificationView } from './components/TeacherPendingVerificationView';
import { AppSplashScreen } from './components/AppSplashScreen';

function MainApp() {
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const {
    user,
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
  const isUnverifiedTeacher = Boolean(user && user.role === 'teacher' && !isVerifiedTeacher);

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

          // Directly launch in Practice Mode
          setActivePracticeExam(resolvedExam);
          setIsOpeningPracticeLink(false);
          showToast(`🎯 Practice Mode: "${resolvedExam.name}"`);

          // Clean URL state without browser reload
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          setIsOpeningPracticeLink(false);
          setPracticeLinkError(
            `Exam "${targetId}" could not be found or does not contain questions.`
          );
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not launch direct practice mode for exam:', err);
        setIsOpeningPracticeLink(false);
        setPracticeLinkError(
          'Unable to load shared exam for practice. Please check your internet connection and try again.'
        );
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
    setActivePracticeExam(exam);
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
    // Optimistic UI update instantly
    setExams((prev) => {
      const idx = prev.findIndex((e) => e.id === exam.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = exam;
        return next;
      }
      return [exam, ...prev];
    });
    setEditingExam(null);
    setActiveTab('files');

    try {
      await saveExamToDb(exam, user);
      showToast('Exam saved to your library!');
    } catch {
      showToast('Failed to save exam');
    }
  };

  const handleAddQuestionsFromPaste = async (newQuestions: Question[]) => {
    let questionsToAdd = newQuestions;
    if (!userTier.isPremium && questionsToAdd.length > userTier.maxImportQuestions) {
      questionsToAdd = questionsToAdd.slice(0, userTier.maxImportQuestions);
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

  // If registered as teacher and waiting for admin verification, display the dedicated pending screen
  if (isUnverifiedTeacher && user) {
    return (
      <>
        {showSplashScreen && (
          <AppSplashScreen onComplete={() => setShowSplashScreen(false)} />
        )}
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
      </>
    );
  }

  return (
    <>
      {showSplashScreen && (
        <AppSplashScreen onComplete={() => setShowSplashScreen(false)} />
      )}
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
          <Suspense fallback={null}>
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
          <PracticeModal
            exam={activePracticeExam}
            isOpen={activePracticeExam !== null}
            onClose={() => setActivePracticeExam(null)}
            onSubmitResult={handleSubmitResult}
          />
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
