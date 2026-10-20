import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ReceiptModal } from '../../components/receipts/ReceiptModal';
import { StatementModal } from '../../components/receipts/StatementModal';
import {
  Send,
  History,
  FileText,
  LifeBuoy,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, formatDateTime, maskAccountNumber } from '../../utils/formatters';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/customer');
        if (res.data.success) {
          setDashboardData(res.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = dashboardData?.stats || {};
  const primaryAccount = dashboardData?.primaryAccount;

  return (
    <DashboardLayout pageTitle="Personal Banking Portal">
      {/* Account Balance Master Card */}
      <div className="bg-gradient-to-r from-brand-black via-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-gray-800 relative overflow-hidden">
        {/* Subtle background BB icon watermark */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <img src="/logos/logo-icon.png" alt="" className="w-72 h-72" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">
                Primary Account • {primaryAccount?.accountType || 'Savings'}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-red-400">
                  {primaryAccount?.accountNumber || '10011001'}
                </span>
                <Badge status={primaryAccount?.status || 'ACTIVE'}>
                  {primaryAccount?.status || 'ACTIVE'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/customer/transfer">
                <Button variant="primary" icon={Send} size="md">
                  Send Money
                </Button>
              </Link>
              <Button
                variant="outline"
                icon={FileText}
                size="md"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setShowStatementModal(true)}
              >
                Statement
              </Button>
            </div>
          </div>

          {/* Three Tier Balance Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-800">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase">Available to Spend</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {formatMoney(stats.availableBalanceMinorUnits || 0, primaryAccount?.currency || 'SOS')}
              </div>
              <span className="text-[11px] text-gray-400">Funds free of any restrictions</span>
            </div>

            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase">Total Ledger Balance</span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {formatMoney(stats.ledgerBalanceMinorUnits || 0, primaryAccount?.currency || 'SOS')}
              </div>
              <span className="text-[11px] text-gray-400">Total settled deposits</span>
            </div>

            <div>
              <span className="text-xs text-amber-400 font-semibold uppercase flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Restricted Balance (Holds)
              </span>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                {formatMoney(stats.restrictedBalanceMinorUnits || 0, primaryAccount?.currency || 'SOS')}
              </div>
              <span className="text-[11px] text-gray-400">Compliance & reserve holds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Money In vs Money Out */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Money Received</span>
              <h3 className="text-2xl font-black text-emerald-700 font-mono mt-1">
                {formatMoney(stats.totalReceivedMinorUnits || 0, primaryAccount?.currency || 'SOS')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-brand-red">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Money Sent</span>
              <h3 className="text-2xl font-black text-brand-red font-mono mt-1">
                {formatMoney(stats.totalSentMinorUnits || 0, primaryAccount?.currency || 'SOS')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-brand-red flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Posted Transactions */}
      <Card
        title="Recent Transactions"
        subtitle="Live double-entry account ledger activity"
        headerAction={
          <Link to="/customer/transactions">
            <Button size="sm" variant="ghost">
              View All History →
            </Button>
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboardData?.recentTransactions?.length > 0 ? (
                dashboardData.recentTransactions.map((tx) => {
                  const isReceived = tx.recipientAccountNumber === primaryAccount?.accountNumber;
                  return (
                    <tr key={tx._id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">
                        {tx.transactionReference}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">
                        {tx.description}
                        <span className="text-[10px] text-gray-400 block font-mono">
                          {isReceived
                            ? `From: ${maskAccountNumber(tx.senderAccountNumber)}`
                            : `To: ${maskAccountNumber(tx.recipientAccountNumber)}`}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold text-sm ${
                          isReceived ? 'text-emerald-600' : 'text-brand-black'
                        }`}
                      >
                        {isReceived ? '+' : '-'}
                        {formatMoney(tx.amountMinorUnits, tx.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1 rounded text-gray-400 hover:text-brand-red hover:bg-red-50 transition"
                          title="Print Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <ReceiptModal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />

      <StatementModal
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        accountNumber={primaryAccount?.accountNumber}
      />
    </DashboardLayout>
  );
};

