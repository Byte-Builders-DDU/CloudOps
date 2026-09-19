import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export function CostBreakdownChart({
  data = [],
  height = 240,
  type = 'provider', // 'provider' | 'service'
}) {
  const providerColors = {
    AWS: '#FF9900',
    Azure: '#0078D4',
    GCP: '#4285F4',
  };

  const defaultBarColor = '#2563EB';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] border border-slate-700 text-white text-xs p-2.5 rounded-md shadow-lg">
          <p className="text-slate-300 font-semibold mb-1">{payload[0].payload.name}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Monthly Run-Rate:</span>
            <span className="font-bold text-white">{formatCurrency(payload[0].value)}</span>
          </div>
          {payload[0].payload.percentage !== undefined && (
            <div className="flex items-center justify-between gap-4 mt-1 text-[11px] text-slate-400">
              <span>Share:</span>
              <span>{payload[0].payload.percentage}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[240px]">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-slate-400">
          No cost records available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis
              type="number"
              stroke="#94A3B8"
              fontSize={10}
              tickFormatter={(val) => `$${val}`}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={type === 'provider' ? (providerColors[entry.name] || defaultBarColor) : defaultBarColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
