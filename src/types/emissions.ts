import { TravelMode } from './routing';

export type EmissionScope = 'Scope 1 (Direct Combustion)' | 'Scope 2 (Grid Electricity)' | 'Scope 3 (Lifecycle / Well-to-Wheel / Passenger-Km)';

export interface AuthoritativeFactor {
  id: string;
  name: string;
  category: 'fuel_combustion' | 'electricity_grid' | 'public_transit' | 'active_travel';
  value: number;
  unit: string;
  source: string;
  sourceUrl: string;
  versionDate: string;
  scope: EmissionScope;
  description: string;
}

export interface RegionalGridIntensity {
  id: string;
  regionName: string;
  country: string;
  factorKgPerKwh: number;
  source: string;
  sourceUrl: string;
  year: string;
  description: string;
}

export interface ModeEmissionResult {
  mode: TravelMode;
  modeLabel: string;
  totalCo2Kg: number;
  co2GramsPerKm: number;
  energyOrFuelConsumed: number;
  energyOrFuelUnit: string;
  isEstimate: boolean;
  estimationDisclaimer?: string;
  factorUsed: {
    name: string;
    value: number;
    unit: string;
    source: string;
    sourceUrl: string;
  };
  gridFactorUsed?: {
    regionName: string;
    value: number;
    unit: string;
    source: string;
  };
}
