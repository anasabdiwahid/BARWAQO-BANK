import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ReceiptModal } from '../../components/receipts/ReceiptModal';
import {
  Users,
  Shield,
  Building2,
  ArrowRightLeft,
  Lock,
  RotateCcw,
  TrendingUp,
  Activity,
  AlertTriangle,
  Receipt,
  Eye,
} from 'lucide-react';
import api from '../../services/api';
import { formatMoney, formatDate, formatDateTime, getRoleBadgeClass } from '../../utils/formatters';

export const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/super-admin');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats || {};

  return (
    <DashboardLayout pageTitle="Global System & Executive Dashboard">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-brand-red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Customers
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.totalCustomers || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-brand-red flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium">Bank-wide registered individuals</p>
        </Card>

        <Card className="border-l-4 border-l-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Today's Volume
              </p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                {formatMoney(stats.todayVolumeMinorUnits || 0, 'SOS')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium">
            {stats.todayTransferCount || 0} transactions posted today
          </p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active Holds & Freezes
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {stats.restrictedAccounts || 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium">Compliance & risk restrictions</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pending Reversals
              </p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">
                {stats.pendingReversals || 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 font-medium">Awaiting supervisory review</p>
        </Card>
      </div>

      {/* Staff Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="text-center p-2">
          <span className="text-[11px] text-gray-400 font-bold uppercase">Authorized Branches</span>
          <div className="text-xl font-bold text-gray-900 mt-1">{stats.branchesCount || 0}</div>
        </div>
        <div className="text-center p-2 border-l border-gray-100">
          <span className="text-[11px] text-gray-400 font-bold uppercase">System Admins</span>
          <div className="text-xl font-bold text-red-600 mt-1">{stats.totalAdmins || 0}</div>
        </div>
        <div className="text-center p-2 border-l border-gray-100">
          <span className="text-[11px] text-gray-400 font-bold uppercase">Branch Managers</span>
          <div className="text-xl font-bold text-gray-800 mt-1">{stats.totalManagers || 0}</div>
        </div>
        <div className="text-center p-2 border-l border-gray-100">
          <span className="text-[11px] text-gray-400 font-bold uppercase">Active Employees</span>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.totalEmployees || 0}</div>
        </div>
      </div>

      {/* Tables: Recent Audit Events and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Events */}
        <Card title="System Audit Stream" subtitle="Immutable real-time audit ledger">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.recentAudit?.length > 0 ? (
                  data.recentAudit.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-gray-900 block truncate max-w-[120px]">
                          {log.actorName}
                        </span>
                        <span className="text-[10px] text-gray-400">{log.actorRole}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-800">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge status={log.outcome}>{log.outcome}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No recent audit events.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Live Financial Transactions */}
        <Card title="Live Transaction Ledger" subtitle="Double-entry postings across all accounts">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Parties</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.recentTransactions?.length > 0 ? (
                  data.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-mono text-gray-900 font-medium">
                        {tx.transactionReference}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-gray-600">
                        <span className="font-mono">{tx.senderAccountNumber || 'VAULT'}</span>
                        <span className="mx-1 text-gray-400">→</span>
                        <span className="font-mono font-bold text-gray-900">
                          {tx.recipientAccountNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">
                        {formatMoney(tx.amountMinorUnits, tx.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1 rounded text-gray-400 hover:text-brand-red hover:bg-red-50 transition"
                          title="View Official Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ReceiptModal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </DashboardLayout>
  );
};

