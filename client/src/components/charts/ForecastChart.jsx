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
import { CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

export function ForecastChart({
  forecastData = [],
  backtestSummary = null,
  resourceName = 'Resource',
  height = 280,
}) {
  if (!forecastData || forecastData.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        No forecast observations available for this resource.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-[#0F172A] border border-slate-700 text-white text-xs p-3 rounded-lg shadow-xl min-w-[200px]">
          <p className="text-purple-300 font-mono text-[11px] mb-2 font-semibold">
            {label} (+{payload[0]?.payload?.hour || ''})
          </p>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Median Projection:
              </span>
              <span className="font-mono font-bold text-white">
                {dataPoint?.median?.toLocaleString()} req/m
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">80% Interval:</span>
              <span className="font-mono text-purple-200">
                {dataPoint?.lower80?.toLocaleString()} – {dataPoint?.upper80?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">95% Interval:</span>
              <span className="font-mono text-purple-300">
                {dataPoint?.lower95?.toLocaleString()} – {dataPoint?.upper95?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Backtest Validation Banner */}
      {backtestSummary && (
        <div className="mb-3 px-3 py-2 bg-purple-50/70 border border-purple-200/80 rounded-md flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-900">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-medium">
              Statistical Model Validated: <strong className="font-bold">+{backtestSummary.improvementPercent}%</strong> Holdout Accuracy over Seasonal-Naive Baseline
            </span>
          </div>
          <span className="text-[11px] text-purple-700 font-mono bg-purple-100/80 px-2 py-0.5 rounded">
            {backtestSummary.foldsEvaluated} Folds Backtested
          </span>
        </div>
      )}

      {/* Recharts Composed Area + Line Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecastData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradient95" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradient80" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.06} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="hour"
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
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 95% Confidence Interval Area */}
            <Area
              type="monotone"
              dataKey="upper95"
              stroke="none"
              fill="url(#gradient95)"
              name="95% Interval"
            />

            {/* 80% Confidence Interval Area */}
            <Area
              type="monotone"
              dataKey="upper80"
              stroke="none"
              fill="url(#gradient80)"
              name="80% Interval"
            />

            {/* Median Trendline */}
            <Line
              type="monotone"
              dataKey="median"
              stroke="#7C3AED"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#7C3AED', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#7C3AED', stroke: '#FFFFFF', strokeWidth: 2 }}
              name="Median Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-purple-600 inline-block" /> Median Projected Demand
          <span className="w-3 h-3 bg-purple-200/80 rounded inline-block ml-2" /> 80% & 95% Prediction Intervals
        </span>
        <span>Horizon: Next 24 Hours (Hourly Holdout)</span>
      </div>
    </div>
  );
}
