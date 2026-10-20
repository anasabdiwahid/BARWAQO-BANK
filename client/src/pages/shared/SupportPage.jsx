import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LifeBuoy, Plus, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const SupportPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: 'INCORRECT_TRANSFER',
    subject: '',
    description: '',
    priority: 'MEDIUM',
    relatedAccount: '',
    relatedTransaction: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  const isStaff = user?.role !== 'CUSTOMER';

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support');
      if (res.data.success) {
        setTickets(res.data.data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await api.post('/support', formData);
      if (res.data.success) {
        setIsCreateOpen(false);
        setFormData({
          category: 'INCORRECT_TRANSFER',
          subject: '',
          description: '',
          priority: 'MEDIUM',
          relatedAccount: '',
          relatedTransaction: '',
        });
        fetchTickets();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Error submitting ticket');
    } finally {
      setFormLoading(false);
    }
  };

  const openTicketDetail = async (ticketId) => {
    try {
      const res = await api.get(`/support/${ticketId}`);
      if (res.data.success) {
        setActiveTicket(res.data.data);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to open ticket');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;
    setReplyLoading(true);
    try {
      const res = await api.post(`/support/${activeTicket._id}/messages`, {
        message: replyMessage,
      });
      if (res.data.success) {
        setActiveTicket(res.data.data);
        setReplyMessage('');
        fetchTickets();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Error sending reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicket) return;
    try {
      const res = await api.patch(`/support/${activeTicket._id}/status`, {
        status: 'RESOLVED',
        resolutionNotes: 'Case investigated and resolved by bank operations officer.',
      });
      if (res.data.success) {
        setActiveTicket(res.data.data);
        fetchTickets();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to resolve ticket');
    }
  };

  return (
    <DashboardLayout pageTitle="Support & Dispute Resolution">
      <Card
        title="Support & Dispute Cases"
        subtitle="Report incorrect transfers, account hold inquiries, and service tickets"
        headerAction={
          <Button variant="primary" icon={Plus} onClick={() => setIsCreateOpen(true)}>
            Open Support Ticket
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Ticket Ref</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.length > 0 ? (
                tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {t.ticketReference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{t.subject}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-sm">
                        {t.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {t.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={t.status}>{t.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={MessageSquare}
                        onClick={() => openTicketDetail(t._id)}
                      >
                        Messages ({t.messages?.length || 0})
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Ticket Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Submit Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
            >
              <option value="INCORRECT_TRANSFER">Incorrect / Mistaken Transfer</option>
              <option value="ACCOUNT_HOLD">Account Restriction / Hold Assistance</option>
              <option value="CARD_SERVICE">Card & Mobile Service</option>
              <option value="SUSPICIOUS_ACTIVITY">Suspicious Account Activity</option>
              <option value="GENERAL_INQUIRY">General Banking Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="e.g. Sent money to incorrect account"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Related Transaction Ref (If any)
              </label>
              <input
                type="text"
                value={formData.relatedTransaction}
                onChange={(e) => setFormData({ ...formData, relatedTransaction: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
                placeholder="e.g. BB-20261021-DEMO01"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Related Account (If any)
              </label>
              <input
                type="text"
                value={formData.relatedAccount}
                onChange={(e) => setFormData({ ...formData, relatedAccount: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
                placeholder="e.g. 10011001"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Description & Details *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="Describe your issue in detail..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formLoading}>
              Submit Case
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Conversation Detail Modal */}
      {activeTicket && (
        <Modal
          isOpen={Boolean(activeTicket)}
          onClose={() => setActiveTicket(null)}
          title={`Case ${activeTicket.ticketReference}: ${activeTicket.subject}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Badge status={activeTicket.status}>{activeTicket.status}</Badge>
                <span className="text-xs text-gray-500 font-medium">
                  {activeTicket.category.replace('_', ' ')}
                </span>
              </div>
              {isStaff && activeTicket.status !== 'RESOLVED' && (
                <Button size="sm" variant="success" icon={CheckCircle2} onClick={handleResolveTicket}>
                  Mark as Resolved
                </Button>
              )}
            </div>

            {/* Conversation Messages */}
            <div className="max-h-80 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-xl">
              {activeTicket.messages?.map((msg, index) => {
                const isCustomer = msg.senderRole === 'CUSTOMER';
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl text-xs max-w-[85%] ${
                      isCustomer
                        ? 'bg-white border border-gray-200 text-gray-900 ml-auto'
                        : 'bg-red-50/70 border border-red-100 text-gray-900 mr-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[11px] text-gray-800">
                        {isCustomer ? 'Customer' : 'Barwaqo Bank Officer'}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            {activeTicket.status !== 'RESOLVED' ? (
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2">
                <input
                  type="text"
                  required
                  placeholder="Type a follow-up reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
                <Button type="submit" variant="primary" size="sm" icon={Send} isLoading={replyLoading}>
                  Send
                </Button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg text-center font-semibold">
                This dispute case has been marked as Resolved.
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

