import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Shield, Search, Filter, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit', {
        params: { search, action: actionFilter, page, limit: 25 },
      });
      if (res.data.success) {
        setLogs(res.data.data.logs || []);
        setPagination(res.data.data.pagination || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter, page]);

  return (
    <DashboardLayout pageTitle="Append-Only Security Audit Log">
      <Card
        title="Immutable Core Banking Audit Trail"
        subtitle="All security events, financial transfers, and permission modifications are permanently recorded"
        headerAction={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchLogs} isLoading={loading}>
            Refresh
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by actor, action, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-brand-red"
          />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
          >
            <option value="">All Audit Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
            <option value="MONEY_TRANSFER_SUCCESS">MONEY_TRANSFER_SUCCESS</option>
            <option value="CUSTOMER_REGISTERED">CUSTOMER_REGISTERED</option>
            <option value="ACCOUNT_RESTRICTION_APPLIED">ACCOUNT_RESTRICTION_APPLIED</option>
            <option value="REVERSAL_EXECUTED">REVERSAL_EXECUTED</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-sans font-semibold text-gray-900 block truncate max-w-[140px]">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] text-gray-400">{log.actorRole}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 truncate max-w-[150px]">
                      {log.resourceType}: {log.resourceId || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge status={log.outcome}>{log.outcome}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-sans">
                    No matching audit records found.
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

