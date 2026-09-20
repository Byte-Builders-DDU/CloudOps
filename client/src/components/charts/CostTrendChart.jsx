import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return (
      <div className="rounded-xl border border-white/[0.1] p-3 text-xs min-w-[160px]"
        style={{ background: 'rgba(8,15,33,0.96)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        <p className="text-slate-500 font-mono text-[10px] mb-2">{formatDate(label)}</p>
        <div className="space-y-1">
          {payload.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
                <span className="text-slate-400">{item.name}:</span>
              </div>
              <span className="font-mono font-bold text-white">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] mt-2 pt-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-500">Total</span>
          <span className="text-white font-mono font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function CostTrendChart({ data = [], height = 260 }) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">No historical spend data available</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => { const d = new Date(val); return `${d.getMonth()+1}/${d.getDate()}`; }}
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
              tickMargin={10}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend verticalAlign="top" align="right" iconType="square" iconSize={6}
              wrapperStyle={{ fontSize: '10px', paddingBottom: '10px', fontFamily: 'JetBrains Mono', color: '#64748B' }}
            />
            <Bar dataKey="AWS"   stackId="a" fill="#FF9900" radius={[0,0,0,0]} style={{ filter: 'drop-shadow(0 0 4px rgba(255,153,0,0.4))' }} />
            <Bar dataKey="Azure" stackId="a" fill="#0EA5E9" radius={[0,0,0,0]} style={{ filter: 'drop-shadow(0 0 4px rgba(14,165,233,0.4))' }} />
            <Bar dataKey="GCP"   stackId="a" fill="#4285F4" radius={[4,4,0,0]} style={{ filter: 'drop-shadow(0 0 4px rgba(66,133,244,0.4))' }} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
