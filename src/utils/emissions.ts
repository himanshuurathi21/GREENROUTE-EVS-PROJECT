import { AUTHORITATIVE_EMISSION_FACTORS } from '../data/emissionFactors';
import { ModeEmissionResult, RegionalGridIntensity } from '../types/emissions';
import { TravelMode } from '../types/routing';
import { VehicleConfig } from '../types/vehicle';
import { getVehicleConfigForMode } from './vehicle';

/**
 * Calculate precise emissions for a given travel mode, distance, and vehicle specs.
 * Uses strictly authoritative greenhouse gas factors from DESNZ, EPA, and CEA.
 */
export function calculateModeEmissions(
  mode: TravelMode,
  distanceKm: number,
  vehicleConfig: VehicleConfig,
  gridIntensity: RegionalGridIntensity
): ModeEmissionResult {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return {
      mode,
      modeLabel: getModeLabel(mode),
      totalCo2Kg: 0,
      co2GramsPerKm: 0,
      energyOrFuelConsumed: 0,
      energyOrFuelUnit: vehicleConfig.fuelType === 'electric' ? 'kWh' : 'L',
      isEstimate: false,
      factorUsed: {
        name: 'Zero Distance',
        value: 0,
        unit: 'kg CO2/km',
        source: 'N/A',
        sourceUrl: '',
      },
    };
  }

  // Active travel: Walking & Cycling
  if (mode === 'walking' || mode === 'cycling') {
    const factor = AUTHORITATIVE_EMISSION_FACTORS.active_travel;
    return {
      mode,
      modeLabel: getModeLabel(mode),
      totalCo2Kg: 0,
      co2GramsPerKm: 0,
      energyOrFuelConsumed: 0,
      energyOrFuelUnit: 'kcal (human metabolic)',
      isEstimate: false,
      estimationDisclaimer: 'Direct operational emissions are 0 g CO₂. (Dietary food production lifecycle is discussed in the Methodology section).',
      factorUsed: {
        name: factor.name,
        value: factor.value,
        unit: factor.unit,
        source: factor.source,
        sourceUrl: factor.sourceUrl,
      },
    };
  }

  // Personal Car
  if (mode === 'car') {
    const carConfig = getVehicleConfigForMode('car', vehicleConfig);
    return calculateMotorizedEmissions(distanceKm, carConfig, gridIntensity, 'Personal Car', 'car');
  }

  // Motorcycle / Two-Wheeler
  if (mode === 'motorcycle') {
    const bikeConfig = getVehicleConfigForMode('motorcycle', vehicleConfig);
    return calculateMotorizedEmissions(distanceKm, bikeConfig, gridIntensity, 'Motorcycle / Two-Wheeler', 'motorcycle');
  }

  // Public Bus (Per-passenger authoritative factor with required estimation disclaimer)
  if (mode === 'bus') {
    const factor = AUTHORITATIVE_EMISSION_FACTORS.bus_passenger_km;
    const totalCo2Kg = Number((distanceKm * factor.value).toFixed(3));
    const co2GramsPerKm = Number((factor.value * 1000).toFixed(1));

    return {
      mode: 'bus',
      modeLabel: 'Public Transit Bus',
      totalCo2Kg,
      co2GramsPerKm,
      energyOrFuelConsumed: Number((distanceKm * 0.035).toFixed(2)), // Approx fleet fuel share per passenger
      energyOrFuelUnit: 'L (allocated diesel)',
      isEstimate: true,
      estimationDisclaimer: 'Public transit calculation uses UK DESNZ authoritative passenger-km factors assuming average urban occupancy (~10-15 passengers). Route-specific real-time occupancy was not available.',
      factorUsed: {
        name: factor.name,
        value: factor.value,
        unit: factor.unit,
        source: factor.source,
        sourceUrl: factor.sourceUrl,
      },
    };
  }

  // Metro / Train (Per-passenger factor with grid reliance disclaimer)
  if (mode === 'metro_train') {
    const factor = AUTHORITATIVE_EMISSION_FACTORS.metro_rail_passenger_km;
    const totalCo2Kg = Number((distanceKm * factor.value).toFixed(3));
    const co2GramsPerKm = Number((factor.value * 1000).toFixed(1));

    return {
      mode: 'metro_train',
      modeLabel: 'Metro / Rapid Rail',
      totalCo2Kg,
      co2GramsPerKm,
      energyOrFuelConsumed: Number((distanceKm * 0.045).toFixed(2)),
      energyOrFuelUnit: 'kWh (allocated)',
      isEstimate: true,
      estimationDisclaimer: 'Passenger-km estimate based on electric urban rail fleet factors. Highly dependent on local grid generation mix and regenerative braking efficiency.',
      factorUsed: {
        name: factor.name,
        value: factor.value,
        unit: factor.unit,
        source: factor.source,
        sourceUrl: factor.sourceUrl,
      },
    };
  }

  throw new Error(`Unsupported mode: ${mode}`);
}

