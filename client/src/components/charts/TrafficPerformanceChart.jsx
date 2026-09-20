import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCompactNumber, formatDateTime } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/[0.1] p-3 min-w-[190px] text-xs"
        style={{ background: 'rgba(8,15,33,0.96)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      >
        <p className="text-slate-500 font-mono text-[10px] mb-2.5 border-b border-white/[0.06] pb-1.5">
          {formatDateTime(payload[0]?.payload?.timestamp || label)}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#38BDF8', boxShadow: '0 0 6px #38BDF8' }} />
              <span className="text-slate-400">Requests</span>
            </div>
            <span className="font-mono font-bold text-white">
              {payload.find((p) => p.dataKey === 'requests')?.value?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#FBBF24', boxShadow: '0 0 6px #FBBF24' }} />
              <span className="text-slate-400">Latency</span>
            </div>
            <span className="font-mono font-bold text-amber-300">
              {payload.find((p) => p.dataKey === 'latency')?.value || 0} ms
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function TrafficPerformanceChart({ data = [], height = 260 }) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <span className="text-blue-400 text-xs">~</span>
            </div>
            <p className="text-xs text-slate-600 font-mono">No telemetry for this timeframe</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#38BDF8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.0} />
              </linearGradient>
              <filter id="glow-blue">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0)"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="rgba(255,255,255,0)"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactNumber(v)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="rgba(255,255,255,0)"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              unit="ms"
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: '11px', paddingBottom: '12px', fontFamily: 'JetBrains Mono', color: '#64748B' }}
            />

            <Area
              yAxisId="left"
              type="monotone"
              name="Requests"
              dataKey="requests"
              fill="url(#requestsGrad)"
              stroke="#38BDF8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#38BDF8', stroke: 'rgba(56,189,248,0.4)', strokeWidth: 4 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.4))' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              name="Latency (ms)"
              dataKey="latency"
              stroke="#FBBF24"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#FBBF24', stroke: 'rgba(251,191,36,0.4)', strokeWidth: 4 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.4))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
