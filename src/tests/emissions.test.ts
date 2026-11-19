import { describe, expect, it } from 'vitest';
import { DEFAULT_GRID_INTENSITY, REGIONAL_GRID_INTENSITIES } from '../data/gridIntensities';
import { DEFAULT_VEHICLE_CONFIG } from '../data/vehiclePresets';
import { RegionalGridIntensity } from '../types/emissions';
import { VehicleConfig } from '../types/vehicle';
import { calculateModeEmissions } from '../utils/emissions';
import { DEFAULT_MOTORCYCLE_CONFIG } from '../utils/vehicle';

const petrolCar: VehicleConfig = { ...DEFAULT_VEHICLE_CONFIG };
const dieselCar: VehicleConfig = {
  ...DEFAULT_VEHICLE_CONFIG,
  fuelType: 'diesel',
  fuelLabel: 'Diesel',
  efficiencyValue: 18,
};
const electricCar: VehicleConfig = {
  ...DEFAULT_VEHICLE_CONFIG,
  fuelType: 'electric',
  fuelLabel: 'Electric (EV)',
  efficiencyValue: 0.15,
  efficiencyUnit: 'kWh/km',
};
const electricMotorcycle: VehicleConfig = {
  ...DEFAULT_MOTORCYCLE_CONFIG,
  fuelType: 'electric',
  fuelLabel: 'Electric Scooter (EV)',
  efficiencyValue: 0.038,
  efficiencyUnit: 'kWh/km',
};

const greenGrid: RegionalGridIntensity = {
  ...DEFAULT_GRID_INTENSITY,
  factorKgPerKwh: 0.2,
};

