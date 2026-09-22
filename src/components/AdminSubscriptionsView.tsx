import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  X,
  Check,
  School,
  UserCheck,
  AlertCircle,
  Mail,
  MapPin,
  BookOpen,
  Phone,
  GraduationCap,
  Users,
  CreditCard,
} from 'lucide-react';
import { AppUser, UserSubscription } from '../types';
import {
  verifySubscriptionInDb,
  rejectSubscriptionInDb,
  subscribeToRegisteredTeachers,
  verifyTeacherInDb,
  RegisteredTeacherRecord,
} from '../services/db';

interface AdminSubscriptionsViewProps {
  user: AppUser | null;
  subscriptions: UserSubscription[];
  onRefresh?: () => void;
  onClose?: () => void;
}

export const AdminSubscriptionsView: React.FC<AdminSubscriptionsViewProps> = ({
  user,
  subscriptions,
  onRefresh,
  onClose,
}) => {
  // Top-level Navigation: 'teachers' (Check Panel) | 'payments' (Subscriptions)
  const [activeAdminTab, setActiveAdminTab] = useState<'teachers' | 'payments'>('teachers');

  // Teacher Verification State
  const [teachers, setTeachers] = useState<RegisteredTeacherRecord[]>([]);
  const [teacherFilter, setTeacherFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [actionLoadingTeacherId, setActionLoadingTeacherId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Payment Subscriptions State
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Subscribe in real-time to registered teachers from Firestore
  useEffect(() => {
    const unsub = subscribeToRegisteredTeachers((fetched) => {
      setTeachers(fetched);
    });
    return () => unsub();
  }, []);

  // Filtered teachers list
  const filteredTeachers = teachers.filter((t) => {
    if (teacherFilter === 'pending' && t.isVerifiedTeacher) return false;
    if (teacherFilter === 'verified' && !t.isVerifiedTeacher) return false;
    if (teacherSearch.trim()) {
      const q = teacherSearch.toLowerCase();
      const matchName = (t.displayName || t.teacherName || '').toLowerCase().includes(q);
      const matchSchool = (t.schoolName || t.school || '').toLowerCase().includes(q);
      const matchEmail = (t.email || '').toLowerCase().includes(q);
      const matchSubject = (t.teachingSubject || '').toLowerCase().includes(q);
      return matchName || matchSchool || matchEmail || matchSubject;
    }
    return true;
  });

  const pendingTeachersCount = teachers.filter((t) => !t.isVerifiedTeacher).length;
  const verifiedTeachersCount = teachers.filter((t) => t.isVerifiedTeacher).length;

  // Filtered subscriptions list
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filterStatus !== 'all' && sub.paymentStatus !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchRef = (sub.transactionReference || '').toLowerCase().includes(q);
      const matchEmail = (sub.userEmail || '').toLowerCase().includes(q);
      const matchName = (sub.userName || '').toLowerCase().includes(q);
      return matchRef || matchEmail || matchName;
    }
    return true;
  });

  const pendingPaymentsCount = subscriptions.filter((s) => s.paymentStatus === 'pending').length;

  const handleVerifyTeacher = async (teacherUid: string, verified: boolean) => {
    setActionLoadingTeacherId(teacherUid);
    try {
      const success = await verifyTeacherInDb(teacherUid, verified, user);
      if (success) {
        setFeedbackMsg(verified ? 'Teacher successfully verified!' : 'Teacher verification reverted to pending.');
        // Optimistic UI update
        setTeachers((prev) =>
          prev.map((t) =>
            t.uid === teacherUid || t.id === teacherUid
              ? {
                  ...t,
                  isVerifiedTeacher: verified,
                  verifiedAt: verified ? new Date().toISOString() : undefined,
                  verifiedBy: verified ? user?.email || 'admin' : undefined,
                }
              : t
          )
        );
      } else {
        setFeedbackMsg('Failed to update teacher verification.');
      }
    } catch {
      setFeedbackMsg('An error occurred during verification.');
    } finally {
      setActionLoadingTeacherId(null);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleVerifyPayment = async (sub: UserSubscription) => {
    if (!sub.id) return;
    setActionLoadingId(sub.id);
    try {
      await verifySubscriptionInDb(sub.id, user);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectPayment = async (sub: UserSubscription) => {
    if (!sub.id) return;
    const reason = prompt('Please enter rejection reason (e.g. invalid reference code):') || 'Unverified reference';
    setActionLoadingId(sub.id);
    try {
      await rejectSubscriptionInDb(sub.id, reason, user);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-14 max-w-6xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROL TABS
      ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] sm:rounded-[38px] bg-white/70 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-black dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
                  Admin Verification &amp; Control
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                  Master
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                Verify school teachers for Firestore exam publishing and approve student subscription payments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs active:scale-95"
                title="Refresh Records"
              >
                <RefreshCw className="w-4 h-4 text-black dark:text-white" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs active:scale-95"
                title="Close Admin Panel"
              >
                <X className="w-4 h-4 text-black dark:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Master Admin Switching Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveAdminTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition cursor-pointer active:scale-98 ${
              activeAdminTab === 'teachers'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <School className={`w-4 h-4 ${activeAdminTab === 'teachers' ? 'text-white dark:text-zinc-950' : 'text-black dark:text-white'}`} />
            <span>Teacher Verification Panel</span>
            {pendingTeachersCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeAdminTab === 'teachers'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white'
                  : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
              }`}>
                {pendingTeachersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition cursor-pointer active:scale-98 ${
              activeAdminTab === 'payments'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <CreditCard className={`w-4 h-4 ${activeAdminTab === 'payments' ? 'text-white dark:text-zinc-950' : 'text-black dark:text-white'}`} />
            <span>Student Payment Verification</span>
            {pendingPaymentsCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeAdminTab === 'payments'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white'
                  : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
              }`}>
                {pendingPaymentsCount}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
              <span>{feedbackMsg}</span>
            </span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TAB A: TEACHER VERIFICATION CHECK PANEL
      ───────────────────────────────────────────────────────────── */}
      {activeAdminTab === 'teachers' && (
        <div className="space-y-5">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[28px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Teachers</span>
                <div className="text-2xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white mt-1">
                  {teachers.length}
                </div>
                <span className="text-[11px] text-zinc-500">Registered accounts</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <Users className="w-5 h-5 text-black dark:text-white" />
              </div>
            </div>

            <div className="p-5 rounded-[28px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Pending Review</span>
                <div className="text-2xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white mt-1">
                  {pendingTeachersCount}
                </div>
                <span className="text-[11px] text-zinc-500">Requires admin check</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <Clock className="w-5 h-5 text-black dark:text-white" />
              </div>
            </div>

            <div className="p-5 rounded-[28px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Verified Teachers</span>
                <div className="text-2xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white mt-1">
                  {verifiedTeachersCount}
                </div>
                <span className="text-[11px] text-zinc-500">Authorized cloud publish</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />
              </div>
            </div>
          </div>

          {/* Teacher Search & Filters */}
          <div className="p-4 sm:p-5 rounded-[28px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTeacherFilter('all')}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  teacherFilter === 'all'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                All ({teachers.length})
              </button>
              <button
                type="button"
                onClick={() => setTeacherFilter('pending')}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  teacherFilter === 'pending'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Pending ({pendingTeachersCount})
              </button>
              <button
                type="button"
                onClick={() => setTeacherFilter('verified')}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  teacherFilter === 'verified'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Verified ({verifiedTeachersCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teacher, school, subject..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400/40"
              />
            </div>
          </div>

          {/* Teacher List Cards */}
          {filteredTeachers.length === 0 ? (
            <div className="p-12 rounded-[32px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 text-center space-y-3">
              <School className="w-10 h-10 text-black dark:text-white mx-auto opacity-40" />
              <div className="font-bold text-base text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                No Teachers Found
              </div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {teacherSearch
                  ? 'No registered teachers matched your search term.'
                  : 'No users have registered with the Teacher role yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeachers.map((t) => {
                const isLoading = actionLoadingTeacherId === t.uid || actionLoadingTeacherId === t.id;
                return (
                  <div
                    key={t.id || t.uid}
                    className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-zinc-400 dark:hover:border-zinc-700"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-zinc-950 dark:text-white font-['Outfit',sans-serif]">
                          {t.displayName || t.teacherName || 'Instructor'}
                        </span>

                        {t.isVerifiedTeacher ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700">
                            <CheckCircle2 className="w-3 h-3 text-black dark:text-white" />
                            <span>Verified Teacher</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>Pending Check</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <School className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                          <span>School: <strong className="text-zinc-900 dark:text-white">{t.schoolName || t.school || 'Unspecified'}</strong></span>
                        </div>

                        <span className="text-zinc-300 dark:text-zinc-700">•</span>

                        <div className="flex items-center gap-1.5 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                          <span>Subject: <strong className="text-zinc-900 dark:text-white">{t.teachingSubject || 'General'}</strong></span>
                        </div>

                        <span className="text-zinc-300 dark:text-zinc-700">•</span>

                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                          <span className="font-mono text-[11px]">{t.email}</span>
                        </div>
                      </div>

                      {t.verifiedAt && t.isVerifiedTeacher && (
                        <div className="text-[11px] text-zinc-400">
                          Verified by {t.verifiedBy || 'Admin'} on {new Date(t.verifiedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!t.isVerifiedTeacher ? (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleVerifyTeacher(t.uid || t.id, true)}
                          className="px-4 py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify Teacher</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleVerifyTeacher(t.uid || t.id, false)}
                          className="px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-semibold cursor-pointer transition active:scale-95 disabled:opacity-50"
                        >
                          Revoke / Unverify
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. TAB B: STUDENT PAYMENT VERIFICATION
      ───────────────────────────────────────────────────────────── */}
      {activeAdminTab === 'payments' && (
        <div className="space-y-5">
          {/* Subscriptions Filter Bar */}
          <div className="p-4 sm:p-5 rounded-[28px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                All ({subscriptions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  filterStatus === 'pending'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Pending ({pendingPaymentsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('verified')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  filterStatus === 'verified'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Verified
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reference, email, name..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400/40"
              />
            </div>
          </div>

          {filteredSubscriptions.length === 0 ? (
            <div className="p-12 rounded-[32px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 text-center space-y-3">
              <CreditCard className="w-10 h-10 text-black dark:text-white mx-auto opacity-40" />
              <div className="font-bold text-base text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                No Subscription Submissions Found
              </div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No student payment records matched your current filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => {
                const isPending = sub.paymentStatus === 'pending';
                const isVerified = sub.paymentStatus === 'verified';
                const isLoading = actionLoadingId === sub.id;

                return (
                  <div
                    key={sub.id || sub.transactionReference}
                    className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#070e1a]/95 border border-zinc-200/90 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-zinc-400 dark:hover:border-zinc-700"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-zinc-950 dark:text-white font-mono">
                          Ref: {sub.transactionReference}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white uppercase border border-zinc-200 dark:border-zinc-700">
                          {sub.paymentMethod}
                        </span>
                        <span className="font-semibold text-xs text-zinc-900 dark:text-white">
                          {sub.amountETB} ETB ({sub.planDuration})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                        <span>User: <strong className="text-zinc-900 dark:text-white">{sub.userName || 'Student'}</strong></span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="font-mono text-[11px]">{sub.userEmail}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>Date: {new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleVerifyPayment(sub)}
                            className="px-4 py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify Payment</span>
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleRejectPayment(sub)}
                            className="px-3.5 py-1.5 rounded-full border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                          <span>Approved</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Close Button */}
      {onClose && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500">
            Admin Verification &amp; Access System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-900 dark:text-white transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Close Panel</span>
          </button>
        </div>
      )}
    </div>
  );
};
