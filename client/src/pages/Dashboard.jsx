import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Server,
  Activity,
  IndianRupee,
  Shield,
  CheckCircle2,
  Clock,
  RefreshCw,
  Zap,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Cpu,
} from 'lucide-react';
import api from '../services/api';
import { TrafficPerformanceChart } from '../components/charts/TrafficPerformanceChart';
import { MonthlyCostChart } from '../components/charts/MonthlyCostChart';
import { ProviderDistributionChart } from '../components/charts/ProviderDistributionChart';

// Animated counter hook
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (target === undefined || target === null) return;
    const num = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * num);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return count;
}

// Single KPI card
function KpiCard({ icon: Icon, label, value, sub, subColor = 'text-slate-500', accent = 'blue', index = 0, prefix = '', suffix = '' }) {
  const numVal = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const animated = useCounter(numVal, 1000 + index * 100);
  const isFloat = String(value).includes('.');
  const displayVal = isNaN(numVal)
    ? value
    : `${prefix}${isFloat ? animated.toFixed(2) : Math.round(animated).toLocaleString()}${suffix}`;

  const accentMap = {
    blue:   { iconBg: 'bg-blue-500/15',   iconColor: 'text-blue-400',   border: 'hover:border-blue-500/25', topBar: 'from-blue-500/30' },
    green:  { iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', border: 'hover:border-emerald-500/25', topBar: 'from-emerald-500/30' },
    violet: { iconBg: 'bg-violet-500/15',  iconColor: 'text-violet-400',  border: 'hover:border-violet-500/25', topBar: 'from-violet-500/30' },
    amber:  { iconBg: 'bg-amber-500/15',   iconColor: 'text-amber-400',   border: 'hover:border-amber-500/25', topBar: 'from-amber-500/30' },
    cyan:   { iconBg: 'bg-cyan-500/15',    iconColor: 'text-cyan-400',    border: 'hover:border-cyan-500/25', topBar: 'from-cyan-500/30' },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <div
      className={`kpi-card border border-white/[0.06] ${a.border} animate-slide-up`}
      style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${a.topBar} to-transparent`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${a.iconColor}`} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white font-mono tracking-tight animate-count-in">
          {displayVal}
        </p>
        {sub && <p className={`text-[11px] font-mono ${subColor}`}>{sub}</p>}
      </div>
    </div>
  );
}