describe('calculateModeEmissions', () => {
  it('calculates petrol tailpipe emissions from distance and km/L mileage', () => {
    const result = calculateModeEmissions('car', 100, petrolCar, DEFAULT_GRID_INTENSITY);

    expect(result.mode).toBe('car');
    expect(result.totalCo2Kg).toBe(16.531);
    expect(result.co2GramsPerKm).toBe(165.3);
    expect(result.energyOrFuelConsumed).toBe(7.14);
    expect(result.energyOrFuelUnit).toBe('Liters');
    expect(result.factorUsed.value).toBe(2.3144);
  });

  it('calculates diesel emissions with the diesel factor', () => {
    const result = calculateModeEmissions('car', 100, dieselCar, DEFAULT_GRID_INTENSITY);

    expect(result.totalCo2Kg).toBe(14.912);
    expect(result.factorUsed.value).toBe(2.6841);
  });

  it('treats hybrid vehicles as petrol combustion for tailpipe CO2', () => {
    const hybridCar: VehicleConfig = {
      ...petrolCar,
      fuelType: 'hybrid',
      fuelLabel: 'Strong Hybrid (HEV)',
      efficiencyValue: 24,
    };

    const result = calculateModeEmissions('car', 120, hybridCar, DEFAULT_GRID_INTENSITY);

    expect(result.totalCo2Kg).toBe(11.572);
    expect(result.factorUsed.value).toBe(2.3144);
    expect(result.energyOrFuelUnit).toBe('Liters');
  });

  it('uses regional grid intensity for EV Scope 2 emissions', () => {
    const result = calculateModeEmissions('car', 100, electricCar, DEFAULT_GRID_INTENSITY);

    expect(result.totalCo2Kg).toBe(10.74);
    expect(result.energyOrFuelConsumed).toBe(15);
    expect(result.energyOrFuelUnit).toBe('kWh');
    expect(result.gridFactorUsed?.value).toBe(0.716);
  });

  it('respects a custom grid factor for EVs', () => {
    const result = calculateModeEmissions('car', 100, electricCar, greenGrid);

    expect(result.totalCo2Kg).toBe(3);
    expect(result.gridFactorUsed?.value).toBe(0.2);
  });

  it('returns zero direct operational emissions for walking and cycling', () => {
    const walking = calculateModeEmissions('walking', 8.2, petrolCar, DEFAULT_GRID_INTENSITY);
    const cycling = calculateModeEmissions('cycling', 8.2, petrolCar, DEFAULT_GRID_INTENSITY);

    expect(walking.totalCo2Kg).toBe(0);
    expect(cycling.totalCo2Kg).toBe(0);
    expect(walking.factorUsed.value).toBe(0);
    expect(cycling.factorUsed.value).toBe(0);
  });

  it('applies authoritative per-passenger factors for bus and metro', () => {
    const bus = calculateModeEmissions('bus', 100, petrolCar, DEFAULT_GRID_INTENSITY);
    const metro = calculateModeEmissions('metro_train', 100, petrolCar, DEFAULT_GRID_INTENSITY);

    expect(bus.totalCo2Kg).toBe(9.65);
    expect(bus.co2GramsPerKm).toBe(96.5);
    expect(metro.totalCo2Kg).toBe(2.86);
    expect(metro.co2GramsPerKm).toBe(28.6);
  });

  it('uses a standard two-wheeler baseline when the saved vehicle is a car', () => {
    const result = calculateModeEmissions('motorcycle', 100, petrolCar, DEFAULT_GRID_INTENSITY);

    expect(result.mode).toBe('motorcycle');
    expect(result.totalCo2Kg).toBe(5.143);
    expect(result.energyOrFuelConsumed).toBe(2.22);
  });

  it('uses the saved electric two-wheeler when configured', () => {
    const result = calculateModeEmissions(
      'motorcycle',
      100,
      electricMotorcycle,
      DEFAULT_GRID_INTENSITY
    );

    expect(result.mode).toBe('motorcycle');
    expect(result.totalCo2Kg).toBe(2.721);
    expect(result.energyOrFuelConsumed).toBe(3.8);
  });

  it('uses a standard car baseline when the saved vehicle is a motorcycle', () => {
    const result = calculateModeEmissions('car', 100, DEFAULT_MOTORCYCLE_CONFIG, DEFAULT_GRID_INTENSITY);

    expect(result.mode).toBe('car');
    expect(result.totalCo2Kg).toBe(16.531);
    expect(result.modeLabel).toContain('Petrol');
  });

  it('returns a zero record for zero or negative distance', () => {
    const zero = calculateModeEmissions('car', 0, petrolCar, DEFAULT_GRID_INTENSITY);
    const negative = calculateModeEmissions('car', -10, petrolCar, DEFAULT_GRID_INTENSITY);

    expect(zero.totalCo2Kg).toBe(0);
    expect(negative.totalCo2Kg).toBe(0);
    expect(zero.energyOrFuelConsumed).toBe(0);
  });

  it('throws when vehicle efficiency is invalid', () => {
    const invalid = { ...petrolCar, efficiencyValue: 0 };
    expect(() => calculateModeEmissions('car', 10, invalid, DEFAULT_GRID_INTENSITY)).toThrow(
      'Vehicle efficiency must be a positive number.'
    );
  });

  it('returns zero rather than NaN for a non-finite distance', () => {
    const result = calculateModeEmissions('car', Number.NaN, petrolCar, DEFAULT_GRID_INTENSITY);

    expect(result.totalCo2Kg).toBe(0);
    expect(result.co2GramsPerKm).toBe(0);
  });

  it('rejects a negative grid intensity instead of creating negative emissions', () => {
    expect(() =>
      calculateModeEmissions('car', 10, electricCar, { ...DEFAULT_GRID_INTENSITY, factorKgPerKwh: -1 })
    ).toThrow('Grid carbon intensity must be a non-negative number.');
  });

  it('keeps the factor source URL intact for auditability', () => {
    const result = calculateModeEmissions('car', 20, petrolCar, REGIONAL_GRID_INTENSITIES[0]);

    expect(result.factorUsed.source).toContain('DESNZ');
    expect(result.factorUsed.sourceUrl).toContain('gov.uk');
  });
});
