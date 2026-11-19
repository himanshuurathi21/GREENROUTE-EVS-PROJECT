import { describe, expect, it } from 'vitest';
import { RoutingService } from '../services/routing';
import { IRoutingProvider } from '../services/routing/types';
import { Coordinates, LocationResult, RouteResult, TravelMode } from '../types/routing';

const origin: LocationResult = {
  displayName: 'Origin',
  shortName: 'Origin',
  coordinates: { lat: 1, lon: 2 },
};

const destination: LocationResult = {
  displayName: 'Destination',
  shortName: 'Destination',
  coordinates: { lat: 3, lon: 4 },
};

const delays: Record<TravelMode, number> = {
  car: 5,
  motorcycle: 10,
  bus: 15,
  metro_train: 20,
  cycling: 25,
  walking: 30,
};

class FakeProvider implements IRoutingProvider {
  name = 'Fake Provider';

  isModeSupported(mode: TravelMode): boolean {
    return mode !== 'bus' && mode !== 'metro_train';
  }

  async calculateRoute(
    _origin: Coordinates,
    _destination: Coordinates,
    mode: TravelMode
  ): Promise<RouteResult> {
    await new Promise((resolve) => setTimeout(resolve, delays[mode]));

    if (mode === 'bus' || mode === 'metro_train') {
      return {
        mode,
        modeLabel: mode,
        distanceMeters: 0,
        distanceKm: 0,
        durationSeconds: 0,
        durationMinutes: 0,
        geometry: [],
        status: 'unsupported_by_provider',
        unavailableReason: 'No GTFS feed connected.',
        provider: this.name,
      };
    }

    return {
      mode,
      modeLabel: mode,
      distanceMeters: 1000,
      distanceKm: 1,
      durationSeconds: 60,
      durationMinutes: 1,
      geometry: [[2, 1], [4, 3]],
      status: 'available',
      provider: this.name,
    };
  }
}

describe('RoutingService.calculateAllModes', () => {
  it('returns available modes in canonical order regardless of response timing', async () => {
    const service = new RoutingService(new FakeProvider());

    const result = await service.calculateAllModes(origin, destination);

    expect(Object.keys(result.routes)).toEqual([
      'car',
      'motorcycle',
      'cycling',
      'walking',
    ]);
  });

  it('records unsupported modes with explanatory details', async () => {
    const service = new RoutingService(new FakeProvider());

    const result = await service.calculateAllModes(origin, destination);

    expect(result.unsupportedModes.map((item) => item.mode)).toEqual([
      'bus',
      'metro_train',
    ]);
    expect(result.unsupportedModes[0].details).toContain('GTFS');
    expect(result.routes.bus).toBeUndefined();
  });

  it('returns a predictable empty route set when every mode fails', async () => {
    const failingProvider: IRoutingProvider = {
      name: 'Failing Provider',
      isModeSupported: () => true,
      calculateRoute: async (_originPoint, _destinationPoint, mode) => ({
        mode,
        modeLabel: mode,
        distanceMeters: 0,
        distanceKm: 0,
        durationSeconds: 0,
        durationMinutes: 0,
        geometry: [],
        status: 'error',
        unavailableReason: 'Network error connecting to OSRM: offline',
        provider: 'Failing Provider',
      }),
    };
    const service = new RoutingService(failingProvider);

    const result = await service.calculateAllModes(origin, destination);

    expect(result.routes).toEqual({});
    expect(result.unsupportedModes).toHaveLength(6);
    expect(result.unsupportedModes[0].reason).toBe('Route could not be retrieved');
  });

  it('sorts failed modes into canonical order regardless of failure timing', async () => {
    const delays: Record<TravelMode, number> = {
      car: 30,
      motorcycle: 25,
      cycling: 20,
      walking: 15,
      bus: 10,
      metro_train: 5,
    };
    const outOfOrderProvider: IRoutingProvider = {
      name: 'Out-of-Order Provider',
      isModeSupported: () => true,
      calculateRoute: async (_originPoint, _destinationPoint, mode) => {
        await new Promise((resolve) => setTimeout(resolve, delays[mode]));
        return {
          mode,
          modeLabel: mode,
          distanceMeters: 0,
          distanceKm: 0,
          durationSeconds: 0,
          durationMinutes: 0,
          geometry: [],
          status: 'error',
          unavailableReason: 'Network error',
          provider: 'Out-of-Order Provider',
        };
      },
    };
    const service = new RoutingService(outOfOrderProvider);

    const result = await service.calculateAllModes(origin, destination);

    expect(result.unsupportedModes.map((item) => item.mode)).toEqual([
      'car',
      'motorcycle',
      'cycling',
      'walking',
      'bus',
      'metro_train',
    ]);
  });

  it('isolates a provider that throws instead of failing every mode', async () => {
    const partiallyThrowingProvider: IRoutingProvider = {
      name: 'Partially Throwing Provider',
      isModeSupported: () => true,
      calculateRoute: async (_originPoint, _destinationPoint, mode) => {
        if (mode === 'walking') {
          throw new Error('provider exploded');
        }

        if (mode === 'bus' || mode === 'metro_train') {
          return {
            mode,
            modeLabel: mode,
            distanceMeters: 0,
            distanceKm: 0,
            durationSeconds: 0,
            durationMinutes: 0,
            geometry: [],
            status: 'unsupported_by_provider',
            unavailableReason: 'No GTFS feed connected.',
            provider: 'Partially Throwing Provider',
          };
        }

        return {
          mode,
          modeLabel: mode,
          distanceMeters: 1000,
          distanceKm: 1,
          durationSeconds: 60,
          durationMinutes: 1,
          geometry: [[2, 1], [4, 3]],
          status: 'available',
          provider: 'Partially Throwing Provider',
        };
      },
    };
    const service = new RoutingService(partiallyThrowingProvider);

    const result = await service.calculateAllModes(origin, destination);

    expect(Object.keys(result.routes)).toEqual(['car', 'motorcycle', 'cycling']);
    expect(result.unsupportedModes).toHaveLength(3);
    expect(result.unsupportedModes[0].mode).toBe('walking');
    expect(result.unsupportedModes[0].details).toContain('provider exploded');
  });

  it('passes the selected provider name through', () => {
    const service = new RoutingService(new FakeProvider());

    expect(service.getProviderName()).toBe('Fake Provider');
  });
});
