import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCloudFilter } from '../hooks/useCloudFilter';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, StatusBadge, ProviderBadge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Server,
  DollarSign,
} from 'lucide-react';
import { scalingService } from '../services/scalingService';

export function Scaling() {
  const { canScale, isViewer } = useAuth();
  const { refreshKey, triggerRefresh } = useCloudFilter();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [refreshKey]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await scalingService.getRecommendations();
      if (res.success) {
        setRecommendations(res.data);
      }
    } catch (err) {
      console.error('Failed to load scaling recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (rec) => {
    setApplyingId(rec.id);
    setNotification(null);
    try {
      const res = await scalingService.applyRecommendation(rec.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Recommendation applied! "${rec.resource?.name}" capacity adjusted from ${rec.currentCapacity} to ${rec.recommendedCapacity} instances.`,
        });
        loadRecommendations();
        triggerRefresh();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to apply recommendation.',
      });
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = async (rec) => {
    try {
      const res = await scalingService.dismissRecommendation(rec.id);
      if (res.success) {
        loadRecommendations();
      }
    } catch (err) {
      console.error('Failed to dismiss:', err);
    }
  };

  const pendingRecs = recommendations.filter(r => r.status === 'PENDING');
  const appliedRecs = recommendations.filter(r => r.status === 'APPLIED' || r.status === 'DISMISSED');

  const potentialSavings = pendingRecs
    .filter(r => r.estimatedCostChange < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.estimatedCostChange), 0);

  return (
    <div className="space-y-6">
      {notification && (
        <Alert
          variant={notification.type}
          title={notification.type === 'success' ? 'Scaling Executed' : 'Policy Warning'}
        >
          {notification.message}
        </Alert>
      )}

      {isViewer && (
        <Alert variant="info" title="Read-Only Permission Notice">
          You are currently in Viewer mode. You can analyze recommendations, confidence scores, and historical scaling logs, but executing scaling commands requires the <span className="font-semibold">Operator</span> or <span className="font-semibold">Admin</span> role.
        </Alert>
      )}

      {/* Top Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending Optimizations</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] mt-1">{pendingRecs.length}</p>
          <p className="text-xs text-slate-500 mt-1">Autonomous recommendations queued</p>
        </Card>

        <Card className="p-4 bg-white border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Savings Potential</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {formatCurrency(potentialSavings)}/mo
          </p>
          <p className="text-xs text-slate-500 mt-1">Identified from compute rightsizing</p>
        </Card>

        <Card className="p-4 bg-white border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Policy Guardrails</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] mt-1">Active</p>
          <p className="text-xs text-slate-500 mt-1">Instance & budget caps enforced</p>
        </Card>
      </div>

      {/* Active Recommendations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Active Optimization Recommendations
            </h2>
            <p className="text-xs text-slate-500">
              Generated by continuous analysis of 7-day workload utilization patterns
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Evaluating workload telemetry against scaling policies..." />
        ) : pendingRecs.length === 0 ? (
          <EmptyState
            title="All Workloads Are Rightsized"
            description="No active scaling recommendations at this time. Telemetry metrics are within optimal utilization bounds."
          />
        ) : (
          <div className="space-y-4">
            {pendingRecs.map((rec) => {
              const isScaleUp = rec.type === 'SCALE_UP';
              const isCostSaving = rec.estimatedCostChange < 0;

              return (
                <Card key={rec.id} className="border border-[#E2E8F0] shadow-card">
                  <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    {/* Left: Metadata & Reason */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                            isScaleUp
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {isScaleUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {rec.type.replace('_', ' ')}
                        </span>

                        <span className="text-sm font-bold text-[#0F172A]">
                          {rec.resource?.name}
                        </span>

                        <ProviderBadge provider={rec.resource?.cloudAccount?.provider || 'AWS'} />
                        <span className="text-xs text-slate-500 font-medium">({rec.resource?.service} • {rec.resource?.region})</span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {rec.reason}
                      </p>

                      <div className="flex items-center gap-4 text-xs pt-1 text-slate-500">
                        <span>Confidence Score: <strong className="text-[#0F172A]">{rec.confidence}%</strong></span>
                        <span>•</span>
                        <span>Generated: {formatDateTime(rec.createdAt)}</span>
                      </div>
                    </div>

                    {/* Middle: Capacity Comparison */}
                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-lg border border-[#E2E8F0] shrink-0">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current</span>
                        <span className="text-lg font-bold text-[#0F172A] font-mono">{rec.currentCapacity} inst.</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="text-center">
                        <span className="text-[10px] text-blue-600 uppercase font-semibold block">Target</span>
                        <span className="text-lg font-bold text-blue-600 font-mono">{rec.recommendedCapacity} inst.</span>
                      </div>
                      <div className="border-l border-slate-200 pl-4 text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Est. Cost Delta</span>
                        <span className={`text-xs font-mono font-bold ${isCostSaving ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {rec.estimatedCostChange > 0 ? `+${formatCurrency(rec.estimatedCostChange)}/mo` : `-${formatCurrency(Math.abs(rec.estimatedCostChange))}/mo`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {canScale ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApply(rec)}
                          isLoading={applyingId === rec.id}
                        >
                          Apply Scaling
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Operator role required"
                        >
                          Apply (Locked)
                        </Button>
                      )}

                      {canScale && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(rec)}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Scaling Actions */}
      {appliedRecs.length > 0 && (
        <Card>
          <CardHeader
            title="Recent Optimization History"
            subtitle="Applied or dismissed recommendations"
          />
          <div className="divide-y divide-[#E2E8F0]">
            {appliedRecs.map((rec) => (
              <div key={rec.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A]">{rec.resource?.name}</span>
                    <span className="text-slate-500 ml-2">({rec.type} &rarr; {rec.recommendedCapacity} instances)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={rec.status === 'APPLIED' ? 'success' : 'default'}>
                    {rec.status}
                  </Badge>
                  <span className="text-slate-400 font-mono text-[11px]">{formatDateTime(rec.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
