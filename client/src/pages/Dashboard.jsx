import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCloudFilter } from '../hooks/useCloudFilter';
import { useSocket } from '../hooks/useSocket';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, StatusBadge, ProviderBadge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import {
  CardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  ListSkeleton,
} from '../components/common/Skeleton';
import { TrafficPerformanceChart } from '../components/charts/TrafficPerformanceChart';
import { MonthlyCostChart } from '../components/charts/MonthlyCostChart';
import { ProviderDistributionChart } from '../components/charts/ProviderDistributionChart';
import {
  formatCurrency,
  formatCompactNumber,
  formatDateTime,
  formatRelativeTime,
} from '../utils/formatters';
import { CLOUD_PROVIDERS, REGIONS } from '../utils/constants';
import {
  Server,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Globe,
  Bell,
  Cpu,
  Database,
  Radio,
  HardDrive,
  Network,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';

export function Dashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const {
    selectedProvider,
    setSelectedProvider,
    selectedRegion,
    setSelectedRegion,
    refreshKey,
    triggerRefresh,
  } = useCloudFilter();
  const { isConnected, liveTick } = useSocket();

  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString());

  // Dashboard Data State
  const [summary, setSummary] = useState(null);
  const [trafficRange, setTrafficRange] = useState('24H');
  const [trafficData, setTrafficData] = useState([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [resourceHealth, setResourceHealth] = useState([]);
  const [costOverview, setCostOverview] = useState(null);
  const [providerDist, setProviderDist] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Load All Dashboard Data
  const fetchDashboardData = useCallback(async (isSubtleRefresh = false) => {
    if (isSubtleRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const params = {
      provider: selectedProvider,
      region: selectedRegion,
      timeRange: trafficRange,
    };

    try {
      const [
        summaryRes,
        trafficRes,
        healthRes,
        costRes,
        distRes,
        recsRes,
        activityRes,
        alertsRes,
      ] = await Promise.all([
        dashboardService.getSummary(params),
        dashboardService.getTraffic(params),
        dashboardService.getResourceHealth(params),
        dashboardService.getCostOverview(params),
        dashboardService.getProviderDistribution(params),
        dashboardService.getRecommendations(),
        dashboardService.getActivity(),
        dashboardService.getAlerts(),
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (trafficRes.success) setTrafficData(trafficRes.data);
      if (healthRes.success) setResourceHealth(healthRes.data);
      if (costRes.success) setCostOverview(costRes.data);
      if (distRes.success) setProviderDist(distRes.data);
      if (recsRes.success) setRecommendations(recsRes.data);
      if (activityRes.success) setActivities(activityRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load dashboard data from CloudOps backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProvider, selectedRegion, trafficRange]);

  // Initial and Filter Triggered Fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  // Traffic Range Change Only
  const handleTrafficRangeChange = async (range) => {
    setTrafficRange(range);
    setTrafficLoading(true);
    try {
      const res = await dashboardService.getTraffic({
        provider: selectedProvider,
        region: selectedRegion,
        timeRange: range,
      });
      if (res.success) {
        setTrafficData(res.data);
      }
    } catch (err) {
      console.error('Failed to change traffic range:', err);
    } finally {
      setTrafficLoading(false);
    }
  };

  // Socket.IO live tick integration for real-time pulse
  useEffect(() => {
    if (liveTick && trafficData.length > 0) {
      const latestTick = liveTick.updates?.[0];
      if (latestTick) {
        setTrafficData((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              requests: latestTick.requests * 4,
              latency: latestTick.latency,
            };
          }
          return updated;
        });
      }
    }
  }, [liveTick]);

  const handleDismissRecommendation = (recId) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== recId));
  };

  // Helper for Status Badge styling
  const renderHealthBadge = (status) => {
    if (status === 'Critical') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Critical
        </span>
      );
    }
    if (status === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Healthy
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              CloudOps Command Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
              Live Control Plane
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified visibility and control for your cloud infrastructure
          </p>
        </div>

        {/* Right Header Filters & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cloud Provider Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 shadow-subtle">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer pr-1"
            >
              {CLOUD_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Region Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 shadow-subtle">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer pr-1"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action with Timestamp */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchDashboardData(true)}
              isLoading={refreshing}
              className="bg-white text-xs h-[34px]"
            >
              Refresh
            </Button>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Last updated {lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* Error State with Retry Button */}
      {error && (
        <Alert
          variant="error"
          title="Backend Telemetry Alert"
          action={
            <Button size="xs" variant="outline" onClick={() => fetchDashboardData()}>
              Retry Connection
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* 2. Global Health Banner */}
      {loading && !summary ? (
        <div className="h-14 bg-slate-100 animate-pulse rounded-lg" />
      ) : summary?.health ? (
        <div
          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-card ${
            summary.health.requiresAttention
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                summary.health.requiresAttention
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {summary.health.requiresAttention ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {summary.health.requiresAttention
                    ? '● System Attention Required'
                    : '● All Systems Operational'}
                </span>
                <span className="text-xs font-semibold opacity-90">
                  — {summary.health.statusText}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs mt-0.5 text-slate-600 font-medium">
                <span>Services: <strong className="text-[#0F172A]">{summary.health.total}</strong></span>
                <span>Healthy: <strong className="text-emerald-700">{summary.health.healthy}</strong></span>
                <span>Warning: <strong className="text-amber-700">{summary.health.warning}</strong></span>
                <span>Critical: <strong className="text-red-700">{summary.health.critical}</strong></span>
              </div>
            </div>
          </div>

          {summary.health.requiresAttention && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/resources')}
              icon={ArrowRight}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              Review Issues
            </Button>
          )}
        </div>
      ) : null}

      {/* 3. Six KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {loading && !summary ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            {/* Card 1: Active Resources */}
            <Card className="p-4 bg-white border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Active Resources
                </span>
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                  <Server className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] mt-2 tracking-tight">
                {summary?.activeResources || 24}
              </p>
              <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-medium">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                <span>+2 this month</span>
              </div>
            </Card>

            {/* Card 2: Requests */}
            <Card className="p-4 bg-white border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Requests / 24h
                </span>
                <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                  <Radio className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] mt-2 tracking-tight">
                {formatCompactNumber(summary?.requests24h || 2840000)}
              </p>
              <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-medium">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                <span>+12.4% vs prev day</span>
              </div>
            </Card>

            {/* Card 3: Average Latency */}
            <Card className="p-4 bg-white border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Average Latency
                </span>
                <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center text-amber-600">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] mt-2 tracking-tight">
                {summary?.averageLatency || 142} <span className="text-sm font-normal text-slate-500">ms</span>
              </p>
              <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-medium">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                <span>-8.2% improved</span>
              </div>
            </Card>

            {/* Card 4: Uptime */}
            <Card className="p-4 bg-white border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  30-Day Uptime
                </span>
                <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] mt-2 tracking-tight">
                {summary?.uptime || 99.96}%
              </p>
              <div className="mt-2 text-[11px] text-slate-400 font-medium">
                Target SLA 99.95%
              </div>
            </Card>

            {/* Card 5: Monthly Cost */}
            <Card className="p-4 bg-white border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Monthly Cost
                </span>
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] mt-2 font-mono tracking-tight">
                {formatCurrency(summary?.monthlyCost || 184620)}
              </p>
              <div className="mt-2 flex items-center text-[11px] text-amber-600 font-medium">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                <span>+6.8% vs last month</span>
              </div>
            </Card>

            {/* Card 6: Potential Savings (Clickable to /costs) */}
            <Card
              className="p-4 bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-200 shadow-card cursor-pointer hover:border-emerald-300 transition-colors group"
              onClick={() => navigate('/costs')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  Potential Savings
                </span>
                <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono tracking-tight">
                {formatCurrency(summary?.potentialSavings || 28400)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                <span>From recommendations</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* 4. Traffic & Performance Chart (2/3 width) + Resource Utilization (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Traffic & Performance */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader
              title="Traffic & Performance"
              subtitle="Combined throughput (Requests) and response latency (ms)"
              action={
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
                  {['1H', '6H', '24H', '7D', '30D'].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleTrafficRangeChange(range)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        trafficRange === range
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              }
            />
            <CardBody className="pt-2">
              {trafficLoading ? (
                <ChartSkeleton height="h-[280px]" />
              ) : (
                <TrafficPerformanceChart data={trafficData} height={280} />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Resource Utilization Progress Bars */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader
              title="Resource Utilization"
              subtitle="Fleet-wide resource consumption metrics"
            />
            <CardBody className="space-y-4">
              {/* CPU Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>CPU Allocation</span>
                  </div>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {summary?.utilization?.cpu || 72}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${summary?.utilization?.cpu || 72}%` }}
                  />
                </div>
              </div>

              {/* Memory Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Memory Utilization</span>
                  </div>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {summary?.utilization?.memory || 61}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${summary?.utilization?.memory || 61}%` }}
                  />
                </div>
              </div>

              {/* Storage Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                    <span>Storage Volume Capacity</span>
                  </div>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {summary?.utilization?.storage || 78}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${summary?.utilization?.storage || 78}%` }}
                  />
                </div>
              </div>

              {/* Network Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Network className="w-3.5 h-3.5 text-purple-600" />
                    <span>Network Bandwidth Throughput</span>
                  </div>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {summary?.utilization?.network || 43}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${summary?.utilization?.network || 43}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500">
                <span>Healthy Threshold: &lt; 80%</span>
                <span className="text-blue-600 font-medium cursor-pointer" onClick={() => navigate('/monitoring')}>
                  Inspect Telemetry &rarr;
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 5. Recommended Actions (Intelligence Section) */}
      {recommendations.length > 0 && (
        <Card className="border border-blue-200 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 shadow-card">
          <div className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
                    Recommended Actions
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Intelligent workload rightsizing and proactive capacity adjustment
                  </p>
                </div>
              </div>
              <Badge variant="primary">AI Optimization Engine</Badge>
            </div>

            {/* Target Recommendation Card Item */}
            {recommendations.slice(0, 1).map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-[#E2E8F0]"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0F172A]">
                      {rec.resource?.name || 'Production API'} requires additional capacity
                    </span>
                    <ProviderBadge provider={rec.resource?.cloudAccount?.provider || 'AWS'} />
                  </div>
                  <p className="text-xs text-slate-600">
                    Traffic increased by <strong className="text-blue-600 font-bold">34%</strong> during the last hour. Recommended to prevent p99 latency degradation.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <span className="text-slate-500">
                      Current capacity: <strong className="text-[#0F172A] font-mono">{rec.currentCapacity} instances</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-blue-700">
                      Recommended: <strong className="font-mono">{rec.recommendedCapacity} instances</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      Estimated cost impact: <strong className="text-amber-700 font-mono">+{formatCurrency(rec.estimatedCostChange || 8400)}/month</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-700 font-semibold">
                      Confidence: {rec.confidence || 94}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismissRecommendation(rec.id)}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => navigate('/scaling')}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Resource Health Table */}
      <Card>
        <CardHeader
          title="Resource Health"
          subtitle="Live operational metrics, utilization, and cost across all connected cloud workloads"
          action={
            <Button variant="outline" size="xs" onClick={() => navigate('/resources')}>
              View All 24 Workloads &rarr;
            </Button>
          }
        />
        {loading && resourceHealth.length === 0 ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">CPU</th>
                  <th className="px-5 py-3">Memory</th>
                  <th className="px-5 py-3">Latency</th>
                  <th className="px-5 py-3">Cost / Month</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {resourceHealth.slice(0, 8).map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/resources/${r.id}`)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                      {r.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{r.service}</td>
                    <td className="px-5 py-3.5">
                      <ProviderBadge provider={r.provider} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{r.region}</td>
                    <td className="px-5 py-3.5">{renderHealthBadge(r.status)}</td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className={r.cpu >= 80 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {r.cpu}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className={r.memory >= 80 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {r.memory}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">{r.latency}ms</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#0F172A]">
                      {formatCurrency(r.monthlyCost)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/resources/${r.id}`);
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 7. Bottom Grid: Cost Overview (1/2) + Provider Distribution (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cost Overview */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Cloud Cost Overview"
            subtitle="Monthly expenditure trajectory against allocated budget"
            action={
              <Button size="xs" variant="outline" onClick={() => navigate('/costs')}>
                View Cost Analysis &rarr;
              </Button>
            }
          />
          <CardBody className="space-y-4">
            {/* 4 Cost KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-[#E2E8F0]">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Current Month</span>
                <span className="text-sm font-bold font-mono text-[#0F172A]">
                  {formatCurrency(costOverview?.currentMonth || 184620)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Projected EOM</span>
                <span className="text-sm font-bold font-mono text-amber-600">
                  {formatCurrency(costOverview?.projected || 216400)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Budget Ceiling</span>
                <span className="text-sm font-bold font-mono text-[#0F172A]">
                  {formatCurrency(costOverview?.budget || 250000)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Remaining</span>
                <span className="text-sm font-bold font-mono text-emerald-600">
                  {formatCurrency(costOverview?.remaining || 33600)}
                </span>
              </div>
            </div>

            {/* 6-Month Cost History Bar Chart */}
            <MonthlyCostChart data={costOverview?.monthlyHistory || []} height={170} />
          </CardBody>
        </Card>

        {/* Infrastructure by Provider */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Infrastructure by Provider"
            subtitle="Multi-cloud resource counts and estimated monthly expenditure"
          />
          <CardBody>
            <ProviderDistributionChart data={providerDist?.providers || []} height={210} />
          </CardBody>
        </Card>
      </div>

      {/* 8. Bottom Split: Needs Attention / Alerts Panel (1/2) + Recent Activity (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Needs Attention / Alerts Panel */}
        <Card className="h-full flex flex-col justify-between">
          <CardHeader
            title="Needs Attention"
            subtitle="Anomalies and threshold breaches requiring operational review"
          />
          <div className="divide-y divide-[#E2E8F0] flex-1">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active alerts. All thresholds within normal range.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {alert.severity === 'Critical' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F172A]">{alert.title}</span>
                        <Badge variant={alert.severity === 'Critical' ? 'danger' : 'warning'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">{alert.time}</span>
                    </div>
                  </div>

                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => navigate(alert.targetRoute || '/monitoring')}
                    className="shrink-0"
                  >
                    Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="h-full flex flex-col justify-between">
          <CardHeader
            title="Recent Activity"
            subtitle="Immutable operational and governance audit stream"
            action={
              <Button size="xs" variant="outline" onClick={() => navigate('/audit-logs')}>
                Full Audit Trail &rarr;
              </Button>
            }
          />
          <div className="divide-y divide-[#E2E8F0] flex-1">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]">{act.description}</p>
                      <p className="text-[11px] text-slate-400">by <span className="font-medium text-slate-600">{act.user}</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
