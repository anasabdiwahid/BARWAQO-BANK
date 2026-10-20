import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const DashboardLayout = ({ children, pageTitle = 'Dashboard' }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

