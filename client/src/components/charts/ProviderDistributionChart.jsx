import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = {
  AWS:   { main: '#FF9900', glow: 'rgba(255,153,0,0.4)' },
  Azure: { main: '#0EA5E9', glow: 'rgba(14,165,233,0.4)' },
  GCP:   { main: '#4285F4', glow: 'rgba(66,133,244,0.4)' },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const c = COLORS[item.name] || { main: '#3B82F6' };
    return (
      <div className="rounded-xl border border-white/[0.1] p-3 text-xs"
        style={{ background: 'rgba(8,15,33,0.96)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      >
        <div className="flex items-center gap-2 font-bold mb-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.main, boxShadow: `0 0 8px ${c.main}` }} />
          <span className="text-white">{item.name}</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Resources</span>
            <span className="font-mono font-bold text-white">{item.resources} workloads</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Monthly Cost</span>
            <span className="font-mono font-bold text-white">{formatCurrency(item.cost)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ProviderDistributionChart({ data = [], height = 200 }) {
  return (
    <div className="w-full flex flex-col items-center gap-4" style={{ minHeight: `${height}px` }}>
      {/* Donut */}
      <div className="w-full h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((entry) => {
                const c = COLORS[entry.name] || { main: '#3B82F6' };
                return (
                  <radialGradient key={entry.name} id={`grad-${entry.name}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={c.main} stopOpacity={1} />
                    <stop offset="100%" stopColor={c.main} stopOpacity={0.7} />
                  </radialGradient>
                );
              })}
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="resources"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={62}
              paddingAngle={5}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={`url(#grad-${entry.name})`}
                  style={{ filter: `drop-shadow(0 0 8px ${(COLORS[entry.name] || { glow: 'rgba(59,130,246,0.4)' }).glow})` }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {data.map((p) => {
          const c = COLORS[p.name] || { main: '#3B82F6', glow: 'rgba(59,130,246,0.3)' };
          const total = data.reduce((s, d) => s + d.resources, 0);
          const pct = total ? Math.round((p.resources / total) * 100) : 0;
          return (
            <div key={p.name} className="flex items-center justify-between p-2 rounded-lg border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.main, boxShadow: `0 0 6px ${c.main}` }} />
                <span className="text-xs font-semibold text-slate-300">{p.name}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.main, boxShadow: `0 0 4px ${c.main}` }} />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 w-8">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
