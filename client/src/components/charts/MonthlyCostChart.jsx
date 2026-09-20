import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/[0.1] p-3 text-xs"
        style={{ background: 'rgba(8,15,33,0.96)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      >
        <p className="text-slate-400 font-semibold mb-1.5 font-mono">{item.month}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Spend</span>
          <span className="font-mono font-bold text-white">{formatCurrency(item.cost)}</span>
        </div>
        {item.projected && (
          <div className="flex items-center justify-between gap-4 text-amber-300 mt-1 border-t border-white/[0.06] pt-1">
            <span>Projected EOM</span>
            <span className="font-mono font-bold">{formatCurrency(item.projected)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function MonthlyCostChart({ data = [], height = 200 }) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-xs text-slate-600 font-mono">No cost history available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barSize={24}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3B82F6" stopOpacity={1} />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="barGradDim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#334155" stopOpacity={1} />
                <stop offset="100%" stopColor="#1E293B" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis
              dataKey="month"
              stroke="rgba(0,0,0,0)"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(0,0,0,0)"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

            <Bar dataKey="cost" radius={[6, 6, 2, 2]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === data.length - 1 ? 'url(#barGrad)' : 'url(#barGradDim)'}
                  style={index === data.length - 1 ? { filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' } : {}}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
