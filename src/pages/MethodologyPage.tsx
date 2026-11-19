import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  ExternalLink,
  Search,
  AlertCircle,
  FileText,
  Sliders,
  Compass,
} from 'lucide-react';
import { AUTHORITATIVE_EMISSION_FACTORS, TREE_ANNUAL_CO2_SEQUESTRATION_KG } from '../data/emissionFactors';
import { REGIONAL_GRID_INTENSITIES } from '../data/gridIntensities';

export const MethodologyPage: React.FC = () => {
  const [factorSearch, setFactorSearch] = useState('');

  const factors = Object.values(AUTHORITATIVE_EMISSION_FACTORS).filter(
    (f) =>
      f.name.toLowerCase().includes(factorSearch.toLowerCase()) ||
      f.source.toLowerCase().includes(factorSearch.toLowerCase()) ||
      f.scope.toLowerCase().includes(factorSearch.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="border-b border-accent-dark/30 pb-6 pt-2">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold text-forest bg-accent px-2.5 py-1 rounded border border-accent-dark/50 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real Data First Protocol & Methodological Audit</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-dark">
          Methodology, Scientific Models & Emission Factors
        </h1>
        <p className="text-sm text-mineral mt-2 leading-relaxed max-w-3xl">
          GreenRoute was engineered for the College Environmental Studies (EVS) curriculum under Sustainable Development & Climate Action. To maintain unassailable academic credibility, this document details every algorithmic equation, data source, and physical assumption used in the platform.
        </p>
      </div>

      {/* Section 1: Geographic Geocoding & Routing Engine */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-accent-dark/30 pb-2">
          <Compass className="w-4 h-4 text-forest" />
          <h2 className="text-base font-bold text-slate-dark uppercase tracking-wider">
            1. Spatial Geocoding & Network Routing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-mineral leading-relaxed">
          <div className="bg-white p-5 rounded-lg border border-accent-dark/50 space-y-2.5 shadow-subtle">
            <h3 className="font-semibold text-slate-dark text-sm">Real Geocoding via Nominatim</h3>
            <p>
              Addresses and landmark queries are resolved using the live <strong>OpenStreetMap Nominatim Geocoding API</strong>. Locations are converted into precise WGS-84 coordinate tuples <code>(latitude, longitude)</code>.
            </p>
            <p>
              GreenRoute implements a 450ms debounced input queue and respects the OpenStreetMap 1-request-per-second policy. If an ambiguous location is entered, the user must explicitly pick the intended coordinate from the live disambiguation dropdown.
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-accent-dark/50 space-y-2.5 shadow-subtle">
            <h3 className="font-semibold text-slate-dark text-sm">Mode-Specific OSRM Graph Routing</h3>
            <p>
              Distance and travel times are derived exclusively from the <strong>OpenStreetMap FOSSGIS OSRM</strong> service. GreenRoute calls the dedicated <code>routed-car</code>, <code>routed-bike</code>, and <code>routed-foot</code> graphs rather than asking one car graph to impersonate every mode.
            </p>
            <p>
              This distinction matters: the public OSRM demo server exposes only a car graph, so requesting a bicycle or foot profile there silently returns car geometry and car travel times. Dedicated graphs account for real road curvature, one-way systems, turn restrictions, cycle paths, footpaths, and mode-specific speeds.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Mathematical Fuel & Stoichiometric Formulas */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-accent-dark/30 pb-2">
          <FileText className="w-4 h-4 text-forest" />
          <h2 className="text-base font-bold text-slate-dark uppercase tracking-wider">
            2. Mathematical Equations for Fuel & Emissions
          </h2>
        </div>

        <div className="space-y-4 text-xs text-mineral">
          {/* Liquid Fuels */}
          <div className="bg-white p-5 rounded-lg border border-accent-dark/50 space-y-3 shadow-subtle">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-dark text-sm">
                Internal Combustion Engines (Petrol & Diesel)
              </h3>
              <span className="text-[11px] font-mono bg-accent px-2 py-0.5 rounded text-forest font-semibold">
                Scope 1 Tailpipe Combustion
              </span>
            </div>
            <p className="leading-relaxed">
              Fuel consumed is determined from the verified routing distance divided by the vehicle&apos;s real-world fuel economy (user-entered or regulatory baseline):
            </p>
            <div className="p-3 bg-canvas rounded font-mono text-[11px] text-slate-dark border border-accent-dark/40">
              Fuel Consumed (Liters) = Distance (km) ÷ Fuel Efficiency (km/L)
              <br />
              Tailpipe CO₂ (kg) = Fuel Consumed (Liters) × Direct Combustion Factor (kg CO₂e / L)
            </div>
            <p className="leading-relaxed">
              <strong>Factors Applied:</strong> Petrol = 2.3144 kg CO₂e/L, Diesel = 2.6841 kg CO₂e/L. Sourced from the UK Department for Energy Security and Net Zero (DESNZ) 2024 Conversion Factors.
            </p>
          </div>

          {/* Electric Vehicles */}
          <div className="bg-white p-5 rounded-lg border border-accent-dark/50 space-y-3 shadow-subtle">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-dark text-sm">
                Electric Vehicles (EV) – Non-Zero Indirect Emissions
              </h3>
              <span className="text-[11px] font-mono bg-accent px-2 py-0.5 rounded text-forest font-semibold">
                Scope 2 Grid Generation Mix
              </span>
            </div>
            <p className="leading-relaxed">
              <strong>Mandatory Academic Principle:</strong> In accordance with environmental engineering standards, EVs are NEVER treated as zero-emission vehicles. While tailpipe emissions are zero, upstream electricity generation produces greenhouse gases.
            </p>
            <div className="p-3 bg-canvas rounded font-mono text-[11px] text-slate-dark border border-accent-dark/40">
              Energy Consumed (kWh) = Distance (km) × EV Consumption Rate (kWh/km)
              <br />
              Indirect CO₂ (kg) = Energy Consumed (kWh) × Regional Grid Carbon Intensity (kg CO₂e / kWh)
            </div>
            <p className="leading-relaxed">
              Users can inspect and select their regional electricity generation grid (e.g., India CEA National Grid @ 0.716 kg/kWh, US eGRID National @ 0.386 kg/kWh, UK @ 0.207 kg/kWh, or 100% Certified Dedicated Solar/Wind @ 0.025 kg/kWh).
            </p>
          </div>

          {/* Active Travel */}
          <div className="bg-white p-5 rounded-lg border border-accent-dark/50 space-y-3 shadow-subtle">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-dark text-sm">
                Active Travel (Walking & Human-Powered Cycling)
              </h3>
              <span className="text-[11px] font-mono bg-accent px-2 py-0.5 rounded text-forest font-semibold">
                Zero Direct Operational
              </span>
            </div>
            <p className="leading-relaxed">
              Walking and cycling emit <strong>0.00 kg direct operational CO₂</strong>. While human respiration exhales biogenic CO₂, this forms part of the short-term biological carbon cycle and is treated as carbon-neutral under IPCC transport inventory guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Data Integrity Policy on Public Transit */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-accent-dark/30 pb-2">
          <AlertCircle className="w-4 h-4 text-forest" />
          <h2 className="text-base font-bold text-slate-dark uppercase tracking-wider">
            3. Strict Policy Regarding Public Transit Simulation
          </h2>
        </div>

        <div className="bg-[#FAF9F5] p-5 rounded-lg border border-[#E3DEC3] text-xs text-mineral-dark space-y-3">
          <p className="leading-relaxed">
            The open-access OSRM public engine provides road-network graphs for cars, two-wheelers, cycling, and walking, but does not integrate real-time General Transit Feed Specification (GTFS) bus/metro schedules.
          </p>
          <div className="p-3 bg-white rounded border border-[#E8E2D0] font-medium text-slate-dark">
            &ldquo;If the provider does not support public transit, do not fake transit results. Clearly mark unsupported transport modes. Never use fake distances, fake routes, fake travel times, or fake public transport fares.&rdquo;
          </div>
          <p className="leading-relaxed">
            Many applications invent synthetic bus routes or display hard-coded transit lines. GreenRoute adheres strictly to reality: unsupported transit modes are explicitly disclosed with technical rationales rather than fabricating fake transit metrics.
          </p>
          <div className="p-3 bg-white rounded border border-[#E8E2D0] text-[11px] leading-relaxed">
            <strong className="text-slate-dark">Corridor estimate, not a transit route:</strong>{' '}
            GreenRoute does display a carbon-only bus/metro estimate. It multiplies the real car
            corridor distance by the authoritative passenger-km factors (bus 0.0965 kg CO₂e,
            metro 0.0286 kg CO₂e per passenger-km). Travel time, stop sequence, geometry, and fare
            remain explicitly unavailable; they are never invented.
          </div>
        </div>
      </section>

      {/* Section 4: Authoritative Factors Database Table */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-accent-dark/30 pb-2 gap-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-forest" />
            <h2 className="text-base font-bold text-slate-dark uppercase tracking-wider">
              4. Authoritative Greenhouse Gas Factors Registry
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-mineral absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search factors, sources..."
              value={factorSearch}
              onChange={(e) => setFactorSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-accent-dark/50 rounded text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-accent-dark/50 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-canvas border-b border-accent-dark/40 text-mineral font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Factor Name</th>
                  <th className="py-2.5 px-3">Numeric Value</th>
                  <th className="py-2.5 px-3">Accounting Scope</th>
                  <th className="py-2.5 px-4">Primary Scientific Source</th>
                  <th className="py-2.5 px-3">Audit Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-dark/20 text-slate-dark">
                {factors.map((f) => (
                  <tr key={f.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 font-semibold">
                      <div>{f.name}</div>
                      <p className="text-[11px] text-mineral font-normal mt-0.5">{f.description}</p>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-forest">
                      {f.value.toFixed(4)} <span className="text-[10px] text-mineral block font-sans font-normal">{f.unit}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-canvas border border-accent-dark/40 text-mineral-dark font-medium">
                        {f.scope}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-mineral">
                      <span className="font-medium text-slate-dark block">{f.source}</span>
                      <span className="text-[10px] text-mineral-light">Published: {f.versionDate}</span>
                    </td>

                    <td className="py-3 px-3">
                      {f.sourceUrl ? (
                        <a
                          href={f.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forest hover:text-forest-dark inline-flex items-center space-x-1 font-medium underline"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-mineral-light text-[11px]">Internal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Regional Electricity Grid Database */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-accent-dark/30 pb-2">
          <Sliders className="w-4 h-4 text-forest" />
          <h2 className="text-base font-bold text-slate-dark uppercase tracking-wider">
            5. Regional Electricity Grid Carbon Intensity Database
          </h2>
        </div>

        <div className="bg-white rounded-lg border border-accent-dark/50 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-canvas border-b border-accent-dark/40 text-mineral font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Grid Jurisdiction</th>
                  <th className="py-2.5 px-3">Carbon Intensity</th>
                  <th className="py-2.5 px-4">Authoritative Publication</th>
                  <th className="py-2.5 px-3">Year / Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-dark/20 text-slate-dark">
                {REGIONAL_GRID_INTENSITIES.map((g) => (
                  <tr key={g.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 font-semibold">
                      <div>{g.regionName}</div>
                      <p className="text-[11px] text-mineral font-normal mt-0.5">{g.description}</p>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-forest">
                      {g.factorKgPerKwh.toFixed(3)} <span className="text-[10px] text-mineral block font-sans font-normal">kg CO₂e / kWh</span>
                    </td>

                    <td className="py-3 px-4 text-mineral">
                      <span className="font-medium text-slate-dark block">{g.source}</span>
                      <a
                        href={g.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest hover:underline inline-flex items-center space-x-1 text-[11px] mt-0.5"
                      >
                        <span>Agency Portal</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>

                    <td className="py-3 px-3 text-mineral font-medium">
                      {g.year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 6: Forestry Sequestration Benchmark */}
      <section className="bg-white p-5 rounded-lg border border-accent-dark/50 shadow-subtle space-y-3 text-xs text-mineral">
        <h3 className="font-semibold text-slate-dark text-sm">
          6. Forestry Carbon Sequestration Model
        </h3>
        <p className="leading-relaxed">
          GreenRoute converts net abated carbon into arboricultural units based on empirical forestry research from the European Environment Agency (EEA) and the US Forest Service / Arbor Day Foundation guidelines.
        </p>
        <div className="p-3 bg-canvas rounded font-mono text-[11px] text-slate-dark border border-accent-dark/40">
          Equivalent Mature Tree-Years = Net CO₂ Saved (kg) ÷ 21.77 kg CO₂/tree/year
        </div>
        <p className="leading-relaxed">
          A mature broadleaf/conifer tree growing in a temperate/subtropical urban environment sequesters approximately {TREE_ANNUAL_CO2_SEQUESTRATION_KG} kg of atmospheric CO₂ per annum (~{(TREE_ANNUAL_CO2_SEQUESTRATION_KG / 365).toFixed(4)} kg/day). This constant is disclosed on every savings card.
        </p>
      </section>

      {/* Section 7: Recommendation and Savings Model */}
      <section className="bg-white p-5 rounded-lg border border-accent-dark/50 shadow-subtle space-y-3 text-xs text-mineral">
        <h3 className="font-semibold text-slate-dark text-sm flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-forest" />
          <span>7. Recommendation, Vehicle Basis & Savings Model</span>
        </h3>
        <p className="leading-relaxed">
          Every available mode is scored across four transparent criteria. The recommendation is
          the highest weighted total, not a hard-coded “greenest” label:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Environmental', '40%'],
            ['Practicality', '35%'],
            ['Travel time', '15%'],
            ['Operating cost', '10%'],
          ].map(([label, weight]) => (
            <div key={label} className="p-2.5 bg-canvas rounded border border-accent-dark/40">
              <span className="text-[10px] text-mineral block">{label}</span>
              <span className="font-bold text-forest text-sm">{weight}</span>
            </div>
          ))}
        </div>
        <p className="leading-relaxed">
          Environmental scores are normalised against the modes actually available for the
          corridor: the lowest emitter receives 100 and the highest receives 0. Practicality
          applies explicit distance thresholds, so walking is never recommended for a 35 km trip.
        </p>
        <p className="leading-relaxed">
          <strong className="text-slate-dark">Vehicle basis:</strong> the car row uses your saved
          car profile, and the motorcycle row uses your saved two-wheeler profile. If you save only
          one vehicle type, the other row falls back to a standard regulatory baseline instead of
          borrowing the wrong efficiency value.
        </p>
        <div className="p-3 bg-canvas rounded font-mono text-[11px] text-slate-dark border border-accent-dark/40">
          CO₂ saved per trip = baseline car CO₂ − chosen mode CO₂ (clamped at zero)<br />
          Annual CO₂ = per-trip saving × trips/week × weeks/year<br />
          Trees (tree-years) = annual CO₂ saved ÷ {TREE_ANNUAL_CO2_SEQUESTRATION_KG} kg/tree/year
        </div>
      </section>
    </div>
  );
};
