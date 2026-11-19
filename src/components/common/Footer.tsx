import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const Footer: React.FC<{ onOpenMethodology: () => void }> = ({ onOpenMethodology }) => {
  return (
    <footer className="bg-white border-t border-accent-dark/40 mt-16 py-10 text-xs text-mineral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-forest font-semibold text-sm mb-2">
              <span>GREENROUTE</span>
              <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-forest">EVS INNOVATION</span>
            </div>
            <p className="text-mineral leading-relaxed mb-3">
              An applied environmental engineering and route optimization platform developed for College Environmental Studies under the Sustainable Development & Climate Action curriculum.
            </p>
            <div className="flex items-center space-x-1 text-forest font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real Data First Protocol: Zero synthetic or fabricated values.</span>
            </div>
          </div>

          <div>
            <h4 className="text-slate-dark font-medium text-xs uppercase tracking-wider mb-3">
              Data & Methodological Standards
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-forest inline-flex items-center space-x-1"
                >
                  <span>UK DESNZ / DEFRA GHG Conversion Factors 2024</span>
                  <ExternalLink className="w-3 h-3 text-mineral-light" />
                </a>
              </li>
              <li>
                <a
                  href="https://cea.nic.in/cdm-co2-baseline-database/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-forest inline-flex items-center space-x-1"
                >
                  <span>Central Electricity Authority (CEA) CO₂ Baseline v19</span>
                  <ExternalLink className="w-3 h-3 text-mineral-light" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.epa.gov/egrid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-forest inline-flex items-center space-x-1"
                >
                  <span>US EPA eGRID 2024 Grid Intensity Models</span>
                  <ExternalLink className="w-3 h-3 text-mineral-light" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-forest inline-flex items-center space-x-1"
                >
                  <span>OpenStreetMap Nominatim & FOSSGIS OSRM Profiles</span>
                  <ExternalLink className="w-3 h-3 text-mineral-light" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-dark font-medium text-xs uppercase tracking-wider mb-3">
              Academic & Audit Transparency
            </h4>
            <p className="leading-relaxed mb-3">
              Every formula, passenger-kilometer factor, fuel stoichiometry equation, and grid coefficient is fully inspectable.
            </p>
            <button
              onClick={onOpenMethodology}
              className="inline-flex items-center text-forest font-medium underline hover:text-forest-dark cursor-pointer"
            >
              Review Full Methodology & Scientific Citations &rarr;
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-accent-dark/30 flex flex-col sm:flex-row items-center justify-between text-mineral-light text-[11px]">
          <p>© {new Date().getFullYear()} GreenRoute Research Project. Built with React, TypeScript, Leaflet, and OpenStreetMap.</p>
          <p className="mt-2 sm:mt-0">Sustainable Development & Environmental Innovation</p>
        </div>
      </div>
    </footer>
  );
};
