import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { RotateCcw, Check, X, Plus, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export const Reversals = () => {
  const { user } = useAuth();
  const [reversals, setReversals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    transactionReference: '',
    reason: '',
    caseReference: '',
  });
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isSupervisor = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role);

  const fetchReversals = async () => {
    try {
      const res = await api.get('/reversals');
      if (res.data.success) {
        setReversals(res.data.data.reversals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReversals();
  }, []);

  const handleRequestReversal = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/reversals/request', formData);
      if (res.data.success) {
        setIsRequestModalOpen(false);
        setFormData({
          transactionReference: '',
          reason: '',
          caseReference: '',
        });
        fetchReversals();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit reversal request.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReviewReversal = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setFormLoading(true);
    try {
      const res = await api.post(`/reversals/${reviewTarget._id}/review`, {
        action: reviewAction,
        reviewNotes,
      });
      if (res.data.success) {
        setReviewTarget(null);
        setReviewNotes('');
        fetchReversals();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Review action failed.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Controlled Transaction Reversals">
      <Card
        title="Transaction Investigation & Reversal Desk"
        subtitle="Controlled workflow for investigating mistaken transfers and executing linked compensating ledger entries"
        headerAction={
          <Button variant="primary" icon={RotateCcw} onClick={() => setIsRequestModalOpen(true)}>
            Request Reversal
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Request Ref</th>
                <th className="py-3 px-4">Original Transaction</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reversals.length > 0 ? (
                reversals.map((rev) => (
                  <tr key={rev._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                      {rev.reversalReference}
                    </td>
                    <td className="py-3 px-4 font-mono text-brand-red font-medium">
                      {rev.originalTransactionReference}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      {formatMoney(rev.requestedAmountMinorUnits, 'SOS')}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-600">
                      {rev.reason}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                      {rev.requestedBy?.fullName || 'Staff'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={rev.status}>{rev.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rev.status === 'PENDING' && isSupervisor && String(rev.requestedBy?._id) !== String(user._id) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setReviewTarget(rev);
                            setReviewAction('APPROVE');
                          }}
                        >
                          Review & Execute
                        </Button>
                      ) : (
                        <span className="text-gray-400 font-mono text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No reversal cases recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Request Reversal Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Reversal Request"
      >
        <form onSubmit={handleRequestReversal} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Original Transaction Reference *
            </label>
            <input
              type="text"
              required
              value={formData.transactionReference}
              onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
              placeholder="e.g. BB-20261021-DEMO01"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Reason for Requesting Reversal *
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="State the error or customer complaint reason (e.g. sender typed incorrect recipient account)..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Dispute / Case Reference (Optional)
            </label>
            <input
              type="text"
              value={formData.caseReference}
              onChange={(e) => setFormData({ ...formData, caseReference: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
              placeholder="e.g. DISP-9921"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formLoading}>
              Submit for Supervisory Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Reversal Modal */}
      {reviewTarget && (
        <Modal
          isOpen={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          title={`Supervisory Review: ${reviewTarget.reversalReference}`}
        >
          <form onSubmit={handleReviewReversal} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl text-xs space-y-1.5 border border-gray-100">
              <p><span className="text-gray-500">Transaction Reference:</span> <strong className="font-mono text-gray-900">{reviewTarget.originalTransactionReference}</strong></p>
              <p><span className="text-gray-500">Amount:</span> <strong className="font-mono text-brand-red">{formatMoney(reviewTarget.requestedAmountMinorUnits, 'SOS')}</strong></p>
              <p><span className="text-gray-500">Reported Reason:</span> {reviewTarget.reason}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Supervisory Decision *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVE')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Approve & Execute Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REJECT')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    reviewAction === 'REJECT'
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Reject Request
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Supervisory Notes
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                placeholder="State approval confirmation or reason for rejection..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" type="button" onClick={() => setReviewTarget(null)}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'APPROVE' ? 'success' : 'danger'}
                size="sm"
                type="submit"
                isLoading={formLoading}
              >
                Confirm {reviewAction === 'APPROVE' ? 'Execution' : 'Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

