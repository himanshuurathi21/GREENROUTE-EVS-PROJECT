import React, { useCallback, useEffect, useState } from 'react';
import { Navbar, PageTab } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { EnvironmentalImpactPage } from './pages/EnvironmentalImpactPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SettingsPage } from './pages/SettingsPage';
import { MultiModalRoutes, TravelMode } from './types/routing';
import { VehicleConfig } from './types/vehicle';
import { RegionalPricingConfig } from './types/cost';
import { RegionalGridIntensity } from './types/emissions';
import { historyService } from './services/history/historyService';
import {
  loadGridIntensity,
  loadPricingConfig,
  loadVehicleConfig,
  saveGridIntensity,
  savePricingConfig,
  saveVehicleConfig,
} from './services/storage/preferences';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('home');
  const [multiModalData, setMultiModalData] = useState<MultiModalRoutes | null>(null);
  const [selectedMode, setSelectedMode] = useState<TravelMode>('car');
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(loadVehicleConfig);
  const [pricingConfig, setPricingConfig] = useState<RegionalPricingConfig>(loadPricingConfig);
  const [gridIntensity, setGridIntensity] = useState<RegionalGridIntensity>(loadGridIntensity);
  const [historyCount, setHistoryCount] = useState<number>(() => historyService.getTrips().length);

  const refreshHistoryCount = useCallback(() => {
    setHistoryCount(historyService.getTrips().length);
  }, []);

  // Persist planner preferences so a reload does not silently reset tariffs,
  // electricity grid mix, or the user's own vehicle efficiency.
  useEffect(() => {
    saveVehicleConfig(vehicleConfig);
  }, [vehicleConfig]);

  useEffect(() => {
    savePricingConfig(pricingConfig);
  }, [pricingConfig]);

  useEffect(() => {
    saveGridIntensity(gridIntensity);
  }, [gridIntensity]);

  // Reset the viewport when navigating between tabs. Without this, switching
  // pages keeps the previous scroll offset and the new page title can hide
  // behind the sticky navbar.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-dark selection:bg-accent selection:text-forest-dark">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasCalculatedRoute={multiModalData !== null}
        historyCount={historyCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && (
          <HomePage
            onTripSaved={refreshHistoryCount}
            onNavigateToResults={() => setActiveTab('results')}
            onNavigateToMethodology={() => setActiveTab('methodology')}
            multiModalData={multiModalData}
            setMultiModalData={setMultiModalData}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            vehicleConfig={vehicleConfig}
            setVehicleConfig={setVehicleConfig}
            pricingConfig={pricingConfig}
            setPricingConfig={setPricingConfig}
            gridIntensity={gridIntensity}
            setGridIntensity={setGridIntensity}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPage
            multiModalData={multiModalData}
            selectedMode={selectedMode}
            onSelectMode={setSelectedMode}
            vehicleConfig={vehicleConfig}
            pricingConfig={pricingConfig}
            gridIntensity={gridIntensity}
            onBackToPlanner={() => setActiveTab('home')}
            onOpenMethodology={() => setActiveTab('methodology')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onPlanNewRoute={() => setActiveTab('home')}
            onRefreshStats={refreshHistoryCount}
          />
        )}

        {activeTab === 'impact' && (
          <EnvironmentalImpactPage
            onPlanNewRoute={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'methodology' && <MethodologyPage />}

        {activeTab === 'settings' && (
          <SettingsPage
            pricingConfig={pricingConfig}
            onPricingChange={setPricingConfig}
            gridIntensity={gridIntensity}
            onGridChange={setGridIntensity}
            onHistoryCleared={refreshHistoryCount}
          />
        )}
      </main>

      <Footer onOpenMethodology={() => setActiveTab('methodology')} />
    </div>
  );
};

export default App;
