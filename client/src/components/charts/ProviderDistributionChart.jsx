import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export function ProviderDistributionChart({ data = [], height = 180 }) {
  const providerColors = {
    AWS: '#FF9900',
    Azure: '#0078D4',
    GCP: '#4285F4',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#0F172A] border border-slate-700 text-white text-xs p-2.5 rounded-md shadow-lg">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || providerColors[item.name] }} />
            <span>{item.name}</span>
          </div>
          <div className="space-y-0.5 text-[11px] text-slate-300">
            <p>Resources: <strong className="text-white">{item.resources} workloads</strong></p>
            <p>Est. Monthly Cost: <strong className="text-white font-mono">{formatCurrency(item.cost)}</strong></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2" style={{ minHeight: `${height}px` }}>
      <div className="w-full sm:w-1/2 h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="resources"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={60}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || providerColors[entry.name] || '#2563EB'}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full sm:w-1/2 space-y-2 text-xs">
        {data.map((p) => (
          <div key={p.name} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.color || providerColors[p.name] }}
              />
              <span className="font-semibold text-slate-800">{p.name}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-[#0F172A]">{p.resources} res</span>
              <span className="block text-[10px] text-slate-500 font-mono">{formatCurrency(p.cost)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
