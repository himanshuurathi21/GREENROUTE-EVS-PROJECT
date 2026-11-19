import { LocationResult, TravelMode } from './routing';
import { VehicleConfig } from './vehicle';

export interface SavedTrip {
  id: string;
  timestamp: number;
  formattedDate: string;
  origin: LocationResult;
  destination: LocationResult;
  selectedMode: TravelMode;
  selectedModeLabel: string;
  vehicleConfig?: VehicleConfig;
  distanceKm: number;
  durationMinutes: number;
  cost: number | null;
  currencySymbol: string;
  co2Kg: number;
  baselineMode: TravelMode;
  baselineCo2Kg: number;
  co2SavedKg: number;
  methodologySummary: string;
  gridFactorUsed?: number;
  fuelEfficiencyUsed?: number;
}

export interface HistoryStats {
  totalTrips: number;
  totalDistanceKm: number;
  totalCo2EmittedKg: number;
  totalCo2SavedKg: number;
  treesAbsorptionEquivalent: number;
  modeBreakdown: Record<TravelMode, { tripsCount: number; totalDistanceKm: number; totalCo2Kg: number }>;
}
