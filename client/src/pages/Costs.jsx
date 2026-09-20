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
