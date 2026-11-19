import React, { useState } from 'react';
import { Car, Bike, Fuel, Zap, HelpCircle } from 'lucide-react';
import { FuelType, VehicleCategory, VehicleConfig, VehicleType } from '../../types/vehicle';
import { VEHICLE_PRESETS } from '../../data/vehiclePresets';
import { NumericInput } from '../common/NumericInput';

interface VehicleSelectorProps {
  config: VehicleConfig;
  onChange: (config: VehicleConfig) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({ config, onChange }) => {
  const [showPresetsHelp, setShowPresetsHelp] = useState(false);

  // Handle vehicle type switch (Car vs Motorcycle)
  const handleTypeChange = (newType: VehicleType) => {
    if (newType === config.type) return;

    if (newType === 'motorcycle') {
      const preset = VEHICLE_PRESETS.find((p) => p.id === 'motorcycle_petrol')!;
      onChange({
        type: 'motorcycle',
        category: 'motorcycle',
        categoryLabel: preset.categoryLabel,
        fuelType: preset.fuelType,
        fuelLabel: preset.fuelLabel,
        efficiencyValue: preset.defaultEfficiency,
        efficiencyUnit: preset.unit,
        isCustomEfficiency: false,
        notes: `Baseline standard: ${preset.defaultEfficiency} km/L`,
      });
    } else {
      const preset = VEHICLE_PRESETS.find((p) => p.id === 'sedan_petrol')!;
      onChange({
        type: 'car',
        category: 'sedan',
        categoryLabel: preset.categoryLabel,
        fuelType: preset.fuelType,
        fuelLabel: preset.fuelLabel,
        efficiencyValue: preset.defaultEfficiency,
        efficiencyUnit: preset.unit,
        isCustomEfficiency: false,
        notes: `Baseline standard: ${preset.defaultEfficiency} km/L`,
      });
    }
  };

  // Handle category change (Small Car, Sedan, SUV)
  const handleCategoryChange = (newCategory: VehicleCategory) => {
    // Find matching preset for current fuel type or default to petrol
    const matchingPreset = VEHICLE_PRESETS.find(
      (p) => p.type === config.type && p.category === newCategory && p.fuelType === config.fuelType
    ) || VEHICLE_PRESETS.find(
      (p) => p.type === config.type && p.category === newCategory
    )!;

    onChange({
      ...config,
      category: newCategory,
      categoryLabel: matchingPreset.categoryLabel,
      fuelType: matchingPreset.fuelType,
      fuelLabel: matchingPreset.fuelLabel,
      efficiencyValue: matchingPreset.defaultEfficiency,
      efficiencyUnit: matchingPreset.unit,
      isCustomEfficiency: false,
      notes: `Baseline standard: ${matchingPreset.defaultEfficiency} ${matchingPreset.unit}`,
    });
  };

  // Handle fuel type change
  const handleFuelChange = (newFuel: FuelType) => {
    const matchingPreset = VEHICLE_PRESETS.find(
      (p) => p.type === config.type && p.category === config.category && p.fuelType === newFuel
    ) || VEHICLE_PRESETS.find(
      (p) => p.type === config.type && p.fuelType === newFuel
    );

    const defaultVal = matchingPreset ? matchingPreset.defaultEfficiency : (newFuel === 'electric' ? 0.16 : 15.0);
    const unit = newFuel === 'electric' ? 'kWh/km' : 'km/L';

    onChange({
      ...config,
      fuelType: newFuel,
      fuelLabel:
        newFuel === 'electric'
          ? 'Electric (EV)'
          : newFuel === 'hybrid'
          ? 'Hybrid'
          : newFuel === 'diesel'
          ? 'Diesel'
          : 'Petrol',
      efficiencyValue: defaultVal,
      efficiencyUnit: unit,
      isCustomEfficiency: false,
      notes: `Baseline standard: ${defaultVal} ${unit}`,
    });
  };

  // A positive minimum prevents a typed value such as "0.0004" from rounding
  // down to zero, which would make the emissions calculation throw.
  const handleEfficiencyCommit = (value: number) => {
    onChange({
      ...config,
      efficiencyValue: value,
      isCustomEfficiency: true,
      notes: `User-specified actual efficiency: ${value} ${config.efficiencyUnit}`,
    });
  };

  const isElectric = config.fuelType === 'electric';

  return (
    <div className="bg-white rounded-lg border border-accent-dark/50 p-5 space-y-4 shadow-subtle">
      <div className="flex items-center justify-between border-b border-accent-dark/30 pb-3">
        <h3 className="text-sm font-semibold text-slate-dark uppercase tracking-wider flex items-center space-x-2">
          <Fuel className="w-4 h-4 text-forest" />
          <span>Vehicle Specification & Efficiency</span>
        </h3>
        <button
          type="button"
          onClick={() => setShowPresetsHelp(!showPresetsHelp)}
          className="text-xs text-mineral hover:text-forest flex items-center space-x-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Baseline Standards</span>
        </button>
      </div>

      {showPresetsHelp && (
        <div className="bg-canvas p-3 rounded-md text-xs text-mineral space-y-2 border border-accent-dark/40">
          <p className="font-medium text-slate-dark">Regulatory Baseline Standards (ARAI / EPA / WLTP):</p>
          <p>
            You can enter your exact real-world vehicle mileage or electricity consumption. If you do not know your exact mileage, certified regulatory averages are provided for transparency.
          </p>
        </div>
      )}

      {/* Primary Vehicle Type (Car vs Motorcycle) */}
      <div>
        <label className="text-xs text-mineral font-medium block mb-1.5">Vehicle Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange('car')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
              config.type === 'car'
                ? 'bg-forest text-white border-forest'
                : 'bg-canvas text-mineral-dark border-accent-dark/50 hover:border-forest/40'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Personal Car</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('motorcycle')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
              config.type === 'motorcycle'
                ? 'bg-forest text-white border-forest'
                : 'bg-canvas text-mineral-dark border-accent-dark/50 hover:border-forest/40'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Motorcycle / Scooter</span>
          </button>
        </div>
      </div>

      {/* Vehicle Category (Only for Cars) */}
      {config.type === 'car' && (
        <div>
          <label className="text-xs text-mineral font-medium block mb-1.5">Vehicle Category</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'small_car', label: 'Small Car' },
              { id: 'sedan', label: 'Sedan' },
              { id: 'suv', label: 'SUV / Crossover' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id as VehicleCategory)}
                className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                  config.category === cat.id
                    ? 'bg-accent text-forest-dark border-forest/60 font-semibold'
                    : 'bg-white text-mineral-dark border-accent-dark/40 hover:bg-canvas'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Powertrain / Fuel Type */}
      <div>
        <label className="text-xs text-mineral font-medium block mb-1.5">Powertrain / Fuel</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(config.type === 'car'
            ? [
                { id: 'petrol', label: 'Petrol' },
                { id: 'diesel', label: 'Diesel' },
                { id: 'hybrid', label: 'Strong Hybrid' },
                { id: 'electric', label: 'Electric (EV)' },
              ]
            : [
                { id: 'petrol', label: 'Petrol' },
                { id: 'electric', label: 'Electric (EV)' },
              ]
          ).map((fuel) => (
            <button
              key={fuel.id}
              type="button"
              onClick={() => handleFuelChange(fuel.id as FuelType)}
              className={`py-1.5 px-2 rounded text-xs font-medium border flex items-center justify-center space-x-1 transition-colors ${
                config.fuelType === fuel.id
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-mineral-dark border-accent-dark/40 hover:bg-canvas'
              }`}
            >
              {fuel.id === 'electric' ? <Zap className="w-3 h-3 text-accent" /> : <Fuel className="w-3 h-3" />}
              <span>{fuel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User Input: Exact Efficiency & Mileage */}
      <div className="bg-canvas p-3.5 rounded-md border border-accent-dark/40">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-dark">
            {isElectric ? 'Actual EV Consumption Rate' : 'Actual Vehicle Fuel Mileage'}
          </label>
          <span className="text-[11px] font-semibold text-forest">
            {config.efficiencyValue} {config.efficiencyUnit}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <NumericInput
            inputMode="decimal"
            step={isElectric ? '0.001' : '0.1'}
            min={0.001}
            max={200}
            value={config.efficiencyValue}
            onValueCommit={handleEfficiencyCommit}
            aria-label={isElectric ? 'EV consumption rate in kWh per km' : 'Vehicle mileage in km per litre'}
            className="w-32 px-3 py-1.5 bg-white border border-accent-dark/60 rounded text-sm text-slate-dark font-medium focus:outline-none focus:ring-1 focus:ring-forest"
          />
          <span className="text-xs text-mineral font-medium">{config.efficiencyUnit}</span>
          <span className="text-[11px] text-mineral pl-2">
            {config.isCustomEfficiency ? '(User-specified actual)' : '(Standard baseline)'}
          </span>
        </div>

        <p className="text-[11px] text-mineral mt-2 leading-tight">
          {isElectric
            ? 'Energy efficiency in kilowatt-hours per km. Typical EVs consume 0.13 - 0.20 kWh/km.'
            : 'Kilometers per liter of fuel. Used directly in stoichiometric CO₂ combustion formulas.'}
        </p>
      </div>
    </div>
  );
};
