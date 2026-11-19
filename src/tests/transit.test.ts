import { describe, expect, it } from 'vitest';
import { calculateTransitCorridorEstimates } from '../utils/transit';

describe('calculateTransitCorridorEstimates', () => {
  it('returns bus and metro estimates for a valid corridor', () => {
    const estimates = calculateTransitCorridorEstimates(100);

    expect(estimates).toHaveLength(2);
    expect(estimates.map((estimate) => estimate.mode)).toEqual(['bus', 'metro_train']);
  });

  it('applies the authoritative bus passenger-km factor', () => {
    const [bus] = calculateTransitCorridorEstimates(100);

    expect(bus.co2Kg).toBe(9.65);
    expect(bus.co2GramsPerKm).toBe(96.5);
    expect(bus.factorValue).toBe(0.0965);
    expect(bus.factorUnit).toBe('kg CO₂e / passenger-km');
    expect(bus.source).toContain('DESNZ');
    expect(bus.sourceUrl).toContain('gov.uk');
    expect(bus.disclaimer).toContain('occupancy');
  });

  it('applies the authoritative metro passenger-km factor', () => {
    const [, metro] = calculateTransitCorridorEstimates(8.2);

    // 8.2 km * 0.0286 = 0.23452, rounded to 0.235 kg.
    expect(metro.co2Kg).toBe(0.235);
    expect(metro.co2GramsPerKm).toBe(28.6);
    expect(metro.factorName).toContain('Metro');
  });

  it('does not invent a schedule or fare', () => {
    const estimates = calculateTransitCorridorEstimates(8.2);

    for (const estimate of estimates) {
      expect(estimate).not.toHaveProperty('durationMinutes');
      expect(estimate).not.toHaveProperty('fare');
      expect(estimate).not.toHaveProperty('geometry');
    }
  });

  it('returns no estimates for zero, negative, or non-finite distance', () => {
    expect(calculateTransitCorridorEstimates(0)).toEqual([]);
    expect(calculateTransitCorridorEstimates(-5)).toEqual([]);
    expect(calculateTransitCorridorEstimates(Number.NaN)).toEqual([]);
    expect(calculateTransitCorridorEstimates(Number.POSITIVE_INFINITY)).toEqual([]);
  });
});
