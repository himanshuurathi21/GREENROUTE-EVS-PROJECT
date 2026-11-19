import { AuthoritativeFactor } from '../types/emissions';

/**
 * Authoritative greenhouse gas emission factors compiled from official government
 * and international scientific publications.
 * Every factor includes verifiable source URL, exact unit, and publication date.
 */
export const AUTHORITATIVE_EMISSION_FACTORS: Record<string, AuthoritativeFactor> = {
  petrol_combustion: {
    id: 'petrol_combustion',
    name: 'Petrol (Motor Gasoline) Direct Combustion',
    category: 'fuel_combustion',
    value: 2.3144, // kg CO2e per liter
    unit: 'kg CO₂e / liter',
    source: 'UK DESNZ / DEFRA Greenhouse Gas Reporting: Conversion Factors 2024',
    sourceUrl: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
    versionDate: 'June 2024',
    scope: 'Scope 1 (Direct Combustion)',
    description: 'Direct tailpipe emissions resulting from complete combustion of 1 liter of standard retail petrol (E10 blend). Corroborated by US EPA GHG Hub (2.348 kg CO2/L).',
  },
  diesel_combustion: {
    id: 'diesel_combustion',
    name: 'Diesel (Automotive Gas Oil) Direct Combustion',
    category: 'fuel_combustion',
    value: 2.6841, // kg CO2e per liter
    unit: 'kg CO₂e / liter',
    source: 'UK DESNZ / DEFRA Greenhouse Gas Reporting: Conversion Factors 2024',
    sourceUrl: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
    versionDate: 'June 2024',
    scope: 'Scope 1 (Direct Combustion)',
    description: 'Direct tailpipe emissions resulting from complete combustion of 1 liter of automotive diesel fuel (B7 blend). Corroborated by US EPA GHG Hub (2.689 kg CO2/L).',
  },
  bus_passenger_km: {
    id: 'bus_passenger_km',
    name: 'Average Urban Transit Bus (Per Passenger)',
    category: 'public_transit',
    value: 0.0965, // kg CO2e per passenger-km
    unit: 'kg CO₂e / passenger-km',
    source: 'UK DESNZ / DEFRA GHG Conversion Factors 2024 (Local Bus Average)',
    sourceUrl: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
    versionDate: 'June 2024',
    scope: 'Scope 3 (Lifecycle / Well-to-Wheel / Passenger-Km)',
    description: 'Estimated fleet average accounting for standard urban occupancy (~10-15 passengers per bus). Stated as an authoritative estimate since actual route-specific load factors vary.',
  },
  metro_rail_passenger_km: {
    id: 'metro_rail_passenger_km',
    name: 'Electric Urban Rapid Transit / Metro (Per Passenger)',
    category: 'public_transit',
    value: 0.0286, // kg CO2e per passenger-km
    unit: 'kg CO₂e / passenger-km',
    source: 'UK DESNZ 2024 (Light Rail and Tram) & Delhi Metro DMRC Environmental Audit',
    sourceUrl: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
    versionDate: '2024',
    scope: 'Scope 3 (Lifecycle / Well-to-Wheel / Passenger-Km)',
    description: 'Average per-passenger emissions for high-efficiency electric metro systems, dependent on regenerative braking and local grid electricity mix.',
  },
  active_travel: {
    id: 'active_travel',
    name: 'Zero Direct Operational Travel (Walking / Cycling)',
    category: 'active_travel',
    value: 0.0000,
    unit: 'kg CO₂e / km',
    source: 'IPCC AR6 Working Group III: Transport Chapter (Direct Operational Emissions)',
    sourceUrl: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/',
    versionDate: '2022 / 2023',
    scope: 'Scope 1 (Direct Combustion)',
    description: 'Walking and human-powered cycling generate 0 grams direct tailpipe or operational greenhouse gas emissions. Upstream dietary caloric lifecycle discussed in methodology.',
  },
};

/**
 * Forestry absorption benchmark:
 * According to European Environment Agency (EEA) and Arbor Day Foundation / US Forest Service research,
 * a standard mature tree in an urban/suburban setting sequesters on average approximately 21.77 kg of CO₂ per year (~0.0596 kg per day).
 */
export const TREE_ANNUAL_CO2_SEQUESTRATION_KG = 21.77;
export const TREE_SEQUESTRATION_SOURCE = 'European Environment Agency (EEA) & Arbor Day Foundation Forestry Carbon Guidelines';
