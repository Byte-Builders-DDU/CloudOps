import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatDateTime } from '../../utils/formatters';

export function TelemetryChart({
  data = [],
  metricKey = 'cpuUsage', // 'cpuUsage' | 'memoryUsage' | 'latency' | 'requests' | 'networkIn'
  title = 'CPU Utilization',
  unit = '%',
  color = '#2563EB',
  height = 240,
}) {
  const [activeRange, setActiveRange] = useState('24h');

  // Format tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] border border-slate-700 text-white text-xs p-2.5 rounded-md shadow-lg">
          <p className="text-slate-400 font-mono text-[10px] mb-1">
            {formatDateTime(label)}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-semibold text-slate-200">
              {payload[0].value} {unit}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-[240px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No telemetry data available for selected window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                }}
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={metricKey === 'cpuUsage' || metricKey === 'memoryUsage' ? [0, 100] : ['auto', 'auto']}
                unit={unit}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={metricKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${metricKey})`}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
