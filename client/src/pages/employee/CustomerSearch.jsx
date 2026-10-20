import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { StatementModal } from '../../components/receipts/StatementModal';
import { Search, Eye, ShieldCheck, Lock, ArrowRight, User } from 'lucide-react';
import api from '../../services/api';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';

export const CustomerSearch = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [statementAccount, setStatementAccount] = useState(null);

  const fetchCustomers = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { search: query } });
      if (res.data.success) {
        setCustomers(res.data.data.customers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const openCustomerDetail = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomerDetail(res.data.data);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Error fetching details');
    }
  };

  return (
    <DashboardLayout pageTitle="Customer Directory & Account Query">
      <Card
        title="Search Customer Accounts"
        subtitle="Lookup accounts by Customer Name, 8-Digit Account Number, Phone, or ID"
      >
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search by 8-digit account (e.g. 10011001), name (e.g. Sahra), or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-1 focus:ring-brand-red focus:outline-none font-medium"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Available Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-brand-red text-sm">
                      {c.account?.accountNumber || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{c.fullName}</div>
                      <div className="text-[11px] text-gray-400">{c.city}, Somalia</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 font-semibold">
                      {c.customerId}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {c.account ? formatMoney(c.account.availableBalanceMinorUnits, c.account.currency) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={c.account?.status || 'ACTIVE'}>
                        {c.account?.status || 'ACTIVE'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Eye}
                        onClick={() => openCustomerDetail(c._id)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No matching customer accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Detail Modal */}
      {customerDetail && (
        <Modal
          isOpen={Boolean(customerDetail)}
          onClose={() => setCustomerDetail(null)}
          title={`Customer File: ${customerDetail.customer.fullName}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Header pill */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <span className="text-[11px] font-mono text-gray-400">CUSTOMER ID</span>
                <div className="font-mono font-bold text-base text-gray-900">
                  {customerDetail.customer.customerId}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-mono text-gray-400">BRANCH</span>
                <div className="font-medium text-xs text-gray-900">
                  {customerDetail.customer.branchId?.branchName || 'Central Branch'}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-mono text-gray-400">KYC VERIFICATION</span>
                <div>
                  <Badge status={customerDetail.customer.kycStatus}>
                    {customerDetail.customer.kycStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Account Financials */}
            {customerDetail.accounts?.map((acc) => (
              <div key={acc._id} className="p-4 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-brand-red">
                      {acc.accountNumber}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-600">
                      {acc.accountType}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatementAccount(acc.accountNumber)}
                  >
                    View Full Statement
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-[10px] text-gray-500 font-bold uppercase">Ledger Balance</div>
                    <div className="text-sm font-bold font-mono text-gray-900 mt-0.5">
                      {formatMoney(acc.ledgerBalanceMinorUnits, acc.currency)}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase">Available Balance</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                      {formatMoney(acc.availableBalanceMinorUnits, acc.currency)}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="text-[10px] text-amber-700 font-bold uppercase">Restricted Hold</div>
                    <div className="text-sm font-bold font-mono text-amber-700 mt-0.5">
                      {formatMoney(acc.restrictedBalanceMinorUnits, acc.currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Next of Kin & Identity Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1.5">
                <h4 className="font-bold text-gray-800 uppercase text-[10px] mb-2">Personal & Family</h4>
                <p><span className="text-gray-500">Mother's Name:</span> <strong>{customerDetail.customer.motherName}</strong></p>
                <p><span className="text-gray-500">Date of Birth:</span> {formatDate(customerDetail.customer.dateOfBirth)}</p>
                <p><span className="text-gray-500">Phone:</span> {customerDetail.customer.phone}</p>
                <p><span className="text-gray-500">Address:</span> {customerDetail.customer.address}, {customerDetail.customer.city}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1.5">
                <h4 className="font-bold text-gray-800 uppercase text-[10px] mb-2">Responsible Person (Next of Kin)</h4>
                <p><span className="text-gray-500">Name:</span> <strong>{customerDetail.customer.responsiblePersonName}</strong></p>
                <p><span className="text-gray-500">Relationship:</span> {customerDetail.customer.responsiblePersonRelationship}</p>
                <p><span className="text-gray-500">Phone:</span> {customerDetail.customer.responsiblePersonPhone}</p>
                <p><span className="text-gray-500">Document:</span> {customerDetail.customer.identityDocumentType} ({customerDetail.customer.identityDocumentNumber})</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Statement Modal */}
      <StatementModal
        isOpen={Boolean(statementAccount)}
        onClose={() => setStatementAccount(null)}
        accountNumber={statementAccount}
      />
    </DashboardLayout>
  );
};

