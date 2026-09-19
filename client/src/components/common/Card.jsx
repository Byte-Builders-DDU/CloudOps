import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-lg shadow-card overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {title || subtitle ? (
        <div>
          {title && <h3 className="text-sm font-semibold text-[#0F172A] tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
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
      className={`px-5 py-3.5 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
