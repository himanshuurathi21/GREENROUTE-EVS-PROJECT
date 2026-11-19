import { AUTHORITATIVE_EMISSION_FACTORS } from '../data/emissionFactors';
import { TravelMode } from '../types/routing';

export interface TransitCorridorEstimate {
  mode: Extract<TravelMode, 'bus' | 'metro_train'>;
  modeLabel: string;
  co2Kg: number;
  co2GramsPerKm: number;
  factorName: string;
  factorValue: number;
  factorUnit: string;
  source: string;
  sourceUrl: string;
  disclaimer: string;
}

/**
 * Corridor-based public-transit carbon estimates.
 *
 * This is deliberately NOT a bus/metro route: no GTFS feed is connected, so
 * distance, travel time, geometry, and fares are not invented. We only apply
 * authoritative per-passenger-km factors to a real road corridor distance.
 */
export function calculateTransitCorridorEstimates(
  corridorDistanceKm: number
): TransitCorridorEstimate[] {
  if (!Number.isFinite(corridorDistanceKm) || corridorDistanceKm <= 0) {
    return [];
  }

  const definitions = [
    {
      mode: 'bus' as const,
      modeLabel: 'Public Transit Bus',
      factor: AUTHORITATIVE_EMISSION_FACTORS.bus_passenger_km,
      disclaimer:
        'Estimate assumes average urban bus occupancy (~10-15 passengers). Actual route-specific load factors are not available.',
    },
    {
      mode: 'metro_train' as const,
      modeLabel: 'Metro / Rapid Rail',
      factor: AUTHORITATIVE_EMISSION_FACTORS.metro_rail_passenger_km,
      disclaimer:
        'Estimate assumes an efficient electric metro fleet. Actual emissions depend on the local grid mix and regenerative braking.',
    },
  ];

  return definitions.map(({ mode, modeLabel, factor, disclaimer }) => ({
    mode,
    modeLabel,
    co2Kg: Number((corridorDistanceKm * factor.value).toFixed(3)),
    co2GramsPerKm: Number((factor.value * 1000).toFixed(1)),
    factorName: factor.name,
    factorValue: factor.value,
    factorUnit: factor.unit,
    source: factor.source,
    sourceUrl: factor.sourceUrl,
    disclaimer,
  }));
}
