import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function CostTrendChart({ data = [], height = 260 }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((acc, curr) => acc + (curr.value || 0), 0);
      return (
        <div className="bg-[#0F172A] border border-slate-700 text-white text-xs p-3 rounded-md shadow-lg min-w-[160px]">
          <p className="text-slate-400 font-mono text-[11px] mb-2">{formatDate(label)}</p>
          <div className="space-y-1">
            {payload.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}:</span>
                </div>
                <span className="font-mono font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 mt-2 pt-1.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Total:</span>
            <span className="text-white font-mono">{formatCurrency(total)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[260px]">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-400">
          No historical spend data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getMonth() + 1}/${d.getDate()}`;
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
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="square"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Bar dataKey="AWS" stackId="a" fill="#FF9900" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Azure" stackId="a" fill="#0078D4" radius={[0, 0, 0, 0]} />
            <Bar dataKey="GCP" stackId="a" fill="#4285F4" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
