import { HistoryStats, SavedTrip } from '../../types/history';
import { LocationResult, TravelMode } from '../../types/routing';
import { TREE_ANNUAL_CO2_SEQUESTRATION_KG } from '../../data/emissionFactors';

const STORAGE_KEY = 'greenroute_actual_saved_trips_v1';
const TRAVEL_MODES: TravelMode[] = ['car', 'motorcycle', 'bus', 'metro_train', 'cycling', 'walking'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isTravelMode(value: unknown): value is TravelMode {
  return typeof value === 'string' && TRAVEL_MODES.includes(value as TravelMode);
}

function isLocationResult(value: unknown): value is LocationResult {
  if (!isRecord(value)) return false;
  if (typeof value.displayName !== 'string' || typeof value.shortName !== 'string') return false;
  if (!isRecord(value.coordinates)) return false;
  return isFiniteNumber(value.coordinates.lat) && isFiniteNumber(value.coordinates.lon);
}

/**
 * Validate a stored record before it reaches the UI. localStorage can contain
 * data written by an older schema, a manual edit, or a partially failed write;
 * a single malformed object must never crash the history or impact pages.
 */
function isSavedTrip(value: unknown): value is SavedTrip {
  if (!isRecord(value)) return false;

  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  if (!isFiniteNumber(value.timestamp) || typeof value.formattedDate !== 'string') return false;
  if (!isLocationResult(value.origin) || !isLocationResult(value.destination)) return false;
  if (!isTravelMode(value.selectedMode) || !isTravelMode(value.baselineMode)) return false;
  if (typeof value.selectedModeLabel !== 'string') return false;
  if (!isFiniteNumber(value.distanceKm) || !isFiniteNumber(value.durationMinutes)) return false;
  if (value.cost !== null && !isFiniteNumber(value.cost)) return false;
  if (typeof value.currencySymbol !== 'string') return false;
  if (!isFiniteNumber(value.co2Kg) || !isFiniteNumber(value.baselineCo2Kg)) return false;
  if (!isFiniteNumber(value.co2SavedKg) || typeof value.methodologySummary !== 'string') return false;

  if (value.vehicleConfig !== undefined) {
    const vehicle = value.vehicleConfig;
    if (!isRecord(vehicle)) return false;
    if (
      typeof vehicle.categoryLabel !== 'string' ||
      typeof vehicle.fuelLabel !== 'string' ||
      !isFiniteNumber(vehicle.efficiencyValue) ||
      (vehicle.efficiencyUnit !== 'km/L' && vehicle.efficiencyUnit !== 'kWh/km')
    ) {
      return false;
    }
  }

  return true;
}

export class HistoryService {
  /**
   * Retrieves all actual completed trips from localStorage.
   * STRICT POLICY: Never returns seed or synthetic demo trips.
   * If empty, returns an empty array [].
   */
  getTrips(): SavedTrip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter(isSavedTrip) : [];
    } catch {
      return [];
    }
  }

  /**
   * Persists an authentic completed route calculation.
   */
  saveTrip(trip: SavedTrip): void {
    const current = this.getTrips();
    // Prepend latest trip
    const updated = [trip, ...current.filter((t) => t.id !== trip.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Delete a single trip by ID
   */
  deleteTrip(tripId: string): void {
    const current = this.getTrips();
    const updated = current.filter((t) => t.id !== tripId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Clear all stored trip history
   */
  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Compute actual statistics purely from the user's logged real trips.
   * If there are no trips, returns 0s for every field (no fake numbers).
   */
  getAggregatedStats(): HistoryStats {
    const trips = this.getTrips();

    const emptyBreakdown: Record<TravelMode, { tripsCount: number; totalDistanceKm: number; totalCo2Kg: number }> = {
      car: { tripsCount: 0, totalDistanceKm: 0, totalCo2Kg: 0 },
      motorcycle: { tripsCount: 0, totalDistanceKm: 0, totalCo2Kg: 0 },
      bus: { tripsCount: 0, totalDistanceKm: 0, totalCo2Kg: 0 },
      metro_train: { tripsCount: 0, totalDistanceKm: 0, totalCo2Kg: 0 },
      cycling: { tripsCount: 0, totalDistanceKm: 0, totalCo2Kg: 0 },
      walking: { tripsCount: 0, totalDistanceKm: 0, totalCo2Kg: 0 },
    };

    if (trips.length === 0) {
      return {
        totalTrips: 0,
        totalDistanceKm: 0,
        totalCo2EmittedKg: 0,
        totalCo2SavedKg: 0,
        treesAbsorptionEquivalent: 0,
        modeBreakdown: emptyBreakdown,
      };
    }

    let totalDistanceKm = 0;
    let totalCo2EmittedKg = 0;
    let totalCo2SavedKg = 0;
    const modeBreakdown = { ...emptyBreakdown };

    for (const trip of trips) {
      totalDistanceKm += trip.distanceKm;
      totalCo2EmittedKg += trip.co2Kg;
      totalCo2SavedKg += trip.co2SavedKg;

      const m = trip.selectedMode;
      if (modeBreakdown[m]) {
        modeBreakdown[m].tripsCount += 1;
        modeBreakdown[m].totalDistanceKm += trip.distanceKm;
        modeBreakdown[m].totalCo2Kg += trip.co2Kg;
      }
    }

    // Tree absorption equivalent: real kg saved / 21.77 kg/year
    const treesAbsorptionEquivalent = Number((totalCo2SavedKg / TREE_ANNUAL_CO2_SEQUESTRATION_KG).toFixed(2));

    return {
      totalTrips: trips.length,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      totalCo2EmittedKg: Number(totalCo2EmittedKg.toFixed(2)),
      totalCo2SavedKg: Number(totalCo2SavedKg.toFixed(2)),
      treesAbsorptionEquivalent,
      modeBreakdown,
    };
  }

  /**
   * Export all actual trips to JSON format
   */
  exportToJson(): string {
    return JSON.stringify(this.getTrips(), null, 2);
  }

  /**
   * Export all actual trips to CSV format for academic audits
   */
  exportToCsv(): string {
    const trips = this.getTrips();
    if (trips.length === 0) return '';

    const headers = [
      'Trip ID',
      'Date',
      'Origin',
      'Destination',
      'Mode',
      'Fuel / Powertrain',
      'Distance (km)',
      'Duration (min)',
      'Cost',
      'CO2 Emitted (kg)',
      'Baseline Mode',
      'CO2 Saved (kg)',
      'Methodology',
    ];

    const rows = trips.map((t) => {
      const powertrain = t.vehicleConfig
        ? `${t.vehicleConfig.categoryLabel} (${t.vehicleConfig.fuelLabel})`
        : t.selectedMode === 'bus' || t.selectedMode === 'metro_train'
        ? 'Public transit (corridor estimate)'
        : 'Human-powered / active travel';

      return [
        `"${t.id}"`,
        `"${t.formattedDate}"`,
        `"${t.origin.shortName.replace(/"/g, '""')}"`,
        `"${t.destination.shortName.replace(/"/g, '""')}"`,
        `"${t.selectedModeLabel}"`,
        `"${powertrain}"`,
        t.distanceKm.toFixed(2),
        t.durationMinutes,
        t.cost !== null ? `${t.currencySymbol}${t.cost.toFixed(2)}` : 'N/A',
        t.co2Kg.toFixed(3),
        `"${t.baselineMode}"`,
        t.co2SavedKg.toFixed(3),
        `"${t.methodologySummary.replace(/"/g, '""')}"`,
      ];
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const historyService = new HistoryService();
