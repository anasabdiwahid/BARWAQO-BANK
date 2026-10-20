import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const redirectByRole = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        navigate('/super-admin/dashboard');
        break;
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      case 'MANAGER':
        navigate('/manager/dashboard');
        break;
      case 'EMPLOYEE':
        navigate('/employee/dashboard');
        break;
      case 'CUSTOMER':
        navigate('/customer/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await login(identifier, password);
      redirectByRole(user.role);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Unable to sign in. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick switch credentials for smooth demo & evaluation
  const setDemoCredentials = (userType) => {
    switch (userType) {
      case 'superadmin':
        setIdentifier('superadmin@barwaqobank.so');
        setPassword('Barwaqo@2026');
        break;
      case 'admin':
        setIdentifier('admin@barwaqobank.so');
        setPassword('Barwaqo@2026');
        break;
      case 'manager':
        setIdentifier('manager@barwaqobank.so');
        setPassword('Barwaqo@2026');
        break;
      case 'employee':
        setIdentifier('amina.employee@barwaqobank.so');
        setPassword('Barwaqo@2026');
        break;
      case 'customer':
        setIdentifier('10011001'); // 8-digit account number!
        setPassword('Barwaqo@2026');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111111] via-[#181818] to-[#222222] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-gray-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Full Brand Logo */}
        <div className="bg-white p-4 rounded-2xl shadow-xl inline-block mb-4 border border-gray-100">
          <img
            src="/logos/logo-full.jpg"
            alt="BARWAQO BANK"
            className="h-20 w-auto object-contain mx-auto"
          />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          BARWAQO BANK
        </h2>
        <p className="mt-1 text-xs text-gray-400 font-medium">
          Secure Core Banking & Administration Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-gray-900 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-gray-100">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                Account ID / Email / Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 10011001 or admin@barwaqobank.so"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                Security Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-sm px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red font-medium transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-gray-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-brand-red focus:ring-brand-red mr-2"
                  defaultChecked
                />
                Remember this terminal
              </label>
              <span className="text-gray-400 hover:text-brand-red cursor-pointer">
                Forgot password?
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full"
              >
                Sign In to Barwaqo Bank
              </Button>
            </div>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2.5">
              Quick Test Role Auto-Fill
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => setDemoCredentials('superadmin')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-900 text-white hover:bg-red-800 transition"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-700 text-white hover:bg-red-600 transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('manager')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-900 text-white hover:bg-black transition"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('employee')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition"
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('customer')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 transition"
              >
                Customer (10011001)
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected with TLS 1.3 & 256-Bit Financial Encryption</span>
        </div>
      </div>
    </div>
  );
};

