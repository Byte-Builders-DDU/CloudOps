import React from 'react';
import { STATUS_CONFIG, ROLES } from '../../utils/constants';

export function Badge({ children, variant = 'default', className = '', dot = false }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${variants[variant] || variants.default} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const config = ROLES[role] || {
    label: role,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${config.badgeClass}`}
    >
      {config.label}
    </span>
  );
}

export function ProviderBadge({ provider }) {
  const colors = {
    AWS: 'text-[#FF9900] bg-amber-50 border-amber-200',
    Azure: 'text-[#0078D4] bg-sky-50 border-sky-200',
    GCP: 'text-[#4285F4] bg-blue-50 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colors[provider] || 'text-slate-700 bg-slate-100 border-slate-200'}`}
    >
      {provider}
    </span>
  );
}
