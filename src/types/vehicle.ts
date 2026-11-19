export type VehicleType = 'car' | 'motorcycle';

export type VehicleCategory = 'small_car' | 'sedan' | 'suv' | 'motorcycle';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export interface VehicleConfig {
  type: VehicleType;
  category: VehicleCategory;
  categoryLabel: string;
  fuelType: FuelType;
  fuelLabel: string;
  // User can enter their actual vehicle efficiency
  efficiencyValue: number; // km/L for liquid fuel/hybrid, kWh/km for electric
  efficiencyUnit: 'km/L' | 'kWh/km';
  isCustomEfficiency: boolean;
  notes?: string;
}

export interface VehiclePreset {
  id: string;
  type: VehicleType;
  category: VehicleCategory;
  categoryLabel: string;
  fuelType: FuelType;
  fuelLabel: string;
  defaultEfficiency: number;
  unit: 'km/L' | 'kWh/km';
  description: string;
  realWorldRange: string;
  source: string;
}
