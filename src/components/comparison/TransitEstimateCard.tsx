import React from 'react';
import { AlertCircle, ArrowRight, Bus, ExternalLink, Train } from 'lucide-react';
import { calculateTransitCorridorEstimates } from '../../utils/transit';
import { formatEmissions } from '../../utils/formatters';

interface TransitEstimateCardProps {
  corridorDistanceKm: number;
  onOpenMethodology: () => void;
}

export const TransitEstimateCard: React.FC<TransitEstimateCardProps> = ({
  corridorDistanceKm,
  onOpenMethodology,
}) => {
  const estimates = calculateTransitCorridorEstimates(corridorDistanceKm);
  if (estimates.length === 0) return null;

  return (
    <section className="bg-white rounded-lg border border-accent-dark/50 overflow-hidden shadow-subtle">
      <div className="p-4 sm:p-5 border-b border-accent-dark/30 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider">
              Public Transit Corridor Estimate
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[#FAF6EE] text-[#7A5826] border border-[#E8DFC8]">
              Estimated · no GTFS feed
            </span>
          </div>
          <p className="text-xs text-mineral mt-1 max-w-3xl leading-relaxed">
            Bus and metro routes, schedules, and fares are not fabricated. These are carbon-only
            estimates using the real <strong>road corridor</strong> distance
            ({corridorDistanceKm.toFixed(2)} km) and authoritative per-passenger-km factors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5">
        {estimates.map((estimate) => {
          const Icon = estimate.mode === 'bus' ? Bus : Train;

          return (
            <div
              key={estimate.mode}
              className="rounded-lg border border-accent-dark/40 bg-canvas/60 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded bg-white text-forest border border-accent-dark/40">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-dark">{estimate.modeLabel}</h4>
                    <p className="text-[10px] text-mineral">
                      {estimate.co2GramsPerKm} g CO₂ / passenger-km
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-forest shrink-0">
                  {formatEmissions(estimate.co2Kg)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white rounded border border-accent-dark/30 p-2">
                  <span className="text-mineral block">Travel time</span>
                  <span className="font-medium text-slate-dark">Schedule unavailable</span>
                </div>
                <div className="bg-white rounded border border-accent-dark/30 p-2">
                  <span className="text-mineral block">Fare</span>
                  <span className="font-medium text-slate-dark">Fare unavailable</span>
                </div>
              </div>

              <p className="text-[11px] text-mineral leading-snug flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{estimate.disclaimer}</span>
              </p>

              <a
                href={estimate.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-forest hover:underline inline-flex items-center space-x-1"
              >
                <span>Factor: {estimate.factorValue} {estimate.factorUnit}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          );
        })}
      </div>

      <div className="px-4 sm:px-5 py-3 bg-canvas/70 border-t border-accent-dark/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-mineral">
        <span>
          CO₂ = corridor distance × passenger-km factor. Time and fare are intentionally left blank
          rather than invented.
        </span>
        <button
          type="button"
          onClick={onOpenMethodology}
          className="text-forest hover:text-forest-dark font-semibold inline-flex items-center space-x-1 shrink-0"
        >
          <span>Methodology & sources</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  );
};
