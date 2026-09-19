import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCloudFilter } from '../hooks/useCloudFilter';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { StatusBadge, ProviderBadge } from '../components/common/Badge';
import { ScaleResourceModal } from '../components/resources/ScaleResourceModal';
import { ResourceDetailModal } from '../components/resources/ResourceDetailModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { formatCurrency, formatStorage } from '../utils/formatters';
import {
  Server,
  Search,
  Filter,
  Plus,
  RefreshCw,
  TrendingUp,
  Cpu,
  Info,
  RotateCw,
  ShieldAlert,
} from 'lucide-react';
import { resourceService } from '../services/resourceService';

export function Resources() {
  const { role, canScale, canModifyResources, isViewer } = useAuth();
  const { selectedProvider, selectedRegion, refreshKey, triggerRefresh } = useCloudFilter();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [selectedForScale, setSelectedForScale] = useState(null);
  const [selectedForDetail, setSelectedForDetail] = useState(null);
  const [restartingId, setRestartingId] = useState(null);

  useEffect(() => {
    loadResources();
  }, [selectedProvider, selectedRegion, statusFilter, typeFilter, refreshKey]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await resourceService.getResources({
        provider: selectedProvider,
        region: selectedRegion,
        status: statusFilter,
        search: searchTerm,
      });

      if (res.success) {
        let list = res.data;
        if (typeFilter !== 'ALL') {
          list = list.filter(r => r.type.toLowerCase() === typeFilter.toLowerCase());
        }
        setResources(list);
      }
    } catch (err) {
      console.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async (resource) => {
    setRestartingId(resource.id);
    try {
      const res = await resourceService.restartResource(resource.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Resource "${resource.name}" restarted successfully. All health checks green.`,
        });
        loadResources();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to restart resource.',
      });
    } finally {
      setRestartingId(null);
    }
  };

  const handleScaleSuccess = (scaleResult) => {
    setNotification({
      type: 'success',
      message: `Scaled "${scaleResult.resource.name}" to ${scaleResult.newCapacity} instances. Cost delta: ${formatCurrency(scaleResult.costChange)}/mo`,
    });
    loadResources();
    triggerRefresh();
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Alert
          variant={notification.type}
          title={notification.type === 'success' ? 'Operation Completed' : 'Action Failed'}
        >
          {notification.message}
        </Alert>
      )}

      {isViewer && (
        <Alert variant="info" title="Read-Only Role Access">
          You are signed in with the <span className="font-semibold">Viewer</span> role. Infrastructure scaling and configuration mutations are restricted. To test scaling actions, switch to <span className="font-semibold">Operator</span> or <span className="font-semibold">Admin</span> from the top-right role switcher.
        </Alert>
      )}

      {/* Filter and Action Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search resources, services, or regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadResources()}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-[#E2E8F0] focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-md border border-[#E2E8F0] px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="RUNNING">Running</option>
              <option value="DEGRADED">Degraded</option>
              <option value="STOPPED">Stopped</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs rounded-md border border-[#E2E8F0] px-3 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Resource Types</option>
              <option value="compute">Compute</option>
              <option value="database">Database</option>
              <option value="storage">Storage</option>
              <option value="cache">Cache</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadResources} isLoading={loading}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader
          title="Cloud Workloads & Infrastructure"
          subtitle={`Showing ${resources.length} active resources`}
        />

        {loading && resources.length === 0 ? (
          <LoadingSpinner text="Querying cloud inventory..." />
        ) : resources.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No resources match filters"
              description="Try adjusting your cloud provider, region, or status filters above."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
                loadResources();
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Resource Name</th>
                  <th className="px-5 py-3.5">Provider</th>
                  <th className="px-5 py-3.5">Region</th>
                  <th className="px-5 py-3.5">Type & Service</th>
                  <th className="px-5 py-3.5">Hardware Config</th>
                  <th className="px-5 py-3.5">Capacity</th>
                  <th className="px-5 py-3.5">Monthly Cost</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedForDetail(res)}
                        className="font-semibold text-[#0F172A] hover:text-blue-600 text-left transition-colors flex items-center gap-1.5"
                      >
                        {res.name}
                        {res.hasRecommendation && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Optimization recommendation available" />
                        )}
                      </button>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {res.id.substring(0, 8)}...
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <ProviderBadge provider={res.cloudAccount?.provider || 'AWS'} />
                    </td>

                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {res.region}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700">{res.type}</span>
                      <p className="text-[11px] text-slate-500">{res.service}</p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      <span className="font-mono">{res.cpu} vCPU</span> •{' '}
                      <span className="font-mono">{res.memory} GB</span> •{' '}
                      <span className="font-mono">{formatStorage(res.storage)}</span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded bg-slate-100 font-mono font-medium text-[#0F172A]">
                        {res.instanceCount} instances
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-[#0F172A]">
                      {formatCurrency(res.monthlyCost)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={res.status} />
                    </td>

                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setSelectedForDetail(res)}
                      >
                        Details
                      </Button>

                      {canScale ? (
                        <Button
                          size="xs"
                          variant="primary"
                          icon={TrendingUp}
                          onClick={() => setSelectedForScale(res)}
                        >
                          Scale
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          disabled
                          title="Operator or Admin role required to scale workloads"
                        >
                          Scale (Locked)
                        </Button>
                      )}

                      {canModifyResources && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleRestart(res)}
                          isLoading={restartingId === res.id}
                          title="Restart / Refresh Health"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Scale Resource Modal */}
      {selectedForScale && (
        <ScaleResourceModal
          isOpen={!!selectedForScale}
          onClose={() => setSelectedForScale(null)}
          resource={selectedForScale}
          onSuccess={handleScaleSuccess}
        />
      )}

      {/* Resource Detail Modal */}
      {selectedForDetail && (
        <ResourceDetailModal
          isOpen={!!selectedForDetail}
          onClose={() => setSelectedForDetail(null)}
          resource={selectedForDetail}
          onOpenScale={(r) => setSelectedForScale(r)}
        />
      )}
    </div>
  );
}
