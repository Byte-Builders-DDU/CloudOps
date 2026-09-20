import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCloudFilter } from '../../hooks/useCloudFilter';
import { useSocket } from '../../hooks/useSocket';
import { CLOUD_PROVIDERS } from '../../utils/constants';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
  Zap,
  Info,
} from 'lucide-react';

export function TopBar({ onOpenCopilot }) {
  const location = useLocation();
  const { user, role, switchDemoAccount } = useAuth();
  const { selectedProvider, setSelectedProvider, triggerRefresh } = useCloudFilter();
  const { isConnected } = useSocket();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount] = useState(2);

  const getPageInfo = (path) => {
    const seg = path.replace('/', '').split('/')[0];
    const map = {
      dashboard:  { title: 'Command Center',       sub: 'Real-time multi-cloud overview' },
      resources:  { title: 'Resources',             sub: 'Infrastructure topology & health' },
      monitoring: { title: 'Monitoring',            sub: 'Uptime probes & observability' },
      scaling:    { title: 'Recommendations',       sub: 'Intelligent scaling suggestions' },
      costs:      { title: 'Cost Intelligence',     sub: 'FinOps & budget governance' },
      changes:    { title: 'Change Approvals',      sub: 'Dual-control change management' },
      policies:   { title: 'Governance Policies',   sub: 'Safety bounds & enforcement' },
      copilot:    { title: 'AI Copilot',            sub: 'Grounded operations intelligence' },
      'audit-logs':{ title: 'Audit Log',            sub: 'Immutable security trail' },
      settings:   { title: 'Settings',             sub: 'Workspace & cloud accounts' },
    };
    return map[seg] || { title: 'CloudOps Platform', sub: 'Unified cloud control' };
  };

  const { title, sub } = getPageInfo(location.pathname);

  const notifications = [
    { id: 1, title: 'Traffic Surge on Production API (+34%)', time: '5m ago', unread: true, type: 'warning' },
    { id: 2, title: 'AI detected potential savings of ₹5,700/mo', time: '20m ago', unread: true, type: 'info' },
    { id: 3, title: 'Production capacity guardrail verified', time: '1h ago', unread: false, type: 'success' },
  ];

  return (
    <header className="h-14 border-b border-white/[0.06] px-6 flex items-center justify-between sticky top-0 z-20 relative"
      style={{ background: 'rgba(5,11,26,0.8)', backdropFilter: 'blur(20px)' }}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* ── Left: Page Title ── */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-bold text-white tracking-tight font-display">{title}</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-0.5">{sub}</p>
        </div>
      </div>

      {/* ── Right: Controls ── */}
      <div className="flex items-center gap-2">

        {/* Provider Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-xs bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            style={{ appearance: 'none' }}
          >
            {CLOUD_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#080F21', color: '#E2E8F0' }}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </div>

        {/* Ask Copilot — Hero CTA */}
        <button
          onClick={onOpenCopilot}
          className="btn-neon-violet flex items-center gap-2 px-3.5 py-1.5 text-xs"
          style={{ fontSize: '12px' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask Copilot
        </button>

        {/* Refresh */}
        <button
          onClick={triggerRefresh}
          className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* WebSocket Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs"
          title={isConnected ? 'Live telemetry active' : 'Connecting...'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
            style={isConnected ? { boxShadow: '0 0 8px #34D399' } : {}}
          />
          <span className="text-[10px] font-mono hidden md:inline text-slate-500">
            {isConnected ? 'Stream Active' : 'Connecting'}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050B1A]"
                style={{ boxShadow: '0 0 8px rgba(239,68,68,0.8)' }}
              />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/[0.08] p-3 z-50 animate-slide-right"
              style={{ background: 'rgba(8,15,33,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent rounded-t-xl" />
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2">
                <span className="text-xs font-bold text-white">Operational Alerts</span>
                <span className="chip-blue cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                    {n.type === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px #FBBF24)' }} />
                    ) : n.type === 'info' ? (
                      <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px #34D399)' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 leading-snug">{n.title}</p>
                      <span className="text-[10px] text-slate-600 font-mono">{n.time}</span>
                    </div>
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-bold text-slate-200 leading-none">{role}</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5 truncate max-w-[80px]">{user?.email?.split('@')[0]}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/[0.08] p-3 z-50 animate-slide-right"
              style={{ background: 'rgba(8,15,33,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent rounded-t-xl" />
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 font-mono">Switch Role</p>
              <div className="space-y-1">
                {[
                  { email: 'admin@cloudops.dev', name: 'Admin (Apurv)', badge: 'ADMIN', color: 'blue' },
                  { email: 'secops@cloudops.dev', name: 'SecOps Admin (2nd Approver)', badge: 'ADMIN', color: 'blue' },
                  { email: 'operator@cloudops.dev', name: 'DevOps Engineer', badge: 'OPERATOR', color: 'green' },
                  { email: 'viewer@cloudops.dev', name: 'Finance & Product', badge: 'VIEWER', color: 'slate' },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => { switchDemoAccount(acc.email); setShowUserMenu(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-all duration-150 group ${
                      user?.email === acc.email
                        ? 'bg-blue-500/15 border border-blue-500/25 text-blue-300'
                        : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-inherit">{acc.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{acc.email}</p>
                    </div>
                    <span className={acc.color === 'blue' ? 'chip-blue' : acc.color === 'green' ? 'chip-green' : 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30'}>
                      {acc.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
