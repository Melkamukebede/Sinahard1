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
import { JsonViewerModal } from './components/JsonViewerModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { AppDrawer } from './components/AppDrawer';
import { ManualView } from './components/ManualView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminSubscriptionsView } from './components/AdminSubscriptionsView';
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
} from './services/db';
import { verifyChapaTransaction } from './services/chapa';
import { verifyTelebirrPayment } from './services/telebirr';

function MainApp() {
  const { user, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<PageTab>('home');
  const [exams, setExams] = useState<Exam[]>(INITIAL_SAMPLE_EXAMS);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<UserSubscription[]>([]);

  // Active exam for practice / editing
  const [activePracticeExam, setActivePracticeExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [viewingJsonExam, setViewingJsonExam] = useState<Exam | null>(null);

  // Modals
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      for (const sample of INITIAL_SAMPLE_EXAMS) {
        await saveExamToDb(sample, user);
      }
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
    setActiveTab('create');
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await deleteExamFromDb(examToDelete, user);
      showToast('Exam removed from library');
    } catch {
      showToast('Failed to delete exam');
    } finally {
      setExamToDelete(null);
    }
  };

  const handleSaveExam = async (exam: Exam) => {
    try {
      await saveExamToDb(exam, user);
      showToast('Exam successfully saved and synced!');
      setEditingExam(null);
      setActiveTab('files');
    } catch {
      showToast('Failed to save exam to cloud');
    }
  };

  const handleAddQuestionsFromPaste = async (newQuestions: Question[]) => {
    if (activeTab === 'create' && editingExam) {
      // Add questions to the currently editing exam
      const updated = {
        ...editingExam,
        questions: [...editingExam.questions, ...newQuestions],
      };
      setEditingExam(updated);
      showToast(`Added ${newQuestions.length} questions to draft.`);
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
        questions: newQuestions,
        createdAt: new Date().toISOString(),
      };
      await saveExamToDb(newDraft, user);
      showToast(`Imported ${newQuestions.length} questions into new exam!`);
      setEditingExam(newDraft);
      setActiveTab('create');
    }
  };

  const handleSubmitResult = async (result: ExamResult) => {
    try {
      await saveResultToDb(result, user);
      setActivePracticeExam(null);
      setActiveTab('results');
      showToast(`Exam completed! Score: ${result.percentage}%`);
    } catch {
      showToast('Failed to save result record');
    }
  };

  const handleDeleteResult = async (resultId: string | number) => {
    try {
      await deleteResultFromDb(resultId, user);
      showToast('Result removed from history');
    } catch {
      showToast('Failed to remove result');
    }
  };

  const handleClearAllResults = async () => {
    try {
      await clearAllResultsFromDb(user);
      showToast('Practice history cleared');
    } catch {
      showToast('Failed to clear history');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#060d18] text-zinc-900 dark:text-zinc-100 transition-colors font-['DM_Sans',sans-serif] selection:bg-emerald-500 selection:text-zinc-950">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'create') setEditingExam(null);
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
              if (tab !== 'create') setEditingExam(null);
              setActiveTab(tab);
            }}
            onStartPractice={handleStartPractice}
            onOpenPasteModal={() => setIsPasteModalOpen(true)}
            onOpenProfessorModal={() => setIsProfessorModalOpen(true)}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            activeSubscription={activeSubscription}
          />
        )}

        {activeTab === 'files' && (
          <FilesView
            exams={exams}
            onStartPractice={handleStartPractice}
            onEditExam={handleEditExam}
            onDeleteExam={(id) => setExamToDelete(id)}
            onViewJson={(exam) => setViewingJsonExam(exam)}
            onCreateNew={() => {
              setEditingExam(null);
              setActiveTab('create');
            }}
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
            initialExam={editingExam}
            onSaveExam={handleSaveExam}
            onCancel={() => {
              setEditingExam(null);
              setActiveTab('files');
            }}
            onOpenPasteModal={() => setIsPasteModalOpen(true)}
            onOpenProfessorModal={() => setIsProfessorModalOpen(true)}
          />
        )}

        {activeTab === 'manual' && (
          <ManualView
            onNavigate={(tab) => {
              if (tab !== 'create') setEditingExam(null);
              setActiveTab(tab);
            }}
            onOpenProfessorModal={() => setIsProfessorModalOpen(true)}
            onOpenPasteModal={() => setIsPasteModalOpen(true)}
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
        onOpenProfessorModal={() => setIsProfessorModalOpen(true)}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        onNavigateToManual={() => {
          if (activeTab !== 'create') setEditingExam(null);
          setActiveTab('manual');
        }}
        onNavigateToAdminSubs={() => {
          if (activeTab !== 'create') setEditingExam(null);
          setActiveTab('admin-subs');
        }}
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
      />

      {/* Exam Professor Modal */}
      <ProfessorModal
        isOpen={isProfessorModalOpen}
        onClose={() => setIsProfessorModalOpen(false)}
        onGoToPaste={() => {
          setIsProfessorModalOpen(false);
          setIsPasteModalOpen(true);
        }}
      />

      {/* Push & Study Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      {/* JSON Viewer Modal */}
      <JsonViewerModal
        exam={viewingJsonExam}
        isOpen={viewingJsonExam !== null}
        onClose={() => setViewingJsonExam(null)}
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
