import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteResult, TravelMode } from '../../types/routing';
import { formatDistance, formatDuration } from '../../utils/formatters';
import { escapeHtml } from '../../utils/sanitize';

// Fix for default Leaflet icon paths in bundlers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RouteMapProps {
  activeRoute: RouteResult | null;
  allRoutes?: Partial<Record<TravelMode, RouteResult>>;
  originName: string;
  destinationName: string;
  selectedMode: TravelMode;
  onSelectMode?: (mode: TravelMode) => void;
  className?: string;
}

const MODE_CHIP_LABELS: Record<TravelMode, string> = {
  car: 'Car',
  motorcycle: 'Bike',
  bus: 'Bus',
  metro_train: 'Metro',
  cycling: 'Cycle',
  walking: 'Walk',
};

export const RouteMap: React.FC<RouteMapProps> = ({
  activeRoute,
  allRoutes,
  originName,
  destinationName,
  selectedMode,
  onSelectMode,
  className = 'h-[440px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center (India/Global fallback)
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090], // New Delhi default center
      zoom: 11,
      zoomControl: false,
    });

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Standard OpenStreetMap tiles: no API key or commercial token required.
    // CARTO's hosted basemaps now watermark keyless requests, so using OSM
    // directly keeps the map usable without hidden credentials.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update Geometry & Markers whenever activeRoute changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (!activeRoute || activeRoute.geometry.length === 0) {
      return;
    }

    // OSRM coordinates are [lon, lat], Leaflet requires [lat, lon]
    const latLngs: L.LatLngExpression[] = activeRoute.geometry.map(([lon, lat]) => [lat, lon]);

    if (latLngs.length === 0) return;

    // Custom Start Pin Icon (Forest Green)
    const startIcon = L.divIcon({
      className: 'custom-map-pin start-pin',
      html: `
        <div style="
          background-color: #315C4A;
          color: #FFFFFF;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid #FFFFFF;
        ">A</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Custom Destination Pin Icon (Slate Dark)
    const endIcon = L.divIcon({
      className: 'custom-map-pin end-pin',
      html: `
        <div style="
          background-color: #26332D;
          color: #FFFFFF;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid #FFFFFF;
        ">B</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Draw other non-active available routes in subtle muted lines if available
    if (allRoutes) {
      Object.entries(allRoutes).forEach(([m, r]) => {
        if (m !== selectedMode && r && r.geometry.length > 0) {
          const inactiveLatLngs: L.LatLngExpression[] = r.geometry.map(([lon, lat]) => [lat, lon]);
          const inactivePoly = L.polyline(inactiveLatLngs, {
            color: '#6F8F78',
            weight: 3.5,
            opacity: 0.45,
            dashArray: m === 'walking' ? '4, 6' : undefined,
          });
          inactivePoly.bindTooltip(
            `${escapeHtml(r.modeLabel)}: ${formatDistance(r.distanceMeters)} (${formatDuration(r.durationSeconds)})`
          );
          layerGroup.addLayer(inactivePoly);
        }
      });
    }

    // Active Route Polyline (Bold Forest Green)
    const activePolyline = L.polyline(latLngs, {
      color: '#315C4A',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    });

    activePolyline.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 12px; line-height: 1.4;">
        <strong style="color: #315C4A; font-size: 13px;">${escapeHtml(activeRoute.modeLabel)}</strong><br/>
        <span>Distance: <strong>${formatDistance(activeRoute.distanceMeters)}</strong></span><br/>
        <span>Duration: <strong>${formatDuration(activeRoute.durationSeconds)}</strong></span><br/>
        <span style="color: #69756F; font-size: 11px;">Real geometry from OSRM engine</span>
      </div>
    `);

    layerGroup.addLayer(activePolyline);

    // Markers
    const startPoint = latLngs[0];
    const endPoint = latLngs[latLngs.length - 1];

    const startMarker = L.marker(startPoint, { icon: startIcon });
    startMarker.bindPopup(`<strong>Origin:</strong> ${escapeHtml(originName)}`);
    layerGroup.addLayer(startMarker);

    const endMarker = L.marker(endPoint, { icon: endIcon });
    endMarker.bindPopup(`<strong>Destination:</strong> ${escapeHtml(destinationName)}`);
    layerGroup.addLayer(endMarker);

    // Fit map bounds to show complete route
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [activeRoute, allRoutes, selectedMode, originName, destinationName]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-accent-dark/50 bg-canvas shadow-subtle">
      {/* Mode selection chips overlay */}
      {allRoutes && onSelectMode && Object.keys(allRoutes).length > 0 && (
        <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-sm px-2 py-1.5 rounded-md border border-accent-dark/50 shadow-subtle flex items-center space-x-1">
          {(Object.keys(allRoutes) as TravelMode[]).map((mode) => {
            const r = allRoutes[mode];
            if (!r) return null;
            const isSelected = mode === selectedMode;
            return (
              <button
                key={mode}
                onClick={() => onSelectMode(mode)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  isSelected
                    ? 'bg-forest text-white'
                    : 'text-mineral-dark hover:bg-canvas'
                }`}
              >
                {MODE_CHIP_LABELS[mode]}
              </button>
            );
          })}
        </div>
      )}

      {/* Map canvas container */}
      <div ref={mapContainerRef} className={`w-full ${className}`} />

      {/* Real Data Provenance badge overlay */}
      <div className="absolute bottom-2 left-2 z-20 bg-white/90 px-2 py-0.5 rounded text-[10px] text-mineral border border-accent-dark/40">
        Live OSRM Geometry &bull; OpenStreetMap
      </div>
    </div>
  );
};
