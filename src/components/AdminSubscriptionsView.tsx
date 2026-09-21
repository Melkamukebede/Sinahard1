import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Crown,
  Smartphone,
  Building,
  Zap,
  CreditCard,
  Check,
  X,
} from 'lucide-react';
import { UserSubscription, AppUser } from '../types';
import {
  verifySubscriptionInDb,
  rejectSubscriptionInDb,
  isUserSubscriptionActive,
  ADMIN_EMAIL,
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<UserSubscription | null>(null);

  const filtered = subscriptions.filter((sub) => {
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

  const handleVerify = async (sub: UserSubscription) => {
    if (!sub.id) return;
    setActionLoadingId(sub.id);
    try {
      await verifySubscriptionInDb(sub.id, user);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (sub: UserSubscription) => {
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
          LAYER 1 & 2: TRANSLUCENT CONTAINER (Header & Filter Actions)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 p-5 sm:p-7 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] space-y-5 overflow-hidden">
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-zinc-400/5 dark:bg-zinc-700/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-zinc-400/5 dark:bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Payment Verification Panel
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Admin
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Verify student Telebirr, CBE, and Chapa payments in Ethiopian Birr to unlock premium access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2.5 rounded-full border border-white/80 dark:border-white/10 bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 transition cursor-pointer shadow-xs active:scale-98"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button
                id="admin-payments-cancel-btn-top"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition cursor-pointer shadow-xs active:scale-98 flex items-center gap-1.5"
                title="Cancel and close payments panel"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/70 dark:bg-zinc-900/80 border border-white/80 dark:border-white/10 text-xs shadow-2xs">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full font-semibold capitalize transition cursor-pointer active:scale-98 ${
                  filterStatus === status
                    ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference, email, student..."
              className="pl-9 pr-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-white/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 w-64 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 3: PORCELAIN CARD CONTAINER (Subscription Table)
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-[28px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No subscriptions matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Plan / Duration</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Method & Reference</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filtered.map((sub) => {
                  const isVerified = sub.paymentStatus === 'verified';
                  const isPending = sub.paymentStatus === 'pending';
                  const isRejected = sub.paymentStatus === 'rejected';

                  return (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {sub.userName || 'Student'}
                        </div>
                        <div className="text-[11px] text-zinc-500">{sub.userEmail || sub.userId}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {sub.planDuration}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          {sub.amountETB} ETB
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {sub.paymentMethod}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold mt-1 select-all">
                          {sub.transactionReference}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-[10px] border border-zinc-200 dark:border-zinc-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-zinc-500 text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoadingId === sub.id}
                                onClick={() => handleVerify(sub)}
                                className="px-3.5 py-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs disabled:opacity-50 active:scale-98"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === sub.id}
                                onClick={() => handleReject(sub)}
                                className="px-3 py-1.5 rounded-full border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer transition disabled:opacity-50 active:scale-98"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isVerified && (
                            <span className="text-[11px] text-zinc-400 font-medium">
                              Active until {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'N/A'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Cancel & Return Action */}
        {onClose && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200/60 dark:border-white/10">
            <span className="text-xs text-zinc-500">
              Admin Subscriptions &amp; Payments Control
            </span>
            <button
              id="admin-payments-cancel-btn-bottom"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition cursor-pointer shadow-xs active:scale-98 flex items-center gap-1.5"
              title="Cancel and return to previous screen"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel &amp; Return</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
