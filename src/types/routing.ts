export interface Coordinates {
  lat: number;
  lon: number;
}

export interface LocationResult {
  displayName: string;
  shortName: string;
  address?: string;
  coordinates: Coordinates;
  type?: string;
  importance?: number;
  boundingBox?: [number, number, number, number];
}

export type TravelMode = 
  | 'car'
  | 'motorcycle'
  | 'bus'
  | 'metro_train'
  | 'cycling'
  | 'walking';

export type RouteGeometry = [number, number][]; // Array of [lon, lat]

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string;
}

export interface RouteResult {
  mode: TravelMode;
  modeLabel: string;
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  geometry: RouteGeometry;
  steps?: RouteStep[];
  status: 'available' | 'unsupported_by_provider' | 'error';
  unavailableReason?: string;
  provider: string;
}

export interface MultiModalRoutes {
  origin: LocationResult;
  destination: LocationResult;
  routes: Partial<Record<TravelMode, RouteResult>>;
  unsupportedModes: {
    mode: TravelMode;
    modeLabel: string;
    reason: string;
    details: string;
  }[];
  calculatedAt: string;
}
