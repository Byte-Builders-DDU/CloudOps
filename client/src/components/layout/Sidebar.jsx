import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RoleBadge } from '../common/Badge';
import {
  LayoutDashboard,
  Server,
  Activity,
  TrendingUp,
  DollarSign,
  Shield,
  FileText,
  Settings,
  LogOut,
  Cloud,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Resources', path: '/resources', icon: Server },
  { name: 'Monitoring', path: '/monitoring', icon: Activity },
  { name: 'Scaling', path: '/scaling', icon: TrendingUp },
  { name: 'Costs', path: '/costs', icon: DollarSign },
  { name: 'Policies', path: '/policies', icon: Shield },
  { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user, role, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">CloudOps</span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono">
            Platform MVP
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Infrastructure
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Current User Card */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0B1120]">
        <div className="flex items-center justify-between p-2 rounded-md bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-700/60 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'User'}</p>
              <div className="mt-0.5">
                <RoleBadge role={role} />
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
