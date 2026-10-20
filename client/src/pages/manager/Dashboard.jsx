import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Users, Search, RotateCcw, LifeBuoy, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { formatDateTime, formatMoney } from '../../utils/formatters';

export const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const res = await api.get('/dashboard/manager');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchManagerData();
  }, []);

  const stats = data?.stats || {};

  return (
    <DashboardLayout pageTitle="Branch Operations & Supervision Desk">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-brand-red">
          <p className="text-xs font-semibold text-gray-500 uppercase">Supervised Employees</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.employeesCount || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Active branch staff</p>
        </Card>

        <Card className="border-l-4 border-l-gray-900">
          <p className="text-xs font-semibold text-gray-500 uppercase">Branch Customers</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.customerCount || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Registered account holders</p>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <p className="text-xs font-semibold text-gray-500 uppercase">Reversal Requests</p>
          <h3 className="text-2xl font-black text-purple-700 mt-1">{stats.pendingReversals || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Awaiting your approval</p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Customer Support Cases</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.openTickets || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Open customer dispute tickets</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Assigned Employees" subtitle="Supervised tellers and customer relationship officers">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.employees?.length > 0 ? (
                  data.employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-gray-900">{emp.fullName}</div>
                        <div className="text-[11px] text-gray-400">{emp.jobTitle}</div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        <div>{emp.email}</div>
                        <div className="text-[10px] font-mono text-gray-400">{emp.phone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge status={emp.status}>{emp.status}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400">
                      No employees assigned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Recent Branch Activities" subtitle="Transfers posted at this branch">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.recentTransactions?.length > 0 ? (
                  data.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-900">
                        {tx.transactionReference}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                        {formatMoney(tx.amountMinorUnits, tx.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400">
                      No recent transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

