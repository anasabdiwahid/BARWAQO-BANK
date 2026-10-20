import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, Download, Calendar, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';

export const StatementModal = ({ isOpen, onClose, accountNumber }) => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchStatement = async () => {
    if (!accountNumber) return;
    setLoading(true);
    try {
      const res = await api.get(`/accounts/${accountNumber}/statement`, {
        params: { startDate, endDate },
      });
      if (res.data.success) {
        setStatement(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load statement', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && accountNumber) {
      fetchStatement();
    }
  }, [isOpen, accountNumber]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" title="Official Account Statement">
      <div className="space-y-6">
        {/* Date Filter Bar (Hidden in print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 no-print">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>
            <div className="pt-4">
              <Button size="sm" variant="secondary" onClick={fetchStatement} isLoading={loading}>
                Update Filter
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button size="sm" variant="primary" icon={Printer} onClick={handlePrint}>
              Print Official Statement
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          </div>
        ) : statement ? (
          <div className="print-card space-y-6">
            {/* Bank Header */}
            <div className="flex items-start justify-between border-b pb-6 border-gray-200">
              <div>
                <img
                  src="/logos/logo-wordmark.png"
                  alt="BARWAQO BANK"
                  className="h-10 w-auto object-contain mb-1"
                />
                <p className="text-xs text-gray-500 font-medium">Core Banking Financial Division</p>
                <p className="text-xs text-gray-500">Maka Al Mukarama, Mogadishu, Somalia</p>
                <p className="text-xs text-gray-500">SWIFT: BARWSOMM | contact@barwaqobank.so</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
                  STATEMENT OF ACCOUNT
                </span>
                <p className="font-mono text-sm font-bold text-gray-900 mt-1">
                  Account: {statement.accountNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Period: {formatDate(statement.statementPeriod?.start)} – {formatDate(statement.statementPeriod?.end)}
                </p>
              </div>
            </div>

            {/* Customer & Account Summary Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2">
                  Account Holder Details
                </h4>
                <div className="space-y-1">
                  <p><span className="text-gray-500">Name:</span> <strong className="text-gray-900">{statement.accountHolder?.name}</strong></p>
                  <p><span className="text-gray-500">Customer ID:</span> <strong className="text-gray-900">{statement.accountHolder?.customerId}</strong></p>
                  <p><span className="text-gray-500">Address:</span> {statement.accountHolder?.address}, {statement.accountHolder?.city}</p>
                  <p><span className="text-gray-500">Phone:</span> {statement.accountHolder?.phone}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2">
                  Financial Ledger Balances
                </h4>
                <div className="space-y-1">
                  <p><span className="text-gray-500">Current Ledger Balance:</span> <strong className="text-gray-900">{formatMoney(statement.summary?.currentLedgerBalanceMinorUnits, statement.currency)}</strong></p>
                  <p><span className="text-gray-500">Available Balance:</span> <strong className="text-emerald-700">{formatMoney(statement.summary?.availableBalanceMinorUnits, statement.currency)}</strong></p>
                  <p><span className="text-gray-500">Restricted Balance:</span> <strong className="text-amber-700">{formatMoney(statement.summary?.restrictedBalanceMinorUnits, statement.currency)}</strong></p>
                  <p><span className="text-gray-500">Total Credits this period:</span> <span className="text-emerald-600 font-medium">+{formatMoney(statement.summary?.totalCreditsMinorUnits, statement.currency)}</span></p>
                  <p><span className="text-gray-500">Total Debits this period:</span> <span className="text-red-600 font-medium">-{formatMoney(statement.summary?.totalDebitsMinorUnits, statement.currency)}</span></p>
                </div>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                Posted Ledger Entries
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Debit</th>
                      <th className="py-2.5 px-3 text-right">Credit</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statement.entries?.length > 0 ? (
                      statement.entries.map((entry) => (
                        <tr key={entry._id} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 whitespace-nowrap text-gray-600 font-mono">
                            {formatDate(entry.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 text-gray-900 font-medium">
                            {entry.description}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.entryType === 'CREDIT'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {entry.entryType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-red-600">
                            {entry.entryType === 'DEBIT' ? formatMoney(entry.amountMinorUnits, statement.currency) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                            {entry.entryType === 'CREDIT' ? formatMoney(entry.amountMinorUnits, statement.currency) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                            {formatMoney(entry.runningBalanceMinorUnits, statement.currency)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No transactions recorded during this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statement Footer */}
            <div className="pt-6 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
              <span>This is an official system-generated statement issued by Barwaqo Bank Core Banking.</span>
              <span>Barwaqo Bank &copy; 2026. All rights reserved.</span>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

