import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ReceiptModal } from '../../components/receipts/ReceiptModal';
import { Search, Receipt, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, formatDateTime, maskAccountNumber } from '../../utils/formatters';

export const Transactions = () => {
  const { primaryAccount } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transfers', {
        params: { search },
      });
      if (res.data.success) {
        setTransactions(res.data.data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search]);

  return (
    <DashboardLayout pageTitle="Transaction History">
      <Card
        title="Account Activity & Transfers"
        subtitle="Immutable ledger records of all incoming and outgoing financial transactions"
      >
        <div className="mb-6 max-w-md">
          <input
            type="text"
            placeholder="Search by reference number or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-brand-red focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Counterparty</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Advice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isReceived = tx.recipientAccountNumber === primaryAccount?.accountNumber;
                  return (
                    <tr key={tx._id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {tx.transactionReference}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {isReceived ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            From: {maskAccountNumber(tx.senderAccountNumber)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-800">
                            <ArrowUpRight className="w-3.5 h-3.5 text-brand-red" />
                            To: {maskAccountNumber(tx.recipientAccountNumber)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                          isReceived ? 'text-emerald-600' : 'text-brand-black'
                        }`}
                      >
                        {isReceived ? '+' : '-'}
                        {formatMoney(tx.amountMinorUnits, tx.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={tx.status}>{tx.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Receipt}
                          onClick={() => setSelectedTx(tx)}
                        >
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No transactions found.
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

