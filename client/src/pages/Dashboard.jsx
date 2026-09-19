import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Server,
  Activity,
  DollarSign,
  Shield,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';
import { TrafficPerformanceChart } from '../components/charts/TrafficPerformanceChart';
import { MonthlyCostChart } from '../components/charts/MonthlyCostChart';
import { ProviderDistributionChart } from '../components/charts/ProviderDistributionChart';

export function Dashboard() {
  const navigate = useNavigate();
  const { openChangeReview, openCopilot } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        <p>Loading Command Center Overview...</p>
      </div>
    );
  }

  const { attentionBanner, kpis, aiBrief, recommendations, services, budget } = data;

  return (
    <div className="space-y-6">
      {/* 1. Health Attention Banner (DESIGN.md §6.1) */}
      {attentionBanner && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                Operational Alert
              </span>
              <p className="text-sm font-bold text-amber-950">
                {attentionBanner.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/resources')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
          >
            Investigate Scope <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Six Primary Operational KPI Cards (Tabular JetBrains Mono Numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Services Health */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-blue-600" />
            Services
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-2">
            {kpis?.services?.healthy} <span className="text-xs font-normal text-slate-500">/ {kpis?.services?.total} Healthy</span>
          </p>
          <span className="text-[10px] text-amber-600 font-medium mt-1 block">1 service warning</span>
        </div>

        {/* Requests Demand */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Request Demand
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-2">
            {kpis?.requests?.value?.toLocaleString()}
          </p>
          <span className="text-[10px] text-red-600 font-mono font-semibold mt-1 block">
            {kpis?.requests?.delta}
          </span>
        </div>

        {/* Latency */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Avg Latency
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-2">
            {kpis?.latency?.value} <span className="text-xs font-normal text-slate-500">ms</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">p95: 188 ms</span>
        </div>

        {/* Uptime Probes */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Probe Uptime
          </span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-2">
            {kpis?.uptime?.value}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">{kpis?.uptime?.coverage}</span>
        </div>

        {/* MTD Spend */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            MTD Incurred
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-2">
            INR {kpis?.mtdSpend?.value?.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Est: INR 184,200</span>
        </div>

        {/* Actionable Savings */}
        <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Est. Savings
          </span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-2">
            INR {kpis?.savings?.value?.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Deduplicated</span>
        </div>
      </div>

      {/* 3. AI Operational Brief (DESIGN.md §6.1) */}
      <div className="p-5 bg-gradient-to-r from-violet-50/80 via-white to-violet-50/40 rounded-xl border border-violet-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">AI Operational Brief</h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Attributable workspace synthesis • {aiBrief?.freshness}
              </span>
            </div>
          </div>
          <button
            onClick={openCopilot}
            className="text-xs font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1"
          >
            Ask Copilot Deeper <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {aiBrief?.findings?.map((f) => (
            <div key={f.id} className="p-3 bg-white rounded-lg border border-violet-100 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{f.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">
                  {f.citationLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{f.detail}</p>
              {f.actionLabel && (
                <button
                  onClick={() => {
                    if (f.title.includes('Surge')) {
                      openChangeReview && openChangeReview({ resourceId: 'res-api-asg', proposedCapacity: 6 });
                    } else {
                      navigate(f.actionTarget);
                    }
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1"
                >
                  {f.actionLabel} →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Priority Recommendations & Live Change Action */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Priority Recommendations (Evidence → Allocation → Cost)
            </h3>
            <p className="text-[11px] text-slate-500">
              Evaluated once per minute against real-time telemetry and governance policies
            </p>
          </div>
          <button
            onClick={() => navigate('/scaling')}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            View All ({recommendations?.length || 0})
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recommendations?.map((rec) => (
            <div key={rec.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    rec.type === 'SCALE_UP' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {rec.type.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-slate-900">{rec.resourceName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({rec.currentCapacity} → {rec.recommendedCapacity} replicas)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 max-w-2xl">{rec.reason}</p>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right font-mono">
                  <span className={`text-xs font-bold ${rec.estimatedCostChange > 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {rec.estimatedCostChange > 0 ? '+' : ''}INR {rec.estimatedCostChange?.toLocaleString()}/mo
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Period: +INR {rec.remainingPeriodDelta?.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => openChangeReview && openChangeReview({
                    resourceId: rec.resourceId,
                    proposedCapacity: rec.recommendedCapacity,
                    source: 'RECOMMENDATION',
                  })}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  Review Change <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Service Health Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Service Health & Topology
          </h3>
          <button
            onClick={() => navigate('/resources')}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Manage Services
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Demand</th>
                <th className="py-3 px-4">p95 Latency</th>
                <th className="py-3 px-4">Monthly Cost</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services?.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {s.environment}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.health === 'HEALTHY'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.health === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {s.health}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{s.requestRate?.toLocaleString()} req/min</td>
                  <td className="py-3 px-4 font-mono">{s.p95Latency} ms</td>
                  <td className="py-3 px-4 font-mono font-semibold">INR {s.monthlyCost?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openChangeReview && openChangeReview({ resourceId: 'res-api-asg', proposedCapacity: 6 })}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
