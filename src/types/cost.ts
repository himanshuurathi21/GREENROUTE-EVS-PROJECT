import { TravelMode } from './routing';

export interface RegionalPricingConfig {
  currencySymbol: string;
  currencyCode: string;
  petrolPricePerLiter: number;
  dieselPricePerLiter: number;
  electricityTariffPerKwh: number;
  isCustomPricing: boolean;
}

export interface ModeCostResult {
  mode: TravelMode;
  modeLabel: string;
  cost: number | null;
  formattedCost: string;
  isAvailable: boolean;
  unavailableReason?: string;
  costBreakdown: string;
  unitPriceUsed?: string;
}
