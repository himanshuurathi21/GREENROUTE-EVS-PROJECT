import { Coordinates, RouteResult, RouteStep, TravelMode } from '../../types/routing';
import { IRoutingProvider } from './types';

interface OSRMRouteResponse {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number; // in meters
    duration: number; // in seconds
    geometry: {
      coordinates: [number, number][]; // [lon, lat]
      type: string;
    };
    legs?: Array<{
      steps?: Array<{
        name?: string;
        distance?: number;
        duration?: number;
        maneuver?: {
          type?: string;
          modifier?: string;
          instruction?: string;
        };
      }>;
    }>;
  }>;
}

/**
 * FOSSGIS hosts separate OSRM graphs for car, bicycle and foot profiles.
 * The public router.project-osrm.org demo server only exposes the car graph,
 * so requesting /bike/ or /foot/ there silently returns car distances and times.
 * Using the FOSSGIS profile-specific hosts preserves genuine multimodal data.
 */
const FOSSGIS_OSRM_BASE_URLS = {
  car: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  bike: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
  foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
} as const;

type RoutingProfile = keyof typeof FOSSGIS_OSRM_BASE_URLS;

export class OSRMRoutingProvider implements IRoutingProvider {
  name = 'OpenStreetMap FOSSGIS OSRM Routing Engine (Car / Bike / Foot graphs)';

  isModeSupported(mode: TravelMode): boolean {
    return ['car', 'motorcycle', 'cycling', 'walking'].includes(mode);
  }

  private getProfile(mode: TravelMode): RoutingProfile | null {
    switch (mode) {
      case 'car':
      case 'motorcycle':
        return 'car';
      case 'cycling':
        return 'bike';
      case 'walking':
        return 'foot';
      case 'bus':
      case 'metro_train':
      default:
        return null;
    }
  }

  private getModeLabel(mode: TravelMode): string {
    switch (mode) {
      case 'car': return 'Personal Car';
      case 'motorcycle': return 'Motorcycle / Two-Wheeler';
      case 'cycling': return 'Bicycle / Active Cycling';
      case 'walking': return 'Walking / Pedestrian';
      case 'bus': return 'Public Transit Bus';
      case 'metro_train': return 'Metro / Suburban Rail';
    }
  }

  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TravelMode
  ): Promise<RouteResult> {
    const profile = this.getProfile(mode);

    // Strict real data enforcement: never simulate unsupported public transit
    if (!profile) {
      return {
        mode,
        modeLabel: this.getModeLabel(mode),
        distanceMeters: 0,
        distanceKm: 0,
        durationSeconds: 0,
        durationMinutes: 0,
        geometry: [],
        status: 'unsupported_by_provider',
        unavailableReason: `Live transit schedule/GTFS routing for ${this.getModeLabel(mode)} is not supported by the connected OSRM road graphs. GreenRoute's Absolute Data Accuracy requirement forbids fabricated transit routes.`,
        provider: this.name,
      };
    }

    const coordinatesStr = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    const url = `${FOSSGIS_OSRM_BASE_URLS[profile]}/${coordinatesStr}?overview=full&geometries=geojson&steps=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Routing server responded with status ${response.status}: ${response.statusText}`);
      }

      const data: OSRMRouteResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        return {
          mode,
          modeLabel: this.getModeLabel(mode),
          distanceMeters: 0,
          distanceKm: 0,
          durationSeconds: 0,
          durationMinutes: 0,
          geometry: [],
          status: 'error',
          unavailableReason: data.message || `No navigable route found for ${mode} between these points. (OSRM status: ${data.code})`,
          provider: this.name,
        };
      }

      const rawRoute = data.routes[0];
      const distanceMeters = rawRoute.distance;
      const distanceKm = Number((distanceMeters / 1000).toFixed(2));
      const durationSeconds = rawRoute.duration;
      const durationMinutes = Math.round(durationSeconds / 60);

      // Parse turn-by-turn navigation steps if available
      const steps: RouteStep[] = [];
      if (rawRoute.legs && rawRoute.legs[0]?.steps) {
        for (const s of rawRoute.legs[0].steps) {
          if (s.distance && s.distance > 0) {
            steps.push({
              instruction: formatManeuver(s.maneuver?.type, s.maneuver?.modifier),
              distanceMeters: Math.round(s.distance),
              durationSeconds: Math.round(s.duration || 0),
              name: s.name || 'Unnamed road',
            });
          }
        }
      }

      return {
        mode,
        modeLabel: this.getModeLabel(mode),
        distanceMeters,
        distanceKm,
        durationSeconds,
        durationMinutes,
        geometry: rawRoute.geometry.coordinates,
        steps: steps.slice(0, 20), // Top 20 notable turn steps
        status: 'available',
        provider: this.name,
      };
    } catch (err: unknown) {
      const isTimeout =
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        (err as { name?: unknown }).name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : 'Unknown routing network error';
      return {
        mode,
        modeLabel: this.getModeLabel(mode),
        distanceMeters: 0,
        distanceKm: 0,
        durationSeconds: 0,
        durationMinutes: 0,
        geometry: [],
        status: 'error',
        unavailableReason: isTimeout
          ? 'The OSRM routing server did not respond within 20 seconds. Please retry in a moment.'
          : `Network error connecting to OSRM: ${errMsg}`,
        provider: this.name,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function formatManeuver(type?: string, modifier?: string): string {
  if (!type) return 'Continue';

  const readableType = type.replace(/_/g, ' ');
  switch (type) {
    case 'depart':
      return 'Start route';
    case 'arrive':
      return 'Arrive at destination';
    case 'turn':
      return modifier ? `Turn ${modifier}` : 'Turn';
    case 'new name':
      return 'Continue onto a new road';
    case 'merge':
      return modifier ? `Merge ${modifier}` : 'Merge';
    case 'on ramp':
      return 'Take the ramp';
    case 'off ramp':
      return 'Take the exit ramp';
    case 'fork':
      return modifier ? `Keep ${modifier} at the fork` : 'Keep at the fork';
    case 'roundabout':
    case 'rotary':
      return 'Enter the roundabout';
    default:
      return modifier ? `${readableType} ${modifier}` : readableType;
  }
}
