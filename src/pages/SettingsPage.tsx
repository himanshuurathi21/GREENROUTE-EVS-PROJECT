import React, { useState } from 'react';
import {
  Settings,
  Coins,
  Globe,
  Database,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Compass,
  Bike,
  Footprints,
  Car,
  Bus,
} from 'lucide-react';
import { RegionalPricingConfig } from '../types/cost';
import { RegionalGridIntensity } from '../types/emissions';
import { REGIONAL_GRID_INTENSITIES } from '../data/gridIntensities';
import { DEFAULT_PRICING } from '../data/defaultPricing';
import { historyService } from '../services/history/historyService';
import { clearLegacyApiKey } from '../services/storage/preferences';
import { NumericInput } from '../components/common/NumericInput';

interface SettingsPageProps {
  pricingConfig: RegionalPricingConfig;
  onPricingChange: (pricing: RegionalPricingConfig) => void;
  gridIntensity: RegionalGridIntensity;
  onGridChange: (grid: RegionalGridIntensity) => void;
  onHistoryCleared: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  pricingConfig,
  onPricingChange,
  gridIntensity,
  onGridChange,
  onHistoryCleared,
}) => {
  const [saveToast, setSaveToast] = useState(false);

  const showSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleResetDefaults = () => {
    onPricingChange(DEFAULT_PRICING);
    onGridChange(REGIONAL_GRID_INTENSITIES[0]);
    clearLegacyApiKey();
    showSaveToast();
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to permanently clear all saved trips from localStorage?')) {
      historyService.clearHistory();
      onHistoryCleared();
      alert('Trip history cleared successfully.');
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-accent-dark/30 pb-5 pt-2">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-forest bg-accent px-2 py-0.5 rounded border border-accent-dark/40 mb-1.5">
          <Settings className="w-3.5 h-3.5" />
          <span>Application Preferences</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-dark">
          Regional Parameters & System Configuration
        </h1>
        <p className="text-xs text-mineral mt-0.5 max-w-xl leading-relaxed">
          Configure local electricity grid factors, domestic energy tariffs, and currency symbols.
          Your tariff, grid, and vehicle choices are saved automatically in this browser.
        </p>
      </div>

      {saveToast && (
        <div
          role="status"
          className="p-3 bg-accent text-forest-dark border border-forest/30 rounded text-xs font-medium flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 text-forest" />
          <span>Preferences reset to academic baselines.</span>
        </div>
      )}

      {/* Regional Grid Intensity Selection */}
      <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-accent-dark/30 pb-3">
          <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
            <Globe className="w-4 h-4 text-forest" />
            <span>Regional Electricity Generation Grid (EV Scope 2 Modeling)</span>
          </h3>
          <span className="text-[11px] font-mono text-forest font-bold">
            {gridIntensity.factorKgPerKwh.toFixed(3)} kg/kWh
          </span>
        </div>

        <p className="text-xs text-mineral leading-relaxed">
          Select your power jurisdiction to calibrate electric vehicle charging emissions. Electric vehicles in regions with high renewable penetration reflect substantially lower carbon intensities than coal-heavy grids.
        </p>

        <div className="space-y-2">
          {REGIONAL_GRID_INTENSITIES.map((grid) => {
            const isSelected = gridIntensity.id === grid.id;
            return (
              <label
                key={grid.id}
                className={`p-3.5 rounded-md border flex items-start justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-accent/40 border-forest/50'
                    : 'bg-canvas/50 border-accent-dark/40 hover:bg-canvas'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="gridIntensity"
                    checked={isSelected}
                    onChange={() => onGridChange(grid)}
                    className="mt-1 accent-forest"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-dark block">
                      {grid.regionName}
                    </span>
                    <span className="text-[11px] text-mineral block mt-0.5">
                      {grid.source} ({grid.year})
                    </span>
                  </div>
                </div>

                <span className="font-mono text-xs font-bold text-forest shrink-0 pl-3">
                  {grid.factorKgPerKwh.toFixed(3)} kg CO₂e/kWh
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Energy & Fuel Tariffs */}
      <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-accent-dark/30 pb-3">
          <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
            <Coins className="w-4 h-4 text-forest" />
            <span>Retail Energy Tariffs & Currency</span>
          </h3>
          <span className="text-xs text-mineral">Custom unit pricing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label htmlFor="petrol-price" className="text-mineral font-medium block mb-1">
              Petrol Price ({pricingConfig.currencySymbol}/L)
            </label>
            <NumericInput
              id="petrol-price"
              step="0.1"
              min={0.01}
              value={pricingConfig.petrolPricePerLiter}
              onValueCommit={(value) =>
                onPricingChange({
                  ...pricingConfig,
                  petrolPricePerLiter: value,
                  isCustomPricing: true,
                })
              }
              className="w-full px-3 py-2 bg-canvas border border-accent-dark/50 rounded focus:outline-none focus:ring-1 focus:ring-forest text-slate-dark font-medium"
            />
          </div>

          <div>
            <label htmlFor="diesel-price" className="text-mineral font-medium block mb-1">
              Diesel Price ({pricingConfig.currencySymbol}/L)
            </label>
            <NumericInput
              id="diesel-price"
              step="0.1"
              min={0.01}
              value={pricingConfig.dieselPricePerLiter}
              onValueCommit={(value) =>
                onPricingChange({
                  ...pricingConfig,
                  dieselPricePerLiter: value,
                  isCustomPricing: true,
                })
              }
              className="w-full px-3 py-2 bg-canvas border border-accent-dark/50 rounded focus:outline-none focus:ring-1 focus:ring-forest text-slate-dark font-medium"
            />
          </div>

          <div>
            <label htmlFor="electricity-tariff" className="text-mineral font-medium block mb-1">
              Electricity Tariff ({pricingConfig.currencySymbol}/kWh)
            </label>
            <NumericInput
              id="electricity-tariff"
              step="0.01"
              min={0.001}
              value={pricingConfig.electricityTariffPerKwh}
              onValueCommit={(value) =>
                onPricingChange({
                  ...pricingConfig,
                  electricityTariffPerKwh: value,
                  isCustomPricing: true,
                })
              }
              className="w-full px-3 py-2 bg-canvas border border-accent-dark/50 rounded focus:outline-none focus:ring-1 focus:ring-forest text-slate-dark font-medium"
            />
          </div>
        </div>
      </div>

      {/* Routing provider status — replaces the previously unused API-key field */}
      <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-accent-dark/30 pb-3">
          <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
            <Compass className="w-4 h-4 text-forest" />
            <span>Active Routing & Geocoding Providers</span>
          </h3>
          <span className="text-xs bg-accent text-forest px-2 py-0.5 rounded font-semibold border border-accent-dark/40 self-start sm:self-auto">
            No API key required
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-canvas rounded-md border border-accent-dark/40 space-y-2">
            <span className="font-semibold text-slate-dark block">Verified road & path routing</span>
            <ul className="space-y-1.5 text-mineral">
              <li className="flex items-center space-x-2"><Car className="w-3.5 h-3.5 text-forest" /><span>Car &amp; motorcycle — OSM FOSSGIS car graph</span></li>
              <li className="flex items-center space-x-2"><Bike className="w-3.5 h-3.5 text-forest" /><span>Cycling — dedicated OSM bicycle graph</span></li>
              <li className="flex items-center space-x-2"><Footprints className="w-3.5 h-3.5 text-forest" /><span>Walking — dedicated OSM foot graph</span></li>
            </ul>
          </div>

          <div className="p-3.5 bg-canvas rounded-md border border-accent-dark/40 space-y-2">
            <span className="font-semibold text-slate-dark block">What is not connected</span>
            <p className="text-mineral leading-relaxed flex items-start space-x-2">
              <Bus className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
              <span>
                Live bus/metro schedules, geometry, and fares require a GTFS or transit API
                credential. GreenRoute shows a clearly labelled carbon-only corridor estimate
                instead of inventing routes or fares.
              </span>
            </p>
          </div>
        </div>

        <p className="text-[11px] text-mineral">
          Geocoding: OpenStreetMap Nominatim, rate-limited to one request per second.
        </p>
      </div>

      {/* Data Management & Reset */}
      <div className="bg-white rounded-lg border border-accent-dark/50 p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-accent-dark/30 pb-3">
          <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
            <Database className="w-4 h-4 text-forest" />
            <span>Local Storage & System Reset</span>
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-slate-dark">Reset System Parameters to Academic Baselines</p>
            <p className="text-mineral text-[11px] mt-0.5">Restores the India CEA grid intensity and standard retail fuel tariffs. Vehicle settings are unchanged.</p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-1.5 bg-canvas border border-accent-dark/60 text-mineral-dark hover:text-slate-dark rounded font-medium flex items-center space-x-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-3 border-t border-accent-dark/20">
          <div>
            <p className="font-semibold text-red-700">Clear All Completed Calculation Records</p>
            <p className="text-mineral text-[11px] mt-0.5">Permanently deletes all saved trips from your browser&apos;s localStorage.</p>
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            className="px-3.5 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded font-medium flex items-center space-x-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
