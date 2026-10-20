import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UserPlus, Search, Lock, RotateCcw, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const res = await api.get('/dashboard/employee');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeData();
  }, []);

  const stats = data?.stats || {};

  return (
    <DashboardLayout pageTitle="Employee Banking Desk">
      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-brand-black to-[#252525] text-white p-6 rounded-2xl shadow-md border border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-brand-red tracking-wider">
            Counter Operations
          </span>
          <h2 className="text-xl font-extrabold mt-0.5">Welcome to Barwaqo Service Desk</h2>
          <p className="text-xs text-gray-300 mt-1">
            Register new customers, query account numbers, apply permitted holds, or report disputed transfers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/employee/register-customer">
            <Button variant="primary" icon={UserPlus}>
              Register New Customer
            </Button>
          </Link>
          <Link to="/employee/customers">
            <Button variant="outline" icon={Search} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Customer Directory
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-brand-red">
          <p className="text-xs font-semibold text-gray-500 uppercase">Customers Registered by You</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.registeredByMe || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Personal onboarding record</p>
        </Card>

        <Card className="border-l-4 border-l-gray-900">
          <p className="text-xs font-semibold text-gray-500 uppercase">Branch Accounts</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.branchCustomers || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Active customer base</p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Open Support Cases</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pendingTickets || 0}</h3>
          <p className="text-[11px] text-gray-400 mt-2">Customer inquiries & disputes</p>
        </Card>
      </div>

      <Card title="Recent Branch Counter Transactions" subtitle="Live transactions processed in this branch">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3">Beneficiary</th>
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
                    <td className="py-2.5 px-3 font-mono text-gray-600">
                      {tx.senderAccountNumber || 'VAULT'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                      {tx.recipientAccountNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                      {formatMoney(tx.amountMinorUnits, tx.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No counter transactions today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
};

