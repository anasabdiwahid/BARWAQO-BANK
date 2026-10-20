import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Lock, Unlock, Plus, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export const Restrictions = () => {
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    accountNumber: '',
    restrictionType: 'PARTIAL_HOLD',
    amount: 0,
    reason: '',
    caseReference: '',
  });
  const [releaseReason, setReleaseReason] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRestrictions = async () => {
    try {
      const res = await api.get('/restrictions');
      if (res.data.success) {
        setRestrictions(res.data.data.restrictions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestrictions();
  }, []);

  const handleApplyRestriction = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/restrictions', formData);
      if (res.data.success) {
        setIsApplyModalOpen(false);
        setFormData({
          accountNumber: '',
          restrictionType: 'PARTIAL_HOLD',
          amount: 0,
          reason: '',
          caseReference: '',
        });
        fetchRestrictions();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to apply restriction.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReleaseRestriction = async (e) => {
    e.preventDefault();
    if (!releaseTarget) return;
    setFormLoading(true);
    try {
      const res = await api.post(`/restrictions/${releaseTarget._id}/release`, {
        releaseReason,
      });
      if (res.data.success) {
        setReleaseTarget(null);
        setReleaseReason('');
        fetchRestrictions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to release restriction.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Account Restrictions & Holds">
      <Card
        title="Active Account Holds & Freezes"
        subtitle="Manage compliance holds, court orders, and risk-mitigation account freezes"
        headerAction={
          <Button variant="danger" icon={Lock} onClick={() => setIsApplyModalOpen(true)}>
            Apply Restriction
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Hold Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {restrictions.length > 0 ? (
                restrictions.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                      {r.restrictionReference}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-red">
                      {r.accountNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-800">
                        {r.restrictionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                      {r.amountMinorUnits > 0 ? formatMoney(r.amountMinorUnits, r.currency) : '-'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-600">
                      {r.reason}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                      {r.createdBy?.fullName || 'Compliance'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={r.status}>{r.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Unlock}
                          onClick={() => setReleaseTarget(r)}
                        >
                          Release
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-[11px] font-mono">Released</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No active restrictions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apply Restriction Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply Account Restriction / Hold"
      >
        <form onSubmit={handleApplyRestriction} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              8-Digit Account Number *
            </label>
            <input
              type="text"
              required
              pattern="^\d{8}$"
              maxLength={8}
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
              placeholder="e.g. 10011001"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Restriction Type *
              </label>
              <select
                value={formData.restrictionType}
                onChange={(e) => setFormData({ ...formData, restrictionType: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              >
                <option value="PARTIAL_HOLD">Partial Funds Hold (Amount)</option>
                <option value="FULL_FREEZE">Full Account Freeze</option>
                <option value="DEBIT_RESTRICTION">Debit Restriction</option>
                <option value="CREDIT_RESTRICTION">Credit Restriction</option>
                <option value="COMPLIANCE_HOLD">Compliance Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Hold Amount (SOS)
              </label>
              <input
                type="number"
                min="0"
                value={formData.amount}
                disabled={formData.restrictionType === 'FULL_FREEZE'}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono disabled:bg-gray-100"
                placeholder="Applicable for partial hold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Legal / Operational Reason *
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="State regulatory case or specific risk reason for placing this hold..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Case / Reference Number (Optional)
            </label>
            <input
              type="text"
              value={formData.caseReference}
              onChange={(e) => setFormData({ ...formData, caseReference: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
              placeholder="e.g. COMP-2026-99"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={formLoading}>
              Confirm Restriction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Release Restriction Modal */}
      {releaseTarget && (
        <Modal
          isOpen={Boolean(releaseTarget)}
          onClose={() => setReleaseTarget(null)}
          title={`Release Restriction: ${releaseTarget.restrictionReference}`}
        >
          <form onSubmit={handleReleaseRestriction} className="space-y-4">
            <p className="text-xs text-gray-600">
              You are lifting the restriction on Account <strong>{releaseTarget.accountNumber}</strong>.
              All held funds will be restored to available balance.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Release Justification & Authorized Reason *
              </label>
              <textarea
                required
                rows={3}
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                placeholder="State why this hold is now eligible for release..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" type="button" onClick={() => setReleaseTarget(null)}>
                Cancel
              </Button>
              <Button variant="success" size="sm" type="submit" isLoading={formLoading}>
                Confirm Release
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

