import React from 'react';

export function Input({ label, helperText, error, icon: Icon, className = '', id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-xl border transition-all duration-200 ${
            error
              ? 'border-red-500/40 bg-red-500/10 text-red-300 focus:border-red-500/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-200 placeholder-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
          } px-3 py-2.5 text-sm focus:outline-none ${Icon ? 'pl-9' : ''} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-400 font-mono">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
