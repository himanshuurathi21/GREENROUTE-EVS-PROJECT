import { RegionalGridIntensity } from '../types/emissions';

/**
 * Authoritative regional electricity grid carbon intensity factors.
 * Used to compute real indirect (Scope 2) EV charging emissions:
 * Emissions (kg CO2) = Distance (km) * EV Efficiency (kWh/km) * Grid Factor (kg CO2/kWh)
 */
export const REGIONAL_GRID_INTENSITIES: RegionalGridIntensity[] = [
  {
    id: 'in_national',
    regionName: 'India (National Grid Average - NEWNE & SR Integrated)',
    country: 'India',
    factorKgPerKwh: 0.716, // 716 gCO2/kWh
    source: 'Central Electricity Authority (CEA) of India, CO2 Baseline Database for the Indian Power Sector, Version 19.0',
    sourceUrl: 'https://cea.nic.in/cdm-co2-baseline-database/',
    year: '2023-2024',
    description: 'Weighted average grid emission factor for the combined Indian national electricity grid, predominantly thermal generation mix.',
  },
  {
    id: 'us_national',
    regionName: 'United States (eGRID National Average)',
    country: 'United States',
    factorKgPerKwh: 0.386, // ~852 lbs/MWh = 0.386 kg/kWh
    source: 'US Environmental Protection Agency (EPA) Emissions & Generation Resource Integrated Database (eGRID 2022/2024)',
    sourceUrl: 'https://www.epa.gov/egrid',
    year: '2024',
    description: 'US national annual net generation average carbon intensity accounting for coal, natural gas, nuclear, and renewables.',
  },
  {
    id: 'uk_national',
    regionName: 'United Kingdom (National Grid / DESNZ)',
    country: 'United Kingdom',
    factorKgPerKwh: 0.207,
    source: 'UK Department for Energy Security and Net Zero (DESNZ) GHG Conversion Factors 2024',
    sourceUrl: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
    year: '2024',
    description: 'UK grid electricity factor including transmission and distribution losses, reflecting high offshore wind and low-coal generation.',
  },
  {
    id: 'eu_average',
    regionName: 'European Union (EEA Member States Average)',
    country: 'European Union',
    factorKgPerKwh: 0.251,
    source: 'European Environment Agency (EEA) Greenhouse Gas Emission Intensity of Electricity Generation',
    sourceUrl: 'https://www.eea.europa.eu/en/analysis/indicators/greenhouse-gas-emission-intensity-of-electricity-generation',
    year: '2023',
    description: 'Average greenhouse gas intensity of electricity generation across the EU-27 member states.',
  },
  {
    id: 'global_average',
    regionName: 'World Global Average (IEA)',
    country: 'Global',
    factorKgPerKwh: 0.475,
    source: 'International Energy Agency (IEA) World Energy Outlook and Global Carbon Intensity Tracker',
    sourceUrl: 'https://www.iea.org/reports/emissions-measurement-and-reporting',
    year: '2023',
    description: 'Global weighted average electricity generation carbon intensity.',
  },
  {
    id: 'renewable_certified',
    regionName: '100% Certified Dedicated Renewable (Solar / Wind Lifecycle)',
    country: 'Global Renewable',
    factorKgPerKwh: 0.025,
    source: 'IPCC AR6 WGIII Transport and Energy Systems Chapter (Lifecycle LCA)',
    sourceUrl: 'https://www.ipcc.ch/report/ar6/wg3/',
    year: '2023',
    description: 'Life-cycle embodied emissions associated with solar photovoltaic and wind turbine manufacturing, balance of plant, and maintenance (direct operation = 0).',
  },
];

export const DEFAULT_GRID_INTENSITY = REGIONAL_GRID_INTENSITIES[0]; // India national default for college EVS project, fully customizable
