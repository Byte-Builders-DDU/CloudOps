import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, trendDirection = 'neutral', badge, className = '' }) {
  const trendColor = trendDirection === 'up' ? 'text-emerald-400' : trendDirection === 'down' ? 'text-red-400' : 'text-slate-500';

  return (
    <Card className={`p-5 relative ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight font-mono">{value}</span>
            {badge && <div>{badge}</div>}
          </div>
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 shrink-0">
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      {(trend !== undefined || subtitle) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span className={`inline-flex items-center font-semibold font-mono ${trendColor}`}>
              {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
              {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              {trendDirection === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5" />}
              {trend}
            </span>
          )}
          {trendLabel && <span className="text-slate-600">{trendLabel}</span>}
          {subtitle && !trend && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
