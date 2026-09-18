import React, { useState, useEffect } from 'react';
import { Navbar, PageTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { FilesView } from './components/FilesView';
import { ResultsView } from './components/ResultsView';
import { CreateExamWizard } from './components/CreateExamWizard';
import { PracticeModal } from './components/PracticeModal';
import { PasteJsonModal } from './components/PasteJsonModal';
import { ProfessorModal } from './components/ProfessorModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { AppDrawer } from './components/AppDrawer';
import { ManualView } from './components/ManualView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminSubscriptionsView } from './components/AdminSubscriptionsView';
import { CuratedExamsModal } from './components/CuratedExamsModal';
import { DatabaseUploadModal } from './components/DatabaseUploadModal';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
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

function MainApp() {
  const {
    user,
    signInWithGoogle,
    isRegistrationModalOpen,
    openRegistrationModal,
    closeRegistrationModal,
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
      a.download = `exammaster-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
        difficulty: 'Medium',
        timeLimit: 25,
        passingScore: 70,
        subjectType: 'theory',
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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#060d18] text-zinc-900 dark:text-zinc-100 transition-colors font-['DM_Sans',sans-serif] selection:bg-emerald-500 selection:text-zinc-950">
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
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        activeSubscription={activeSubscription}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            activeSubscription={activeSubscription}
            userTier={userTier}
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
            onOpenDatabaseUpload={isAdmin ? (exam) => setExamForDatabaseUpload(exam) : undefined}
            isAdmin={isAdmin}
            user={user}
          />
        )}

        {activeTab === 'results' && (
          <ResultsView
            results={results}
            onDeleteResult={handleDeleteResult}
            onClearAllResults={handleClearAllResults}
            onNavigateToFiles={() => setActiveTab('files')}
          />
        )}

        {activeTab === 'create' && (
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
            onOpenDatabaseUpload={isAdmin ? (exam) => setExamForDatabaseUpload(exam) : undefined}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'manual' && (
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
        )}

        {activeTab === 'admin-subs' && (
          <AdminSubscriptionsView
            user={user}
            subscriptions={allSubscriptions}
            onClose={() => setActiveTab('home')}
          />
        )}
      </main>

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
          isAdmin
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

      {/* Practice Modal */}
      <PracticeModal
        exam={activePracticeExam}
        isOpen={activePracticeExam !== null}
        onClose={() => setActivePracticeExam(null)}
        onSubmitResult={handleSubmitResult}
      />

      {/* Paste JSON / Plain Text Modal */}
      <PasteJsonModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onAddQuestions={handleAddQuestionsFromPaste}
        userTier={userTier}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
      />

      {/* Exam Professor Modal */}
      <ProfessorModal
        isOpen={isProfessorModalOpen}
        onClose={() => setIsProfessorModalOpen(false)}
        onGoToQuestionTextEditor={handleOpenQuestionTextEditor}
        onGoToPaste={handleOpenQuestionTextEditor}
      />

      {/* Push & Study Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

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

      {/* Curated Official Exams Download Modal */}
      <CuratedExamsModal
        isOpen={isCuratedModalOpen}
        onClose={() => setIsCuratedModalOpen(false)}
        onDownloadExam={handleDownloadCuratedExam}
        downloadedCatalogIds={downloadedCatalogIds}
        user={user}
        officialExams={officialExams}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
      />

      {/* Ethiopian Birr Student Subscription & Chapa Checkout Modal */}
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

      {/* Database Storage Upload Modal (Cloud Firestore - Admin privileged) */}
      <DatabaseUploadModal
        isOpen={examForDatabaseUpload !== null}
        exam={examForDatabaseUpload}
        user={user}
        onClose={() => setExamForDatabaseUpload(null)}
        onUploadComplete={(updatedExam) => {
          setExams((prev) =>
            prev.map((e) => (e.id === updatedExam.id ? { ...e, ...updatedExam } : e))
          );
          showToast(`Questions successfully synced to Cloud Firestore and Official Exams!`);
        }}
      />

      {/* Student Profile Registration & Critical Academic Forms Modal */}
      <StudentRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={closeRegistrationModal}
        onSuccess={(registeredProfile) => {
          showToast(`Registered successfully as Grade ${registeredProfile.grade || '12'} student! Official exams tailored.`);
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 text-xs font-bold font-['Syne',sans-serif] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
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
