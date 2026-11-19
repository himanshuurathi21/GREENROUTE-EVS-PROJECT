import { ModeCostResult, RegionalPricingConfig } from '../types/cost';
import { TravelMode } from '../types/routing';
import { VehicleConfig } from '../types/vehicle';
import { getVehicleConfigForMode } from './vehicle';

/**
 * Calculate financial cost for travel mode based on verified fuel prices or electricity tariffs.
 * In accordance with project policy:
 * - Walking / Cycling = 0 (zero operational fuel cost)
 * - Fuel = fuelConsumed (L) * fuelPricePerLiter
 * - EV = energyConsumed (kWh) * electricityTariffPerKwh
 * - Transit = "Fare unavailable" when no direct fare API is connected. Never invented.
 */
export function calculateModeCost(
  mode: TravelMode,
  distanceKm: number,
  vehicleConfig: VehicleConfig,
  pricing: RegionalPricingConfig
): ModeCostResult {
  const sym = pricing.currencySymbol;

  // Active travel
  if (mode === 'walking' || mode === 'cycling') {
    return {
      mode,
      modeLabel: mode === 'walking' ? 'Walking' : 'Cycling',
      cost: 0,
      formattedCost: `${sym}0.00`,
      isAvailable: true,
      costBreakdown: 'Zero operational fuel or fare cost.',
    };
  }

  // Personal Car
  if (mode === 'car') {
    const carConfig = getVehicleConfigForMode('car', vehicleConfig);
    return calculateMotorizedCost(mode, 'Personal Car', distanceKm, carConfig, pricing);
  }

  // Motorcycle
  if (mode === 'motorcycle') {
    const bikeConfig = getVehicleConfigForMode('motorcycle', vehicleConfig);
    return calculateMotorizedCost(mode, 'Motorcycle / Two-Wheeler', distanceKm, bikeConfig, pricing);
  }

  // Public Bus & Metro: No fake fares!
  if (mode === 'bus' || mode === 'metro_train') {
    return {
      mode,
      modeLabel: mode === 'bus' ? 'Transit Bus' : 'Metro / Train',
      cost: null,
      formattedCost: 'Fare unavailable',
      isAvailable: false,
      unavailableReason: 'Direct automated fare-engine API is not integrated for this transit zone. To maintain absolute data integrity, estimated or fake fares are strictly prohibited.',
      costBreakdown: 'Real ticket fare data unavailable.',
    };
  }

  return {
    mode,
    modeLabel: mode,
    cost: null,
    formattedCost: 'Fare unavailable',
    isAvailable: false,
    costBreakdown: 'N/A',
  };
}

function unavailableCost(
  mode: TravelMode,
  modeLabel: string,
  reason: string,
  breakdown: string
): ModeCostResult {
  return {
    mode,
    modeLabel,
    cost: null,
    formattedCost: 'Unavailable',
    isAvailable: false,
    unavailableReason: reason,
    costBreakdown: breakdown,
  };
}

function calculateMotorizedCost(
  mode: TravelMode,
  modeLabel: string,
  distanceKm: number,
  config: VehicleConfig,
  pricing: RegionalPricingConfig
): ModeCostResult {
  const sym = pricing.currencySymbol;

  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return unavailableCost(
      mode,
      modeLabel,
      'A non-negative route distance is required to calculate cost.',
      'Invalid route distance.'
    );
  }

  if (!Number.isFinite(config.efficiencyValue) || config.efficiencyValue <= 0) {
    return unavailableCost(
      mode,
      modeLabel,
      'A positive vehicle efficiency value is required to calculate cost.',
      'Invalid vehicle efficiency.'
    );
  }

  if (config.fuelType === 'electric') {
    if (!Number.isFinite(pricing.electricityTariffPerKwh) || pricing.electricityTariffPerKwh <= 0) {
      return unavailableCost(
        mode,
        modeLabel,
        'A positive regional electricity tariff is required to calculate EV cost.',
        'Invalid electricity tariff.'
      );
    }

    // energyConsumed (kWh) = distanceKm * efficiencyValue (kWh/km)
    const energyConsumed = distanceKm * config.efficiencyValue;
    const cost = Number((energyConsumed * pricing.electricityTariffPerKwh).toFixed(2));
    return {
      mode,
      modeLabel,
      cost,
      formattedCost: `${sym}${cost.toFixed(2)}`,
      isAvailable: true,
      unitPriceUsed: `${sym}${pricing.electricityTariffPerKwh.toFixed(2)} / kWh`,
      costBreakdown: `${energyConsumed.toFixed(2)} kWh consumed @ ${sym}${pricing.electricityTariffPerKwh.toFixed(2)}/kWh`,
    };
  }

  // Liquid fuel (petrol or diesel)
  const isDiesel = config.fuelType === 'diesel';
  const fuelPrice = isDiesel ? pricing.dieselPricePerLiter : pricing.petrolPricePerLiter;
  const fuelTypeStr = isDiesel ? 'Diesel' : 'Petrol';

  if (!Number.isFinite(fuelPrice) || fuelPrice <= 0) {
    return unavailableCost(
      mode,
      modeLabel,
      `A positive ${fuelTypeStr.toLowerCase()} price is required to calculate cost.`,
      `Invalid ${fuelTypeStr.toLowerCase()} price.`
    );
  }

  // fuelConsumed (Liters) = distanceKm / efficiencyValue (km/L)
  const fuelConsumed = distanceKm / config.efficiencyValue;
  const cost = Number((fuelConsumed * fuelPrice).toFixed(2));

  return {
    mode,
    modeLabel,
    cost,
    formattedCost: `${sym}${cost.toFixed(2)}`,
    isAvailable: true,
    unitPriceUsed: `${sym}${fuelPrice.toFixed(2)} / L (${fuelTypeStr})`,
    costBreakdown: `${fuelConsumed.toFixed(2)} L consumed @ ${sym}${fuelPrice.toFixed(2)}/L`,
  };
}
