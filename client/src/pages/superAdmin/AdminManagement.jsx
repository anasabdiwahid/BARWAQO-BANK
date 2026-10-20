import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { UserPlus, Search, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    branchId: '',
    jobTitle: 'Operations Administrator',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/users', {
        params: { role: 'ADMIN', search },
      });
      if (res.data.success) {
        setAdmins(res.data.data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      if (res.data.success) {
        setBranches(res.data.data || []);
        if (res.data.data.length > 0 && !formData.branchId) {
          setFormData((prev) => ({ ...prev, branchId: res.data.data[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchBranches();
  }, [search]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/users', {
        ...formData,
        role: 'ADMIN',
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          branchId: branches[0]?._id || '',
          jobTitle: 'Operations Administrator',
          password: '',
        });
        fetchAdmins();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create Admin account');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (adminId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/users/${adminId}/status`, { status: nextStatus });
      fetchAdmins();
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    }
  };

  return (
    <DashboardLayout pageTitle="Bank Administration & Admin Roles">
      <Card
        title="Authorized Bank Administrators"
        subtitle="Only the Super Admin is authorized to issue and manage Admin accounts"
        headerAction={
          <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Create New Admin
          </Button>
        }
      >
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search admins by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-red focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Admin Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.length > 0 ? (
                admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{admin.fullName}</div>
                      <div className="text-[11px] text-gray-400">{admin.jobTitle || 'Administrator'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{admin.email}</div>
                      <div className="text-[11px] font-mono text-gray-400">{admin.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {admin.branchId?.branchName || 'Central HQ'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={admin.status}>{admin.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                      {formatDateTime(admin.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant={admin.status === 'ACTIVE' ? 'outline' : 'success'}
                        onClick={() => toggleStatus(admin._id, admin.status)}
                      >
                        {admin.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Admin Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue New Admin Account">
        <form onSubmit={handleCreateAdmin} className="space-y-4">
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
              placeholder="e.g. Hassan Nur Duale"
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
                placeholder="hassan.admin@barwaqobank.so"
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
                placeholder="+252 61 8000001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Assigned Branch
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
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
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formLoading}>
              Confirm & Issue Admin Account
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

