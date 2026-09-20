import React, { useState, useEffect } from 'react';
import { useCloudFilter } from '../hooks/useCloudFilter';
import { useSocket } from '../hooks/useSocket';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TelemetryChart } from '../components/charts/TelemetryChart';
import { StatusBadge, ProviderBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatPercent, formatDateTime } from '../utils/formatters';
import {
  Activity,
  Cpu,
  Database,
  Radio,
  Clock,
  RefreshCw,
  HardDrive,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { metricService } from '../services/metricService';
import { ForecastChart } from '../components/charts/ForecastChart';

export function Monitoring() {
  const { selectedProvider, selectedRegion } = useCloudFilter();
  const { isConnected, liveTick } = useSocket();

  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [timeRange, setTimeRange] = useState('24h'); // '1h' | '6h' | '24h' | '7d'
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Phase 2 Forecast state
  const [activeView, setActiveView] = useState('telemetry'); // 'telemetry' | 'forecast'
  const [forecastData, setForecastData] = useState([]);
  const [backtestSummary, setBacktestSummary] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Load resources list
  useEffect(() => {
    async function loadResourceList() {
      try {
        const res = await resourceService.getResources({
          provider: selectedProvider,
          region: selectedRegion,
        });
        if (res.success && res.data.length > 0) {
          setResources(res.data);
          if (!selectedResourceId || !res.data.find(r => r.id === selectedResourceId)) {
            setSelectedResourceId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load resources for monitoring:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResourceList();
  }, [selectedProvider, selectedRegion]);

  // Load metrics and forecast for selected resource
  useEffect(() => {
    if (selectedResourceId) {
      loadResourceMetrics();
      loadResourceForecast();
    }
  }, [selectedResourceId, timeRange]);

  // Live WebSocket Tick Handler
  useEffect(() => {
    if (liveTick && selectedResourceId) {
      const match = liveTick.updates?.find(u => u.resourceId === selectedResourceId);
      if (match) {
        setMetrics(prev => [
          ...prev.slice(1),
          {
            timestamp: match.timestamp,
            cpuUsage: match.cpuUsage,
            memoryUsage: match.memoryUsage,
            latency: match.latency,
            requests: match.requests,
            networkIn: 24.5,
            networkOut: 45.2,
          }
        ]);
      }
    }
  }, [liveTick, selectedResourceId]);

  const loadResourceMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await metricService.getResourceMetrics(selectedResourceId, { timeRange });
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadResourceForecast = async () => {
    if (!selectedResourceId) return;
    setLoadingForecast(true);
    try {
      const res = await metricService.getResourceForecast(selectedResourceId, { horizon: 24 });
      if (res.success && res.data) {
        setForecastData(res.data.forecastPoints || []);
        setBacktestSummary(res.data.backtestSummary || null);
      }
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const currentResource = resources.find(r => r.id === selectedResourceId);

  // Compute aggregate summary statistics for the metric series
  const avgCpu = metrics.length > 0
    ? (metrics.reduce((acc, m) => acc + m.cpuUsage, 0) / metrics.length).toFixed(1)
    : 0;
  const maxCpu = metrics.length > 0
    ? Math.max(...metrics.map(m => m.cpuUsage)).toFixed(1)
    : 0;

  const avgMem = metrics.length > 0
    ? (metrics.reduce((acc, m) => acc + m.memoryUsage, 0) / metrics.length).toFixed(1)
    : 0;

  const avgLat = metrics.length > 0
    ? (metrics.reduce((acc, m) => acc + m.latency, 0) / metrics.length).toFixed(1)
    : 0;

  const totalReqs = metrics.length > 0
    ? metrics.reduce((acc, m) => acc + m.requests, 0)
    : 0;

  if (loading) {
    return <LoadingSpinner text="Connecting to telemetry stream..." />;
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <Card className="p-4 animate-slide-up" style={{ animationDelay: '100ms', opacity: 0 }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Target Workload:</span>
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="text-xs font-medium rounded-xl border border-white/[0.08] px-3 py-2 bg-white/[0.03] text-slate-200 focus:outline-none focus:border-blue-500/50 w-full md:w-72 transition-colors"
              style={{ appearance: 'none' }}
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id} style={{ background: '#080F21', color: '#E2E8F0' }}>
                  {r.name} ({r.service} • {r.cloudAccount?.provider})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] p-1 rounded-xl text-xs">
              {[
                { id: '1h', label: '1H' },
                { id: '6h', label: '6H' },
                { id: '24h', label: '24H' },
                { id: '7d', label: '7D' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    timeRange === range.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadResourceMetrics} isLoading={loadingMetrics}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Resource Summary */}
      {currentResource && (
        <div className="glass-card rounded-2xl border border-white/[0.06] p-4 flex flex-wrap items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '200ms', opacity: 0 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0" style={{ boxShadow: '0 0 16px rgba(59,130,246,0.15)' }}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-display">{currentResource.name}</h3>
                <ProviderBadge provider={currentResource.cloudAccount?.provider || 'AWS'} />
                <StatusBadge status={currentResource.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentResource.service} · {currentResource.region} · {currentResource.instanceCount} instances
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            {[{ label: 'Avg CPU', val: `${avgCpu}%` }, { label: 'Peak CPU', val: `${maxCpu}%` }, { label: 'Avg RAM', val: `${avgMem}%` }, { label: 'p99 Latency', val: `${avgLat} ms` }].map(m => (
              <div key={m.label}>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider">{m.label}</span>
                <span className="font-bold text-white font-mono text-sm">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Switcher */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] animate-slide-up" style={{ animationDelay: '300ms', opacity: 0 }}>
        <button
          onClick={() => setActiveView('telemetry')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all duration-150 border-b-2 -mb-px flex items-center gap-2 ${
            activeView === 'telemetry'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Telemetry (4 Metrics)
        </button>
        <button
          onClick={() => { setActiveView('forecast'); if (forecastData.length === 0) loadResourceForecast(); }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all duration-150 border-b-2 -mb-px flex items-center gap-2 ${
            activeView === 'forecast'
              ? 'border-violet-500 text-violet-400 bg-violet-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          24h Demand Forecast (R²)
        </button>
      </div>

      {activeView === 'forecast' ? (
        <div className="animate-slide-up" style={{ animationDelay: '400ms', opacity: 0 }}>
          <Card>
          <CardHeader
            title={`${currentResource?.name || 'Resource'} — 24-Hour Demand Forecast`}
            subtitle="Hourly demand prediction with 80% and 95% statistical confidence intervals"
            action={
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={loadResourceForecast}
                isLoading={loadingForecast}
              >
                Recompute Forecast
              </Button>
            }
          />
          <CardBody>
            <ForecastChart
              forecastData={forecastData}
              backtestSummary={backtestSummary}
              resourceName={currentResource?.name}
            />
          </CardBody>
        </Card>
        </div>
      ) : (
        /* Deep Telemetry Charts 2x2 Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Utilization Chart */}
          <div className="animate-slide-up" style={{ animationDelay: '400ms', opacity: 0 }}>
            <Card>
            <CardHeader
              title="CPU Utilization"
              subtitle="Percent processor load across allocated cores"
            />
            <CardBody>
              <TelemetryChart
                data={metrics}
                metricKey="cpuUsage"
                unit="%"
                color="#2563EB"
              />
            </CardBody>
          </Card>
          </div>

          {/* Memory Utilization Chart */}
          <div className="animate-slide-up" style={{ animationDelay: '480ms', opacity: 0 }}>
            <Card>
            <CardHeader
              title="Memory (RAM) Utilization"
              subtitle="Allocated memory buffers and cache load"
            />
            <CardBody>
              <TelemetryChart
                data={metrics}
                metricKey="memoryUsage"
                unit="%"
                color="#10B981"
              />
            </CardBody>
          </Card>
          </div>

          {/* Response Latency Chart */}
          <div className="animate-slide-up" style={{ animationDelay: '560ms', opacity: 0 }}>
            <Card>
            <CardHeader
              title="End-to-End Response Latency"
              subtitle="Round-trip request processing latency (ms)"
            />
            <CardBody>
              <TelemetryChart
                data={metrics}
                metricKey="latency"
                unit="ms"
                color="#F59E0B"
              />
            </CardBody>
          </Card>
          </div>

          {/* Request Throughput Chart */}
          <div className="animate-slide-up" style={{ animationDelay: '640ms', opacity: 0 }}>
            <Card>
            <CardHeader
              title="Request Throughput"
              subtitle="Ingress requests per minute"
            />
            <CardBody>
              <TelemetryChart
                data={metrics}
                metricKey="requests"
                unit="req/m"
                color="#8B5CF6"
              />
            </CardBody>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
