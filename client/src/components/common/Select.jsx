import React from 'react';

export function Select({ label, options = [], error, helperText, className = '', id, ...props }) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500/40 bg-red-500/10 text-red-300' : ''} ${className}`}
        style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px', paddingRight: '32px' }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value ?? opt.id} value={opt.value ?? opt.id} style={{ background: '#080F21', color: '#E2E8F0' }}>
            {opt.label ?? opt.name}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1.5 text-xs text-red-400 font-mono">{error}</p> : helperText ? <p className="mt-1.5 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}
