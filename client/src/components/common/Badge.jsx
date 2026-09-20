import React from 'react';
import { STATUS_CONFIG, ROLES } from '../../utils/constants';

export function Badge({ children, variant = 'default', className = '', dot = false }) {
  const variants = {
    default: 'bg-white/[0.05] text-slate-400 border-white/[0.08]',
    primary: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    danger:  'bg-red-500/15 text-red-400 border-red-500/25',
    purple:  'bg-violet-500/15 text-violet-400 border-violet-500/25',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border font-mono ${variants[variant] || variants.default} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const darkConfig = {
    HEALTHY:     { label: 'Healthy',     bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', dot: 'bg-emerald-400', glow: '0 0 6px #34D399' },
    DEGRADED:    { label: 'Degraded',    bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/25',   dot: 'bg-amber-400',   glow: '0 0 6px #FBBF24' },
    CRITICAL:    { label: 'Critical',    bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/25',     dot: 'bg-red-400',     glow: '0 0 6px #F87171' },
    WARNING:     { label: 'Warning',     bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/25',   dot: 'bg-amber-400',   glow: '0 0 6px #FBBF24' },
    RUNNING:     { label: 'Running',     bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', dot: 'bg-emerald-400', glow: '0 0 6px #34D399' },
    STOPPED:     { label: 'Stopped',     bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/25',   dot: 'bg-slate-400',   glow: 'none' },
    PENDING:     { label: 'Pending',     bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/25',    dot: 'bg-blue-400',    glow: '0 0 6px #60A5FA' },
    APPROVED:    { label: 'Approved',    bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', dot: 'bg-emerald-400', glow: '0 0 6px #34D399' },
    REJECTED:    { label: 'Rejected',    bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/25',     dot: 'bg-red-400',     glow: '0 0 6px #F87171' },
    EXECUTING:   { label: 'Executing',   bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/25',    dot: 'bg-blue-400',    glow: '0 0 6px #60A5FA' },
    COMPLETED:   { label: 'Completed',   bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', dot: 'bg-emerald-400', glow: '0 0 6px #34D399' },
    FAILED:      { label: 'Failed',      bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/25',     dot: 'bg-red-400',     glow: '0 0 6px #F87171' },
    WAITING_APPROVAL: { label: 'Awaiting Approval', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25', dot: 'bg-violet-400', glow: '0 0 6px #A78BFA' },
  };

  const cfg = darkConfig[status] || { label: status, bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/25', dot: 'bg-slate-400', glow: 'none' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border font-mono ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} style={{ boxShadow: cfg.glow }} />
      {cfg.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const roleMap = {
    ADMIN:    { label: 'Admin',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    OPERATOR: { label: 'Operator', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    VIEWER:   { label: 'Viewer',   cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
  };

  const cfg = roleMap[role] || { label: role, cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border font-mono ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function ProviderBadge({ provider }) {
  const colors = {
    AWS:   'text-amber-400  bg-amber-500/15  border-amber-500/25',
    Azure: 'text-sky-400    bg-sky-500/15    border-sky-500/25',
    GCP:   'text-blue-400   bg-blue-500/15   border-blue-500/25',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${colors[provider] || 'text-slate-400 bg-slate-500/15 border-slate-500/25'}`}>
      {provider}
    </span>
  );
}
