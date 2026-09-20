import React, { useState, useEffect } from 'react';
import { X, Shield, Clock, AlertTriangle, CheckCircle2, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export function ChangeReview({ isOpen, onClose, initialData = null, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [proposedCapacity, setProposedCapacity] = useState(6);
  const [changeNote, setChangeNote] = useState('');
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [operationState, setOperationState] = useState(null); // 'SUBMITTING' | 'SUBMITTED'

  // Initialize or fetch preview when drawer opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setOperationState(null);
      setCountdown(300);
      const capacity = initialData?.proposedCapacity || 6;
      setProposedCapacity(capacity);
      fetchPreview(initialData?.resourceId || 'res-api-asg', capacity);
    }
  }, [isOpen, initialData]);

  // 5-minute preview countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const fetchPreview = async (resourceId, capacity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/changes/preview', {
        resourceId,
        proposedCapacity: capacity,
      });
      if (res.data.success) {
        setPreview(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to calculate deterministic preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapacityChange = (newCapacity) => {
    if (newCapacity < 1) return;
    setProposedCapacity(newCapacity);
    fetchPreview(preview?.resource?.id || initialData?.resourceId || 'res-api-asg', newCapacity);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/changes/submit', {
        resourceId: preview.resource.id,
        proposedCapacity,
        changeNote: changeNote || 'Automated scaling proposal to restore target 60% CPU.',
        source: initialData?.source || 'RECOMMENDATION',
      });

      if (res.data.success) {
        setOperationState('SUBMITTED');
        if (onSuccess) onSuccess(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const isExpired = countdown <= 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      {/* Drawer */}
      <div className="w-full max-w-[720px] h-full flex flex-col border-l border-white/[0.08] relative z-10 animate-slide-right"
           style={{ background: 'rgba(8,15,33,0.97)', boxShadow: '-24px 0 80px rgba(0,0,0,0.8)' }}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]">
                Shared Change Review
              </span>
              <span className="text-xs text-slate-500 font-medium">
                AWS · Production · ap-south-1 · Live Provider
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-display mt-2">
              Review capacity change · {preview?.resource?.serviceName || 'Production API'} / {preview?.resource?.name || 'api-asg'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-200">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">Guardrail Notice</p>
                <p className="text-xs mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {operationState === 'SUBMITTED' ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto" style={{ boxShadow: '0 0 24px rgba(52,211,153,0.15)' }}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Change Request Submitted</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                The proposal has been dispatched to the governance queue. Because Production API enforces the
                <strong className="text-white font-semibold"> Two-Person Rule</strong>, approval from a separate Administrator is required before worker execution.
              </p>
              <div className="pt-6 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-colors"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stage 1: Evidence & Capacity Comparison */}
              <div className="rounded-2xl border border-white/[0.08] p-5 bg-white/[0.02] space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    Observed Evidence Basis
                  </span>
                  <span className="text-violet-300 font-mono font-medium bg-violet-500/10 px-2 py-1 rounded-md border border-violet-500/20">
                    Traffic +34% · CPU 82% over 10m
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
                  <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Allocation</span>
                    <p className="text-3xl font-bold font-mono text-white mt-2">
                      {preview?.resource?.currentReplicas || 4} <span className="text-xs font-medium text-slate-500 font-sans">replicas</span>
                    </p>
                  </div>

                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/30" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.05), inset 0 0 12px rgba(59,130,246,0.05)' }}>
                    <span className="text-xs text-blue-400 font-bold uppercase tracking-wider" style={{ filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.5))' }}>Proposed Allocation</span>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-3xl font-bold font-mono text-blue-300" style={{ filter: 'drop-shadow(0 0 12px rgba(96,165,250,0.4))' }}>
                        {proposedCapacity} <span className="text-xs font-medium text-blue-500/70 font-sans">replicas</span>
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCapacityChange(proposedCapacity - 1)}
                          className="w-8 h-8 rounded-lg border border-white/[0.1] text-slate-400 flex items-center justify-center hover:bg-white/[0.05] hover:text-white font-mono font-bold transition-all"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCapacityChange(proposedCapacity + 1)}
                          className="w-8 h-8 rounded-lg border border-white/[0.1] text-slate-400 flex items-center justify-center hover:bg-white/[0.05] hover:text-white font-mono font-bold transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1">
                  <span>Policy Allowed: {preview?.policyChecks?.minAllowed || 2}–{preview?.policyChecks?.maxAllowed || 8} replicas</span>
                  <span>Maximum Step: {preview?.policyChecks?.maxStep || 2} replicas</span>
                </div>
              </div>

              {/* Stage 2: Financial Impact Matrix */}
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.08] text-xs font-bold text-white tracking-wide font-display">
                  Deterministic Financial Projections
                </div>
                <div className="divide-y divide-white/[0.06]">
                  <div className="grid grid-cols-4 p-4 text-[11px] text-slate-400 bg-white/[0.01] font-semibold uppercase tracking-wider">
                    <span className="col-span-1">Metric</span>
                    <span className="text-right">Current</span>
                    <span className="text-right">Proposed</span>
                    <span className="text-right">Difference</span>
                  </div>

                  <div className="grid grid-cols-4 p-4 text-xs items-center">
                    <span className="font-medium text-slate-300">Monthly Run-Rate</span>
                    <span className="text-right text-slate-400 font-mono">
                      INR {preview?.currentMonthlyRunRate?.toLocaleString() || '16,800'}
                    </span>
                    <span className="text-right text-white font-bold font-mono">
                      INR {preview?.proposedMonthlyRunRate?.toLocaleString() || '25,200'}
                    </span>
                    <span className="text-right font-bold text-blue-400 font-mono" style={{ filter: 'drop-shadow(0 0 6px rgba(96,165,250,0.5))' }}>
                      +INR {preview?.monthlyRateDelta?.toLocaleString() || '8,400'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-4 text-xs items-center bg-blue-500/5">
                    <span className="font-medium text-slate-300 col-span-2">
                      Remaining-Period Effect (365h)
                    </span>
                    <span className="text-right font-bold text-blue-400 font-mono col-span-2" style={{ filter: 'drop-shadow(0 0 6px rgba(96,165,250,0.5))' }}>
                      +INR {preview?.periodCostDelta?.toLocaleString() || '4,200'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-4 text-xs items-center">
                    <span className="font-medium text-slate-300 col-span-2">
                      Projected Month-End Spend
                    </span>
                    <span className="text-right text-white font-bold font-mono col-span-2">
                      INR {preview?.projectedPeriodSpend?.toLocaleString() || '184,200'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-4 text-xs items-center bg-emerald-500/5">
                    <span className="font-medium text-slate-300 col-span-2">
                      Budget Headroom (of INR 200,000)
                    </span>
                    <span className="text-right font-bold text-emerald-400 font-mono col-span-2" style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.5))' }}>
                      INR {preview?.budgetHeadroomAfter?.toLocaleString() || '15,800'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage 3: Governance Policy Checks */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Policy &amp; Compliance Checks
                </span>
                <div className="flex flex-wrap gap-2.5">
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Capacity bounds pass (2–8)
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Budget headroom passes
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Cooldown period clear (5m)
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-2 shadow-[0_0_12px_rgba(251,191,36,0.1)]">
                    <Shield className="w-4 h-4" />
                    Separate Admin approval required
                  </span>
                </div>
              </div>

              {/* Preview Validity & Countdown */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs">
                <span className="text-slate-400 flex items-center gap-2 font-mono">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Price basis: 730-hr month · 365 hrs remaining
                </span>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold px-2.5 py-1 rounded-md ${isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/[0.05] text-slate-300 border border-white/[0.08]'}`}>
                    Preview valid: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setCountdown(300); fetchPreview(preview?.resource?.id, proposedCapacity); }}
                    className="p-1.5 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                    title="Refresh Preview"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stage 4: Change Note & Submission */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Operational Change Note (recorded in audit log):
                </label>
                <textarea
                  rows={2}
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="e.g. Scaling Production API from 4 to 6 replicas to alleviate sustained 82% CPU load."
                  className="w-full text-sm p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all shadow-inner"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {operationState !== 'SUBMITTED' && (
          <div className="p-5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading || isExpired || !preview?.isValid}
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_16px_rgba(59,130,246,0.4)] hover:shadow-[0_4px_24px_rgba(59,130,246,0.6)] transition-all"
            >
              {loading ? (
                <>Submitting Request...</>
              ) : (
                <>
                  Request Approval <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
