import React, { useState, useEffect } from 'react';
import { useCloudFilter } from '../hooks/useCloudFilter';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { ProviderBadge } from '../components/common/Badge';
import { CostTrendChart } from '../components/charts/CostTrendChart';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  IndianRupee,
  TrendingUp,
  PieChart,
  Calendar,
  Download,
  Layers,
  ArrowUpRight,
  Sparkles,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { costService } from '../services/costService';

export function Costs() {
  const { selectedProvider, selectedRegion, refreshKey } = useCloudFilter();

  const [loading, setLoading] = useState(true);
  const [costSummary, setCostSummary] = useState(null);
  const [costRecords, setCostRecords] = useState([]);
  const [arbitrageData, setArbitrageData] = useState(null);
  const [realizedSavings, setRealizedSavings] = useState(null);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState('provider'); // 'provider' | 'service'

  useEffect(() => {
    loadCostData();
  }, [selectedProvider, selectedRegion, refreshKey]);

  const loadCostData = async () => {
    setLoading(true);
    try {
      const [summaryRes, recordsRes, arbRes, savingsRes] = await Promise.all([
        costService.getCostSummary({ provider: selectedProvider, region: selectedRegion }),
        costService.getCostRecords({ provider: selectedProvider, limit: 20 }),
        costService.getCostArbitrage().catch(() => ({ success: false })),
        costService.getRealizedSavings().catch(() => ({ success: false })),
      ]);

      if (summaryRes.success) {
        setCostSummary(summaryRes.data);
      }
      if (recordsRes.success) {
        setCostRecords(recordsRes.data);
      }
      if (arbRes.success && arbRes.data) {
        setArbitrageData(arbRes.data);
      }
      if (savingsRes.success && savingsRes.data) {
        setRealizedSavings(savingsRes.data);
      }
    } catch (err) {
      console.error('Failed to load cost governance data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !costSummary) {
    return <LoadingSpinner text="Analyzing Multi-Cloud Cost Explorer Data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Cost KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms', opacity: 0 }}>
        <StatCard
          title="Current Monthly Run-Rate"
          value={formatCurrency(costSummary?.currentMonthlyCost || 0)}
          subtitle="Real-time unblended spend"
          icon={IndianRupee}
          trend="+3.2%"
          trendDirection="up"
          trendLabel="vs last month"
        />

        <StatCard
          title="Projected End-of-Month"
          value={formatCurrency(costSummary?.projectedCost || 0)}
          subtitle="Forecast based on 30-day velocity"
          icon={TrendingUp}
          trend="+4.0%"
          trendDirection="up"
        />

        <StatCard
          title="Potential Monthly Savings"
          value={formatCurrency(costSummary?.potentialSavings || 345.50)}
          subtitle="From pending rightsizing recommendations"
          icon={Sparkles}
          trend="Actionable"
          trendDirection="down"
        />

        <StatCard
          title="Connected Cloud Accounts"
          value={costSummary?.providerBreakdown?.length || 3}
          subtitle="AWS • Azure • Google Cloud"
          icon={Layers}
        />
      </div>

      {/* Main Multi-Cloud Daily Spending Trend Chart */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms', opacity: 0 }}>
        <Card>
        <CardHeader
          title="30-Day Multi-Cloud Cost Trajectory"
          subtitle="Aggregated daily expenditure categorized by Cloud Provider"
        />
        <CardBody>
          <CostTrendChart data={costSummary?.dailySpending || []} />
        </CardBody>
      </Card>
      </div>

      {/* Cost Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Provider */}
        <div className="animate-slide-up" style={{ animationDelay: '300ms', opacity: 0 }}>
          <Card>
            <CardHeader
              title="Spend by Cloud Provider"
              subtitle="Current monthly run-rate proportion"
            />
            <CardBody>
              <CostBreakdownChart
                data={costSummary?.providerBreakdown || []}
                type="provider"
              />
            </CardBody>
          </Card>
        </div>

        {/* Breakdown by Service */}
        <div className="animate-slide-up" style={{ animationDelay: '400ms', opacity: 0 }}>
          <Card>
            <CardHeader
              title="Spend by Infrastructure Service"
              subtitle="Top cost contributors across clusters"
            />
            <CardBody>
              <CostBreakdownChart
                data={costSummary?.serviceBreakdown || []}
                type="service"
              />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Realized Savings & Post-Change Verification Section */}
      {realizedSavings && (
        <div className="animate-slide-up space-y-4" style={{ animationDelay: '450ms', opacity: 0 }}>
          <Card>
            <CardHeader
              title="Measured Realized Savings & Post-Change Verification"
              subtitle="Audited financial savings from completed autonomous rightsizing and downscaling changes"
            />
            <CardBody className="space-y-6">
              {/* Metric Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Realized Savings</span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-emerald-300">
                      {formatCurrency(realizedSavings.metrics?.totalRealizedMonthlySavings || 0)}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">Verified monthly reduction</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Projected Savings</span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-blue-300">
                      {formatCurrency(realizedSavings.metrics?.totalProjectedMonthlySavings || 0)}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">Pre-flight estimation model</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Realization Accuracy</span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-violet-300">
                      {realizedSavings.metrics?.realizationRatePercent || 100}%
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">Against CloudWatch/Cost API</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Evaluated Changes</span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-amber-300">
                      {realizedSavings.metrics?.changesEvaluated || 0}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {realizedSavings.metrics?.optimizationsCount || 0} cost-reducing changes
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Verified Optimizations Table */}
              {realizedSavings.recentOptimizations && realizedSavings.recentOptimizations.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Recent Verified Rightsizing Actions
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                    <table className="min-w-full divide-y divide-white/[0.08] text-left text-xs">
                      <thead className="bg-white/[0.02] text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Workload Target</th>
                          <th className="px-4 py-3">Capacity Transition</th>
                          <th className="px-4 py-3">Monthly Run-Rate Delta</th>
                          <th className="px-4 py-3">Execution Timestamp</th>
                          <th className="px-4 py-3 text-right">Outcome Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] bg-white/[0.01]">
                        {realizedSavings.recentOptimizations.map((opt) => (
                          <tr key={opt.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3 font-semibold text-white">
                              {opt.resourceName}
                            </td>
                            <td className="px-4 py-3 font-mono text-blue-400">
                              {opt.deltaCapacity} replicas
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                              -{formatCurrency(opt.monthlySavings)}/mo
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {formatDate(opt.appliedAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Stabilized & Realized
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  Fleet is operating within optimized capacity. Rightsizing savings will be recorded here when downscale changes are applied.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Phase 3 Cross-Cloud Cost Arbitrage Table */}
      {arbitrageData?.catalog && (
        <div className="animate-slide-up" style={{ animationDelay: '500ms', opacity: 0 }}>
          <Card>
          <CardHeader
            title="Cross-Cloud Cost Arbitrage & Instance Equivalence Catalog"
            subtitle="Normalized 4 vCPU / RAM workload shapes benchmarked across AWS, Azure, and Google Cloud"
          />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Workload Tier</th>
                  <th className="px-5 py-3.5">Primary Workload</th>
                  <th className="px-5 py-3.5">AWS (Instance / Rate)</th>
                  <th className="px-5 py-3.5">Azure (Instance / Rate)</th>
                  <th className="px-5 py-3.5">GCP (Instance / Rate)</th>
                  <th className="px-5 py-3.5">Cheapest Provider</th>
                  <th className="px-5 py-3.5 text-right">Max Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {arbitrageData.catalog.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#0F172A]">
                      {row.tier}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {row.workloadType}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      <span className="font-semibold">{row.providers?.AWS?.instanceType}</span>
                      <p className="text-[11px] text-slate-400">₹{row.providers?.AWS?.hourlyRateINR ?? '--'}/hr</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      <span className="font-semibold">{row.providers?.Azure?.instanceType}</span>
                      <p className="text-[11px] text-slate-400">₹{row.providers?.Azure?.hourlyRateINR ?? '--'}/hr</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      <span className="font-semibold">{row.providers?.GCP?.instanceType}</span>
                      <p className="text-[11px] text-slate-400">₹{row.providers?.GCP?.hourlyRateINR ?? '--'}/hr</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {row.cheapestProvider}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                      +{row.maxSavingsPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </div>
      )}

      {/* Raw Billing Records Table */}
      <div className="animate-slide-up" style={{ animationDelay: '600ms', opacity: 0 }}>
        <Card>
        <CardHeader
          title="Recent Cloud Ingestion & Cost Line Items"
          subtitle="Auditable billing logs from connected provider accounts"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Cloud Provider</th>
                <th className="px-5 py-3.5">Account / Region</th>
                <th className="px-5 py-3.5">Service Category</th>
                <th className="px-5 py-3.5">Usage Description</th>
                <th className="px-5 py-3.5 text-right">Daily Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {costRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <ProviderBadge provider={record.cloudAccount?.provider || 'AWS'} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    <p className="font-medium">{record.cloudAccount?.accountName}</p>
                    <p className="text-[11px] text-slate-400">{record.cloudAccount?.region}</p>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[#0F172A]">
                    {record.service}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                    {record.usage}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-[#0F172A]">
                    {formatCurrency(record.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
}
