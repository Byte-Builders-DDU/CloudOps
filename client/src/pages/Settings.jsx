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
  BookOpen,
  Plus,
  Trash2,
  Search,
  Tag,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
} from 'lucide-react';
import { accountService } from '../services/accountService';
import { runbookService } from '../services/runbookService';
import { CloudConnectionModal } from '../components/resources/CloudConnectionModal';
import { CreateRunbookModal } from '../components/resources/CreateRunbookModal';

export function Settings() {
  const { user, role, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'runbooks' | 'session' | 'architecture'
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Cloud Account Modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Runbooks State
  const [runbooks, setRunbooks] = useState([]);
  const [loadingRunbooks, setLoadingRunbooks] = useState(false);
  const [runbookSearch, setRunbookSearch] = useState('');
  const [runbookCategory, setRunbookCategory] = useState('ALL');
  const [expandedRunbookId, setExpandedRunbookId] = useState(null);
  const [isCreateRunbookOpen, setIsCreateRunbookOpen] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadRunbooks();
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

  const loadRunbooks = async () => {
    setLoadingRunbooks(true);
    try {
      const res = await runbookService.getRunbooks({
        category: runbookCategory,
        search: runbookSearch,
      });
      if (res.success) {
        setRunbooks(res.data);
      }
    } catch (err) {
      console.error('Failed to load runbooks:', err);
    } finally {
      setLoadingRunbooks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'runbooks') {
      loadRunbooks();
    }
  }, [runbookCategory, runbookSearch, activeTab]);

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

  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`Are you sure you want to disconnect account "${account.accountName}"?`)) {
      return;
    }

    setDeletingId(account.id);
    setNotification(null);
    try {
      const res = await accountService.deleteAccount(account.id);
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
        message: err.response?.data?.error?.message || 'Failed to disconnect account.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {notification && (
        <Alert
          variant={notification.type}
          title={notification.type === 'success' ? 'Connector Status' : 'Connector Error'}
        >
          {notification.message}
        </Alert>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'accounts'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Cloud Accounts ({accounts.length})
        </button>

        <button
          onClick={() => setActiveTab('runbooks')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'runbooks'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Runbooks & Knowledge Base ({runbooks.length})
        </button>

        <button
          onClick={() => setActiveTab('session')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'session'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <User className="w-4 h-4" />
          Session & RBAC
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'architecture'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Code className="w-4 h-4" />
          Architecture Guide
        </button>
      </div>

      {/* ── TAB 1: CLOUD ACCOUNTS ── */}
      {activeTab === 'accounts' && (
        <Card>
          <CardHeader
            title="Multi-Cloud Account Integrations"
            subtitle="Configured credentials and telemetry ingestion channels across AWS, Azure, GCP & Mock"
            action={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadAccounts} isLoading={loading}>
                  Refresh
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => setIsConnectModalOpen(true)}
                  >
                    Connect Account
                  </Button>
                )}
              </div>
            }
          />

          {loading ? (
            <LoadingSpinner text="Querying cloud provider connectors..." />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <ProviderBadge provider={acc.provider} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {acc.accountName}
                        {acc.roleArn && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            STS AssumeRole
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Region: <span className="font-medium text-slate-300">{acc.region}</span> • Tracked Workloads: <span className="font-semibold text-blue-400">{acc._count?.resources || 0}</span> • ID: <span className="font-mono text-slate-500">{acc.accountId}</span>
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
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteAccount(acc)}
                        disabled={deletingId === acc.id}
                        title="Disconnect Cloud Account"
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 2: OPERATIONAL RUNBOOKS & KNOWLEDGE ── */}
      {activeTab === 'runbooks' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Operational Runbooks Knowledge Base"
              subtitle="Grounded remediation procedures retrieved by AI Copilot during incidents"
              action={
                isAdmin && (
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => setIsCreateRunbookOpen(true)}
                  >
                    Author Runbook
                  </Button>
                )
              }
            />

            {/* Filter Bar */}
            <div className="p-4 border-b border-white/[0.08] bg-white/[0.01] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search symptoms, services, or procedures..."
                  value={runbookSearch}
                  onChange={(e) => setRunbookSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-white/[0.08] bg-white/[0.03] text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                {['ALL', 'SCALING', 'RESOURCE_LEAK', 'DATABASE', 'COST', 'GOVERNANCE'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setRunbookCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      runbookCategory === cat
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loadingRunbooks ? (
              <LoadingSpinner text="Querying runbook procedures..." />
            ) : runbooks.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                No matching operational runbooks found.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {runbooks.map((rb) => {
                  const isExpanded = expandedRunbookId === rb.id;
                  return (
                    <div key={rb.id} className="p-5 hover:bg-white/[0.01] transition-colors">
                      <div
                        onClick={() => setExpandedRunbookId(isExpanded ? null : rb.id)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                {rb.id}
                              </span>
                              <h4 className="text-sm font-bold text-white">{rb.title}</h4>
                              <span className="text-[10px] text-slate-500 font-mono">v{rb.version}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Target: <strong className="text-slate-300">{rb.service}</strong> • Category: <span className="text-purple-300 font-medium">{rb.category}</span> • Owner: <span className="text-slate-500">{rb.owner}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {rb.tags?.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-slate-400 border border-white/[0.06]">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <button className="text-slate-400 hover:text-white p-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4 animate-fade-in text-xs">
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            <strong className="block text-[11px] uppercase tracking-wider text-amber-400 mb-1">
                              Trigger Symptoms:
                            </strong>
                            {rb.symptoms}
                          </div>

                          <div>
                            <strong className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                              Step-by-Step Remediation Procedure:
                            </strong>
                            <div className="space-y-1.5 font-mono text-[11px] p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                              {rb.remediationSteps?.map((step, idx) => (
                                <p key={idx} className="text-slate-300">
                                  {step}
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/[0.04]">
                            <span>Last Reviewed: {rb.lastUpdated}</span>
                            <span className="text-purple-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cited by AI Copilot
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 3: USER SESSION & PERMISSIONS ── */}
      {activeTab === 'session' && (
        <Card>
          <CardHeader
            title="Active User Session & RBAC Permissions"
            subtitle="Current authentication context, token authorization, and workspace scoping"
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">User Name</span>
                <span className="font-semibold text-white text-sm">{user?.name || 'User'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="font-semibold text-white text-sm">{user?.email || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Role</span>
                <div className="mt-1">
                  <RoleBadge role={role} />
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">Active Session Capabilities:</p>
              <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                <li>Read Telemetry & Multi-Cloud Dashboards: <strong className="text-emerald-400">Enabled (All Roles)</strong></li>
                <li>Submit Capacity Scaling & Rightsizing Proposals: <strong className={role === 'VIEWER' ? 'text-rose-400' : 'text-emerald-400'}>{role === 'VIEWER' ? 'Blocked (Requires Operator or Admin)' : 'Authorized'}</strong></li>
                <li>Dual-Control Approval Gate: <strong className={isAdmin ? 'text-emerald-400' : 'text-rose-400'}>{isAdmin ? 'Authorized (Subject to Two-Person rule)' : 'Blocked (Requires Admin)'}</strong></li>
                <li>Governance Policy Mutations & Thresholds: <strong className={isAdmin ? 'text-emerald-400' : 'text-rose-400'}>{isAdmin ? 'Authorized' : 'Blocked (Requires Admin)'}</strong></li>
                <li>Runbook Authoring & Cloud Onboarding: <strong className={isAdmin ? 'text-emerald-400' : 'text-rose-400'}>{isAdmin ? 'Authorized' : 'Blocked (Requires Admin)'}</strong></li>
              </ul>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── TAB 4: ARCHITECTURE GUIDE ── */}
      {activeTab === 'architecture' && (
        <Card>
          <CardHeader
            title="Cloud Provider Interface Architecture"
            subtitle="Pluggable backend abstraction ready for AWS / Azure / GCP SDKs"
          />
          <CardBody className="space-y-3 text-xs">
            <p className="text-slate-300">
              CloudOps is built around the unified <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">CloudProvider</code> abstract base class located at <code className="text-slate-300 font-mono">server/src/providers/CloudProvider.js</code>.
            </p>

            <div className="p-4 bg-black/40 border border-white/[0.08] text-slate-300 rounded-xl font-mono text-[11px] space-y-1">
              <p className="text-slate-500">// Pluggable Multi-Cloud Provider Contract</p>
              <p><span className="text-blue-400">class</span> <span className="text-yellow-300">CloudProvider</span> &#123;</p>
              <p className="pl-4"><span className="text-emerald-400">async</span> getResources(filter) &#123; ... &#125;</p>
              <p className="pl-4"><span className="text-emerald-400">async</span> getMetrics(resourceId) &#123; ... &#125;</p>
              <p className="pl-4"><span className="text-emerald-400">async</span> scaleResource(id, capacity) &#123; ... &#125;</p>
              <p className="pl-4"><span className="text-emerald-400">async</span> getCosts(filter) &#123; ... &#125;</p>
              <p className="pl-4"><span className="text-emerald-400">async</span> getServiceHealth() &#123; ... &#125;</p>
              <p>&#125;</p>
            </div>

            <p className="text-slate-400 text-[11px]">
              Active adapters include <code className="text-amber-400">AWSCloudProvider</code> (@aws-sdk/client-auto-scaling, CloudWatch), <code className="text-sky-400">AzureCloudProvider</code> (@azure/arm-compute, Azure Monitor), and <code className="text-emerald-400">GCPCloudProvider</code> (@google-cloud/compute, Cloud Monitoring), falling back seamlessly to <code className="text-purple-400">MockCloudProvider</code> when external credentials are absent.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Cloud Account Wizard Modal */}
      <CloudConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={() => {
          loadAccounts();
          setNotification({
            type: 'success',
            message: 'New cloud provider account connected successfully.',
          });
        }}
      />

      {/* Create Runbook Modal */}
      <CreateRunbookModal
        isOpen={isCreateRunbookOpen}
        onClose={() => setIsCreateRunbookOpen(false)}
        onSuccess={() => {
          loadRunbooks();
          setNotification({
            type: 'success',
            message: 'New operational runbook published successfully.',
          });
        }}
      />
    </div>
  );
}
