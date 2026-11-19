import { Coordinates, MultiModalRoutes, LocationResult, RouteResult, TravelMode } from '../../types/routing';
import { OSRMRoutingProvider } from './osrm';
import { IRoutingProvider } from './types';

const MODE_LABELS: Record<TravelMode, string> = {
  car: 'Personal Car',
  motorcycle: 'Motorcycle / Two-Wheeler',
  cycling: 'Bicycle / Active Cycling',
  walking: 'Walking / Pedestrian',
  bus: 'Public Transit Bus',
  metro_train: 'Metro / Suburban Rail',
};

export class RoutingService {
  private provider: IRoutingProvider;

  constructor(provider?: IRoutingProvider) {
    this.provider = provider || new OSRMRoutingProvider();
  }

  setProvider(provider: IRoutingProvider) {
    this.provider = provider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Compute real routes across all travel modes between origin and destination.
   * Only real routes are returned as available. Unsupported modes are explicitly
   * categorized with reasons.
   */
  async calculateAllModes(
    origin: LocationResult,
    destination: LocationResult
  ): Promise<MultiModalRoutes> {
    const allModes: TravelMode[] = ['car', 'motorcycle', 'cycling', 'walking', 'bus', 'metro_train'];
    const results: Partial<Record<TravelMode, RouteResult>> = {};
    const unsupportedModes: MultiModalRoutes['unsupportedModes'] = [];

    const promises = allModes.map(async (mode) => {
      let result: RouteResult;

      try {
        result = await this.provider.calculateRoute(
          origin.coordinates,
          destination.coordinates,
          mode
        );
      } catch (err: unknown) {
        // A single provider failure must not abort the whole comparison. Other
        // modes can still return valid routes and be shown to the user.
        unsupportedModes.push({
          mode,
          modeLabel: MODE_LABELS[mode],
          reason: 'Route could not be retrieved',
          details: `Unexpected routing provider error: ${
            err instanceof Error ? err.message : 'unknown error'
          }`,
        });
        return;
      }

      if (result.status === 'available') {
        results[mode] = result;
      } else if (result.status === 'unsupported_by_provider') {
        unsupportedModes.push({
          mode,
          modeLabel: result.modeLabel,
          reason: 'Transit schedule provider not integrated for this corridor',
          details: result.unavailableReason || 'Requires GTFS real-time schedule feed.',
        });
      } else if (result.status === 'error') {
        // e.g. walking route impossible across oceanic waterways or restricted highways
        unsupportedModes.push({
          mode,
          modeLabel: result.modeLabel,
          reason: 'Route could not be retrieved',
          details: result.unavailableReason || 'The routing engine could not return a traversable path for this mode.',
        });
      }
    });

    await Promise.all(promises);

    // Promises resolve in network-completion order, which would make the mode
    // tabs and chart reorder themselves between runs. Rebuild the record in a
    // stable, canonical order so the UI is deterministic.
    const orderedRoutes: Partial<Record<TravelMode, RouteResult>> = {};
    for (const mode of allModes) {
      const route = results[mode];
      if (route) orderedRoutes[mode] = route;
    }

    unsupportedModes.sort(
      (a, b) => allModes.indexOf(a.mode) - allModes.indexOf(b.mode)
    );

    return {
      origin,
      destination,
      routes: orderedRoutes,
      unsupportedModes,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate a single mode route
   */
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TravelMode
  ): Promise<RouteResult> {
    return this.provider.calculateRoute(origin, destination, mode);
  }
}

export const routingService = new RoutingService();
export { OSRMRoutingProvider } from './osrm';
export type { IRoutingProvider } from './types';
