import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  ArrowRightLeft,
  Loader2,
  BookmarkCheck,
  Sliders,
  Fuel,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Leaf,
  Car,
  Bike,
  Bus,
  Footprints,
} from 'lucide-react';
import { LocationInput } from '../components/route-planner/LocationInput';
import { VehicleSelector } from '../components/route-planner/VehicleSelector';
import { FuelTariffConfig } from '../components/route-planner/FuelTariffConfig';
import { RouteMap } from '../components/map/RouteMap';
import { ModeComparisonTable } from '../components/comparison/ModeComparisonTable';
import { UnsupportedModesNotice } from '../components/comparison/UnsupportedModesNotice';
import { TransitEstimateCard } from '../components/comparison/TransitEstimateCard';
import { RecommendationCard } from '../components/recommendation/RecommendationCard';
import { SavingsCalculator } from '../components/recommendation/SavingsCalculator';
import { LocationResult, MultiModalRoutes, TravelMode } from '../types/routing';
import { VehicleConfig } from '../types/vehicle';
import { RegionalPricingConfig } from '../types/cost';
import { RegionalGridIntensity } from '../types/emissions';
import { routingService } from '../services/routing';
import { calculateModeEmissions } from '../utils/emissions';
import { calculateModeCost } from '../utils/cost';
import { generatePracticalRecommendations } from '../utils/recommendation';
import { historyService } from '../services/history/historyService';
import { SavedTrip } from '../types/history';
import { formatDistance, formatDuration, formatEmissions } from '../utils/formatters';
import { getVehicleConfigForMode } from '../utils/vehicle';

interface HomePageProps {
  onTripSaved: () => void;
  onNavigateToResults: () => void;
  onNavigateToMethodology: () => void;
  multiModalData: MultiModalRoutes | null;
  setMultiModalData: React.Dispatch<React.SetStateAction<MultiModalRoutes | null>>;
  selectedMode: TravelMode;
  setSelectedMode: (mode: TravelMode) => void;
  vehicleConfig: VehicleConfig;
  setVehicleConfig: React.Dispatch<React.SetStateAction<VehicleConfig>>;
  pricingConfig: RegionalPricingConfig;
  setPricingConfig: React.Dispatch<React.SetStateAction<RegionalPricingConfig>>;
  gridIntensity: RegionalGridIntensity;
  setGridIntensity: React.Dispatch<React.SetStateAction<RegionalGridIntensity>>;
}

