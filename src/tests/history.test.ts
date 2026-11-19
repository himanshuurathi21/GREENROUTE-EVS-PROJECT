import { beforeEach, describe, expect, it } from 'vitest';
import { historyService } from '../services/history/historyService';
import { SavedTrip } from '../types/history';
import { TREE_ANNUAL_CO2_SEQUESTRATION_KG } from '../data/emissionFactors';

function makeTrip(overrides: Partial<SavedTrip> = {}): SavedTrip {
  return {
    id: 'trip-1',
    timestamp: 1_700_000_000_000,
    formattedDate: '14 Nov 2023, 10:13 pm',
    origin: {
      displayName: 'India Gate, New Delhi, India',
      shortName: 'India Gate',
      coordinates: { lat: 28.6129, lon: 77.2295 },
    },
    destination: {
      displayName: 'Connaught Place, New Delhi, India',
      shortName: 'Connaught Place',
      coordinates: { lat: 28.6304, lon: 77.2177 },
    },
    selectedMode: 'cycling',
    selectedModeLabel: 'Cycling',
    distanceKm: 3.2,
    durationMinutes: 12,
    cost: 0,
    currencySymbol: '₹',
    co2Kg: 0,
    baselineMode: 'car',
    baselineCo2Kg: 0.739,
    co2SavedKg: 0.739,
    methodologySummary: 'OSRM FOSSGIS Live Routing (3.2 km) | Active Travel',
    ...overrides,
  };
}

describe('historyService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty instead of returning seed or demo trips', () => {
    expect(historyService.getTrips()).toEqual([]);
    expect(historyService.getAggregatedStats().totalTrips).toBe(0);
  });

  it('saves a trip and reads it back', () => {
    historyService.saveTrip(makeTrip());

    const trips = historyService.getTrips();
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('trip-1');
    expect(trips[0].origin.shortName).toBe('India Gate');
  });

  it('prepends the newest trip and replaces a duplicate id', () => {
    historyService.saveTrip(makeTrip({ id: 'older', timestamp: 1 }));
    historyService.saveTrip(makeTrip({ id: 'newer', timestamp: 2 }));

    expect(historyService.getTrips().map((trip) => trip.id)).toEqual(['newer', 'older']);

    historyService.saveTrip(makeTrip({ id: 'older', timestamp: 3 }));
    const trips = historyService.getTrips();
    expect(trips.map((trip) => trip.id)).toEqual(['older', 'newer']);
  });

  it('deletes a single trip without touching the others', () => {
    historyService.saveTrip(makeTrip({ id: 'a' }));
    historyService.saveTrip(makeTrip({ id: 'b' }));

    historyService.deleteTrip('a');

    expect(historyService.getTrips().map((trip) => trip.id)).toEqual(['b']);
  });

  it('clears all history', () => {
    historyService.saveTrip(makeTrip());
    historyService.clearHistory();

    expect(historyService.getTrips()).toEqual([]);
  });

  it('returns an empty list for corrupt localStorage data', () => {
    localStorage.setItem('greenroute_actual_saved_trips_v1', '{not-json');

    expect(historyService.getTrips()).toEqual([]);
  });

  it('ignores a non-array JSON payload', () => {
    localStorage.setItem('greenroute_actual_saved_trips_v1', '{"fake":true}');

    expect(historyService.getTrips()).toEqual([]);
  });

  it('filters out malformed trip records instead of crashing the UI', () => {
    const valid = makeTrip({ id: 'valid-trip' });
    const malformed = [
      null,
      'not-a-trip',
      { ...valid, id: '' },
      { ...valid, origin: null },
      { ...valid, origin: { shortName: 'X', coordinates: { lat: 1, lon: 2 } } },
      { ...valid, selectedMode: 'spaceship' },
      { ...valid, distanceKm: 'far' },
      { ...valid, co2Kg: 'unknown' },
      { ...valid, cost: 'free' },
      { ...valid, vehicleConfig: { categoryLabel: 'Car' } },
    ];

    localStorage.setItem(
      'greenroute_actual_saved_trips_v1',
      JSON.stringify([valid, ...malformed])
    );

    const trips = historyService.getTrips();

    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('valid-trip');
  });

  it('aggregates distance, emissions, savings, and mode breakdown', () => {
    historyService.saveTrip(
      makeTrip({
        id: 'car-trip',
        selectedMode: 'car',
        distanceKm: 10,
        co2Kg: 2.31,
        co2SavedKg: 0,
      })
    );
    historyService.saveTrip(
      makeTrip({
        id: 'bike-trip',
        selectedMode: 'cycling',
        distanceKm: 4,
        co2Kg: 0,
        co2SavedKg: 0.924,
      })
    );

    const stats = historyService.getAggregatedStats();

    expect(stats.totalTrips).toBe(2);
    expect(stats.totalDistanceKm).toBe(14);
    expect(stats.totalCo2EmittedKg).toBe(2.31);
    expect(stats.totalCo2SavedKg).toBe(0.92);
    expect(stats.treesAbsorptionEquivalent).toBe(
      Number((0.924 / TREE_ANNUAL_CO2_SEQUESTRATION_KG).toFixed(2))
    );
    expect(stats.modeBreakdown.car.tripsCount).toBe(1);
    expect(stats.modeBreakdown.car.totalDistanceKm).toBe(10);
    expect(stats.modeBreakdown.cycling.tripsCount).toBe(1);
    expect(stats.modeBreakdown.cycling.totalCo2Kg).toBe(0);
    expect(stats.modeBreakdown.walking.tripsCount).toBe(0);
  });

  it('exports JSON that round-trips to the stored trips', () => {
    historyService.saveTrip(makeTrip());

    const exported = historyService.exportToJson();

    expect(JSON.parse(exported)).toEqual(historyService.getTrips());
  });

  it('exports an empty CSV when there are no trips', () => {
    expect(historyService.exportToCsv()).toBe('');
  });

  it('exports CSV with headers, escaped quotes, and N/A for missing fares', () => {
    historyService.saveTrip(
      makeTrip({
        id: 'transit-trip',
        origin: {
          displayName: 'A "quoted" place',
          shortName: 'A "quoted" place',
          coordinates: { lat: 1, lon: 2 },
        },
        selectedMode: 'bus',
        selectedModeLabel: 'Public Bus',
        cost: null,
        vehicleConfig: undefined,
        co2Kg: 0.965,
        methodologySummary: 'Corridor estimate, not a route',
      })
    );

    const csv = historyService.exportToCsv();
    const lines = csv.split('\n');

    expect(lines[0]).toContain('Trip ID,Date,Origin,Destination,Mode');
    expect(lines[1]).toContain('"A ""quoted"" place"');
    expect(lines[1]).toContain('"Public Bus"');
    expect(lines[1]).toContain('"Public transit (corridor estimate)"');
    expect(lines[1]).toContain('N/A');
    expect(lines[1]).toContain('0.965');
    expect(lines[1]).toContain('"Corridor estimate, not a route"');
  });
});
