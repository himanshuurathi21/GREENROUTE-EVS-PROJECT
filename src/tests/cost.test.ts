import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICING } from '../data/defaultPricing';
import { DEFAULT_VEHICLE_CONFIG } from '../data/vehiclePresets';
import { VehicleConfig } from '../types/vehicle';
import { calculateModeCost } from '../utils/cost';
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

describe('calculateModeCost', () => {
  it('calculates petrol cost from liters consumed and regional price', () => {
    const result = calculateModeCost('car', 100, petrolCar, DEFAULT_PRICING);

    expect(result.cost).toBe(690.86);
    expect(result.formattedCost).toBe('₹690.86');
    expect(result.unitPriceUsed).toContain('Petrol');
  });

  it('calculates diesel cost with the diesel tariff', () => {
    const result = calculateModeCost('car', 100, dieselCar, DEFAULT_PRICING);

    expect(result.cost).toBe(497.89);
    expect(result.unitPriceUsed).toContain('Diesel');
  });

  it('calculates EV cost from kWh consumed and electricity tariff', () => {
    const result = calculateModeCost('car', 100, electricCar, DEFAULT_PRICING);

    expect(result.cost).toBe(112.5);
    expect(result.formattedCost).toBe('₹112.50');
    expect(result.unitPriceUsed).toContain('/ kWh');
  });

  it('honours a custom currency symbol and tariff', () => {
    const result = calculateModeCost('car', 100, electricCar, {
      ...DEFAULT_PRICING,
      currencySymbol: '$',
      currencyCode: 'USD',
      electricityTariffPerKwh: 0.16,
      isCustomPricing: true,
    });

    expect(result.cost).toBe(2.4);
    expect(result.formattedCost).toBe('$2.40');
  });

  it('returns zero cost for walking and cycling', () => {
    const walking = calculateModeCost('walking', 8.2, petrolCar, DEFAULT_PRICING);
    const cycling = calculateModeCost('cycling', 8.2, petrolCar, DEFAULT_PRICING);

    expect(walking.cost).toBe(0);
    expect(cycling.cost).toBe(0);
    expect(walking.formattedCost).toBe('₹0.00');
  });

  it('never invents a public transit fare', () => {
    const bus = calculateModeCost('bus', 8.2, petrolCar, DEFAULT_PRICING);
    const metro = calculateModeCost('metro_train', 8.2, petrolCar, DEFAULT_PRICING);

    expect(bus.cost).toBeNull();
    expect(metro.cost).toBeNull();
    expect(bus.formattedCost).toBe('Fare unavailable');
    expect(bus.isAvailable).toBe(false);
    expect(bus.unavailableReason).toContain('fake fares');
  });

  it('uses a standard two-wheeler baseline when the saved vehicle is a car', () => {
    const result = calculateModeCost('motorcycle', 100, petrolCar, DEFAULT_PRICING);

    expect(result.cost).toBe(214.93);
    expect(result.costBreakdown).toContain('2.22 L');
  });

  it('uses the saved motorcycle profile when configured', () => {
    const result = calculateModeCost('motorcycle', 100, DEFAULT_MOTORCYCLE_CONFIG, DEFAULT_PRICING);

    expect(result.cost).toBe(214.93);
    expect(result.mode).toBe('motorcycle');
  });

  it('handles invalid efficiency without returning Infinity', () => {
    const result = calculateModeCost('car', 100, { ...petrolCar, efficiencyValue: 0 }, DEFAULT_PRICING);

    expect(result.cost).toBeNull();
    expect(result.isAvailable).toBe(false);
    expect(result.formattedCost).toBe('Unavailable');
  });

  it('does not treat a zero fuel price as free travel', () => {
    const result = calculateModeCost('car', 100, petrolCar, {
      ...DEFAULT_PRICING,
      petrolPricePerLiter: 0,
    });

    expect(result.cost).toBeNull();
    expect(result.isAvailable).toBe(false);
    expect(result.unavailableReason).toContain('petrol price');
  });

  it('does not treat a zero electricity tariff as free EV charging', () => {
    const result = calculateModeCost('car', 100, electricCar, {
      ...DEFAULT_PRICING,
      electricityTariffPerKwh: 0,
    });

    expect(result.cost).toBeNull();
    expect(result.isAvailable).toBe(false);
    expect(result.unavailableReason).toContain('electricity tariff');
  });

  it('does not return a negative cost for an invalid route distance', () => {
    const result = calculateModeCost('car', Number.NaN, petrolCar, DEFAULT_PRICING);

    expect(result.cost).toBeNull();
    expect(result.isAvailable).toBe(false);
  });
});
