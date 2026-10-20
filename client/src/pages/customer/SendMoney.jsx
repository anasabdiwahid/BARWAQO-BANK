import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ReceiptModal } from '../../components/receipts/ReceiptModal';
import {
  Send,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/formatters';

export const SendMoney = () => {
  const { primaryAccount, refreshMe } = useAuth();

  const [step, setStep] = useState(1); // 1: Input details, 2: Preview & Confirm, 3: Completed
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [previewData, setPreviewData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedTx, setCompletedTx] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Step 1 -> 2: Preview Recipient and Check Balances
  const handlePreview = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/transfers/preview', {
        recipientAccountNumber: recipientAccountNumber.trim(),
        amount: Number(amount),
        currency: 'SOS',
      });

      if (res.data.success) {
        setPreviewData(res.data.data);
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Transfer validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Atomic Execution
  const handleExecuteTransfer = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const idempotencyKey = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const res = await api.post('/transfers/execute', {
        recipientAccountNumber: recipientAccountNumber.trim(),
        amount: Number(amount),
        currency: 'SOS',
        description: description || 'Customer Transfer',
        idempotencyKey,
      });

      if (res.data.success) {
        setCompletedTx(res.data.data.transaction);
        setStep(3);
        await refreshMe();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Transfer execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setRecipientAccountNumber('');
    setAmount('');
    setDescription('');
    setPreviewData(null);
    setCompletedTx(null);
    setErrorMsg('');
  };

  return (
    <DashboardLayout pageTitle="Instant Money Transfer">
      <div className="max-w-xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1 ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-gray-700">Enter Details</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-200" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2 ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-gray-700">Review</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-200" />

          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3 ? 'bg-brand-success text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-gray-700">Receipt</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter details */}
        {step === 1 && (
          <Card
            title="Customer-to-Customer Transfer"
            subtitle="Send funds securely to any registered 8-digit Barwaqo Bank account"
          >
            <form onSubmit={handlePreview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Recipient 8-Digit Account Number *
                </label>
                <input
                  type="text"
                  required
                  pattern="^\d{8}$"
                  maxLength={8}
                  value={recipientAccountNumber}
                  onChange={(e) => setRecipientAccountNumber(e.target.value)}
                  placeholder="e.g. 10011002"
                  className="w-full text-base font-mono font-bold px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red focus:outline-none"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Must be exactly 8 digits allocated by Barwaqo Bank
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Transfer Amount (SOS) *
                  </label>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Available: <strong className="text-emerald-700">{formatMoney(primaryAccount?.availableBalanceMinorUnits, 'SOS')}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-lg font-mono font-bold px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Payment Description / Reference
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Family support, invoice payment"
                  className="w-full text-xs px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red focus:outline-none"
                />
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={loading}
                  icon={ArrowRight}
                >
                  Verify Recipient & Proceed
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 2: Preview and Confirmation */}
        {step === 2 && previewData && (
          <Card
            title="Review & Confirm Transfer"
            subtitle="Please verify the beneficiary and financial amounts before committing"
          >
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Beneficiary Account:</span>
                  <span className="font-mono font-bold text-brand-red text-sm">
                    {previewData.recipient.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Verified Beneficiary Name:</span>
                  <span className="font-bold text-gray-900">
                    {previewData.recipient.maskedName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Transfer Amount:</span>
                  <span className="font-bold font-mono text-gray-900 text-base">
                    {formatMoney(previewData.transfer.amountMinorUnits, 'SOS')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Transfer Fee:</span>
                  <span className="font-mono text-emerald-700 font-bold">0.00 SOS (Free)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 font-semibold">Total Debit:</span>
                  <span className="font-mono font-black text-brand-black text-base">
                    {formatMoney(previewData.transfer.totalDebitMinorUnits, 'SOS')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Sufficient available balance confirmed. Transfer will post to the ledger immediately.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Edit Transfer
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={handleExecuteTransfer}
                  isLoading={loading}
                  icon={Send}
                >
                  Confirm & Transfer Now
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Completed Transfer */}
        {step === 3 && completedTx && (
          <Card className="text-center py-6 border-2 border-emerald-500/30">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-gray-900">Transfer Completed!</h3>
            <p className="text-xs text-gray-500 mt-1">
              Your money has been credited to beneficiary account{' '}
              <span className="font-mono font-bold text-gray-800">{completedTx.recipientAccountNumber}</span>.
            </p>

            <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 max-w-sm mx-auto text-xs space-y-2 font-mono">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500 font-sans">Reference:</span>
                <span className="font-bold text-gray-900">{completedTx.transactionReference}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500 font-sans">Amount:</span>
                <span className="font-bold text-emerald-700">
                  {formatMoney(completedTx.amountMinorUnits, completedTx.currency)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-sans">Status:</span>
                <span className="font-bold text-emerald-700 uppercase">POSTED</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setShowReceipt(true)}>
                View & Print Receipt
              </Button>
              <Button variant="primary" onClick={resetForm}>
                Make Another Transfer
              </Button>
            </div>
          </Card>
        )}
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={completedTx}
      />
    </DashboardLayout>
  );
};

