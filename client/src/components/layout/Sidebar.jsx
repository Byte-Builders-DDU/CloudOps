import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RoleBadge } from '../common/Badge';
import {
  LayoutDashboard,
  Server,
  Activity,
  TrendingUp,
  IndianRupee,
  Shield,
  FileText,
  Settings,
  LogOut,
  Cloud,
  GitPullRequest,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'Operate',
    items: [
      { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Resources', path: '/resources', icon: Server },
      { name: 'Monitoring', path: '/monitoring', icon: Activity },
    ],
  },
  {
    title: 'Optimize',
    items: [
      { name: 'Recommendations', path: '/scaling', icon: TrendingUp },
      { name: 'Costs & Billing', path: '/costs', icon: IndianRupee },
    ],
  },
  {
    title: 'Control',
    items: [
      { name: 'Changes', path: '/changes', icon: GitPullRequest },
      { name: 'Policies', path: '/policies', icon: Shield },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { name: 'AI Copilot', path: '/copilot', icon: Sparkles, isAI: true },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { name: 'Audit Log', path: '/audit-logs', icon: FileText },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({ onOpenCopilot }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="w-64 flex flex-col h-screen shrink-0 sidebar-bg border-r border-white/[0.06] relative overflow-hidden">
      {/* Ambient glow top */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
      {/* Ambient glow bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-violet-600/5 to-transparent pointer-events-none" />
      {/* Subtle vertical line */}
      <div className="absolute top-16 bottom-16 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

      {/* ── Brand Header ── */}
      <div className={`h-16 flex items-center gap-3 px-5 border-b border-white/[0.06] relative z-10 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {/* Logo with glow */}
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-105">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="absolute -inset-1 rounded-xl bg-blue-500/20 blur-sm -z-10" />
        </div>
        <div>
          <span className="text-[15px] font-bold text-white tracking-tight font-display">CloudOps</span>
          <span className="block text-[9px] uppercase tracking-widest text-blue-400/70 font-mono mt-0.5">
            Control Plane v2.0
          </span>
        </div>

        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 6px #34D399' }} />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto relative z-10">
        {NAV_GROUPS.map((group, gi) => (
          <div
            key={group.title}
            className={`space-y-0.5 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
            style={{ transitionDelay: `${gi * 60}ms` }}
          >
            <div className="px-3 pb-2 pt-1 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] font-mono">
              {group.title}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              if (item.isAI) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="block"
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold
                      transition-all duration-200 overflow-hidden
                      ${isActive
                        ? 'bg-gradient-to-r from-violet-600/25 to-violet-500/10 text-violet-300 border border-violet-500/25 shadow-[0_0_16px_rgba(139,92,246,0.15)]'
                        : 'text-violet-400/80 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20'
                      }
                    `}>
                      {/* AI shimmer */}
                      {isActive && (
                        <div className="absolute inset-0 shimmer opacity-30" />
                      )}
                      <div className="relative">
                        <Sparkles className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-violet-300 drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]' : ''}`} />
                      </div>
                      <span>AI Copilot</span>
                      <span className="ml-auto">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
                          BETA
                        </span>
                      </span>
                    </div>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={({ isActive: navIsActive }) => `
                    relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium
                    transition-all duration-200 overflow-hidden group
                    ${navIsActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/5 text-blue-300 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.12)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                    }
                  `}
                >
                  {({ isActive: navIsActive }) => (
                    <>
                      {/* Active left bar */}
                      {navIsActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full shadow-[0_0_6px_#60A5FA]" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 transition-all duration-200 ${navIsActive ? 'text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <span>{item.name}</span>
                      {navIsActive && (
                        <ChevronRight className="ml-auto w-3 h-3 text-blue-400/60" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User Card ── */}
      <div className={`p-3 border-t border-white/[0.06] relative z-10 transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5 group hover:bg-white/[0.05] transition-colors duration-200">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-lg">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#050B1A]" style={{ boxShadow: '0 0 6px #34D399' }} />
          </div>

          <div className="flex-1 truncate">
            <p className="text-[12px] font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
            <div className="mt-0.5">
              <RoleBadge role={role} />
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
