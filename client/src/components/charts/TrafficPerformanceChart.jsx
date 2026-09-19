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

export function TrafficPerformanceChart({ data = [], height = 280 }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] border border-slate-700 text-white text-xs p-3 rounded-md shadow-xl min-w-[180px]">
          <p className="text-slate-400 font-mono text-[11px] mb-2 border-b border-slate-700 pb-1">
            {formatDateTime(payload[0].payload.timestamp || label)}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-300">Requests:</span>
              </div>
              <span className="font-mono font-bold text-white">
                {payload.find((p) => p.dataKey === 'requests')?.value?.toLocaleString() || 0} req
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-300">Avg Latency:</span>
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

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-400">
          No traffic telemetry available for this timeframe.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            {/* Left Y Axis: Requests */}
            <YAxis
              yAxisId="left"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCompactNumber(val)}
            />
            {/* Right Y Axis: Latency in ms */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              unit="ms"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              name="Requests"
              dataKey="requests"
              fill="url(#trafficGradient)"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              name="Latency (ms)"
              dataKey="latency"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
