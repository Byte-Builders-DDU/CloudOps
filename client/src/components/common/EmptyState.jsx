import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ title = 'No items found', description = 'No records match your current filters.', icon: Icon = Layers, actionLabel, onAction, className = '' }) {
  return (
    <div className={`text-center py-14 px-6 rounded-2xl border border-dashed border-white/[0.08] ${className}`}
      style={{ background: 'rgba(255,255,255,0.01)' }}
    >
      <div className="relative mx-auto w-14 h-14 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500">
          <Icon className="w-6 h-6" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-blue-500/5 blur-lg" />
      </div>
      <h3 className="text-sm font-bold text-slate-300 font-display">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
