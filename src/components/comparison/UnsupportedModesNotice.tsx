import React from 'react';
import { Bus, Train, AlertCircle, ArrowRight } from 'lucide-react';
import { MultiModalRoutes } from '../../types/routing';

interface UnsupportedModesNoticeProps {
  unsupportedModes: MultiModalRoutes['unsupportedModes'];
  onOpenMethodology?: () => void;
}

export const UnsupportedModesNotice: React.FC<UnsupportedModesNoticeProps> = ({
  unsupportedModes,
  onOpenMethodology,
}) => {
  if (!unsupportedModes || unsupportedModes.length === 0) return null;

  return (
    <section className="bg-[#FAF9F5] border border-[#E3DEC3] rounded-lg p-5 text-xs text-mineral-dark space-y-3">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded bg-[#F2EBD4] text-[#785E2F] shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-dark text-sm">
            Data Integrity Notice: Modes Outside the Verified Comparison
          </h4>
          <p className="text-mineral leading-relaxed">
            GreenRoute only displays a mode as a verified route when real routing geometry exists.
            Public transit requires a General Transit Feed Specification (GTFS) feed for live stops,
            schedules, and fares; no provider is connected yet, so no synthetic bus or metro line is
            generated.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {unsupportedModes.map((item) => (
          <div
            key={item.mode}
            className="p-3 bg-white rounded border border-[#E8E2D0] flex items-start space-x-3"
          >
            <div className="p-1.5 rounded bg-canvas text-forest shrink-0 mt-0.5">
              {item.mode === 'bus' ? <Bus className="w-4 h-4" /> : <Train className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-dark">{item.modeLabel}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-canvas text-mineral font-semibold border border-accent-dark/50">
                  Verified routing unavailable
                </span>
              </div>
              <p className="text-[11px] text-mineral mt-1 leading-snug">
                {item.details}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[#E8E2D0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-mineral">
        <span>
          A separate corridor-level carbon estimate is shown above for bus and metro, clearly labelled
          as estimated.
        </span>
        {onOpenMethodology && (
          <button
            type="button"
            onClick={onOpenMethodology}
            className="text-forest hover:text-forest-dark font-semibold underline inline-flex items-center space-x-1 shrink-0"
          >
            <span>Read the data policy</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </section>
  );
};
