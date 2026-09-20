import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const PROVIDER_COLORS = { AWS: '#FF9900', Azure: '#0EA5E9', GCP: '#4285F4' };
const BAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const col = payload[0].fill;
    return (
      <div className="rounded-xl border border-white/[0.1] p-2.5 text-xs"
        style={{ background: 'rgba(8,15,33,0.96)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        <p className="font-bold text-white mb-1.5">{d.name}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Monthly Cost</span>
          <span className="font-bold font-mono text-white">{formatCurrency(payload[0].value)}</span>
        </div>
        {d.percentage !== undefined && (
          <div className="flex items-center justify-between gap-4 mt-1 text-[11px]">
            <span className="text-slate-600">Share</span>
            <span className="font-mono" style={{ color: col }}>{d.percentage}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function CostBreakdownChart({ data = [], height = 240, type = 'provider' }) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">No cost records available</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              stroke="rgba(0,0,0,0)"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => `₹${v}`}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgba(0,0,0,0)"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="cost" radius={[0, 6, 6, 0]}>
              {data.map((entry, i) => {
                const color = type === 'provider' ? (PROVIDER_COLORS[entry.name] || BAR_COLORS[0]) : BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <Cell key={`cell-${i}`} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
