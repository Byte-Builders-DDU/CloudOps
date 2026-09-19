import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge, ProviderBadge, RoleBadge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Settings as SettingsIcon,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Key,
  Shield,
  Code,
  Terminal,
  Database,
  ExternalLink,
} from 'lucide-react';
import { accountService } from '../services/accountService';

export function Settings() {
  const { user, role, isAdmin } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await accountService.getAccounts();
      if (res.success) {
        setAccounts(res.data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAccount = async (account) => {
    setSyncingId(account.id);
    setNotification(null);
    try {
      const res = await accountService.syncAccount(account.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: res.message,
        });
        loadAccounts();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Sync failed.',
      });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {notification && (
        <Alert
          variant={notification.type}
          title={notification.type === 'success' ? 'Cloud Connector Notice' : 'Sync Error'}
        >
          {notification.message}
        </Alert>
      )}

      {/* Cloud Account Connectors */}
      <Card>
        <CardHeader
          title="Multi-Cloud Account Integrations"
          subtitle="Configured credentials and telemetry ingestion channels"
          action={
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadAccounts} isLoading={loading}>
              Check Status
            </Button>
          }
        />

        {loading ? (
          <LoadingSpinner text="Querying cloud provider connectors..." />
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    <ProviderBadge provider={acc.provider} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">{acc.accountName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Default Region: <span className="font-medium text-slate-700">{acc.region}</span> • Tracked Workloads: <span className="font-semibold text-blue-600">{acc._count?.resources || 0}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <StatusBadge status={acc.status} />
                  <Button
                    size="xs"
                    variant="outline"
                    icon={RefreshCw}
                    onClick={() => handleSyncAccount(acc)}
                    isLoading={syncingId === acc.id}
                  >
                    Sync Health
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* User Profile & Permissions */}
      <Card>
        <CardHeader
          title="Active User Session & Permissions"
          subtitle="Current authentication context and RBAC permissions"
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-[#E2E8F0] text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">User Name</span>
              <span className="font-semibold text-[#0F172A] text-sm">{user?.name || 'User'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Email Address</span>
              <span className="font-semibold text-[#0F172A] text-sm">{user?.email || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Assigned Role</span>
              <div className="mt-1">
                <RoleBadge role={role} />
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-[#0F172A]">Role Capabilities in Current Session:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px]">
              <li>Read Telemetry & Multi-Cloud Dashboards: <strong className="text-emerald-600">Enabled</strong></li>
              <li>Resource Scale-Up & Rightsizing: <strong className={role === 'VIEWER' ? 'text-red-600' : 'text-emerald-600'}>{role === 'VIEWER' ? 'Disabled (Requires Operator/Admin)' : 'Enabled'}</strong></li>
              <li>Governance Policy Mutations: <strong className={isAdmin ? 'text-emerald-600' : 'text-red-600'}>{isAdmin ? 'Enabled' : 'Disabled (Requires Admin)'}</strong></li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Cloud Provider Architecture Extensibility Guide */}
      <Card>
        <CardHeader
          title="Cloud Provider Interface Architecture"
          subtitle="Pluggable backend abstraction ready for AWS / Azure / GCP SDKs"
        />
        <CardBody className="space-y-3 text-xs">
          <p className="text-slate-600">
            CloudOps is built around the unified <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">CloudProvider</code> abstract base class located at <code className="text-slate-800 font-mono">server/src/providers/CloudProvider.js</code>.
          </p>

          <div className="p-3 bg-slate-900 text-slate-300 rounded-md font-mono text-[11px] space-y-1">
            <p className="text-slate-500">// Pluggable Provider Contract</p>
            <p><span className="text-blue-400">class</span> <span className="text-yellow-300">AWSCloudProvider</span> <span className="text-blue-400">extends</span> <span className="text-yellow-300">CloudProvider</span> &#123;</p>
            <p className="pl-4"><span className="text-emerald-400">async</span> getResources(filter) &#123; ... &#125;</p>
            <p className="pl-4"><span className="text-emerald-400">async</span> getMetrics(resourceId) &#123; ... &#125;</p>
            <p className="pl-4"><span className="text-emerald-400">async</span> scaleResource(id, capacity) &#123; ... &#125;</p>
            <p className="pl-4"><span className="text-emerald-400">async</span> getCosts(filter) &#123; ... &#125;</p>
            <p>&#125;</p>
          </div>

          <p className="text-slate-500 text-[11px]">
            To plug in live cloud providers in production, provide AWS IAM credentials, Azure Service Principal, or GCP Service Account keys in the respective provider classes without changing any frontend code.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