export const HomePage: React.FC<HomePageProps> = ({
  onTripSaved,
  onNavigateToResults,
  onNavigateToMethodology,
  multiModalData,
  setMultiModalData,
  selectedMode,
  setSelectedMode,
  vehicleConfig,
  setVehicleConfig,
  pricingConfig,
  setPricingConfig,
  gridIntensity,
  setGridIntensity,
}) => {
  const [origin, setOrigin] = useState<LocationResult | null>(multiModalData?.origin || null);
  const [destination, setDestination] = useState<LocationResult | null>(multiModalData?.destination || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVehicleDrawer, setShowVehicleDrawer] = useState(false);
  const [showPricingDrawer, setShowPricingDrawer] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const calculationRequestIdRef = useRef(0);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ignore late responses after unmount so a tab switch cannot update state.
  useEffect(() => {
    return () => {
      calculationRequestIdRef.current += 1;
      if (saveToastTimerRef.current) {
        clearTimeout(saveToastTimerRef.current);
      }
    };
  }, []);

  // A location edit makes any in-flight calculation obsolete. Stopping the
  // loading state also lets the user start a fresh calculation immediately.
  const invalidateInFlightCalculation = () => {
    calculationRequestIdRef.current += 1;
    setIsLoading(false);
  };

  const handleOriginChange = (location: LocationResult | null) => {
    invalidateInFlightCalculation();
    setOrigin(location);
  };

  const handleDestinationChange = (location: LocationResult | null) => {
    invalidateInFlightCalculation();
    setDestination(location);
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    invalidateInFlightCalculation();
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Run Real Route Calculation
  const handleCalculateRoute = async () => {
    if (!origin || !destination) {
      setErrorMessage('Please select both a valid origin and destination from the geocoder dropdown.');
      return;
    }

    if (
      origin.coordinates.lat === destination.coordinates.lat &&
      origin.coordinates.lon === destination.coordinates.lon
    ) {
      setErrorMessage('Origin and Destination are identical. Please specify two different geographic points.');
      return;
    }

    const requestId = ++calculationRequestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const results = await routingService.calculateAllModes(origin, destination);
      if (requestId !== calculationRequestIdRef.current) return;

      const availableModes = Object.keys(results.routes) as TravelMode[];

      if (availableModes.length === 0) {
        setMultiModalData(null);
        const unsupportedSummary = results.unsupportedModes.length > 0
          ? ` ${results.unsupportedModes.map((item) => item.modeLabel).join(', ')} could not be routed.`
          : '';
        setErrorMessage(`No verified route could be calculated between these locations.${unsupportedSummary} Please try an origin and destination connected by a public road or path.`);
        return;
      }

      setMultiModalData(results);
      setSelectedMode(results.routes.car ? 'car' : availableModes[0]);
    } catch (err: unknown) {
      if (requestId !== calculationRequestIdRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to obtain live routing from OSRM.';
      setErrorMessage(msg);
    } finally {
      if (requestId === calculationRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Compute live emissions, costs, and recommendation if routes exist. If the
  // previous selection is not available for the new corridor, fall back to the
  // first calculated mode instead of hiding the entire results section.
  const resolvedMode: TravelMode =
    multiModalData?.routes[selectedMode]
      ? selectedMode
      : ((Object.keys(multiModalData?.routes ?? {})[0] as TravelMode | undefined) ?? selectedMode);
  const activeRoute = multiModalData?.routes[resolvedMode] || null;

  const evaluatedModes = React.useMemo(() => {
    if (!multiModalData) return null;

    const modes = Object.keys(multiModalData.routes) as TravelMode[];
    const emissionsMap: Record<string, ReturnType<typeof calculateModeEmissions>> = {};
    const costsMap: Record<string, ReturnType<typeof calculateModeCost>> = {};
    const evaluationInputs: Record<string, any> = {};

    for (const m of modes) {
      const r = multiModalData.routes[m]!;
      const em = calculateModeEmissions(m, r.distanceKm, vehicleConfig, gridIntensity);
      const cost = calculateModeCost(m, r.distanceKm, vehicleConfig, pricingConfig);
      emissionsMap[m] = em;
      costsMap[m] = cost;
      evaluationInputs[m] = { route: r, emission: em, cost };
    }

    const rec = generatePracticalRecommendations(evaluationInputs, 'car');

    return {
      emissions: emissionsMap as Record<TravelMode, ReturnType<typeof calculateModeEmissions>>,
      costs: costsMap as Record<TravelMode, ReturnType<typeof calculateModeCost>>,
      recommendation: rec,
    };
  }, [multiModalData, vehicleConfig, gridIntensity, pricingConfig]);

  // Handle Save Trip to Authentic History
  const handleSaveTrip = () => {
    if (!multiModalData || !activeRoute || !evaluatedModes) return;

    const currentEmission = evaluatedModes.emissions[resolvedMode];
    // The baseline for "CO2 saved" is the car. When the corridor has no car
    // route, record the chosen mode itself as the baseline so the saved value
    // honestly stays at zero instead of comparing against an unavailable mode.
    const baselineMode: TravelMode = evaluatedModes.emissions.car ? 'car' : resolvedMode;
    const baselineEmission = evaluatedModes.emissions[baselineMode];
    const currentCost = evaluatedModes.costs[resolvedMode];
    const effectiveVehicle = getVehicleConfigForMode(resolvedMode, vehicleConfig);
    const isVehicleMode = resolvedMode === 'car' || resolvedMode === 'motorcycle';
    const isElectricVehicle = isVehicleMode && effectiveVehicle.fuelType === 'electric';

    const co2SavedKg =
      baselineMode === resolvedMode
        ? 0
        : Math.max(0, Number((baselineEmission.totalCo2Kg - currentEmission.totalCo2Kg).toFixed(3)));

    const newTrip: SavedTrip = {
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      origin: multiModalData.origin,
      destination: multiModalData.destination,
      selectedMode: resolvedMode,
      selectedModeLabel: activeRoute.modeLabel,
      vehicleConfig: isVehicleMode ? effectiveVehicle : undefined,
      distanceKm: activeRoute.distanceKm,
      durationMinutes: activeRoute.durationMinutes,
      cost: currentCost.cost,
      currencySymbol: pricingConfig.currencySymbol,
      co2Kg: currentEmission.totalCo2Kg,
      baselineMode,
      baselineCo2Kg: baselineEmission.totalCo2Kg,
      co2SavedKg,
      methodologySummary: `OSRM FOSSGIS Live Routing (${activeRoute.distanceKm} km) | ${currentEmission.factorUsed.name}`,
      gridFactorUsed: isElectricVehicle ? gridIntensity.factorKgPerKwh : undefined,
      fuelEfficiencyUsed: isVehicleMode ? effectiveVehicle.efficiencyValue : undefined,
    };

    try {
      historyService.saveTrip(newTrip);
    } catch {
      setErrorMessage('Your browser could not save this trip (storage may be full or blocked). The calculation remains available on screen.');
      return;
    }
    onTripSaved();
    setSaveSuccessMessage('Trip verified and saved to your authentic calculation history!');
    if (saveToastTimerRef.current) {
      clearTimeout(saveToastTimerRef.current);
    }
    saveToastTimerRef.current = setTimeout(() => setSaveSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Hero Banner */}
      <div className="border-b border-accent-dark/30 pb-6 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-forest bg-accent px-2.5 py-1 rounded border border-accent-dark/50 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real Data Pipeline: OpenStreetMap Nominatim & FOSSGIS OSRM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-dark">
              Plan Your Eco-Friendly Route
            </h1>
            <p className="text-sm text-mineral mt-1 max-w-2xl leading-relaxed">
              Analyze verifiable real-world travel corridors. Compare tailpipe and grid greenhouse gas emissions across motorized, active, and electric travel modes with certified emission factors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVehicleDrawer(!showVehicleDrawer)}
              className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
                showVehicleDrawer
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-mineral-dark border-accent-dark/60 hover:bg-canvas'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Vehicle: {vehicleConfig.categoryLabel} ({vehicleConfig.efficiencyValue} {vehicleConfig.efficiencyUnit})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPricingDrawer(!showPricingDrawer)}
              className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
                showPricingDrawer
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-mineral-dark border-accent-dark/60 hover:bg-canvas'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tariffs ({pricingConfig.currencySymbol})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Vehicle Configuration Panel */}
      {showVehicleDrawer && (
        <div className="animate-in fade-in duration-200">
          <VehicleSelector config={vehicleConfig} onChange={setVehicleConfig} />
        </div>
      )}

      {/* Expandable Regional Tariff & Grid Panel */}
      {showPricingDrawer && (
        <div className="animate-in fade-in duration-200">
          <FuelTariffConfig
            pricing={pricingConfig}
            onPricingChange={setPricingConfig}
            gridIntensity={gridIntensity}
            onGridChange={setGridIntensity}
          />
        </div>
      )}

      {/* Route Query Formulation Card */}
      <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-3">
          <LocationInput
            label="Origin (Departure Point)"
            placeholder="Search verified location (e.g. Connaught Place, New Delhi)"
            value={origin}
            onChange={handleOriginChange}
            iconColor="text-forest"
          />

          <div className="flex justify-center pt-5">
            <button
              type="button"
              onClick={handleSwapLocations}
              className="p-2 rounded-full border border-accent-dark/60 text-mineral hover:text-forest hover:bg-accent transition-colors"
              title="Swap Origin and Destination"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <LocationInput
            label="Destination (Arrival Point)"
            placeholder="Search verified location (e.g. Cyber City, Gurugram)"
            value={destination}
            onChange={handleDestinationChange}
            iconColor="text-slate-dark"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-md bg-[#FAF4ED] text-xs text-[#8A5126] border border-[#E8D4C1] flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-accent-dark/30">
          <div className="flex items-center space-x-2 text-xs text-mineral">
            <span>Grid Emission Factor:</span>
            <span className="font-semibold text-slate-dark">
              {gridIntensity.factorKgPerKwh.toFixed(3)} kg CO₂/kWh ({gridIntensity.regionName.split(' ')[0]})
            </span>
          </div>

          <button
            type="button"
            onClick={handleCalculateRoute}
            disabled={isLoading || !origin || !destination}
            className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-forest hover:bg-forest-hover disabled:bg-mineral-light text-white text-xs font-semibold rounded shadow-subtle transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Querying Real OSRM Engine...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Calculate Verified Routes & Impact</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveSuccessMessage && (
        <div className="p-3 bg-accent border border-forest/30 rounded-lg text-xs font-medium text-forest-dark flex items-center justify-between shadow-subtle">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-forest" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-mineral hover:text-slate-dark font-bold text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Empty-state explainer: keeps the first screen informative before a route exists */}
      {!multiModalData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 bg-white rounded-lg border border-accent-dark/50 p-5 sm:p-6 shadow-subtle">
            <div className="flex items-start justify-between gap-4 border-b border-accent-dark/30 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-dark uppercase tracking-wider">
                  One corridor, every practical mode
                </h2>
                <p className="text-xs text-mineral mt-1 max-w-2xl leading-relaxed">
                  Select two verified places above. GreenRoute fetches real geometry for every
                  mode it can route, then applies audited emissions and cost factors to the same
                  origin–destination pair.
                </p>
              </div>
              <Leaf className="w-8 h-8 text-forest/30 shrink-0" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { icon: Car, label: 'Car', detail: 'Petrol, diesel, hybrid or EV' },
                { icon: Bike, label: 'Two-wheeler', detail: 'Motorcycle or scooter' },
                { icon: Bus, label: 'Bus & metro', detail: 'Corridor CO₂ estimate only' },
                { icon: Footprints, label: 'Walk & cycle', detail: 'Dedicated path routing' },
              ].map(({ icon: Icon, label, detail }) => (
                <div
                  key={label}
                  className="rounded-md border border-accent-dark/40 bg-canvas/60 p-3"
                >
                  <div className="p-1.5 rounded bg-white text-forest border border-accent-dark/40 w-fit">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-dark mt-2">{label}</p>
                  <p className="text-[11px] text-mineral mt-0.5 leading-snug">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-accent-dark/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                ['1', 'Search a real place', 'Nominatim autocomplete returns verifiable coordinates, not free text.'],
                ['2', 'Route each mode', 'Each mode uses its own OSM car, bicycle, or foot graph.'],
                ['3', 'Compare and save', 'Review distance, time, CO₂, cost, and your recommendation.'],
              ].map(([step, title, detail]) => (
                <div key={step} className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-accent text-forest-dark flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-dark">{title}</p>
                    <p className="text-[11px] text-mineral mt-0.5 leading-snug">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="bg-forest text-white rounded-lg p-5 sm:p-6 flex flex-col justify-between shadow-subtle">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold bg-white/10 border border-white/20 px-2 py-0.5 rounded">
                Verified by design
              </span>
              <h3 className="text-lg font-bold mt-3 leading-snug">
                No invented routes. No fake fares.
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>Each mode uses a dedicated OpenStreetMap routing graph.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>EV emissions use your selected regional grid intensity.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>Bus and metro schedules stay blank until a GTFS feed is connected.</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onNavigateToMethodology}
              className="mt-6 inline-flex items-center space-x-1.5 text-xs font-semibold text-accent hover:text-white transition-colors w-fit"
            >
              <span>Read the methodology</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </aside>
        </div>
      )}

      {/* Results Section (Appears when route calculation is active) */}
      {multiModalData && activeRoute && evaluatedModes && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {resolvedMode !== selectedMode && (
            <div className="p-3 rounded-md bg-[#FAF4ED] text-xs text-[#8A5126] border border-[#E8D4C1]">
              The previously selected mode is not available for this corridor. Showing{' '}
              <strong>{activeRoute.modeLabel}</strong> instead.
            </div>
          )}

          {/* Active Mode Quick Summary Ribbon */}
          <div className="bg-white rounded-lg border border-accent-dark/50 p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded bg-accent text-forest">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-mineral uppercase font-semibold tracking-wider">
                  Inspecting Mode
                </span>
                <h3 className="text-base font-bold text-slate-dark">
                  {activeRoute.modeLabel}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
              <div>
                <span className="text-mineral block text-[11px]">Real Distance</span>
                <span className="font-bold text-slate-dark text-sm">
                  {formatDistance(activeRoute.distanceMeters)}
                </span>
              </div>

              <div>
                <span className="text-mineral block text-[11px]">Travel Time</span>
                <span className="font-bold text-slate-dark text-sm">
                  {formatDuration(activeRoute.durationSeconds)}
                </span>
              </div>

              <div>
                <span className="text-mineral block text-[11px]">Carbon Footprint</span>
                <span className="font-bold text-forest text-sm">
                  {formatEmissions(evaluatedModes.emissions[resolvedMode].totalCo2Kg)}
                </span>
              </div>

              <div>
                <span className="text-mineral block text-[11px]">Operating Cost</span>
                <span className="font-bold text-slate-dark text-sm">
                  {evaluatedModes.costs[resolvedMode].formattedCost}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveTrip}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-forest-dark border border-accent-dark/60 rounded text-xs font-semibold transition-colors"
                title="Save verified calculation to authentic history"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-forest" />
                <span>Save Calculation</span>
              </button>

              <button
                onClick={onNavigateToResults}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-forest hover:bg-forest-hover text-white rounded text-xs font-semibold shadow-subtle transition-colors"
              >
                <span>Full Results & Charts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Route Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-mineral">
              <span className="font-medium text-slate-dark">
                Live Geographic Path ({multiModalData.origin.shortName} &rarr; {multiModalData.destination.shortName})
              </span>
              <span>{activeRoute.geometry.length} real coordinate vertices</span>
            </div>
            <RouteMap
              activeRoute={activeRoute}
              allRoutes={multiModalData.routes}
              originName={multiModalData.origin.shortName || 'Origin'}
              destinationName={multiModalData.destination.shortName || 'Destination'}
              selectedMode={resolvedMode}
              onSelectMode={setSelectedMode}
              className="h-[460px]"
            />
          </div>

          {/* Practical Recommendation Engine Card */}
          <RecommendationCard
            recommendation={evaluatedModes.recommendation}
            activeRoute={activeRoute}
            onApplyRecommended={(m) => setSelectedMode(m)}
          />

          {/* Dynamic Savings Calculator */}
          <SavingsCalculator
            baselineCo2Kg={evaluatedModes.emissions.car?.totalCo2Kg ?? evaluatedModes.emissions[resolvedMode].totalCo2Kg}
            baselineCost={evaluatedModes.costs.car?.cost ?? null}
            baselineLabel={evaluatedModes.emissions.car?.modeLabel || activeRoute.modeLabel}
            chosenCo2Kg={evaluatedModes.emissions[resolvedMode].totalCo2Kg}
            chosenCost={evaluatedModes.costs[resolvedMode].cost}
            chosenLabel={activeRoute.modeLabel}
            currencySymbol={pricingConfig.currencySymbol}
          />

          {/* Multi-Modal Comparison Table */}
          <ModeComparisonTable
            routes={multiModalData.routes}
            emissions={evaluatedModes.emissions}
            costs={evaluatedModes.costs}
            scores={evaluatedModes.recommendation.allScores}
            selectedMode={resolvedMode}
            onSelectMode={setSelectedMode}
            onViewDetailedResults={onNavigateToResults}
          />

          {/* Transparent corridor estimate for modes without a GTFS feed */}
          <TransitEstimateCard
            corridorDistanceKm={multiModalData.routes.car?.distanceKm ?? activeRoute.distanceKm}
            onOpenMethodology={onNavigateToMethodology}
          />

          {/* Strict Data Transparency Notice for Unsupported Modes */}
          <UnsupportedModesNotice
            unsupportedModes={multiModalData.unsupportedModes}
            onOpenMethodology={onNavigateToMethodology}
          />
        </div>
      )}
    </div>
  );
};
