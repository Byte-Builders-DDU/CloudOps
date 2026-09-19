import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge, ProviderBadge } from '../common/Badge';
import { TelemetryChart } from '../charts/TelemetryChart';
import { formatCurrency, formatStorage } from '../../utils/formatters';
import { Cpu, HardDrive, Database, Activity, RefreshCw } from 'lucide-react';
import { metricService } from '../../services/metricService';

export function ResourceDetailModal({
  isOpen,
  onClose,
  resource,
  onOpenScale,
}) {
  const [metrics, setMetrics] = useState([]);
  const [metricType, setMetricType] = useState('cpuUsage'); // 'cpuUsage' | 'memoryUsage' | 'latency' | 'requests'
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    if (isOpen && resource) {
      loadMetrics();
    }
  }, [isOpen, resource]);

  const loadMetrics = async () => {
    if (!resource) return;
    setLoadingMetrics(true);
    try {
      const res = await metricService.getResourceMetrics(resource.id, { timeRange: '24h' });
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load metrics for modal:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  if (!resource) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resource.name}
      subtitle={`${resource.service} • ${resource.region}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-lg">
          <div className="flex items-center gap-3">
            <ProviderBadge provider={resource.cloudAccount?.provider || 'AWS'} />
            <StatusBadge status={resource.status} />
            <span className="text-xs text-slate-500 font-mono">ID: {resource.id.substring(0, 13)}...</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Cost:</span>
            <span className="text-sm font-bold font-mono text-[#0F172A]">
              {formatCurrency(resource.monthlyCost)}/mo
            </span>
          </div>
        </div>

        {/* Hardware Specs Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>vCPU</span>
            </div>
            <p className="text-lg font-bold text-[#0F172A]">{resource.cpu} Cores</p>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>RAM</span>
            </div>
            <p className="text-lg font-bold text-[#0F172A]">{resource.memory} GB</p>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <HardDrive className="w-3.5 h-3.5 text-amber-600" />
              <span>Storage</span>
            </div>
            <p className="text-lg font-bold text-[#0F172A]">{formatStorage(resource.storage)}</p>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              <span>Capacity</span>
            </div>
            <p className="text-lg font-bold text-[#0F172A]">{resource.instanceCount} Inst.</p>
          </div>
        </div>

        {/* Telemetry Chart Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              24-Hour Telemetry History
            </h4>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
              {[
                { id: 'cpuUsage', label: 'CPU' },
                { id: 'memoryUsage', label: 'Memory' },
                { id: 'latency', label: 'Latency' },
                { id: 'requests', label: 'Requests' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMetricType(tab.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    metricType === tab.id ? 'bg-white shadow-xs text-blue-600 font-semibold' : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-3">
            <TelemetryChart
              data={metrics}
              metricKey={metricType}
              unit={metricType === 'cpuUsage' || metricType === 'memoryUsage' ? '%' : metricType === 'latency' ? 'ms' : 'req/m'}
              color={metricType === 'cpuUsage' ? '#2563EB' : metricType === 'memoryUsage' ? '#10B981' : metricType === 'latency' ? '#F59E0B' : '#8B5CF6'}
            />
          </div>
        </div>

        {/* Active Scaling Recommendation Banner if present */}
        {resource.activeRecommendation && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-start justify-between gap-3">
            <div>
              <span className="font-semibold text-amber-900 block mb-0.5">
                Intelligent Recommendation: {resource.activeRecommendation.type}
              </span>
              <p className="text-amber-800">{resource.activeRecommendation.reason}</p>
            </div>
            <Button
              size="xs"
              variant="primary"
              onClick={() => {
                onClose();
                onOpenScale(resource);
              }}
            >
              Review Scale
            </Button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadMetrics} isLoading={loadingMetrics}>
            Refresh Telemetry
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenScale(resource);
              }}
            >
              Scale Capacity
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
