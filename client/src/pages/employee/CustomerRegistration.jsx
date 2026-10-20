import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CheckCircle2, UserPlus, AlertCircle, ShieldCheck, Printer } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/formatters';

export const CustomerRegistration = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'MALE',
    motherName: '',
    responsiblePersonName: '',
    responsiblePersonRelationship: 'Father',
    responsiblePersonPhone: '',
    identityDocumentType: 'NATIONAL_ID',
    identityDocumentNumber: '',
    dateOfBirth: '1995-01-01',
    phone: '',
    email: '',
    address: '',
    city: 'Mogadishu',
    country: 'Somalia',
    branchId: user?.branchId || '',
    accountType: 'SAVINGS',
    initialDeposit: 0,
    password: '',
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches');
        if (res.data.success) {
          setBranches(res.data.data || []);
          if (!formData.branchId && res.data.data.length > 0) {
            setFormData((prev) => ({ ...prev, branchId: res.data.data[0]._id }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'initialDeposit' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessData(null);

    try {
      const res = await api.post('/customers', formData);
      if (res.data.success) {
        setSuccessData(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Customer registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setFormData({
      fullName: '',
      gender: 'MALE',
      motherName: '',
      responsiblePersonName: '',
      responsiblePersonRelationship: 'Father',
      responsiblePersonPhone: '',
      identityDocumentType: 'NATIONAL_ID',
      identityDocumentNumber: '',
      dateOfBirth: '1995-01-01',
      phone: '',
      email: '',
      address: '',
      city: 'Mogadishu',
      country: 'Somalia',
      branchId: user?.branchId || branches[0]?._id || '',
      accountType: 'SAVINGS',
      initialDeposit: 0,
      password: '',
    });
  };

  return (
    <DashboardLayout pageTitle="New Customer Account Onboarding">
      {successData ? (
        <Card className="max-w-2xl mx-auto border-2 border-emerald-500/30 text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            Account Created & Activated Successfully!
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Official customer onboarding completed and sequential 8-digit account issued.
          </p>

          <div className="my-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 max-w-lg mx-auto text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-sans text-gray-500 font-semibold">Account Number:</span>
              <span className="text-base font-black text-brand-red">
                {successData.account.accountNumber}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-sans text-gray-500 font-semibold">Customer ID:</span>
              <span className="font-bold text-gray-900">{successData.customer.customerId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-sans text-gray-500 font-semibold">Account Holder:</span>
              <span className="font-bold text-gray-900">{successData.customer.fullName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-sans text-gray-500 font-semibold">Opening Balance:</span>
              <span className="font-bold text-emerald-700">
                {formatMoney(successData.account.ledgerBalanceMinorUnits, successData.account.currency)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-sans text-gray-500 font-semibold">Portal Login ID:</span>
              <span className="font-bold text-gray-900">{successData.account.accountNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-sans text-gray-500 font-semibold">Status:</span>
              <span className="font-bold text-emerald-700 uppercase">{successData.account.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Print Welcome Letter
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={handleReset}>
              Register Another Customer
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer Personal Profile */}
          <Card
            title="1. Customer Personal Information"
            subtitle="Required for regulatory compliance and identity verification"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Full Name (First, Middle, Surname) *
                </label>
                <input
                  type="text"
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Liban Abdirahman Koshin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Mother's Full Name *
                </label>
                <input
                  type="text"
                  required
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="e.g. Fadumo Farah Warsame"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  ID Document Type *
                </label>
                <select
                  name="identityDocumentType"
                  value={formData.identityDocumentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                >
                  <option value="NATIONAL_ID">National ID Card</option>
                  <option value="PASSPORT">International Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  ID Document Number *
                </label>
                <input
                  type="text"
                  required
                  name="identityDocumentNumber"
                  value={formData.identityDocumentNumber}
                  onChange={handleChange}
                  placeholder="e.g. SOM-ID-8829101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Contact & Responsible Person (Next of Kin) */}
          <Card
            title="2. Contact Details & Next of Kin (Responsible Person)"
            subtitle="Emergency contact and authorized guardian / responsible individual"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Customer Phone Number *
                </label>
                <input
                  type="text"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+252 61 9000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Residential Street Address *
                </label>
                <input
                  type="text"
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="District, Section, Street, House Number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">City *</label>
                <input
                  type="text"
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 uppercase mb-1">Country *</label>
                <input
                  type="text"
                  required
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 pt-3 border-t">
                <h4 className="font-bold text-gray-900 text-xs mb-3">Responsible Person Details</h4>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Next of Kin Name *
                </label>
                <input
                  type="text"
                  required
                  name="responsiblePersonName"
                  value={formData.responsiblePersonName}
                  onChange={handleChange}
                  placeholder="e.g. Abdirahman Koshin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  name="responsiblePersonRelationship"
                  value={formData.responsiblePersonRelationship}
                  onChange={handleChange}
                  placeholder="Father / Spouse / Sibling"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Responsible Person Phone *
                </label>
                <input
                  type="text"
                  required
                  name="responsiblePersonPhone"
                  value={formData.responsiblePersonPhone}
                  onChange={handleChange}
                  placeholder="+252 61 7000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Bank Account Configuration */}
          <Card
            title="3. Account Type & Portal Credentials"
            subtitle="The system will automatically allocate the next sequential 8-digit account number (e.g. 10011005)"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Account Type *
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                >
                  <option value="SAVINGS">Savings Account (SOS)</option>
                  <option value="CURRENT">Current Checking Account (SOS)</option>
                  <option value="BUSINESS">Business Commercial Account (SOS)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Initial Cash Deposit (SOS)
                </label>
                <input
                  type="number"
                  min="0"
                  name="initialDeposit"
                  value={formData.initialDeposit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Initial Portal Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-red focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleReset}>
                Clear Form
              </Button>
              <Button type="submit" variant="primary" size="lg" isLoading={loading} icon={UserPlus}>
                Complete KYC & Open Account
              </Button>
            </div>
          </Card>
        </form>
      )}
    </DashboardLayout>
  );
};

