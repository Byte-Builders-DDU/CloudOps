import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden border border-white/[0.06] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4 relative ${className}`}
      {...props}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      {title || subtitle ? (
        <div>
          {title && <h3 className="text-sm font-bold text-white tracking-tight font-display">{title}</h3>}
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      ) : (
        children
      )}
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500 bg-white/[0.02] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