// Section header
function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-sm font-bold text-white font-display tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors group">
          {action}
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}

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
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-blue-500/5 blur-xl" />
        </div>
        <p className="text-sm text-slate-500 font-mono animate-pulse">Loading Command Center...</p>
      </div>
    );
  }

  const { attentionBanner, kpis, aiBrief, recommendations, services, budget } = data;

  return (
    <div className="space-y-6 max-w-[1600px]">

      {/* ── Attention Banner ── */}
      {attentionBanner && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 animate-fade-in"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.05) 100%)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-amber-500/50 via-amber-400/30 to-transparent" />
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0"
                style={{ boxShadow: '0 0 16px rgba(245,158,11,0.2)' }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-amber-500/70">Operational Alert</span>
                <p className="text-sm font-semibold text-amber-200">{attentionBanner.message}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/resources')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all shrink-0"
            >
              Investigate <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard index={0} icon={Server}       label="Services"       value={kpis?.services?.healthy}       sub={`/ ${kpis?.services?.total} healthy`} subColor="text-slate-500" accent="blue" />
        <KpiCard index={1} icon={Activity}     label="Requests (24h)" value={kpis?.requests?.value}          sub={kpis?.requests?.delta}               subColor="text-red-400"   accent="cyan" />
        <KpiCard index={2} icon={Clock}        label="Avg Latency"    value={kpis?.latency?.value}           sub="p95: 188 ms"                         subColor="text-slate-500" accent="violet" suffix="ms" />
        <KpiCard index={3} icon={CheckCircle2} label="Probe Uptime"   value={kpis?.uptime?.value}            sub={kpis?.uptime?.coverage}              subColor="text-emerald-400" accent="green" />
        <KpiCard index={4} icon={IndianRupee}   label="MTD Spend"      value={kpis?.mtdSpend?.value}          sub="Est: ₹1,84,200"                      subColor="text-slate-500" accent="amber" prefix="₹" />
        <KpiCard index={5} icon={TrendingUp}   label="Est. Savings"   value={kpis?.savings?.value}           sub="Deduplicated"                        subColor="text-emerald-400" accent="green" prefix="₹" />
      </div>

      {/* ── AI Brief ── */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(109,40,217,0.04) 100%)',
          animationDelay: '200ms',
          opacity: 0,
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500/50 via-violet-400/30 to-transparent" />
        {/* Subtle shimmer */}
        <div className="absolute inset-0 shimmer opacity-20 pointer-events-none" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"
                style={{ boxShadow: '0 0 16px rgba(139,92,246,0.3)' }}
              >
                <Sparkles className="w-4.5 h-4.5 text-violet-300" style={{ filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.8))' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">AI Operational Brief</h3>
                <span className="text-[10px] text-violet-400/60 font-mono">
                  Workspace synthesis · {aiBrief?.freshness}
                </span>
              </div>
            </div>
            <button
              onClick={openCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-semibold hover:bg-violet-500/25 transition-all"
            >
              <Sparkles className="w-3 h-3" />
              Ask Copilot
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {aiBrief?.findings?.map((f, i) => (
              <div key={f.id}
                className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 space-y-2 group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${300 + i * 80}ms`, opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{f.title}</span>
                  <span className="chip-violet">{f.citationLabel}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{f.detail}</p>
                {f.actionLabel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (f.title.includes('Surge')) {
                        openChangeReview?.({ resourceId: 'res-api-asg', proposedCapacity: 6 });
                      } else {
                        navigate(f.actionTarget);
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 pt-1 transition-colors"
                  >
                    {f.actionLabel}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recommendations ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] glass-card animate-slide-up"
        style={{ animationDelay: '350ms', opacity: 0 }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

        <div className="p-5 border-b border-white/[0.05]">
          <SectionHeader
            title="Priority Recommendations"
            subtitle="Evaluated each minute against real-time telemetry and governance policies"
            action={`View All (${recommendations?.length || 0})`}
            onAction={() => navigate('/scaling')}
          />
        </div>

        <div className="divide-y divide-white/[0.04] text-xs">
          {recommendations?.map((rec, i) => (
            <div
              key={rec.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group animate-slide-up"
              style={{ animationDelay: `${400 + i * 60}ms`, opacity: 0 }}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono ${
                    rec.type === 'SCALE_UP'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    {rec.type === 'SCALE_UP' ? '▲' : '▼'} {rec.type.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-slate-200">{rec.resourceName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {rec.currentCapacity} → {rec.recommendedCapacity} replicas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 max-w-2xl leading-relaxed">{rec.reason}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right font-mono">
                  <span className={`text-sm font-bold ${rec.estimatedCostChange > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {rec.estimatedCostChange > 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5 inline" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 inline" />
                    )}
                    ₹{Math.abs(rec.estimatedCostChange)?.toLocaleString()}/mo
                  </span>
                  <span className="text-[10px] text-slate-600 block">
                    +₹{rec.remainingPeriodDelta?.toLocaleString()} this period
                  </span>
                </div>

                <button
                  onClick={() => openChangeReview?.({
                    resourceId: rec.resourceId,
                    proposedCapacity: rec.recommendedCapacity,
                    source: 'RECOMMENDATION',
                  })}
                  className="btn-neon-blue flex items-center gap-1.5 px-3.5 py-2 text-xs whitespace-nowrap"
                >
                  Review Change <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Traffic chart — takes 2 cols */}
        <div className="xl:col-span-2 glass-card rounded-2xl overflow-hidden border border-white/[0.06] animate-slide-up"
          style={{ animationDelay: '500ms', opacity: 0 }}
        >
          <div className="p-4 border-b border-white/[0.05]">
            <SectionHeader title="Traffic & Performance" subtitle="Request volume and latency telemetry" />
          </div>
          <div className="p-4">
            <TrafficPerformanceChart />
          </div>
        </div>

        {/* Provider distribution */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] animate-slide-up"
          style={{ animationDelay: '580ms', opacity: 0 }}
        >
          <div className="p-4 border-b border-white/[0.05]">
            <SectionHeader title="Provider Distribution" subtitle="Resource allocation by cloud" />
          </div>
          <div className="p-4">
            <ProviderDistributionChart />
          </div>
        </div>
      </div>

      {/* ── Service Health Table ── */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] animate-slide-up"
        style={{ animationDelay: '620ms', opacity: 0 }}
      >
        <div className="p-5 border-b border-white/[0.05]">
          <SectionHeader
            title="Service Health & Topology"
            subtitle="Real-time health matrix across all cloud workloads"
            action="Manage Services"
            onAction={() => navigate('/resources')}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full dark-table">
            <thead>
              <tr>
                <th className="text-left">Service Name</th>
                <th className="text-left">Environment</th>
                <th className="text-left">Status</th>
                <th className="text-left">Demand</th>
                <th className="text-left">p95 Latency</th>
                <th className="text-left">Monthly Cost</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services?.map((s, i) => (
                <tr key={s.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${700 + i * 50}ms`, opacity: 0 }}
                >
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-200 text-xs">{s.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="chip-blue font-mono">{s.environment}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className={s.health === 'HEALTHY' ? 'status-healthy' : 'status-warning'} />
                      <span className={`text-[11px] font-semibold ${s.health === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {s.health}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                    {s.requestRate?.toLocaleString()} req/min
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                    {s.p95Latency} <span className="text-slate-600">ms</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-200">
                    ₹{s.monthlyCost?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openChangeReview?.({ resourceId: 'res-api-asg', proposedCapacity: 6 })}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 ml-auto transition-colors group"
                    >
                      Inspect
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Monthly Cost Chart ── */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] animate-slide-up"
        style={{ animationDelay: '700ms', opacity: 0 }}
      >
        <div className="p-5 border-b border-white/[0.05]">
          <SectionHeader
            title="Cost Intelligence"
            subtitle="6-month spending trajectory vs. budget"
            action="View FinOps"
            onAction={() => navigate('/costs')}
          />
        </div>
        <div className="p-4">
          <MonthlyCostChart />
        </div>
      </div>
    </div>
  );
}
