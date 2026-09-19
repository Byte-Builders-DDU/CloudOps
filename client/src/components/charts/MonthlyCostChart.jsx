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
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export function MonthlyCostChart({ data = [], height = 180 }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#0F172A] border border-slate-700 text-white text-xs p-2.5 rounded-md shadow-lg">
          <p className="text-slate-400 font-semibold mb-1">{item.month}</p>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-300">Monthly Spend:</span>
            <span className="font-mono font-bold text-white">{formatCurrency(item.cost)}</span>
          </div>
          {item.projected && (
            <div className="flex items-center justify-between gap-3 text-[11px] text-amber-300 mt-1 border-t border-slate-700 pt-1">
              <span>Projected EOM:</span>
              <span className="font-mono font-bold">{formatCurrency(item.projected)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-400">
          No cost history available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="month"
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
              tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === data.length - 1 ? '#2563EB' : '#94A3B8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
