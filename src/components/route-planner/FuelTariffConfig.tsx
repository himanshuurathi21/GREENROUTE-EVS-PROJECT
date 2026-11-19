import React from 'react';
import { Globe, Sliders } from 'lucide-react';
import { RegionalPricingConfig } from '../../types/cost';
import { RegionalGridIntensity } from '../../types/emissions';
import { REGIONAL_GRID_INTENSITIES } from '../../data/gridIntensities';
import { REGIONAL_PRICING_PRESETS } from '../../data/defaultPricing';
import { NumericInput } from '../common/NumericInput';

interface FuelTariffConfigProps {
  pricing: RegionalPricingConfig;
  onPricingChange: (pricing: RegionalPricingConfig) => void;
  gridIntensity: RegionalGridIntensity;
  onGridChange: (grid: RegionalGridIntensity) => void;
}

export const FuelTariffConfig: React.FC<FuelTariffConfigProps> = ({
  pricing,
  onPricingChange,
  gridIntensity,
  onGridChange,
}) => {
  const handlePresetSelect = (presetKey: string) => {
    const preset = REGIONAL_PRICING_PRESETS[presetKey];
    if (!preset) return;
    onPricingChange({
      currencySymbol: preset.currencySymbol,
      currencyCode: preset.currencyCode,
      petrolPricePerLiter: preset.petrolPricePerLiter,
      dieselPricePerLiter: preset.dieselPricePerLiter,
      electricityTariffPerKwh: preset.electricityTariffPerKwh,
      isCustomPricing: false,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-accent-dark/50 p-5 space-y-4 shadow-subtle">
      <div className="flex items-center justify-between border-b border-accent-dark/30 pb-3">
        <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-forest" />
          <span>Regional Energy Tariffs & Grid Mix</span>
        </h3>
        <span className="text-[11px] text-mineral">Real Unit Pricing</span>
      </div>

      {/* Region Presets */}
      <div>
        <label className="text-xs text-mineral font-medium block mb-1.5">Regional Currency Preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(REGIONAL_PRICING_PRESETS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePresetSelect(key)}
              className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                pricing.currencyCode === item.currencyCode && !pricing.isCustomPricing
                  ? 'bg-accent text-forest-dark border-forest/60 font-semibold'
                  : 'bg-canvas text-mineral-dark border-accent-dark/40 hover:bg-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Pricing Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-mineral block mb-1">
            Petrol Price ({pricing.currencySymbol}/L)
          </label>
          <NumericInput
            step="0.1"
            min={0.01}
            value={pricing.petrolPricePerLiter}
            onValueCommit={(value) =>
              onPricingChange({
                ...pricing,
                petrolPricePerLiter: value,
                isCustomPricing: true,
              })
            }
            className="w-full px-3 py-1.5 bg-canvas border border-accent-dark/50 rounded text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        <div>
          <label className="text-xs text-mineral block mb-1">
            Diesel Price ({pricing.currencySymbol}/L)
          </label>
          <NumericInput
            step="0.1"
            min={0.01}
            value={pricing.dieselPricePerLiter}
            onValueCommit={(value) =>
              onPricingChange({
                ...pricing,
                dieselPricePerLiter: value,
                isCustomPricing: true,
              })
            }
            className="w-full px-3 py-1.5 bg-canvas border border-accent-dark/50 rounded text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        <div>
          <label className="text-xs text-mineral block mb-1">
            Electricity Tariff ({pricing.currencySymbol}/kWh)
          </label>
          <NumericInput
            step="0.01"
            min={0.001}
            value={pricing.electricityTariffPerKwh}
            onValueCommit={(value) =>
              onPricingChange({
                ...pricing,
                electricityTariffPerKwh: value,
                isCustomPricing: true,
              })
            }
            className="w-full px-3 py-1.5 bg-canvas border border-accent-dark/50 rounded text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      </div>

      {/* Electricity Grid Factor Selection */}
      <div className="pt-2 border-t border-accent-dark/30">
        <label className="text-xs text-mineral font-medium block mb-1.5 flex items-center space-x-1">
          <Globe className="w-3.5 h-3.5 text-forest" />
          <span>Regional Electricity Grid Emission Factor (for EV Scope 2)</span>
        </label>
        <select
          value={gridIntensity.id}
          onChange={(e) => {
            const found = REGIONAL_GRID_INTENSITIES.find((g) => g.id === e.target.value);
            if (found) onGridChange(found);
          }}
          className="w-full px-3 py-2 bg-canvas border border-accent-dark/50 rounded text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-forest"
        >
          {REGIONAL_GRID_INTENSITIES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.regionName} — {g.factorKgPerKwh.toFixed(3)} kg CO₂e/kWh
            </option>
          ))}
        </select>
        <p className="text-[11px] text-mineral mt-1.5">
          Source: {gridIntensity.source} ({gridIntensity.year}).
        </p>
      </div>
    </div>
  );
};
