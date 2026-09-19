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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      {/* 680–760px Drawer */}
      <div className="w-full max-w-[720px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Shared Change Review
              </span>
              <span className="text-xs text-slate-500 font-medium">
                AWS · Production · ap-south-1 · Live Provider
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Review capacity change · {preview?.resource?.serviceName || 'Production API'} / {preview?.resource?.name || 'api-asg'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Guardrail Notice</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {operationState === 'SUBMITTED' ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Change Request Submitted</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                The proposal has been dispatched to the governance queue. Because Production API enforces the
                <strong> Two-Person Rule</strong>, approval from a separate Administrator is required before worker execution.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stage 1: Evidence & Capacity Comparison */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                    Observed Evidence Basis
                  </span>
                  <span className="text-violet-700 font-mono font-medium">
                    Traffic +34% · CPU 82% over 10m
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Current Allocation</span>
                    <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                      {preview?.resource?.currentReplicas || 4} <span className="text-xs font-normal text-slate-500">replicas</span>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-xs">
                    <span className="text-xs text-blue-700 font-medium">Proposed Allocation</span>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-2xl font-bold font-mono text-blue-700">
                        {proposedCapacity} <span className="text-xs font-normal text-blue-600">replicas</span>
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCapacityChange(proposedCapacity - 1)}
                          className="w-7 h-7 rounded border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 font-mono font-bold"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCapacityChange(proposedCapacity + 1)}
                          className="w-7 h-7 rounded border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 font-mono font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Policy Allowed: {preview?.policyChecks?.minAllowed || 2}–{preview?.policyChecks?.maxAllowed || 8} replicas</span>
                  <span>Maximum Step: {preview?.policyChecks?.maxStep || 2} replicas</span>
                </div>
              </div>

              {/* Stage 2: Financial Impact Matrix */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-800">
                  Deterministic Financial Projections
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-4 p-3.5 text-xs text-slate-500 bg-slate-50/50 font-medium">
                    <span className="col-span-1">Metric</span>
                    <span className="text-right">Current</span>
                    <span className="text-right">Proposed</span>
                    <span className="text-right">Difference</span>
                  </div>

                  <div className="grid grid-cols-4 p-3.5 text-xs font-mono items-center">
                    <span className="font-sans font-medium text-slate-700">Monthly Run-Rate</span>
                    <span className="text-right text-slate-600">
                      INR {preview?.currentMonthlyRunRate?.toLocaleString() || '16,800'}
                    </span>
                    <span className="text-right text-slate-900 font-semibold">
                      INR {preview?.proposedMonthlyRunRate?.toLocaleString() || '25,200'}
                    </span>
                    <span className="text-right font-bold text-blue-700">
                      +INR {preview?.monthlyRateDelta?.toLocaleString() || '8,400'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-3.5 text-xs font-mono items-center bg-blue-50/20">
                    <span className="font-sans font-medium text-slate-700 col-span-2">
                      Remaining-Period Effect (365h)
                    </span>
                    <span className="text-right font-bold text-blue-800 col-span-2">
                      +INR {preview?.periodCostDelta?.toLocaleString() || '4,200'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-3.5 text-xs font-mono items-center">
                    <span className="font-sans font-medium text-slate-700 col-span-2">
                      Projected Month-End Spend
                    </span>
                    <span className="text-right text-slate-900 font-semibold col-span-2">
                      INR {preview?.projectedPeriodSpend?.toLocaleString() || '184,200'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-3.5 text-xs font-mono items-center bg-emerald-50/20">
                    <span className="font-sans font-medium text-slate-700 col-span-2">
                      Budget Headroom (of INR 200,000)
                    </span>
                    <span className="text-right font-bold text-emerald-700 col-span-2">
                      INR {preview?.budgetHeadroomAfter?.toLocaleString() || '15,800'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage 3: Governance Policy Checks */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
                  Policy & Compliance Checks
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Capacity bounds pass (2–8)
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Budget headroom passes
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Cooldown period clear (5m)
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Separate Admin approval required
                  </span>
                </div>
              </div>

              {/* Preview Validity & Countdown */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Price basis: 730-hr month · 365 hrs remaining
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                    Preview valid: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setCountdown(300); fetchPreview(preview?.resource?.id, proposedCapacity); }}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Refresh Preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stage 4: Change Note & Submission */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Operational Change Note (recorded in audit log):
                </label>
                <textarea
                  rows={2}
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="e.g. Scaling Production API from 4 to 6 replicas to alleviate sustained 82% CPU load."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {operationState !== 'SUBMITTED' && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading || isExpired || !preview?.isValid}
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-xs transition-colors"
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
