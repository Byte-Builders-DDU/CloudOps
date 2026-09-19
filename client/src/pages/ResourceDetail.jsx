import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge, ProviderBadge } from '../components/common/Badge';
import { TelemetryChart } from '../components/charts/TelemetryChart';
import { ScaleResourceModal } from '../components/resources/ScaleResourceModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatStorage } from '../utils/formatters';
import {
  ArrowLeft,
  Server,
  Cpu,
  Activity,
  HardDrive,
  Database,
  TrendingUp,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { metricService } from '../services/metricService';

export function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('cpuUsage');

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [resData, metricData] = await Promise.all([
        resourceService.getResourceById(id),
        metricService.getResourceMetrics(id, { timeRange: '24h' }),
      ]);

      if (resData.success) {
        setResource(resData.data);
      }
      if (metricData.success) {
        setMetrics(metricData.data);
      }
    } catch (err) {
      console.error('Failed to load resource detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving resource telemetry and configuration..." />;
  }

  if (!resource) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/resources')}>
          Back to Resources
        </Button>
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-[#0F172A]">Resource Not Found</p>
          <p className="text-xs text-slate-500 mt-1">The requested workload ID does not exist.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/resources')}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-[#0F172A]">{resource.name}</h1>
              <ProviderBadge provider={resource.cloudAccount?.provider || 'AWS'} />
              <StatusBadge status={resource.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {resource.service} • {resource.region} • ID: <span className="font-mono">{resource.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadDetails}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={TrendingUp} onClick={() => setIsScaleModalOpen(true)}>
            Scale Workload
          </Button>
        </div>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>vCPU Cores</span>
          </div>
          <p className="text-xl font-bold text-[#0F172A] mt-1">{resource.cpu} Cores</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Memory RAM</span>
          </div>
          <p className="text-xl font-bold text-[#0F172A] mt-1">{resource.memory} GB</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <HardDrive className="w-4 h-4 text-amber-600" />
            <span>Allocated Storage</span>
          </div>
          <p className="text-xl font-bold text-[#0F172A] mt-1">{formatStorage(resource.storage)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Database className="w-4 h-4 text-purple-600" />
            <span>Capacity & Cost</span>
          </div>
          <p className="text-xl font-bold text-[#0F172A] mt-1 font-mono">{formatCurrency(resource.monthlyCost)}/mo</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{resource.instanceCount} instances running</p>
        </Card>
      </div>

      {/* Telemetry Charts */}
      <Card>
        <CardHeader
          title="24-Hour Telemetry Performance"
          subtitle="Real-time time series metrics"
          action={
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
              {[
                { id: 'cpuUsage', label: 'CPU %' },
                { id: 'memoryUsage', label: 'Memory %' },
                { id: 'latency', label: 'Latency' },
                { id: 'requests', label: 'Requests' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedMetric === m.id
                      ? 'bg-white text-blue-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          }
        />
        <CardBody>
          <TelemetryChart
            data={metrics}
            metricKey={selectedMetric}
            unit={selectedMetric === 'cpuUsage' || selectedMetric === 'memoryUsage' ? '%' : selectedMetric === 'latency' ? 'ms' : 'req/m'}
            color={selectedMetric === 'cpuUsage' ? '#2563EB' : selectedMetric === 'memoryUsage' ? '#10B981' : selectedMetric === 'latency' ? '#F59E0B' : '#8B5CF6'}
            height={280}
          />
        </CardBody>
      </Card>

      {/* Scale Modal */}
      {isScaleModalOpen && (
        <ScaleResourceModal
          isOpen={isScaleModalOpen}
          onClose={() => setIsScaleModalOpen(false)}
          resource={resource}
          onSuccess={(res) => {
            loadDetails();
          }}
        />
      )}
    </div>
  );
}
