import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  ArrowRightLeft,
  ShieldAlert,
  RotateCcw,
  FileText,
  LifeBuoy,
  UserPlus,
  Search,
  Send,
  History,
  Lock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  Shield,
} from 'lucide-react';
import { getRoleBadgeClass } from '../../utils/formatters';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  // Build role-specific menu
  const getNavLinks = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Global Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
          { label: 'Admin Management', to: '/super-admin/admins', icon: Users },
          { label: 'Branches', to: '/super-admin/branches', icon: Building2 },
          { label: 'Transaction Ledger', to: '/super-admin/transactions', icon: ArrowRightLeft },
          { label: 'Holds & Restrictions', to: '/super-admin/restrictions', icon: Lock },
          { label: 'Reversal Approvals', to: '/super-admin/reversals', icon: RotateCcw },
          { label: 'System Audit Logs', to: '/super-admin/audit-logs', icon: Shield },
          { label: 'Support Disputes', to: '/super-admin/support', icon: LifeBuoy },
        ];

      case 'ADMIN':
        return [
          { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Managers', to: '/admin/managers', icon: Users },
          { label: 'Staff Overview', to: '/admin/staff', icon: Users },
          { label: 'Customer Overview', to: '/admin/customers', icon: Search },
          { label: 'Transactions', to: '/admin/transactions', icon: ArrowRightLeft },
          { label: 'Reversal Reviews', to: '/admin/reversals', icon: RotateCcw },
          { label: 'Branch Reports', to: '/admin/reports', icon: FileText },
          { label: 'Dispute Cases', to: '/admin/support', icon: LifeBuoy },
        ];

      case 'MANAGER':
        return [
          { label: 'Manager Dashboard', to: '/manager/dashboard', icon: LayoutDashboard },
          { label: 'Employee Staff', to: '/manager/employees', icon: Users },
          { label: 'Customer Search', to: '/manager/customers', icon: Search },
          { label: 'Reversals Review', to: '/manager/reversals', icon: RotateCcw },
          { label: 'Account Holds', to: '/manager/restrictions', icon: Lock },
          { label: 'Support Cases', to: '/manager/support', icon: LifeBuoy },
        ];

      case 'EMPLOYEE':
        return [
          { label: 'Employee Desk', to: '/employee/dashboard', icon: LayoutDashboard },
          { label: 'Register Customer', to: '/employee/register-customer', icon: UserPlus },
          { label: 'Search Customers', to: '/employee/customers', icon: Search },
          { label: 'Account Holds', to: '/employee/restrictions', icon: Lock },
          { label: 'Request Reversal', to: '/employee/reversals', icon: RotateCcw },
          { label: 'Support Tickets', to: '/employee/support', icon: LifeBuoy },
        ];

      case 'CUSTOMER':
        return [
          { label: 'My Dashboard', to: '/customer/dashboard', icon: LayoutDashboard },
          { label: 'Send Money', to: '/customer/transfer', icon: Send },
          { label: 'Transactions', to: '/customer/transactions', icon: History },
          { label: 'Account Statement', to: '/customer/statement', icon: FileText },
          { label: 'Disputes & Support', to: '/customer/support', icon: LifeBuoy },
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside
      className={`relative bg-brand-black text-white flex flex-col transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      } min-h-screen border-r border-gray-800 shrink-0`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-800 justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <img
              src="/logos/logo-icon.png"
              alt="Barwaqo Bank Icon"
              className="h-8 w-8 object-contain shrink-0"
            />
            <img
              src="/logos/logo-wordmark-white.png"
              alt="BARWAQO BANK"
              className="h-6 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <img
              src="/logos/logo-icon.png"
              alt="Barwaqo Bank"
              className="h-8 w-8 object-contain"
            />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* User Badge Profile snippet */}
      <div className={`p-4 border-b border-gray-800/80 bg-white/5 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div>
            <div className="text-xs font-bold text-gray-200 truncate">{user.fullName}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getRoleBadgeClass(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-red text-white font-bold text-xs flex items-center justify-center mx-auto">
            {user.fullName ? user.fullName[0] : 'B'}
          </div>
        )}
      </div>

      {/* Nav items list */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-red text-white shadow-md font-semibold'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

