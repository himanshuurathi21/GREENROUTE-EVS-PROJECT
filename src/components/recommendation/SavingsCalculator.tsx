import React, { useState, useMemo } from 'react';
import { Trees, Repeat, Coins } from 'lucide-react';
import { calculateDynamicSavings } from '../../utils/savings';
import { TREE_ANNUAL_CO2_SEQUESTRATION_KG, TREE_SEQUESTRATION_SOURCE } from '../../data/emissionFactors';
import { formatCurrency } from '../../utils/formatters';

interface SavingsCalculatorProps {
  baselineCo2Kg: number;
  baselineCost: number | null;
  baselineLabel: string;
  chosenCo2Kg: number;
  chosenCost: number | null;
  chosenLabel: string;
  currencySymbol: string;
}

export const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({
  baselineCo2Kg,
  baselineCost,
  baselineLabel,
  chosenCo2Kg,
  chosenCost,
  chosenLabel,
  currencySymbol,
}) => {
  // Commute frequency state
  const [tripsPerWeek, setTripsPerWeek] = useState<number>(10); // Standard 5 days return commute = 10 trips
  const [weeksPerYear, setWeeksPerYear] = useState<number>(48);

  const savings = useMemo(() => {
    return calculateDynamicSavings(
      baselineCo2Kg,
      chosenCo2Kg,
      tripsPerWeek,
      weeksPerYear,
      baselineCost,
      chosenCost,
      currencySymbol
    );
  }, [baselineCo2Kg, chosenCo2Kg, tripsPerWeek, weeksPerYear, baselineCost, chosenCost, currencySymbol]);

  const isLowerEmission = chosenCo2Kg < baselineCo2Kg;

  return (
    <div className="bg-white rounded-lg border border-accent-dark/50 p-5 space-y-5 shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-accent-dark/30 pb-3 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
            <Repeat className="w-4 h-4 text-forest" />
            <span>Dynamic Commute & Environmental Savings</span>
          </h3>
          <p className="text-xs text-mineral mt-0.5">
            Computed strictly from: <code className="bg-canvas px-1 py-0.5 rounded text-[11px]">ΔCO₂ = baseline ({baselineCo2Kg.toFixed(2)}kg) - alternative ({chosenCo2Kg.toFixed(2)}kg)</code>
          </p>
        </div>
        <span className="text-[11px] bg-accent text-forest px-2.5 py-1 rounded font-medium border border-accent-dark/40 self-start sm:self-auto">
          {baselineLabel} &rarr; {chosenLabel}
        </span>
      </div>

      {/* Repeat Commute Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-canvas p-3.5 rounded-md border border-accent-dark/40">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-dark">Trips per Week:</span>
            <span className="font-bold text-forest">{tripsPerWeek} one-way trips</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={tripsPerWeek}
            onChange={(e) => setTripsPerWeek(parseInt(e.target.value, 10))}
            className="w-full accent-forest cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-mineral mt-1">
            <span>1 trip/wk</span>
            <span>5 days return (10)</span>
            <span>20 trips/wk</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-dark">Annual Commute Weeks:</span>
            <span className="font-bold text-forest">{weeksPerYear} weeks/year</span>
          </div>
          <input
            type="range"
            min="10"
            max="52"
            step="1"
            value={weeksPerYear}
            onChange={(e) => setWeeksPerYear(parseInt(e.target.value, 10))}
            className="w-full accent-forest cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-mineral mt-1">
            <span>College semester (24)</span>
            <span>Standard work (48)</span>
            <span>Full year (52)</span>
          </div>
        </div>
      </div>

      {/* Savings Metric Callouts */}
      {isLowerEmission ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Per Trip Savings */}
          <div className="p-3.5 bg-accent/30 rounded-lg border border-accent-dark/40 flex flex-col justify-between">
            <span className="text-xs text-mineral font-medium">Per-Trip CO₂ Avoided</span>
            <div className="mt-2">
              <span className="text-xl font-bold text-forest">
                {savings.perTripCo2SavedKg.toFixed(2)} kg
              </span>
              <span className="text-[11px] text-mineral block mt-0.5">
                Saved each journey
              </span>
            </div>
          </div>

          {/* Annual Total Savings */}
          <div className="p-3.5 bg-accent/40 rounded-lg border border-forest/30 flex flex-col justify-between">
            <span className="text-xs text-mineral font-medium">Annual CO₂ Abated ({savings.totalAnnualTrips} trips)</span>
            <div className="mt-2">
              <span className="text-xl font-bold text-forest-dark">
                {savings.annualCo2SavedKg.toFixed(1)} kg CO₂
              </span>
              <span className="text-[11px] text-mineral block mt-0.5">
                {(savings.annualCo2SavedKg / 1000).toFixed(2)} metric tons avoided
              </span>
            </div>
          </div>

          {/* Forestry Equivalent */}
          <div className="p-3.5 bg-white rounded-lg border border-accent-dark/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-mineral font-medium">Forestry Absorption Equivalent</span>
              <Trees className="w-4 h-4 text-forest" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-dark">
                ~{savings.treesEquivalentAnnual} tree-years
              </span>
              <span className="text-[11px] text-mineral block mt-0.5">
                1 tree absorbs ~{TREE_ANNUAL_CO2_SEQUESTRATION_KG} kg/year
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-canvas rounded text-xs text-mineral border border-accent-dark/40">
          The chosen mode emits comparable or higher carbon than the baseline for this corridor. Switch to an active mode, EV, or two-wheeler to generate positive carbon savings.
        </div>
      )}

      {/* Financial Savings if available */}
      {savings.annualCostSaved !== null && savings.annualCostSaved > 0 && (
        <div className="flex items-center justify-between p-3 bg-canvas rounded-md border border-accent-dark/30 text-xs">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-forest" />
            <span className="font-medium text-slate-dark">Annual Operating Cost Savings:</span>
          </div>
          <span className="font-bold text-forest text-sm">
            {formatCurrency(savings.annualCostSaved, currencySymbol)} / year
          </span>
        </div>
      )}

      <div className="text-[11px] text-mineral pt-1 flex items-center justify-between border-t border-accent-dark/30">
        <span>Scientific formula: <code className="bg-canvas px-1 py-0.5 rounded">Trees = Annual CO₂ Saved / {TREE_ANNUAL_CO2_SEQUESTRATION_KG} kg</code></span>
        <span className="text-right">Source: {TREE_SEQUESTRATION_SOURCE}</span>
      </div>
    </div>
  );
};
