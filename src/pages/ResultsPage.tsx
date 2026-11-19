import React from 'react';
import {
  Compass,
  ArrowLeft,
  Navigation,
  Fuel,
  ExternalLink,
} from 'lucide-react';
import { EmissionsBarChart } from '../components/charts/EmissionsBarChart';
import { TransitEstimateCard } from '../components/comparison/TransitEstimateCard';
import { MultiModalRoutes, TravelMode } from '../types/routing';
import { VehicleConfig } from '../types/vehicle';
import { RegionalPricingConfig } from '../types/cost';
import { RegionalGridIntensity } from '../types/emissions';
import { calculateModeEmissions } from '../utils/emissions';
import { calculateModeCost } from '../utils/cost';
import { generatePracticalRecommendations } from '../utils/recommendation';
import { formatDistance, formatDuration, formatEmissions } from '../utils/formatters';
import { getVehicleBasisLabel, getVehicleConfigForMode } from '../utils/vehicle';

interface ResultsPageProps {
  multiModalData: MultiModalRoutes | null;
  selectedMode: TravelMode;
  onSelectMode: (mode: TravelMode) => void;
  vehicleConfig: VehicleConfig;
  pricingConfig: RegionalPricingConfig;
  gridIntensity: RegionalGridIntensity;
  onBackToPlanner: () => void;
  onOpenMethodology: () => void;
}

interface NoRouteStateProps {
  onBackToPlanner: () => void;
}

const NoRouteState: React.FC<NoRouteStateProps> = ({ onBackToPlanner }) => (
  <div className="text-center py-20 bg-white rounded-lg border border-accent-dark/40 max-w-xl mx-auto my-12 p-8">
    <Compass className="w-10 h-10 text-mineral mx-auto mb-3" />
    <h3 className="text-base font-semibold text-slate-dark">No Active Route Calculation</h3>
    <p className="text-xs text-mineral mt-1 mb-4">
      Please enter an origin and destination on the planner page to compute verifiable real-world routing.
    </p>
    <button
      onClick={onBackToPlanner}
      className="px-4 py-2 bg-forest text-white text-xs font-medium rounded hover:bg-forest-hover transition-colors"
    >
      Go to Route Planner
    </button>
  </div>
);

/**
 * Outer gate keeps the hook order stable: the previous implementation returned
 * early before calling useMemo, which violates the Rules of Hooks whenever the
 * route data changes from null to a calculated result.
 */
export const ResultsPage: React.FC<ResultsPageProps> = (props) => {
  const { multiModalData, onBackToPlanner } = props;

  if (!multiModalData) {
    return <NoRouteState onBackToPlanner={onBackToPlanner} />;
  }

  if (Object.keys(multiModalData.routes).length === 0) {
    return <NoRouteState onBackToPlanner={onBackToPlanner} />;
  }

  return (
    <ResultsContent
      {...props}
      multiModalData={multiModalData}
    />
  );
};

interface ResultsContentProps extends ResultsPageProps {
  multiModalData: MultiModalRoutes;
}

