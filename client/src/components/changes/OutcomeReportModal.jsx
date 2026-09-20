import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Clock,
  Cpu,
  Activity,
  Layers,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export function OutcomeReportModal({ changeId, isOpen, onClose }) {
  const [outcome, setOutcome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && changeId) {
      loadOutcome();
    }
  }, [isOpen, changeId]);

  const loadOutcome = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/changes/${changeId}/outcome`);
      if (res.data.success) {
        setOutcome(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load post-change outcome report.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col my-8"
        style={{ background: 'rgba(8,15,33,0.98)' }}
      >
        {/* Modal Header */}
        <div className="p-5 px-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Post-Change Outcome & Verification Report
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {outcome?.operationStatus || 'Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Workload: <span className="text-white font-semibold">{outcome?.resourceName || 'Resource'}</span> ({outcome?.serviceName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)] text-xs text-slate-300">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
              <p>Reconciling post-change telemetry and financial impact...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : outcome ? (
            <>
              {/* 1. Operational Telemetry Stabilization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    1. Telemetry Stabilization & Health Recovery
                  </h4>
                  {outcome.operationalVerification?.isStabilized ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Stabilized in {outcome.operationalVerification?.stabilizationDurationMinutes}m
                    </span>
                  ) : (
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Stabilizing
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] text-slate-400 block">Pre-Change CPU</span>
                    <span className="text-base font-bold font-mono text-rose-400">
                      {outcome.operationalVerification?.preChangeCpu}%
                    </span>
                    <span className="text-[10px] text-rose-400/80 block mt-0.5">Sustained High</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] text-slate-400 block">Post-Change CPU</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {outcome.operationalVerification?.postChangeCpu}%
                    </span>
                    <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                      -{outcome.operationalVerification?.cpuRecoveryPercent}% recovery
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] text-slate-400 block">Pre-Change p95 Latency</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      {outcome.operationalVerification?.preChangeLatencyMs}ms
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Under pressure</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] text-slate-400 block">Post-Change p95 Latency</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {outcome.operationalVerification?.postChangeLatencyMs}ms
                    </span>
                    <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                      -{outcome.operationalVerification?.latencyImprovementPercent}% latency reduction
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Financial Outcome vs Projection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  2. Financial Verification & Run-Rate Delta
                </h4>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Projected Monthly Delta</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">
                      {outcome.financialOutcome?.projectedMonthlyDelta > 0 ? '+' : ''}
                      {formatCurrency(outcome.financialOutcome?.projectedMonthlyDelta || 0)}/mo
                    </span>
                    <span className="text-[10px] text-slate-500">Calculated pre-flight</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Realized Monthly Delta</span>
                    <span className="text-sm font-bold font-mono text-blue-400 mt-1 block">
                      {outcome.financialOutcome?.realizedMonthlyDelta > 0 ? '+' : ''}
                      {formatCurrency(outcome.financialOutcome?.realizedMonthlyDelta || 0)}/mo
                    </span>
                    <span className="text-[10px] text-slate-500">Provider billing reconciliation</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Model Variance</span>
                    <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">
                      {outcome.financialOutcome?.variancePercent}%
                    </span>
                    <span className="text-[10px] text-emerald-400/80">
                      {outcome.financialOutcome?.isRealizedWithinTolerance ? 'Within ≤5% tolerance' : 'Variance flagged'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Dual-Control Governance & Idempotency Audit */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  3. Dual-Control Governance & Audit Verification
                </h4>

                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-300">
                        Two-Person Rule Authorization:
                      </span>
                      <strong className="text-white">
                        {outcome.auditVerification?.twoPersonCompliant ? 'Strictly Compliant' : 'Single User'}
                      </strong>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Requester: <span className="text-white">{outcome.requester}</span> • Approver: <span className="text-emerald-400">{outcome.approver}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-purple-500/15 pt-2 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Durable Idempotent Execution Worker
                    </span>
                    <span className="font-mono text-slate-400">
                      Status: <strong className="text-white">{outcome.operationStatus}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Execution Capacity & Timestamps */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
                <div>
                  Capacity: <strong className="text-white">{outcome.capacity?.before}</strong> → <strong className="text-blue-400">{outcome.capacity?.after} replicas</strong> ({outcome.capacity?.delta > 0 ? `+${outcome.capacity?.delta}` : outcome.capacity?.delta})
                </div>
                <div>
                  Requested: <span className="text-slate-300">{formatDateTime(outcome.timestamps?.requestedAt)}</span>
                </div>
                <div>
                  Applied: <span className="text-emerald-400">{formatDateTime(outcome.timestamps?.appliedAt)}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] flex justify-end bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
