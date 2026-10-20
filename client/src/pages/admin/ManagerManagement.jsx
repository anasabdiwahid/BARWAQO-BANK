import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { UserPlus, Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const ManagerManagement = () => {
  const { user } = useAuth();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: 'Branch Operations Manager',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchManagers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'MANAGER' } });
      if (res.data.success) {
        setManagers(res.data.data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/users', {
        ...formData,
        role: 'MANAGER',
        branchId: user.branchId,
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          jobTitle: 'Branch Operations Manager',
          password: '',
        });
        fetchManagers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create Manager');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Manager Management">
      <Card
        title="Branch Managers"
        subtitle="Manage and appoint operational managers to supervise banking floors"
        headerAction={
          <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Appoint New Manager
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Manager Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {managers.length > 0 ? (
                managers.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{m.fullName}</div>
                      <div className="text-[11px] text-gray-400">{m.jobTitle}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{m.email}</div>
                      <div className="text-[11px] font-mono text-gray-400">{m.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {m.branchId?.branchName || 'Assigned Branch'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={m.status}>{m.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                      {formatDateTime(m.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No managers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Appoint Branch Manager">
        <form onSubmit={handleCreateManager} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="e.g. Jama Hassan Warsame"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                placeholder="jama.manager@barwaqobank.so"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                placeholder="+252 61 7000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Initial Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="Min 8 characters"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formLoading}>
              Save & Appoint Manager
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

