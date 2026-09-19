import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  badge,
  className = '',
}) {
  return (
    <Card className={`p-5 relative ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F172A] tracking-tight">{value}</span>
            {badge && <div>{badge}</div>}
          </div>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#0F172A] shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(trend !== undefined || subtitle) && (
        <div className="mt-3.5 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center font-medium ${
                trendDirection === 'up'
                  ? 'text-emerald-600'
                  : trendDirection === 'down'
                  ? 'text-red-600'
                  : 'text-slate-500'
              }`}
            >
              {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
              {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              {trendDirection === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5" />}
              {trend}
            </span>
          )}
          {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
          {subtitle && !trend && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
