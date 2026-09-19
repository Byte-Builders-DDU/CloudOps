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
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { metricService } from '../services/metricService';

export function Monitoring() {
  const { selectedProvider, selectedRegion } = useCloudFilter();
  const { isConnected, liveTick } = useSocket();

  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [timeRange, setTimeRange] = useState('24h'); // '1h' | '6h' | '24h' | '7d'
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

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

  // Load metrics for selected resource
  useEffect(() => {
    if (selectedResourceId) {
      loadResourceMetrics();
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
      {/* Control Bar: Resource Selector & Time Range Selector */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Workload Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Target Workload:</span>
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="text-xs font-medium rounded-md border border-[#E2E8F0] px-3 py-2 bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-blue-600 w-full md:w-72"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.service} • {r.cloudAccount?.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector & Live Pulse */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
              {[
                { id: '1h', label: '1 Hour' },
                { id: '6h', label: '6 Hours' },
                { id: '24h', label: '24 Hours' },
                { id: '7d', label: '7 Days' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    timeRange === range.id
                      ? 'bg-white shadow-xs text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadResourceMetrics}
              isLoading={loadingMetrics}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Target Resource Metadata Summary */}
      {currentResource && (
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-card flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A]">{currentResource.name}</h3>
                <ProviderBadge provider={currentResource.cloudAccount?.provider || 'AWS'} />
                <StatusBadge status={currentResource.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentResource.service} • {currentResource.region} • {currentResource.instanceCount} Active Instances
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Avg CPU Usage</span>
              <span className="font-bold text-[#0F172A] font-mono text-sm">{avgCpu}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Peak CPU</span>
              <span className="font-bold text-[#0F172A] font-mono text-sm">{maxCpu}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Avg Memory</span>
              <span className="font-bold text-[#0F172A] font-mono text-sm">{avgMem}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">p99 Latency</span>
              <span className="font-bold text-[#0F172A] font-mono text-sm">{avgLat} ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Deep Telemetry Charts 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Utilization Chart */}
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

        {/* Memory Utilization Chart */}
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

        {/* Response Latency Chart */}
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

        {/* Request Throughput Chart */}
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
  );
}
