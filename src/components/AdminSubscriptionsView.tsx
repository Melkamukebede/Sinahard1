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
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Payment Verification Panel
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                Admin
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Verify student Telebirr, CBE, and Chapa payments in Ethiopian Birr to unlock premium access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
          {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-full font-bold capitalize transition cursor-pointer ${
                filterStatus === status
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
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
            className="pl-9 pr-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64"
          />
        </div>
      </div>

      {/* Subscription Table */}
      <div className="rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No subscriptions matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {filtered.map((sub) => {
                  const isVerified = sub.paymentStatus === 'verified';
                  const isPending = sub.paymentStatus === 'pending';
                  const isRejected = sub.paymentStatus === 'rejected';

                  return (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
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
                          <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {sub.paymentMethod}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 select-all">
                          {sub.transactionReference}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
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
                                className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === sub.id}
                                onClick={() => handleReject(sub)}
                                className="px-2.5 py-1.5 rounded-full border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer transition disabled:opacity-50"
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
      </div>
    </div>
  );
};
