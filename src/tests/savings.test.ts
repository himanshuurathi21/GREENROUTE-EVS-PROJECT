import { describe, expect, it } from 'vitest';
import { calculateDynamicSavings } from '../utils/savings';

describe('calculateDynamicSavings', () => {
  it('computes per-trip, weekly, and annual CO2 reductions', () => {
    const result = calculateDynamicSavings(10, 2, 5, 48);

    expect(result.perTripCo2SavedKg).toBe(8);
    expect(result.weeklyCo2SavedKg).toBe(40);
    expect(result.totalAnnualTrips).toBe(240);
    expect(result.annualCo2SavedKg).toBe(1920);
    expect(result.treesEquivalentAnnual).toBe(88.2);
    expect(result.currencySymbol).toBe('₹');
  });

  it('computes financial savings when both costs are known', () => {
    const result = calculateDynamicSavings(10, 2, 5, 48, 100, 40, '₹');

    expect(result.perTripCostSaved).toBe(60);
    expect(result.annualCostSaved).toBe(14400);
  });

  it('clamps negative carbon savings to zero', () => {
    const result = calculateDynamicSavings(2, 10, 5, 48);

    expect(result.perTripCo2SavedKg).toBe(0);
    expect(result.weeklyCo2SavedKg).toBe(0);
    expect(result.annualCo2SavedKg).toBe(0);
    expect(result.treesEquivalentAnnual).toBe(0);
  });

  it('keeps cost savings null when a fare is unavailable', () => {
    const result = calculateDynamicSavings(10, 2, 5, 48, null, 40, '₹');

    expect(result.perTripCostSaved).toBeNull();
    expect(result.annualCostSaved).toBeNull();
  });

  it('supports custom commute frequencies', () => {
    const result = calculateDynamicSavings(5, 1, 10, 24, null, null, '$');

    expect(result.weeklyCo2SavedKg).toBe(40);
    expect(result.totalAnnualTrips).toBe(240);
    expect(result.annualCo2SavedKg).toBe(960);
    expect(result.currencySymbol).toBe('$');
  });
});
