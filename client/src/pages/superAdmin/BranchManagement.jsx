import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Building2, Plus, MapPin, Phone, UserCheck } from 'lucide-react';
import api from '../../services/api';

export const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    city: 'Mogadishu',
    phone: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      if (res.data.success) {
        setBranches(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/branches', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({
          branchName: '',
          branchCode: '',
          address: '',
          city: 'Mogadishu',
          phone: '',
        });
        fetchBranches();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create branch');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Branch Network & Locations">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Registered Bank Branches</h2>
          <p className="text-xs text-gray-500">Manage bank locations, regional hubs, and operational jurisdiction</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add New Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => (
          <Card key={b._id} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold bg-red-100 text-brand-red px-2 py-0.5 rounded">
                  {b.branchCode}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-2">{b.branchName}</h3>
              </div>
              <Badge status={b.status}>{b.status}</Badge>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{b.address}, {b.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-mono">{b.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Manager: <strong className="text-gray-900">{b.managerId?.fullName || 'Assigned to Operations'}</strong></span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Branch">
        <form onSubmit={handleCreateBranch} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Branch Name
            </label>
            <input
              type="text"
              required
              value={formData.branchName}
              onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="e.g. Bosaso Commercial Branch"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Branch Code
              </label>
              <input
                type="text"
                required
                value={formData.branchCode}
                onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono uppercase"
                placeholder="e.g. BB-BS04"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                City / Region
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                placeholder="e.g. Bosaso"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
              placeholder="e.g. Airport Road Commercial Plaza"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Official Branch Phone
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
              placeholder="+252 61 5000004"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={formLoading}>
              Save Branch
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

