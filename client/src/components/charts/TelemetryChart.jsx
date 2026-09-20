import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatDateTime } from '../../utils/formatters';

export function TelemetryChart({ data = [], metricKey = 'cpuUsage', unit = '%', color = '#38BDF8', height = 240 }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/[0.1] p-2.5 text-xs"
          style={{ background: 'rgba(8,15,33,0.96)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <p className="text-slate-500 font-mono text-[10px] mb-1.5">{formatDateTime(label)}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="font-bold text-white font-mono">{payload[0].value} {unit}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
          No telemetry data for this window
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`tgrad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
              }}
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
              domain={metricKey === 'cpuUsage' || metricKey === 'memoryUsage' ? [0, 100] : ['auto', 'auto']}
              unit={unit}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey={metricKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#tgrad-${metricKey})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'rgba(255,255,255,0.2)', strokeWidth: 3 }}
              style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