/**
 * Motorized vehicle emissions calculation:
 * - Petrol / Diesel / Hybrid: fuel = distance / mileage; CO2 = fuel * emissionFactor
 * - EV: energy = distance * kWhPerKm; CO2 = energy * regionalGridIntensity
 */
function calculateMotorizedEmissions(
  distanceKm: number,
  config: VehicleConfig,
  gridIntensity: RegionalGridIntensity,
  label: string,
  mode: 'car' | 'motorcycle'
): ModeEmissionResult {
  if (!Number.isFinite(config.efficiencyValue) || config.efficiencyValue <= 0) {
    throw new Error('Vehicle efficiency must be a positive number.');
  }

  // Electric Vehicle (Scope 2 Grid Emissions)
  if (config.fuelType === 'electric') {
    if (!Number.isFinite(gridIntensity.factorKgPerKwh) || gridIntensity.factorKgPerKwh < 0) {
      throw new Error('Grid carbon intensity must be a non-negative number.');
    }

    const energyConsumedKwh = distanceKm * config.efficiencyValue;
    const totalCo2Kg = Number((energyConsumedKwh * gridIntensity.factorKgPerKwh).toFixed(3));
    const co2GramsPerKm = Number(((totalCo2Kg / distanceKm) * 1000).toFixed(1));

    return {
      mode,
      modeLabel: `${label} (${config.fuelLabel})`,
      totalCo2Kg,
      co2GramsPerKm,
      energyOrFuelConsumed: Number(energyConsumedKwh.toFixed(2)),
      energyOrFuelUnit: 'kWh',
      isEstimate: false,
      factorUsed: {
        name: `Regional Electricity Grid: ${gridIntensity.regionName}`,
        value: gridIntensity.factorKgPerKwh,
        unit: 'kg CO₂e / kWh',
        source: gridIntensity.source,
        sourceUrl: gridIntensity.sourceUrl,
      },
      gridFactorUsed: {
        regionName: gridIntensity.regionName,
        value: gridIntensity.factorKgPerKwh,
        unit: 'kg CO₂e / kWh',
        source: gridIntensity.source,
      },
    };
  }

  // Petrol or Diesel
  const isDiesel = config.fuelType === 'diesel';
  const factor = isDiesel
    ? AUTHORITATIVE_EMISSION_FACTORS.diesel_combustion
    : AUTHORITATIVE_EMISSION_FACTORS.petrol_combustion;

  // fuelConsumed (Liters) = distance (km) / mileage (km/L)
  const fuelConsumedLiters = distanceKm / config.efficiencyValue;
  const totalCo2Kg = Number((fuelConsumedLiters * factor.value).toFixed(3));
  const co2GramsPerKm = Number(((totalCo2Kg / distanceKm) * 1000).toFixed(1));

  return {
    mode,
    modeLabel: `${label} (${config.fuelLabel})`,
    totalCo2Kg,
    co2GramsPerKm,
    energyOrFuelConsumed: Number(fuelConsumedLiters.toFixed(2)),
    energyOrFuelUnit: 'Liters',
    isEstimate: false,
    factorUsed: {
      name: factor.name,
      value: factor.value,
      unit: factor.unit,
      source: factor.source,
      sourceUrl: factor.sourceUrl,
    },
  };
}

function getModeLabel(mode: TravelMode): string {
  switch (mode) {
    case 'car': return 'Personal Car';
    case 'motorcycle': return 'Motorcycle / Two-Wheeler';
    case 'bus': return 'Public Transit Bus';
    case 'metro_train': return 'Metro / Train';
    case 'cycling': return 'Bicycle / Cycling';
    case 'walking': return 'Walking / Pedestrian';
  }
}
