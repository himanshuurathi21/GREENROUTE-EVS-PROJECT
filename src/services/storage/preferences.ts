import { DEFAULT_PRICING } from '../../data/defaultPricing';
import { DEFAULT_GRID_INTENSITY, REGIONAL_GRID_INTENSITIES } from '../../data/gridIntensities';
import { DEFAULT_VEHICLE_CONFIG } from '../../data/vehiclePresets';
import { RegionalPricingConfig } from '../../types/cost';
import { RegionalGridIntensity } from '../../types/emissions';
import { VehicleConfig } from '../../types/vehicle';

const KEYS = {
  vehicle: 'greenroute_vehicle_config_v1',
  pricing: 'greenroute_pricing_v1',
  grid: 'greenroute_grid_id_v1',
  legacyOrsKey: 'greenroute_ors_api_key',
} as const;

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function loadVehicleConfig(): VehicleConfig {
  const parsed = readJson(KEYS.vehicle);
  if (!isRecord(parsed)) return DEFAULT_VEHICLE_CONFIG;

  const validType = parsed.type === 'car' || parsed.type === 'motorcycle';
  const validFuel =
    parsed.fuelType === 'petrol' ||
    parsed.fuelType === 'diesel' ||
    parsed.fuelType === 'electric' ||
    parsed.fuelType === 'hybrid';
  const validFuelForType =
    parsed.type === 'motorcycle'
      ? parsed.fuelType === 'petrol' || parsed.fuelType === 'electric'
      : validFuel;
  const validCategory =
    parsed.type === 'car'
      ? parsed.category === 'small_car' || parsed.category === 'sedan' || parsed.category === 'suv'
      : parsed.category === 'motorcycle';
  // Electric vehicles are stored as kWh/km; every combustion/hybrid profile is
  // stored as km/L. A mismatched unit would silently invert the calculation.
  const validUnit =
    parsed.fuelType === 'electric'
      ? parsed.efficiencyUnit === 'kWh/km'
      : parsed.efficiencyUnit === 'km/L';
  const validLabels =
    typeof parsed.categoryLabel === 'string' &&
    parsed.categoryLabel.length > 0 &&
    typeof parsed.fuelLabel === 'string' &&
    parsed.fuelLabel.length > 0;

  if (
    !validType ||
    !validFuel ||
    !validFuelForType ||
    !validCategory ||
    !validUnit ||
    !validLabels ||
    !isFinitePositive(parsed.efficiencyValue)
  ) {
    return DEFAULT_VEHICLE_CONFIG;
  }

  return {
    ...DEFAULT_VEHICLE_CONFIG,
    ...(parsed as Partial<VehicleConfig>),
    type: parsed.type as VehicleConfig['type'],
    fuelType: parsed.fuelType as VehicleConfig['fuelType'],
    efficiencyUnit: parsed.efficiencyUnit as VehicleConfig['efficiencyUnit'],
    efficiencyValue: parsed.efficiencyValue,
    isCustomEfficiency: Boolean(parsed.isCustomEfficiency),
  };
}

export function saveVehicleConfig(config: VehicleConfig): void {
  try {
    localStorage.setItem(KEYS.vehicle, JSON.stringify(config));
  } catch {
    // Storage can be unavailable in private browsing; calculations still work.
  }
}

export function loadPricingConfig(): RegionalPricingConfig {
  const parsed = readJson(KEYS.pricing);
  if (!isRecord(parsed)) return DEFAULT_PRICING;

  const validCurrency = typeof parsed.currencySymbol === 'string' && parsed.currencySymbol.length > 0;
  const validCode = typeof parsed.currencyCode === 'string' && parsed.currencyCode.length > 0;
  const validPrices =
    isFinitePositive(parsed.petrolPricePerLiter) &&
    isFinitePositive(parsed.dieselPricePerLiter) &&
    isFinitePositive(parsed.electricityTariffPerKwh);

  if (!validCurrency || !validCode || !validPrices) return DEFAULT_PRICING;

  return {
    currencySymbol: parsed.currencySymbol as string,
    currencyCode: parsed.currencyCode as string,
    petrolPricePerLiter: parsed.petrolPricePerLiter as number,
    dieselPricePerLiter: parsed.dieselPricePerLiter as number,
    electricityTariffPerKwh: parsed.electricityTariffPerKwh as number,
    isCustomPricing: Boolean(parsed.isCustomPricing),
  };
}

export function savePricingConfig(config: RegionalPricingConfig): void {
  try {
    localStorage.setItem(KEYS.pricing, JSON.stringify(config));
  } catch {
    // Ignore unavailable storage.
  }
}

export function loadGridIntensity(): RegionalGridIntensity {
  try {
    const id = localStorage.getItem(KEYS.grid);
    return REGIONAL_GRID_INTENSITIES.find((grid) => grid.id === id) ?? DEFAULT_GRID_INTENSITY;
  } catch {
    return DEFAULT_GRID_INTENSITY;
  }
}

export function saveGridIntensity(grid: RegionalGridIntensity): void {
  try {
    localStorage.setItem(KEYS.grid, grid.id);
  } catch {
    // Ignore unavailable storage.
  }
}

export function clearLegacyApiKey(): void {
  try {
    localStorage.removeItem(KEYS.legacyOrsKey);
  } catch {
    // Ignore unavailable storage.
  }
}
