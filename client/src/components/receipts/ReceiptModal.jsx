import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatMoney, formatDateTime, maskAccountNumber } from '../../utils/formatters';

export const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="print-card text-center">
        {/* Bank Brand Header with Full Logo */}
        <div className="flex flex-col items-center justify-center pb-4 border-b border-gray-100">
          <img
            src="/logos/logo-full.jpg"
            alt="BARWAQO BANK"
            className="h-16 w-auto object-contain mb-2"
          />
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Official Transaction Advice & Receipt
          </span>
        </div>

        {/* Amount Badge */}
        <div className="my-6 py-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>TRANSACTION POSTED</span>
          </div>
          <div className="text-3xl font-extrabold text-brand-black tracking-tight">
            {formatMoney(transaction.amountMinorUnits || transaction.amount * 100, transaction.currency || 'SOS')}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Reference: <span className="font-mono font-semibold text-gray-700">{transaction.transactionReference}</span>
          </div>
        </div>

        {/* Transfer Parties Flow */}
        <div className="grid grid-cols-5 items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6">
          <div className="col-span-2 text-left">
            <div className="text-[11px] font-semibold text-gray-400 uppercase">From (Sender)</div>
            <div className="font-mono font-bold text-sm text-gray-900 mt-0.5">
              {transaction.senderAccountNumber ? maskAccountNumber(transaction.senderAccountNumber) : 'BARWAQO VAULT'}
            </div>
            <div className="text-xs text-gray-500 truncate">{transaction.senderName || 'Sender Account'}</div>
          </div>

          <div className="col-span-1 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div className="col-span-2 text-right">
            <div className="text-[11px] font-semibold text-gray-400 uppercase">To (Beneficiary)</div>
            <div className="font-mono font-bold text-sm text-gray-900 mt-0.5">
              {maskAccountNumber(transaction.recipientAccountNumber)}
            </div>
            <div className="text-xs text-gray-500 truncate">{transaction.recipientName || 'Beneficiary'}</div>
          </div>
        </div>

        {/* Transaction Details Table */}
        <div className="space-y-2.5 text-xs text-left mb-6">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Transaction Date & Time</span>
            <span className="font-medium text-gray-900">{formatDateTime(transaction.createdAt || transaction.postedAt)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Transfer Fee</span>
            <span className="font-medium text-gray-900">0.00 SOS</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Total Debit</span>
            <span className="font-bold text-brand-black">
              {formatMoney(transaction.totalDebitMinorUnits || transaction.amount * 100, transaction.currency || 'SOS')}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Description / Note</span>
            <span className="font-medium text-gray-900 max-w-[60%] text-right truncate">
              {transaction.description || 'Internal Transfer'}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Security Verification</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Double-Entry Validated
            </span>
          </div>
        </div>

        {/* Actions (Hidden in Print) */}
        <div className="flex items-center gap-3 pt-2 no-print">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" icon={Printer} className="flex-1" onClick={handlePrint}>
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};

