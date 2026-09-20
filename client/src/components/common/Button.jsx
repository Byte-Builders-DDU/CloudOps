import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:   'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border border-blue-500/30 shadow-[0_4px_16px_rgba(37,99,235,0.35)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.5)] hover:-translate-y-px',
    secondary: 'bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] hover:border-white/[0.15]',
    outline:   'border border-white/[0.1] bg-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white',
    ghost:     'text-slate-400 hover:text-white hover:bg-white/[0.05]',
    danger:    'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/25 hover:border-red-500/40',
    success:   'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/25 hover:border-emerald-500/40',
    violet:    'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white border border-violet-500/30 shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.5)] hover:-translate-y-px',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-sm gap-2',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
