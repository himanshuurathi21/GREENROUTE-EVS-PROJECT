import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PRICING } from '../data/defaultPricing';
import {
  DEFAULT_GRID_INTENSITY,
  REGIONAL_GRID_INTENSITIES,
} from '../data/gridIntensities';
import { DEFAULT_VEHICLE_CONFIG } from '../data/vehiclePresets';
import {
  clearLegacyApiKey,
  loadGridIntensity,
  loadPricingConfig,
  loadVehicleConfig,
  saveGridIntensity,
  savePricingConfig,
  saveVehicleConfig,
} from '../services/storage/preferences';

describe('preferences storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('vehicle config', () => {
    it('returns the default when nothing is stored', () => {
      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('round-trips a valid vehicle config', () => {
      const custom = {
        ...DEFAULT_VEHICLE_CONFIG,
        efficiencyValue: 19.5,
        isCustomEfficiency: true,
      };

      saveVehicleConfig(custom);

      expect(loadVehicleConfig()).toEqual(custom);
    });

    it('falls back when JSON is corrupt', () => {
      localStorage.setItem('greenroute_vehicle_config_v1', 'not-json-at-all');

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('falls back when required fields are invalid', () => {
      localStorage.setItem(
        'greenroute_vehicle_config_v1',
        JSON.stringify({ ...DEFAULT_VEHICLE_CONFIG, type: 'spaceship' })
      );

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('falls back on a non-positive efficiency value', () => {
      localStorage.setItem(
        'greenroute_vehicle_config_v1',
        JSON.stringify({ ...DEFAULT_VEHICLE_CONFIG, efficiencyValue: 0 })
      );

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('rejects an unknown efficiency unit', () => {
      localStorage.setItem(
        'greenroute_vehicle_config_v1',
        JSON.stringify({ ...DEFAULT_VEHICLE_CONFIG, efficiencyUnit: 'miles per gallon' })
      );

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('rejects an electric vehicle stored with a km/L unit', () => {
      localStorage.setItem(
        'greenroute_vehicle_config_v1',
        JSON.stringify({
          ...DEFAULT_VEHICLE_CONFIG,
          fuelType: 'electric',
          fuelLabel: 'Electric (EV)',
          efficiencyUnit: 'km/L',
        })
      );

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('rejects a combustion vehicle stored with a kWh/km unit', () => {
      localStorage.setItem(
        'greenroute_vehicle_config_v1',
        JSON.stringify({ ...DEFAULT_VEHICLE_CONFIG, efficiencyUnit: 'kWh/km' })
      );

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('rejects a category that does not match the vehicle type', () => {
      localStorage.setItem(
        'greenroute_vehicle_config_v1',
        JSON.stringify({ ...DEFAULT_VEHICLE_CONFIG, type: 'motorcycle' })
      );

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('rejects a diesel motorcycle profile that does not exist in the presets', () => {
      localStorage.setItem(
        'greenroute_vehicle_config_v1',
        JSON.stringify({
          ...DEFAULT_VEHICLE_CONFIG,
          type: 'motorcycle',
          category: 'motorcycle',
          categoryLabel: 'Motorcycle / Scooter',
          fuelType: 'diesel',
          fuelLabel: 'Diesel',
        })
      );

      expect(loadVehicleConfig()).toEqual(DEFAULT_VEHICLE_CONFIG);
    });

    it('accepts a valid electric motorcycle profile', () => {
      const electricMotorcycle = {
        type: 'motorcycle',
        category: 'motorcycle',
        categoryLabel: 'Motorcycle / Scooter',
        fuelType: 'electric',
        fuelLabel: 'Electric Scooter (EV)',
        efficiencyValue: 0.038,
        efficiencyUnit: 'kWh/km',
        isCustomEfficiency: false,
      };

      localStorage.setItem('greenroute_vehicle_config_v1', JSON.stringify(electricMotorcycle));

      expect(loadVehicleConfig()).toEqual(expect.objectContaining(electricMotorcycle));
    });

    it('does not throw when storage write fails', () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('quota exceeded');
      };

      try {
        expect(() => saveVehicleConfig(DEFAULT_VEHICLE_CONFIG)).not.toThrow();
      } finally {
        Storage.prototype.setItem = original;
      }
    });
  });

  describe('pricing config', () => {
    it('returns the default when nothing is stored', () => {
      expect(loadPricingConfig()).toEqual(DEFAULT_PRICING);
    });

    it('round-trips a valid custom pricing config', () => {
      const custom = {
        currencySymbol: '$',
        currencyCode: 'USD',
        petrolPricePerLiter: 1.1,
        dieselPricePerLiter: 1.2,
        electricityTariffPerKwh: 0.2,
        isCustomPricing: true,
      };

      savePricingConfig(custom);

      // Only the documented pricing fields are persisted; display-only preset
      // metadata such as `name` must not leak back out of storage.
      expect(loadPricingConfig()).toEqual(custom);
    });

    it('falls back when a tariff is zero or negative', () => {
      localStorage.setItem(
        'greenroute_pricing_v1',
        JSON.stringify({ ...DEFAULT_PRICING, petrolPricePerLiter: 0 })
      );

      expect(loadPricingConfig()).toEqual(DEFAULT_PRICING);
    });

    it('falls back when the currency symbol is missing', () => {
      localStorage.setItem(
        'greenroute_pricing_v1',
        JSON.stringify({ ...DEFAULT_PRICING, currencySymbol: '' })
      );

      expect(loadPricingConfig()).toEqual(DEFAULT_PRICING);
    });
  });

  describe('grid intensity', () => {
    it('returns the India default when nothing is stored', () => {
      expect(loadGridIntensity()).toEqual(DEFAULT_GRID_INTENSITY);
    });

    it('round-trips a selected grid', () => {
      const uk = REGIONAL_GRID_INTENSITIES.find((grid) => grid.id === 'uk_national')!;

      saveGridIntensity(uk);

      expect(loadGridIntensity()).toEqual(uk);
    });

    it('falls back when the stored id is unknown', () => {
      localStorage.setItem('greenroute_grid_id_v1', 'atlantis_grid');

      expect(loadGridIntensity()).toEqual(DEFAULT_GRID_INTENSITY);
    });
  });

  it('removes the legacy OpenRouteService API key', () => {
    localStorage.setItem('greenroute_ors_api_key', 'legacy-secret');

    clearLegacyApiKey();

    expect(localStorage.getItem('greenroute_ors_api_key')).toBeNull();
  });
});
