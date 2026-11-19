import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Calendar,
  MapPin,
  ShieldCheck,
  Search,
  ArrowRight,
} from 'lucide-react';
import { historyService } from '../services/history/historyService';
import { SavedTrip, HistoryStats } from '../types/history';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatEmissions } from '../utils/formatters';

interface HistoryPageProps {
  onPlanNewRoute: () => void;
  onRefreshStats: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onPlanNewRoute, onRefreshStats }) => {
  // The page mounts fresh whenever the tab is opened, so initialise directly
  // from storage instead of synchronising state inside an effect.
  const [trips, setTrips] = useState<SavedTrip[]>(() => historyService.getTrips());
  const [stats, setStats] = useState<HistoryStats>(() => historyService.getAggregatedStats());
  const [searchFilter, setSearchFilter] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadHistory = () => {
    const list = historyService.getTrips();
    setTrips(list);
    setStats(historyService.getAggregatedStats());
    onRefreshStats();
  };

  const handleDeleteTrip = (id: string) => {
    historyService.deleteTrip(id);
    setDeleteConfirmId(null);
    loadHistory();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to permanently clear all completed trip records? This cannot be undone.')) {
      historyService.clearHistory();
      loadHistory();
    }
  };

  const handleExportCsv = () => {
    const csv = historyService.exportToCsv();
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `greenroute_verified_trips_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const json = historyService.exportToJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `greenroute_verified_trips_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.origin.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.destination.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.selectedModeLabel.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesMode = modeFilter === 'all' || t.selectedMode === modeFilter;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-accent-dark/30 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-forest bg-accent px-2 py-0.5 rounded border border-accent-dark/40 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Seed Data Policy</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-dark">
              Verified Trip Calculation History
            </h1>
            <p className="text-xs text-mineral mt-0.5 max-w-xl leading-relaxed">
              Every entry represents an authentic user route calculation saved directly from live OSRM and authoritative emission queries. No synthetic or demo trips are ever generated.
            </p>
          </div>

          {trips.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-white border border-accent-dark/60 rounded text-xs font-medium text-mineral-dark hover:text-forest hover:bg-canvas transition-colors flex items-center space-x-1.5"
                title="Export for academic audit"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 bg-white border border-accent-dark/60 rounded text-xs font-medium text-mineral-dark hover:text-forest hover:bg-canvas transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded text-xs font-medium transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Statistics (Computed strictly from real history) */}
      {stats && trips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
            <span className="text-mineral font-medium block">Total Saved Trips</span>
            <span className="text-2xl font-bold text-slate-dark mt-1 block">
              {stats.totalTrips}
            </span>
            <span className="text-[10px] text-mineral mt-0.5 block">Authentic calculations</span>
          </div>

          <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
            <span className="text-mineral font-medium block">Total Real Distance</span>
            <span className="text-2xl font-bold text-slate-dark mt-1 block">
              {stats.totalDistanceKm.toFixed(1)} km
            </span>
            <span className="text-[10px] text-mineral mt-0.5 block">Logged travel corridor</span>
          </div>

          <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
            <span className="text-mineral font-medium block">Total CO₂ Emitted</span>
            <span className="text-2xl font-bold text-slate-dark mt-1 block">
              {stats.totalCo2EmittedKg.toFixed(2)} kg
            </span>
            <span className="text-[10px] text-mineral mt-0.5 block">Sum of recorded journeys</span>
          </div>

          <div className="p-4 bg-white rounded-lg border border-accent-dark/50 shadow-subtle">
            <span className="text-mineral font-medium block">Net CO₂ Abated</span>
            <span className="text-2xl font-bold text-forest mt-1 block">
              {stats.totalCo2SavedKg.toFixed(2)} kg
            </span>
            <span className="text-[10px] text-forest font-medium mt-0.5 block">
              ~{stats.treesAbsorptionEquivalent} tree-years absorbed
            </span>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      {trips.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-accent-dark/50 shadow-subtle">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-mineral absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by city, corridor, mode..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-canvas border border-accent-dark/40 rounded focus:outline-none focus:ring-1 focus:ring-forest text-slate-dark"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-mineral font-medium shrink-0">Filter Mode:</span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-canvas border border-accent-dark/40 rounded text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="all">All Travel Modes</option>
              <option value="car">Personal Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="cycling">Cycling</option>
              <option value="walking">Walking</option>
              <option value="bus">Public Bus</option>
              <option value="metro_train">Metro / Train</option>
            </select>
          </div>
        </div>
      )}

      {/* Trip Records List or Authentic Empty State */}
      {trips.length === 0 ? (
        <EmptyState
          title="No Trip Records Logged Yet"
          description="GreenRoute enforces an Absolute Data Accuracy Policy: no fake history, synthetic trips, or sample numbers are populated. Complete a real route calculation on the planner and click 'Save Calculation' to record your journey."
          actionText="Plan Your First Real Route"
          onAction={onPlanNewRoute}
        />
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-accent-dark/40 text-xs text-mineral">
          No saved trips matched your search filter &ldquo;{searchFilter}&rdquo;.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const isDeleting = deleteConfirmId === trip.id;

            return (
              <div
                key={trip.id}
                className="bg-white rounded-lg border border-accent-dark/50 p-4 shadow-subtle hover:border-accent-dark transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-accent-dark/20 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-accent text-forest-dark border border-accent-dark/40">
                      {trip.selectedModeLabel}
                    </span>
                    <span className="text-xs text-mineral flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{trip.formattedDate}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {isDeleting ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="text-red-700 font-medium text-[11px]">Confirm delete?</span>
                        <button
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 bg-canvas border rounded text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(trip.id)}
                        className="text-mineral hover:text-red-600 p-1 rounded transition-colors"
                        title="Delete this record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-dark">
                      <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
                      <span>{trip.origin.shortName}</span>
                      <ArrowRight className="w-3 h-3 text-mineral" />
                      <span>{trip.destination.shortName}</span>
                    </div>
                    <p className="text-[11px] text-mineral">
                      {trip.vehicleConfig
                        ? `${trip.vehicleConfig.categoryLabel} (${trip.vehicleConfig.fuelLabel} @ ${trip.vehicleConfig.efficiencyValue} ${trip.vehicleConfig.efficiencyUnit})`
                        : trip.selectedMode === 'bus' || trip.selectedMode === 'metro_train'
                        ? 'Public transit (corridor estimate)'
                        : 'Human-powered / active travel'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 text-right shrink-0">
                    <div>
                      <span className="text-[10px] text-mineral block">Distance / Time</span>
                      <span className="font-semibold text-slate-dark">
                        {trip.distanceKm.toFixed(1)} km &bull; {trip.durationMinutes} min
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-mineral block">CO₂ Emitted</span>
                      <span className="font-semibold text-slate-dark">
                        {formatEmissions(trip.co2Kg)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-mineral block">CO₂ Saved</span>
                      <span className="font-bold text-forest">
                        +{trip.co2SavedKg.toFixed(2)} kg
                      </span>
                    </div>

                    {trip.cost !== null && (
                      <div>
                        <span className="text-[10px] text-mineral block">Cost</span>
                        <span className="font-medium text-slate-dark">
                          {formatCurrency(trip.cost, trip.currencySymbol)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-accent-dark/20 text-[11px] text-mineral flex items-center justify-between">
                  <span className="truncate max-w-xl">Methodology: {trip.methodologySummary}</span>
                  <span className="text-[10px] font-mono text-mineral-light shrink-0">ID: {trip.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
