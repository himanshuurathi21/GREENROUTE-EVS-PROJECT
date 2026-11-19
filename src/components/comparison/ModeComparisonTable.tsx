import React from 'react';
import { Car, Bike, Footprints, ShieldCheck, ArrowRight, Bus, Train } from 'lucide-react';
import { ModeCostResult } from '../../types/cost';
import { ModeEmissionResult } from '../../types/emissions';
import { RecommendationScore } from '../../types/recommendation';
import { RouteResult, TravelMode } from '../../types/routing';
import { formatDistance, formatDuration, formatEmissions } from '../../utils/formatters';
import { Badge } from '../common/Badge';

interface ModeComparisonTableProps {
  routes: Partial<Record<TravelMode, RouteResult>>;
  emissions: Record<TravelMode, ModeEmissionResult>;
  costs: Record<TravelMode, ModeCostResult>;
  scores: Record<TravelMode, RecommendationScore>;
  selectedMode: TravelMode;
  onSelectMode: (mode: TravelMode) => void;
  onViewDetailedResults?: () => void;
}

export const ModeComparisonTable: React.FC<ModeComparisonTableProps> = ({
  routes,
  emissions,
  costs,
  scores,
  selectedMode,
  onSelectMode,
  onViewDetailedResults,
}) => {
  const modes = Object.keys(routes) as TravelMode[];
  if (modes.length === 0) return null;

  const getModeIcon = (mode: TravelMode) => {
    switch (mode) {
      case 'car': return <Car className="w-4 h-4" />;
      case 'motorcycle': return <Bike className="w-4 h-4" />;
      case 'cycling': return <Bike className="w-4 h-4 text-forest" />;
      case 'walking': return <Footprints className="w-4 h-4 text-forest" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      case 'metro_train': return <Train className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-accent-dark/50 overflow-hidden shadow-subtle space-y-0">
      <div className="p-4 sm:p-5 border-b border-accent-dark/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
            <span>Verified Multi-Modal Route Comparison</span>
            <span className="text-[10px] normal-case bg-accent text-forest px-2 py-0.5 rounded font-semibold border border-accent-dark/40">
              {modes.length} Real Modes Calculated
            </span>
          </h3>
          <p className="text-xs text-mineral mt-0.5">
            Every metric derived from live mode-specific OSM routing and authoritative greenhouse gas factors.
          </p>
        </div>

        {onViewDetailedResults && (
          <button
            onClick={onViewDetailedResults}
            className="inline-flex items-center space-x-1.5 text-xs text-forest hover:text-forest-hover font-semibold cursor-pointer"
          >
            <span>Detailed Results & Charts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-canvas border-b border-accent-dark/40 text-mineral font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Transport Mode</th>
              <th className="py-3 px-3">Real Distance</th>
              <th className="py-3 px-3">Travel Time</th>
              <th className="py-3 px-3">Direct CO₂ Impact</th>
              <th className="py-3 px-3">Operating Cost</th>
              <th className="py-3 px-3">Practicality Score</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent-dark/20 text-slate-dark">
            {modes.map((mode) => {
              const route = routes[mode]!;
              const emission = emissions[mode];
              const cost = costs[mode];
              const score = scores[mode];
              const isSelected = selectedMode === mode;
              const isRecommended = score?.isRecommended;

              return (
                <tr
                  key={mode}
                  className={`transition-colors ${
                    isSelected ? 'bg-accent/30 font-medium' : 'hover:bg-canvas/60'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded ${isSelected ? 'bg-forest text-white' : 'bg-canvas text-forest'}`}>
                        {getModeIcon(mode)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-dark">{route.modeLabel}</span>
                          {isRecommended && (
                            <Badge variant="forest" size="sm">Recommended</Badge>
                          )}
                        </div>
                        {score && (
                          <p className="text-[11px] text-mineral mt-0.5">{score.tagline}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 font-medium">
                    {formatDistance(route.distanceMeters)}
                  </td>

                  <td className="py-3.5 px-3 font-medium">
                    {formatDuration(route.durationSeconds)}
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${emission.totalCo2Kg === 0 ? 'text-forest' : 'text-slate-dark'}`}>
                        {formatEmissions(emission.totalCo2Kg)}
                      </span>
                      <span className="text-[10px] text-mineral">
                        {emission.co2GramsPerKm} g/km
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-dark">{cost.formattedCost}</span>
                      {cost.isAvailable && cost.cost !== 0 && (
                        <span className="text-[10px] text-mineral">{cost.unitPriceUsed}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-accent rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (score?.practicalityScore || 0) >= 80
                              ? 'bg-forest'
                              : (score?.practicalityScore || 0) >= 50
                              ? 'bg-sage'
                              : 'bg-[#C28236]'
                          }`}
                          style={{ width: `${score?.practicalityScore || 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-mineral font-medium">
                        {score?.practicalityScore || 0}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectMode(mode)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-forest text-white shadow-subtle'
                          : 'bg-white border border-accent-dark/60 text-slate-dark hover:bg-canvas'
                      }`}
                    >
                      {isSelected ? 'Active Route' : 'Inspect Mode'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-canvas/70 border-t border-accent-dark/30 text-[11px] text-mineral flex items-center justify-between">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" />
          <span>OSM FOSSGIS Routing &bull; UK DESNZ 2024 &bull; CEA v19</span>
        </span>
        <span>Click &ldquo;Inspect Mode&rdquo; to view on map</span>
      </div>
    </div>
  );
};
