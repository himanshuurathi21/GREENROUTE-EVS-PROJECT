import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { ModeEmissionResult } from '../../types/emissions';
import { TravelMode } from '../../types/routing';

interface EmissionsBarChartProps {
  emissions: Record<TravelMode, ModeEmissionResult>;
  availableModes: TravelMode[];
  selectedMode: TravelMode;
  onSelectMode?: (mode: TravelMode) => void;
}

const MODE_SHORT_LABELS: Record<TravelMode, string> = {
  car: 'Car',
  motorcycle: 'Bike',
  bus: 'Bus',
  metro_train: 'Metro',
  cycling: 'Cycle',
  walking: 'Walk',
};

export const EmissionsBarChart: React.FC<EmissionsBarChartProps> = ({
  emissions,
  availableModes,
  selectedMode,
  onSelectMode,
}) => {
  const data = availableModes.map((mode) => {
    const em = emissions[mode];
    return {
      mode,
      label: MODE_SHORT_LABELS[mode] ?? mode,
      fullLabel: em?.modeLabel || mode,
      co2Kg: em?.totalCo2Kg || 0,
      co2GramsPerKm: em?.co2GramsPerKm || 0,
      isSelected: mode === selectedMode,
    };
  });

  return (
    <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
      <div className="flex items-center justify-between border-b border-accent-dark/30 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-dark uppercase tracking-wider">
            Total Carbon Footprint by Available Mode (kg CO₂)
          </h4>
          <p className="text-xs text-mineral mt-0.5">
            Real calculation based on actual corridor distance and vehicle efficiency.
          </p>
        </div>
        <span className="text-[11px] text-forest font-semibold bg-accent px-2 py-0.5 rounded border border-accent-dark/40">
          Lower is better
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fill: '#26332D', fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: '#E8EFE9' }}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#69756F', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#E8EFE9' }}
              tickFormatter={(value: number) => `${value.toFixed(2)} kg`}
              width={62}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white p-2.5 rounded border border-accent-dark/60 shadow-card text-xs text-slate-dark font-sans">
                    <p className="font-semibold">{d.fullLabel}</p>
                    <p className="text-forest font-bold mt-1">
                      {d.co2Kg.toFixed(2)} kg CO₂
                    </p>
                    <p className="text-[11px] text-mineral mt-0.5">
                      Intensity: {d.co2GramsPerKm} g/km
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="co2Kg"
              radius={[4, 4, 0, 0]}
              minPointSize={2}
              onClick={(entry) => onSelectMode && onSelectMode(entry.mode as TravelMode)}
              className="cursor-pointer"
            >
              <LabelList
                dataKey="co2Kg"
                position="top"
                fill="#26332D"
                fontSize={10}
                fontWeight={600}
                formatter={(value: unknown) => Number(value).toFixed(2)}
              />
              {data.map((entry, index) => {
                let fill = '#6F8F78';
                if (entry.isSelected) {
                  fill = '#315C4A';
                } else if (entry.co2Kg === 0) {
                  fill = '#8DA895';
                }
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-mineral pt-1 border-t border-accent-dark/30">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-forest inline-block" />
            <span>Active Selected Mode</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sage inline-block" />
            <span>Alternative Calculated Mode</span>
          </span>
        </div>
        <span>Click bar to inspect mode</span>
      </div>
    </div>
  );
};
