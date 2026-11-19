import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDistance,
  formatDuration,
  formatEmissions,
} from '../utils/formatters';

describe('formatDistance', () => {
  it('uses metres below one kilometre', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('uses one decimal kilometre at and above 1000 m', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(8234)).toBe('8.2 km');
    expect(formatDistance(18_314.9)).toBe('18.3 km');
  });

  it('does not round up to an awkward 1000 m label', () => {
    expect(formatDistance(999.4)).toBe('999 m');
    expect(formatDistance(999.6)).toBe('1.0 km');
  });
});

describe('formatDuration', () => {
  it('formats durations below one hour in minutes', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(60)).toBe('1 min');
    expect(formatDuration(1487.8)).toBe('25 min');
  });

  it('formats whole hours without a minute fragment', () => {
    expect(formatDuration(3600)).toBe('1 hr');
    expect(formatDuration(7200)).toBe('2 hr');
  });

  it('formats mixed hours and minutes', () => {
    expect(formatDuration(5400)).toBe('1 hr 30 min');
    expect(formatDuration(14_934.9)).toBe('4 hr 9 min');
  });
});

describe('formatEmissions', () => {
  it('shows zero and negative emissions as 0.00 kg', () => {
    expect(formatEmissions(0)).toBe('0.00 kg CO₂');
    expect(formatEmissions(-1)).toBe('0.00 kg CO₂');
  });

  it('uses grams below 0.1 kg', () => {
    expect(formatEmissions(0.05)).toBe('50 g CO₂');
    expect(formatEmissions(0.099)).toBe('99 g CO₂');
  });

  it('uses two-decimal kilograms from 0.1 kg upwards', () => {
    expect(formatEmissions(0.1)).toBe('0.10 kg CO₂');
    expect(formatEmissions(16.531)).toBe('16.53 kg CO₂');
  });
});

describe('formatCurrency', () => {
  it('returns Unavailable for a null cost', () => {
    expect(formatCurrency(null)).toBe('Unavailable');
  });

  it('formats with the default rupee symbol', () => {
    expect(formatCurrency(690.86)).toBe('₹690.86');
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  it('respects a custom symbol', () => {
    expect(formatCurrency(2.4, '$')).toBe('$2.40');
  });
});
