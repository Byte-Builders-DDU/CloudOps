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
  Globe,
} from 'lucide-react';

export function TopBar() {
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

  // Derive human readable page title
  const getPageTitle = (path) => {
    const segment = path.replace('/', '');
    switch (segment) {
      case 'dashboard': return 'Infrastructure Dashboard';
      case 'resources': return 'Cloud Resources Inventory';
      case 'monitoring': return 'Real-Time Monitoring & Telemetry';
      case 'scaling': return 'Autonomous Scaling & Optimization';
      case 'costs': return 'Multi-Cloud Cost Governance';
      case 'policies': return 'Infrastructure Policies & Guardrails';
      case 'audit-logs': return 'Security & Audit Logs';
      case 'settings': return 'Platform Settings & Cloud Accounts';
      default: return 'CloudOps Platform';
    }
  };

  const notifications = [
    { id: 1, title: 'Intelligent Scale-Up Recommendation', time: '10m ago', unread: true, type: 'warning' },
    { id: 2, title: 'Multi-AZ Database backup completed', time: '1h ago', unread: false, type: 'success' },
    { id: 3, title: 'Policy "Staging Limit" verified', time: '3h ago', unread: false, type: 'info' },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Page Title */}
      <div>
        <h1 className="text-base font-bold text-[#0F172A] tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
        <p className="text-[11px] text-slate-500 font-normal">
          Multi-Cloud Control Plane • Real-Time Health & Governance
        </p>
      </div>

      {/* Right: Global Filters, WebSocket Status, Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Cloud Provider Global Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E2E8F0] rounded-md px-2.5 py-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="bg-transparent text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer"
          >
            {CLOUD_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Region Global Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E2E8F0] rounded-md px-2.5 py-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-transparent text-xs font-medium text-[#0F172A] focus:outline-none cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={triggerRefresh}
          title="Refresh Data"
          className="p-2 text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* WebSocket Real-time Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title={isConnected ? 'Real-time telemetry stream connected' : 'Connecting to telemetry socket...'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 rounded-md transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-dropdown border border-[#E2E8F0] py-2 z-30">
              <div className="px-4 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F172A]">Notifications</span>
                <span className="text-[10px] text-blue-600 font-medium cursor-pointer">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer text-xs">
                    <p className="font-medium text-[#0F172A]">{n.title}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Demo Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-slate-100 text-xs font-medium text-slate-700"
          >
            <span>Switch Role</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-dropdown border border-[#E2E8F0] py-1.5 z-30">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                1-Click Demo Account Switch
              </div>
              <button
                onClick={() => {
                  switchDemoAccount('admin@cloudops.dev');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                  role === 'ADMIN' ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <div>
                  <p>Admin Account</p>
                  <p className="text-[10px] text-slate-400">admin@cloudops.dev</p>
                </div>
                {role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </button>

              <button
                onClick={() => {
                  switchDemoAccount('operator@cloudops.dev');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                  role === 'OPERATOR' ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <div>
                  <p>Operator Account</p>
                  <p className="text-[10px] text-slate-400">operator@cloudops.dev</p>
                </div>
                {role === 'OPERATOR' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </button>

              <button
                onClick={() => {
                  switchDemoAccount('viewer@cloudops.dev');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                  role === 'VIEWER' ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <div>
                  <p>Viewer Account</p>
                  <p className="text-[10px] text-slate-400">viewer@cloudops.dev</p>
                </div>
                {role === 'VIEWER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
