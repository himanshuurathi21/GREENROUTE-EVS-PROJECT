import { describe, expect, it } from 'vitest';
import { ModeCostResult } from '../types/cost';
import { ModeEmissionResult } from '../types/emissions';
import { RouteResult, TravelMode } from '../types/routing';
import { generatePracticalRecommendations } from '../utils/recommendation';

interface ModeInputs {
  route: RouteResult;
  emission: ModeEmissionResult;
  cost: ModeCostResult;
}

function makeRoute(mode: TravelMode, distanceKm: number, durationMinutes: number): RouteResult {
  return {
    mode,
    modeLabel: mode,
    distanceMeters: distanceKm * 1000,
    distanceKm,
    durationSeconds: durationMinutes * 60,
    durationMinutes,
    geometry: [],
    status: 'available',
    provider: 'test',
  };
}

function makeEmission(mode: TravelMode, totalCo2Kg: number): ModeEmissionResult {
  return {
    mode,
    modeLabel: mode,
    totalCo2Kg,
    co2GramsPerKm: totalCo2Kg > 0 ? (totalCo2Kg * 1000) / 10 : 0,
    energyOrFuelConsumed: 0,
    energyOrFuelUnit: 'L',
    isEstimate: false,
    factorUsed: {
      name: 'test factor',
      value: 1,
      unit: 'kg',
      source: 'test',
      sourceUrl: '',
    },
  };
}

function makeCost(mode: TravelMode, cost: number | null): ModeCostResult {
  return {
    mode,
    modeLabel: mode,
    cost,
    formattedCost: cost === null ? 'Fare unavailable' : `₹${cost.toFixed(2)}`,
    isAvailable: cost !== null,
    costBreakdown: 'test',
  };
}

function makeInputs(
  entries: Array<[TravelMode, number, number, number, number | null]>
): Partial<Record<TravelMode, ModeInputs>> {
  const result: Partial<Record<TravelMode, ModeInputs>> = {};

  for (const [mode, distance, duration, co2, cost] of entries) {
    result[mode] = {
      route: makeRoute(mode, distance, duration),
      emission: makeEmission(mode, co2),
      cost: makeCost(mode, cost),
    };
  }

  return result;
}

describe('generatePracticalRecommendations', () => {
  it('recommends cycling for a 3 km corridor over car and walking', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['car', 3, 8, 0.5, 50],
        ['walking', 3, 36, 0, 0],
        ['cycling', 3, 12, 0, 0],
      ]),
      'car'
    );

    expect(summary.primaryRecommendation).toBe('cycling');
    expect(summary.co2SavedKgVsBaseline).toBe(0.5);
    expect(summary.costDifferenceVsBaseline).toBe(50);
    expect(summary.allScores.cycling.isRecommended).toBe(true);
    expect(summary.allScores.car.environmentalScore).toBe(0);
    expect(summary.allScores.cycling.environmentalScore).toBe(100);
  });

  it('does not recommend a multi-hour walk for a 30 km trip when a car route exists', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['car', 30, 40, 7, 300],
        ['walking', 30, 360, 0, 0],
      ]),
      'car'
    );

    expect(summary.primaryRecommendation).toBe('car');
    expect(summary.allScores.car.isRecommended).toBe(true);
    expect(summary.allScores.walking.isRecommended).toBe(false);
    expect(summary.allScores.walking.warnings.join(' ')).toContain('impractical');
  });

  it('keeps cycling eligible for a realistic 8.2 km commute', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['car', 8.2, 18, 1.8, 150],
        ['motorcycle', 8.2, 20, 0.7, 60],
        ['cycling', 8.2, 30, 0, 0],
      ]),
      'car'
    );

    expect(summary.primaryRecommendation).toBe('cycling');
    expect(summary.allScores.cycling.practicalityScore).toBe(85);
    expect(summary.timeDifferenceMinutesVsBaseline).toBe(12);
  });

  it('falls back to all modes when every mode is impractical for the primary slot', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['walking', 25, 300, 0, 0],
        ['cycling', 25, 70, 0, 0],
      ]),
      'walking'
    );

    expect(['walking', 'cycling']).toContain(summary.primaryRecommendation);
    expect(summary.allScores[summary.primaryRecommendation].isRecommended).toBe(true);
  });

  it('marks a missing fare as a warning instead of inventing a cost score', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['car', 10, 20, 2, 100],
        ['bus', 10, 30, 0.965, null],
      ]),
      'car'
    );

    expect(summary.allScores.bus.warnings.join(' ')).toContain('fare data is unavailable');
    expect(summary.allScores.bus.costScore).toBe(80);
  });

  it('gives the only available mode a full environmental score', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([['car', 10, 20, 2, 100]]),
      'car'
    );

    expect(summary.primaryRecommendation).toBe('car');
    expect(summary.allScores.car.environmentalScore).toBe(100);
    expect(summary.allScores.car.timeScore).toBe(100);
  });

  it('does not call a petrol car zero-emission just because it is the only mode', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([['car', 10, 20, 2, 100]]),
      'car'
    );

    expect(summary.allScores.car.tagline).not.toContain('Zero-Emission');
  });

  it('does not call the lowest-emitting transit mode zero-emission', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['car', 10, 20, 2, 100],
        ['bus', 10, 30, 0.965, null],
      ]),
      'car'
    );

    expect(summary.allScores.bus.environmentalScore).toBe(100);
    expect(summary.allScores.bus.tagline).not.toContain('Zero-Emission');
  });

  it('uses transit-specific rationale when bus wins the comparison', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['car', 10, 20, 2, 100],
        ['bus', 10, 30, 0.965, null],
      ]),
      'car'
    );

    expect(summary.primaryRecommendation).toBe('bus');
    expect(summary.recommendedReason).toContain('Public bus');
    expect(summary.recommendedReason).not.toContain('Car is recommended');
    expect(summary.recommendedReason).toContain('96.5 g CO₂ per passenger-km');
  });

  it('only claims cycling is faster than the car when routed durations support it', () => {
    const faster = generatePracticalRecommendations(
      makeInputs([
        ['car', 4, 15, 1.2, 80],
        ['cycling', 4, 10, 0, 0],
      ]),
      'car'
    );
    expect(faster.allScores.cycling.reasons.join(' ')).toContain(
      'Faster than the routed car option'
    );

    const slower = generatePracticalRecommendations(
      makeInputs([
        ['car', 4, 5, 1.2, 80],
        ['cycling', 4, 12, 0, 0],
      ]),
      'car'
    );
    const slowerReasons = slower.allScores.cycling.reasons.join(' ');
    expect(slowerReasons).not.toContain('Faster than the routed car option');
    expect(slowerReasons).toContain('Short, bike-friendly corridor');
  });

  it('does not claim cycling is unhindered by traffic in its rationale', () => {
    const summary = generatePracticalRecommendations(
      makeInputs([
        ['car', 3, 8, 0.5, 50],
        ['cycling', 3, 12, 0, 0],
      ]),
      'car'
    );

    expect(summary.recommendedReason).toContain('no parking overhead');
    expect(summary.recommendedReason).not.toContain('hindered by traffic');
  });

  it('throws when no routes are supplied', () => {
    expect(() => generatePracticalRecommendations({}, 'car')).toThrow(
      'No available routes to evaluate recommendations.'
    );
  });
});
