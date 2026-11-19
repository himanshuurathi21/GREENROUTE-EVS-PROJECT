import React, { useState } from 'react';
import { Compass, Menu, X, ShieldCheck, Leaf } from 'lucide-react';

export type PageTab = 'home' | 'results' | 'history' | 'impact' | 'methodology' | 'settings';

interface NavbarProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  hasCalculatedRoute: boolean;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  hasCalculatedRoute,
  historyCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageTab; label: string; disabled?: boolean; badge?: string }[] = [
    { id: 'home', label: 'Plan Route' },
    {
      id: 'results',
      label: 'Route Results',
      disabled: !hasCalculatedRoute,
      badge: hasCalculatedRoute ? 'Active' : undefined,
    },
    {
      id: 'history',
      label: 'Trip History',
      badge: historyCount > 0 ? `${historyCount}` : undefined,
    },
    { id: 'impact', label: 'Environmental Impact' },
    { id: 'methodology', label: 'Methodology & Sources' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleNavClick = (tab: PageTab, disabled?: boolean) => {
    if (disabled) return;
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-accent-dark/40 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academic Project Tag */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
              onSelectTab('home');
              setMobileMenuOpen(false);
            }}
          >
            <div className="w-9 h-9 rounded bg-forest flex items-center justify-center text-white shadow-subtle">
              <Compass className="w-5 h-5 text-accent" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-forest-dark">
                  GREENROUTE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-accent text-forest border border-accent-dark/50">
                  EVS PROJECT
                </span>
              </div>
              <p className="text-[11px] text-mineral leading-none mt-0.5 hidden sm:block">
                Eco-Friendly Route Planner & Carbon Analysis
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.disabled)}
                  disabled={item.disabled}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-3.5 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    item.disabled
                      ? 'text-mineral-light cursor-not-allowed opacity-60'
                      : isActive
                      ? 'text-forest-dark bg-accent/70 font-semibold'
                      : 'text-mineral-dark hover:text-forest hover:bg-canvas'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isActive
                          ? 'bg-forest text-white'
                          : 'bg-accent text-forest border border-accent-dark/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Real Data Integrity Indicator */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-forest bg-accent/40 border border-accent-dark/30 rounded px-2.5 py-1.5">
            <ShieldCheck className="w-4 h-4 text-forest" />
            <span className="font-medium tracking-tight">Real Data First Policy</span>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-mineral-dark hover:text-forest hover:bg-canvas"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-accent-dark/40 bg-white px-4 pt-2 pb-4 space-y-1 shadow-card">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.disabled)}
                disabled={item.disabled}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full text-left px-3 py-2.5 rounded text-sm font-medium flex items-center justify-between ${
                  item.disabled
                    ? 'text-mineral-light cursor-not-allowed opacity-50'
                    : isActive
                    ? 'bg-accent text-forest-dark font-semibold'
                    : 'text-mineral-dark hover:bg-canvas'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-forest text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-3 border-t border-accent-dark/30 flex items-center space-x-2 text-xs text-forest px-3">
            <Leaf className="w-4 h-4 text-forest" />
            <span>Zero Fabricated Data Guarantee</span>
          </div>
        </div>
      )}
    </header>
  );
};
