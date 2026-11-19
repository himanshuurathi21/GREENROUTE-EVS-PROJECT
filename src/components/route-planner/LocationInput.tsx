import React, { useState, useEffect, useId, useRef } from 'react';
import { MapPin, Loader2, X, AlertCircle } from 'lucide-react';
import { LocationResult } from '../../types/routing';
import { geocodingService } from '../../services/geocoding';

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: LocationResult | null;
  onChange: (location: LocationResult | null) => void;
  iconColor?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  iconColor = 'text-forest',
}) => {
  const [query, setQuery] = useState(value ? value.displayName : '');
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const [previousValue, setPreviousValue] = useState<LocationResult | null>(value);
  const listboxId = useId();

  // Synchronise when the parent replaces/clears the selection (for example, the
  // origin/destination swap). Adjusting state during render avoids a cascading
  // effect render; while the user is typing, the query no longer matches the
  // previous selection, so their draft text is preserved.
  if (value !== previousValue) {
    setPreviousValue(value);
    if (value) {
      setQuery(value.displayName);
    } else {
      const lastDisplayName = previousValue?.displayName;
      setQuery((current) => (current === lastDisplayName ? '' : current));
    }
  }

  // Click outside listener to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cancel a pending debounce/search when the component unmounts.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      requestIdRef.current += 1;
    };
  }, []);

  const cancelPendingSearch = () => {
    requestIdRef.current += 1;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const handleInputChange = (text: string) => {
    cancelPendingSearch();
    const requestId = requestIdRef.current;
    setQuery(text);
    setErrorMessage(null);

    // If user cleared the text, clear selection
    if (!text.trim()) {
      onChange(null);
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Require selection from real geocoder
    if (value && text !== value.displayName) {
      onChange(null);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await geocodingService.search(text);
        if (requestId !== requestIdRef.current) return;
        setSuggestions(results);
        setIsOpen(true);
        if (results.length === 0) {
          setErrorMessage('No real geographic locations matched your search. Please check spelling or include city/country.');
        }
      } catch (err: unknown) {
        if (requestId !== requestIdRef.current) return;
        const msg = err instanceof Error ? err.message : 'Geocoding service unavailable';
        setErrorMessage(msg);
        setSuggestions([]);
        setIsOpen(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 450);
  };

  const handleSelectLocation = (loc: LocationResult) => {
    cancelPendingSearch();
    setIsLoading(false);
    onChange(loc);
    setQuery(loc.displayName);
    setSuggestions([]);
    setIsOpen(false);
    setErrorMessage(null);
  };

  const handleClear = () => {
    cancelPendingSearch();
    setIsLoading(false);
    setQuery('');
    onChange(null);
    setSuggestions([]);
    setErrorMessage(null);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={`${listboxId}-input`}
          className="text-xs font-semibold text-slate-dark tracking-wide uppercase"
        >
          {label}
        </label>
        {value && (
          <span className="text-[11px] text-forest font-medium flex items-center space-x-1">
            <span>Lat: {value.coordinates.lat.toFixed(4)}, Lon: {value.coordinates.lon.toFixed(4)}</span>
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <div className={`absolute left-3 ${iconColor} pointer-events-none`}>
          <MapPin className="w-4 h-4" />
        </div>

        <input
          id={`${listboxId}-input`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={label}
          autoComplete="off"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 || errorMessage) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-9 py-2.5 bg-white border text-sm text-slate-dark placeholder-mineral rounded-md transition-all focus:outline-none focus:ring-1 focus:ring-forest ${
            value
              ? 'border-forest/50 bg-accent/10'
              : errorMessage
              ? 'border-red-300'
              : 'border-accent-dark/60'
          }`}
        />

        <div className="absolute right-3 flex items-center space-x-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-mineral" />}
          {!isLoading && query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-mineral hover:text-slate-dark p-0.5 rounded"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete / Disambiguation Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-accent-dark/60 rounded-md shadow-card max-h-64 overflow-y-auto"
        >
          {errorMessage && (
            <div className="p-3 text-xs text-mineral flex items-start space-x-2 bg-canvas" role="alert">
              <AlertCircle className="w-4 h-4 text-mineral mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-mineral tracking-wider border-b border-accent-dark/30">
                Select Verifiable Location ({suggestions.length} matches)
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.coordinates.lat}-${item.coordinates.lon}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={value?.displayName === item.displayName}
                  onClick={() => handleSelectLocation(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent/40 transition-colors border-b border-accent-dark/20 last:border-0"
                >
                  <p className="font-medium text-slate-dark">{item.shortName}</p>
                  <p className="text-[11px] text-mineral truncate">{item.displayName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
