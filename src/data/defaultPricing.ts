import { RegionalPricingConfig } from '../types/cost';

export const REGIONAL_PRICING_PRESETS: Record<string, RegionalPricingConfig & { name: string }> = {
  in: {
    name: 'India (INR ₹)',
    currencySymbol: '₹',
    currencyCode: 'INR',
    petrolPricePerLiter: 96.72, // Current typical retail price in Delhi/NCR
    dieselPricePerLiter: 89.62,
    electricityTariffPerKwh: 7.50, // Typical domestic mid-tier slab
    isCustomPricing: false,
  },
  us: {
    name: 'United States (USD $)',
    currencySymbol: '$',
    currencyCode: 'USD',
    petrolPricePerLiter: 0.95, // ~$3.60 per gallon
    dieselPricePerLiter: 1.05, // ~$3.95 per gallon
    electricityTariffPerKwh: 0.16, // US residential average $/kWh
    isCustomPricing: false,
  },
  uk: {
    name: 'United Kingdom (GBP £)',
    currencySymbol: '£',
    currencyCode: 'GBP',
    petrolPricePerLiter: 1.45,
    dieselPricePerLiter: 1.52,
    electricityTariffPerKwh: 0.24, // Standard variable tariff cap
    isCustomPricing: false,
  },
  eu: {
    name: 'European Union (EUR €)',
    currencySymbol: '€',
    currencyCode: 'EUR',
    petrolPricePerLiter: 1.82,
    dieselPricePerLiter: 1.74,
    electricityTariffPerKwh: 0.28,
    isCustomPricing: false,
  },
};

// Strip the display-only preset label so the default config matches the exact
// persisted shape and does not leak extra metadata into application state.
export const DEFAULT_PRICING: RegionalPricingConfig = {
  currencySymbol: REGIONAL_PRICING_PRESETS.in.currencySymbol,
  currencyCode: REGIONAL_PRICING_PRESETS.in.currencyCode,
  petrolPricePerLiter: REGIONAL_PRICING_PRESETS.in.petrolPricePerLiter,
  dieselPricePerLiter: REGIONAL_PRICING_PRESETS.in.dieselPricePerLiter,
  electricityTariffPerKwh: REGIONAL_PRICING_PRESETS.in.electricityTariffPerKwh,
  isCustomPricing: REGIONAL_PRICING_PRESETS.in.isCustomPricing,
};
