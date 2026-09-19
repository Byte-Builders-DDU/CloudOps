import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCloudFilter } from '../../hooks/useCloudFilter';
import { useSocket } from '../../hooks/useSocket';
import { CLOUD_PROVIDERS, REGIONS } from '../../utils/constants';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export function TopBar({ onOpenCopilot }) {
  const location = useLocation();
  const { user, role, switchDemoAccount } = useAuth();
  const {
    selectedProvider,
    setSelectedProvider,
    selectedRegion,
    setSelectedRegion,
    triggerRefresh,
  } = useCloudFilter();
  const { isConnected } = useSocket();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Derive page title conforming to DESIGN.md
  const getPageTitle = (path) => {
    const segment = path.replace('/', '');
    switch (segment) {
      case 'dashboard': return 'Overview — Command Center';
      case 'resources': return 'Resources & Service Topology';
      case 'monitoring': return 'Monitoring & Uptime Observability';
      case 'scaling': return 'Prioritized Recommendations';
      case 'costs': return 'Costs, Budgets & Billing Workspace';
      case 'changes': return 'Changes & Approvals Inbox';
      case 'policies': return 'Governance Policies & Safety Bounds';
      case 'copilot': return 'AI Operations Copilot Workspace';
      case 'audit-logs': return 'Security & Decision Audit Log';
      case 'settings': return 'Workspace Settings & Cloud Accounts';
      default: return 'CloudOps Platform';
    }
  };

  const notifications = [
    { id: 1, title: 'Traffic Surge on Production API (+34%)', time: '5m ago', unread: true, type: 'warning' },
    { id: 2, title: 'Optimization recommendation generated (Save INR 5,700)', time: '20m ago', unread: true, type: 'info' },
    { id: 3, title: 'Production capacity guardrail verified', time: '1h ago', unread: false, type: 'success' },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Page Title & Breadcrumb Context */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-[#0F172A] tracking-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Fresh (&lt;1m ago)
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-normal">
          Multi-Cloud Control Plane • Production Cloud • Live Providers
        </p>
      </div>

      {/* Right Actions: Filters, Ask Copilot, Notifications, Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Cloud Provider Global Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E2E8F0] rounded-md px-2.5 py-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-xs bg-transparent text-[#0F172A] font-medium focus:outline-none cursor-pointer"
          >
            {CLOUD_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ask Copilot Button (DESIGN.md violet styling) */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-xs font-semibold shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask Copilot
        </button>

        {/* Live WebSocket Status Indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-50 border border-[#E2E8F0]"
          title={isConnected ? 'Real-time telemetry stream active' : 'Connecting to telemetry socket...'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-2xs' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-[11px] text-slate-600 font-mono hidden md:inline">
            {isConnected ? 'Stream Active' : 'Connecting'}
          </span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-800">Operational Alerts</span>
                <span className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start gap-2.5 hover:bg-slate-50/80 px-1 rounded transition-colors">
                    {n.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-800">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Role Switcher Menu (Two-Person Approval Rule Testing) */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-bold text-slate-900 leading-none">{role}</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5 truncate max-w-[100px]">
                {user?.email || 'admin@cloudops.dev'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-[#E2E8F0] p-3 z-50">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Switch Role / Two-Person Rule
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => { switchDemoAccount('admin@cloudops.dev'); setShowUserMenu(false); }}
                  className={`w-full text-left p-2 rounded text-xs flex items-center justify-between ${
                    user?.email === 'admin@cloudops.dev' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Admin (Apurv)</p>
                    <p className="text-[10px] text-slate-500">admin@cloudops.dev</p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">ADMIN</span>
                </button>

                <button
                  onClick={() => { switchDemoAccount('secops@cloudops.dev'); setShowUserMenu(false); }}
                  className={`w-full text-left p-2 rounded text-xs flex items-center justify-between ${
                    user?.email === 'secops@cloudops.dev' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">SecOps Admin (2nd Approver)</p>
                    <p className="text-[10px] text-slate-500">secops@cloudops.dev</p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">ADMIN</span>
                </button>

                <button
                  onClick={() => { switchDemoAccount('operator@cloudops.dev'); setShowUserMenu(false); }}
                  className={`w-full text-left p-2 rounded text-xs flex items-center justify-between ${
                    user?.email === 'operator@cloudops.dev' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">DevOps Engineer</p>
                    <p className="text-[10px] text-slate-500">operator@cloudops.dev</p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">OPERATOR</span>
                </button>

                <button
                  onClick={() => { switchDemoAccount('viewer@cloudops.dev'); setShowUserMenu(false); }}
                  className={`w-full text-left p-2 rounded text-xs flex items-center justify-between ${
                    user?.email === 'viewer@cloudops.dev' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Finance & Product</p>
                    <p className="text-[10px] text-slate-500">viewer@cloudops.dev</p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">VIEWER</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
