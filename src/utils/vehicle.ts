import { DEFAULT_VEHICLE_CONFIG, VEHICLE_PRESETS } from '../data/vehiclePresets';
import { TravelMode } from '../types/routing';
import { VehicleConfig } from '../types/vehicle';

const petrolMotorcyclePreset = VEHICLE_PRESETS.find((preset) => preset.id === 'motorcycle_petrol')!;
const electricMotorcyclePreset = VEHICLE_PRESETS.find((preset) => preset.id === 'motorcycle_electric')!;

/**
 * Standard two-wheeler baseline used when the user's saved vehicle is a car.
 * Keeping a separate baseline prevents car efficiency figures from leaking into
 * motorcycle calculations (and vice versa).
 */
export const DEFAULT_MOTORCYCLE_CONFIG: VehicleConfig = {
  type: 'motorcycle',
  category: 'motorcycle',
  categoryLabel: petrolMotorcyclePreset.categoryLabel,
  fuelType: petrolMotorcyclePreset.fuelType,
  fuelLabel: petrolMotorcyclePreset.fuelLabel,
  efficiencyValue: petrolMotorcyclePreset.defaultEfficiency,
  efficiencyUnit: petrolMotorcyclePreset.unit,
  isCustomEfficiency: false,
  notes: `Standard two-wheeler baseline: ${petrolMotorcyclePreset.source}`,
};

export const DEFAULT_ELECTRIC_MOTORCYCLE_CONFIG: VehicleConfig = {
  type: 'motorcycle',
  category: 'motorcycle',
  categoryLabel: electricMotorcyclePreset.categoryLabel,
  fuelType: electricMotorcyclePreset.fuelType,
  fuelLabel: electricMotorcyclePreset.fuelLabel,
  efficiencyValue: electricMotorcyclePreset.defaultEfficiency,
  efficiencyUnit: electricMotorcyclePreset.unit,
  isCustomEfficiency: false,
  notes: `Standard electric two-wheeler baseline: ${electricMotorcyclePreset.source}`,
};

/**
 * Resolve the vehicle profile that should be used for a travel mode.
 *
 * A user configures one personal vehicle in the planner. If they configure a
 * motorcycle, the car row must still use a standard car baseline instead of
 * silently borrowing 45 km/L two-wheeler efficiency. The same applies in reverse.
 */
export function getVehicleConfigForMode(mode: TravelMode, config: VehicleConfig): VehicleConfig {
  if (mode === 'car') {
    return config.type === 'car' ? config : DEFAULT_VEHICLE_CONFIG;
  }

  if (mode === 'motorcycle') {
    return config.type === 'motorcycle' ? config : DEFAULT_MOTORCYCLE_CONFIG;
  }

  return config;
}

/**
 * Human-readable explanation of which vehicle profile powered a calculation.
 */
export function getVehicleBasisLabel(mode: TravelMode, config: VehicleConfig): string {
  const effective = getVehicleConfigForMode(mode, config);

  if (mode === 'car') {
    return config.type === 'car'
      ? `Your saved car: ${effective.categoryLabel}, ${effective.fuelLabel} @ ${effective.efficiencyValue} ${effective.efficiencyUnit}`
      : `Standard car baseline: ${effective.categoryLabel}, ${effective.fuelLabel} @ ${effective.efficiencyValue} ${effective.efficiencyUnit}`;
  }

  if (mode === 'motorcycle') {
    return config.type === 'motorcycle'
      ? `Your saved two-wheeler: ${effective.fuelLabel} @ ${effective.efficiencyValue} ${effective.efficiencyUnit}`
      : `Standard two-wheeler baseline: ${effective.fuelLabel} @ ${effective.efficiencyValue} ${effective.efficiencyUnit}`;
  }

  return 'Certified per-passenger or zero-emission factor';
}
