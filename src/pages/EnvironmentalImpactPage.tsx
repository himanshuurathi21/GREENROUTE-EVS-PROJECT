import React, { useState } from 'react';
import { Trees, ShieldCheck, Leaf, BarChart3 } from 'lucide-react';
import { historyService } from '../services/history/historyService';
import { HistoryStats } from '../types/history';
import { EmptyState } from '../components/common/EmptyState';
import {
  AUTHORITATIVE_EMISSION_FACTORS,
  TREE_ANNUAL_CO2_SEQUESTRATION_KG,
  TREE_SEQUESTRATION_SOURCE,
} from '../data/emissionFactors';

interface EnvironmentalImpactPageProps {
  onPlanNewRoute: () => void;
}

export const EnvironmentalImpactPage: React.FC<EnvironmentalImpactPageProps> = ({ onPlanNewRoute }) => {
  const [stats] = useState<HistoryStats>(() => historyService.getAggregatedStats());

  const hasTrips = stats.totalTrips > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-accent-dark/30 pb-5">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-forest bg-accent px-2 py-0.5 rounded border border-accent-dark/40 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real Data First Protocol</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-dark">
          Environmental Impact Analytics Dashboard
        </h1>
        <p className="text-xs text-mineral mt-0.5 max-w-2xl leading-relaxed">
          Aggregated environmental performance metrics computed exclusively from verified journeys saved in your calculation history. No placeholder or simulated statistics are ever displayed.
        </p>
      </div>

      {!hasTrips ? (
        <EmptyState
          title="No Environmental Impact Recorded Yet"
          description="In strict adherence to GreenRoute's scientific policy, we never generate fake savings (such as fabricated '18.6 kg saved' banners). Your environmental impact dashboard will populate dynamically as soon as you record your first real route calculation."
          actionText="Plan Your First Eco-Route"
          onAction={onPlanNewRoute}
          icon={Trees}
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-lg border border-forest/30 shadow-card flex flex-col justify-between">
              <div>
                <span className="text-xs text-mineral font-medium block">Net CO₂ Abated</span>
                <span className="text-3xl font-bold text-forest mt-1.5 block">
                  {stats.totalCo2SavedKg.toFixed(2)} kg
                </span>
              </div>
              <p className="text-[11px] text-mineral mt-3 pt-3 border-t border-accent-dark/30">
                Direct greenhouse gas avoided across {stats.totalTrips} recorded journeys.
              </p>
            </div>

            <div className="p-5 bg-white rounded-lg border border-accent-dark/50 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mineral font-medium">Forestry Absorption Equivalent</span>
                  <Trees className="w-4 h-4 text-forest" />
                </div>
                <span className="text-3xl font-bold text-slate-dark mt-1.5 block">
                  ~{stats.treesAbsorptionEquivalent} tree-years
                </span>
              </div>
              <p className="text-[11px] text-mineral mt-3 pt-3 border-t border-accent-dark/30">
                1 mature tree absorbs ~{TREE_ANNUAL_CO2_SEQUESTRATION_KG} kg CO₂ annually.
              </p>
            </div>

            <div className="p-5 bg-white rounded-lg border border-accent-dark/50 shadow-subtle flex flex-col justify-between">
              <div>
                <span className="text-xs text-mineral font-medium block">Total Real Distance Logged</span>
                <span className="text-3xl font-bold text-slate-dark mt-1.5 block">
                  {stats.totalDistanceKm.toFixed(1)} km
                </span>
              </div>
              <p className="text-[11px] text-mineral mt-3 pt-3 border-t border-accent-dark/30">
                Average trip distance: {(stats.totalDistanceKm / stats.totalTrips).toFixed(1)} km.
              </p>
            </div>

            <div className="p-5 bg-white rounded-lg border border-accent-dark/50 shadow-subtle flex flex-col justify-between">
              <div>
                <span className="text-xs text-mineral font-medium block">Gross Carbon Emitted</span>
                <span className="text-3xl font-bold text-slate-dark mt-1.5 block">
                  {stats.totalCo2EmittedKg.toFixed(2)} kg
                </span>
              </div>
              <p className="text-[11px] text-mineral mt-3 pt-3 border-t border-accent-dark/30">
                Average emissions: {(stats.totalCo2EmittedKg / stats.totalTrips).toFixed(2)} kg / trip.
              </p>
            </div>
          </div>

          {/* Mode Breakdown Matrix */}
          <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
            <div className="border-b border-accent-dark/30 pb-3">
              <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-forest" />
                <span>Modal Distribution & Carbon Allocation</span>
              </h3>
              <p className="text-xs text-mineral mt-0.5">
                Breakdown of authentic journeys logged across travel modes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {(Object.entries(stats.modeBreakdown) as [string, { tripsCount: number; totalDistanceKm: number; totalCo2Kg: number }][]).map(
                ([modeKey, modeStats]) => {
                  if (modeStats.tripsCount === 0) return null;
                  const modeLabel =
                    modeKey === 'car'
                      ? 'Personal Car'
                      : modeKey === 'motorcycle'
                      ? 'Motorcycle'
                      : modeKey === 'cycling'
                      ? 'Cycling'
                      : modeKey === 'walking'
                      ? 'Walking'
                      : modeKey === 'bus'
                      ? 'Public Bus'
                      : modeKey === 'metro_train'
                      ? 'Metro / Train'
                      : modeKey;

                  const percentOfTrips = Math.round((modeStats.tripsCount / stats.totalTrips) * 100);

                  return (
                    <div
                      key={modeKey}
                      className="p-3.5 bg-canvas rounded-lg border border-accent-dark/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-dark">{modeLabel}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent text-forest font-bold">
                          {percentOfTrips}%
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-mineral">
                        <div className="flex justify-between">
                          <span>Trips:</span>
                          <span className="font-medium text-slate-dark">{modeStats.tripsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Distance:</span>
                          <span className="font-medium text-slate-dark">{modeStats.totalDistanceKm.toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Emissions:</span>
                          <span className="font-medium text-slate-dark">{modeStats.totalCo2Kg.toFixed(2)} kg</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Scientific Forestry & Fuel Equivalencies */}
          <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
            <div className="border-b border-accent-dark/30 pb-3">
              <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
                <Leaf className="w-4 h-4 text-forest" />
                <span>Physical Equivalency Conversions</span>
              </h3>
              <p className="text-xs text-mineral mt-0.5">
                Translating CO₂ abatement into tangible ecological and energy units using peer-reviewed constants.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-canvas rounded-lg border border-accent-dark/40 space-y-2">
                <span className="font-semibold text-slate-dark block">
                  Petroleum Fuel Displacement
                </span>
                <p className="text-mineral leading-relaxed">
                  Avoiding <strong>{stats.totalCo2SavedKg.toFixed(2)} kg CO₂</strong> equates to sparing approximately{' '}
                  <strong className="text-forest">
                    {(stats.totalCo2SavedKg / AUTHORITATIVE_EMISSION_FACTORS.petrol_combustion.value).toFixed(1)} liters
                  </strong>{' '}
                  of retail motor petrol from combustion, preventing smog-forming nitrogen oxides and localized particulate matter (PM2.5).
                </p>
                <span className="text-[10px] text-mineral block">
                  Stoichiometric ratio: {AUTHORITATIVE_EMISSION_FACTORS.petrol_combustion.value} kg CO₂e / liter petrol (UK DESNZ 2024).
                </span>
              </div>

              <div className="p-4 bg-canvas rounded-lg border border-accent-dark/40 space-y-2">
                <span className="font-semibold text-slate-dark block">
                  Arboricultural Carbon Sequestration
                </span>
                <p className="text-mineral leading-relaxed">
                  Your carbon abatement represents the equivalent carbon uptake of{' '}
                  <strong className="text-forest">~{stats.treesAbsorptionEquivalent} urban trees</strong> growing for a full calendar year.
                </p>
                <span className="text-[10px] text-mineral block">
                  Source: {TREE_SEQUESTRATION_SOURCE} (~21.77 kg CO₂/tree/year).
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
