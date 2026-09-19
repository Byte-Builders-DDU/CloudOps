import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, RoleBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatDateTime } from '../utils/formatters';
import {
  FileText,
  Filter,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
} from 'lucide-react';
import { auditService } from '../services/auditService';

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await auditService.getAuditLogs({
        action: actionFilter,
        limit: 50,
      });
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'SCALE_RESOURCE':
        return <Badge variant="primary">SCALE WORKLOAD</Badge>;
      case 'CREATE_POLICY':
      case 'UPDATE_POLICY':
      case 'TOGGLE_POLICY':
        return <Badge variant="purple">GOVERNANCE</Badge>;
      case 'USER_LOGIN':
        return <Badge variant="success">AUTH LOGIN</Badge>;
      case 'RESTART_RESOURCE':
        return <Badge variant="warning">RESTART</Badge>;
      case 'SYNC_CLOUD_ACCOUNT':
        return <Badge variant="primary">CONNECTOR SYNC</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  const parseDetails = (detailsStr) => {
    try {
      return JSON.parse(detailsStr);
    } catch (e) {
      return detailsStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Filter Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs rounded-md border border-[#E2E8F0] px-3 py-1.5 bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Audit Actions</option>
              <option value="SCALE_RESOURCE">SCALE_RESOURCE</option>
              <option value="TOGGLE_POLICY">TOGGLE_POLICY</option>
              <option value="CREATE_POLICY">CREATE_POLICY</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="RESTART_RESOURCE">RESTART_RESOURCE</option>
              <option value="SYNC_CLOUD_ACCOUNT">SYNC_CLOUD_ACCOUNT</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadAuditLogs} isLoading={loading}>
              Refresh Logs
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader
          title="Enterprise Security & Infrastructure Audit Log"
          subtitle={`Immutable audit trail (${logs.length} events logged)`}
        />

        {loading ? (
          <LoadingSpinner text="Retrieving audit log stream..." />
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Audit Records Found"
              description="No security or scaling operations match your filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action Category</th>
                  <th className="px-5 py-3.5">Actor / User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Event Details</th>
                  <th className="px-5 py-3.5 text-right">Raw Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {logs.map((log) => {
                  const detailsObj = parseDetails(log.details);
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>

                        <td className="px-5 py-3.5">
                          {getActionBadge(log.action)}
                        </td>

                        <td className="px-5 py-3.5 font-semibold text-[#0F172A]">
                          {log.user?.name || 'System Daemon'}
                          <span className="block text-[11px] font-normal text-slate-400">
                            {log.user?.email || 'internal@daemon'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <RoleBadge role={log.user?.role || 'SYSTEM'} />
                        </td>

                        <td className="px-5 py-3.5 text-slate-700 max-w-md">
                          {typeof detailsObj === 'object' ? (
                            <span className="truncate block">
                              {detailsObj.resourceName && `Resource: ${detailsObj.resourceName} • `}
                              {detailsObj.reason && `Reason: ${detailsObj.reason} • `}
                              {detailsObj.message && detailsObj.message}
                              {detailsObj.policyName && `Policy: ${detailsObj.policyName}`}
                            </span>
                          ) : (
                            detailsObj
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-900 text-slate-200">
                          <td colSpan={6} className="px-6 py-4 font-mono text-[11px] leading-relaxed">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
                              <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                                Full Payload JSON [ID: {log.id}]
                              </span>
                              <span className="text-slate-400 text-[10px]">Actor ID: {log.userId || 'system'}</span>
                            </div>
                            <pre className="overflow-x-auto text-emerald-400 bg-slate-950 p-3 rounded border border-slate-800">
                              {JSON.stringify(detailsObj, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
