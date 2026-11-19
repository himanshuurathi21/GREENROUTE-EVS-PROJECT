import { describe, expect, it } from 'vitest';
import { DEFAULT_VEHICLE_CONFIG } from '../data/vehiclePresets';
import { VehicleConfig } from '../types/vehicle';
import {
  DEFAULT_ELECTRIC_MOTORCYCLE_CONFIG,
  DEFAULT_MOTORCYCLE_CONFIG,
  getVehicleBasisLabel,
  getVehicleConfigForMode,
} from '../utils/vehicle';

const savedMotorcycle: VehicleConfig = {
  ...DEFAULT_MOTORCYCLE_CONFIG,
  efficiencyValue: 50,
  isCustomEfficiency: true,
};

describe('getVehicleConfigForMode', () => {
  it('returns the saved car for the car row', () => {
    const savedCar = { ...DEFAULT_VEHICLE_CONFIG, efficiencyValue: 20 };

    expect(getVehicleConfigForMode('car', savedCar)).toBe(savedCar);
  });

  it('returns the saved motorcycle for the motorcycle row', () => {
    expect(getVehicleConfigForMode('motorcycle', savedMotorcycle)).toBe(savedMotorcycle);
  });

  it('uses a standard car baseline when only a motorcycle is saved', () => {
    const effective = getVehicleConfigForMode('car', savedMotorcycle);

    expect(effective.type).toBe('car');
    expect(effective.efficiencyValue).toBe(14);
    expect(effective.efficiencyValue).not.toBe(savedMotorcycle.efficiencyValue);
  });

  it('uses a standard two-wheeler baseline when only a car is saved', () => {
    const effective = getVehicleConfigForMode('motorcycle', DEFAULT_VEHICLE_CONFIG);

    expect(effective.type).toBe('motorcycle');
    expect(effective.fuelType).toBe('petrol');
    expect(effective.efficiencyValue).toBe(45);
  });

  it('keeps the configured motorcycle for the motorcycle row', () => {
    const effective = getVehicleConfigForMode('motorcycle', savedMotorcycle);

    expect(effective.efficiencyValue).toBe(50);
    expect(effective.isCustomEfficiency).toBe(true);
  });

  it('does not replace non-vehicle configs for active travel', () => {
    expect(getVehicleConfigForMode('walking', DEFAULT_VEHICLE_CONFIG)).toBe(DEFAULT_VEHICLE_CONFIG);
    expect(getVehicleConfigForMode('bus', DEFAULT_VEHICLE_CONFIG)).toBe(DEFAULT_VEHICLE_CONFIG);
  });
});

describe('getVehicleBasisLabel', () => {
  it('describes the saved car basis', () => {
    expect(getVehicleBasisLabel('car', DEFAULT_VEHICLE_CONFIG)).toContain('Your saved car');
  });

  it('identifies a car baseline when a motorcycle is saved', () => {
    const label = getVehicleBasisLabel('car', savedMotorcycle);

    expect(label).toContain('Standard car baseline');
    expect(label).toContain('14');
  });

  it('describes a saved two-wheeler', () => {
    const label = getVehicleBasisLabel('motorcycle', savedMotorcycle);

    expect(label).toContain('Your saved two-wheeler');
    expect(label).toContain('50 km/L');
  });

  it('describes a two-wheeler baseline when a car is saved', () => {
    expect(getVehicleBasisLabel('motorcycle', DEFAULT_VEHICLE_CONFIG)).toContain(
      'Standard two-wheeler baseline'
    );
  });

  it('describes certified/zero-emission transit modes', () => {
    expect(getVehicleBasisLabel('walking', DEFAULT_VEHICLE_CONFIG)).toContain(
      'zero-emission factor'
    );
  });
});

describe('electric motorcycle baseline', () => {
  it('is a motorcycle with an electric powertrain and kWh/km unit', () => {
    expect(DEFAULT_ELECTRIC_MOTORCYCLE_CONFIG.type).toBe('motorcycle');
    expect(DEFAULT_ELECTRIC_MOTORCYCLE_CONFIG.fuelType).toBe('electric');
    expect(DEFAULT_ELECTRIC_MOTORCYCLE_CONFIG.efficiencyUnit).toBe('kWh/km');
    expect(DEFAULT_ELECTRIC_MOTORCYCLE_CONFIG.efficiencyValue).toBe(0.038);
  });
});