const ResultsContent: React.FC<ResultsContentProps> = ({
  multiModalData,
  selectedMode,
  onSelectMode,
  vehicleConfig,
  pricingConfig,
  gridIntensity,
  onBackToPlanner,
  onOpenMethodology,
}) => {
  const modes = React.useMemo(
    () => Object.keys(multiModalData.routes) as TravelMode[],
    [multiModalData]
  );
  const resolvedMode = multiModalData.routes[selectedMode] ? selectedMode : modes[0];
  const activeRoute = multiModalData.routes[resolvedMode]!;

  const evaluatedModes = React.useMemo(() => {
    const emissionsMap: Record<string, ReturnType<typeof calculateModeEmissions>> = {};
    const costsMap: Record<string, ReturnType<typeof calculateModeCost>> = {};
    const evaluationInputs: Record<string, any> = {};

    for (const mode of modes) {
      const route = multiModalData.routes[mode]!;
      const emission = calculateModeEmissions(mode, route.distanceKm, vehicleConfig, gridIntensity);
      const cost = calculateModeCost(mode, route.distanceKm, vehicleConfig, pricingConfig);
      emissionsMap[mode] = emission;
      costsMap[mode] = cost;
      evaluationInputs[mode] = { route, emission, cost };
    }

    const recommendation = generatePracticalRecommendations(evaluationInputs, 'car');

    return {
      emissions: emissionsMap as Record<TravelMode, ReturnType<typeof calculateModeEmissions>>,
      costs: costsMap as Record<TravelMode, ReturnType<typeof calculateModeCost>>,
      recommendation,
    };
  }, [multiModalData, vehicleConfig, gridIntensity, pricingConfig, modes]);

  const activeEmission = evaluatedModes.emissions[resolvedMode];
  const activeCost = evaluatedModes.costs[resolvedMode];
  const effectiveVehicle = getVehicleConfigForMode(resolvedMode, vehicleConfig);
  const vehicleBasis = getVehicleBasisLabel(resolvedMode, vehicleConfig);
  const isMotorized = resolvedMode === 'car' || resolvedMode === 'motorcycle';
  const isTransit = resolvedMode === 'bus' || resolvedMode === 'metro_train';

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-accent-dark/30 pb-5">
        <button
          onClick={onBackToPlanner}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-mineral hover:text-forest transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Planner & Map</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-forest uppercase tracking-wider bg-accent px-2 py-0.5 rounded border border-accent-dark/40">
              Verified Multi-Modal Route Analysis
            </span>
            <h1 className="text-2xl font-bold text-slate-dark mt-1">
              {multiModalData.origin.shortName} &rarr; {multiModalData.destination.shortName}
            </h1>
            <p className="text-xs text-mineral mt-0.5">
              Calculated at {new Date(multiModalData.calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Live OSM FOSSGIS network
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMethodology}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-accent-dark/60 rounded text-xs text-mineral-dark hover:text-forest hover:bg-canvas transition-colors"
            >
              <span>Methodology & Audit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {resolvedMode !== selectedMode && (
        <div className="p-3 rounded-md bg-[#FAF4ED] text-xs text-[#8A5126] border border-[#E8D4C1]">
          The previously selected mode is not available for this corridor. Showing{' '}
          <strong>{activeRoute.modeLabel}</strong> instead.
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-accent-dark/30">
        {modes.map((mode) => {
          const route = multiModalData.routes[mode]!;
          const isSelected = resolvedMode === mode;
          const isRecommended = evaluatedModes.recommendation.primaryRecommendation === mode;

          return (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-md transition-colors flex items-center space-x-2 shrink-0 border-b-2 ${
                isSelected
                  ? 'border-forest text-forest bg-white shadow-subtle'
                  : 'border-transparent text-mineral hover:text-slate-dark hover:bg-canvas/50'
              }`}
            >
              <span>{route.modeLabel}</span>
              {isRecommended && (
                <span className="text-[10px] bg-forest text-white px-1.5 py-0.2 rounded font-bold">
                  Rec
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
          <span className="text-xs text-mineral font-medium block">Route Distance</span>
          <span className="text-2xl font-bold text-slate-dark mt-1 block">
            {formatDistance(activeRoute.distanceMeters)}
          </span>
          <span className="text-[11px] text-mineral mt-0.5 block">
            Real OSM corridor
          </span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
          <span className="text-xs text-mineral font-medium block">Estimated Travel Time</span>
          <span className="text-2xl font-bold text-slate-dark mt-1 block">
            {formatDuration(activeRoute.durationSeconds)}
          </span>
          <span className="text-[11px] text-mineral mt-0.5 block">
            Mode-specific routing graph
          </span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
          <span className="text-xs text-mineral font-medium block">Direct Carbon Emissions</span>
          <span className="text-2xl font-bold text-forest mt-1 block">
            {formatEmissions(activeEmission.totalCo2Kg)}
          </span>
          <span className="text-[11px] text-mineral mt-0.5 block">
            Intensity: {activeEmission.co2GramsPerKm} g CO₂/km
          </span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
          <span className="text-xs text-mineral font-medium block">Operating Energy Cost</span>
          <span className="text-2xl font-bold text-slate-dark mt-1 block">
            {activeCost.formattedCost}
          </span>
          <span className="text-[11px] text-mineral mt-0.5 block truncate">
            {activeCost.costBreakdown}
          </span>
        </div>
      </div>

      {/* Comparative Emissions Bar Chart */}
      <EmissionsBarChart
        emissions={evaluatedModes.emissions}
        availableModes={modes}
        selectedMode={resolvedMode}
        onSelectMode={onSelectMode}
      />

      {/* Corridor estimate for modes without GTFS data */}
      <TransitEstimateCard
        corridorDistanceKm={multiModalData.routes.car?.distanceKm ?? activeRoute.distanceKm}
        onOpenMethodology={onOpenMethodology}
      />

      {/* Environmental Data & Stoichiometry Breakdown */}
      <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
        <div className="border-b border-accent-dark/30 pb-3">
          <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
            <Fuel className="w-4 h-4 text-forest" />
            <span>Environmental & Stoichiometric Audit ({activeRoute.modeLabel})</span>
          </h3>
          <p className="text-xs text-mineral mt-0.5">
            Full mathematical audit of fuel consumption, grid emissions factor, and authoritative citations.
          </p>
        </div>

        {isMotorized && (
          <p className="text-[11px] text-mineral bg-canvas border border-accent-dark/30 rounded px-3 py-2">
            <span className="font-semibold text-slate-dark">Vehicle basis: </span>
            {vehicleBasis}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-3 bg-canvas p-4 rounded-md border border-accent-dark/40">
            <h4 className="font-semibold text-slate-dark text-xs uppercase tracking-wider">
              Mathematical Equation Applied
            </h4>
            {isMotorized ? (
              effectiveVehicle.fuelType === 'electric' ? (
                <div className="space-y-1.5 font-mono text-[11px] bg-white p-3 rounded border border-accent-dark/30">
                  <p>Energy Consumed = Distance ({activeRoute.distanceKm} km) × Consumption Rate ({effectiveVehicle.efficiencyValue} kWh/km)</p>
                  <p className="font-bold text-forest">= {(activeRoute.distanceKm * effectiveVehicle.efficiencyValue).toFixed(2)} kWh</p>
                  <p className="mt-2 text-mineral">Scope 2 CO₂ = Energy Consumed × Regional Grid Intensity ({gridIntensity.factorKgPerKwh} kg/kWh)</p>
                  <p className="font-bold text-forest">= {activeEmission.totalCo2Kg.toFixed(2)} kg CO₂</p>
                </div>
              ) : (
                <div className="space-y-1.5 font-mono text-[11px] bg-white p-3 rounded border border-accent-dark/30">
                  <p>Fuel Consumed = Distance ({activeRoute.distanceKm} km) ÷ Mileage ({effectiveVehicle.efficiencyValue} km/L)</p>
                  <p className="font-bold text-forest">= {(activeRoute.distanceKm / effectiveVehicle.efficiencyValue).toFixed(2)} Liters</p>
                  <p className="mt-2 text-mineral">Scope 1 Tailpipe CO₂ = Fuel Consumed × Factor ({activeEmission.factorUsed.value} kg/L)</p>
                  <p className="font-bold text-forest">= {activeEmission.totalCo2Kg.toFixed(2)} kg CO₂</p>
                </div>
              )
            ) : isTransit ? (
              <div className="space-y-1.5 font-mono text-[11px] bg-white p-3 rounded border border-accent-dark/30">
                <p>Passenger CO₂ = Distance ({activeRoute.distanceKm} km) × Passenger-km Factor</p>
                <p className="font-bold text-forest">= {activeEmission.totalCo2Kg.toFixed(2)} kg CO₂</p>
                <p className="mt-2 text-mineral">Based on average occupancy; not a real-time vehicle load measurement.</p>
              </div>
            ) : (
              <div className="font-mono text-[11px] bg-white p-3 rounded border border-accent-dark/30">
                <p>Human Metabolic / Active Travel = 0.00 kg Direct Tailpipe CO₂</p>
                <p className="text-mineral mt-1">Zero fossil fuel consumed during journey execution.</p>
              </div>
            )}
          </div>

          <div className="space-y-3 bg-canvas p-4 rounded-md border border-accent-dark/40">
            <h4 className="font-semibold text-slate-dark text-xs uppercase tracking-wider">
              Authoritative Factor Citation
            </h4>
            <div className="space-y-1.5 text-xs text-mineral-dark">
              <p><span className="text-mineral font-medium">Factor Name:</span> {activeEmission.factorUsed.name}</p>
              <p><span className="text-mineral font-medium">Coefficient:</span> {activeEmission.factorUsed.value} {activeEmission.factorUsed.unit}</p>
              <p><span className="text-mineral font-medium">Source:</span> {activeEmission.factorUsed.source}</p>
              {activeEmission.factorUsed.sourceUrl && (
                <a
                  href={activeEmission.factorUsed.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest hover:underline inline-flex items-center space-x-1 mt-1 font-medium"
                >
                  <span>Verify Primary Publication Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Waypoint Guidance */}
      {activeRoute.steps && activeRoute.steps.length > 0 && (
        <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-accent-dark/30 pb-3">
            <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-forest" />
              <span>Turn-by-Turn Route Navigation (OSRM Live Steps)</span>
            </h3>
            <span className="text-xs text-mineral">
              Showing {activeRoute.steps.length} principal maneuvers
            </span>
          </div>

          <div className="divide-y divide-accent-dark/20 max-h-72 overflow-y-auto pr-2">
            {activeRoute.steps.map((step, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                <div className="flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-accent text-forest-dark flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-dark capitalize">{step.instruction}</p>
                    <p className="text-[11px] text-mineral">{step.name}</p>
                  </div>
                </div>
                <div className="text-right text-mineral shrink-0 pl-4">
                  <span className="font-medium text-slate-dark">{formatDistance(step.distanceMeters)}</span>
                  <span className="text-[10px] block">{formatDuration(step.durationSeconds)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
