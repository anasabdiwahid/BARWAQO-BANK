import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ReceiptModal } from '../../components/receipts/ReceiptModal';
import { Users, Search, ArrowRightLeft, RotateCcw, Lock, Building, Receipt } from 'lucide-react';
import api from '../../services/api';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = data?.stats || {};

  return (
    <DashboardLayout pageTitle="Bank Operations & Administrative Control">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-brand-red">
          <p className="text-xs font-semibold text-gray-500 uppercase">Branch Customers</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.branchCustomers || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Under active administration</p>
        </Card>

        <Card className="border-l-4 border-l-gray-900">
          <p className="text-xs font-semibold text-gray-500 uppercase">Assigned Staff</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">
            {(stats.managersCount || 0) + (stats.employeesCount || 0)}
          </h3>
          <p className="text-[11px] text-gray-400 mt-2">
            {stats.managersCount || 0} Managers, {stats.employeesCount || 0} Employees
          </p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Restricted Accounts</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.restrictedAccounts || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Holds and compliance restrictions</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <p className="text-xs font-semibold text-gray-500 uppercase">Reversal Reviews</p>
          <h3 className="text-2xl font-black text-purple-700 mt-1">{stats.reversalRequests || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Disputed transfers pending action</p>
        </Card>
      </div>

      <Card title="Operational Transactions" subtitle="Live ledger postings within operational jurisdiction">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Sender Account</th>
                <th className="py-2.5 px-3">Recipient Account</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.recentTransactions?.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">
                      {tx.transactionReference}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-600">
                      {tx.senderAccountNumber || 'VAULT'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                      {tx.recipientAccountNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-gray-900">
                      {formatMoney(tx.amountMinorUnits, tx.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1 text-gray-400 hover:text-brand-red rounded hover:bg-red-50 transition"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No transactions to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ReceiptModal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </DashboardLayout>
  );
};

