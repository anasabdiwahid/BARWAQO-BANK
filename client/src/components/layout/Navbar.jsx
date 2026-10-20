import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, ShieldCheck, UserCheck, ChevronDown, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export const Navbar = ({ pageTitle = 'Dashboard' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (e) {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // 20s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200/90 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & Brand pill */}
      <div className="flex items-center gap-3">
        <img
          src="/logos/logo-icon.png"
          alt="BARWAQO BANK"
          className="h-8 w-8 object-contain"
        />
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">{pageTitle}</h1>
          <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider block">BARWAQO BANK</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-2">
          <ShieldCheck className="w-3 h-3" />
          <span>Core Online</span>
        </span>
      </div>

      {/* Right controls: Notifications & User profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-brand-red hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3.5 text-xs transition ${
                        !n.isRead ? 'bg-red-50/30' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-gray-900">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-red shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-gray-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-gray-400 mt-1.5 block">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User preview */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-brand-red text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.fullName ? user.fullName[0] : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-gray-900 leading-none">{user?.fullName}</div>
            <div className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-wide">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

