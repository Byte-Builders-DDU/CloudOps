import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { OutcomeReportModal } from '../components/changes/OutcomeReportModal';

export function Changes() {
  const { user, role } = useAuth();
  const { openChangeReview } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('needs_approval');
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState(null);

  useEffect(() => {
    fetchChanges();
  }, [activeTab]);

  const fetchChanges = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await api.get(`/changes?tab=${activeTab}`);
      if (res.data.success) {
        setChanges(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post(`/changes/${id}/approve`);
      if (res.data.success) {
        setActionSuccess('Change approved. Durable worker has claimed execution.');
        fetchChanges();
      }
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to approve change.');
    }
  };

  const handleReject = async (id) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post(`/changes/${id}/reject`, { reason: rejectReason });
      if (res.data.success) {
        setActionSuccess('Change rejected.');
        setRejectingId(null);
        setRejectReason('');
        fetchChanges();
      }
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to reject change.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-blue-600" />
            Changes & Governance Approval Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review proposed capacity adjustments, evaluate financial impact, and verify autonomous provider execution.
          </p>
        </div>

        {/* Action: Propose Capacity Change */}
        <button
          onClick={() => openChangeReview && openChangeReview({ resourceId: 'res-api-asg', proposedCapacity: 6 })}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          Propose Capacity Change <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('needs_approval')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'needs_approval'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Needs Approval ({changes.filter(c => c.status === 'AWAITING_APPROVAL').length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'in_progress'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          History & Audit
        </button>
      </div>

      {/* Changes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
            Loading changes inbox...
          </div>
        ) : changes.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No change requests found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Requested Action</th>
                  <th className="py-3 px-4">Service & Target</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Cost Effect</th>
                  <th className="py-3 px-4">Status & Policy</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {changes.map((c) => {
                  const policy = JSON.parse(c.policyChecksJson || '{}');
                  const isRequester = c.requesterId === user?.id;
                  const isSelfApprovalBlocked = isRequester && policy.requireSeparateAdmin;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-blue-600 font-bold">
                            {c.currentAllocation} → {c.proposedAllocation}
                          </span>
                          <span>replicas</span>
                        </div>
                        {c.changeNote && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                            {c.changeNote}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{c.resource?.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {c.resource?.service} · {c.resource?.region}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-medium">{c.requester?.name || 'DevOps'}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Source: {c.source}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className={`font-bold ${c.monthlyRateDelta > 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
                          {c.monthlyRateDelta > 0 ? '+' : ''}INR {c.monthlyRateDelta?.toLocaleString()}/mo
                        </span>
                        <p className="text-[10px] text-slate-500">
                          Period: +INR {c.periodCostDelta?.toLocaleString()}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'AWAITING_APPROVAL'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {c.status === 'AWAITING_APPROVAL' && <Clock className="w-3 h-3 text-amber-600" />}
                            {c.status.replace('_', ' ')}
                          </span>

                          {c.status === 'AWAITING_APPROVAL' && isSelfApprovalBlocked && (
                            <p className="text-[10px] text-amber-800 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-600 shrink-0" />
                              Two-Person Rule: Awaiting another Admin
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {c.status === 'AWAITING_APPROVAL' && role === 'ADMIN' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setRejectingId(c.id)}
                              className="px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(c.id)}
                              disabled={isSelfApprovalBlocked}
                              title={isSelfApprovalBlocked ? 'Governance rule: A separate Admin must approve this request.' : 'Approve & Apply'}
                              className="px-3 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                            >
                              Approve & Apply
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-slate-400 text-[11px] font-mono">
                              {c.operation?.status || c.status}
                            </span>
                            {(c.status === 'APPLIED' || c.status === 'APPROVED' || c.operation?.status === 'SUCCEEDED') && (
                              <button
                                onClick={() => setSelectedOutcomeId(c.id)}
                                className="px-2.5 py-1 text-[11px] font-medium rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                              >
                                <FileCheck2 className="w-3 h-3" /> Report
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Reject Change Proposal</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejection (e.g. Incompatible deployment window)..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Change Outcome & Verification Modal */}
      <OutcomeReportModal
        changeId={selectedOutcomeId}
        isOpen={Boolean(selectedOutcomeId)}
        onClose={() => setSelectedOutcomeId(null)}
      />
    </div>
  );
}
