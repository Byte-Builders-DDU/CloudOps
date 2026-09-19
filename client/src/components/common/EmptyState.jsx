import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  icon: Icon = Layers,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`text-center py-12 px-4 rounded-lg border border-dashed border-[#E2E8F0] bg-white ${className}`}>
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
