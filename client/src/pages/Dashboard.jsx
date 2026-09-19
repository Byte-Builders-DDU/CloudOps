import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCloudFilter } from '../hooks/useCloudFilter';
import { useSocket } from '../hooks/useSocket';
import { StatCard } from '../components/common/StatCard';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge, ProviderBadge } from '../components/common/Badge';
import { TelemetryChart } from '../components/charts/TelemetryChart';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatStorage } from '../utils/formatters';
import {
  Server,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { metricService } from '../services/metricService';
import { costService } from '../services/costService';
import { scalingService } from '../services/scalingService';

export function Dashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { selectedProvider, selectedRegion, refreshKey } = useCloudFilter();
  const { liveTick } = useSocket();

  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [metricsTimeline, setMetricsTimeline] = useState([]);
  const [costData, setCostData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedProvider, selectedRegion, refreshKey]);

  // When live telemetry tick arrives from Socket.IO, update recent data point
  useEffect(() => {
    if (liveTick && metricsTimeline.length > 0) {
      // Calculate latest aggregate from tick
      const updates = liveTick.updates || [];
      if (updates.length > 0) {
        const avgCpu = Math.round(updates.reduce((a, b) => a + b.cpuUsage, 0) / updates.length * 10) / 10;
        const avgMem = Math.round(updates.reduce((a, b) => a + b.memoryUsage, 0) / updates.length * 10) / 10;
        const avgLat = Math.round(updates.reduce((a, b) => a + b.latency, 0) / updates.length * 10) / 10;

        setMetricsTimeline(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              cpuUsage: avgCpu,
              memoryUsage: avgMem,
              latency: avgLat,
            };
          }
          return updated;
        });
      }
    }
  }, [liveTick]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [resData, aggMetrics, costs, recs] = await Promise.all([
        resourceService.getResources({ provider: selectedProvider, region: selectedRegion }),
        metricService.getAggregatedMetrics({ provider: selectedProvider, region: selectedRegion }),
        costService.getCostSummary({ provider: selectedProvider, region: selectedRegion }),
        scalingService.getRecommendations(),
      ]);

      if (resData.success) {
        setResources(resData.data);
        setHealthSummary(resData.summary);
      }
      if (aggMetrics.success) {
        setMetricsTimeline(aggMetrics.data);
      }
      if (costs.success) {
        setCostData(costs.data);
      }
      if (recs.success) {
        setRecommendations(recs.data.filter(r => r.status === 'PENDING'));
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !healthSummary) {
    return <LoadingSpinner text="Aggregating Multi-Cloud Metrics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Notification Banner */}
      {recommendations.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">
                Autonomous Optimization Opportunity Detected
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {recommendations.length} pending recommendations identified. Potential savings:{' '}
                <span className="font-bold text-emerald-600 font-mono">
                  {formatCurrency(costData?.potentialSavings || 345.50)}/mo
                </span>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/scaling')}
            icon={ArrowRight}
          >
            Review Recommendations
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tracked Workloads"
          value={resources.length}
          subtitle={`${healthSummary?.running || 0} Healthy • ${healthSummary?.warning || 0} Degraded`}
          icon={Server}
          badge={<StatusBadge status="ACTIVE" />}
        />

        <StatCard
          title="Monthly Run-Rate"
          value={formatCurrency(costData?.currentMonthlyCost || 0)}
          subtitle={`Projected: ${formatCurrency(costData?.projectedCost || 0)}`}
          trend="+3.4%"
          trendDirection="up"
          trendLabel="vs last month"
          icon={DollarSign}
        />

        <StatCard
          title="Optimization Queue"
          value={recommendations.length}
          subtitle={`Potential savings: ${formatCurrency(costData?.potentialSavings || 345.50)}/mo`}
          trend={recommendations.length > 0 ? 'Actionable' : 'Optimized'}
          trendDirection={recommendations.length > 0 ? 'down' : 'up'}
          icon={TrendingUp}
        />

        <StatCard
          title="Fleet SLA & Uptime"
          value={healthSummary?.uptime || '99.98%'}
          subtitle="All regions operational"
          trend="-2.4ms"
          trendDirection="up"
          trendLabel="p99 response latency"
          icon={Activity}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Telemetry Load Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Real-Time Fleet CPU Utilization & Load"
              subtitle="Aggregated time-series telemetry across active instances"
              action={
                <Button variant="outline" size="xs" onClick={() => navigate('/monitoring')}>
                  Full Telemetry &rarr;
                </Button>
              }
            />
            <CardBody>
              <TelemetryChart
                data={metricsTimeline}
                metricKey="cpuUsage"
                unit="%"
                color="#2563EB"
              />
            </CardBody>
          </Card>
        </div>

        {/* Cost Distribution by Provider */}
        <div>
          <Card>
            <CardHeader
              title="Expenditure by Cloud Provider"
              subtitle="Monthly run-rate breakdown"
              action={
                <Button variant="outline" size="xs" onClick={() => navigate('/costs')}>
                  Cost Explorer &rarr;
                </Button>
              }
            />
            <CardBody>
              <CostBreakdownChart
                data={costData?.providerBreakdown || []}
                type="provider"
              />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Workload Inventory Overview Table */}
      <Card>
        <CardHeader
          title="Core Cloud Infrastructure Workloads"
          subtitle="Live operational status and capacity allocation"
          action={
            <Button variant="primary" size="xs" onClick={() => navigate('/resources')}>
              Manage All Workloads &rarr;
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Region</th>
                <th className="px-5 py-3">Hardware Specs</th>
                <th className="px-5 py-3">Capacity</th>
                <th className="px-5 py-3">Monthly Cost</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {resources.slice(0, 5).map((res) => (
                <tr
                  key={res.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/resources')}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-[#0F172A]">{res.name}</p>
                    <p className="text-[11px] text-slate-500">{res.service}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <ProviderBadge provider={res.cloudAccount?.provider || 'AWS'} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 font-medium">
                    {res.region}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    <span className="font-mono">{res.cpu} vCPU</span> •{' '}
                    <span className="font-mono">{res.memory} GB</span> •{' '}
                    <span className="font-mono">{formatStorage(res.storage)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-medium text-slate-700">
                      {res.instanceCount} instances
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#0F172A]">
                    {formatCurrency(res.monthlyCost)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={res.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
