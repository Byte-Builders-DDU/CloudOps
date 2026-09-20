import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export function Alert({ variant = 'info', title, children, className = '', action }) {
  const configs = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/25 text-blue-200',
      iconBg: 'bg-blue-500/20',
      icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
      titleColor: 'text-blue-300',
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200',
      iconBg: 'bg-emerald-500/20',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      titleColor: 'text-emerald-300',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/25 text-amber-200',
      iconBg: 'bg-amber-500/20',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      titleColor: 'text-amber-300',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/25 text-red-200',
      iconBg: 'bg-red-500/20',
      icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
      titleColor: 'text-red-300',
    },
  };

  const c = configs[variant] || configs.info;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${c.bg} ${className}`}>
      <div className={`w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
        {c.icon}
      </div>
      <div className="flex-1">
        {title && <h4 className={`font-bold mb-0.5 text-[13px] ${c.titleColor}`}>{title}</h4>}
        <div className="opacity-80">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
