import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatementModal } from '../../components/receipts/StatementModal';
import { FileText, Printer, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/formatters';

export const StatementPage = () => {
  const { primaryAccount } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <DashboardLayout pageTitle="Official Statements">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card
          title="Account Statements & Ledger Reconciliation"
          subtitle="Generate, view, and print official certified bank statements for your records or embassy/visa requests"
        >
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Selected Account</span>
                <div className="font-mono text-xl font-bold text-brand-black mt-0.5">
                  {primaryAccount?.accountNumber || '10011001'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-semibold uppercase">Current Balance</span>
                <div className="font-mono text-lg font-bold text-emerald-700 mt-0.5">
                  {formatMoney(primaryAccount?.ledgerBalanceMinorUnits, primaryAccount?.currency || 'SOS')}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Official statement includes bank letterhead with BARWAQO BANK typography, branch codes, opening balances, total credits, total debits, and individual double-entry ledger entries.
            </p>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={FileText}
                className="w-full"
                onClick={() => setShowModal(true)}
              >
                Generate & Inspect Statement
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <StatementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        accountNumber={primaryAccount?.accountNumber}
      />
    </DashboardLayout>
  );
};

