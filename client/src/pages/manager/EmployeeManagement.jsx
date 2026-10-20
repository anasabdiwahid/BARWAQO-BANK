import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { UserPlus } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: 'Customer Service Officer',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'EMPLOYEE' } });
      if (res.data.success) {
        setEmployees(res.data.data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/users', {
        ...formData,
        role: 'EMPLOYEE',
        branchId: user.branchId,
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          jobTitle: 'Customer Service Officer',
          password: '',
        });
        fetchEmployees();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create Employee');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Employee Team Management">
      <Card
        title="Branch Staff Members"
        subtitle="Manage tellers and customer relationship officers authorized to register customers"
        headerAction={
          <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Add New Employee
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Appointed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{emp.fullName}</div>
                      <div className="text-[11px] text-gray-400">{emp.jobTitle}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{emp.email}</div>
                      <div className="text-[11px] font-mono text-gray-400">{emp.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {emp.branchId?.branchName || 'Assigned Branch'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={emp.status}>{emp.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                      {formatDateTime(emp.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Employee">
        <form onSubmit={handleCreateEmployee} className="space-y-4">
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
              placeholder="e.g. Maryan Abdi Jimale"
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
                placeholder="maryan.employee@barwaqobank.so"
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
                placeholder="+252 61 8888888"
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
              Confirm Employee
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

