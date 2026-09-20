import React from 'react';

export function LoadingSpinner({ text = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-4 ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-10 h-10 rounded-full border-2 border-white/[0.06] border-t-blue-500 animate-spin" />
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-sm" />
      </div>
      {text && <p className="text-xs font-mono text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
}
